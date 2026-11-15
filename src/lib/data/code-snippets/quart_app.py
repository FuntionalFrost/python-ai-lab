"""
Quart Reference Implementation
Demonstrates Application Factory, Async Blueprint, Pydantic v2 validation, and HTTPX2.
"""
from quart import Quart, Blueprint, request, jsonify, current_app
from pydantic import BaseModel, Field, ValidationError
from openai import AsyncOpenAI
import httpx2


class PromptPayload(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)


api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.post("/completion")
async def generate_completion():
    json_data = await request.get_json()
    if not json_data:
        return jsonify({"error": "Invalid or missing JSON"}), 400

    try:
        payload = PromptPayload.model_validate(json_data)
    except ValidationError as err:
        return jsonify({"validation_errors": err.errors()}), 422

    client: AsyncOpenAI = current_app.extensions["async_openai_client"]
    response = await client.chat.completions.create(
        model="gemma-4-e4b-it",
        messages=[{"role": "user", "content": payload.prompt}],
        temperature=payload.temperature,
    )

    return jsonify({
        "result": response.choices[0].message.content,
        "finish_reason": response.choices[0].finish_reason,
    }), 200


def create_app() -> Quart:
    app = Quart(__name__)
    app.extensions["async_openai_client"] = AsyncOpenAI()
    app.extensions["http_client"] = httpx2.AsyncClient(
        limits=httpx2.Limits(max_connections=50, max_keepalive_connections=15),
        timeout=httpx2.Timeout(connect=3.0, read=30.0, write=10.0, pool=5.0),
    )
    app.register_blueprint(api_bp)
    return app
