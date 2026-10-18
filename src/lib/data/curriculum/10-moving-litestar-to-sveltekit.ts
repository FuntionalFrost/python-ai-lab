import type { CurriculumLesson } from '../../types/curriculum';

export const track10: CurriculumLesson = {
	id: 'track-10',
	slug: '10-moving-litestar-to-sveltekit',
	trackNumber: 10,
	title: 'Moving from Litestar to SvelteKit',
	shortTitle: 'Litestar to SvelteKit Full-Stack',
	subtitle:
		'BFF Architecture, Edge Streaming with ReadableStream, and Server-Side TypeScript for AI Workloads',
	level: 'Advanced',
	estimatedMinutes: 45,
	topics: [
		'When to Consolidate: Python Microservice vs. SvelteKit BFF',
		'Litestar ServerSentEvent vs. SvelteKit Web ReadableStream',
		'Generating TypeScript Interfaces from Pydantic Schemas',
		'Managing API Secrets: Pydantic SecretStr vs. $env/static/private',
		'Hybrid Architecture: SvelteKit as Orchestrator / Python as ML Worker',
		'Testing SvelteKit Server Endpoints with Vitest'
	],
	frameworks: ['SvelteKit 3', 'TypeScript 5.x', 'Litestar 2.24', 'OpenAI Node / Python SDK'],
	tags: ['Full-Stack', 'SvelteKit', 'BFF', 'Streaming', 'TypeScript', 'Edge'],
	summary:
		'Explore the architectural boundary between Python AI microservices and SvelteKit. Discover when to replace an intermediate Litestar API layer with native SvelteKit server endpoints (+server.ts), how to implement Web-standard ReadableStream SSE pipelines in TypeScript, and how to maintain end-to-end type safety between Python models and Svelte 5 frontends.',
	objectives: [
		'Evaluate the trade-offs between a dedicated Litestar API gateway and a unified SvelteKit Full-Stack backend.',
		'Implement high-speed SSE streaming in SvelteKit +server.ts using standard Web ReadableStreams.',
		'Secure OpenAI API tokens and upstream credentials with SvelteKit’s compile-time private environment modules ($env/static/private).',
		'Establish automated pipelines to generate type-safe TypeScript interfaces from Pydantic v2 schemas.',
		'Architect a hybrid production topology where SvelteKit acts as the fast streaming BFF and delegates heavy vector/GPU operations to Python.'
	],
	architecture: {
		patternName: 'Backend-for-Frontend (BFF) & Hybrid AI Orchestration',
		diagram: `+-------------------------------------------------------------------------+
|                  SvelteKit Full-Stack Application (Browser + SSR)       |
|                                                                         |
|   [ Svelte 5 UI ] (runes: $state, $derived)                             |
|          |                                                              |
|          | HTTP POST /api/chat (Fetch / SSE Reader)                     |
|          v                                                              |
|   [ SvelteKit Server Endpoint: src/routes/api/chat/+server.ts ]         |
|   - Zero-Cold-Start Node/Bun/Edge execution                             |
|   - $env/static/private (Secret key never exposed to client)            |
|   - Streams directly to user via Web ReadableStream                     |
+------------------------------------+------------------------------------+
                                     |
                                     | (Internal High-Speed RPC / REST)
                                     v
+-------------------------------------------------------------------------+
|                    Specialized Python Litestar Microservice              |
|   - Heavy ML / PyTorch / CuPy Operations                                |
|   - Specialized Embedding & Cosine Re-ranking Pipelines                 |
|   - Direct PostgreSQL / pgvector connection pool                        |
+-------------------------------------------------------------------------+`,
		explanation: `In many early-stage AI projects, developers stand up a separate Python web framework (like Flask or Litestar) simply to call the OpenAI SDK. This introduces:
1. Operational Overhead: Managing two distinct deployments, Dockerfiles, and reverse proxy routing rules.
2. Serialization Tax: Converting JSON to Pydantic, back to JSON over HTTP, and then into TypeScript.
3. Latency Penalties: An extra network hop between the frontend server and the Python API.

By moving standard LLM chat streaming, tool dispatching, and session management directly into SvelteKit server routes ('+server.ts'), you eliminate the intermediate Python web tier for transport while retaining Python strictly where it excels: heavy vector indexing, LangChain/LlamaIndex pipelines, and custom PyTorch model serving.`,
		keyConcepts: [
			{
				name: 'Backend-for-Frontend (BFF) Pattern',
				description:
					'The SvelteKit server acts as a tailored API layer optimized specifically for the frontend UI, handling authentication, caching, and stream forwarding.'
			},
			{
				name: 'Web-Standard `ReadableStream`',
				description:
					'SvelteKit endpoints use standard Fetch API Request/Response primitives, streaming token bytes to the browser with zero external framework dependencies.'
			},
			{
				name: 'Compile-Time Secret Isolation',
				description:
					'SvelteKit prevents accidental client leaks by throwing build errors if code in a client file attempts to import from $env/static/private.'
			}
		]
	},
	comparisons: [
		{
			title: 'Streaming Chat Endpoint: Litestar Python vs. SvelteKit TypeScript',
			description:
				'Observe the parity between Litestar’s async generator and SvelteKit’s native Web ReadableStream.',
			leftTitle: 'Litestar 2.24 (Python Async Controller)',
			leftLanguage: 'python',
			leftCode: `from collections.abc import AsyncGenerator
from litestar import Controller, post
from litestar.response import ServerSentEvent
from openai import AsyncOpenAI
from app.schemas.chat import ChatPrompt

class StreamController(Controller):
    path = "/api/chat"

    @post("/stream")
    async def stream_chat(
        self,
        data: ChatPrompt,
        client: AsyncOpenAI
    ) -> ServerSentEvent:
        async def event_generator() -> AsyncGenerator[str, None]:
            stream = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": data.prompt}],
                stream=True
            )
            async for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                if token:
                    yield f'{{"token": {token!r}}}'
            yield "[DONE]"

        return ServerSentEvent(
            content=event_generator(),
            headers={"Cache-Control": "no-cache"}
        )`,
			rightTitle: 'SvelteKit 3 (TypeScript +server.ts)',
			rightLanguage: 'typescript',
			rightCode: `import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const POST: RequestHandler = async ({ request }) => {
	const { prompt } = await request.json();

	const stream = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
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
			title: 'Settings & Secret Management',
			description: 'How API keys and secrets are protected in each ecosystem.',
			leftTitle: 'Litestar / Pydantic (pydantic-settings)',
			leftLanguage: 'python',
			leftCode: `from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    openai_api_key: SecretStr # Prevents accidental print/log leaks

# Usage in Python
settings = AppSettings()
raw_key = settings.openai_api_key.get_secret_value()`,
			rightTitle: 'SvelteKit Private Environment ($env)',
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
			id: 'sveltekit-sse-consumer',
			title: 'Consuming SSE Stream in Svelte 5 Component',
			filePath: 'src/lib/components/ChatStreamConsumer.svelte',
			description:
				'Modern Svelte 5 component reading Web stream chunks with $state and $derived runes.',
			language: 'typescript',
			code: `<script lang="ts">
	let prompt = $state('');
	let answer = $state('');
	let isStreaming = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!prompt.trim() || isStreaming) return;

		isStreaming = true;
		answer = '';

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
	<input bind:value={prompt} placeholder="Ask SvelteKit AI..." class="w-full rounded-lg bg-zinc-900 p-3 text-sm text-white" />
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
			title: 'Automated Schema Sync: Pydantic to TypeScript',
			filePath: 'scripts/export_schemas.py',
			description:
				'Generates TypeScript definitions from Pydantic v2 schemas to ensure end-to-end type safety between Litestar and SvelteKit.',
			language: 'python',
			code: `import json
from pathlib import Path
from pydantic import BaseModel
from app.schemas.summary import SummaryRequest, SummaryResponse
from app.schemas.analysis import AnalysisRequest, AnalysisResponse

def export_json_schemas():
    models: list[type[BaseModel]] = [
        SummaryRequest,
        SummaryResponse,
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
