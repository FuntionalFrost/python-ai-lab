import type { CurriculumLesson } from '../../types/curriculum';

export const track12: CurriculumLesson = {
	id: 'track-12',
	slug: '12-connecting-to-sveltekit',
	trackNumber: 12,
	title: 'Connecting Python AI Backends to SvelteKit (Full-Stack AI Integration)',
	shortTitle: 'Connecting to SvelteKit',
	subtitle:
		'Consuming Streaming AI Backends, Type-Safe Pydantic Contracts, and Svelte 5 Reactive Frontends',
	estimatedMinutes: 45,
	topics: [
		'Full-Stack Topology: Flask AI Microservice & SvelteKit UI',
		'Consuming Flask SSE Streams with Svelte 5 Runes ($state, $derived)',
		'Generating TypeScript Interfaces from Flask Pydantic v2 Models',
		'CORS, Reverse Proxying & Streaming Headers (X-Accel-Buffering)',
		'Hybrid Architecture: SvelteKit BFF vs. Direct Flask Endpoints',
		'Testing Full-Stack Endpoints with Vitest and pytest'
	],
	frameworks: ['SvelteKit 3', 'TypeScript 5.x', 'Flask 3.1.3', 'Pydantic v2'],
	tags: ['Full-Stack', 'SvelteKit', 'Flask', 'Streaming', 'TypeScript', 'Svelte 5'],
	summary:
		'Bridge your Python Flask AI backend with a modern fullstack frontend in SvelteKit. Discover how Svelte 5 runes consume Flask Server-Sent Event streams in real-time, how to synchronize Pydantic schemas to TypeScript types, and how to structure production deployment boundaries.',
	objectives: [
		'Architect a production boundary between a Flask AI backend service and a SvelteKit user interface.',
		'Implement resilient client-side SSE readers in Svelte 5 using the Web Streams API and reactive runes.',
		'Eliminate drift between Python models and TypeScript contracts with automated schema generation.',
		'Configure CORS and reverse-proxy buffering rules so Flask streams arrive in SvelteKit with zero latency.',
		'Verify fullstack streaming integrity with Vitest end-to-end and mock test suites.'
	],
	architecture: {
		patternName: 'Full-Stack Flask AI Backend & Svelte 5 UI Topology',
		diagram: `+-------------------------------------------------------------------------+
|                  SvelteKit Frontend Application (Browser + SSR)         |
|                                                                         |
|   [ Svelte 5 UI: ChatStream.svelte ] (runes: $state, $derived)          |
|          |                                                              |
|          | HTTP POST /api/chat/stream (SSE Stream Consumer)             |
|          v                                                              |
|   [ SvelteKit Reverse Proxy / Vite Dev Proxy / Nginx Gateway ]          |
+------------------------------------+------------------------------------+
                                     |
                                     | (Server-Sent Events: text/event-stream)
                                     v
+-------------------------------------------------------------------------+
|                    Flask 3.x AI Backend Microservice                    |
|   - Application Factory & Modular Blueprints (create_app)               |
|   - stream_with_context() Token Generator                               |
|   - Pydantic v2 Input Validation & Strict DTO Schemas                   |
|   - Pooled OpenAI Client in current_app.extensions                      |
|   - Vector DB / RAG / Agent Tool Dispatching Layers                     |
+-------------------------------------------------------------------------+`,
		explanation: `The most popular real-world architecture for AI products combines Python's rich data science ecosystem with a fast modern frontend:

1. Flask Backend: Owns LLM orchestration, prompt engineering, vector database indexing, and fine-tuned model inferences where Python libraries (Pydantic, LangChain, PyTorch) dominate.
2. SvelteKit Frontend: Delivers instant page loads, snappy interactive UI, and reactive state management powered by Svelte 5 runes.
3. Streaming Glue: Flask emits chunks using 'Response(stream_with_context(generate()), mimetype="text/event-stream")' while SvelteKit consumes the stream via the browser's standard 'ReadableStream' API, appending tokens to reactive $state variables with zero UI flicker.`,
		keyConcepts: [
			{
				name: 'Svelte 5 Runes Streaming',
				description:
					"Using $state('') to store streaming responses enables fine-grained DOM reactivity: only the text node updates as tokens arrive, preventing unnecessary re-renders."
			},
			{
				name: 'Web-Standard `ReadableStream`',
				description:
					'The browser Fetch API provides response.body.getReader(), allowing the client to process incoming token chunks asynchronously as they traverse the network.'
			},
			{
				name: 'Pydantic-to-TypeScript Contract Sync',
				description:
					'Exporting Pydantic JSON schemas into TypeScript definitions prevents frontend/backend schema desynchronization when API parameters evolve.'
			}
		]
	},
	comparisons: [
		{
			title: 'Streaming Pipeline: Flask 3.x Backend vs. SvelteKit Server BFF',
			description:
				'Observe the difference between producing an SSE stream in Flask and proxying/handling it in SvelteKit.',
			leftTitle: 'Flask 3.x (SSE Generator)',
			leftLanguage: 'python',
			leftCode: `from flask import Blueprint, Response, stream_with_context, request, current_app
from openai import OpenAI
import json

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@chat_bp.post("/stream")
def stream_chat():
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "")
    client: OpenAI = current_app.extensions["openai_client"]

    def generate():
        stream = client.chat.completions.create(
            model="gemma-4-e4b-it",
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )
        for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if token:
                payload = json.dumps({"token": token})
                yield f"data: {payload}\\n\\n"
        yield "data: [DONE]\\n\\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )`,
			rightTitle: 'SvelteKit 3 (+server.ts BFF)',
			rightLanguage: 'typescript',
			rightCode: `import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const POST: RequestHandler = async ({ request }) => {
	const { prompt } = await request.json();

	const stream = await openai.chat.completions.create({
		model: 'gemma-4-e4b-it',
		messages: [{ role: 'user', content: prompt }],
		stream: true
	});

	// Standard Web Streams API supported out of the box
	const readable = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			for await (const chunk of stream) {
				const token = chunk.choices[0]?.delta?.content || '';
				if (token) {
					controller.enqueue(encoder.encode(\`data: \${JSON.stringify({ token })}\\n\\n\`));
				}
			}
			controller.enqueue(encoder.encode('data: [DONE]\\n\\n'));
			controller.close();
		}
	});

	return new Response(readable, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
};`
		},
		{
			title: 'Settings & Secret Isolation',
			description: 'How API keys and secrets are protected in each ecosystem.',
			leftTitle: 'app/config.py (pydantic-settings)',
			leftLanguage: 'python',
			leftCode: `# app/config.py
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    openai_api_key: SecretStr # Prevents accidental print/log leaks

# Module-level singleton
settings = Settings()
raw_key = settings.openai_api_key.get_secret_value()`,
			rightTitle: 'src/lib/server/openai.ts ($env)',
			rightLanguage: 'typescript',
			rightCode: `// src/lib/server/openai.ts
// Compile-time guard: Build FAILS if imported into browser code!
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

export const serverOpenAI = new OpenAI({
    apiKey: OPENAI_API_KEY
});`
		}
	],
	codeSnippets: [
		{
			id: 'svelte5-sse-consumer',
			title: 'Consuming Flask SSE Stream in Svelte 5 with Runes',
			filePath: 'src/lib/components/ChatStreamConsumer.svelte',
			description:
				'Modern Svelte 5 component reading Flask SSE stream chunks with $state and $derived runes.',
			language: 'svelte',
			code: `<script lang="ts">
	let prompt = $state('');
	let answer = $state('');
	let isStreaming = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!prompt.trim() || isStreaming) return;

		isStreaming = true;
		answer = '';

		// Connect to Flask backend SSE endpoint
		const response = await fetch('/api/chat/stream', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt })
		});

		if (!response.body) return;

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\\n\\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const dataStr = line.slice(6).trim();
					if (dataStr === '[DONE]') break;
					try {
						const { token } = JSON.parse(dataStr);
						answer += token;
					} catch {
						// Incomplete chunk buffer fallback
					}
				}
			}
		}
		isStreaming = false;
	}
</script>

<form onsubmit={handleSubmit} class="space-y-3">
	<input bind:value={prompt} placeholder="Ask Flask AI..." class="w-full rounded-lg bg-zinc-900 p-3 text-sm text-white" />
	<button type="submit" disabled={isStreaming} class="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white">
		{isStreaming ? 'Streaming...' : 'Generate Stream'}
	</button>
</form>

<div class="mt-4 whitespace-pre-wrap rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-200">
	{answer}
</div>`,
			runnable: true
		},
		{
			id: 'pydantic-to-typescript-script',
			title: 'Automated Schema Sync: Flask Pydantic to TypeScript',
			filePath: 'scripts/export_schemas.py',
			description:
				'Generates TypeScript definitions from Flask Pydantic v2 schemas to ensure end-to-end type safety between Flask and SvelteKit.',
			language: 'python',
			code: `import json
from pathlib import Path
from pydantic import BaseModel
from app.schemas.analysis import AnalysisRequest, AnalysisResponse

def export_json_schemas():
    models: list[type[BaseModel]] = [
        AnalysisRequest,
        AnalysisResponse,
    ]
    out_dir = Path("src/lib/types/generated")
    out_dir.mkdir(parents=True, exist_ok=True)

    for model in models:
        schema = model.model_json_schema()
        target = out_dir / f"{model.__name__}.json"
        target.write_text(json.dumps(schema, indent=2))
        print(f"Exported {model.__name__} schema -> {target}")

if __name__ == "__main__":
    export_json_schemas()`,
			runnable: true
		}
	],
	testSuite: {
		title: 'SvelteKit Streaming Endpoint Test Suite (Vitest)',
		testFilePath: 'tests/server/chat_stream.test.ts',
		command: 'vitest run tests/server/chat_stream.test.ts',
		executionTimeSec: 0.65,
		testCode: `import { describe, it, expect, vi } from 'vitest';
import { POST } from '../../src/routes/api/chat/+server';

// Mock the OpenAI Node SDK
vi.mock('openai', () => {
	return {
		default: vi.fn().mockImplementation(() => ({
			chat: {
				completions: {
					create: vi.fn().mockResolvedValue({
						async *[Symbol.asyncIterator]() {
							yield { choices: [{ delta: { content: 'SvelteKit' } }] };
							yield { choices: [{ delta: { content: ' is' } }] };
							yield { choices: [{ delta: { content: ' fast!' } }] };
						}
					})
				}
			}
		}))
	};
});

describe('SvelteKit Streaming Endpoint (+server.ts)', () => {
	it('streams SSE formatted chunks and closes with [DONE]', async () => {
		const mockRequest = new Request('http://localhost:5173/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt: 'Tell me about SvelteKit' })
		});

		const response = await POST({
			request: mockRequest,
			cookies: {} as any,
			fetch: vi.fn() as any,
			getClientAddress: () => '127.0.0.1',
			locals: {} as any,
			params: {},
			platform: {},
			route: { id: '/api/chat' },
			setHeaders: vi.fn(),
			url: new URL('http://localhost:5173/api/chat'),
			isDataRequest: false,
			isSubRequest: false
		} as any);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('text/event-stream');

		const reader = response.body!.getReader();
		const decoder = new TextDecoder();
		let accumulated = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			accumulated += decoder.decode(value);
		}

		expect(accumulated).toContain('data: {"token":"SvelteKit"}\\n\\n');
		expect(accumulated).toContain('data: {"token":" fast!"}\\n\\n');
		expect(accumulated).toContain('data: [DONE]\\n\\n');
	});
});`,
		simulatedStdout: ` ✓ tests/server/chat_stream.test.ts (1 test) 65ms
   ✓ SvelteKit Streaming Endpoint (+server.ts) > streams SSE formatted chunks and closes with [DONE]

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  13:17:42
   Duration  652ms (transform 120ms, setup 0ms, collect 45ms, tests 65ms, environment 0ms, run 422ms)

---------- coverage: vitest 2.1.2 -----------
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------------|---------|----------|---------|---------|-------------------
src/routes/api/chat         |     100 |      100 |     100 |     100 | 
  +server.ts                |     100 |      100 |     100 |     100 | 
----------------------------|---------|----------|---------|---------|-------------------
All files                   |     100 |      100 |     100 |     100 | 
================================================================================`,
		coverage: {
			files: [
				{
					name: 'src/routes/api/chat/+server.ts',
					stmts: 24,
					miss: 0,
					cover: '100%',
					missing: ''
				}
			],
			total: { stmts: 24, miss: 0, cover: '100%' }
		},
		summary:
			'All tests passed with 100% test coverage confirming Web-standard SSE streaming on SvelteKit server endpoints.'
	},
	interactiveComponent: 'chat'
};
