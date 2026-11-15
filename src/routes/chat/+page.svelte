<script lang="ts">
	import ChatPlayground from '#lib/components/ChatPlayground.svelte';
	import CodeBlock from '#lib/components/CodeBlock.svelte';
	import { Bot, Zap } from '@lucide/svelte';

	const sseSnippet = `from quart import Blueprint, Response, request, current_app
from openai import AsyncOpenAI
import json

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@chat_bp.post("/stream")
async def stream_chat():
    data = await request.get_json() or {}
    prompt = data.get("prompt", "")
    client: AsyncOpenAI = current_app.extensions["async_openai_client"]

    async def generate():
        stream = await client.chat.completions.create(
            model="gemma-4-e4b-it",
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                payload = json.dumps({"token": delta})
                yield f"data: {payload}\\n\\n"
        yield "data: [DONE]\\n\\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )`;
</script>

<svelte:head>
	<title>Streaming Chat & Tool Playground — Python AI Lab</title>
	<meta
		name="description"
		content="Interactive simulator for LLM Server-Sent Events (SSE) streaming, TTFT/ITL latency simulation, and Pydantic v2 tool call execution."
	/>
</svelte:head>

<div class="space-y-10">
	<!-- Page Header -->
	<div class="border-b border-zinc-800/80 pb-6">
		<div class="mb-1 flex items-center gap-2 font-mono text-xs text-cyan-400">
			<Bot class="h-4 w-4" />
			<span>Interactive Testing Environment</span>
		</div>
		<h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
			LLM Streaming & Tool-Call Simulator
		</h1>
		<p class="mt-2 max-w-3xl text-sm text-zinc-300">
			Experiment with non-blocking Server-Sent Events (SSE), customize Time-To-First-Token (TTFT)
			and Inter-Token Latency (ITL) sliders, and inspect live Pydantic v2 schemas and raw stream
			frames.
		</p>
	</div>

	<!-- Standalone Chat Playground Component -->
	<ChatPlayground />

	<!-- Technical Reference Section -->
	<div class="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-2">
		<!-- Left: SSE Protocol Guide -->
		<div class="min-w-0 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
			<div class="flex items-center gap-2">
				<Zap class="h-5 w-5 text-cyan-400" />
				<h3 class="text-sm font-bold tracking-wide text-zinc-100 uppercase">
					SSE Streaming Anatomy in Quart ASGI
				</h3>
			</div>

			<p class="text-xs leading-relaxed text-zinc-300">
				Unlike WebSockets, which require a full-duplex protocol upgrade over HTTP/1.1, Server-Sent
				Events (SSE) operate over standard HTTP. Quart streams SSE using native asynchronous
				generator functions returned directly in <code class="text-cyan-400"
					>Response(generate())</code
				>, preserving task-local state without threadpool starvation while emitting real-time token
				chunks:
			</p>

			<ul class="list-inside list-disc space-y-2 text-xs text-zinc-400">
				<li>
					<strong class="text-zinc-200">Content-Type: text/event-stream</strong> - Instructs clients and
					reverse proxies to keep the connection open.
				</li>
				<li>
					<strong class="text-zinc-200">X-Accel-Buffering: no</strong> - Prevents Nginx/Cloudflare from
					buffering token chunks into 4KB batches.
				</li>
				<li>
					<strong class="text-zinc-200">data: [DONE]</strong> - The universal OpenAI termination signal
					closing the reader loop.
				</li>
			</ul>
		</div>

		<!-- Right: Quart Reference Code -->
		<div class="min-w-0 space-y-2">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<span class="text-xs font-semibold text-zinc-300">Quart Async Generator Endpoint</span>
				<span class="font-mono text-[11px] text-cyan-400">app/blueprints/chat.py</span>
			</div>
			<CodeBlock code={sseSnippet} language="python" title="app/blueprints/chat.py" />
		</div>
	</div>
</div>
