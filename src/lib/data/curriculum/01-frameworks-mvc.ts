import type { CurriculumLesson } from '../../types/curriculum';

export const track01: CurriculumLesson = {
	id: 'track-01',
	slug: '01-frameworks-mvc',
	trackNumber: 1,
	title: 'Application Factory & Clean MVC with Quart ASGI',
	shortTitle: 'Quart ASGI Architecture',
	subtitle: 'Application Factories, Modular Blueprints, Hypercorn ASGI, and Scalable AI APIs',
	estimatedMinutes: 30,
	topics: [
		'Quart Application Factory Pattern (create_app -> Quart)',
		'Async Modular Blueprints & Non-Blocking URL Routing',
		'Clean Architecture & Service/Repository Layering',
		'Pydantic v2 Payload Validation with await request.get_json()',
		'Quart Async Contexts: current_app vs g vs Task-Local Scope',
		'Serving Production AI Backends on Hypercorn ASGI'
	],
	frameworks: ['Quart', 'Hypercorn 0.17+', 'HTTPX2', 'Pydantic v2', 'pytest 9.x', 'pytest-asyncio'],
	tags: ['Quart', 'ASGI', 'Architecture', 'MVC', 'Blueprints', 'Hypercorn', 'Clean Code'],
	summary:
		'Ditch legacy synchronous WSGI bottlenecks. Master the Quart Application Factory pattern, structured async Blueprints, Clean Architecture separation of concerns, and typed Pydantic validation inside native non-blocking coroutines served via Hypercorn.',
	objectives: [
		'Construct robust Quart ASGI applications using create_app() and decoupled async Blueprints.',
		'Eliminate circular imports and mutable global state using Quart’s application context (current_app).',
		'Separate HTTP transport logic from AI reasoning using the Domain Service & Repository pattern.',
		'Enforce strict runtime validation with Pydantic v2 schemas inside Quart route endpoints.',
		'Write deterministic async unit tests using app.test_client(), pytest, and pytest-asyncio.',
		'Deploy non-blocking AI endpoints capable of handling thousands of concurrent connections on Hypercorn.'
	],
	architecture: {
		patternName: 'Quart AI-Native ASGI Clean Architecture & Service Layer',
		diagram: `+-------------------------------------------------------------------+
|                        Transport Layer                            |
|             Quart Blueprints (@analysis_bp.post("/"))             |
+-------------------------------------------------------------------+
                                 |
                                 v  (Validated Pydantic DTO)
+-------------------------------------------------------------------+
|                         Service Layer                             |
|                    DocumentAnalysisService                        |
|       - Business Logic, Prompt Orchestration, Schema Guards       |
+-------------------------------------------------------------------+
                                 |
        +------------------------+------------------------+
        v                                                 v
+-------------------------------+ +---------------------------------+
|       LLM Gateway / Client    | |       Repository Layer          |
|  AsyncOpenAI Client (Injected)| |  AsyncDocumentRepository (SQL)  |
+-------------------------------+ +---------------------------------+`,
		explanation: `In traditional tutorials, developers often place everything into a single 'app.py' script using global variables like 'app = Flask(__name__)'. While fine for quick scripts, this naive approach quickly collapses in AI applications:

1. Circular Imports: Importing models or routes into the global app creates circular dependencies.
2. Global State Mutation: Sharing global client instances makes testing impossible without monkeypatching.
3. Fat Route Functions: Mixing prompt construction, JSON parsing, API calls, and database saves into one route handler leads to untestable spaghetti code.
4. WSGI Thread Starvation: Synchronous frameworks block an entire OS thread per active request, collapsing when LLM streams run for 10-30 seconds.

Modern Quart resolves this with ASGI and Clean Architecture:
- Transport Layer (Async Blueprints): Handles HTTP verbs, asynchronously extracts request JSON (await request.get_json()), validates schemas, and formats responses.
- Service Layer (Domain Logic): Houses prompt engineering, token safety checks, and multi-step tool calls.
- Gateway Layer: Encapsulates external I/O (AsyncOpenAI client, vector stores, relational DBs) using non-blocking async clients.`,
		keyConcepts: [
			{
				name: 'Quart Application Factory (`create_app`)',
				description:
					'Prevents circular imports and global state by isolating app creation, client binding, and blueprint registration into a testable factory function.'
			},
			{
				name: 'Modular Async Blueprints',
				description:
					'Groups related routes and URL prefixes into reusable modules that can be registered onto any Quart app instance with custom configuration.'
			},
			{
				name: 'Task-Local Async Contexts (`contextvars`)',
				description:
					'Quart modernizes Flask thread-locals into Python task-local contextvars, allowing concurrent coroutines on the same event loop to access current_app and request safely.'
			},
			{
				name: 'Pydantic DTO Validation in Quart',
				description:
					'Validates incoming request JSON against strict Pydantic models with custom error handling before executing expensive AI operations.'
			}
		]
	},
	comparisons: [
		{
			title: 'Monolithic Anti-Pattern vs. Modern Quart Architecture',
			description:
				'Contrasting a fragile global WSGI script with an enterprise Quart Application Factory & Async Blueprint structure.',
			leftTitle: 'Legacy Monolith (Global app, Raw Dicts, WSGI Thread Blocking)',
			leftLanguage: 'python',
			leftCode: `# Anti-pattern: app.py contains everything in global scope
from flask import Flask, request, jsonify
import openai

app = Flask(__name__)
client = openai.OpenAI() # Global client - cannot be mocked or configured per-env!

@app.route("/analyze", methods=["POST"])
def analyze():
    # 1. Unvalidated dictionary parsing
    data = request.json
    text = data.get("text", "") # Silent bug if missing or wrong type!

    # 2. Domain logic mixed directly into HTTP handler (blocks OS thread)
    response = client.chat.completions.create(
        model="gemma-4-e4b-it",
        messages=[{"role": "user", "content": f"Analyze: {text}"}]
    )

    # 3. Raw dictionary response without schema guarantee
    return jsonify({"result": response.choices[0].message.content})

if __name__ == "__main__":
    app.run(debug=True)`,
			rightTitle: 'Modern Quart (Async Blueprint + Service Layer + Pydantic)',
			rightLanguage: 'python',
			rightCode: `from quart import Blueprint, request, jsonify, current_app
from pydantic import ValidationError
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.analysis import AnalysisService

analysis_bp = Blueprint("analysis", __name__, url_prefix="/api/v1/analysis")

@analysis_bp.post("/")
async def create_analysis():
    # 1. Parse raw JSON body safely via non-blocking await
    json_data = await request.get_json()
    if not json_data:
        return jsonify({"error": "Malformed or missing JSON body"}), 400

    # 2. Strict runtime validation via Pydantic v2
    try:
        payload = AnalysisRequest.model_validate(json_data)
    except ValidationError as err:
        return jsonify({"errors": err.errors()}), 422

    # 3. Resolve AsyncOpenAI client from Quart application extensions
    client = current_app.extensions["async_openai_client"]
    service = AnalysisService(client=client)

    # 4. Delegate to pure domain service layer (non-blocking)
    result: AnalysisResponse = await service.analyze(payload)
    return jsonify(result.model_dump()), 201`
		},
		{
			title: 'Application Bootstrap: Global Script vs. create_app() Factory',
			description:
				'How to bootstrap Quart applications cleanly with environment-aware settings and blueprint registration.',
			leftTitle: 'Global app Instance (Hard to Test / Configure)',
			leftLanguage: 'python',
			leftCode: `# Anti-pattern: app is initialized at module import time
from quart import Quart
import os

app = Quart(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret")
app.config["OPENAI_KEY"] = os.environ.get("OPENAI_KEY")

# Importing routes after app is defined leads to circular imports!
import app_routes`,
			rightTitle: 'Application Factory Pattern (app/__init__.py)',
			rightLanguage: 'python',
			rightCode: `from quart import Quart
from openai import AsyncOpenAI
import httpx2
from app.config import settings
from app.blueprints.analysis import analysis_bp

def create_app() -> Quart:
    """Application factory for Quart. Enables isolated testing per suite."""
    app = Quart(__name__)

    # Store configured AsyncOpenAI and HTTPX2 clients in extensions registry
    app.extensions["async_openai_client"] = AsyncOpenAI(
        api_key=settings.openai_api_key.get_secret_value(),
        timeout=settings.request_timeout_seconds,
    )
    app.extensions["http_client"] = httpx2.AsyncClient(
        limits=httpx2.Limits(max_connections=50, max_keepalive_connections=15)
    )

    # Register decoupled modular Blueprints
    app.register_blueprint(analysis_bp)
    return app`
		}
	],
	codeSnippets: [
		{
			id: 'quart-service-impl',
			title: 'Clean Architecture Async Service Layer',
			filePath: 'app/services/analysis.py',
			description:
				'Decoupled analysis service implementing domain boundary validation, AsyncOpenAI interaction, and Pydantic serialization.',
			language: 'python',
			code: `from openai import AsyncOpenAI
from app.schemas.analysis import AnalysisRequest, AnalysisResponse

class AnalysisService:
    """Domain service isolated from Quart HTTP transport. Fully testable without web context."""

    def __init__(self, client: AsyncOpenAI, model: str = "gemma-4-e4b-it") -> None:
        self._client = client
        self._model = model

    async def analyze(self, req: AnalysisRequest) -> AnalysisResponse:
        prompt = (
            f"Analyze the following enterprise text snippet for security and compliance risks.\\n"
            f"Input text: \\"{req.content}\\"\\n"
            f"Return JSON adhering strictly to: {AnalysisResponse.model_json_schema()}"
        )

        response = await self._client.chat.completions.create(
            model=self._model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a corporate risk and compliance AI analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
        )

        raw_json = response.choices[0].message.content or "{}"
        return AnalysisResponse.model_validate_json(raw_json)`,
			runnable: true
		},
		{
			id: 'pydantic-schemas',
			title: 'Domain Schemas with Pydantic v2',
			filePath: 'app/schemas/analysis.py',
			description: 'Strongly typed request/response contracts for Quart analysis endpoints.',
			language: 'python',
			code: `from enum import Enum
from pydantic import BaseModel, Field

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AnalysisRequest(BaseModel):
    content: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="The document content to be evaluated"
    )
    domain: str = Field(default="general", pattern="^(general|fintech|health|legal)$")

class AnalysisResponse(BaseModel):
    summary: str = Field(description="Executive summary of findings")
    risk_level: RiskLevel
    findings: list[str] = Field(default_factory=list, description="Bullet points of identified issues")
    confidence_score: float = Field(ge=0.0, le=1.0, description="Model certainty calibration")`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Quart Blueprint Async Test Suite (pytest-asyncio + app.test_client())',
		testFilePath: 'tests/test_analysis_blueprint.py',
		command: 'pytest -v --cov=app tests/',
		executionTimeSec: 0.54,
		testCode: `import pytest
from unittest.mock import AsyncMock, MagicMock
from app import create_app
from app.schemas.analysis import AnalysisResponse, RiskLevel

@pytest.fixture
def app():
    app = create_app()
    app.config.update({"TESTING": True})
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.mark.asyncio
async def test_create_analysis_success(client, app, mocker):
    # Mock the AsyncOpenAI client in app.extensions
    mock_client = mocker.AsyncMock()
    mock_choice = MagicMock()
    mock_choice.message.content = (
        '{"summary": "Compliant document", "risk_level": "low", '
        '"findings": ["Standard footer"], "confidence_score": 0.98}'
    )
    mock_client.chat.completions.create.return_value.choices = [mock_choice]
    app.extensions["async_openai_client"] = mock_client

    res = await client.post(
        "/api/v1/analysis/",
        json={"content": "Employee onboarding document sample text here.", "domain": "fintech"}
    )
    assert res.status_code == 201
    data = await res.get_json()
    assert data["risk_level"] == "low"
    assert data["confidence_score"] == 0.98

@pytest.mark.asyncio
async def test_create_analysis_validation_failure(client):
    # Send payload violating min_length=10 constraint
    res = await client.post(
        "/api/v1/analysis/",
        json={"content": "short", "domain": "fintech"}
    )
    assert res.status_code == 422 # Pydantic validation failure in Quart handler
    data = await res.get_json()
    assert "errors" in data`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.14.7, pytest-9.1.1, pluggy-1.7.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: mock-3.17.0, cov-7.1.0, asyncio-1.4.1
collected 2 items

tests/test_analysis_blueprint.py::test_create_analysis_success PASSED    [ 50%]
tests/test_analysis_blueprint.py::test_create_analysis_validation_failure PASSED [100%]

---------- coverage: platform win32, python 3.14.7 -----------
Name                            Stmts   Miss  Cover   Missing
-------------------------------------------------------------
app/__init__.py                    14      0   100%
app/config.py                      18      0   100%
app/blueprints/__init__.py          0      0   100%
app/blueprints/analysis.py         16      0   100%
app/schemas/__init__.py             0      0   100%
app/schemas/analysis.py            16      0   100%
app/services/__init__.py            0      0   100%
app/services/analysis.py           15      0   100%
-------------------------------------------------------------
TOTAL                              79      0   100%

============================== 2 passed in 0.54s ===============================`,
		coverage: {
			files: [
				{ name: 'app/blueprints/analysis.py', stmts: 16, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/schemas/analysis.py', stmts: 16, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/services/analysis.py', stmts: 15, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/config.py', stmts: 18, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/__init__.py', stmts: 14, miss: 0, cover: '100%', missing: '' }
			],
			total: { stmts: 79, miss: 0, cover: '100%' }
		},
		summary:
			'All 2 tests passed. 100% overall test coverage across Quart factory, blueprint, schema, and service.'
	},
	interactiveComponent: 'code-comparison'
};
