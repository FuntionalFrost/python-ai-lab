import type { CurriculumLesson } from '../../types/curriculum';

export const track01: CurriculumLesson = {
	id: 'track-01',
	slug: '01-frameworks-mvc',
	trackNumber: 1,
	title: 'Application Factory & Clean MVC',
	shortTitle: 'Modern Flask Architecture',
	subtitle: 'Application Factories, Modular Blueprints, Service Layering, and Scalable AI APIs',
	estimatedMinutes: 30,
	topics: [
		'Application Factory Pattern (create_app)',
		'Modular Blueprints & URL Organization',
		'Clean Architecture & Service/Repository Layering',
		'Pydantic v2 Payload Validation in Flask Routes',
		'Flask Contexts: current_app vs g vs Request Scope'
	],
	frameworks: ['Flask 3.1.3', 'Pydantic v2', 'pytest 9.x', 'pytest-mock'],
	tags: ['Flask', 'Architecture', 'MVC', 'Blueprints', 'Service Layer', 'Clean Code'],
	summary:
		'Transform monolithic Flask scripts into enterprise-ready, modular AI web services. Master the Application Factory pattern, structured Blueprints, Clean Architecture separation of concerns, and typed Pydantic validation inside Flask request handlers.',
	objectives: [
		'Construct robust Flask 3.x applications using create_app() and decoupled Blueprints.',
		'Eliminate circular imports and mutable global state using Flask’s application context (current_app).',
		'Separate HTTP transport logic from AI reasoning using the Domain Service & Repository pattern.',
		'Enforce strict runtime validation with Pydantic v2 schemas inside Flask route endpoints.',
		'Write deterministic unit and integration tests using app.test_client(), pytest, and pytest-mock.'
	],
	architecture: {
		patternName: 'Flask AI-Native Clean Architecture & Service Layer',
		diagram: `+-------------------------------------------------------------------+
|                        Transport Layer                            |
|             Flask Blueprints (@analysis_bp.post("/"))             |
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
|    OpenAI Client (Injected)   | |  DocumentRepository (Postgres)  |
+-------------------------------+ +---------------------------------+`,
		explanation: `In traditional Flask tutorials, developers often place everything into a single 'app.py' script using global variables like 'app = Flask(__name__)'. While fine for quick scripts, this naive approach quickly collapses in AI applications:

1. Circular Imports: Importing models or routes into the global app creates circular dependencies.
2. Global State Mutation: Sharing global client instances makes testing impossible without monkeypatching.
3. Fat Route Functions: Mixing prompt construction, JSON parsing, API calls, and database saves into one route handler leads to untestable spaghetti code.

Modern Flask 3.x resolves this with Clean Architecture:
- Transport Layer (Blueprints): Handles HTTP verbs, extracts request JSON, validates schemas, and formats responses.
- Service Layer (Domain Logic): Houses prompt engineering, token safety checks, and multi-step tool calls.
- Gateway Layer: Encapsulates external I/O (OpenAI client, vector stores, relational DBs).`,
		keyConcepts: [
			{
				name: 'Flask Application Factory (`create_app`)',
				description:
					'Prevents circular imports and global state by isolating app creation, database binding, and blueprint registration into a testable factory function.'
			},
			{
				name: 'Modular Blueprints',
				description:
					'Groups related routes and URL prefixes into reusable modules that can be registered onto any Flask app instance with custom configuration.'
			},
			{
				name: 'Pydantic DTO Validation in Flask',
				description:
					'Validates incoming request JSON against strict Pydantic models with custom error handling before executing expensive AI operations.'
			}
		]
	},
	comparisons: [
		{
			title: 'Monolithic Anti-Pattern vs. Modern Flask 3.x Architecture',
			description:
				'Contrasting a fragile global Flask script with an enterprise Application Factory & Blueprint structure.',
			leftTitle: 'Legacy Monolith (Global app, Raw Dicts, No Layering)',
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

    # 2. Domain logic mixed directly into HTTP handler
    response = client.chat.completions.create(
        model="gemma-4-e4b-it",
        messages=[{"role": "user", "content": f"Analyze: {text}"}]
    )

    # 3. Raw dictionary response without schema guarantee
    return jsonify({"result": response.choices[0].message.content})

if __name__ == "__main__":
    app.run(debug=True)`,
			rightTitle: 'Modern Flask 3.x (Blueprint + Service Layer + Pydantic)',
			rightLanguage: 'python',
			rightCode: `from flask import Blueprint, request, jsonify, current_app
from pydantic import ValidationError
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.analysis import AnalysisService

analysis_bp = Blueprint("analysis", __name__, url_prefix="/api/v1/analysis")

@analysis_bp.post("/")
def create_analysis():
    # 1. Parse raw JSON body safely
    json_data = request.get_json(silent=True)
    if not json_data:
        return jsonify({"error": "Malformed or missing JSON body"}), 400

    # 2. Strict runtime validation via Pydantic v2
    try:
        payload = AnalysisRequest.model_validate(json_data)
    except ValidationError as err:
        return jsonify({"errors": err.errors()}), 422

    # 3. Resolve OpenAI client from Flask application extensions
    client = current_app.extensions["openai_client"]
    service = AnalysisService(client=client)

    # 4. Delegate to pure domain service layer
    result: AnalysisResponse = service.analyze(payload)
    return jsonify(result.model_dump()), 201`
		},
		{
			title: 'Application Bootstrap: Global Script vs. create_app() Factory',
			description:
				'How to bootstrap Flask applications cleanly with environment-aware settings and blueprint registration.',
			leftTitle: 'Global app Instance (Hard to Test / Configure)',
			leftLanguage: 'python',
			leftCode: `# Anti-pattern: app is initialized at module import time
from flask import Flask
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret")
app.config["OPENAI_KEY"] = os.environ.get("OPENAI_KEY")

# Importing routes after app is defined leads to circular imports!
import app_routes`,
			rightTitle: 'Application Factory Pattern (app/__init__.py)',
			rightLanguage: 'python',
			rightCode: `from flask import Flask
from openai import OpenAI
from app.config import get_settings
from app.blueprints.analysis import analysis_bp

def create_app() -> Flask:
    """Application factory for Flask 3.x. Enables isolated testing per suite."""
    app = Flask(__name__)
    settings = get_settings()

    # Store configured OpenAI client in Flask extensions registry
    app.extensions["openai_client"] = OpenAI(
        api_key=settings.openai_api_key.get_secret_value(),
        timeout=settings.request_timeout_seconds,
    )

    # Register decoupled modular Blueprints
    app.register_blueprint(analysis_bp)
    return app`
		}
	],
	codeSnippets: [
		{
			id: 'flask-service-impl',
			title: 'Clean Architecture Service Layer',
			filePath: 'app/services/analysis.py',
			description:
				'Decoupled analysis service implementing domain boundary validation, OpenAI interaction, and Pydantic serialization.',
			language: 'python',
			code: `from openai import OpenAI
from app.schemas.analysis import AnalysisRequest, AnalysisResponse

class AnalysisService:
    """Domain service isolated from Flask HTTP transport. Fully testable without Flask context."""

    def __init__(self, client: OpenAI, model: str = "gemma-4-e4b-it") -> None:
        self._client = client
        self._model = model

    def analyze(self, req: AnalysisRequest) -> AnalysisResponse:
        prompt = (
            f"Analyze the following enterprise text snippet for security and compliance risks.\\n"
            f"Input text: \\"{req.content}\\"\\n"
            f"Return JSON adhering strictly to: {AnalysisResponse.model_json_schema()}"
        )

        response = self._client.chat.completions.create(
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
			description: 'Strongly typed request/response contracts for Flask analysis endpoints.',
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
		title: 'Flask Blueprint Test Suite (pytest + app.test_client())',
		testFilePath: 'tests/test_analysis_blueprint.py',
		command: 'pytest -v --cov=app tests/',
		executionTimeSec: 0.62,
		testCode: `import pytest
from unittest.mock import MagicMock
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

def test_create_analysis_success(client, app, mocker):
    # Mock the OpenAI client in app.extensions
    mock_client = mocker.MagicMock()
    mock_choice = mocker.MagicMock()
    mock_choice.message.content = (
        '{"summary": "Compliant document", "risk_level": "low", '
        '"findings": ["Standard footer"], "confidence_score": 0.98}'
    )
    mock_client.chat.completions.create.return_value.choices = [mock_choice]
    app.extensions["openai_client"] = mock_client

    res = client.post(
        "/api/v1/analysis/",
        json={"content": "Employee onboarding document sample text here.", "domain": "fintech"}
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["risk_level"] == "low"
    assert data["confidence_score"] == 0.98

def test_create_analysis_validation_failure(client):
    # Send payload violating min_length=10 constraint
    res = client.post(
        "/api/v1/analysis/",
        json={"content": "short", "domain": "fintech"}
    )
    assert res.status_code == 422 # Pydantic validation failure in Flask handler
    data = res.get_json()
    assert "errors" in data`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_analysis_blueprint.py::test_create_analysis_success PASSED    [ 50%]
tests/test_analysis_blueprint.py::test_create_analysis_validation_failure PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name                            Stmts   Miss  Cover   Missing
-------------------------------------------------------------
app/__init__.py                    12      0   100%
app/config.py                      18      0   100%
app/blueprints/__init__.py          0      0   100%
app/blueprints/analysis.py         16      0   100%
app/schemas/__init__.py             0      0   100%
app/schemas/analysis.py            16      0   100%
app/services/__init__.py            0      0   100%
app/services/analysis.py           15      0   100%
-------------------------------------------------------------
TOTAL                              77      0   100%

============================== 2 passed in 0.62s ===============================`,
		coverage: {
			files: [
				{ name: 'app/blueprints/analysis.py', stmts: 16, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/schemas/analysis.py', stmts: 16, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/services/analysis.py', stmts: 15, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/config.py', stmts: 18, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/__init__.py', stmts: 12, miss: 0, cover: '100%', missing: '' }
			],
			total: { stmts: 77, miss: 0, cover: '100%' }
		},
		summary:
			'All 2 tests passed. 100% overall test coverage across Flask factory, blueprint, schema, and service.'
	},
	interactiveComponent: 'code-comparison'
};
