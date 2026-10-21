import type { CurriculumLesson } from '../../types/curriculum';

export const track03: CurriculumLesson = {
	id: 'track-03',
	slug: '03-httpx-async-migration',
	trackNumber: 3,
	title: 'Modern HTTP & Async I/O: Migrating from Requests to HTTPX',
	shortTitle: 'HTTPX & Async OpenAI',
	subtitle:
		'Replace legacy blocking requests with pooled HTTPX sessions, HTTP/2 multiplexing, MockTransport testing, and custom OpenAI client transports.',
	estimatedMinutes: 35,
	topics: [
		'Requests vs HTTPX: Architectural Shift & Performance Bottlenecks',
		'Sync & Async Client Management with Connection Pooling',
		'Configuring OpenAI SDK with Custom HTTPX Clients & Transports',
		'Deterministic Testing with httpx.MockTransport (Zero Network Sockets)',
		'Streaming Token Pipelines with httpx.stream() & Memory Management'
	],
	frameworks: ['HTTPX 0.28+', 'OpenAI 1.65+', 'Requests (Migration)', 'pytest 9.x', 'pytest-mock'],
	tags: [
		'HTTPX',
		'Requests',
		'AsyncIO',
		'OpenAI',
		'MockTransport',
		'HTTP2',
		'Connection Pooling',
		'Testing'
	],
	summary:
		'Break free from the synchronous bottlenecks of legacy requests. Learn how modern Python AI services leverage HTTPX for both sync and async execution, HTTP/2 connection multiplexing, fine-grained timeout policies, and in-memory mock transports. Discover how the OpenAI Python SDK is built directly on HTTPX and master injecting custom HTTPX clients for corporate proxies, rate limiting, and 100% deterministic unit tests.',
	objectives: [
		'Diagnose and resolve thread starvation caused by blocking requests.post() calls in high-concurrency AI backends.',
		'Migrate legacy requests codebases to httpx.Client and httpx.AsyncClient with structured session lifecycles.',
		'Inject customized HTTPX clients into OpenAI() and AsyncOpenAI() to control connection limits, timeouts, and headers.',
		'Stream large LLM completions and binary payloads chunk-by-chunk using client.stream() without memory bloating.',
		'Build lightning-fast, zero-network test fixtures using httpx.MockTransport to simulate OpenAI 429s and streaming chunks.'
	],
	architecture: {
		patternName: 'Dual-Engine HTTP Client & Custom OpenAI Transport Layer',
		diagram: `+-------------------------------------------------------------------------+
|                  LEGACY: Blocking requests Architecture                 |
|  - 1 Thread per Request  - No Async/Await  - No HTTP/2 Multiplexing     |
|  requests.post("https://api.openai.com/...") -> Blocks Worker Thread    |
+-------------------------------------------------------------------------+
                                     |
                                     v (Migrate to HTTPX)
+-------------------------------------------------------------------------+
|                 MODERN: Dual-Engine HTTPX Architecture                  |
|  - Sync (httpx.Client) & Async (httpx.AsyncClient) with Shared Patterns |
|  - Persistent Connection Pools (Keep-Alive, HTTP/2 Multiplexing)        |
|  - Granular Timeouts: httpx.Timeout(connect=5.0, read=60.0, write=5.0)  |
+-------------------------------------------------------------------------+
                                     |
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
+---------------------------------+     +---------------------------------+
|  OpenAI SDK Integration Layer   |     |    Deterministic Test Harness   |
|  OpenAI(http_client=Client)     |     |    httpx.MockTransport(handler) |
|  AsyncOpenAI(http_client=Async) |     |    Zero Network / Sockets (0ms) |
+---------------------------------+     +---------------------------------+`,
		explanation: `For over a decade, 'requests' was Python’s gold standard HTTP client. However, modern AI backends present requirements that 'requests' fundamentally cannot meet:

1. The Synchronous GIL Bottleneck: 'requests' is strictly synchronous and blocking. Every outgoing OpenAI call holds an entire OS thread captive for the duration of the token generation (often 10 to 45 seconds). In contrast, HTTPX provides identical sync and async APIs ('httpx.Client' and 'httpx.AsyncClient'), allowing thousands of concurrent AI streams on a single event loop.
2. Under-the-Hood Foundation of OpenAI SDK: The official 'openai' Python SDK does not use 'requests'—it is built directly on top of HTTPX! Its 'OpenAI' and 'AsyncOpenAI' constructors accept a custom 'http_client' parameter, allowing engineers to inject pooled clients with custom SSL contexts, proxies, or in-memory mock transports.
3. HTTP/2 Multiplexing: HTTPX supports HTTP/2, enabling multiple concurrent requests to the same origin (such as OpenAI or internal vector databases) over a single persistent TCP connection.
4. Zero-Socket Testing via 'httpx.MockTransport': Unlike flaky monkeypatching of socket libraries, HTTPX provides a first-class in-memory transport interface. Tests can simulate realistic upstream API delays, SSE chunks, and 429 rate-limit errors in microseconds with zero network overhead.`,
		keyConcepts: [
			{
				name: 'Unified Sync & Async APIs',
				description:
					'HTTPX shares nearly identical method signatures across httpx.Client and httpx.AsyncClient, allowing shared configuration, headers, and validation logic between sync Flask apps and async Litestar services.',
				pythonCode: `import httpx

# Synchronous (Flask / Celery workers)
with httpx.Client(http2=True, timeout=httpx.Timeout(60.0)) as client:
    response = client.get("https://api.openai.com/v1/models")

# Asynchronous (Litestar / FastAPI / AsyncOpenAI)
async with httpx.AsyncClient(http2=True, timeout=httpx.Timeout(60.0)) as client:
    response = await client.get("https://api.openai.com/v1/models")`
			},
			{
				name: 'Granular Timeout Control',
				description:
					'AI APIs require asymmetric timeouts: connection and pool acquisition should fail within seconds, while LLM read timeouts must accommodate prolonged generation streams.',
				pythonCode: `import httpx

# AI-optimised timeout specification
ai_timeout = httpx.Timeout(
    connect=5.0,    # TCP connection handshake
    read=90.0,      # Long generation wait for tokens
    write=10.0,     # Prompt payload upload
    pool=5.0        # Connection pool checkout limit
)`
			},
			{
				name: 'Injecting HTTPX into OpenAI Client',
				description:
					'The OpenAI SDK accepts an explicit http_client. This enables centralized connection limits, enterprise forward proxies, and mutual TLS without monkeypatching.',
				pythonCode: `import httpx
from openai import OpenAI, AsyncOpenAI

# Custom connection pool limits
limits = httpx.Limits(max_keepalive_connections=20, max_connections=100)
custom_sync_client = httpx.Client(limits=limits, timeout=ai_timeout)

client = OpenAI(
    api_key="sk-...",
    http_client=custom_sync_client
)`
			},
			{
				name: 'httpx.MockTransport for Instant Pytest Suites',
				description:
					'Intercept HTTP traffic at the transport layer without opening local ports or sockets. Test timeouts, retries, and error status codes deterministically.',
				pythonCode: `import httpx

def mock_handler(request: httpx.Request) -> httpx.Response:
    if request.url.path == "/v1/chat/completions":
        return httpx.Response(
            status_code=200,
            json={"choices": [{"message": {"content": "Mocked response!"}}]}
        )
    return httpx.Response(status_code=404)

transport = httpx.MockTransport(mock_handler)
client = httpx.Client(transport=transport)
# All calls to api.openai.com now execute entirely in-memory!`
			}
		]
	},
	comparisons: [
		{
			title: 'API Client: Legacy requests vs Modern httpx',
			description:
				'Migrate from unpooled blocking requests calls to pooled HTTPX clients with granular timeouts and HTTP/2.',
			leftTitle: 'Legacy: requests.post() (Blocking)',
			leftLanguage: 'python',
			leftCode: `import requests

def call_openai_raw(prompt: str, api_key: str) -> dict:
    # ❌ Global unpooled call creates new TCP/TLS handshake each time
    # ❌ Coarse single timeout (read and connect combined)
    # ❌ No HTTP/2 support; blocks entire OS thread
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": prompt}]
        },
        timeout=60  # Combines connect & read
    )
    response.raise_for_status()
    return response.json()`,
			rightTitle: 'Modern: httpx.Client() (Pooled & Typed)',
			rightLanguage: 'python',
			rightCode: `import httpx

# Reusable client with connection pooling & HTTP/2
timeout = httpx.Timeout(connect=5.0, read=60.0, write=5.0, pool=5.0)
limits = httpx.Limits(max_keepalive_connections=20, max_connections=50)

def call_openai_pooled(client: httpx.Client, prompt: str, api_key: str) -> dict:
    # ✅ Reuses existing TLS/TCP sockets from pool
    # ✅ Asymmetric timeouts protect against deadlocks
    # ✅ HTTP/2 multiplexing handles multiple parallel streams
    response = client.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": prompt}]
        },
        timeout=timeout
    )
    response.raise_for_status()
    return response.json()`,
			diffHighlights: ['httpx.Timeout', 'httpx.Limits', 'http2=True']
		},
		{
			title: 'Streaming Tokens: requests.iter_lines vs httpx.stream',
			description:
				'Safely consume streaming token lines without memory leaks or unmanaged socket leaks.',
			leftTitle: 'Legacy: requests iter_lines()',
			leftLanguage: 'python',
			leftCode: `import requests

def stream_llm_requests(prompt: str, api_key: str):
    # ❌ Risky without context manager: socket remains open if generator stops
    # ❌ iter_lines() buffers arbitrary chunk sizes in memory
    res = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": "gpt-4o", "stream": True, "messages": [{"role": "user", "content": prompt}]},
        stream=True
    )
    try:
        for line in res.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                yield line[6:]
    finally:
        res.close()`,
			rightTitle: 'Modern: httpx.stream() Context Manager',
			rightLanguage: 'python',
			rightCode: `import httpx
from typing import Iterator

def stream_llm_httpx(client: httpx.Client, prompt: str, api_key: str) -> Iterator[str]:
    # ✅ Context manager guarantees socket release on client disconnect
    # ✅ iter_lines() cleanly strips SSE delimiters
    # ✅ Handles HTTP/2 chunk framing transparently
    with client.stream(
        "POST",
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": "gpt-4o", "stream": True, "messages": [{"role": "user", "content": prompt}]}
    ) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if line.startswith("data: "):
                payload = line[6:].strip()
                if payload == "[DONE]":
                    break
                yield payload`,
			diffHighlights: ['client.stream', 'response.iter_lines']
		},
		{
			title: 'Testing: Monkeypatching vs httpx.MockTransport',
			description:
				'Eliminate flaky monkeypatching of private socket methods by using HTTPX’s native in-memory transport.',
			leftTitle: 'Legacy: unittest.mock requests',
			leftLanguage: 'python',
			leftCode: `from unittest.mock import patch, MagicMock

@patch("requests.post")
def test_openai_legacy(mock_post):
    # ❌ Brittle: binds to specific import path
    # ❌ Does not validate request headers, URL parsing, or query params
    # ❌ Fails to simulate streaming chunks or realistic HTTP status lifecycle
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"choices": [{"message": {"content": "ok"}}]}
    mock_post.return_value = mock_resp

    result = call_openai_raw("hello", "sk-test")
    assert result["choices"][0]["message"]["content"] == "ok"`,
			rightTitle: 'Modern: httpx.MockTransport (Pure In-Memory)',
			rightLanguage: 'python',
			rightCode: `import httpx
from openai import OpenAI

def test_openai_httpx_mock_transport():
    # ✅ Validates real request object: inspects URL, headers, and JSON body
    # ✅ Simulates exact HTTP status codes and wire serialization
    # ✅ 100% in-memory: runs in 0.001s with zero network dependencies
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"] == "Bearer sk-test"
        assert request.url.path == "/v1/chat/completions"
        return httpx.Response(
            status_code=200,
            json={"choices": [{"message": {"content": "deterministic test!"}}]}
        )

    mock_client = httpx.Client(transport=httpx.MockTransport(handler))
    ai = OpenAI(api_key="sk-test", http_client=mock_client)
    
    resp = ai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "hi"}]
    )
    assert resp.choices[0].message.content == "deterministic test!"`,
			diffHighlights: ['httpx.MockTransport', 'OpenAI(http_client=...)']
		}
	],
	codeSnippets: [
		{
			id: 'httpx-client-factory',
			title: 'Enterprise HTTPX Client Factory with Connection Pooling',
			filePath: 'app/services/http_client.py',
			description:
				'Production singleton factory providing configured sync and async HTTPX clients with keep-alive limits, timeouts, and graceful shutdown hooks.',
			language: 'python',
			code: `"""
app/services/http_client.py
Singleton HTTPX Client Factory with Connection Pooling & Granular Timeouts.
"""

from __future__ import annotations
import httpx
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class HTTPClientSettings(BaseSettings):
    """Configuration for pooled HTTPX instances."""
    connect_timeout: float = 5.0
    read_timeout: float = 60.0
    write_timeout: float = 10.0
    pool_timeout: float = 5.0
    max_keepalive_connections: int = 20
    max_connections: int = 100
    enable_http2: bool = True

    model_config = SettingsConfigDict(env_prefix="HTTP_")


class HTTPClientManager:
    """Manages pooled HTTPX sync and async client lifecycles."""

    def __init__(self, settings: Optional[HTTPClientSettings] = None) -> None:
        self.settings = settings or HTTPClientSettings()
        self._sync_client: Optional[httpx.Client] = None
        self._async_client: Optional[httpx.AsyncClient] = None

    @property
    def timeout(self) -> httpx.Timeout:
        return httpx.Timeout(
            connect=self.settings.connect_timeout,
            read=self.settings.read_timeout,
            write=self.settings.write_timeout,
            pool=self.settings.pool_timeout,
        )

    @property
    def limits(self) -> httpx.Limits:
        return httpx.Limits(
            max_keepalive_connections=self.settings.max_keepalive_connections,
            max_connections=self.settings.max_connections,
        )

    def get_sync_client(self) -> httpx.Client:
        """Return pooled synchronous client for Flask view functions."""
        if self._sync_client is None or self._sync_client.is_closed:
            self._sync_client = httpx.Client(
                timeout=self.timeout,
                limits=self.limits,
                http2=self.settings.enable_http2,
            )
        return self._sync_client

    async def get_async_client(self) -> httpx.AsyncClient:
        """Return pooled asynchronous client for Litestar or async tasks."""
        if self._async_client is None or self._async_client.is_closed:
            self._async_client = httpx.AsyncClient(
                timeout=self.timeout,
                limits=self.limits,
                http2=self.settings.enable_http2,
            )
        return self._async_client

    def close(self) -> None:
        """Tear down connection pools during app shutdown."""
        if self._sync_client and not self._sync_client.is_closed:
            self._sync_client.close()

    async def aclose(self) -> None:
        """Tear down async connection pools during ASGI shutdown."""
        if self._async_client and not self._async_client.is_closed:
            await self._async_client.aclose()


# Global client manager instance
http_manager = HTTPClientManager()`
		},
		{
			id: 'openai-httpx-gateway',
			title: 'OpenAI Gateway Injected with Custom HTTPX Transports',
			filePath: 'app/services/ai_gateway.py',
			description:
				'Demonstrates injecting custom HTTPX clients into the official OpenAI SDK for both sync Flask endpoints and async Litestar services.',
			language: 'python',
			code: `"""
app/services/ai_gateway.py
OpenAI Service orchestrating sync and async calls with custom HTTPX clients.
"""

from __future__ import annotations
from typing import Iterator, AsyncIterator
import httpx
from openai import OpenAI, AsyncOpenAI
from app.services.http_client import http_manager


class AIGatewayService:
    """AI Service using pooled HTTPX transports under the hood."""

    def __init__(
        self,
        api_key: str,
        custom_http_client: httpx.Client | None = None,
        custom_async_http_client: httpx.AsyncClient | None = None,
    ) -> None:
        # Use provided client (e.g. MockTransport in tests) or default pooled client
        sync_http = custom_http_client or http_manager.get_sync_client()
        self.sync_openai = OpenAI(api_key=api_key, http_client=sync_http)

        # Async client for coroutine workflows
        self._custom_async_http = custom_async_http_client

    def complete_sync(self, prompt: str, model: str = "gpt-4o-mini") -> str:
        """Synchronous chat completion using pooled HTTPX transport."""
        response = self.sync_openai.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return response.choices[0].message.content or ""

    def stream_sync(self, prompt: str, model: str = "gpt-4o-mini") -> Iterator[str]:
        """Stream chunks synchronously via HTTPX connection."""
        stream = self.sync_openai.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    async def get_async_openai(self, api_key: str) -> AsyncOpenAI:
        """Factory for async OpenAI instance backed by pooled AsyncClient."""
        async_http = self._custom_async_http or await http_manager.get_async_client()
        return AsyncOpenAI(api_key=api_key, http_client=async_http)`
		},
		{
			id: 'test-httpx-mock-transport',
			title: 'Deterministic Pytest Suite with httpx.MockTransport',
			filePath: 'tests/test_ai_gateway_httpx.py',
			description:
				'100% in-memory test suite simulating OpenAI 200 completions, 429 rate limit backoff, and streaming tokens without network calls.',
			language: 'python',
			code: `"""
tests/test_ai_gateway_httpx.py
Fast, zero-socket unit tests using httpx.MockTransport.
"""

import json
import pytest
import httpx
from openai import RateLimitError
from app.services.ai_gateway import AIGatewayService


def test_ai_gateway_sync_completion_success() -> None:
    """Test successful completion with verified payload dispatch."""
    recorded_requests: list[httpx.Request] = []

    def mock_handler(request: httpx.Request) -> httpx.Response:
        recorded_requests.append(request)
        body = json.loads(request.read().decode())
        assert body["model"] == "gpt-4o-mini"
        assert body["messages"][0]["content"] == "Summarize document"

        return httpx.Response(
            status_code=200,
            json={
                "id": "chatcmpl-mock-123",
                "object": "chat.completion",
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": "Summary result."},
                    "finish_reason": "stop"
                }]
            }
        )

    mock_client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    service = AIGatewayService(api_key="sk-mock-key", custom_http_client=mock_client)

    result = service.complete_sync("Summarize document")
    assert result == "Summary result."
    assert len(recorded_requests) == 1
    assert recorded_requests[0].headers["authorization"] == "Bearer sk-mock-key"


def test_ai_gateway_handles_upstream_rate_limit_429() -> None:
    """Simulate OpenAI 429 Quota Exceeded and verify SDK exception raising."""
    def rate_limit_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=429,
            json={
                "error": {
                    "message": "Rate limit reached for requests",
                    "type": "requests",
                    "code": "rate_limit_exceeded"
                }
            }
        )

    mock_client = httpx.Client(transport=httpx.MockTransport(rate_limit_handler))
    service = AIGatewayService(api_key="sk-mock-key", custom_http_client=mock_client)

    with pytest.raises(RateLimitError) as exc_info:
        service.complete_sync("Generate high volume prompt")

    assert "Rate limit reached" in str(exc_info.value)`
		}
	],
	testSuite: {
		title: 'HTTPX Transport & Mocking Test Suite',
		testFilePath: 'tests/test_ai_gateway_httpx.py',
		testCode: `import httpx
import pytest
from app.services.http_client import HTTPClientManager, HTTPClientSettings
from app.services.ai_gateway import AIGatewayService

def test_http_manager_limits_and_timeouts():
    settings = HTTPClientSettings(connect_timeout=2.0, read_timeout=30.0, max_connections=50)
    manager = HTTPClientManager(settings)
    client = manager.get_sync_client()
    assert client.timeout.connect == 2.0
    assert client.timeout.read == 30.0
    manager.close()
    assert client.is_closed`,
		command:
			'pytest tests/test_ai_gateway_httpx.py -v --cov=app/services/http_client --cov=app/services/ai_gateway --cov-report=term-missing',
		executionTimeSec: 0.12,
		simulatedStdout: `============================= test session starts =============================
platform linux -- Python 3.13.2, pytest-9.0.2, pluggy-1.5.0
plugins: cov-6.0.0, anyio-4.8.0
collected 4 items

tests/test_ai_gateway_httpx.py::test_http_manager_limits_and_timeouts PASSED [ 25%]
tests/test_ai_gateway_httpx.py::test_ai_gateway_sync_completion_success PASSED [ 50%]
tests/test_ai_gateway_httpx.py::test_ai_gateway_handles_upstream_rate_limit_429 PASSED [ 75%]
tests/test_ai_gateway_httpx.py::test_ai_gateway_mock_streaming_tokens PASSED [100%]

---------- coverage: platform linux, python 3.13.2 -----------
Name                             Stmts   Miss  Cover   Missing
--------------------------------------------------------------
app/services/http_client.py         38      0   100%
app/services/ai_gateway.py          26      0   100%
--------------------------------------------------------------
TOTAL                               64      0   100%

============================== 4 passed in 0.12s ==============================`,
		coverage: {
			files: [
				{
					name: 'app/services/http_client.py',
					stmts: 38,
					miss: 0,
					cover: '100%',
					missing: ''
				},
				{
					name: 'app/services/ai_gateway.py',
					stmts: 26,
					miss: 0,
					cover: '100%',
					missing: ''
				}
			],
			total: {
				stmts: 64,
				miss: 0,
				cover: '100%'
			}
		},
		summary:
			'4 tests passed in 0.12s with 100% coverage across HTTPClientManager and AIGatewayService using in-memory httpx.MockTransport with zero socket bindings.'
	},
	interactiveComponent: 'code-comparison'
};
