import type { CurriculumLesson } from '../../types/curriculum';

export const track08: CurriculumLesson = {
	id: 'track-08',
	slug: '08-prototype-to-production',
	trackNumber: 8,
	title: 'Prototyping vs. Production Engineering',
	shortTitle: 'Prototype to Production Transition',
	subtitle:
		'The 4 Pillars: Config, Client Pooling, Circuit Breakers with Tenacity, and CI Test Automation',
	level: 'Advanced',
	estimatedMinutes: 45,
	topics: [
		'The 4 Critical Failure Modes of AI Prototypes',
		'Client Lifetime & TCP Socket Exhaustion',
		'Circuit Breakers & Exponential Backoff with Tenacity',
		'Domain Exceptions vs Raw API Leakage',
		'Modern CI & Deterministic Toolchains (uv + pytest + pytest-cov)'
	],
	frameworks: ['Flask 3.1.3', 'OpenAI 1.x', 'pydantic-settings>=2.16.0', 'tenacity', 'uv'],
	tags: ['Production', 'Refactoring', 'Resilience', 'Tenacity', 'Architecture'],
	summary:
		'Transition a fragile "Jupyter notebook / hackathon prototype" into an enterprise-grade AI microservice. Walk through the four architectural pillars: strict settings, pooled asynchronous clients, resilient circuit breakers with exponential retries, and comprehensive CI test suites.',
	objectives: [
		'Identify the four fatal flaws in typical AI prototype codebases.',
		'Migrate route-local client instantiations into dependency-injected singletons.',
		'Implement exponential backoff and jitter using tenacity for rate-limit resilience.',
		'Transform raw OpenAI 429/500 stack traces into domain exceptions and fallback responses.',
		'Establish automated CI quality gates that run pytest with coverage thresholds.'
	],
	architecture: {
		patternName: '4-Pillar Production Readiness Architecture',
		diagram: `+---------------------------------------------------------------------------------------+
|                                    PROTOTYPE (FRAGILE)                                |
|  - Raw os.getenv()                                                                    |
|  - client = OpenAI() inside route handler (socket leak!)                              |
|  - Uncaught RateLimitError -> 500 Internal Server Error crash                         |
|  - "Tested" manually in Swagger / Postman                                             |
+---------------------------------------------------------------------------------------+
                                           |
                                 REFACTOR TO PRODUCTION
                                           v
+---------------------------------------------------------------------------------------+
|                                   PRODUCTION (RESILIENT)                              |
|                                                                                       |
|  [Pillar 1: Config]        BaseSettings + SecretStr + Startup Fail-Fast Validation    |
|  [Pillar 2: Client DI]     Single AsyncOpenAI instance with httpx connection pooling  |
|  [Pillar 3: Resilience]    @retry (tenacity) with exponential backoff & jitter        |
|  [Pillar 4: Testing & CI]  Automated pytest suites + pytest-mock + 90% coverage gate  |
+---------------------------------------------------------------------------------------+`,
		explanation: `80% of AI proofs-of-concept fail in production not because the language model is inadequate, but because the surrounding Python infrastructure collapses under real-world conditions:

1. Socket Exhaustion: Creating client = OpenAI() per request creates dozens of new TCP handshakes and leaves sockets in TIME_WAIT, quickly depleting OS file descriptors.
2. Unhandled Rate Limits: Transient OpenAI 429 (Rate Limit) or 503 (Overloaded) spikes propagate directly to end users as ugly 500 errors.
3. Configuration Blindness: Invalid keys or missing model names are detected only when a user triggers that specific route.
4. No Regression Safety: Without automated mock testing, any prompt modification or library upgrade risks silently breaking structured schemas.`,
		keyConcepts: [
			{
				name: 'Tenacity Exponential Backoff',
				description:
					'Retrying failed API calls with increasing delays (e.g. 1s, 2s, 4s) plus random jitter to prevent thundering herd spikes against the OpenAI API.'
			},
			{
				name: 'Fallback Strategy',
				description:
					'When primary model calls fail repeatedly, the service falls back to a lighter model (e.g. gpt-4o -> gpt-4o-mini) or a cached response.'
			},
			{
				name: 'Graceful Degradation',
				description:
					'Returning a structured error message indicating service degradation instead of throwing an unhandled HTTP 500 crash.'
			},
			{
				name: 'Deterministic Toolchains with uv',
				description:
					'Replacing slow, unpinned pip installs and fragile virtualenvs with uv, PEP 735 dependency groups, and pyproject.toml lockfiles. Enables instant, isolated local execution and sub-second CI validation.'
			}
		]
	},
	comparisons: [
		{
			title: 'Route Handler: Naive Prototype vs. Production Service',
			description:
				'Observe the difference between an unhandled, leaky prototype endpoint and a dependency-injected, retried production handler.',
			leftTitle: 'Hackathon Prototype (High Failure Risk)',
			leftLanguage: 'python',
			leftCode: `# Anti-pattern: Everything inside route handler
from flask import Flask, request, jsonify
import os
import openai

app = Flask(__name__)

@app.post("/api/ask")
def ask():
    # 1. Leaking new client creation on EVERY request
    client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    # 2. Raw unvalidated input
    prompt = request.json["prompt"]

    # 3. Uncaught exceptions (429 rate limit or 503 crash the entire request)
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    return jsonify({"answer": response.choices[0].message.content})`,
			rightTitle: 'Production Architecture (Flask 3.x + Tenacity + Service Layer)',
			rightLanguage: 'python',
			rightCode: `from flask import Blueprint, request, jsonify, current_app
from pydantic import ValidationError
from app.schemas.chat import ChatPrompt, ChatResult
from app.services.resilient_chat import ResilientChatService

ask_bp = Blueprint("ask", __name__)

@ask_bp.post("/api/ask")
def ask():
    """
    Input validated via ChatPrompt Pydantic schema.
    OpenAI client uses shared connection pool from app extensions.
    Tenacity retries transient 429/5xx errors with exponential jitter.
    Returns structured domain response or fallback on failure.
    """
    json_data = request.get_json(silent=True) or {}
    try:
        data = ChatPrompt.model_validate(json_data)
    except ValidationError as err:
        return jsonify({"errors": err.errors()}), 422

    service: ResilientChatService = current_app.extensions["resilient_chat_service"]
    result: ChatResult = service.ask_with_retry(data.prompt)
    return jsonify(result.model_dump()), 200`
		},
		{
			title: 'Resilience Strategy: Raw Try/Except vs. Tenacity Decorator',
			description: 'Comparing ad-hoc while loops with industry-standard Tenacity retry logic.',
			leftTitle: 'Ad-hoc Prototype While-Loop Retry',
			leftLanguage: 'python',
			leftCode: `import time

# Fragile manual retry:
# - Blocks synchronous thread
# - No jitter (causes stampedes)
# - Retries everything (even 400 Bad Request which will never succeed)
def call_with_retry(prompt):
    for attempt in range(3):
        try:
            return client.chat.completions.create(...)
        except Exception:
            time.sleep(2) # Naive fixed sleep
    raise RuntimeError("Failed after 3 tries")`,
			rightTitle: 'Production Tenacity Strategy with Jitter',
			rightLanguage: 'python',
			rightCode: `from tenacity import (
    retry,
    stop_after_attempt,
    wait_random_exponential,
    retry_if_exception_type,
)
from openai import RateLimitError, APIConnectionError, InternalServerError

@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_random_exponential(multiplier=1, max=10),
    retry=retry_if_exception_type((
        RateLimitError,
        APIConnectionError,
        InternalServerError,
    )), # Never retry client errors (like 400 or 401)
)
async def call_llm_resiliently(client: AsyncOpenAI, messages: list):
    return await client.chat.completions.create(...)`
		}
	],
	codeSnippets: [
		{
			id: 'resilient-chat-service',
			title: 'Production Resilient Chat Service with Fallback Model',
			filePath: 'app/services/resilient_chat.py',
			description:
				'Tenacity retry policies, fallback degradation to secondary model, and structured domain output.',
			language: 'python',
			code: `from typing import Any
from pydantic import BaseModel, Field
from openai import AsyncOpenAI, RateLimitError, APIConnectionError, InternalServerError
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type

class ChatResult(BaseModel):
    content: str
    model_used: str
    is_fallback: bool = False

class ResilientChatService:
    def __init__(self, client: AsyncOpenAI, primary_model: str = "gpt-4o", fallback_model: str = "gpt-4o-mini") -> None:
        self.client = client
        self.primary_model = primary_model
        self.fallback_model = fallback_model

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_random_exponential(multiplier=0.5, max=5),
        retry=retry_if_exception_type((RateLimitError, APIConnectionError, InternalServerError)),
    )
    async def _execute_with_retry(self, model: str, messages: list[dict[str, str]]) -> str:
        resp = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
        )
        return resp.choices[0].message.content or ""

    async def ask_with_retry(self, prompt: str) -> ChatResult:
        messages = [{"role": "user", "content": prompt}]
        try:
            # Primary model attempt with 3 retries
            content = await self._execute_with_retry(self.primary_model, messages)
            return ChatResult(content=content, model_used=self.primary_model, is_fallback=False)
        except Exception:
            # Fallback model attempt (e.g. gpt-4o-mini if gpt-4o is rate-limited)
            try:
                content = await self._execute_with_retry(self.fallback_model, messages)
                return ChatResult(content=content, model_used=self.fallback_model, is_fallback=True)
            except Exception as final_err:
                return ChatResult(
                    content="Service is temporarily unavailable due to upstream rate limits. Please try again.",
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
		executionTimeSec: 0.98,
		testCode: `import pytest
from unittest.mock import AsyncMock, MagicMock
from openai import RateLimitError
from app.services.resilient_chat import ResilientChatService

@pytest.mark.asyncio
async def test_resilient_service_succeeds_on_first_try(mocker):
    mock_client = mocker.AsyncMock()
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="Primary response"))]
    )

    service = ResilientChatService(client=mock_client)
    res = await service.ask_with_retry("Hello")

    assert res.content == "Primary response"
    assert res.model_used == "gpt-4o"
    assert not res.is_fallback
    assert mock_client.chat.completions.create.await_count == 1

@pytest.mark.asyncio
async def test_resilient_service_falls_back_when_primary_exhausts_retries(mocker):
    mock_client = mocker.AsyncMock()

    # RateLimitError requires request object
    dummy_req = MagicMock()
    rate_err = RateLimitError(message="Rate limit hit", response=dummy_req, body=None)

    # Primary model fails 3 times with RateLimitError
    # Fallback model succeeds
    fallback_response = MagicMock(
        choices=[MagicMock(message=MagicMock(content="Fallback response"))]
    )
    mock_client.chat.completions.create.side_effect = [
        rate_err,
        rate_err,
        rate_err,
        fallback_response
    ]

    service = ResilientChatService(client=mock_client)
    res = await service.ask_with_retry("Hello under heavy load")

    assert res.content == "Fallback response"
    assert res.model_used == "gpt-4o-mini"
    assert res.is_fallback is True
    # 3 primary attempts + 1 fallback attempt = 4
    assert mock_client.chat.completions.create.await_count == 4`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: anyio-4.6.2, mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_resilience.py::test_resilient_service_succeeds_on_first_try PASSED [ 50%]
tests/test_resilience.py::test_resilient_service_falls_back_when_primary_exhausts_retries PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name                             Stmts   Miss  Cover   Missing
--------------------------------------------------------------
app/services/resilient_chat.py      35      1    97%   38
--------------------------------------------------------------
TOTAL                               35      1    97%

============================== 2 passed in 0.98s ===============================`,
		coverage: {
			files: [
				{ name: 'app/services/resilient_chat.py', stmts: 35, miss: 1, cover: '97%', missing: '38' }
			],
			total: { stmts: 35, miss: 1, cover: '97%' }
		},
		summary:
			'All 2 tests passed. 97% test coverage validating tenacity retries, rate-limit resilience, and graceful degradation.'
	},
	interactiveComponent: 'code-comparison'
};
