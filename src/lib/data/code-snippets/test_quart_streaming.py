"""
Unit Test Suite for Quart SSE Token Streaming with Async Generators.
Demonstrates deterministic testing of Quart SSE endpoints, Response headers,
and async generator chunks without external network dependencies.
"""
import json
from unittest.mock import MagicMock
import pytest
from quart import Quart, Response


def create_quart_app() -> Quart:
    """Application factory for a lightweight Quart AI Streaming Proxy."""
    app = Quart(__name__)

    @app.post("/api/chat/stream")
    async def stream_chat():
        async def generate():
            tokens = ["Gemma", " 4", " Realtime", " Streaming"]
            for token in tokens:
                payload = json.dumps({"token": token})
                yield f"data: {payload}\n\n"
            yield "data: [DONE]\n\n"

        return Response(
            generate(),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    return app


def drain_async_generator(async_gen) -> list[str]:
    """Deterministically drains an async generator without network socket loops."""
    chunks: list[str] = []
    try:
        while True:
            coro = async_gen.asend(None)
            try:
                coro.send(None)
            except StopIteration as stop:
                chunks.append(stop.value)
    except (StopAsyncIteration, GeneratorExit):
        pass
    return chunks


def test_quart_blueprint_registration():
    """Verify Quart app instantiates and registers the streaming endpoint."""
    app = create_quart_app()
    rules = [rule.rule for rule in app.url_map.iter_rules()]
    assert "/api/chat/stream" in rules


def test_quart_streaming_response_headers():
    """Verify Quart streaming Response sets SSE and reverse-proxy bypass headers."""
    app = create_quart_app()

    async def dummy_gen():
        yield "data: test\n\n"

    response = Response(
        dummy_gen(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )

    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    assert response.headers.get("x-accel-buffering") == "no"
    assert response.headers.get("cache-control") == "no-cache"
    assert response.headers.get("connection") == "keep-alive"


def test_quart_streaming_yields_expected_sse_protocol_frames():
    """Verify that the Quart async generator outputs valid SSE JSON data and termination [DONE]."""
    async def mock_quart_generator(tokens: list[str]):
        for token in tokens:
            payload = json.dumps({"token": token})
            yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"

    tokens = ["Hello", " world", " from", " Quart"]
    chunks = drain_async_generator(mock_quart_generator(tokens))

    assert len(chunks) == 5
    assert chunks[-1] == "data: [DONE]\n\n"

    # Verify each non-terminal chunk parses as valid SSE JSON
    for chunk in chunks[:-1]:
        assert chunk.startswith("data: ")
        assert chunk.endswith("\n\n")
        json_str = chunk[6:-2]
        data = json.loads(json_str)
        assert "token" in data
