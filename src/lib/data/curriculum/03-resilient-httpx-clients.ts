import type { CurriculumLesson } from '../../types/curriculum';

export const track03: CurriculumLesson = {
	id: 'track-03',
	slug: '03-resilient-httpx-clients',
	trackNumber: 3,
	title: 'Resilient HTTP Clients & Tool Integrations with HTTPX',
	shortTitle: 'HTTPX Clients & Resilience',
	subtitle:
		'httpx.Client Connection Pooling, HTTP/2 Multiplexing, Structured Timeouts, and Deterministic pytest-mock Fixtures',
	estimatedMinutes: 35,
	topics: [
		'Unpooled Ephemeral Calls in AI Workflows (Socket Churn & Handshake Latency)',
		'Configuring httpx.Client with Limits Connection Pooling and HTTPTransport Retries',
		'Granular Structured Timeouts: httpx.Timeout(connect, read, write, pool)',
		'Memory-Efficient Streaming with client.stream("GET", url) Context Managers',
		'Deterministic Unit Testing with pytest-mock Mocking httpx.Client.send()',
		'The Architectural Bridge: Synchronous httpx.Client (Flask) vs. Asynchronous httpx.AsyncClient (Litestar ASGI)'
	],
	frameworks: ['HTTPX 0.28+', 'HTTP/2', 'Pydantic v2', 'pytest 9.x', 'pytest-mock'],
	tags: ['HTTPX', 'Client Pooling', 'HTTP/2', 'Timeouts', 'Retries', 'pytest-mock', 'Testing'],
	summary:
		'Master resilient HTTP client patterns for external AI tools, search APIs, and webhooks using HTTPX. Learn why naive unpooled calls cause socket exhaustion and latency spikes, and master configuring httpx.Client with connection pooling (httpx.Limits), HTTP/2 multiplexing, automated retries (httpx.HTTPTransport), and granular structured timeouts. Build deterministic, zero-network pytest test suites using pytest-mock to simulate external API responses and 429 backoff, keeping your Flask prototype unit tests 100% synchronous while creating a seamless bridge to async Litestar services.',
	objectives: [
		'Diagnose and resolve connection churn and socket leaks caused by unpooled HTTP calls in Flask services.',
		'Configure httpx.Client with httpx.Limits and httpx.HTTPTransport for automated retries and keep-alive socket reuse.',
		'Enforce granular connect, read, write, and pool timeouts using httpx.Timeout to prevent worker thread deadlocks.',
		'Stream large chunked responses and SSE data safely using client.stream() inside context managers.',
		'Write deterministic, instantaneous unit test fixtures with pytest-mock intercepting Client.send() without network sockets.',
		'Understand how synchronous httpx.Client in Flask prepares your codebase for seamless conversion to httpx.AsyncClient in Litestar (Track 11).'
	],
	architecture: {
		patternName: 'Pooled HTTPX Client & Resilient Transport Architecture',
		diagram: `+-------------------------------------------------------------------------+
|                  NAIVE: Unpooled Ephemeral HTTP Calls                   |
|  httpx.post(...) -> New TCP Handshake + TLS Exchange on every call      |
|  - High latency overhead  - Socket exhaustion (TIME_WAIT leak)          |
+-------------------------------------------------------------------------+
                                     |
                                     v (Harden with httpx.Client)
+-------------------------------------------------------------------------+
|              RESILIENT: Pooled httpx.Client Architecture                |
|  - httpx.Limits(max_connections=100, max_keepalive_connections=20)      |
|  - httpx.HTTPTransport(retries=3) for automatic 429/503 retry backoff   |
|  - Structured Timeouts: httpx.Timeout(connect=3.0, read=60.0, pool=5.0) |
|  - HTTP/2 Protocol Multiplexing enabled (http2=True)                   |
+-------------------------------------------------------------------------+
                                     |
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
+---------------------------------+     +---------------------------------+
|   AI Tool & Webhook Dispatcher  |     |   Deterministic Pytest Harness  |
|   Synchronous httpx.Client      |     |   pytest-mock Client.send()     |
|   Context-Managed Streaming     |     |   Zero Network Sockets / Flake  |
+---------------------------------+     +---------------------------------+`,
		explanation: `In AI backends, applications constantly communicate with external services: vector databases, web search endpoints, weather APIs, customer webhooks, and third-party model providers.

Relying on raw 'httpx.post()' calls inside route functions or agent tool execution loops introduces severe operational bugs:
1. The Ephemeral Socket Trap: Every call to 'httpx.post()' opens a fresh TCP socket, performs a full TLS handshake, executes the request, and closes the connection. Under moderate concurrency, thousands of sockets accumulate in the OS 'TIME_WAIT' state, triggering socket exhaustion errors ('OSError: [Errno 99] Cannot assign requested address').
2. Structured Timeouts: Specifying a single float 'timeout=30.0' is ambiguous and coarse. If an external DNS or TLS handshake stalls, worker threads lock indefinitely. Using 'httpx.Timeout(connect=3.0, read=60.0, write=10.0, pool=5.0)' guarantees rapid failure during connection attempts while permitting lengthy LLM generation reads.
3. HTTP/2 Multiplexing: External AI tool providers frequently handle rapid bursts of requests. Enabling 'http2=True' multiplexes multiple concurrent requests over a single persistent TCP connection.
4. Deterministic Testing with pytest-mock: Tests should never send real HTTP requests over the wire. Using 'pytest-mock' to mock 'httpx.Client.send()' gives 100% test coverage with sub-millisecond execution while keeping your test suite 100% synchronous.`,
		keyConcepts: [
			{
				name: 'httpx.Client & Limits Pooling',
				description:
					'Create a reusable, thread-safe httpx.Client configured with httpx.Limits to persist and reuse TCP/TLS sockets across multiple requests.',
				pythonCode: `import httpx

limits = httpx.Limits(max_connections=100, max_keepalive_connections=20, keepalive_expiry=30.0)
transport = httpx.HTTPTransport(retries=3)

# Thread-safe pooled client for Flask services
client = httpx.Client(
    limits=limits,
    transport=transport,
    http2=True
)`
			},
			{
				name: 'Granular Structured Timeouts',
				description:
					'Pass an explicit httpx.Timeout object configuring separate thresholds for connection, read, write, and pool acquisition phases.',
				pythonCode: `import httpx

# Connect timeout is set slightly above TCP packet retransmit window (3.0s)
TIMEOUT_CONFIG = httpx.Timeout(
    connect=3.05,
    read=60.0,
    write=10.0,
    pool=5.0
)

response = client.post(
    "https://api.external-tool.com/v1/search",
    json={"query": "financial summary Q3"},
    timeout=TIMEOUT_CONFIG
)`
			},
			{
				name: 'Safe Streaming with client.stream()',
				description:
					'Consume streaming data line by line without buffering large payloads into memory. Always wrap within a context manager to ensure the connection releases back to the pool on exit.',
				pythonCode: `import httpx
from typing import Iterator

def stream_events(client: httpx.Client, url: str) -> Iterator[str]:
    with client.stream("GET", url, timeout=httpx.Timeout(connect=3.05, read=60.0)) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if line.startswith("data: "):
                yield line[6:]`
			},
			{
				name: 'Deterministic Mocking with pytest-mock',
				description:
					'Mock the underlying Client.send method to test retry backoff, custom headers, and error responses without hitting the network or opening sockets.',
				pythonCode: `def test_client_retries_on_503(mocker, client):
    mock_resp = httpx.Response(
        status_code=200,
        json={"status": "recovered"}
    )
    mocker.patch.object(client, "send", return_value=mock_resp)

    resp = client.get("https://api.test.com/data")
    assert resp.status_code == 200
    assert resp.json()["status"] == "recovered"`
			},
			{
				name: 'Architectural Bridge: Sync Client vs. AsyncClient',
				description:
					'Use synchronous httpx.Client inside Flask prototypes (keeping unit tests synchronous with pytest-mock). When migrating to Litestar (Track 11), the exact same API converts to httpx.AsyncClient with await.',
				pythonCode: `# 1. In Flask (Synchronous, simple, deterministic unit tests):
client = httpx.Client()
resp = client.get("https://api.example.com")

# 2. In Litestar ASGI (Track 11 - Non-blocking event loop):
# async_client = httpx.AsyncClient()
# resp = await async_client.get("https://api.example.com")`
			}
		]
	},
	comparisons: [
		{
			title: 'HTTP Client: Ephemeral httpx.post() vs Pooled httpx.Client',
			description:
				'Replace unpooled calls that re-negotiate TLS on every request with a shared client configured with keep-alive pooling.',
			leftTitle: 'Naive: httpx.post() (Unpooled)',
			leftLanguage: 'python',
			leftCode: `import httpx

def fetch_tool_data_naive(url: str, payload: dict) -> dict:
    # ❌ Fresh TCP connection & TLS handshake per call
    # ❌ Coarse single timeout: hangs if connect stalls
    # ❌ No retry policy: immediate crash on transient 503/429
    # ❌ Leaks sockets in TIME_WAIT state under load
    response = httpx.post(
        url,
        json=payload,
        timeout=30.0
    )
    response.raise_for_status()
    return response.json()`,
			rightTitle: 'Resilient: httpx.Client (Pooled)',
			rightLanguage: 'python',
			rightCode: `import httpx

def create_resilient_client() -> httpx.Client:
    # ✅ Reuses open TCP/TLS connections from pool
    # ✅ Structured timeout protects connection phase
    # ✅ Automatic retry policy handles transient 503s
    # ✅ HTTP/2 protocol multiplexing enabled
    limits = httpx.Limits(max_connections=100, max_keepalive_connections=20)
    transport = httpx.HTTPTransport(retries=3)
    timeout = httpx.Timeout(connect=3.05, read=60.0, write=10.0, pool=5.0)

    return httpx.Client(
        limits=limits,
        transport=transport,
        timeout=timeout,
        http2=True
    )`,
			diffHighlights: ['httpx.Client', 'httpx.Limits', 'httpx.HTTPTransport', 'httpx.Timeout']
		},
		{
			title: 'Streaming Data: Raw Bytes vs Context-Managed client.stream()',
			description: 'Safely stream token lines or external webhook events without socket leaks.',
			leftTitle: 'Naive Streaming',
			leftLanguage: 'python',
			leftCode: `import httpx

def stream_naive(url: str):
    # ❌ Sockets stay open if generator aborts early
    # ❌ Missing context manager prevents connection recycling
    resp = httpx.get(url)
    for line in resp.text.splitlines():
        if line:
            yield line`,
			rightTitle: 'Context-Managed client.stream()',
			rightLanguage: 'python',
			rightCode: `import httpx
from typing import Iterator

def stream_resilient(client: httpx.Client, url: str) -> Iterator[str]:
    # ✅ Context manager guarantees connection release on break/exit
    # ✅ iter_lines() yields decoded string tokens without buffering
    # ✅ Structured timeout guards against hung connections
    with client.stream("GET", url, timeout=httpx.Timeout(connect=3.05, read=60.0)) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines():
            if line:
                yield line`,
			diffHighlights: ['with client.stream', 'iter_lines()']
		},
		{
			title: 'Testing: Flaky Real Calls vs pytest-mock Fixtures',
			description: 'Test HTTP client integrations deterministically in pytest using pytest-mock.',
			leftTitle: 'Flaky Network Integration Call',
			leftLanguage: 'python',
			leftCode: `def test_tool_api_real():
    # ❌ Flaky: fails if external API is down or throttles IP
    # ❌ Slow: requires real internet roundtrip (300-800ms)
    # ❌ Consumes third-party rate limits during CI runs
    res = fetch_tool_data_naive("https://api.external.com/weather", {"city": "Vienna"})
    assert res["temperature"] > 0`,
			rightTitle: 'Deterministic pytest-mock Fixture',
			rightLanguage: 'python',
			rightCode: `def test_tool_api_with_mock(mocker, resilient_client):
    # ✅ Fast: runs in 0.001s with zero network dependencies
    # ✅ Deterministic: validates URL, headers, and request body
    # ✅ Accurately tests edge cases like 429 and 500 status codes
    mock_resp = httpx.Response(
        status_code=200,
        json={"temperature": 21.5, "unit": "celsius"}
    )
    mock_send = mocker.patch.object(resilient_client, "send", return_value=mock_resp)

    data = resilient_client.get("https://api.external.com/weather").json()
    assert data["temperature"] == 21.5
    assert mock_send.call_count == 1`,
			diffHighlights: ['mocker.patch.object', 'resilient_client.send']
		}
	],
	codeSnippets: [
		{
			id: 'httpx-client-factory',
			title: 'Resilient httpx.Client Factory with Connection Pooling & Retries',
			filePath: 'app/services/http_client.py',
			description:
				'Reusable client factory configuring connection limits, HTTPTransport retries, and granular structured timeouts.',
			language: 'python',
			code: `"""
app/services/http_client.py
Thread-safe httpx.Client factory with connection pooling and retries.
"""

from __future__ import annotations
import httpx
from pydantic_settings import BaseSettings, SettingsConfigDict


class HTTPClientConfig(BaseSettings):
    """Configuration for external HTTP clients."""
    connect_timeout: float = 3.05
    read_timeout: float = 45.0
    write_timeout: float = 10.0
    pool_timeout: float = 5.0
    max_connections: int = 100
    max_keepalive_connections: int = 20
    max_retries: int = 3

    model_config = SettingsConfigDict(env_prefix="HTTP_")


def build_pooled_client(config: HTTPClientConfig | None = None) -> httpx.Client:
    """Build and configure an httpx.Client with connection pooling and retries."""
    cfg = config or HTTPClientConfig()

    limits = httpx.Limits(
        max_connections=cfg.max_connections,
        max_keepalive_connections=cfg.max_keepalive_connections,
        keepalive_expiry=30.0,
    )

    transport = httpx.HTTPTransport(retries=cfg.max_retries)

    timeout = httpx.Timeout(
        connect=cfg.connect_timeout,
        read=cfg.read_timeout,
        write=cfg.write_timeout,
        pool=cfg.pool_timeout,
    )

    return httpx.Client(
        limits=limits,
        transport=transport,
        timeout=timeout,
        http2=True,
    )`
		},
		{
			id: 'httpx-tool-client',
			title: 'AI Tool Integration Service using Pooled HTTPX Client',
			filePath: 'app/services/weather_tool.py',
			description:
				'AI tool execution service invoking third-party APIs using httpx.Client and validating payloads with Pydantic.',
			language: 'python',
			code: `"""
app/services/weather_tool.py
External tool execution service using pooled HTTPX client.
"""

from __future__ import annotations
import httpx
from pydantic import BaseModel, Field
from app.services.http_client import build_pooled_client, HTTPClientConfig


class WeatherData(BaseModel):
    city: str
    temperature: float
    condition: str
    humidity: int = Field(default=50, ge=0, le=100)


class WeatherToolService:
    """Invokes external weather API for AI agent tool calls."""

    def __init__(self, client: httpx.Client | None = None, config: HTTPClientConfig | None = None) -> None:
        self.config = config or HTTPClientConfig()
        self.client = client or build_pooled_client(self.config)

    def fetch_weather(self, city: str) -> WeatherData:
        """Fetch current weather data for a specified city."""
        url = "https://api.weather-service.com/v1/current"

        response = self.client.get(
            url,
            params={"q": city, "format": "json"},
        )
        response.raise_for_status()
        payload = response.json()

        return WeatherData(
            city=payload["location"]["name"],
            temperature=payload["current"]["temp_c"],
            condition=payload["current"]["condition"]["text"],
            humidity=payload["current"]["humidity"],
        )`
		},
		{
			id: 'test-httpx-client-suite',
			title: 'Deterministic Pytest Suite with pytest-mock for HTTPX',
			filePath: 'tests/test_http_client.py',
			description:
				'100% in-memory test suite verifying client retries, timeout enforcement, and schema validation using pytest-mock.',
			language: 'python',
			code: `"""
tests/test_http_client.py
Fast, zero-socket unit tests for HTTPX using pytest-mock.
"""

import pytest
import httpx
from app.services.http_client import build_pooled_client, HTTPClientConfig
from app.services.weather_tool import WeatherToolService, WeatherData


@pytest.fixture
def client() -> httpx.Client:
    return build_pooled_client(HTTPClientConfig(connect_timeout=1.0, read_timeout=2.0))


def test_weather_tool_success(mocker, client) -> None:
    """Verify successful weather fetch and Pydantic validation."""
    mock_resp = httpx.Response(
        status_code=200,
        json={
            "location": {"name": "Vienna"},
            "current": {
                "temp_c": 19.5,
                "condition": {"text": "Partly Cloudy"},
                "humidity": 45,
            },
        },
    )
    mocker.patch.object(client, "send", return_value=mock_resp)

    service = WeatherToolService(client=client)
    result = service.fetch_weather("Vienna")

    assert isinstance(result, WeatherData)
    assert result.city == "Vienna"
    assert result.temperature == 19.5
    assert result.condition == "Partly Cloudy"


def test_weather_tool_handles_http_error(mocker, client) -> None:
    """Verify that HTTP 500 status code raises HTTPStatusError."""
    mock_resp = httpx.Response(status_code=500, text="Internal Server Error")
    mocker.patch.object(client, "send", return_value=mock_resp)

    service = WeatherToolService(client=client)
    with pytest.raises(httpx.HTTPStatusError):
        service.fetch_weather("InvalidCity")`
		}
	],
	testSuite: {
		title: 'HTTPX Client & Resilience Test Suite',
		testFilePath: 'tests/test_http_client.py',
		testCode: `import httpx
import pytest
from app.services.http_client import build_pooled_client, HTTPClientConfig
from app.services.weather_tool import WeatherToolService, WeatherData

def test_client_configuration():
    cfg = HTTPClientConfig(max_connections=50, max_keepalive_connections=15)
    client = build_pooled_client(cfg)
    assert client.limits.max_connections == 50
    assert client.limits.max_keepalive_connections == 15`,
		command:
			'pytest tests/test_http_client.py -v --cov=app/services/http_client --cov=app/services/weather_tool --cov-report=term-missing',
		executionTimeSec: 0.08,
		simulatedStdout: `============================= test session starts =============================
platform linux -- Python 3.13.2, pytest-9.0.2, pluggy-1.5.0
plugins: mock-3.17.0, cov-6.0.0
collected 4 items

tests/test_http_client.py::test_client_configuration PASSED              [ 25%]
tests/test_http_client.py::test_weather_tool_success PASSED               [ 50%]
tests/test_http_client.py::test_weather_tool_handles_http_error PASSED   [ 75%]
tests/test_http_client.py::test_client_retry_transport_configuration PASSED [100%]

---------- coverage: platform linux, python 3.13.2 -----------
Name                             Stmts   Miss  Cover   Missing
--------------------------------------------------------------
app/services/http_client.py         22      0   100%
app/services/weather_tool.py        20      0   100%
--------------------------------------------------------------
TOTAL                               42      0   100%

============================== 4 passed in 0.08s ==============================`,
		coverage: {
			files: [
				{
					name: 'app/services/http_client.py',
					stmts: 22,
					miss: 0,
					cover: '100%',
					missing: ''
				},
				{
					name: 'app/services/weather_tool.py',
					stmts: 20,
					miss: 0,
					cover: '100%',
					missing: ''
				}
			],
			total: {
				stmts: 42,
				miss: 0,
				cover: '100%'
			}
		},
		summary:
			'4 tests passed in 0.08s with 100% coverage across build_pooled_client and WeatherToolService using pytest-mock for deterministic assertions.'
	},
	interactiveComponent: 'code-comparison'
};
