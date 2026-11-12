---
name: python-ai-lab
description: Guide and operational standard for prototyping, testing, benchmarking, and iterating on AI backends and web interfaces using modern Python (Flask/Litestar, Pydantic v2, pytest-mock) and SvelteKit 3. Enforces <=4B open-weight model benchmarking, deterministic synchronous unit testing, and fail-fast configuration.
---

# Python AI Lab: Prototyping, Testing & Benchmarking Standard

This skill guides AI agents and developers in scaffolding, testing, and benchmarking modern Python AI prototypes and web interfaces. It focuses on rapid iteration, deterministic testing, empirical telemetry, and lean architectures.

---

## 1. Primary Mandate & Core Principles

1. **Prototype First**: Build fast, testable, and lean prototypes of AI backends and web interfaces. Avoid premature optimization, heavy DevOps/orchestration, or over-engineered enterprise setups.
2. **Deterministic & Fast Testing**: Emphasize automated test harnesses (`pytest`, `pytest-mock`, deterministic mocks, replay fixtures) that enable instant validation of prototypes without flaky network calls or LLM API costs.
3. **Cross-Model & Intra-Model Benchmarking**:
   - **Cross-Model Benchmarking**: Systematically benchmark prototypes across open-weight instruction-tuned LLMs with $\le 4\text{B}$ total/effective parameters:
     - `gemma-4-e4b-it` (primary versatile 4B instruction model)
     - `gemma-4-e2b-it` (lightweight edge-optimized 2B model)
     - `gemma-3-1b-it` (ultra-fast 1B instruction model)
     - `functiongemma-270m-it` (specialized compact tool-calling model)
   - **Intra-Model Benchmarking**: Benchmark and ablate the _same_ model across prompt variants, few-shot exemplars, temperature/hyperparameters, and Pydantic schema guardrails.
4. **User Satisfaction Metrics**: Evaluate prototypes on conversational repair on user corrections, ambiguity disambiguation, concise empathetic tone, and low latency streaming responsiveness (TTFT).

---

## 2. Configuration & Secrets (`app/config.py`)

- **Fail-Fast Principle**: Validate all configuration at startup using `pydantic-settings` (`BaseSettings`).
- **Secret Protection**: Wrap all API keys and credentials in `SecretStr` to prevent accidental logging or trace leaks.
- **Module-Level Singleton Pattern**:
  ```python
  # app/config.py
  from pydantic import SecretStr
  from pydantic_settings import BaseSettings, SettingsConfigDict

  class Settings(BaseSettings):
      model_config = SettingsConfigDict(
          env_file=".env",
          env_file_encoding="utf-8",
          extra="ignore"
      )
      openai_api_key: SecretStr
      default_model: str = "gemma-4-e4b-it"
      max_concurrency: int = 10

  settings = Settings()
  ```

---

## 3. Testing Architecture: `/tests` vs. `/benchmarks`

Establish a strict architectural separation between **unit tests** and **live benchmarks**:

### A. Unit Tests (`/tests`) - Fast & Deterministic (Synchronous Default & `pytest-asyncio` for Async Handlers)

- **Default to synchronous tests (`def test_*`)**: For domain schemas, prompt assembly, and standard route logic, use synchronous tests with `pytest-mock` (`mocker.patch`). Mocks return in microseconds ($\approx 0.01\text{ms}$) with zero event-loop overhead.
- **Async tests (`async def test_*`)**: When testing `flask[async]` endpoints directly or Litestar ASGI controllers (`AsyncTestClient`), write native `async def test_*` functions supported by `pytest-asyncio` (`asyncio_mode = "auto"` with function loop scope).
- In both sync and async tests, replace all external LLM and network calls with in-memory mocks (`MagicMock` / `AsyncMock`).
- Example (Sync):
  ```python
  def test_chat_service_completion(mocker):
      mock_create = mocker.patch("openai.resources.chat.completions.Completions.create")
      mock_create.return_value.choices = [
          mocker.MagicMock(message=mocker.MagicMock(content="Mocked response"))
      ]
      res = generate_answer("Hello")
      assert res == "Mocked response"
  ```
- Example (Async via `pytest-asyncio`):
  ```python
  async def test_async_in_route_benchmark(mocker):
      mock_client = mocker.AsyncMock()
      mock_client.chat.completions.create.return_value.choices = [
          mocker.MagicMock(message=mocker.MagicMock(content="Async analysis"))
      ]
      res = await evaluate_candidate(mock_client, mocker.AsyncMock(), "gemma-4-e4b-it", "test prompt")
      assert res.model == "gemma-4-e4b-it"
  ```

### B. Live Benchmarks (`/benchmarks`) - Concurrent `asyncio.run()`

- Live evaluations query real LLM endpoints over the network.
- Use `AsyncOpenAI`, `asyncio.gather()`, and `asyncio.Semaphore(10)` to safely saturate rate limits.
- Execute as a standalone script via Python's built-in `asyncio.run()`—no pytest plugins required:
  ```python
  import asyncio
  from openai import AsyncOpenAI

  async def run_matrix(models: list[str], test_cases: list[str]):
      sem = asyncio.Semaphore(10)
      client = AsyncOpenAI()
      async def run_one(model, case):
          async with sem:
              return await client.chat.completions.create(model=model, messages=[{"role": "user", "content": case}])
      tasks = [run_one(m, c) for m in models for c in test_cases]
      return await asyncio.gather(*tasks)

  if __name__ == "__main__":
      results = asyncio.run(run_matrix(["gemma-4-e4b-it", "gemma-4-e2b-it"], ["Hello!"]))
  ```

### C. In-Route Benchmarks with `flask[async]` & `httpx`

- When triggering multi-model benchmarks or prompt ablations directly from a Flask route or HTMX dashboard, use `flask[async]` (`async def` view handlers).
- Fan out concurrently using `asyncio.gather()`, `AsyncOpenAI`, and non-blocking `httpx.AsyncClient` for tool calls, returning rendered Jinja2 templates directly in ~2.5s without Redis or Celery.
- Unit tests for these endpoints remain 100% synchronous via Flask's `test_client().post()` and `pytest-mock`.

---

## 4. Real-Time Token Streaming (SSE)

### Flask 3.x Backend

Always use `stream_with_context` and set non-buffering headers for reverse proxies:

```python
@chat_bp.post("/stream")
def stream_chat():
    def generate():
        stream = client.chat.completions.create(model="gemma-4-e4b-it", stream=True, messages=...)
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                yield f"data: {json.dumps({'token': delta})}\n\n"
        yield "data: [DONE]\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
```

### Client Consumption Choices

- **Hypermedia / Rapid Prototypes (Flask + Jinja2 + htmx)**:
  Use `htmx-ext-sse` (`<div hx-ext="sse" sse-connect="/stream" sse-swap="token">`) for zero-JS prototypes. Test rendered HTML fragments using `BeautifulSoup4` and lint templates with `djlint`.
- **Full Web Application (SvelteKit 3 BFF)**:
  Use SvelteKit `+server.ts` to proxy requests and isolate private `$env` secrets. In the browser component, consume using `fetch() + ReadableStream` with a `TextDecoder` and push tokens into Svelte 5 `$state` runes.

---

## 5. Resilient External HTTP Integrations (HTTPX)

- **Synchronous in Flask Prototypes**: Use `httpx.Client()` with `httpx.Limits(max_connections=100, max_keepalive_connections=20)` and `httpx.HTTPTransport(retries=3)` for external tools, search APIs, and webhooks.
- **Structured Timeouts**: Always specify granular timeouts via `httpx.Timeout(connect=3.05, read=60.0, write=10.0, pool=5.0)`.
- **Deterministic Unit Testing**: Mock `httpx.Client.send()` using `pytest-mock` (`mocker.patch.object(client, "send")`). Tests execute in milliseconds with zero network sockets.
- **Litestar Bridge**: The synchronous `httpx.Client` API translates 1:1 to `httpx.AsyncClient` when scaling to Litestar ASGI (Track 11).

---

## 6. The ASGI Modernization Decision Matrix: Quart vs. Litestar

When scaling a synchronous Flask AI backend to asynchronous ASGI to support high-concurrency LLM streaming:

- **Road A: Zero-Rewrite Pallets ASGI (Quart 0.23 + Hypercorn)**:
  - Official Pallets async framework sharing 99% Flask API compatibility.
  - Drop-in async Blueprints and task-local async contexts (`request`, `current_app`).
  - Convert `stream_with_context(generate())` to native `async def generate(): async for chunk in stream: yield ...`.
  - Non-blocking coroutines eliminate WSGI worker threadpool exhaustion on streaming connections.
  - Run with `hypercorn app:app --bind 0.0.0.0:8000 --workers 4`.
  - Test with `quart.testing.QuartClient` and `pytest-asyncio`.

- **Road B: Clean-Architecture ASGI (Litestar 2.24 + Granian)**:
  - Class-based Controllers and automated Pydantic DTO validation at the framework boundary.
  - Compile-time dependency injection (`Provide()`), eliminating thread-local and global proxies.
  - Peak throughput on Rust-based Granian ASGI server.
  - Run with `granian --interface asgi app:app --host 0.0.0.0 --port 8000 --workers 4`.
  - Test with Litestar's `TestClient` / `AsyncTestClient` with dependency overrides.
