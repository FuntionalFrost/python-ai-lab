import type { CurriculumLesson } from '../../types/curriculum';

export const track01: CurriculumLesson = {
	id: 'track-01',
	slug: '01-frameworks-mvc',
	trackNumber: 1,
	title: 'Modern Flask 3.x vs. Litestar Architecture (MVC & DI)',
	shortTitle: 'Flask vs. Litestar MVC & DI',
	subtitle: 'Clean Architecture, Dependency Injection, and Async Execution in Modern AI Backends',
	level: 'Beginner',
	estimatedMinutes: 30,
	topics: [
		'Application Factory Pattern',
		'Blueprints vs Litestar Controllers',
		'Clean Architecture & Service Layer',
		'Dependency Injection (Provide)',
		'Async Event Loops vs Threadpool WSGI'
	],
	frameworks: ['Flask 3.1.3', 'Litestar 2.24.0', 'Pydantic v2'],
	tags: ['Architecture', 'MVC', 'Dependency Injection', 'Async', 'Web API'],
	summary:
		'Compare Flask 3.x application factories and Blueprints with Litestar’s async-first controller architecture and compile-time dependency injection. Learn how to structure AI backend services using Clean Architecture and the Service/Repository pattern.',
	objectives: [
		'Construct modern Flask 3.x applications using create_app() and decoupled Blueprints.',
		'Implement high-throughput async endpoints in Litestar 2.24 using Controllers and Pydantic DTOs.',
		'Map classical Django/Rails MVC into modern Domain Service & Repository layers for AI workloads.',
		'Leverage Litestar’s Provide dependency injection to decouple LLM clients and repositories.',
		'Write deterministic unit and integration tests using pytest and pytest-mock.'
	],
	architecture: {
		patternName: 'AI-Native Clean Architecture & Service/Repository Pattern',
		diagram: `+-------------------------------------------------------------------+
|                        Transport Layer                            |
|  Flask Blueprints (@bp.post)   |   Litestar Controller (@post)     |
+--------------------------------+----------------------------------+
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
|    AsyncOpenAI (Injected)     | |  DocumentRepository (Postgres)  |
+-------------------------------+ +---------------------------------+`,
		explanation: `In traditional web development, the Model-View-Controller (MVC) pattern frequently leads to bloated "Fat Models" or "Fat Controllers". In AI-native Python web backends, we decouple transport from intelligence:

1. Transport (Controller / Blueprint): Responsible exclusively for HTTP semantics, status codes, and input/output deserialization.
2. Service Layer: Contains domain logic, prompt synthesis, tool dispatching, and token limit assertions.
3. Gateway / Repository Layer: Encapsulates external I/O (AsyncOpenAI client, vector databases, relational persistence).

Flask 3.x executes in a synchronous WSGI model by default, requiring threadpool dispatching for long-running streaming LLM calls. Litestar runs natively on ASGI (uvicorn/granian), offering native async non-blocking concurrency and type-safe compile-time dependency injection.`,
		keyConcepts: [
			{
				name: 'Flask Application Factory (`create_app`)',
				description:
					'Prevents circular imports and global state by isolating app creation, database binding, and blueprint registration into a testable factory function.'
			},
			{
				name: 'Litestar Dependency Injection (`Provide`)',
				description:
					'Resolves services, database connections, and AI clients with zero runtime overhead by computing dependency trees ahead of time.'
			},
			{
				name: 'Pydantic DTO Validation',
				description:
					'Automatic type coercion, OpenAPI schema generation, and JSON body parsing before request handlers are invoked.'
			}
		]
	},
	comparisons: [
		{
			title: 'Controller Architecture: Request Validation & Service Call',
			description:
				'Side-by-side comparison handling an incoming AI analysis request: validating payload, delegating to an injected service, and returning structured JSON.',
			leftTitle: 'Flask 3.x (Blueprint + Manual Service Instantiation)',
			leftLanguage: 'python',
			leftCode: `from flask import Blueprint, request, jsonify, current_app
from pydantic import ValidationError
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.analysis import AnalysisService

analysis_bp = Blueprint("analysis", __name__, url_prefix="/api/v1/analysis")

@analysis_bp.post("/")
def create_analysis():
    # 1. Parse raw JSON body
    json_data = request.get_json(silent=True)
    if not json_data:
        return jsonify({"error": "Malformed or missing JSON"}), 400

    # 2. Validate with Pydantic v2
    try:
        payload = AnalysisRequest.model_validate(json_data)
    except ValidationError as err:
        return jsonify({"errors": err.errors()}), 422

    # 3. Resolve dependencies from current_app context
    llm_client = current_app.extensions["openai_client"]
    service = AnalysisService(client=llm_client)

    # 4. Execute domain logic
    result: AnalysisResponse = service.analyze_sync(payload)
    return jsonify(result.model_dump()), 201`,
			rightTitle: 'Litestar 2.24 (Controller + Dependency Injection + DTO)',
			rightLanguage: 'python',
			rightCode: `from litestar import Controller, post, status_codes
from litestar.di import Provide
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.analysis import AsyncAnalysisService

class AnalysisController(Controller):
    path = "/api/v1/analysis"

    @post(status_code=status_codes.HTTP_201_CREATED)
    async def create_analysis(
        self,
        data: AnalysisRequest, # Auto-validated by Litestar via Pydantic
        analysis_service: AsyncAnalysisService # Injected via Provide()
    ) -> AnalysisResponse:
        """
        Litestar auto-deserializes JSON into AnalysisRequest,
        handles 400/422 errors automatically, and resolves
        the AsyncAnalysisService dependency without globals.
        """
        return await analysis_service.analyze_async(data)`
		},
		{
			title: 'App Configuration & Dependency Wiring',
			description: 'How each framework wires clients and services during bootstrap.',
			leftTitle: 'Flask 3.x: Application Factory (app.py)',
			leftLanguage: 'python',
			leftCode: `from flask import Flask
from openai import OpenAI
from app.config import get_settings
from app.blueprints.analysis import analysis_bp

def create_app() -> Flask:
    app = Flask(__name__)
    settings = get_settings()

    # Store client in Flask extensions dictionary
    app.extensions["openai_client"] = OpenAI(
        api_key=settings.openai_api_key.get_secret_value(),
        timeout=settings.request_timeout_seconds,
    )

    app.register_blueprint(analysis_bp)
    return app`,
			rightTitle: 'Litestar 2.24: Async DI Container (app.py)',
			rightLanguage: 'python',
			rightCode: `from litestar import Litestar
from litestar.di import Provide
from openai import AsyncOpenAI
from app.config import get_settings
from app.controllers.analysis import AnalysisController
from app.services.analysis import AsyncAnalysisService

async def provide_openai_client() -> AsyncOpenAI:
    settings = get_settings()
    return AsyncOpenAI(
        api_key=settings.openai_api_key.get_secret_value(),
        timeout=settings.request_timeout_seconds,
    )

async def provide_analysis_service(client: AsyncOpenAI) -> AsyncAnalysisService:
    return AsyncAnalysisService(client=client)

app = Litestar(
    route_handlers=[AnalysisController],
    dependencies={
        "client": Provide(provide_openai_client, sync_to_thread=False),
        "analysis_service": Provide(provide_analysis_service, sync_to_thread=False),
    },
)`
		}
	],
	codeSnippets: [
		{
			id: 'litestar-service-impl',
			title: 'Clean Architecture Service Layer (Async)',
			filePath: 'app/services/analysis.py',
			description:
				'Async analysis service implementing domain boundary validation, OpenAI interaction, and Pydantic serialization.',
			language: 'python',
			code: `from typing import Protocol
from openai import AsyncOpenAI
from app.schemas.analysis import AnalysisRequest, AnalysisResponse, RiskLevel

class AnalysisServiceInterface(Protocol):
    async def analyze_async(self, req: AnalysisRequest) -> AnalysisResponse:
        ...

class AsyncAnalysisService:
    def __init__(self, client: AsyncOpenAI, model: str = "gpt-4o-mini") -> None:
        self._client = client
        self._model = model

    async def analyze_async(self, req: AnalysisRequest) -> AnalysisResponse:
        # Structured system instructions enforcing domain rules
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
			description: 'Strongly typed request/response contracts for analysis endpoints.',
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
		title: 'Unit & Controller Test Suite (pytest + pytest-mock)',
		testFilePath: 'tests/test_analysis_controller.py',
		command: 'pytest -v --cov=app tests/',
		executionTimeSec: 0.84,
		testCode: `import pytest
from unittest.mock import AsyncMock, MagicMock
from litestar.testing import AsyncTestClient
from app.main import app
from app.schemas.analysis import AnalysisResponse, RiskLevel
from app.services.analysis import AsyncAnalysisService

@pytest.fixture
def mock_analysis_service(mocker):
    service = mocker.MagicMock(spec=AsyncAnalysisService)
    service.analyze_async = mocker.AsyncMock()
    return service

@pytest.mark.asyncio
async def test_create_analysis_success(mock_analysis_service):
    # Setup mock return value
    expected_response = AnalysisResponse(
        summary="Compliant document with minor PII disclaimer needed",
        risk_level=RiskLevel.LOW,
        findings=["Found standard email address in footer"],
        confidence_score=0.98
    )
    mock_analysis_service.analyze_async.return_value = expected_response

    # Override Litestar dependency injection in test scope
    with app.override_dependencies(
        dependencies={"analysis_service": lambda: mock_analysis_service}
    ):
        async with AsyncTestClient(app=app) as client:
            res = await client.post(
                "/api/v1/analysis",
                json={"content": "Employee onboarding document sample text here.", "domain": "fintech"}
            )
            assert res.status_code == 201
            data = res.json()
            assert data["risk_level"] == "low"
            assert data["confidence_score"] == 0.98
            assert mock_analysis_service.analyze_async.await_count == 1

@pytest.mark.asyncio
async def test_create_analysis_validation_failure():
    async with AsyncTestClient(app=app) as client:
        # Send payload violating min_length=10 constraint
        res = await client.post(
            "/api/v1/analysis",
            json={"content": "short", "domain": "fintech"}
        )
        assert res.status_code == 400 # Litestar validation exception
        data = res.json()
        assert "content" in str(data).lower()`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: anyio-4.6.2, mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_analysis_controller.py::test_create_analysis_success PASSED   [ 50%]
tests/test_analysis_controller.py::test_create_analysis_validation_failure PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name                            Stmts   Miss  Cover   Missing
-------------------------------------------------------------
app/__init__.py                     0      0   100%
app/config.py                      18      0   100%
app/controllers/__init__.py         0      0   100%
app/controllers/analysis.py        12      0   100%
app/schemas/__init__.py             0      0   100%
app/schemas/analysis.py            16      0   100%
app/services/__init__.py            0      0   100%
app/services/analysis.py           19      1    95%   24
-------------------------------------------------------------
TOTAL                              65      1    98%

============================== 2 passed in 0.84s ===============================`,
		coverage: {
			files: [
				{ name: 'app/controllers/analysis.py', stmts: 12, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/schemas/analysis.py', stmts: 16, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/services/analysis.py', stmts: 19, miss: 1, cover: '95%', missing: '24' },
				{ name: 'app/config.py', stmts: 18, miss: 0, cover: '100%', missing: '' }
			],
			total: { stmts: 65, miss: 1, cover: '98%' }
		},
		summary: 'All 2 tests passed. 98% overall test coverage across controller, schema, and service.'
	},
	interactiveComponent: 'code-comparison'
};
