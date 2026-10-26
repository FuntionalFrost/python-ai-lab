# Role & Project Overview

You are an expert full-stack engineer and curriculum architect specializing in SvelteKit and modern Python web/AI architectures.

Build a modular, interactive platform called **"Python AI Lab"** using **SvelteKit**, focused primarily on **prototyping, testing, and rapid iteration** (not production deployment or enterprise infrastructure). The platform must provide interactive guides, side-by-side architecture comparisons, executable code patterns, testing suites, and playground interfaces for:

1. **Modern Python Web Frameworks:** Rapid prototyping with Flask 3.x+ vs. Litestar (async-first, dependency injection, DTOs, OpenAPI).
2. **Architecture:** Clean, modular patterns for fast prototyping in AI-native Python backends.
3. **LLM Integrations:** Direct OpenAI SDK usage, streaming chat interfaces, JSON mode, and structured outputs with Pydantic v2.
4. **Tool Calling & Testing:** Multi-turn function calling, schema generation, deterministic mock execution, and automated validation.
5. **RAG & Agent Harnesses:** Vector search, contextual routing, agent evaluation harnesses, and trace testing.
6. **Testing & Quality Engineering:** Rapid test harnesses and deterministic unit/integration testing using `pytest`, `pytest-mock`, and `pytest-cov`.
7. **Benchmarking & Eval:** Latency, tokens/sec, tool call accuracy, and judge-model scoring for prompt/model iterations.
8. **Lifecycle & Iteration:** Fast prototyping patterns, prototype test harnesses, mock environments, and iterative refinement.

---

## Technical Stack & Architecture

### Frontend (SvelteKit)

- **Framework:** SvelteKit (TypeScript, Svelte 5 runes `$state`, `$derived`, `$props`).
- **Styling:** Tailwind CSS + Lucide Svelte icons.
- **Syntax Highlighting & Diffs:** Shiki or Prism with dark/light theme support and split-pane code diffs.
- **Interactive Playgrounds:**
  - Mock API responses with simulated latency and streaming (SSE) visualizer.
  - Interactive test-suite simulation showing real-time `pytest` terminal outputs and coverage reports.
  - Side-by-side code comparators (e.g., Flask MVC vs. Litestar DI pattern; Prototype vs. Production code).

### Backend Reference Implementations (Curriculum Data Layer)

All code samples, guides, and test modules must be fully runnable Python 3.13+ snippets relying exclusively on:

- Web: `flask>=3.1.3`, `litestar>=2.24.0`
- AI / Schema: `openai>=3.35.1`, `pydantic>=2.14.1`, `pydantic-settings>=2.16.0`
- Testing: `pytest>=9.0`, `pytest-mock>=3.17`, `pytest-cov>=7.1`

---

## Directory Structure to Generate

```text
ai-backend-lab/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── CodeBlock.svelte          # Syntax highlighter with copy & line highlights
│   │   │   ├── CodeComparison.svelte     # Dual-pane diff viewer (e.g., Flask vs Litestar)
│   │   │   ├── ChatPlayground.svelte     # Mock SSE streaming chat with latency simulator
│   │   │   ├── ToolExecutionVisualizer.svelte # Visualizes LLM tool call -> validation -> execution loop
│   │   │   ├── PytestRunnerModal.svelte  # Simulated terminal output for pytest execution
│   │   │   └── BenchmarkGraph.svelte     # Token latency / eval accuracy visualizer
│   │   ├── data/
│   │   │   ├── curriculum/
│   │   │   │   ├── 01-frameworks-mvc.ts
│   │   │   │   ├── 02-pydantic-settings.ts
│   │   │   │   ├── 03-llm-chat-streaming.ts
│   │   │   │   ├── 04-tool-calling-testing.ts
│   │   │   │   ├── 05-rag-pipelines.ts
│   │   │   │   ├── 06-agent-harnesses.ts
│   │   │   │   ├── 07-evals-benchmarks.ts
│   │   │   │   └── 08-prototype-to-production.ts
│   │   │   └── code-snippets/            # Pure Python reference snippets & tests
│   │   └── types/
│   │       └── curriculum.ts
│   └── routes/
│       ├── +layout.svelte                # Sidebar navigation, search, progress tracker
│       ├── +page.svelte                  # Dashboard & learning path selector
│       ├── module/[slug]/+page.svelte    # Interactive lesson view
│       ├── playground/chat/+page.svelte  # Standalone streaming & tool-call simulator
│       └── benchmarks/+page.svelte       # Interactive evaluation dashboard
```

---

## Curriculum Content Requirements

Build detailed, production-accurate technical lessons across 8 specific tracks:

### Track 1: Modern Flask vs. Litestar Architecture (MVC & DI)

- **Flask 3.x Pattern:** Modern App Factory (`create_app`), Blueprints, Service Layer pattern, and why classical Rails/Django MVC maps to Service/Repository layers in modern API design.
- **Litestar Pattern:** Controller architecture, Dependency Injection (`Provide`), auto-validation with Pydantic DTOs, async handlers vs. Flask threadpool.
- **Interactive Component:** Side-by-side controller comparison handling an incoming request, validating payloads, calling a business service, and returning structured JSON.

### Track 2: Settings, Schemas & Configuration

- **`pydantic-settings`:** Environment management with `BaseSettings`, nested configs (Database, OpenAI, Redis), `.env` validation, and secret masking (`SecretStr`).
- **Pydantic v2:** `BaseModel`, `Field`, `@field_validator`, `@model_validator(mode='after')`, and serialization with `model_dump_json()`.
- **Prototyping Pitfall:** Hardcoded keys and untyped `os.getenv()` vs. production validated settings injection.

### Track 3: Integrating LLM Chats & Streaming in Web Backends

- **OpenAI Client:** Synchronous client usage (`OpenAI`) for Flask and resilient connection reuse, timeout settings, and exponential backoff retry configuration.
- **Streaming in Flask:** `Response(stream_with_context(generate()), mimetype='text/event-stream')`.
- **Streaming in Litestar:** Native `ServerSentEvent` and `Stream` handlers with async generators.
- **Session & Memory:** Managing chat message history with Pydantic schemas (`ChatCompletionMessageParam`).

### Track 4: Tool Calling & Unit Testing Tool Executions

- **Tool Definition:** Generating OpenAI function schemas directly from Pydantic models using `pydantic.TypeAdapter` or Pydantic schemas.
- **Dispatch Engine:** Robust routing of tool calls, argument validation with `model_validate_json()`, error recovery on malformed JSON, and returning tool response messages.
- **Testing Tool Calls with `pytest` & `pytest-mock`:**
- Mocking the OpenAI API response (`openai.resources.chat.completions.Completions.create`).
- Verifying tool selection logic given specific prompts.
- Testing edge cases: invalid parameters, network failure during external tool execution, and parallel tool call handling.

### Track 5: Retrieval-Augmented Generation (RAG) Architecture

- **Pipeline:** Query preprocessing -> embedding generation -> vector storage retrieval -> context re-ranking -> prompt synthesis.
- **Testing RAG components:**
- Unit testing chunkers and retrieval ranking deterministically using fixtures.
- Testing LLM output fidelity given ground-truth injected context.

### Track 6: Building & Testing Agent Harnesses

- **Agent Harness Pattern:** Decoupling the LLM orchestration loop from the web transport layer.
- State management: keeping trace of loop count, tool call history, and termination criteria.
- Safety rails: maximum loop boundaries, token consumption limits, and schema guards.

- **Testing the Harness:**
- Deterministic replay harness using recorded tool fixtures.
- Integration testing with `pytest-mock` to assert the harness stops when target output is met or error conditions trigger.

### Track 7: Benchmarking, Metrics & User Satisfaction

- **Cross-Model Benchmarking:** Systematic evaluation across open-weight instruction-tuned LLM models with $\le 4\text{B}$ total/effective parameters (`gemma-4-e4b-it`, `gemma-4-e2b-it`, `gemma-3-1b-it`, `functiongemma-270m-it`) for latency, token economics, and qualitative response dynamics.
- **Same-Model Benchmarking & Ablation:** Evaluating the same model across prompt variations, few-shot exemplars, temperature/hyperparameters, and Pydantic schema guardrails.
- **Improving User Satisfaction at Prototype/Research Stage:**
  - Measuring authentic conversational dynamics: ambiguity disambiguation (asking crisp questions vs. hallucinating), conversational repair on user reversal, tone, and empathy.
  - Psychometric LLM-as-a-Judge rubrics returning structured Pydantic evaluations.
- **Latency & Telemetry:** Time To First Token (TTFT), Inter-Token Latency (ITL), and perceived responsiveness.
- **Automated Quality Gates:** Configuring `.coveragerc` and `pytest-mock` suites to enforce strict regression safety without altering frozen test prompts.

### Track 8: Prototyping vs. Production Engineering

Provide a comprehensive transition guide and code-diff visualizer covering:

1. **Config:** Raw `.env` / global variables $\to$ `pydantic-settings` with strict types and runtime checks.
2. **Client Management:** Instantiating `OpenAI()` inside route functions $\to$ single-instance async client injected via DI.
3. **Error Handling:** Uncaught OpenAI errors $\to$ domain-specific exceptions, fallback prompts, circuit breakers, and retry decorators (`tenacity`).
4. **Testing:** Manual Postman tests $\to$ CI test suites combining `pytest`, `pytest-mock`, and coverage thresholds.

---

## Concrete Code Requirements inside Curriculum

Every lesson file in `src/lib/data/curriculum/` must contain valid, idiomatic Python code blocks and corresponding test files. For example, the **Tool Calling** module must provide:

1. **Production Code Sample:**

```python
from typing import Any
from pydantic import BaseModel, Field
from openai import OpenAI
from app.config import Settings

class WeatherQuery(BaseModel):
    location: str = Field(description="City and country, e.g. Vienna, Austria")
    unit: str = Field(default="celsius", pattern="^(celsius|fahrenheit)$")

class AgentService:
    def __init__(self, client: OpenAI, settings: Settings) -> None:
        self.client = client
        self.model = settings.openai_model

    def execute_query(self, prompt: str) -> dict[str, Any]:
        # Tool call registration, dispatch, and schema enforcement
        ...

```

2. **Accompanying Test Suite (`pytest`, `pytest-mock`, `pytest-cov`):**

```python
import pytest
from unittest.mock import MagicMock
from app.services.agent import AgentService, WeatherQuery

def test_agent_dispatches_tool_call(mocker):
    # Setup mock OpenAI client and verify parsing with WeatherQuery model
    mock_client = mocker.MagicMock()
    ...

```

---

## Step-by-Step Implementation Instructions for the Agent

1. **Scaffold SvelteKit App:** Initialize standard SvelteKit layout with Tailwind CSS and Lucide icons.
2. **Build Reusable UI Primitives:**

- Create `CodeBlock.svelte` with syntax highlighting and copy-to-clipboard functionality.
- Create `CodeComparison.svelte` for side-by-side framework and prototype-vs-production diffs.
- Create `PytestRunnerModal.svelte` that renders a stylized terminal window displaying realistic stdout/stderr runs of `pytest --cov=app tests/`.

3. **Populate Curriculum Data Modules:**

- Create typed curriculum files under `src/lib/data/curriculum/` for all 8 tracks. Ensure all Python code snippets are complete, syntactically correct, and free of vague placeholders.

4. **Implement Interactive Playground:**

- Build a chat interface supporting simulated SSE streaming token outputs, inspectable payload bodies, tool call event timelines, and Pydantic validation status indicators.

5. **Add Progress & Navigation:**

- Persist completed lessons to `localStorage`.
- Provide a persistent table of contents and quick search across all frameworks, modules, and test patterns.
