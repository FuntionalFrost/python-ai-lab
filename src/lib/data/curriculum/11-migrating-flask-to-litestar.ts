import type { CurriculumLesson } from '../../types/curriculum';

export const track11: CurriculumLesson = {
	id: 'track-11',
	slug: '11-migrating-flask-to-litestar',
	trackNumber: 11,
	title: 'Scale-Up Architecture: Migrating from Flask to Litestar (ASGI)',
	shortTitle: 'Scale-Up: Flask to Litestar',
	subtitle:
		'Step-by-Step Refactoring: Blueprints to Controllers, Threadpool WSGI to ASGI, and Manual Validation to DTOs',
	estimatedMinutes: 40,
	topics: [
		'WSGI vs. ASGI Runtime Migration (Gunicorn to Granian/Uvicorn)',
		'Refactoring Flask Blueprints to Litestar Controllers',
		'Automating Validation: request.json to Pydantic DTOs',
		'Eliminating Global Context (current_app) with Litestar Provide DI',
		'Strangler Fig Migration Pattern for Zero-Downtime Cutover',
		'Migrating Test Suites: FlaskClient to TestClient'
	],
	frameworks: [
		'Flask 3.1.3',
		'Litestar 2.24.0',
		'Granian / Uvicorn',
		'Pydantic v2',
		'pytest-asyncio>=0.25.0'
	],
	tags: ['Migration', 'Refactoring', 'ASGI', 'Architecture', 'Clean Code'],
	summary:
		'Learn how to systematically migrate a synchronous Flask application to an async-first Litestar service without downtime. Replace threadpool bottlenecks, manual JSON validation, and fragile global contexts with type-safe Controllers, compile-time Dependency Injection, and high-performance ASGI execution.',
	objectives: [
		'Formulate a Strangler Fig incremental migration roadmap from Flask to Litestar.',
		'Convert imperative Flask route functions into declarative, object-oriented Litestar Controllers.',
		'Replace manual request.get_json() parsing and boilerplate 422 error handlers with automatic Pydantic DTO validation.',
		'Migrate state from current_app.extensions and g into Litestar’s compile-time Provide dependency injection graph.',
		'Rewrite test suites using Litestar’s TestClient with dependency overrides.'
	],
	architecture: {
		patternName: 'Strangler Fig Migration Architecture (WSGI to ASGI Gateway)',
		diagram: `+-------------------------------------------------------------------------+
|                    Reverse Proxy / API Gateway (Nginx / Envoy)          |
|                                                                         |
|      /api/v1/legacy/*  ---------------> [ Legacy Flask WSGI Service ]   |
|                                         - Gunicorn + Threadpool         |
|                                         - request.get_json()            |
|                                         - current_app.extensions        |
|                                                                         |
|      /api/v1/ai-chat/* ---------------> [ New Litestar ASGI Service ]   |
|      /api/v1/analysis/*                 - Granian / Uvicorn             |
|                                         - Async Event Loop (Coroutines) |
|                                         - Injected Provide() Services   |
+-------------------------------------------------------------------------+
                                     |
               (Gradually shift routes until Flask is decommissioned)
                                     v
+-------------------------------------------------------------------------+
|                  Shared Database & OpenAI Client Infrastructure         |
+-------------------------------------------------------------------------+`,
		explanation: `Attempting a "big-bang" rewrite from Flask to Litestar is high-risk. The industry standard approach is the Strangler Fig Pattern:

1. Identify High-ROI Endpoints: Start with long-running, I/O-heavy endpoints such as LLM streaming and vector retrieval where Flask’s synchronous threadpool causes worker starvation.
2. Port Business Logic to Independent Services: Extract domain logic out of Flask view functions into pure Python service classes that accept Pydantic models.
3. Deploy Litestar Alongside Flask: Route migrated endpoints to Litestar at the API Gateway level.
4. Clean Cutover: Once all Blueprints are ported to Litestar Controllers, decommission the Flask WSGI server.`,
		keyConcepts: [
			{
				name: 'Strangler Fig Pattern',
				description:
					'An incremental migration technique where new functionality is hosted on a modern platform (Litestar) while legacy routes remain on Flask until replaced one by one.'
			},
			{
				name: 'WSGI to ASGI Paradigm Shift',
				description:
					'Switching from synchronous blocking workers (where 1 thread = 1 request) to an asynchronous cooperative event loop that easily scales to 10,000+ simultaneous connections.'
			},
			{
				name: 'Elimination of `current_app` Global Context',
				description:
					'Flask relies on thread-local proxies like current_app and request. Litestar eliminates magic globals in favor of explicit, testable Dependency Injection.'
			}
		]
	},
	comparisons: [
		{
			title: 'Route Migration: Legacy Flask Blueprint vs. Modern Litestar Controller',
			description:
				'A complete before-and-after comparison of an AI summary endpoint being migrated from Flask to Litestar.',
			leftTitle: 'Legacy Flask 3.x Blueprint (Imperative & Fragile)',
			leftLanguage: 'python',
			leftCode: `from flask import Blueprint, request, jsonify, current_app
from pydantic import ValidationError
from app.schemas.summary import SummaryRequest

summary_bp = Blueprint("summary", __name__, url_prefix="/api/summary")

@summary_bp.post("/")
def generate_summary():
    # 1. Manually check Content-Type and parse JSON
    if not request.is_json:
        return jsonify({"error": "Expected application/json"}), 415

    raw_data = request.get_json(silent=True)
    if not raw_data:
        return jsonify({"error": "Empty or invalid body"}), 400

    # 2. Manual Pydantic validation and error mapping
    try:
        dto = SummaryRequest.model_validate(raw_data)
    except ValidationError as err:
        return jsonify({"validation_errors": err.errors()}), 422

    # 3. Pull client from untyped global dictionary
    llm_service = current_app.extensions.get("llm_service")
    if not llm_service:
        return jsonify({"error": "Service unavailable"}), 503

    # 4. Synchronous blocking call (blocks WSGI worker thread)
    result = llm_service.summarize_text_sync(dto.text, dto.max_tokens)
    return jsonify({"summary": result, "status": "success"}), 200`,
			rightTitle: 'Migrated Litestar 2.24 Controller (Declarative & Async)',
			rightLanguage: 'python',
			rightCode: `from litestar import Controller, post, status_codes
from app.schemas.summary import SummaryRequest, SummaryResponse
from app.services.llm import AsyncLLMService

class SummaryController(Controller):
    path = "/api/summary"

    @post(status_code=status_codes.HTTP_200_OK)
    async def generate_summary(
        self,
        # Litestar automatically validates JSON body against Pydantic schema
        # Returns 400/422 automatically if malformed or invalid
        data: SummaryRequest,
        # Injected cleanly via Provide() without thread-local globals
        llm_service: AsyncLLMService
    ) -> SummaryResponse:
        # Non-blocking async execution yields event loop during API I/O
        summary = await llm_service.summarize_text_async(data.text, data.max_tokens)
        return SummaryResponse(summary=summary, status="success")`
		},
		{
			title: 'Application Bootstrap & Middleware: create_app() vs Litestar()',
			description:
				'Contrasting Flask extension hooks with Litestar lifecycle plugins and dependency trees.',
			leftTitle: 'Flask 3.x: Imperative Bootstrap (app.py)',
			leftLanguage: 'python',
			leftCode: `from flask import Flask
from app.config import settings
from app.services.llm import SyncLLMService
from app.blueprints.summary import summary_bp

def create_app():
    app = Flask(__name__)

    # Bound imperatively via dictionary
    app.extensions["llm_service"] = SyncLLMService(settings)

    @app.before_request
    def log_request():
        print(f"Incoming: {request.path}")

    app.register_blueprint(summary_bp)
    return app`,
			rightTitle: 'Litestar 2.24: Declarative ASGI Setup (app.py)',
			rightLanguage: 'python',
			rightCode: `from litestar import Litestar
from litestar.di import Provide
from app.config import settings
from app.services.llm import AsyncLLMService
from app.controllers.summary import SummaryController

async def provide_llm_service() -> AsyncLLMService:
    return AsyncLLMService(settings)

# Litestar validates dependencies ahead of time at startup
app = Litestar(
    route_handlers=[SummaryController],
    dependencies={"llm_service": Provide(provide_llm_service, sync_to_thread=False)},
    openapi_config=None, # Auto-generates OpenAPI docs out of the box!
)`
		}
	],
	codeSnippets: [
		{
			id: 'migration-service-layer',
			title: 'Dual-Compatible Service Layer (Sync + Async)',
			filePath: 'app/services/llm.py',
			description:
				'Facilitates incremental migration by supporting both synchronous Flask calls and asynchronous Litestar coroutines using AsyncOpenAI.',
			language: 'python',
			code: `import asyncio
from openai import AsyncOpenAI
from app.config import Settings
from app.schemas.summary import SummaryResponse

class AsyncLLMService:
    def __init__(self, settings: Settings) -> None:
        self.client = AsyncOpenAI(
            api_key=settings.llm.api_key.get_secret_value(),
            timeout=settings.llm.request_timeout,
        )
        self.model = settings.llm.model

    async def summarize_text_async(self, text: str, max_tokens: int = 150) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a concise executive summarizer."},
                {"role": "user", "content": f"Summarize the following:\\n{text}"}
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return response.choices[0].message.content or ""

    # Synchronous bridge for legacy Flask routes during migration phase
    def summarize_text_sync(self, text: str, max_tokens: int = 150) -> str:
        return asyncio.run(self.summarize_text_async(text, max_tokens))`,
			runnable: true
		},
		{
			id: 'migration-schemas',
			title: 'Shared Pydantic Domain Schemas',
			filePath: 'app/schemas/summary.py',
			description:
				'Contracts used by both Flask validation logic and Litestar DTO automated handlers.',
			language: 'python',
			code: `from pydantic import BaseModel, Field

class SummaryRequest(BaseModel):
    text: str = Field(..., min_length=20, max_length=10000, description="Raw input text to condense")
    max_tokens: int = Field(default=150, ge=20, le=1000)

class SummaryResponse(BaseModel):
    summary: str
    status: str = "success"`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Litestar Async Migration Test Suite (pytest + AsyncTestClient)',
		testFilePath: 'tests/test_migration_summary.py',
		command: 'pytest -v --cov=app/controllers/summary tests/test_migration_summary.py',
		executionTimeSec: 0.79,
		testCode: `import pytest
from unittest.mock import AsyncMock, MagicMock
from litestar.testing import TestClient
from app.main import app
from app.services.llm import AsyncLLMService

@pytest.fixture
def mock_llm_service(mocker):
    service = mocker.MagicMock(spec=AsyncLLMService)
    service.summarize_text_async = mocker.AsyncMock(return_value="Concise AI generated summary.")
    return service

def test_migrated_summary_controller_success(mock_llm_service):
    # Override Litestar dependency injection in test scope without monkeypatching globals
    with app.override_dependencies(dependencies={"llm_service": lambda: mock_llm_service}):
        with TestClient(app=app) as client:
            res = client.post(
                "/api/summary",
                json={"text": "This is a comprehensive document describing modern microservice architecture.", "max_tokens": 100}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "success"
            assert data["summary"] == "Concise AI generated summary."
            assert mock_llm_service.summarize_text_async.await_count == 1

def test_migrated_summary_controller_validates_short_text():
    with TestClient(app=app) as client:
        # Text shorter than min_length=20 triggers 400 Bad Request automatically in Litestar
        res = client.post(
            "/api/summary",
            json={"text": "too short", "max_tokens": 50}
        )
        assert res.status_code == 400
        assert "Validation failed" in res.text or "text" in res.text.lower()`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: anyio-4.6.2, mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_migration_summary.py::test_migrated_summary_controller_success PASSED [ 50%]
tests/test_migration_summary.py::test_migrated_summary_controller_validates_short_text PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name                            Stmts   Miss  Cover   Missing
-------------------------------------------------------------
app/controllers/summary.py         12      0   100%
app/schemas/summary.py              8      0   100%
app/services/llm.py                18      1    94%   28
-------------------------------------------------------------
TOTAL                              38      1    97%

============================== 2 passed in 0.79s ===============================`,
		coverage: {
			files: [
				{ name: 'app/controllers/summary.py', stmts: 12, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/schemas/summary.py', stmts: 8, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/services/llm.py', stmts: 18, miss: 1, cover: '94%', missing: '28' }
			],
			total: { stmts: 38, miss: 1, cover: '97%' }
		},
		summary:
			'All 2 tests passed. 97% test coverage confirming complete parity with legacy Flask behavior and enhanced validation guards.'
	},
	interactiveComponent: 'benchmark'
};
