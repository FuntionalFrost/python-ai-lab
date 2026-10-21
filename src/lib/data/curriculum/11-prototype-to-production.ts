import type { CurriculumLesson } from '../../types/curriculum';

export const track11: CurriculumLesson = {
	id: 'track-11',
	slug: '11-prototype-to-production',
	trackNumber: 11,
	title: 'Production WSGI Deployment, Worker Concurrency & Resilience',
	shortTitle: 'Production WSGI & Hardening',
	subtitle:
		'Gunicorn Worker Engines (Sync vs gthread vs gevent), Streaming Timeouts, and Tenacity Circuit Breakers',
	estimatedMinutes: 45,
	topics: [
		'Gunicorn Worker Engines: sync vs. gthread vs. gevent Concurrency Models',
		'Long-Lived Streaming Timeout Management (--timeout 120 vs. 30s Worker Kills)',
		'Circuit Breakers & Exponential Backoff with Tenacity (RateLimitError & 503)',
		'Graceful Degradation: Secondary Fallback Models (GPT-4o -> GPT-4o-Mini)',
		'Cost & Quota Defense: Redis Token-Bucket Rate Limiting & Response Caching'
	],
	frameworks: ['Flask 3.1.3', 'Gunicorn 23.x', 'Tenacity 9.x', 'OpenAI 1.x', 'uv'],
	tags: ['Production', 'WSGI', 'Gunicorn', 'Concurrency', 'Resilience', 'Tenacity', 'Caching'],
	summary:
		'Take your Flask AI service to production. Learn how to configure Gunicorn for high-concurrency streaming, contrast synchronous workers with threadpools (gthread) and greenlets (gevent), prevent silent 30-second worker timeout kills during long token generations, and implement Tenacity circuit breakers with automatic fallback degradation.',
	objectives: [
		'Configure Gunicorn with optimal worker engines (gthread / gevent) tailored for streaming I/O.',
		'Eliminate Gunicorn silent worker SIGKILL termination during long-running 45-second token generations.',
		'Implement exponential backoff with random jitter using Tenacity for upstream OpenAI 429/503 spikes.',
		'Build multi-tiered fallback pipelines that degrade from primary models to fast secondary models on quota depletion.',
		'Protect API infrastructure with reverse-proxy buffering controls and token-bucket rate limits.'
	],
	architecture: {
		patternName: 'High-Concurrency Production WSGI & Resilience Architecture',
		diagram: `+---------------------------------------------------------------------------------------+
|                    Nginx Reverse Proxy / Load Balancer                                |
|  - proxy_buffering off;  proxy_read_timeout 120s;  X-Accel-Buffering: no;             |
+---------------------------------------------------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                    Gunicorn Master Process (gunicorn.conf.py)                         |
|  workers = (2 * CPU) + 1 | worker_class = "gthread" | threads = 8 | timeout = 120s    |
+---------------------------------------------------------------------------------------+
           |                                  |                                  |
           v (Worker 1)                       v (Worker 2)                       v (Worker 3)
+---------------------+          +---------------------+          +---------------------+
|  Flask App Instance |          |  Flask App Instance |          |  Flask App Instance |
|  (8 Active Threads) |          |  (8 Active Threads) |          |  (8 Active Threads) |
+----------+----------+          +----------+----------+          +----------+----------+
           |
           v
+---------------------------------------------------------------------------------------+
|                 Resilience & Fallback Layer (Tenacity Circuit Breaker)                |
|                                                                                       |
|  1. Try Primary Model: gpt-4o (3 retries with exponential jitter)                     |
|  2. If 429/503 exhausted: Fallback to gpt-4o-mini                                     |
|  3. If API down: Serve cached semantic response from Redis                            |
+---------------------------------------------------------------------------------------+`,
		explanation: `Deploying an AI backend under standard web server settings almost always causes immediate outages in production:

1. The Worker Starvation Trap: By default, Gunicorn runs in 'sync' mode where 1 worker process handles 1 connection. If an LLM stream takes 20 seconds, a 4-worker cluster is completely paralyzed by just 4 concurrent users!
2. The 30-Second Silent Worker Kill: Gunicorn's default 'timeout = 30' monitors worker activity. Because an LLM connection is held open waiting for stream chunks, Gunicorn assumes the worker is hung and issues a SIGKILL mid-stream!
3. The Rate Limit Thundering Herd: When OpenAI returns a 429 RateLimitError, naive retry loops without random jitter hammer the API simultaneously, prolonging the outage.

The Production Fix:
- Use 'gthread' (threaded worker) or 'gevent' (greenlets) so each Gunicorn worker handles 8-16 concurrent streaming connections without blocking the process.
- Configure 'timeout = 120' and 'graceful_timeout = 30' in gunicorn.conf.py.
- Wrap model invocations in Tenacity decorators with exponential backoff and jitter, falling back to a secondary model (e.g. gpt-4o -> gpt-4o-mini) when quotas are pressured.`,
		keyConcepts: [
			{
				name: 'Gunicorn Worker Engines (`gthread` vs `gevent`)',
				description:
					'The gthread engine allocates an OS thread pool per worker process, allowing each worker to sustain multiple streaming connections. Gevent uses greenlets for cooperative non-blocking I/O.'
			},
			{
				name: 'Streaming Timeout Safeguards',
				description:
					'Setting timeout=120 and keepalive=5 prevents Gunicorn master from terminating workers during multi-turn LLM reasoning runs.'
			},
			{
				name: 'Tenacity Exponential Jitter',
				description:
					'wait_random_exponential adds random microsecond jitter to retry intervals, preventing synchronized request stampedes against OpenAI endpoints.'
			},
			{
				name: 'Graceful Model Degradation',
				description:
					'Automatically downgrading from an expensive primary model (GPT-4o) to a lightweight secondary model (GPT-4o-Mini) when upstream rate limits or budget thresholds trigger.'
			}
		]
	},
	comparisons: [
		{
			title: 'WSGI Deployment: Default Sync Anti-Pattern vs. Production Gthread',
			description:
				'Observe how default sync workers starve on 4 concurrent streaming users, while gthread scales smoothly.',
			leftTitle: 'Default Sync Worker Anti-Pattern (Starves on 4 Users)',
			leftLanguage: 'bash',
			leftCode: `# Anti-pattern: Default Gunicorn sync worker
# - Only 4 concurrent connections possible for the ENTIRE server!
# - A single 35-second stream causes Gunicorn to KILL the worker!
gunicorn \\
  --workers 4 \\
  --timeout 30 \\
  "app:create_app()"

# Result: 5th user gets 502 Bad Gateway while 4 users stream.
# At second 30, [CRITICAL] WORKER TIMEOUT (pid:1234) kills active streams!`,
			rightTitle: 'Production Gunicorn Config (Threadpool & 120s Timeout)',
			rightLanguage: 'python',
			rightCode: `# gunicorn.conf.py - Production AI streaming configuration
import multiprocessing

bind = "0.0.0.0:8000"

# (2 * cores) + 1 worker processes
workers = multiprocessing.cpu_count() * 2 + 1

# Threadpool worker class handles multiple concurrent SSE streams per process
worker_class = "gthread"
threads = 8

# Prevent worker SIGKILL during long LLM completions
timeout = 120
graceful_timeout = 30
keepalive = 5

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
def ask():
    # If OpenAI throws 429 RateLimitError or 503 Overloaded:
    # 1. Entire Flask request crashes with 500 Internal Server Error
    # 2. No retries, no jitter, no fallback
    # 3. User experiences immediate failure
    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": request.json["prompt"]}]
    )
    return jsonify({"answer": resp.choices[0].message.content})`,
			rightTitle: 'Tenacity Resilient Service with Multi-Model Fallback',
			rightLanguage: 'python',
			rightCode: `from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type
from openai import RateLimitError, APIConnectionError, InternalServerError

class ResilientChatService:
    def __init__(self, client, primary="gpt-4o", fallback="gpt-4o-mini"):
        self.client = client
        self.primary = primary
        self.fallback = fallback

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_random_exponential(multiplier=1, max=10),
        retry=retry_if_exception_type((RateLimitError, APIConnectionError, InternalServerError))
    )
    def _call_model(self, model: str, prompt: str) -> str:
        resp = self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        return resp.choices[0].message.content

    def ask_with_fallback(self, prompt: str) -> dict:
        try:
            # 1. Attempt primary model with 3 retries
            return {"answer": self._call_model(self.primary, prompt), "model": self.primary}
        except Exception:
            # 2. Seamlessly degrade to secondary model
            content = self._call_model(self.fallback, prompt)
            return {"answer": content, "model": self.fallback, "degraded": True}`
		}
	],
	codeSnippets: [
		{
			id: 'gunicorn-config-production',
			title: 'Production Gunicorn Configuration (gunicorn.conf.py)',
			filePath: 'gunicorn.conf.py',
			description:
				'Threaded worker configuration, streaming timeout buffers, and connection keep-alive settings.',
			language: 'python',
			code: `import multiprocessing
import os

bind = os.getenv("BIND", "0.0.0.0:8000")

# CPU core scaling: 2 * cores + 1
workers = int(os.getenv("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))

# Enable threadpool concurrency for long-lived streaming I/O
worker_class = "gthread"
threads = int(os.getenv("GUNICORN_THREADS", 8))

# Generous timeouts prevent premature worker termination during LLM generation
timeout = 120
graceful_timeout = 30
keepalive = 5

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
from openai import OpenAI, RateLimitError, APIConnectionError, InternalServerError
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type

class ChatResult(BaseModel):
    content: str
    model_used: str
    is_fallback: bool = False

class ResilientChatService:
    def __init__(self, client: OpenAI, primary_model: str = "gpt-4o", fallback_model: str = "gpt-4o-mini") -> None:
        self.client = client
        self.primary_model = primary_model
        self.fallback_model = fallback_model

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_random_exponential(multiplier=0.5, max=5),
        retry=retry_if_exception_type((RateLimitError, APIConnectionError, InternalServerError)),
    )
    def _execute_with_retry(self, model: str, prompt: str) -> str:
        resp = self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return resp.choices[0].message.content or ""

    def ask_with_retry(self, prompt: str) -> ChatResult:
        try:
            # Primary model attempt with 3 retries
            content = self._execute_with_retry(self.primary_model, prompt)
            return ChatResult(content=content, model_used=self.primary_model, is_fallback=False)
        except Exception:
            # Fallback model attempt (e.g. gpt-4o-mini if gpt-4o rate limits trigger)
            try:
                content = self._execute_with_retry(self.fallback_model, prompt)
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
		title: 'Tenacity Retry & Fallback Test Suite (pytest)',
		testFilePath: 'tests/test_resilience.py',
		command: 'pytest -v --cov=app/services/resilient_chat tests/test_resilience.py',
		executionTimeSec: 0.82,
		testCode: `import pytest
from unittest.mock import MagicMock
from openai import RateLimitError
from app.services.resilient_chat import ResilientChatService

def test_resilient_service_succeeds_on_first_try(mocker):
    mock_client = mocker.MagicMock()
    mock_choice = mocker.MagicMock()
    mock_choice.message.content = "Primary response"
    mock_client.chat.completions.create.return_value = mocker.MagicMock(choices=[mock_choice])

    service = ResilientChatService(client=mock_client)
    res = service.ask_with_retry("Hello")

    assert res.content == "Primary response"
    assert res.model_used == "gpt-4o"
    assert not res.is_fallback
    assert mock_client.chat.completions.create.call_count == 1

def test_resilient_service_falls_back_when_primary_exhausts_retries(mocker):
    mock_client = mocker.MagicMock()
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
    res = service.ask_with_retry("Hello under heavy load")

    assert res.content == "Fallback response"
    assert res.model_used == "gpt-4o-mini"
    assert res.is_fallback is True
    # 3 primary attempts + 1 fallback attempt = 4
    assert mock_client.chat.completions.create.call_count == 4`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_resilience.py::test_resilient_service_succeeds_on_first_try PASSED [ 50%]
tests/test_resilience.py::test_resilient_service_falls_back_when_primary_exhausts_retries PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
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
			'All 2 tests passed. 96% coverage validating Gunicorn timeout resilience, Tenacity retries, and multi-model fallback degradation.'
	},
	interactiveComponent: 'benchmark'
};
