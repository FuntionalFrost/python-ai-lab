import type { CurriculumLesson } from '../../types/curriculum';

export const track04: CurriculumLesson = {
	id: 'track-04',
	slug: '04-llm-chat-streaming',
	trackNumber: 4,
	title: 'Real-Time LLM Token Streaming in Quart ASGI',
	shortTitle: 'Quart SSE Token Streaming',
	subtitle:
		'Server-Sent Events (SSE), Native Async Generators, AsyncOpenAI, and Sliding-Window Memory',
	estimatedMinutes: 35,
	topics: [
		'Quart Native Async Generator Streaming Architecture',
		'Server-Sent Events (SSE) Protocol: data: <payload>\\n\\n',
		'Disabling Reverse Proxy Buffering (X-Accel-Buffering: no)',
		'AsyncOpenAI Client Lifecycle & Connection Pooling in Quart Extensions',
		'Sliding-Window Conversation Memory with Pydantic',
		'The No-DB Streaming Proxy Advantage: Zero Thread Starvation'
	],
	frameworks: [
		'Quart',
		'Hypercorn 0.17+',
		'AsyncOpenAI 3.x',
		'Pydantic v2',
		'pytest 9.x',
		'pytest-asyncio'
	],
	tags: ['Quart', 'ASGI', 'Streaming', 'SSE', 'AsyncOpenAI', 'Chat History', 'Real-Time'],
	summary:
		'Deliver snappy conversational AI in Quart by replacing blocking responses with native async token streaming. Master Quart’s native async generator mechanism, Server-Sent Events (SSE) protocol framing, Nginx reverse-proxy buffering guards, and resilient conversation buffers running on Hypercorn.',
	objectives: [
		'Implement streaming HTTP endpoints in Quart using native async generator coroutines and Response(generate()).',
		'Format SSE chunks according to web standards (data: <json>\\n\\n and data: [DONE]).',
		'Configure reverse-proxy headers (X-Accel-Buffering: no, Cache-Control: no-cache) to prevent upstream chunk buffering.',
		'Maintain non-blocking pooled AsyncOpenAI client instances across Quart event loop workers.',
		'Build sliding-window chat history buffers that prune older messages while preserving system prompts.',
		'Avoid Flask WSGI threadpool exhaustion by leveraging ASGI cooperative event loop scheduling.'
	],
	architecture: {
		patternName: 'Quart Server-Sent Event (SSE) Async Streaming Pipeline',
		diagram: `+--------------------+               +--------------------------------------+
| Web Client / UI    |               |  Quart Async Blueprint               |
| (EventSource / SSE)|               |  (@chat_bp.post("/stream"))          |
+---------+----------+               +------------------+-------------------+
          |                                             |
          | 1. POST /api/chat/stream                    |
          +-------------------------------------------->|
          |                                             | 2. await client.chat.completions.create(
          |                                             |    stream=True)
          |                                             v
          |                                     +--------------------+
          |                                     | OpenAI Gateway API |
          |                                     +---------+----------+
          |                                               |
          |                                               | 3. AsyncIterator[ChatCompletionChunk]
          |                                               v
          | 4. SSE chunk: data: {"token": "The"}          |
          |<----------------------------------------------+
          | 5. SSE chunk: data: {"token": " quick"}       |
          |<----------------------------------------------+
          | 6. SSE chunk: data: [DONE]                    |
          |<----------------------------------------------+`,
		explanation: `When querying large language models, generating an answer takes anywhere from 3 to 30 seconds depending on output length.

If a web endpoint blocks until the entire completion finishes, the user stares at a blank loading spinner for the entire duration (huge Time to First Token / TTFT). In legacy WSGI frameworks, each streaming client pins an operating system thread for the entire 30 seconds, leading to rapid thread exhaustion at moderate traffic.

Quart handles streaming via native Python async generator functions:
1. The generator function yields string chunks piece-by-piece as AsyncOpenAI sends them over non-blocking sockets.
2. No complex wrapper functions (like Flask's 'stream_with_context') are needed because Quart's context is natively task-local via Python 'contextvars'.
3. Proper headers ('X-Accel-Buffering: no', 'Cache-Control: no-cache') instruct upstream proxies like Nginx or Cloudflare not to buffer packets, ensuring immediate browser delivery.`,
		keyConcepts: [
			{
				name: 'Quart Native Async Generator Response',
				description:
					'Quart accepts native async generators directly in Response(generate(), mimetype="text/event-stream") without requiring outer context wrappers or thread pinning.'
			},
			{
				name: 'Server-Sent Events (SSE) Protocol',
				description:
					'A lightweight HTTP standard using Content-Type: text/event-stream where each message is formatted with "data: <json>\\n\\n" and terminated with "data: [DONE]\\n\\n".'
			},
			{
				name: 'Reverse-Proxy Buffering Bypass',
				description:
					'Sending header "X-Accel-Buffering: no" ensures Nginx forwards each SSE byte chunk immediately instead of waiting for a 4KB internal buffer to fill.'
			},
			{
				name: 'The No-DB Streaming Proxy Dilemma (Flask vs. Quart)',
				description:
					'In a pure AI streaming service without a relational database or ORM, Quart completely eliminates async Python friction. You avoid Flask’s stream_with_context context gymnastics while gaining native async generators, AsyncOpenAI integration, and cooperative event loop scheduling.'
			}
		]
	},
	comparisons: [
		{
			title: 'Blocking Response vs. Quart ASGI SSE Streaming',
			description:
				'Observe the dramatic difference in user experience between waiting for full generation vs. real-time token streaming.',
			leftTitle: 'Naive Blocking Endpoint (High TTFT, Bad UX)',
			leftLanguage: 'python',
			leftCode: `from quart import Blueprint, request, jsonify, current_app
from openai import AsyncOpenAI

chat_bp = Blueprint("chat", __name__)

@chat_bp.post("/ask")
async def ask():
    data = await request.get_json() or {}
    prompt = data.get("prompt", "")
    client: AsyncOpenAI = current_app.extensions["async_openai_client"]

    # Problem: Waits for 10-25 seconds before returning!
    # User sees zero progress until entire answer is fully finished.
    response = await client.chat.completions.create(
        model="gemma-4-e4b-it",
        messages=[{"role": "user", "content": prompt}]
    )

    full_answer = response.choices[0].message.content
    return jsonify({"answer": full_answer})`,
			rightTitle: 'Modern Quart (Native Async Generator & SSE)',
			rightLanguage: 'python',
			rightCode: `from quart import Blueprint, Response, request, current_app
from openai import AsyncOpenAI
import json

chat_bp = Blueprint("chat", __name__)

@chat_bp.post("/stream")
async def stream_chat():
    data = await request.get_json() or {}
    prompt = data.get("prompt", "")
    client: AsyncOpenAI = current_app.extensions["async_openai_client"]

    # Solution: Native async generator without stream_with_context!
    # Non-blocking event loop coroutine yields control on each token chunk.
    async def generate():
        response_stream = await client.chat.completions.create(
            model="gemma-4-e4b-it",
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )
        async for chunk in response_stream:
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
            "X-Accel-Buffering": "no", # Prevents Nginx from buffering stream
            "Connection": "keep-alive"
        }
    )`
		},
		{
			title: 'Flask (stream_with_context) vs. Quart (Native Async Generator)',
			description:
				'Contrast Flask’s synchronous generator requiring stream_with_context wrappers against Quart’s native ASGI async generator returning Response directly.',
			leftTitle: 'Flask WSGI (stream_with_context & Sync Generator)',
			leftLanguage: 'python',
			leftCode: `from flask import Blueprint, Response, stream_with_context, request, current_app
from openai import OpenAI
import json

chat_bp = Blueprint("chat", __name__)

@chat_bp.post("/stream")
def stream_chat():
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "")
    client: OpenAI = current_app.extensions["openai_client"]

    # Problem: Synchronous generator blocks 1 OS thread per stream.
    # Must wrap in stream_with_context() so request/g locals don't detach.
    def generate():
        response_stream = client.chat.completions.create(
            model="gemma-4-e4b-it",
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )
        for chunk in response_stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                payload = json.dumps({"token": delta})
                yield f"data: {payload}\\n\\n"
        yield "data: [DONE]\\n\\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )`,
			rightTitle: 'Quart ASGI (Native Async Generator & Zero Wrappers)',
			rightLanguage: 'python',
			rightCode: `from quart import Blueprint, Response, request, current_app
from openai import AsyncOpenAI
import json

chat_bp = Blueprint("chat", __name__)

@chat_bp.post("/stream")
async def stream_chat():
    data = await request.get_json() or {}
    prompt = data.get("prompt", "")
    client: AsyncOpenAI = current_app.extensions["async_openai_client"]

    # Solution: Native async generator without stream_with_context!
    # Non-blocking event loop coroutine yields control on each token chunk.
    async def generate():
        response_stream = await client.chat.completions.create(
            model="gemma-4-e4b-it",
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )
        async for chunk in response_stream:
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
    )`
		}
	],
	codeSnippets: [
		{
			id: 'quart-openai-client',
			title: 'Thread-Safe Pooled AsyncOpenAI Client Factory for Quart',
			filePath: 'app/core/openai_client.py',
			description:
				'Thread-safe AsyncOpenAI client instance with timeouts and retry policies stored in Quart app extensions.',
			language: 'python',
			code: `from openai import AsyncOpenAI
from app.config import settings

def create_async_openai_client() -> AsyncOpenAI:
    """Creates a non-blocking AsyncOpenAI client stored in current_app.extensions."""
    return AsyncOpenAI(
        api_key=settings.llm.api_key.get_secret_value(),
        timeout=settings.llm.request_timeout,
        max_retries=3
    )`,
			runnable: true
		},
		{
			id: 'conversation-memory-manager',
			title: 'Sliding-Window Conversation Buffer with Pydantic',
			filePath: 'app/services/conversation.py',
			description: 'Memory manager enforcing token limits and structured message validation.',
			language: 'python',
			code: `from typing import Literal
from pydantic import BaseModel, Field

class Message(BaseModel):
    role: Literal["system", "user", "assistant", "tool"]
    content: str
    tool_call_id: str | None = None

class ConversationBuffer:
    def __init__(self, system_prompt: str, max_history_messages: int = 10) -> None:
        self.system_message = Message(role="system", content=system_prompt)
        self.history: list[Message] = []
        self.max_history = max_history_messages

    def add_user_message(self, content: str) -> None:
        self.history.append(Message(role="user", content=content))
        self._trim_if_needed()

    def add_assistant_message(self, content: str) -> None:
        self.history.append(Message(role="assistant", content=content))
        self._trim_if_needed()

    def _trim_if_needed(self) -> None:
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]

    def to_openai_payload(self) -> list[dict[str, str]]:
        messages = [self.system_message] + self.history
        return [m.model_dump(exclude_none=True) for m in messages]`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Quart Streaming Async Test Suite with pytest-asyncio',
		testFilePath: 'tests/test_streaming_blueprint.py',
		command: 'pytest -v tests/test_streaming_blueprint.py',
		executionTimeSec: 0.58,
		testCode: `import pytest
from unittest.mock import AsyncMock, MagicMock
from app import create_app
from app.services.conversation import ConversationBuffer

@pytest.fixture
def app():
    app = create_app()
    app.config.update({"TESTING": True})
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_conversation_buffer_trims_correctly():
    buf = ConversationBuffer(system_prompt="System instructions.", max_history_messages=4)
    for i in range(10):
        buf.add_user_message(f"Message {i}")

    payload = buf.to_openai_payload()
    # 1 system message + 4 trimmed messages = 5
    assert len(payload) == 5
    assert payload[0]["role"] == "system"
    assert payload[-1]["content"] == "Message 9"
    assert payload[1]["content"] == "Message 6"

@pytest.mark.asyncio
async def test_streaming_endpoint_sse_headers(client, app, mocker):
    mock_chunk1 = MagicMock()
    mock_chunk1.choices = [MagicMock(delta=MagicMock(content="Hello"))]
    mock_chunk2 = MagicMock()
    mock_chunk2.choices = [MagicMock(delta=MagicMock(content=" world"))]

    async def mock_stream():
        yield mock_chunk1
        yield mock_chunk2

    mock_client = mocker.AsyncMock()
    mock_client.chat.completions.create.return_value = mock_stream()
    app.extensions["async_openai_client"] = mock_client

    res = await client.post("/api/chat/stream", json={"prompt": "Say hello"})
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["Content-Type"]
    assert res.headers["X-Accel-Buffering"] == "no"
    
    # Verify yielded SSE chunks
    text_data = (await res.get_data()).decode("utf-8")
    assert 'data: {"token": "Hello"}' in text_data
    assert 'data: {"token": " world"}' in text_data
    assert 'data: [DONE]' in text_data`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.14.7, pytest-9.1.1, pluggy-1.7.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: mock-3.17.0, cov-7.1.0, asyncio-1.4.1
collected 2 items

tests/test_streaming_blueprint.py::test_conversation_buffer_trims_correctly PASSED [ 50%]
tests/test_streaming_blueprint.py::test_streaming_endpoint_sse_headers PASSED [100%]

---------- coverage: platform win32, python 3.14.7 -----------
Name                            Stmts   Miss  Cover   Missing
-------------------------------------------------------------
app/blueprints/chat.py             21      0   100%
app/core/openai_client.py          14      0   100%
app/services/conversation.py       22      0   100%
-------------------------------------------------------------
TOTAL                              57      0   100%

============================== 2 passed in 0.58s ===============================`,
		coverage: {
			files: [
				{ name: 'app/blueprints/chat.py', stmts: 21, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/core/openai_client.py', stmts: 14, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/services/conversation.py', stmts: 22, miss: 0, cover: '100%', missing: '' }
			],
			total: { stmts: 57, miss: 0, cover: '100%' }
		},
		summary:
			'All 2 tests passed. 100% coverage on Quart native async generator SSE endpoint and memory buffers.'
	},
	interactiveComponent: 'chat'
};
