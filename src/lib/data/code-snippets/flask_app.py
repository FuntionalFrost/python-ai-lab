"""
Flask 3.x Reference Implementation
Demonstrates Application Factory, Blueprint, and Service Layer with Pydantic v2.
"""
from flask import Flask, Blueprint, request, jsonify, current_app
from pydantic import BaseModel, Field, ValidationError
from openai import OpenAI

class PromptPayload(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)

api_bp = Blueprint("api", __name__, url_prefix="/api")

@api_bp.post("/completion")
def generate_completion():
    json_data = request.get_json(silent=True)
    if not json_data:
        return jsonify({"error": "Invalid or missing JSON"}), 400

    try:
        payload = PromptPayload.model_validate(json_data)
    except ValidationError as err:
        return jsonify({"validation_errors": err.errors()}), 422

    client: OpenAI = current_app.extensions["openai_client"]
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": payload.prompt}],
        temperature=payload.temperature,
    )

    return jsonify({
        "result": response.choices[0].message.content,
        "finish_reason": response.choices[0].finish_reason,
    }), 200

def create_app() -> Flask:
    app = Flask(__name__)
    app.extensions["openai_client"] = OpenAI()
    app.register_blueprint(api_bp)
    return app
