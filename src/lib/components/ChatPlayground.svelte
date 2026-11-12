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
		Clock
	} from '@lucide/svelte';

	interface Message {
		id: string;
		role: 'user' | 'assistant' | 'tool';
		content: string;
		toolCall?: {
			name: string;
			arguments: string;
			result: string;
		};
		isStreaming?: boolean;
	}

	interface Preset {
		id: string;
		name: string;
		prompt: string;
		description: string;
		requiresTool?: boolean;
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
			id: 'litestar-sse',
			name: 'Litestar SSE Stream',
			description: 'Real-time token streaming with async ServerSentEvent generator',
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
			name: 'Tool Calling Weather Agent',
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
			name: 'Structured Pydantic Extraction',
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
		}
	];

	type FrameworkId = 'flask' | 'quart' | 'litestar';
	let selectedFramework = $state<FrameworkId>('quart');

	const backendSnippets: Record<FrameworkId, string> = {
		flask: `# Flask 3.x (WSGI + Threadpool)
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
    )`,
		quart: `# Quart 0.23 (Pallets Native ASGI + Hypercorn)
from quart import Quart, Response
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
		litestar: `# Litestar 2.24 (Clean Architecture ASGI + Granian)
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

        return ServerSentEvent(token_generator())`
	};

	let selectedPreset = $state<Preset>(PRESETS[0]);
	let promptInput = $state(PRESETS[0].prompt);
	let messages = $state<Message[]>([]);
	let isGenerating = $state(false);

	// Latency Simulator Controls
	let ttftMs = $state(180); // Time to first token
	let itlMs = $state(28); // Inter-token latency
	let activeTab = $state<'stream' | 'payload' | 'pydantic' | 'backend'>('stream');
	let rawChunks = $state<string[]>([]);
	let stats = $state<{ ttft: number; totalTime: number; tokenCount: number }>({
		ttft: 0,
		totalTime: 0,
		tokenCount: 0
	});

	function applyPreset(preset: Preset) {
		selectedPreset = preset;
		promptInput = preset.prompt;
		messages = [];
		rawChunks = [];
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
		rawChunks = [];

		const startTime = performance.now();

		// Simulate TTFT
		await new Promise((r) => setTimeout(r, ttftMs));
		const ttftMeasured = Math.round(performance.now() - startTime);

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
			messages = [...messages, toolMsg];
			rawChunks = [
				...rawChunks,
				`event: tool_call\ndata: ${JSON.stringify({ name: selectedPreset.toolInfo.name, arguments: selectedPreset.toolInfo.args })}\n\n`,
				`event: pydantic_validate\ndata: {"status": "valid", "schema": "WeatherQuery"}\n\n`,
				`event: tool_result\ndata: ${selectedPreset.toolInfo.result}\n\n`
			];
			// Brief execution pause
			await new Promise((r) => setTimeout(r, 200));
		}

		// Assistant message placeholder
		const assistantMsgId = 'asst-' + Date.now();
		const assistantMsg: Message = {
			id: assistantMsgId,
			role: 'assistant',
			content: '',
			isStreaming: true
		};
		messages = [...messages, assistantMsg];

		let assembledContent = '';
		for (let i = 0; i < selectedPreset.tokens.length; i++) {
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

		rawChunks = [...rawChunks, `data: [DONE]\n\n`];

		const totalTime = Math.round(performance.now() - startTime);
		stats = {
			ttft: ttftMeasured,
			totalTime,
			tokenCount: selectedPreset.tokens.length
		};

		messages = messages.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m));
		isGenerating = false;
	}

	function resetChat() {
		messages = [];
		rawChunks = [];
		promptInput = selectedPreset.prompt;
		isGenerating = false;
	}
</script>

<div class="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
	<!-- Top Bar -->
	<div class="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4">
		<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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

			<!-- Runtime & Preset Selectors -->
			<div class="flex flex-wrap items-center gap-4">
				<!-- Runtime Selector -->
				<div class="flex flex-wrap items-center gap-2">
					<span class="shrink-0 font-mono text-xs text-zinc-400">Runtime:</span>
					<div
						class="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/70 p-1"
					>
						<button
							type="button"
							onclick={() => (selectedFramework = 'flask')}
							class="rounded-lg px-2.5 py-1 text-xs font-medium transition-all {selectedFramework ===
							'flask'
								? 'bg-amber-600 text-white shadow-sm'
								: 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}"
						>
							Flask 3.x (WSGI)
						</button>
						<button
							type="button"
							onclick={() => (selectedFramework = 'quart')}
							class="rounded-lg px-2.5 py-1 text-xs font-medium transition-all {selectedFramework ===
							'quart'
								? 'bg-cyan-600 text-white shadow-sm'
								: 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}"
						>
							Quart 0.23 (ASGI)
						</button>
						<button
							type="button"
							onclick={() => (selectedFramework = 'litestar')}
							class="rounded-lg px-2.5 py-1 text-xs font-medium transition-all {selectedFramework ===
							'litestar'
								? 'bg-emerald-600 text-white shadow-sm'
								: 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}"
						>
							Litestar 2.24 (ASGI)
						</button>
					</div>
				</div>

				<!-- Preset Selector Group -->
				<div class="flex flex-wrap items-center gap-2">
					<span class="shrink-0 font-mono text-xs text-zinc-400">Preset:</span>
					<div
						class="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/70 p-1"
					>
						{#each PRESETS as preset (preset.id)}
							<button
								type="button"
								onclick={() => applyPreset(preset)}
								class="rounded-lg px-2.5 py-1 text-xs font-medium transition-all {selectedPreset.id ===
								preset.id
									? 'bg-cyan-600 text-white shadow-sm'
									: 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}"
							>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Latency Simulator Controls -->
		<div class="mt-4 flex flex-wrap items-center gap-6 border-t border-zinc-800/80 pt-3 text-xs">
			<div class="flex items-center gap-3">
				<Clock class="h-4 w-4 text-cyan-400" />
				<span class="font-medium text-zinc-300">Simulate TTFT (Time To First Token):</span>
				<input
					type="range"
					min="50"
					max="600"
					step="10"
					bind:value={ttftMs}
					class="w-28 accent-cyan-400"
				/>
				<span class="font-mono text-cyan-300">{ttftMs}ms</span>
			</div>

			<div class="flex items-center gap-3">
				<SlidersVertical class="h-4 w-4 text-emerald-400" />
				<span class="font-medium text-zinc-300">Inter-Token Latency (ITL):</span>
				<input
					type="range"
					min="10"
					max="80"
					step="5"
					bind:value={itlMs}
					class="w-28 accent-emerald-400"
				/>
				<span class="font-mono text-emerald-300">{itlMs}ms/tok</span>
			</div>

			{#if stats.tokenCount > 0}
				<div class="ml-auto flex items-center gap-3 font-mono text-zinc-400">
					<span>TTFT: <strong class="text-cyan-400">{stats.ttft}ms</strong></span>
					<span>Total: <strong class="text-zinc-200">{stats.totalTime}ms</strong></span>
					<span
						>Speed: <strong class="text-emerald-400"
							>{Math.round(stats.tokenCount / (stats.totalTime / 1000) || 0)} tok/s</strong
						></span
					>
				</div>
			{/if}
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
					<div
						class="flex h-full flex-col items-center justify-center py-12 text-center text-zinc-500"
					>
						<Bot class="mb-2 h-10 w-10 text-zinc-700" />
						<p class="text-xs">No active conversation.</p>
						<p class="mt-0.5 text-[11px] text-zinc-600">
							Click "Send Request" to stream tokens through the pipeline.
						</p>
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
					{:else if msg.role === 'tool'}
						<div class="flex items-start gap-3">
							<div
								class="rounded-full border border-amber-500/30 bg-amber-500/20 p-1.5 text-amber-400"
							>
								<Wrench class="h-3.5 w-3.5" />
							</div>
							<div
								class="max-w-[85%] rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"
							>
								<div class="mb-1 flex items-center gap-1.5 font-semibold text-amber-300">
									<span>Tool Call:</span>
									<code class="font-mono text-[11px] text-amber-400">{msg.toolCall?.name}</code>
								</div>
								<div class="rounded bg-zinc-950/80 p-2 font-mono text-[10px] text-zinc-300">
									Args: {msg.toolCall?.arguments}<br />Result: {msg.toolCall?.result}
								</div>
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
								<div class="whitespace-pre-wrap">{msg.content}</div>
								{#if msg.isStreaming}
									<span class="ml-1 inline-block h-3 w-1.5 animate-pulse bg-cyan-400 align-middle"
									></span>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<!-- Chat Input Bar -->
			<div class="mt-4 flex items-center gap-2 border-t border-zinc-800/80 pt-3">
				<button
					type="button"
					onclick={resetChat}
					class="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:text-white"
					title="Reset conversation"
				>
					<RefreshCw class="h-4 w-4" />
				</button>

				<input
					type="text"
					bind:value={promptInput}
					onkeydown={(e) => e.key === 'Enter' && runChatStream()}
					disabled={isGenerating}
					placeholder="Enter prompt to stream..."
					class="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
				/>

				<button
					type="button"
					onclick={runChatStream}
					disabled={isGenerating || !promptInput.trim()}
					class="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-40"
				>
					<span>Send</span>
					<Send class="h-3.5 w-3.5" />
				</button>
			</div>
		</div>

		<!-- Right: Inspector Drawer (5 cols) -->
		<div class="flex flex-col bg-zinc-950/70 lg:col-span-5">
			<!-- Inspector Tabs -->
			<div class="flex items-center border-b border-zinc-800 bg-zinc-900/50 px-2 py-1 text-xs">
				<button
					type="button"
					onclick={() => (activeTab = 'stream')}
					class="rounded-md px-3 py-1.5 font-medium transition-colors {activeTab === 'stream'
						? 'bg-zinc-800 text-cyan-400 shadow'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					SSE Chunks
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'payload')}
					class="rounded-md px-3 py-1.5 font-medium transition-colors {activeTab === 'payload'
						? 'bg-zinc-800 text-cyan-400 shadow'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					Request Body
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'pydantic')}
					class="rounded-md px-3 py-1.5 font-medium transition-colors {activeTab === 'pydantic'
						? 'bg-zinc-800 text-cyan-400 shadow'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					Pydantic Schema
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'backend')}
					class="rounded-md px-3 py-1.5 font-medium transition-colors {activeTab === 'backend'
						? 'bg-zinc-800 text-cyan-400 shadow'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					Backend Code
				</button>
			</div>

			<!-- Inspector Content -->
			<div class="max-h-115 flex-1 overflow-y-auto p-4 font-mono text-xs">
				{#if activeTab === 'stream'}
					{#if rawChunks.length === 0}
						<div class="py-12 text-center text-zinc-600">No SSE stream chunks captured yet.</div>
					{:else}
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
						<pre
							class="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-[11px] text-cyan-300">{selectedPreset.pydanticSchema}</pre>
					</div>
				{:else}
					<div class="space-y-3">
						<div class="flex items-center justify-between text-xs">
							<span class="font-semibold text-zinc-200">
								{#if selectedFramework === 'flask'}
									Flask 3.x Streaming Blueprint (Gunicorn WSGI)
								{:else if selectedFramework === 'quart'}
									Quart 0.23 Streaming Blueprint (Hypercorn ASGI)
								{:else}
									Litestar 2.24 Streaming Controller (Granian ASGI)
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
						<pre
							class="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 font-mono text-[11px] leading-relaxed text-zinc-300">{backendSnippets[
								selectedFramework
							]}</pre>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
