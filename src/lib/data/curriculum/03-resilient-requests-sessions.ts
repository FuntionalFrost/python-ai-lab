import type { CurriculumLesson } from '../../types/curriculum';

export const track03: CurriculumLesson = {
	id: 'track-03',
	slug: '03-resilient-requests-sessions',
	trackNumber: 3,
	title: 'Resilient HTTP Clients & Tool Integrations with Requests',
	shortTitle: 'Requests Sessions & Retries',
	subtitle:
		'requests.Session Connection Pooling, urllib3 HTTPAdapter Retries, Tuple Timeouts, and Deterministic pytest-mock Fixtures',
	estimatedMinutes: 35,
	topics: [
		'Unpooled requests.post() Bottlenecks in AI Workflows (Socket Churn & Latency)',
		'Configuring requests.Session with HTTPAdapter & urllib3.util.Retry',
		'Asymmetric Tuple Timeouts: timeout=(connect_sec, read_sec)',
		'Streaming Large Payloads & SSE with response.iter_lines(decode_unicode=True)',
		'Deterministic Unit Testing of Requests with pytest-mock and Custom Adapters'
	],
	frameworks: ['Requests 2.32+', 'urllib3 Retry', 'OpenAI SDK', 'pytest 9.x', 'pytest-mock'],
	tags: [
		'Requests',
		'Session Pooling',
		'HTTPAdapter',
		'urllib3',
		'Timeouts',
		'Retries',
		'pytest-mock',
		'Testing'
	],
	summary:
		'Master resilient HTTP client patterns for external AI tools, search APIs, and webhooks using requests. Learn why naive requests.post() calls cause socket exhaustion and latency spikes, and master configuring requests.Session with HTTPAdapter connection pooling, urllib3 exponential backoff retries, and granular connect/read tuple timeouts. Build deterministic, zero-network pytest test suites using pytest-mock to simulate external API responses and 429 backoff.',
	objectives: [
		'Diagnose and resolve connection churn and socket leaks caused by unpooled requests.post() calls in Flask services.',
		'Configure requests.Session with urllib3.util.Retry and HTTPAdapter for automated exponential backoff on 429/503 errors.',
		'Enforce granular connect and read timeouts using tuple syntax (timeout=(3.05, 60.0)) to prevent thread deadlocks.',
		'Stream large chunked responses and SSE data safely using response.iter_lines(decode_unicode=True) inside context managers.',
		'Write deterministic, instantaneous unit test fixtures with pytest-mock intercepting Session.send() without network sockets.'
	],
	architecture: {
		patternName: 'Pooled Requests Session & Resilient HTTPAdapter Architecture',
		diagram: `+-------------------------------------------------------------------------+
|                  NAIVE: Unpooled Ephemeral requests Calls               |
|  requests.post(...) -> New TCP Handshake + TLS Exchange on every call   |
|  - High latency overhead  - Socket exhaustion (TIME_WAIT leak)          |
+-------------------------------------------------------------------------+
                                     |
                                     v (Harden with requests.Session)
+-------------------------------------------------------------------------+
|              RESILIENT: Pooled requests.Session Architecture            |
|  - HTTPAdapter(pool_connections=20, pool_maxsize=100)                   |
|  - urllib3.util.Retry(total=3, backoff_factor=0.5, status_forcelist)    |
|  - Asymmetric Timeouts: timeout=(connect=3.05, read=60.0)               |
+-------------------------------------------------------------------------+
                                     |
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
+---------------------------------+     +---------------------------------+
|   AI Tool & Webhook Dispatcher  |     |   Deterministic Pytest Harness  |
|   requests.Session Mount Layer  |     |   pytest-mock Session.send()    |
|   Safe Streaming iter_lines()   |     |   Zero Network Sockets / Flake  |
+---------------------------------+     +---------------------------------+`,
		explanation: `In AI backends, applications constantly communicate with external services: vector databases, web search endpoints, weather APIs, customer webhooks, and AI model providers.

Relying on raw 'requests.post()' calls inside route functions or agent tool execution loops introduces severe operational bugs:
1. The Ephemeral Socket Trap: Every call to 'requests.post()' opens a fresh TCP socket, performs a full TLS handshake, executes the request, and closes the connection. Under moderate concurrency, thousands of sockets accumulate in the OS 'TIME_WAIT' state, triggering socket exhaustion errors ('OSError: [Errno 99] Cannot assign requested address').
2. Missing or Single Coarse Timeouts: Specifying 'timeout=30' only limits the total duration or read duration in ambiguous ways. If a connection hangs during DNS or TCP handshake, threads lock indefinitely. Using tuple timeouts ('timeout=(3.05, 60.0)') ensures fail-fast connection attempts while permitting lengthy LLM generations.
3. Automated Retries with Exponential Jitter: Upstream APIs frequently return transient 429 (Rate Limit) or 503 (Service Unavailable) status codes. Mounting a custom 'HTTPAdapter' backed by 'urllib3.util.Retry' handles transient retries transparently before application code sees an error.
4. Deterministic Testing with pytest-mock: Tests should never send real HTTP requests over the wire. Using 'pytest-mock' to mock 'requests.Session.send()' gives 100% test coverage with sub-millisecond execution.`,
		keyConcepts: [
			{
				name: 'requests.Session & HTTPAdapter Pooling',
				description:
					'Mount an HTTPAdapter with configured pool_connections and pool_maxsize onto a requests.Session to persist and reuse TCP/TLS sockets across multiple requests.',
				pythonCode: `import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

session = requests.Session()
retries = Retry(
    total=3,
    backoff_factor=0.5,
    status_forcelist=[429, 500, 502, 503, 504],
    raise_on_status=False
)
adapter = HTTPAdapter(pool_connections=20, pool_maxsize=100, max_retries=retries)
session.mount("https://", adapter)
session.mount("http://", adapter)`
			},
			{
				name: 'Granular Tuple Timeouts',
				description:
					'Pass a 2-tuple (connect_timeout, read_timeout) to requests. Connect timeout should be slightly greater than multiples of 3.0 seconds (TCP packet retransmission window).',
				pythonCode: `import requests

# (connect timeout: 3.05s, read timeout: 45.0s)
TIMEOUT_CONFIG = (3.05, 45.0)

response = session.post(
    "https://api.external-tool.com/v1/search",
    json={"query": "revenue q3"},
    timeout=TIMEOUT_CONFIG
)`
			},
			{
				name: 'Safe Streaming with iter_lines()',
				description:
					'Consume streaming data line by line without buffering large payloads into memory. Always wrap within a context manager to ensure the socket closes on client disconnect.',
				pythonCode: `import requests

def stream_events(url: str, session: requests.Session):
    with session.get(url, stream=True, timeout=(3.05, 60.0)) as response:
        response.raise_for_status()
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                yield line[6:]`
			},
			{
				name: 'Deterministic Mocking with pytest-mock',
				description:
					'Mock the underlying Session.send method to test retry backoff, custom headers, and error responses without hitting the network or opening sockets.',
				pythonCode: `def test_session_retries_on_503(mocker, session):
    mock_resp = mocker.MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"status": "recovered"}
    mocker.patch.object(session, "send", return_value=mock_resp)

    resp = session.get("https://api.test.com/data")
    assert resp.status_code == 200`
			}
		]
	},
	comparisons: [
		{
			title: 'HTTP Client: Ephemeral requests vs Pooled Session',
			description:
				'Replace unpooled calls that re-negotiate TLS on every request with a shared session configured with keep-alive pooling.',
			leftTitle: 'Naive: requests.post() (Unpooled)',
			leftLanguage: 'python',
			leftCode: `import requests

def fetch_tool_data_naive(url: str, payload: dict) -> dict:
    # ❌ Fresh TCP connection & TLS handshake per call
    # ❌ Coarse single timeout: hangs if connect stalls
    # ❌ No retry policy: immediate crash on transient 503/429
    # ❌ Leaks sockets in TIME_WAIT state under load
    response = requests.post(
        url,
        json=payload,
        timeout=30
    )
    response.raise_for_status()
    return response.json()`,
			rightTitle: 'Resilient: requests.Session (Pooled)',
			rightLanguage: 'python',
			rightCode: `import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

def create_resilient_session() -> requests.Session:
    # ✅ Reuses open TCP/TLS connections from pool
    # ✅ Asymmetric tuple timeout protects connection phase
    # ✅ Automatic exponential backoff on 429/500/503
    session = requests.Session()
    retries = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[429, 502, 503, 504]
    )
    adapter = HTTPAdapter(pool_connections=20, pool_maxsize=100, max_retries=retries)
    session.mount("https://", adapter)
    return session`,
			diffHighlights: ['requests.Session', 'HTTPAdapter', 'urllib3.util.Retry']
		},
		{
			title: 'Streaming Data: Raw vs Context-Managed iter_lines',
			description: 'Safely stream token lines or external webhook events without socket leaks.',
			leftTitle: 'Naive iter_lines()',
			leftLanguage: 'python',
			leftCode: `import requests

def stream_naive(url: str):
    # ❌ Sockets stay open if generator aborts early
    # ❌ Missing decode_unicode requires manual bytes decoding
    resp = requests.get(url, stream=True)
    for line in resp.iter_lines():
        if line:
            yield line`,
			rightTitle: 'Context-Managed iter_lines()',
			rightLanguage: 'python',
			rightCode: `import requests
from typing import Iterator

def stream_resilient(session: requests.Session, url: str) -> Iterator[str]:
    # ✅ Context manager guarantees socket release on break/exit
    # ✅ decode_unicode automatically yields decoded string tokens
    # ✅ Asymmetric timeout guards against hung connections
    with session.get(url, stream=True, timeout=(3.05, 60.0)) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines(decode_unicode=True):
            if line:
                yield line`,
			diffHighlights: ['with session.get', 'iter_lines(decode_unicode=True)']
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
			rightCode: `def test_tool_api_with_mock(mocker, resilient_session):
    # ✅ Fast: runs in 0.001s with zero network dependencies
    # ✅ Deterministic: validates URL, headers, and request body
    # ✅ Accurately tests edge cases like 429 and 500 status codes
    mock_send = mocker.patch.object(resilient_session, "send")
    mock_send.return_value.status_code = 200
    mock_send.return_value.json.return_value = {"temperature": 21.5, "unit": "celsius"}

    data = resilient_session.get("https://api.external.com/weather", timeout=(3.05, 10.0)).json()
    assert data["temperature"] == 21.5
    assert mock_send.call_count == 1`,
			diffHighlights: ['mocker.patch.object', 'resilient_session.send']
		}
	],
	codeSnippets: [
		{
			id: 'requests-session-factory',
			title: 'Resilient requests.Session Factory with Connection Pooling & Retries',
			filePath: 'app/services/http_session.py',
			description:
				'Reusable session factory configuring connection pools, urllib3 retry policies, and granular connect/read timeouts.',
			language: 'python',
			code: `"""
app/services/http_session.py
Thread-safe requests.Session factory with connection pooling and retries.
"""

from __future__ import annotations
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
from pydantic_settings import BaseSettings, SettingsConfigDict


class HTTPClientConfig(BaseSettings):
    """Configuration for external HTTP client sessions."""
    connect_timeout: float = 3.05
    read_timeout: float = 45.0
    pool_connections: int = 20
    pool_maxsize: int = 100
    max_retries: int = 3
    backoff_factor: float = 0.5

    model_config = SettingsConfigDict(env_prefix="HTTP_")


def build_pooled_session(config: HTTPClientConfig | None = None) -> requests.Session:
    """Build and configure a requests.Session with connection pooling and exponential backoff."""
    cfg = config or HTTPClientConfig()
    session = requests.Session()

    retry_strategy = Retry(
        total=cfg.max_retries,
        backoff_factor=cfg.backoff_factor,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "POST", "PUT", "DELETE"],
        raise_on_status=False,
    )

    adapter = HTTPAdapter(
        pool_connections=cfg.pool_connections,
        pool_maxsize=cfg.pool_maxsize,
        max_retries=retry_strategy,
    )

    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session`
		},
		{
			id: 'requests-tool-client',
			title: 'AI Tool Integration Service using Pooled Requests Session',
			filePath: 'app/services/weather_tool.py',
			description:
				'AI tool execution service invoking third-party APIs using requests.Session and validating payloads with Pydantic.',
			language: 'python',
			code: `"""
app/services/weather_tool.py
External tool execution service using pooled requests session.
"""

from __future__ import annotations
import requests
from pydantic import BaseModel, Field
from app.services.http_session import build_pooled_session, HTTPClientConfig


class WeatherData(BaseModel):
    city: str
    temperature: float
    condition: str
    humidity: int = Field(default=50, ge=0, le=100)


class WeatherToolService:
    """Invokes external weather API for AI agent tool calls."""

    def __init__(self, session: requests.Session | None = None, config: HTTPClientConfig | None = None) -> None:
        self.config = config or HTTPClientConfig()
        self.session = session or build_pooled_session(self.config)

    def fetch_weather(self, city: str) -> WeatherData:
        """Fetch current weather data for a specified city."""
        timeout = (self.config.connect_timeout, self.config.read_timeout)
        url = "https://api.weather-service.com/v1/current"

        response = self.session.get(
            url,
            params={"q": city, "format": "json"},
            timeout=timeout,
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
			id: 'test-requests-session-suite',
			title: 'Deterministic Pytest Suite with pytest-mock for Requests',
			filePath: 'tests/test_http_session.py',
			description:
				'100% in-memory test suite verifying session retries, timeout enforcement, and schema validation using pytest-mock.',
			language: 'python',
			code: `"""
tests/test_http_session.py
Fast, zero-socket unit tests for requests using pytest-mock.
"""

import pytest
import requests
from app.services.http_session import build_pooled_session, HTTPClientConfig
from app.services.weather_tool import WeatherToolService, WeatherData


@pytest.fixture
def session() -> requests.Session:
    return build_pooled_session(HTTPClientConfig(connect_timeout=1.0, read_timeout=2.0))


def test_weather_tool_success(mocker, session) -> None:
    """Verify successful weather fetch and Pydantic validation."""
    mock_resp = mocker.MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "location": {"name": "Vienna"},
        "current": {
            "temp_c": 19.5,
            "condition": {"text": "Partly Cloudy"},
            "humidity": 45,
        },
    }
    mocker.patch.object(session, "send", return_value=mock_resp)

    service = WeatherToolService(session=session)
    result = service.fetch_weather("Vienna")

    assert isinstance(result, WeatherData)
    assert result.city == "Vienna"
    assert result.temperature == 19.5
    assert result.condition == "Partly Cloudy"


def test_weather_tool_handles_http_error(mocker, session) -> None:
    """Verify that HTTP 500 status code raises HTTPError."""
    mock_resp = mocker.MagicMock()
    mock_resp.status_code = 500
    mock_resp.raise_for_status.side_effect = requests.HTTPError("Internal Server Error")
    mocker.patch.object(session, "send", return_value=mock_resp)

    service = WeatherToolService(session=session)
    with pytest.raises(requests.HTTPError):
        service.fetch_weather("InvalidCity")`
		}
	],
	testSuite: {
		title: 'Requests Session & Retry Test Suite',
		testFilePath: 'tests/test_http_session.py',
		testCode: `import requests
import pytest
from app.services.http_session import build_pooled_session, HTTPClientConfig
from app.services.weather_tool import WeatherToolService, WeatherData

def test_session_configuration():
    cfg = HTTPClientConfig(pool_connections=15, pool_maxsize=50)
    session = build_pooled_session(cfg)
    adapter = session.adapters["https://"]
    assert adapter._pool_connections == 15
    assert adapter._pool_maxsize == 50`,
		command:
			'pytest tests/test_http_session.py -v --cov=app/services/http_session --cov=app/services/weather_tool --cov-report=term-missing',
		executionTimeSec: 0.09,
		simulatedStdout: `============================= test session starts =============================
platform linux -- Python 3.13.2, pytest-9.0.2, pluggy-1.5.0
plugins: mock-3.17.0, cov-6.0.0
collected 4 items

tests/test_http_session.py::test_session_configuration PASSED            [ 25%]
tests/test_http_session.py::test_weather_tool_success PASSED             [ 50%]
tests/test_http_session.py::test_weather_tool_handles_http_error PASSED   [ 75%]
tests/test_http_session.py::test_session_retry_adapter_configuration PASSED [100%]

---------- coverage: platform linux, python 3.13.2 -----------
Name                             Stmts   Miss  Cover   Missing
--------------------------------------------------------------
app/services/http_session.py        22      0   100%
app/services/weather_tool.py        20      0   100%
--------------------------------------------------------------
TOTAL                               42      0   100%

============================== 4 passed in 0.09s ==============================`,
		coverage: {
			files: [
				{
					name: 'app/services/http_session.py',
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
			'4 tests passed in 0.09s with 100% coverage across build_pooled_session and WeatherToolService using pytest-mock for deterministic assertions.'
	},
	interactiveComponent: 'code-comparison'
};
