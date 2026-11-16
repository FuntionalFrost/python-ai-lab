<script lang="ts">
	import {
		Send,
		Bot,
		User,
		SlidersVertical,
		Sparkles,
		ShieldCheck,
		Wrench,
		RefreshCw,
		Clock,
		Copy,
		Check,
		FileText,
		Zap,
		Code2,
		Terminal
	} from '@lucide/svelte';
	import CodeBlock from '#lib/components/CodeBlock.svelte';
	import { useClipboard, PromptBar, AiToolCall, AiThought, type SlashCommand } from 'yaxa-svelte';

	interface RAGSource {
		title: string;
		score: number;
		chunk: string;
	}

	interface ThoughtData {
		title: string;
		steps: string[];
		duration?: number;
		running?: boolean;
	}

	interface Message {
		id: string;
		role: 'user' | 'assistant' | 'tool';
		content: string;
		toolCall?: {
			name: string;
			arguments: string;
			result: string;
		};
		thought?: ThoughtData;
		ragSources?: RAGSource[];
		isStreaming?: boolean;
		telemetry?: {
			ttftMs: number;
			totalTokens: number;
			tokensPerSec: number;
			serverRunner: string;
		};
	}

	interface Preset {
		id: string;
		name: string;
		prompt: string;
		description: string;
		requiresTool?: boolean;
		ragSources?: RAGSource[];
		tokens: string[];
		toolInfo?: {
			name: string;
			args: string;
			result: string;
		};
		pydanticSchema: string;
	}

	const PRESETS: Preset[] = [
		{
			id: 'realtime-sse',
			name: '⚡ Realtime SSE',
			description: 'Real-time token streaming with async event generator and low-latency chunking',
			prompt: 'Explain the difference between WSGI threadpool and ASGI event loop.',
			tokens: [
				'WSGI ',
				'(like ',
				'traditional ',
				'Flask) ',
				'allocates ',
				'a ',
				'dedicated ',
				'operating ',
				'system ',
				'thread ',
				'per ',
				'request. ',
				'When ',
				'streaming ',
				'LLM ',
				'tokens ',
				'over ',
				'30 ',
				'seconds, ',
				'that ',
				'worker ',
				'thread ',
				'is ',
				'blocked ',
				'and ',
				'cannot ',
				'serve ',
				'other ',
				'traffic.\n\n',
				'In ',
				'contrast, ',
				'ASGI ',
				'(like ',
				'Litestar) ',
				'uses ',
				'an ',
				'asynchronous ',
				'event ',
				'loop. ',
				'During ',
				'the ',
				'inter-token ',
				'latency ',
				'(20-50ms), ',
				'the ',
				'coroutine ',
				'yields ',
				'control, ',
				'allowing ',
				'a ',
				'single ',
				'process ',
				'to ',
				'handle ',
				'thousands ',
				'of ',
				'concurrent ',
				'streams.'
			],
			pydanticSchema: `class ChatRequest(BaseModel):\n    prompt: str = Field(min_length=3)\n    temperature: float = Field(default=0.7)`
		},
		{
			id: 'tool-agent',
			name: '🔧 Weather Tool',
			description: 'Dispatches tool call, validates with Pydantic, and returns synthesized answer',
			prompt: 'What is the weather in Vienna in celsius?',
			requiresTool: true,
			toolInfo: {
				name: 'get_current_weather',
				args: '{"location": "Vienna, Austria", "unit": "celsius"}',
				result:
					'{"location": "Vienna, Austria", "temperature": 18.5, "unit": "celsius", "condition": "Sunny"}'
			},
			tokens: [
				'The ',
				'current ',
				'weather ',
				'in ',
				'Vienna, ',
				'Austria ',
				'is ',
				'18.5°C ',
				'and ',
				'Sunny. ',
				'The ',
				'reading ',
				'was ',
				'verified ',
				'via ',
				'the ',
				'get_current_weather ',
				'tool ',
				'with ',
				'Pydantic ',
				'schema ',
				'enforcement.'
			],
			pydanticSchema: `class WeatherQuery(BaseModel):\n    location: str = Field(description="City and country")\n    unit: str = Field(pattern="^(celsius|fahrenheit)$")`
		},
		{
			id: 'structured-json',
			name: '📋 Pydantic JSON',
			description: 'Guaranteed JSON schema output extracted into Pydantic models',
			prompt: 'Extract key financial metrics from: Revenue was $42M with 28% margin.',
			tokens: [
				'{\n',
				'  "company": "Enterprise Tech",\n',
				'  "revenue_usd": 42000000,\n',
				'  "profit_margin_pct": 28.0,\n',
				'  "status": "profitable"\n',
				'}'
			],
			pydanticSchema: `class FinancialReport(BaseModel):\n    company: str\n    revenue_usd: int\n    profit_margin_pct: float\n    status: Literal["profitable", "loss"]`
		},
		{
			id: 'rag-retrieval',
			name: '📚 RAG Context',
			description: 'Hybrid vector search retrieval with grounded document context & citations',
			prompt: 'What are the concurrency guarantees of SQLite WAL mode in Litestar?',
			ragSources: [
				{
					title: 'docs/sqlite_wal_architecture.md',
					score: 0.94,
					chunk:
						'WAL mode allows concurrent readers to access database pages while a single write transaction proceeds without reader lock contention.'
				},
				{
					title: 'app/database/session.py',
					score: 0.88,
					chunk:
						'Litestar SQLAlchemy async engine initializes a NullPool or StaticPool with PRAGMA journal_mode=WAL and busy_timeout=5000ms.'
				}
			],
			tokens: [
				'Based ',
				'on ',
				'the ',
				'retrieved ',
				'architecture ',
				'documentation, ',
				'SQLite ',
				'WAL ',
				'(Write-Ahead ',
				'Logging) ',
				'mode ',
				'enables ',
				'concurrent ',
				'read ',
				'queries ',
				'without ',
				'blocking ',
				'the ',
				'writer. ',
				'In ',
				'Litestar, ',
				'combining ',
				'WAL ',
				'with ',
				'an ',
				'async ',
				'connection ',
				'pool ',
				'ensures ',
				'non-blocking ',
				'ASGI ',
				'concurrency.'
			],
			pydanticSchema: `class DocumentSource(BaseModel):\n    title: str = Field(description="Document filename")\n    score: float = Field(ge=0.0, le=1.0)\n    chunk: str\n\nclass RAGResponse(BaseModel):\n    answer: str\n    sources: list[DocumentSource] = Field(min_length=1)`
		}
	];

	type FrameworkId = 'flask' | 'quart' | 'litestar';

	interface Props {
		initialFramework?: FrameworkId;
		initialPresetId?: string;
		class?: string;
	}

	let {
		initialFramework = 'quart',
		initialPresetId = 'realtime-sse',
		class: className = ''
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let selectedFramework = $state<FrameworkId>(initialFramework);

	const initialPreset = PRESETS.find((p) => p.id === initialPresetId) || PRESETS[0];
	let selectedPreset = $state<Preset>(initialPreset);
	let promptInput = $state(initialPreset.prompt);
	let messages = $state<Message[]>([]);
	let isGenerating = $state(false);

	const sseClipboard = useClipboard({ timeout: 2000 });

	// Latency Simulator Controls
	let ttftMs = $state(180); // Time to first token
	let itlMs = $state(28); // Inter-token latency
	let activeTab = $state<'stream' | 'payload' | 'pydantic' | 'backend' | 'client'>('backend');
	let rawChunks = $state<string[]>([]);
	let stats = $state<{ ttft: number; totalTime: number; tokenCount: number }>({
		ttft: 0,
		totalTime: 0,
		tokenCount: 0
	});

	const backendSnippets: Record<FrameworkId, string> = {
		quart: `# Quart (Pallets Native ASGI + Hypercorn)
from quart import Quart, Response, request
import httpx2
from openai import AsyncOpenAI
import asyncio
import json

app = Quart(__name__)

@app.post("/api/v1/chat/stream")
async def chat_stream():
    async def generate():
        # 🚀 Native ASGI coroutine: non-blocking, scales to 10k+ concurrent streams
        tokens = ["Quart ", "ASGI ", "event ", "loop ", "streaming..."]
        for token in tokens:
            payload = json.dumps({"choices": [{"delta": {"content": token}}]})
            yield f"data: {payload}\\n\\n"
            await asyncio.sleep(0.02)
        yield "data: [DONE]\\n\\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )`,
		litestar: `# Litestar (Clean Architecture ASGI + Granian)
from litestar import Controller, post
from litestar.response import ServerSentEvent
from collections.abc import AsyncGenerator
import json

class ChatController(Controller):
    path = "/api/v1/chat"

    @post("/stream")
    async def stream_chat(self, data: ChatRequest) -> ServerSentEvent:
        async def token_generator() -> AsyncGenerator[str, None]:
            tokens = ["Litestar ", "Granian ", "ASGI ", "streaming..."]
            for token in tokens:
                payload = json.dumps({"choices": [{"delta": {"content": token}}]})
                yield payload
            yield "[DONE]"

        return ServerSentEvent(token_generator())`,
		flask: `# Legacy Flask 3.x (WSGI + Threadpool)
from flask import Flask, Response, stream_with_context
import json
import time

app = Flask(__name__)

@app.post("/api/v1/chat/stream")
def chat_stream():
    def generate():
        # ⚠️ Blocks 1 OS thread per streaming connection!
        tokens = ["WSGI ", "threadpool ", "streaming..."]
        for token in tokens:
            payload = json.dumps({"choices": [{"delta": {"content": token}}]})
            yield f"data: {payload}\\n\\n"
            time.sleep(0.02)
        yield "data: [DONE]\\n\\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )`
	};

	const SLASH_COMMANDS: SlashCommand[] = [
		{ name: '/sse', description: 'Real-time SSE token streaming' },
		{ name: '/tool', description: 'Weather tool dispatch with Pydantic validation' },
		{ name: '/rag', description: 'Hybrid vector search RAG retrieval' },
		{ name: '/json', description: 'Pydantic structured JSON extraction' },
		{ name: '/quart', description: 'Switch to Quart ASGI (Hypercorn)' },
		{ name: '/litestar', description: 'Switch to Litestar ASGI (Granian)' },
		{ name: '/flask', description: 'Switch to Legacy WSGI baseline (Flask 3.x)' },
		{ name: '/reset', description: 'Clear messages and reset conversation' }
	];

	function applyPreset(preset: Preset) {
		selectedPreset = preset;
		promptInput = preset.prompt;
		messages = [];
		rawChunks = [];
	}

	function stopGeneration() {
		isGenerating = false;
	}

	function handlePromptSubmit(text: string) {
		const trimmed = text.trim();
		if (!trimmed) return;

		if (trimmed.startsWith('/quart')) {
			selectedFramework = 'quart';
			return;
		}
		if (trimmed.startsWith('/litestar')) {
			selectedFramework = 'litestar';
			return;
		}
		if (trimmed.startsWith('/flask')) {
			selectedFramework = 'flask';
			return;
		}
		if (trimmed.startsWith('/sse')) {
			applyPreset(PRESETS[0]);
			return;
		}
		if (trimmed.startsWith('/tool')) {
			applyPreset(PRESETS[1]);
			return;
		}
		if (trimmed.startsWith('/json')) {
			applyPreset(PRESETS[2]);
			return;
		}
		if (trimmed.startsWith('/rag')) {
			applyPreset(PRESETS[3]);
			return;
		}
		if (trimmed.startsWith('/reset')) {
			resetChat();
			return;
		}

		promptInput = trimmed;
		runChatStream();
	}

	async function runChatStream() {
		if (isGenerating || !promptInput.trim()) return;

		const userMsg: Message = {
			id: 'msg-' + Date.now(),
			role: 'user',
			content: promptInput
		};

		messages = [...messages, userMsg];
		promptInput = '';
		isGenerating = true;
		activeTab = 'stream';
		rawChunks = [];

		const startTime = performance.now();

		// Assistant message placeholder with initial thinking phase
		const assistantMsgId = 'asst-' + Date.now();
		const assistantMsg: Message = {
			id: assistantMsgId,
			role: 'assistant',
			content: '',
			ragSources: selectedPreset.ragSources,
			thought: {
				title: `Pydantic v2 Validation (${selectedFramework.toUpperCase()})`,
				steps: [
					`Validating prompt payload against ${selectedPreset.id === 'tool-agent' ? 'WeatherQuery' : selectedPreset.id === 'structured-json' ? 'FinancialReport' : 'ChatRequest'} schema`,
					`Connecting to ${selectedFramework === 'quart' ? 'Hypercorn ASGI event loop' : selectedFramework === 'litestar' ? 'Granian Rust ASGI worker' : 'Waitress WSGI threadpool'}`,
					'Measuring Time-to-First-Token (TTFT)'
				],
				running: true
			},
			isStreaming: true
		};
		messages = [...messages, assistantMsg];

		// Simulate TTFT
		await new Promise((r) => setTimeout(r, ttftMs));
		if (!isGenerating) return;

		const ttftMeasured = Math.round(performance.now() - startTime);

		// Conclude thinking phase
		messages = messages.map((m) =>
			m.id === assistantMsgId && m.thought
				? {
						...m,
						thought: {
							...m.thought,
							running: false,
							duration: Number((ttftMeasured / 1000).toFixed(2))
						}
					}
				: m
		);

		// Handle Tool Call Simulation if preset requires it
		if (selectedPreset.requiresTool && selectedPreset.toolInfo) {
			const toolMsg: Message = {
				id: 'tool-' + Date.now(),
				role: 'tool',
				content: selectedPreset.toolInfo.result,
				toolCall: {
					name: selectedPreset.toolInfo.name,
					arguments: selectedPreset.toolInfo.args,
					result: selectedPreset.toolInfo.result
				}
			};
			messages = [...messages.filter((m) => m.id !== assistantMsgId), toolMsg, assistantMsg];
			rawChunks = [
				...rawChunks,
				`event: tool_call\ndata: ${JSON.stringify({ name: selectedPreset.toolInfo.name, arguments: selectedPreset.toolInfo.args })}\n\n`,
				`event: pydantic_validate\ndata: {"status": "valid", "schema": "WeatherQuery"}\n\n`,
				`event: tool_result\ndata: ${selectedPreset.toolInfo.result}\n\n`
			];
			// Brief execution pause
			await new Promise((r) => setTimeout(r, 200));
			if (!isGenerating) return;
		}

		// Handle RAG Context Ingestion if present
		if (selectedPreset.ragSources && selectedPreset.ragSources.length > 0) {
			rawChunks = [
				...rawChunks,
				`event: rag_retrieval\ndata: ${JSON.stringify(selectedPreset.ragSources.map((s) => ({ title: s.title, score: s.score })))}\n\n`
			];
		}

		let assembledContent = '';
		for (let i = 0; i < selectedPreset.tokens.length; i++) {
			if (!isGenerating) break;
			const token = selectedPreset.tokens[i];
			assembledContent += token;

			// Update messages
			messages = messages.map((m) =>
				m.id === assistantMsgId ? { ...m, content: assembledContent } : m
			);

			// Append raw SSE chunk
			rawChunks = [
				...rawChunks,
				`data: {"choices": [{"delta": {"content": ${JSON.stringify(token)}}}]}\n\n`
			];

			await new Promise((r) => setTimeout(r, itlMs));
		}

		if (isGenerating) {
			rawChunks = [...rawChunks, `data: [DONE]\n\n`];
		} else {
			rawChunks = [...rawChunks, `data: [STREAM CANCELLED BY USER]\n\n`];
		}

		const totalTime = Math.round(performance.now() - startTime);
		stats = {
			ttft: ttftMeasured,
			totalTime,
			tokenCount: selectedPreset.tokens.length
		};

		const genTimeSec = (totalTime - ttftMeasured) / 1000 || 0.001;
		const tokensPerSec = Math.round(selectedPreset.tokens.length / genTimeSec);
		const serverRunner =
			selectedFramework === 'flask'
				? 'gunicorn/sync'
				: selectedFramework === 'quart'
					? 'hypercorn/asgi'
					: 'granian/rust';

		messages = messages.map((m) =>
			m.id === assistantMsgId
				? {
						...m,
						isStreaming: false,
						telemetry: {
							ttftMs: ttftMeasured,
							totalTokens: selectedPreset.tokens.length,
							tokensPerSec,
							serverRunner
						}
					}
				: m
		);
		isGenerating = false;
	}

	function resetChat() {
		messages = [];
		rawChunks = [];
		promptInput = selectedPreset.prompt;
		isGenerating = false;
	}
</script>

<div class="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl {className}">
	<!-- Top Bar -->
	<div class="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div>
				<div class="flex items-center gap-2">
					<Sparkles class="h-5 w-5 text-cyan-400" />
					<h3 class="text-base font-semibold text-zinc-100">Streaming Chat & SSE Visualizer</h3>
				</div>
				<p class="mt-1 max-w-xl text-xs text-zinc-400">
					Simulate real-time token streaming with configurable latency, inspect raw SSE frames, and
					observe Pydantic validation.
				</p>
			</div>

			<!-- Backend Runtime Selector -->
			<div class="flex items-center gap-2">
				<span class="shrink-0 font-mono text-xs text-zinc-400">Backend:</span>
				<div class="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/70 p-1">
					<button
						type="button"
						onclick={() => (selectedFramework = 'quart')}
						class="rounded-lg px-2.5 py-1 text-xs font-medium transition-all select-none {selectedFramework ===
						'quart'
							? 'bg-cyan-600 text-white shadow-sm'
							: 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}"
					>
						Quart (ASGI)
					</button>
					<button
						type="button"
						onclick={() => (selectedFramework = 'litestar')}
						class="rounded-lg px-2.5 py-1 text-xs font-medium transition-all select-none {selectedFramework ===
						'litestar'
							? 'bg-emerald-600 text-white shadow-sm'
							: 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}"
					>
						Litestar (ASGI)
					</button>
					<button
						type="button"
						onclick={() => (selectedFramework = 'flask')}
						class="rounded-lg px-2.5 py-1 text-xs font-medium transition-all select-none {selectedFramework ===
						'flask'
							? 'bg-amber-600/80 text-white shadow-sm'
							: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}"
					>
						Legacy WSGI
					</button>
				</div>
			</div>
		</div>

		<!-- Toolbar Row: Scenario Presets + Latency Simulator -->
		<div
			class="mt-4 flex flex-col gap-4 border-t border-zinc-800/80 pt-3 text-xs xl:flex-row xl:items-center xl:justify-between"
		>
			<!-- Preset Selector Group -->
			<div class="flex flex-wrap items-center gap-2">
				<span class="shrink-0 font-mono text-xs text-zinc-400">Scenario:</span>
				<div
					class="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/70 p-1"
				>
					{#each PRESETS as preset (preset.id)}
						<button
							type="button"
							onclick={() => applyPreset(preset)}
							class="rounded-lg px-2.5 py-1 text-xs font-medium transition-all select-none {selectedPreset.id ===
							preset.id
								? 'bg-cyan-600 text-white shadow-sm'
								: 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}"
						>
							{preset.name}
						</button>
					{/each}
				</div>
			</div>

			<!-- Latency Simulator Controls -->
			<div class="flex flex-wrap items-center gap-5">
				<div class="flex items-center gap-2.5">
					<Clock class="h-3.5 w-3.5 text-cyan-400" />
					<span class="font-medium text-zinc-300">TTFT:</span>
					<input
						type="range"
						min="50"
						max="600"
						step="10"
						bind:value={ttftMs}
						class="w-24 accent-cyan-400"
					/>
					<span class="font-mono text-cyan-300">{ttftMs}ms</span>
				</div>

				<div class="flex items-center gap-2.5">
					<SlidersVertical class="h-3.5 w-3.5 text-emerald-400" />
					<span class="font-medium text-zinc-300">ITL:</span>
					<input
						type="range"
						min="10"
						max="80"
						step="5"
						bind:value={itlMs}
						class="w-24 accent-emerald-400"
					/>
					<span class="font-mono text-emerald-300">{itlMs}ms/tok</span>
				</div>

				{#if stats.tokenCount > 0}
					<div
						class="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-mono text-[11px] text-zinc-400"
					>
						<span>TTFT: <strong class="text-cyan-400">{stats.ttft}ms</strong></span>
						<span
							>Speed: <strong class="text-emerald-400"
								>{Math.round(stats.tokenCount / (stats.totalTime / 1000) || 0)} tok/s</strong
							></span
						>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Main Body: Two Columns (Chat View | Inspector Drawer) -->
	<div
		class="grid min-h-115 grid-cols-1 divide-y divide-zinc-800 lg:grid-cols-12 lg:divide-x lg:divide-y-0"
	>
		<!-- Left: Chat UI (7 cols) -->
		<div class="flex flex-col bg-zinc-950 p-4 lg:col-span-7">
			<!-- Message Scroll Window -->
			<div class="max-h-105 min-h-80 flex-1 space-y-4 overflow-y-auto pr-1">
				{#if messages.length === 0}
					<div class="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
						<div
							class="max-w-md rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 shadow-lg backdrop-blur"
						>
							<div
								class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
							>
								<Sparkles class="h-5 w-5" />
							</div>
							<h4 class="text-xs font-semibold text-zinc-200">
								Scenario: {selectedPreset.name}
							</h4>
							<p class="mt-1 text-[11px] leading-relaxed text-zinc-400">
								{selectedPreset.description}
							</p>
							<div
								class="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-2.5 text-left font-mono text-[11px] text-zinc-300"
							>
								<span class="text-zinc-500">Prompt:</span> "{selectedPreset.prompt}"
							</div>
							<button
								type="button"
								onclick={runChatStream}
								disabled={isGenerating}
								class="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all select-none hover:bg-cyan-500 hover:shadow-cyan-600/20 disabled:opacity-40"
							>
								<span>Start Live Stream</span>
								<Send class="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				{/if}

				{#each messages as msg (msg.id)}
					{#if msg.role === 'user'}
						<div class="flex items-start justify-end gap-3">
							<div
								class="max-w-[85%] rounded-2xl bg-cyan-600/90 px-4 py-2.5 text-xs text-white shadow"
							>
								{msg.content}
							</div>
							<div class="rounded-full bg-cyan-700 p-1.5 text-white">
								<User class="h-3.5 w-3.5" />
							</div>
						</div>
					{:else if msg.role === 'tool' && msg.toolCall}
						<div class="flex items-start gap-3">
							<div
								class="rounded-full border border-amber-500/30 bg-amber-500/20 p-1.5 text-amber-400"
							>
								<Wrench class="h-3.5 w-3.5" />
							</div>
							<div class="max-w-[85%] flex-1">
								<AiToolCall
									name={msg.toolCall.name}
									status="success"
									args={msg.toolCall.arguments}
									result={msg.toolCall.result}
									open={true}
									class="my-0 border-amber-500/30 bg-zinc-900/90 dark:border-amber-500/30 dark:bg-zinc-900/90"
								/>
							</div>
						</div>
					{:else}
						<div class="flex items-start gap-3">
							<div class="rounded-full border border-zinc-700 bg-zinc-800 p-1.5 text-cyan-400">
								<Bot class="h-3.5 w-3.5" />
							</div>
							<div
								class="max-w-[85%] rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-xs leading-relaxed text-zinc-200 shadow"
							>
								{#if msg.thought}
									<AiThought
										title={msg.thought.title}
										running={msg.thought.running}
										duration={msg.thought.duration}
										steps={msg.thought.steps}
										open={true}
										class="my-0 mb-3 border-cyan-500/30 bg-zinc-950/80 dark:border-cyan-500/30 dark:bg-zinc-950/80"
									/>
								{/if}

								{#if msg.ragSources && msg.ragSources.length > 0}
									<div
										class="mb-2 space-y-1.5 rounded-lg border border-cyan-500/20 bg-cyan-950/30 p-2 text-[11px]"
									>
										<div class="flex items-center gap-1 font-semibold text-cyan-400">
											<FileText class="h-3 w-3" />
											<span>Retrieved Context ({msg.ragSources.length} chunks)</span>
										</div>
										{#each msg.ragSources as src (src.title)}
											<div
												class="rounded border border-zinc-800 bg-zinc-950/80 p-1.5 font-mono text-[10px] text-zinc-300"
											>
												<div class="flex items-center justify-between text-zinc-400">
													<span class="text-cyan-300">{src.title}</span>
													<span class="text-emerald-400">score: {src.score}</span>
												</div>
												<p class="mt-0.5 line-clamp-2 text-zinc-400">{src.chunk}</p>
											</div>
										{/each}
									</div>
								{/if}

								<div class="whitespace-pre-wrap">{msg.content}</div>
								{#if msg.isStreaming}
									<span class="ml-1 inline-block h-3 w-1.5 animate-pulse bg-cyan-400 align-middle"
									></span>
								{/if}

								{#if msg.telemetry}
									<div
										class="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/80 pt-2 font-mono text-[10px]"
									>
										<span
											class="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-cyan-400"
										>
											⚡ TTFT: {msg.telemetry.ttftMs}ms
										</span>
										<span
											class="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-zinc-300"
										>
											{msg.telemetry.totalTokens} tokens
										</span>
										<span
											class="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-emerald-400"
										>
											{msg.telemetry.tokensPerSec} tok/s
										</span>
										<span
											class="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-purple-400"
										>
											{msg.telemetry.serverRunner}
										</span>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<!-- Chat Input Bar with Yaxa PromptBar -->
			<div class="mt-4 border-t border-zinc-800/80 pt-3">
				<div class="flex items-start gap-2">
					<button
						type="button"
						onclick={resetChat}
						class="mt-2 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
						title="Reset conversation (/reset)"
					>
						<RefreshCw class="h-4 w-4" />
					</button>

					<div class="min-w-0 flex-1">
						<PromptBar
							bind:value={promptInput}
							placeholder="Ask anything or type / for commands (/quart, /tool, /rag, /sse)..."
							loading={isGenerating}
							commands={SLASH_COMMANDS}
							onsubmit={(text) => handlePromptSubmit(text)}
							onstop={stopGeneration}
							class="[&_button[title='Attach files']]:hidden [&_button[title='Voice prompt']]:hidden"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Right: Inspector Drawer (5 cols) -->
		<div class="flex flex-col bg-zinc-950/70 lg:col-span-5">
			<!-- Inspector Tabs -->
			<div
				class="scrollbar-none flex [scrollbar-width:none] items-center gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-900/50 px-2 py-1.5 text-xs [&::-webkit-scrollbar]:hidden"
			>
				<button
					type="button"
					onclick={() => (activeTab = 'backend')}
					class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors select-none {activeTab ===
					'backend'
						? 'bg-zinc-800 text-cyan-400 shadow-sm'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					<Code2 class="h-3.5 w-3.5" />
					<span>Backend Code</span>
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'pydantic')}
					class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors select-none {activeTab ===
					'pydantic'
						? 'bg-zinc-800 text-cyan-400 shadow-sm'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					<ShieldCheck class="h-3.5 w-3.5" />
					<span>Pydantic Schema</span>
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'stream')}
					class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors select-none {activeTab ===
					'stream'
						? 'bg-zinc-800 text-cyan-400 shadow-sm'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					<Zap class="h-3.5 w-3.5" />
					<span>SSE Frames</span>
					{#if rawChunks.length > 0}
						<span class="rounded bg-cyan-950 px-1 font-mono text-[9px] text-cyan-400">
							{rawChunks.length}
						</span>
					{/if}
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'payload')}
					class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors select-none {activeTab ===
					'payload'
						? 'bg-zinc-800 text-cyan-400 shadow-sm'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					<FileText class="h-3.5 w-3.5" />
					<span>Request Body</span>
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'client')}
					class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors select-none {activeTab ===
					'client'
						? 'bg-zinc-800 text-cyan-400 shadow-sm'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					<Terminal class="h-3.5 w-3.5" />
					<span>HTTPX2 Client</span>
				</button>
			</div>

			<!-- Inspector Content -->
			<div class="max-h-115 flex-1 overflow-y-auto p-4 font-mono text-xs">
				{#if activeTab === 'stream'}
					{#if rawChunks.length === 0}
						<div class="py-12 text-center text-zinc-600">No SSE stream chunks captured yet.</div>
					{:else}
						<div class="mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-2">
							<span class="text-[10px] text-zinc-500">{rawChunks.length} frames received</span>
							<button
								type="button"
								onclick={() => sseClipboard.copy(rawChunks.join(''))}
								class="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300 transition-colors select-none hover:bg-zinc-800 hover:text-white"
							>
								{#if sseClipboard.copied}
									<Check class="h-3 w-3 text-emerald-400" />
									<span class="text-emerald-400">Copied!</span>
								{:else}
									<Copy class="h-3 w-3 text-zinc-400" />
									<span>Copy Raw Frames</span>
								{/if}
							</button>
						</div>
						<div class="space-y-1.5 text-[11px]">
							{#each rawChunks as chunk, idx (idx)}
								<div class="rounded border border-zinc-800/80 bg-zinc-900/60 p-1.5 text-zinc-300">
									<span class="mr-2 text-zinc-500">#{idx + 1}</span>
									<span class="text-cyan-300">{chunk.trim()}</span>
								</div>
							{/each}
						</div>
					{/if}
				{:else if activeTab === 'payload'}
					<div
						class="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-[11px] leading-relaxed text-zinc-300"
					>
						<span class="text-purple-400">POST</span> /api/v1/chat/stream HTTP/1.1<br />
						<span class="text-zinc-500">Host:</span> api.python-ai-lab.dev<br />
						<span class="text-zinc-500">Content-Type:</span> application/json<br />
						<span class="text-zinc-500">Accept:</span> text/event-stream<br />
						<span class="text-zinc-500">Server:</span>
						<span
							class={selectedFramework === 'flask'
								? 'text-amber-400'
								: selectedFramework === 'quart'
									? 'text-cyan-400'
									: 'text-emerald-400'}
						>
							{selectedFramework === 'flask'
								? 'gunicorn/23.0.0 (sync worker)'
								: selectedFramework === 'quart'
									? 'hypercorn/0.18.0 (asgi)'
									: 'granian/1.7.0 (rust-asgi)'}
						</span><br /><br />
						&#123;<br />
						&nbsp;&nbsp;<span class="text-cyan-400">"model"</span>:
						<span class="text-emerald-400">"gemma-4-e4b-it"</span>,<br />
						&nbsp;&nbsp;<span class="text-cyan-400">"stream"</span>:
						<span class="text-purple-400">true</span>,<br />
						&nbsp;&nbsp;<span class="text-cyan-400">"temperature"</span>: 0.7,<br />
						&nbsp;&nbsp;<span class="text-cyan-400">"prompt"</span>:
						<span class="text-emerald-400">"{selectedPreset.prompt}"</span><br />
						&#125;
					</div>
				{:else if activeTab === 'pydantic'}
					<div class="space-y-3">
						<div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
							<ShieldCheck class="h-4 w-4" />
							<span>Validated Pydantic v2 Contract</span>
						</div>
						<CodeBlock
							code={selectedPreset.pydanticSchema}
							language="python"
							title="Pydantic Schema"
							showLineNumbers={false}
						/>
					</div>
				{:else if activeTab === 'backend'}
					<div class="space-y-3">
						<div class="flex items-center justify-between text-xs">
							<span class="font-semibold text-zinc-200">
								{#if selectedFramework === 'flask'}
									Flask 3.x Streaming Blueprint (Gunicorn WSGI)
								{:else if selectedFramework === 'quart'}
									Quart Streaming Blueprint (Hypercorn ASGI)
								{:else}
									Litestar Streaming Controller (Granian ASGI)
								{/if}
							</span>
							<span
								class="rounded px-2 py-0.5 font-mono text-[10px] {selectedFramework === 'flask'
									? 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
									: selectedFramework === 'quart'
										? 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
										: 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}"
							>
								{selectedFramework === 'flask'
									? 'Blocking Threadpool'
									: selectedFramework === 'quart'
										? 'Zero-Rewrite Coroutine'
										: 'Type-Safe DTO Stream'}
							</span>
						</div>
						<CodeBlock
							code={backendSnippets[selectedFramework]}
							language="python"
							title={selectedFramework === 'flask'
								? 'Flask 3.x (WSGI + Threadpool)'
								: selectedFramework === 'quart'
									? 'Quart (Pallets Native ASGI)'
									: 'Litestar (Clean Architecture ASGI)'}
							showLineNumbers={true}
						/>
					</div>
				{:else if activeTab === 'client'}
					<div class="space-y-3">
						<div class="flex items-center justify-between text-xs">
							<span class="font-semibold text-zinc-200">HTTPX2 Async SSE Consumer</span>
							<span
								class="rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-400"
							>
								httpx2.AsyncClient
							</span>
						</div>
						<CodeBlock
							code={`# app/clients/stream_client.py
import asyncio
import json
import httpx2

async def stream_chat(prompt: str) -> None:
    limits = httpx2.Limits(max_connections=50, max_keepalive_connections=15)
    timeout = httpx2.Timeout(connect=3.0, read=60.0, write=10.0, pool=5.0)

    async with httpx2.AsyncClient(limits=limits, timeout=timeout) as client:
        async with client.stream(
            "POST",
            "http://localhost:8000/api/chat/stream",
            json={"prompt": prompt}
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: ") and not line.endswith("[DONE]"):
                    payload = json.loads(line[6:])
                    token = payload.get("token") or ""
                    print(token, end="", flush=True)

if __name__ == "__main__":
    asyncio.run(stream_chat("Explain non-blocking ASGI streaming"))`}
							language="python"
							title="app/clients/stream_client.py"
							showLineNumbers={true}
						/>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
