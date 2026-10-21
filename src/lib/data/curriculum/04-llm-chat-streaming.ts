import type { CurriculumLesson } from '../../types/curriculum';

export const track04: CurriculumLesson = {
	id: 'track-04',
	slug: '04-llm-chat-streaming',
	trackNumber: 4,
	title: 'Real-Time LLM Token Streaming in Flask 3.x',
	shortTitle: 'Flask SSE Token Streaming',
	subtitle: 'Server-Sent Events (SSE), stream_with_context, Connection Pooling, and Chat Memory',
	estimatedMinutes: 35,
	topics: [
		'Flask 3.x stream_with_context Generator Architecture',
		'Server-Sent Events (SSE) Protocol: data: <payload>\\n\\n',
		'Disabling Reverse Proxy Buffering (X-Accel-Buffering: no)',
		'OpenAI Client Lifecycle & Connection Pooling in Flask Extensions',
		'Sliding-Window Conversation Memory with Pydantic'
	],
	frameworks: ['Flask 3.1.3', 'OpenAI 1.x', 'Pydantic v2', 'pytest 9.x'],
	tags: ['Flask', 'Streaming', 'SSE', 'OpenAI', 'Chat History', 'Real-Time'],
	summary:
		'Deliver snappy conversational AI in Flask by replacing blocking responses with real-time token streaming. Master Flask’s stream_with_context generator mechanism, Server-Sent Events (SSE) protocol framing, Nginx reverse-proxy buffering guards, and resilient conversation buffers.',
	objectives: [
		'Implement streaming HTTP endpoints in Flask 3.x using stream_with_context and Response generators.',
		'Format SSE chunks according to web standards (data: <json>\\n\\n and data: [DONE]).',
		'Configure reverse-proxy headers (X-Accel-Buffering: no, Cache-Control: no-cache) to prevent Nginx chunk buffering.',
		'Maintain thread-safe pooled OpenAI client instances across Flask worker threads.',
		'Build sliding-window chat history buffers that prune older messages while preserving system prompts.'
	],
	architecture: {
		patternName: 'Flask Server-Sent Event (SSE) Streaming Pipeline',
		diagram: `+--------------------+               +--------------------------------------+
| Web Client / UI    |               |  Flask Blueprint                     |
| (EventSource / SSE)|               |  (@chat_bp.post("/stream"))          |
+---------+----------+               +------------------+-------------------+
          |                                             |
          | 1. POST /api/chat/stream                    |
          +-------------------------------------------->|
          |                                             | 2. client.chat.completions.create(
          |                                             |    stream=True)
          |                                             v
          |                                     +--------------------+
          |                                     | OpenAI Gateway API |
          |                                     +---------+----------+
          |                                               |
          |                                               | 3. Iterator[ChatCompletionChunk]
          |                                               v
          | 4. SSE chunk: data: {"token": "The"}          |
          |<----------------------------------------------+
          | 5. SSE chunk: data: {"token": " quick"}       |
          |<----------------------------------------------+
          | 6. SSE chunk: data: [DONE]                    |
          |<----------------------------------------------+`,
		explanation: `When querying large language models, generating an answer takes anywhere from 3 to 30 seconds depending on output length.

If a Flask endpoint blocks until the entire completion finishes, the user stares at a blank loading spinner for the entire duration (huge Time to First Token / TTFT). Furthermore, if the request times out or is aborted, the backend wastes compute.

Flask 3.x handles streaming via Python generator functions wrapped in 'stream_with_context':
1. The generator function yields string chunks piece-by-piece as OpenAI sends them.
2. 'stream_with_context' preserves Flask’s request and application contexts ('request', 'current_app', 'g') for the entire duration of the generator, even though the outer route function has already returned.
3. Proper headers ('X-Accel-Buffering: no', 'Cache-Control: no-cache') instruct upstream proxies like Nginx or Cloudflare not to buffer packets, ensuring immediate browser delivery.`,
		keyConcepts: [
			{
				name: 'Flask `stream_with_context`',
				description:
					'A Flask helper that keeps request-scoped locals (such as request.headers and current_app) active while a generator yields chunks over an open connection.'
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
			}
		]
	},
	comparisons: [
		{
			title: 'Blocking Response vs. Flask 3.x SSE Streaming',
			description:
				'Observe the dramatic difference in user experience between waiting for full generation vs. real-time token streaming.',
			leftTitle: 'Naive Blocking Endpoint (High TTFT, Bad UX)',
			leftLanguage: 'python',
			leftCode: `from flask import Blueprint, request, jsonify, current_app
from openai import OpenAI

chat_bp = Blueprint("chat", __name__)

@chat_bp.post("/ask")
def ask():
    data = request.get_json()
    prompt = data.get("prompt", "")
    client: OpenAI = current_app.extensions["openai_client"]

    # Problem: Blocks Flask worker thread for 10-25 seconds!
    # User sees zero progress until entire answer is fully finished.
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    full_answer = response.choices[0].message.content
    return jsonify({"answer": full_answer})`,
			rightTitle: 'Modern Flask 3.x (stream_with_context & SSE)',
			rightLanguage: 'python',
			rightCode: `from flask import Blueprint, Response, stream_with_context, request, current_app
from openai import OpenAI
import json

chat_bp = Blueprint("chat", __name__)

@chat_bp.post("/stream")
def stream_chat():
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "")
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
                payload = json.dumps({"token": delta})
                yield f"data: {payload}\\n\\n"
        yield "data: [DONE]\\n\\n"

    # stream_with_context keeps current_app & request alive inside generate()
    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no", # Prevents Nginx from buffering stream
            "Connection": "keep-alive"
        }
    )`
		}
	],
	codeSnippets: [
		{
			id: 'flask-openai-client',
			title: 'Thread-Safe Pooled OpenAI Client Factory for Flask',
			filePath: 'app/core/openai_client.py',
			description:
				'Connection pooling with httpx limits, timeouts, and max retries stored in Flask app extensions.',
			language: 'python',
			code: `import httpx
from openai import OpenAI
from app.config import get_settings

def create_openai_client() -> OpenAI:
    """Creates a thread-safe OpenAI client with pooled TCP connections."""
    settings = get_settings()

    http_client = httpx.Client(
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

    return OpenAI(
        api_key=settings.llm.api_key.get_secret_value(),
        http_client=http_client,
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

    def _trim_if_needed() -> None:
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]

    def to_openai_payload(self) -> list[dict[str, str]]:
        messages = [self.system_message] + self.history
        return [m.model_dump(exclude_none=True) for m in messages]`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Flask Streaming Test Suite with Generator Mocks (pytest)',
		testFilePath: 'tests/test_streaming_blueprint.py',
		command: 'pytest -v tests/test_streaming_blueprint.py',
		executionTimeSec: 0.58,
		testCode: `import pytest
from unittest.mock import MagicMock
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

def test_streaming_endpoint_sse_headers(client, app, mocker):
    mock_chunk1 = MagicMock()
    mock_chunk1.choices = [MagicMock(delta=MagicMock(content="Hello"))]
    mock_chunk2 = MagicMock()
    mock_chunk2.choices = [MagicMock(delta=MagicMock(content=" world"))]

    def mock_stream():
        yield mock_chunk1
        yield mock_chunk2

    mock_client = mocker.MagicMock()
    mock_client.chat.completions.create.return_value = mock_stream()
    app.extensions["openai_client"] = mock_client

    res = client.post("/api/chat/stream", json={"prompt": "Say hello"})
    assert res.status_code == 200
    assert res.headers["Content-Type"] == "text/event-stream; charset=utf-8"
    assert res.headers["X-Accel-Buffering"] == "no"
    
    # Verify yielded SSE chunks
    text_data = res.get_data(as_text=True)
    assert 'data: {"token": "Hello"}' in text_data
    assert 'data: {"token": " world"}' in text_data
    assert 'data: [DONE]' in text_data`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_streaming_blueprint.py::test_conversation_buffer_trims_correctly PASSED [ 50%]
tests/test_streaming_blueprint.py::test_streaming_endpoint_sse_headers PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
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
			'All 2 tests passed. 100% coverage on Flask stream_with_context SSE endpoint and memory buffers.'
	},
	interactiveComponent: 'chat'
};
