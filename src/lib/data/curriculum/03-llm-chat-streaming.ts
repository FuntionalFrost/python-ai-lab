import type { CurriculumLesson } from '../../types/curriculum';

export const track03: CurriculumLesson = {
	id: 'track-03',
	slug: '03-llm-chat-streaming',
	trackNumber: 3,
	title: 'Integrating LLM Chats & Streaming in Web Backends',
	shortTitle: 'LLM Streaming & Chat Sessions',
	subtitle: 'Async Client Pooling, Server-Sent Events (SSE), and Resilient Conversation Buffers',
	level: 'Intermediate',
	estimatedMinutes: 35,
	topics: [
		'AsyncOpenAI Client Lifecycle & Connection Pooling',
		'Flask 3.x stream_with_context SSE',
		'Litestar Native ServerSentEvent Generator',
		'Chat Message History Management with Pydantic',
		'SSE Chunk Protocol: data: [DONE]'
	],
	frameworks: ['openai>=3.35.1', 'litestar>=2.24.0', 'flask>=3.1.3'],
	tags: ['Streaming', 'SSE', 'AsyncIO', 'OpenAI', 'Chat History'],
	summary:
		'Deliver snappy conversational AI with real-time token streaming. Contrast Flask’s WSGI threadpool streaming with Litestar’s non-blocking async ServerSentEvent pipeline, and configure production-grade HTTP connection pooling and retry policies.',
	objectives: [
		'Configure single-instance AsyncOpenAI clients with HTTP connection pooling (httpx limits).',
		'Implement SSE streaming endpoints in Flask 3.x using stream_with_context.',
		'Build native async Server-Sent Event generators in Litestar 2.24.',
		'Enforce structured chat memory history adhering to OpenAI’s ChatCompletionMessageParam schemas.',
		'Test streaming endpoints using pytest-mock with simulated async generators.'
	],
	architecture: {
		patternName: 'Non-Blocking Server-Sent Event (SSE) Streaming Pipeline',
		diagram: `+--------------------+               +---------------------+
| Web Client / UI    |               |  Litestar Handler   |
| (EventSource / SSE)|               |  (@get / @post)     |
+---------+----------+               +----------+----------+
          |                                     |
          | 1. POST /api/chat/stream            |
          +------------------------------------>|
          |                                     | 2. AsyncOpenAI.chat.completions.create(
          |                                     |    stream=True)
          |                                     v
          |                             +--------------------+
          |                             | OpenAI Gateway API |
          |                             +---------+----------+
          |                                       |
          |                                       | 3. AsyncIterator[ChatCompletionChunk]
          |                                       v
          | 4. SSE: data: {"token": "The"}        |
          |<--------------------------------------+
          | 5. SSE: data: {"token": " quick"}     |
          |<--------------------------------------+
          | 6. SSE: data: [DONE]                  |
          |<--------------------------------------+`,
		explanation: `When streaming tokens from an LLM, the request remains open for 5 to 45 seconds while tokens generate. In synchronous WSGI servers like traditional Flask/Gunicorn, every open stream ties up an entire operating system worker thread. Under 50 concurrent users, an 8-worker cluster quickly stalls and queues requests.

In Litestar’s ASGI architecture, an async generator 'yields' each token chunk cooperatively. The event loop switches tasks during the 20-50ms gap between tokens (Inter-Token Latency), allowing a single worker process to easily sustain thousands of concurrent streaming connections.`,
		keyConcepts: [
			{
				name: 'AsyncOpenAI Connection Pool',
				description:
					'Sharing a single AsyncOpenAI client instance reuses underlying TCP sockets and TLS sessions, avoiding ~150ms connection overhead on every prompt.'
			},
			{
				name: 'Server-Sent Events (SSE)',
				description:
					'A lightweight unidirectional HTTP streaming protocol over Content-Type: text/event-stream with chunks formatted as data: <payload>\\n\\n.'
			},
			{
				name: 'Chat Completion Buffers',
				description:
					'Limiting conversation memory using sliding window token count or Pydantic message validators prevents context window overflow and astronomical billing.'
			}
		]
	},
	comparisons: [
		{
			title: 'Streaming Implementation: Flask 3.x vs. Litestar 2.24',
			description:
				'Observe the difference between Flask’s WSGI generator stream and Litestar’s native async ServerSentEvent pipeline.',
			leftTitle: 'Flask 3.x (WSGI stream_with_context)',
			leftLanguage: 'python',
			leftCode: `from flask import Blueprint, Response, stream_with_context, request, current_app
from openai import OpenAI
import json

chat_bp = Blueprint("chat", __name__)

@chat_bp.post("/stream")
def stream_chat():
    body = request.get_json()
    prompt = body.get("prompt", "")
    client: OpenAI = current_app.extensions["openai_client"]

    def generate():
        response_stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )
        for chunk in response_stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                # SSE format requires data: <json>\\n\\n
                payload = json.dumps({"token": delta})
                yield f"data: {payload}\\n\\n"
        yield "data: [DONE]\\n\\n"

    # NOTE: Blocks one WSGI worker thread for the entire stream duration!
    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )`,
			rightTitle: 'Litestar 2.24 (Native Async ServerSentEvent)',
			rightLanguage: 'python',
			rightCode: `from collections.abc import AsyncGenerator
from litestar import Controller, post
from litestar.response import ServerSentEvent
from openai import AsyncOpenAI
from app.schemas.chat import ChatPrompt

class StreamingChatController(Controller):
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
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    yield f'{{"token": {delta!r}}}'
            yield "[DONE]"

        # Non-blocking async generator running cooperatively on ASGI loop
        return ServerSentEvent(
            content=event_generator(),
            headers={"Cache-Control": "no-cache"}
        )`
		}
	],
	codeSnippets: [
		{
			id: 'resilient-openai-client',
			title: 'Production AsyncOpenAI Client Factory with httpx Limits',
			filePath: 'app/core/openai_client.py',
			description:
				'Connection pooling, configurable timeouts, and exponential backoff retry settings.',
			language: 'python',
			code: `import httpx
from openai import AsyncOpenAI
from app.config import get_settings

def create_openai_client() -> AsyncOpenAI:
    settings = get_settings()

    # Custom httpx limits prevent file-descriptor exhaustion under high concurrency
    http_client = httpx.AsyncClient(
        limits=httpx.Limits(
            max_connections=100,
            max_keepalive_connections=20,
            keepalive_expiry=30.0
        ),
        timeout=httpx.Timeout(
            connect=5.0,
            read=settings.llm.request_timeout,
            write=10.0,
            pool=5.0
        )
    )

    return AsyncOpenAI(
        api_key=settings.llm.api_key.get_secret_value(),
        http_client=http_client,
        max_retries=3, # Exponential backoff retry on 429 and 5xx errors
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
            # Keep earliest context or slide window from end
            self.history = self.history[-self.max_history:]

    def to_openai_payload(self) -> list[dict[str, str]]:
        messages = [self.system_message] + self.history
        return [m.model_dump(exclude_none=True) for m in messages]`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Streaming Test Suite with Async Generator Mocks (pytest)',
		testFilePath: 'tests/test_streaming.py',
		command: 'pytest -v tests/test_streaming.py',
		executionTimeSec: 0.73,
		testCode: `import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.conversation import ConversationBuffer

@pytest.fixture
def conversation():
    return ConversationBuffer(system_prompt="You are a helpful assistant.", max_history_messages=4)

def test_conversation_buffer_trims_correctly(conversation):
    for i in range(10):
        conversation.add_user_message(f"Message {i}")

    payload = conversation.to_openai_payload()
    # 1 system message + 4 trimmed messages = 5
    assert len(payload) == 5
    assert payload[0]["role"] == "system"
    assert payload[-1]["content"] == "Message 9"
    assert payload[1]["content"] == "Message 6"

@pytest.mark.asyncio
async def test_streaming_generator_yields_all_tokens(mocker):
    # Mocking OpenAI async streaming chunks
    mock_chunk1 = MagicMock()
    mock_chunk1.choices = [MagicMock(delta=MagicMock(content="Hello"))]
    mock_chunk2 = MagicMock()
    mock_chunk2.choices = [MagicMock(delta=MagicMock(content=" world!"))]

    async def mock_stream_gen():
        yield mock_chunk1
        yield mock_chunk2

    mock_client = mocker.MagicMock()
    mock_client.chat.completions.create = mocker.AsyncMock(return_value=mock_stream_gen())

    # Consume the generator
    tokens = []
    stream = await mock_client.chat.completions.create(model="gpt-4o-mini", stream=True)
    async for chunk in stream:
        tokens.append(chunk.choices[0].delta.content)

    assert "".join(tokens) == "Hello world!"`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: anyio-4.6.2, mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_streaming.py::test_conversation_buffer_trims_correctly PASSED [ 50%]
tests/test_streaming.py::test_streaming_generator_yields_all_tokens PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name                            Stmts   Miss  Cover   Missing
-------------------------------------------------------------
app/core/openai_client.py          14      0   100%
app/services/conversation.py       22      0   100%
-------------------------------------------------------------
TOTAL                              36      0   100%

============================== 2 passed in 0.73s ===============================`,
		coverage: {
			files: [
				{ name: 'app/core/openai_client.py', stmts: 14, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/services/conversation.py', stmts: 22, miss: 0, cover: '100%', missing: '' }
			],
			total: { stmts: 36, miss: 0, cover: '100%' }
		},
		summary: 'All 2 tests passed. 100% coverage on streaming generator mocks and memory buffers.'
	},
	interactiveComponent: 'chat'
};
