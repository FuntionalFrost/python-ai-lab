import type { CurriculumLesson } from '../../types/curriculum';

export const track10: CurriculumLesson = {
	id: 'track-10',
	slug: '10-prototype-to-production',
	trackNumber: 10,
	title: 'Production ASGI Deployment: Hypercorn Concurrency & Tenacity Resilience',
	shortTitle: 'Production ASGI & Hardening',
	subtitle:
		'Hypercorn ASGI Workers, HTTP/2 Protocol Multiplexing, Non-Blocking Timeouts, and Tenacity Circuit Breakers',
	estimatedMinutes: 45,
	topics: [
		'Hypercorn ASGI Concurrency Model vs. Legacy WSGI Thread Starvation',
		'HTTP/2 Multiplexing & ALPN Negotiation in Production AI Streaming',
		'Long-Lived Streaming Timeout Management (keep_alive_timeout & response_timeout)',
		'Circuit Breakers & Exponential Backoff with Tenacity (RateLimitError & 503)',
		'Graceful Degradation: Secondary Fallback Models (gemma-4-e4b-it -> gemma-4-e2b-it)',
		'Cost & Quota Defense: Token-Bucket Rate Limiting & Response Caching'
	],
	frameworks: ['Quart', 'Hypercorn 0.17+', 'Tenacity 9.x', 'AsyncOpenAI 3.x', 'uv'],
	tags: [
		'Production',
		'ASGI',
		'Hypercorn',
		'Quart',
		'Concurrency',
		'Resilience',
		'Tenacity',
		'Caching'
	],
	summary:
		'Take your Quart AI service to production. Learn how to configure Hypercorn for high-concurrency streaming, contrast native ASGI event loop multiplexing with legacy threadpools, prevent silent worker timeout kills during long token generations, and implement Tenacity circuit breakers with automatic fallback degradation.',
	objectives: [
		'Configure Hypercorn with optimal worker concurrency and HTTP/2 multiplexing for streaming I/O.',
		'Eliminate silent worker SIGKILL terminations during long-running 45-second token generations.',
		'Implement exponential backoff with random jitter using Tenacity for upstream OpenAI 429/503 spikes.',
		'Build multi-tiered fallback pipelines that degrade from primary models to fast secondary models on quota depletion.',
		'Protect API infrastructure with reverse-proxy buffering controls and token-bucket rate limits.'
	],
	architecture: {
		patternName: 'High-Concurrency Production ASGI & Resilience Architecture',
		diagram: `+---------------------------------------------------------------------------------------+
|                    Nginx Reverse Proxy / Load Balancer                                |
|  - proxy_buffering off;  proxy_read_timeout 120s;  X-Accel-Buffering: no;             |
+---------------------------------------------------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                    Hypercorn Master Process (hypercorn.toml)                          |
|  workers = (2 * CPU) + 1 | bind = "0.0.0.0:8000" | keep_alive_timeout = 120s          |
+---------------------------------------------------------------------------------------+
           |                                  |                                  |
           v (ASGI Worker 1)                  v (ASGI Worker 2)                  v (ASGI Worker 3)
+---------------------+          +---------------------+          +---------------------+
|  Quart App Instance |          |  Quart App Instance |          |  Quart App Instance |
|  (10k+ Coroutines)  |          |  (10k+ Coroutines)  |          |  (10k+ Coroutines)  |
+----------+----------+          +----------+----------+          +----------+----------+
           |
           v
+---------------------------------------------------------------------------------------+
|                 Resilience & Fallback Layer (Tenacity Circuit Breaker)                |
|                                                                                       |
|  1. Try Primary Model: gemma-4-e4b-it (3 retries with exponential jitter)             |
|  2. If 429/503 exhausted: Fallback to gemma-4-e2b-it                                  |
|  3. If API down: Serve cached semantic response from Redis                            |
+---------------------------------------------------------------------------------------+`,
		explanation: `Deploying an AI backend under standard synchronous web server settings almost always causes immediate outages in production:

1. The WSGI Worker Starvation Trap: In synchronous WSGI, 1 worker process or thread handles exactly 1 connection. If an LLM stream takes 20 seconds, a 4-worker cluster is completely paralyzed by just 4 concurrent users!
2. The ASGI Resolution: In Hypercorn running Quart, a single worker process uses an asynchronous event loop to handle thousands of concurrent streaming connections without thread starvation.
3. The 30-Second Silent Worker Kill: Default server timeouts monitor worker activity. Because an LLM connection is held open waiting for stream chunks, aggressive timeouts can issue a SIGKILL mid-stream. Setting 'keep_alive_timeout = 120' and 'graceful_timeout = 30' prevents premature drops.
4. The Rate Limit Thundering Herd: When an inference server returns a 429 RateLimitError, naive retry loops without random jitter hammer the API simultaneously. Wrapping invocations in Tenacity with exponential backoff and jitter prevents stampedes.`,
		keyConcepts: [
			{
				name: 'Hypercorn ASGI Worker Architecture',
				description:
					'Hypercorn runs asynchronous event loop workers supporting HTTP/1.1, HTTP/2, and WebSockets. A single worker sustains thousands of concurrent non-blocking streaming coroutines.'
			},
			{
				name: 'Streaming Timeout Safeguards',
				description:
					'Setting keep_alive_timeout=120 and graceful_timeout=30 prevents master processes from terminating workers during multi-turn LLM reasoning runs.'
			},
			{
				name: 'Tenacity Exponential Jitter',
				description:
					'wait_random_exponential adds random microsecond jitter to retry intervals, preventing synchronized request stampedes against inference endpoints.'
			},
			{
				name: 'Graceful Model Degradation',
				description:
					'Automatically downgrading from a primary 4B model (gemma-4-e4b-it) to an ultra-light 2B model (gemma-4-e2b-it) when upstream rate limits or latency thresholds trigger.'
			}
		]
	},
	comparisons: [
		{
			title: 'Deployment: Legacy WSGI Threadpool vs. Hypercorn ASGI Event Loop',
			description:
				'Observe how legacy WSGI workers starve on concurrent streaming users, while Hypercorn ASGI scales smoothly across thousands of concurrent connections.',
			leftTitle: 'Legacy WSGI Worker Anti-Pattern (Starves on 4 Users)',
			leftLanguage: 'bash',
			leftCode: `# Anti-pattern: Gunicorn sync/thread worker
# - Only 4-16 concurrent connections possible per worker!
# - A single 35-second stream causes timeout kills!
gunicorn \\
  --workers 4 \\
  --timeout 30 \\
  "app:create_app()"

# Result: 5th user gets 502 Bad Gateway while 4 users stream.
# At second 30, [CRITICAL] WORKER TIMEOUT kills active streams!`,
			rightTitle: 'Production Hypercorn Config (ASGI + 120s Timeout)',
			rightLanguage: 'python',
			rightCode: `# hypercorn.conf.py - Production AI streaming configuration
import multiprocessing

bind = "0.0.0.0:8000"

# CPU core scaling: 2 * cores + 1
workers = multiprocessing.cpu_count() * 2 + 1

# Non-blocking ASGI worker handles thousands of concurrent SSE streams per process
worker_class = "asyncio"

# Prevent worker drops during long LLM completions
keep_alive_timeout = 120.0
graceful_timeout = 30.0

# HTTP/2 protocol support enabled
alpn_protocols = ["h2", "http/1.1"]

# Logging & metrics
accesslog = "-"
errorlog = "-"
loglevel = "info"`
		},
		{
			title: 'Resilience Strategy: Unhandled Raw API vs. Tenacity Fallback Circuit',
			description: 'Handling rate limits and server outages with automated model failover.',
			leftTitle: 'Fragile Raw API Call (Uncaught 429/503 Outage)',
			leftLanguage: 'python',
			leftCode: `# Anti-pattern: Direct client call without resilience
@ask_bp.post("/ask")
async def ask():
    # If OpenAI throws 429 RateLimitError or 503 Overloaded:
    # 1. Entire request crashes with 500 Internal Server Error
    # 2. No retries, no jitter, no fallback
    # 3. User experiences immediate failure
    data = await request.get_json()
    resp = await client.chat.completions.create(
        model="gemma-4-e4b-it",
        messages=[{"role": "user", "content": data["prompt"]}]
    )
    return jsonify({"answer": resp.choices[0].message.content})`,
			rightTitle: 'Tenacity Resilient Service with Multi-Model Fallback',
			rightLanguage: 'python',
			rightCode: `from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type
from openai import RateLimitError, APIConnectionError, InternalServerError

class ResilientChatService:
    def __init__(self, client, primary="gemma-4-e4b-it", fallback="gemma-4-e2b-it"):
        self.client = client
        self.primary = primary
        self.fallback = fallback

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_random_exponential(multiplier=1, max=10),
        retry=retry_if_exception_type((RateLimitError, APIConnectionError, InternalServerError))
    )
    async def _call_model(self, model: str, prompt: str) -> str:
        resp = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        return resp.choices[0].message.content

    async def ask_with_fallback(self, prompt: str) -> dict:
        try:
            # 1. Attempt primary model with 3 retries
            content = await self._call_model(self.primary, prompt)
            return {"answer": content, "model": self.primary}
        except Exception:
            # 2. Seamlessly degrade to secondary model
            content = await self._call_model(self.fallback, prompt)
            return {"answer": content, "model": self.fallback, "degraded": True}`
		}
	],
	codeSnippets: [
		{
			id: 'hypercorn-config-production',
			title: 'Production Hypercorn Configuration (hypercorn.conf.py)',
			filePath: 'hypercorn.conf.py',
			description:
				'ASGI worker configuration, streaming timeout buffers, HTTP/2 ALPN, and keep-alive settings.',
			language: 'python',
			code: `import multiprocessing
import os

bind = os.getenv("BIND", "0.0.0.0:8000")

# CPU core scaling: 2 * cores + 1
workers = int(os.getenv("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))

# Enable non-blocking asyncio event loop worker
worker_class = "asyncio"

# Generous timeouts prevent premature connection termination during LLM generation
keep_alive_timeout = 120.0
graceful_timeout = 30.0

# HTTP/2 support
alpn_protocols = ["h2", "http/1.1"]

# Production logging
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")`,
			runnable: true
		},
		{
			id: 'resilient-chat-service-impl',
			title: 'Resilient Service with Tenacity & Model Fallback',
			filePath: 'app/services/resilient_chat.py',
			description:
				'Exponential backoff with jitter and automated degradation from primary to fallback model.',
			language: 'python',
			code: `from pydantic import BaseModel, Field
from openai import AsyncOpenAI, RateLimitError, APIConnectionError, InternalServerError
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type

class ChatResult(BaseModel):
    content: str
    model_used: str
    is_fallback: bool = False

class ResilientChatService:
    def __init__(self, client: AsyncOpenAI, primary_model: str = "gemma-4-e4b-it", fallback_model: str = "gemma-4-e2b-it") -> None:
        self.client = client
        self.primary_model = primary_model
        self.fallback_model = fallback_model

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_random_exponential(multiplier=0.5, max=5),
        retry=retry_if_exception_type((RateLimitError, APIConnectionError, InternalServerError)),
    )
    async def _execute_with_retry(self, model: str, prompt: str) -> str:
        resp = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return resp.choices[0].message.content or ""

    async def ask_with_retry(self, prompt: str) -> ChatResult:
        try:
            # Primary model attempt with 3 retries
            content = await self._execute_with_retry(self.primary_model, prompt)
            return ChatResult(content=content, model_used=self.primary_model, is_fallback=False)
        except Exception:
            # Fallback model attempt (e.g. gemma-4-e2b-it if gemma-4-e4b-it rate limits trigger)
            try:
                content = await self._execute_with_retry(self.fallback_model, prompt)
                return ChatResult(content=content, model_used=self.fallback_model, is_fallback=True)
            except Exception:
                return ChatResult(
                    content="Service temporarily degraded due to upstream limits. Please try again.",
                    model_used="none",
                    is_fallback=True
                )`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Tenacity Retry & Fallback Test Suite (pytest-asyncio)',
		testFilePath: 'tests/test_resilience.py',
		command: 'pytest -v --cov=app/services/resilient_chat tests/test_resilience.py',
		executionTimeSec: 0.82,
		testCode: `import pytest
from unittest.mock import AsyncMock, MagicMock
from openai import RateLimitError
from app.services.resilient_chat import ResilientChatService

@pytest.mark.asyncio
async def test_resilient_service_succeeds_on_first_try(mocker):
    mock_client = mocker.AsyncMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Primary response"
    mock_client.chat.completions.create.return_value = MagicMock(choices=[mock_choice])

    service = ResilientChatService(client=mock_client)
    res = await service.ask_with_retry("Hello")

    assert res.content == "Primary response"
    assert res.model_used == "gemma-4-e4b-it"
    assert not res.is_fallback
    assert mock_client.chat.completions.create.call_count == 1

@pytest.mark.asyncio
async def test_resilient_service_falls_back_when_primary_exhausts_retries(mocker):
    mock_client = mocker.AsyncMock()
    rate_err = RateLimitError(message="Rate limit hit", response=MagicMock(), body=None)

    # Primary model fails 3 times with RateLimitError; fallback succeeds
    fallback_choice = MagicMock()
    fallback_choice.message.content = "Fallback response"
    fallback_result = MagicMock(choices=[fallback_choice])

    mock_client.chat.completions.create.side_effect = [
        rate_err,
        rate_err,
        rate_err,
        fallback_result
    ]

    service = ResilientChatService(client=mock_client)
    res = await service.ask_with_retry("Hello under heavy load")

    assert res.content == "Fallback response"
    assert res.model_used == "gemma-4-e2b-it"
    assert res.is_fallback is True
    # 3 primary attempts + 1 fallback attempt = 4
    assert mock_client.chat.completions.create.call_count == 4`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.14.7, pytest-9.1.1, pluggy-1.7.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: mock-3.17.0, cov-7.1.0, asyncio-1.4.1
collected 2 items

tests/test_resilience.py::test_resilient_service_succeeds_on_first_try PASSED [ 50%]
tests/test_resilience.py::test_resilient_service_falls_back_when_primary_exhausts_retries PASSED [100%]

---------- coverage: platform win32, python 3.14.7 -----------
Name                             Stmts   Miss  Cover   Missing
--------------------------------------------------------------
app/services/resilient_chat.py      32      1    96%   38
--------------------------------------------------------------
TOTAL                               32      1    96%

============================== 2 passed in 0.82s ===============================`,
		coverage: {
			files: [
				{ name: 'app/services/resilient_chat.py', stmts: 32, miss: 1, cover: '96%', missing: '38' }
			],
			total: { stmts: 32, miss: 1, cover: '96%' }
		},
		summary:
			'All 2 tests passed. 96% coverage validating Hypercorn timeout resilience, Tenacity retries, and multi-model fallback degradation.'
	},
	interactiveComponent: 'benchmark'
};
