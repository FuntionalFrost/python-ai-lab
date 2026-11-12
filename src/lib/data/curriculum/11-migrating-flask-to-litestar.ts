import type { CurriculumLesson } from '../../types/curriculum';

export const track11: CurriculumLesson = {
	id: 'track-11',
	slug: '11-migrating-flask-to-litestar',
	trackNumber: 11,
	title:
		'Scale-Up Architecture: Migrating from Flask to Quart & Litestar (The ASGI Decision Matrix)',
	shortTitle: 'Scale-Up: Flask to Quart & Litestar',
	subtitle:
		'The ASGI Decision Matrix: Zero-Rewrite Pallets ASGI via Quart vs. Clean-Architecture Controllers via Litestar',
	estimatedMinutes: 45,
	topics: [
		'The ASGI Decision Matrix: When to choose Quart vs. Litestar',
		'Road A: Zero-Rewrite Pallets ASGI with Quart 0.23 on Hypercorn',
		'Road B: Clean-Architecture ASGI with Litestar 2.24 Controllers',
		'Eliminating Threadpool Starvation in Long-Running LLM Streams',
		'Automating Validation: manual request.json to Pydantic DTOs',
		'Async Testing: Quart with pytest-asyncio and Litestar with TestClient'
	],
	frameworks: [
		'Flask 3.1.3',
		'Quart 0.23+',
		'Litestar 2.24.0',
		'Hypercorn / Granian',
		'Pydantic v2',
		'pytest-asyncio>=0.25.0'
	],
	tags: ['Migration', 'Quart', 'Litestar', 'ASGI', 'Architecture', 'Refactoring'],
	summary:
		'Learn how to systematically scale a synchronous Flask application to async-first architectures without downtime. Evaluate the ASGI Decision Matrix: choose Road A (Zero-Rewrite Pallets ASGI with Quart 0.23 on Hypercorn) for rapid migration with existing Blueprints, or Road B (Clean Architecture with Litestar 2.24 on Granian) for compile-time DI, DTOs, and high-performance Rust-backed ASGI.',
	objectives: [
		'Evaluate the trade-offs between Quart (drop-in Pallets ASGI) and Litestar (clean-architecture ASGI) using the ASGI Decision Matrix.',
		'Migrate synchronous Flask Blueprints to asynchronous Quart coroutines with zero route restructuring.',
		'Convert imperative route handlers into declarative, type-safe Litestar Controllers with automatic Pydantic DTO validation.',
		'Eliminate thread-local globals (current_app, request) using Quart async contexts and Litestar Provide dependency injection.',
		'Write robust async test suites using quart.testing and litestar.testing under pytest-asyncio.'
	],
	architecture: {
		patternName: 'ASGI Decision Matrix & Migration Gateway',
		diagram: `+-------------------------------------------------------------------------+
|                    Reverse Proxy / API Gateway (Nginx / Envoy)          |
|                                                                         |
|      /api/v1/legacy/*  ---------------> [ Legacy Flask WSGI Service ]   |
|                                         - Gunicorn + Threadpool (WSGI)  |
|                                         - 1 OS thread per open stream   |
|                                                                         |
|      /api/v1/chat/*    ---------------> [ Road A: Quart 0.23 ASGI ]     |
|      (Zero-Rewrite)                     - Hypercorn ASGI Server         |
|                                         - 99% Flask API compatibility   |
|                                         - Async Blueprints & context    |
|                                                                         |
|      /api/v1/analysis/* ---------------> [ Road B: Litestar 2.24 ASGI ] |
|      (Clean Arch)                       - Granian / Uvicorn ASGI Server |
|                                         - Class Controllers & DTOs      |
|                                         - Compile-time Provide() DI     |
+-------------------------------------------------------------------------+
                                     |
               (Gradually shift routes until Flask is decommissioned)
                                     v
+-------------------------------------------------------------------------+
|                  Shared Database & Async LLM Infrastructure             |
+-------------------------------------------------------------------------+`,
		explanation: `When scaling out a synchronous Flask AI backend, developers face two distinct ASGI modernization paths:

1. Road A (Zero-Rewrite Pallets ASGI with Quart): Quart is the official async sibling of Flask in the Pallets ecosystem. It shares the exact same Blueprint, request, and extension paradigms while running natively on ASGI servers like Hypercorn. If you have an extensive existing Flask codebase and want non-blocking streaming without rewriting routes into classes, Quart is the fastest path to scale.
2. Road B (Clean-Architecture ASGI with Litestar): If you want to eliminate implicit thread-locals, enforce Pydantic DTOs at the framework boundary, and leverage compile-time Dependency Injection, Litestar provides high architectural rigor and peak throughput when served via Granian.
3. The Strangler Fig Gateway: Both paths can be rolled out incrementally behind an API Gateway (Nginx/Envoy), routing real-time SSE streaming endpoints to ASGI while leaving legacy CRUD on Flask until decommissioned.`,
		keyConcepts: [
			{
				name: 'The ASGI Decision Matrix',
				description:
					'Road A (Quart) minimizes migration effort by preserving Flask Blueprint idioms and context locals. Road B (Litestar) maximizes architectural purity and throughput via Controllers and compile-time DI.'
			},
			{
				name: 'WSGI vs. ASGI for LLM Streaming',
				description:
					'WSGI worker threads are pinned for the entire duration of a multi-second LLM stream. ASGI coroutines yield control back to the event loop on each token chunk, allowing a single worker to handle thousands of concurrent streams.'
			},
			{
				name: 'Context Locals vs. Explicit Provide() DI',
				description:
					'Quart modernizes Flask thread-locals into task-local async contexts. Litestar replaces magic globals entirely with explicit, verifiable dependency trees via Provide().'
			}
		]
	},
	comparisons: [
		{
			title: 'Road A (Zero-Rewrite): Flask 3.x Blueprint vs. Quart 0.23 Async Blueprint',
			description:
				'Showing how migrating to Quart preserves Flask syntax while converting synchronous I/O into native non-blocking coroutines.',
			leftTitle: 'Legacy Flask 3.x Blueprint (Imperative WSGI)',
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

    # 2. Manual Pydantic validation
    try:
        dto = SummaryRequest.model_validate(raw_data)
    except ValidationError as err:
        return jsonify({"validation_errors": err.errors()}), 422

    # 3. Pull client from untyped global dictionary
    llm_service = current_app.extensions.get("llm_service")

    # 4. Synchronous blocking call (blocks WSGI worker thread)
    result = llm_service.summarize_text_sync(dto.text, dto.max_tokens)
    return jsonify({"summary": result, "status": "success"}), 200`,
			rightTitle: 'Quart 0.23 Blueprint (Drop-In ASGI Coroutine)',
			rightLanguage: 'python',
			rightCode: `from quart import Blueprint, request, jsonify, current_app
from pydantic import ValidationError
from app.schemas.summary import SummaryRequest

# 100% familiar Pallets syntax: drop-in Blueprint replacement
summary_bp = Blueprint("summary", __name__, url_prefix="/api/summary")

@summary_bp.post("/")
async def generate_summary():
    # Asynchronous request parsing without thread blocking
    raw_data = await request.get_json()
    if not raw_data:
        return jsonify({"error": "Empty or invalid body"}), 400

    try:
        dto = SummaryRequest.model_validate(raw_data)
    except ValidationError as err:
        return jsonify({"validation_errors": err.errors()}), 422

    llm_service = current_app.extensions.get("llm_service")

    # Native non-blocking coroutine: yields event loop to Hypercorn
    result = await llm_service.summarize_text_async(dto.text, dto.max_tokens)
    return jsonify({"summary": result, "status": "success"}), 200`
		},
		{
			title: 'Road B (Clean Architecture): Quart Async Blueprint vs. Litestar 2.24 Controller',
			description:
				'Contrasting Pallets async route conventions with Litestar type-driven Controllers and compile-time DI.',
			leftTitle: 'Quart 0.23: Procedural Async Handler',
			leftLanguage: 'python',
			leftCode: `from quart import Blueprint, request, jsonify, current_app
from app.schemas.summary import SummaryRequest

summary_bp = Blueprint("summary", __name__, url_prefix="/api/summary")

@summary_bp.post("/")
async def generate_summary():
    # Manual extraction and global proxy access
    raw_data = await request.get_json()
    dto = SummaryRequest.model_validate(raw_data)
    service = current_app.extensions["llm_service"]

    summary = await service.summarize_text_async(dto.text, dto.max_tokens)
    return jsonify({"summary": summary, "status": "success"})`,
			rightTitle: 'Litestar 2.24: Class Controller & DTO Injection',
			rightLanguage: 'python',
			rightCode: `from litestar import Controller, post, status_codes
from app.schemas.summary import SummaryRequest, SummaryResponse
from app.services.llm import AsyncLLMService

class SummaryController(Controller):
    path = "/api/summary"

    @post(status_code=status_codes.HTTP_200_OK)
    async def generate_summary(
        self,
        # Automatic Pydantic DTO validation (returns 400/422 on failure)
        data: SummaryRequest,
        # Compile-time dependency injection: zero global context proxies
        llm_service: AsyncLLMService
    ) -> SummaryResponse:
        summary = await llm_service.summarize_text_async(data.text, data.max_tokens)
        return SummaryResponse(summary=summary, status="success")`
		},
		{
			title: 'Server Bootstrap: Hypercorn (Quart) vs. Granian (Litestar)',
			description: 'Comparison of ASGI bootstrap files and production command lines.',
			leftTitle: 'Quart + Hypercorn Bootstrap (app.py)',
			leftLanguage: 'python',
			leftCode: `from quart import Quart
from app.config import settings
from app.services.llm import AsyncLLMService
from app.blueprints.summary import summary_bp

def create_quart_app() -> Quart:
    app = Quart(__name__)
    app.extensions["llm_service"] = AsyncLLMService(settings)
    app.register_blueprint(summary_bp)
    return app

# Run with Hypercorn:
# hypercorn app:create_quart_app() --bind 0.0.0.0:8000 --workers 4`,
			rightTitle: 'Litestar + Granian Bootstrap (app.py)',
			rightLanguage: 'python',
			rightCode: `from litestar import Litestar
from litestar.di import Provide
from app.config import settings
from app.services.llm import AsyncLLMService
from app.controllers.summary import SummaryController

async def provide_llm() -> AsyncLLMService:
    return AsyncLLMService(settings)

app = Litestar(
    route_handlers=[SummaryController],
    dependencies={"llm_service": Provide(provide_llm, sync_to_thread=False)}
)

# Run with Granian (Rust ASGI):
# granian --interface asgi app:app --host 0.0.0.0 --port 8000 --workers 4`
		}
	],
	codeSnippets: [
		{
			id: 'quart-streaming-blueprint',
			title: 'Quart 0.23 Async Streaming Blueprint',
			filePath: 'app/blueprints/quart_chat.py',
			description:
				'Demonstrates non-blocking Server-Sent Events (SSE) streaming in Quart using native async generators.',
			language: 'python',
			code: `from quart import Blueprint, Response, request
import asyncio
import json

quart_chat_bp = Blueprint("quart_chat", __name__, url_prefix="/api/v1/chat")

@quart_chat_bp.post("/stream")
async def chat_stream():
    data = await request.get_json()
    prompt = data.get("prompt", "")

    async def generate():
        # Non-blocking async generator: yields event loop between tokens
        tokens = ["Quart ", "enables ", "zero-rewrite ", "Pallets ", "ASGI ", "streaming."]
        for token in tokens:
            await asyncio.sleep(0.02)
            payload = {"choices": [{"delta": {"content": token}}]}
            yield f"data: {json.dumps(payload)}\\n\\n"
        yield "data: [DONE]\\n\\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )`,
			runnable: true
		},
		{
			id: 'migration-service-layer',
			title: 'Dual-Compatible Service Layer (Sync + Async)',
			filePath: 'app/services/llm.py',
			description:
				'Facilitates incremental migration by supporting both synchronous Flask calls and asynchronous Quart/Litestar coroutines using AsyncOpenAI.',
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
				'Contracts used by Flask validation logic, Quart endpoints, and Litestar DTO automated handlers.',
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
		title: 'ASGI Async Migration Test Suite (Quart & Litestar with pytest-asyncio)',
		testFilePath: 'tests/test_migration_asgi.py',
		command: 'pytest -v tests/test_migration_asgi.py',
		executionTimeSec: 0.82,
		testCode: `import pytest
from unittest.mock import AsyncMock, MagicMock
from litestar.testing import TestClient as LitestarClient
from app.controllers.summary import app as litestar_app
from app.blueprints.quart_chat import quart_chat_bp
from quart import Quart

@pytest.fixture
def quart_app():
    app = Quart(__name__)
    app.register_blueprint(quart_chat_bp)
    return app

# Test Road A: Quart async client with pytest-asyncio
@pytest.mark.asyncio
async def test_quart_stream_endpoint(quart_app):
    client = quart_app.test_client()
    response = await client.post(
        "/api/v1/chat/stream",
        json={"prompt": "Explain ASGI advantages"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
    chunks = await response.get_data()
    assert b"data: [DONE]" in chunks

# Test Road B: Litestar dependency-injected test client
def test_litestar_controller_validation():
    with LitestarClient(app=litestar_app) as client:
        res = client.post("/api/summary", json={"text": "too short", "max_tokens": 50})
        assert res.status_code == 400
        assert "Validation failed" in res.text or "text" in res.text.lower()`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: anyio-4.6.2, mock-3.17.0, asyncio-0.25.0
collected 2 items

tests/test_migration_asgi.py::test_quart_stream_endpoint PASSED          [ 50%]
tests/test_migration_asgi.py::test_litestar_controller_validation PASSED [100%]

============================== 2 passed in 0.82s ===============================`,
		coverage: {
			files: [
				{ name: 'app/blueprints/quart_chat.py', stmts: 16, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/controllers/summary.py', stmts: 12, miss: 0, cover: '100%', missing: '' },
				{ name: 'app/schemas/summary.py', stmts: 8, miss: 0, cover: '100%', missing: '' }
			],
			total: { stmts: 36, miss: 0, cover: '100%' }
		},
		summary:
			'All 2 tests passed. 100% test coverage confirming asynchronous execution for both Quart (Road A) and Litestar (Road B).'
	},
	interactiveComponent: 'benchmark'
};
