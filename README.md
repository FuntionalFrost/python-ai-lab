# Python AI Lab

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Svelte](<https://img.shields.io/badge/Svelte-5%20(Runes)-FF3E00?logo=svelte&logoColor=white>)](https://svelte.dev)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-3-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Python](https://img.shields.io/badge/Python-3.13%2B-3776AB?logo=python&logoColor=white)](https://python.org)
[![Litestar](https://img.shields.io/badge/Litestar-2.24%2B-edb641)](https://litestar.dev)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2.14%2B-E92063?logo=pydantic&logoColor=white)](https://docs.pydantic.dev)
[![Requests](https://img.shields.io/badge/Requests-2.32%2B-2b5b84?logo=python&logoColor=white)](https://requests.readthedocs.io)
[![htmx](https://img.shields.io/badge/htmx-2.x-3366cc?logo=htmx&logoColor=white)](https://htmx.org)
[![djlint](https://img.shields.io/badge/linted%20with-djlint-10b981)](https://www.djlint.com)
[![pytest](https://img.shields.io/badge/tested%20with-pytest-0A9EDC?logo=pytest&logoColor=white)](https://pytest.org)

**An interactive lab for rapidly prototyping, testing, benchmarking, and iterating on modern Python Web & AI backend architectures.**

[Explore Curriculum](#curriculum-tracks) • [Interactive Features](#interactive-platform-features) • [Quickstart](#quickstart) • [Tech Stack](#tech-stack)

</div>

---

## Overview

Building AI backends requires fast feedback loops: quickly constructing prototypes, verifying behaviors with deterministic test harnesses, benchmarking across models, and iterating rapidly on prompts, tool definitions, and system architectures.

**Python AI Lab** is a modular, interactive platform built with **SvelteKit 3** and **Svelte 5** (runes) paired with fully tested, runnable **Python 3.13+** prototype patterns. Rather than getting bogged down in premature production infrastructure, this lab focuses on:

- **Rapid Prototyping:** Lean architectures in Flask 3.x and Litestar with Pydantic v2.
- **Deterministic Testing:** Test harnesses using `pytest-mock`, deterministic mocks, and replay fixtures.
- **Cross-Model Benchmarking:** Comparing open-weight instruction-tuned candidate models with $\le 4\text{B}$ total/effective parameters (`gemma-4-e4b-it`, `gemma-4-e2b-it`, `gemma-3-1b-it`, `functiongemma-270m-it`) on latency, throughput, token cost, and tool precision.
- **Same-Model Benchmarking & Tuning:** Ablating prompts, few-shot exemplars, temperature, and schema guardrails on the same model to uncover optimal prototype configurations.
- **User Satisfaction at Prototype Stage:** Measuring and boosting real human satisfaction using psychometric LLM-as-a-judge rubrics (ambiguity resolution, conversational repair, empathy, and perceived latency).

---

## Interactive Platform Features

The platform is not just static documentation—it includes live interactive simulators and execution harnesses:

- **Simulated SSE Streaming Chat:** Configurable Time-To-First-Token (TTFT) and Inter-Token Latency (ITL) sliders, live chunk monitor, and Pydantic validation status indicators.
- **Cross-Model & Intra-Model Benchmark Explorer:** Dynamic bar and line charts comparing cross-model performance (`gemma-4-e4b-it`, `gemma-4-e2b-it`, `gemma-3-1b-it`, `functiongemma-270m-it`) and interactive system levers to evaluate the impact of prompt guardrails, few-shot examples, and Pydantic schemas on the same model.
- **Psychometric User Satisfaction Evaluator:** Interactive rubrics measuring authentic conversational dynamics (ambiguity disambiguation, conversational repair on user reversal, tone de-escalation, tool precision).
- **Closed-Loop Tool Call Visualizer:** Step through the 5-stage LLM function calling lifecycle (Prompt $\to$ LLM Tool Proposal $\to$ Pydantic Validation $\to$ Python Execution $\to$ Synthesis) with interactive schema error injection (`unit="kelvin"`).
- **Realistic Pytest Terminal Modal:** Watch animated test suites execute line-by-line with ANSI highlights, `--cov` coverage breakdowns, `-v` verbose flags, and failure simulations.
- **Side-by-Side Code Comparators:** Dual-pane diff viewers comparing Flask 3.x vs. Litestar 2.24, and Hackathon Prototype vs. Production-grade patterns.
- **Concurrency Load Simulator:** Live throughput & latency benchmark graphing how Flask's synchronous threadpool saturates under load compared to Litestar's non-blocking ASGI event loop.
- **Command Palette Search:** Fast global navigation across all 12 tracks and tools (**Cmd+K** / **Ctrl+K**).

---

## Curriculum Tracks

The platform features 12 comprehensive tracks organized into rapid prototyping/testing foundations (Tracks 01–09) followed by full-stack, production deployment, and ASGI scaling (Tracks 10–12):

| #      | Track                                                 | Focus & Architectural Concepts                                                                                                                        | Stack                                          |
| :----- | :---------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------- |
| **01** | **Application Factory & Clean MVC**                   | Flask 3.x `create_app` factory, modular Blueprints, Clean Architecture Service/Repository layering, and Pydantic DTO request validation.              | Flask 3.1, Pydantic v2, pytest-mock            |
| **02** | **Settings & Schemas with Pydantic v2**               | `pydantic-settings` `BaseSettings`, `SecretStr` key masking, fail-fast environment validation, and module-level singleton pattern.                    | Pydantic v2, pydantic-settings                 |
| **03** | **Resilient HTTP with Requests**                      | `requests.Session` connection pooling, `urllib3.util.Retry` exponential backoff, granular tuple timeouts, and `pytest-mock` testing.                  | Requests 2.32+, urllib3, pytest-mock           |
| **04** | **LLM Chats & Streaming Backends**                    | Flask `stream_with_context` Server-Sent Events (SSE), connection pooling, chunk delimiters, and sliding-window conversational memory.                 | Flask 3.1, OpenAI SDK, SSE                     |
| **05** | **Live Async Benchmarks (`/benchmarks`) vs `/tests`** | Separating sync unit tests (`/tests`) from concurrent live evals (`/benchmarks`) with `AsyncOpenAI`, `asyncio.gather`, TTFT/TPS, and judge rubrics.   | AsyncOpenAI, asyncio, Pydantic v2, pytest-mock |
| **06** | **Tool Calling & Unit Testing**                       | Generating OpenAI function schemas from Pydantic models, multi-turn dispatch engine, self-healing recovery, and `pytest-mock` parameter assertions.   | OpenAI, Pydantic v2, pytest-mock               |
| **07** | **RAG Pipelines & Testing**                           | Semantic chunking, cosine vector similarity, in-memory vector store protocols, grounded context injection, and deterministic fixtures.                | OpenAI Embeddings, Pydantic v2                 |
| **08** | **Building & Testing Agent Harnesses**                | Decoupling LLM loops from web transports, state machine controllers, step-count circuit breakers (`MaxIterationsExceededError`), and replay fixtures. | OpenAI SDK, pytest-mock                        |
| **09** | **Hypermedia AI Prototypes (htmx & Jinja2)**          | Zero-build AI interfaces, `hx-post` chat feeds, declarative `htmx-ext-sse` token streaming, Jinja2 partials, and `djlint` template quality gates.     | htmx 2.x, Flask 3.1, Jinja2, djlint, pytest    |
| **10** | **Production WSGI & Hardening**                       | Gunicorn worker concurrency (`gthread` vs. `gevent`), long-running streaming timeouts, Tenacity exponential jitter backoff, and Nginx proxying.       | Gunicorn, Tenacity, Nginx                      |
| **11** | **Scale-Up: Migrating to Litestar (ASGI)**            | Strangler Fig gateway cutover, converting Blueprints to Controllers, eliminating `current_app` globals, and `TestClient` testing.                     | Flask 3.x, Litestar 2.24, Granian/Uvicorn      |
| **12** | **Connecting to SvelteKit**                           | Full-Stack AI Integration: SvelteKit BFF, consuming backend SSE streams with Svelte 5 runes (`$state`, `$derived`), and type-safe contracts.          | SvelteKit 3, Svelte 5, TypeScript              |

---

## Quickstart

### 1. Frontend (SvelteKit Platform)

Ensure you have **Node.js 24+** and **pnpm** installed:

```bash
# Clone the repository
git clone https://github.com/your-username/python-ai-lab.git
cd python-ai-lab

# Install dependencies
pnpm install

# Start local development server
pnpm dev

# Type check, lint, and build static assets
pnpm check
pnpm lint
pnpm build
```

The interactive platform will be available at `http://localhost:5173`.

### 2. Python Reference Code & Test Suites

Ensure you have **Python 3.13+** installed (we recommend [uv](https://github.com/astral-sh/uv) for blazing-fast workflow):

#### Option A: Using `uv` (Recommended)

```bash
# Run test suites directly (uv manages virtualenv & dependencies automatically)
uv run pytest -v

# Or sync the environment locally
uv sync
```

#### Option B: Standard `venv` & `pip`

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run all test suites
pytest -v
```

---

## Directory Structure

```text
python-ai-lab/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Dual-stack CI (SvelteKit + Python tests)
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── CodeBlock.svelte       # Syntax highlighter with line numbers & copy
│   │   │   ├── CodeComparison.svelte  # Side-by-side diff comparator
│   │   │   ├── ChatPlayground.svelte  # Simulated SSE streaming chat & inspector
│   │   │   ├── ToolExecutionVisualizer.svelte # 5-stage tool loop with error injection
│   │   │   ├── PytestRunnerModal.svelte # Animated terminal test execution modal
│   │   │   └── BenchmarkGraph.svelte  # Concurrency & latency load visualizer
│   │   ├── data/
│   │   │   ├── curriculum/            # All 12 typed curriculum modules
│   │   │   └── code-snippets/         # Pure Python runnable reference snippets & tests
│   │   └── types/
│   │       └── curriculum.ts          # TypeScript type definitions
│   └── routes/
│       ├── +layout.svelte             # Sidebar navigation, search, and progress bar
│       ├── +page.svelte               # Dashboard & curriculum roadmap
│       ├── module/[slug]/+page.svelte # Dynamic lesson module view
│       ├── playground/chat/+page.svelte # Standalone streaming simulator
│       └── benchmarks/+page.svelte    # Telemetry and eval dashboard
├── pyproject.toml                     # Python 3.13 build & test configuration
├── requirements.txt                   # Pip dependencies for curriculum code
├── LICENSE                            # MIT License
└── vite.config.ts                     # SvelteKit configuration with static adapter
```

---

## Tech Stack

- **Frontend & Hypermedia:** [SvelteKit 3](https://kit.svelte.dev) + [Svelte 5](https://svelte.dev) (Runes `$state`, `$derived`, `$props`), [htmx 2.x](https://htmx.org), [Tailwind CSS v4](https://tailwindcss.com), [Lucide Svelte](https://lucide.dev), [PrismJS](https://prismjs.com).
- **Python Backends:** Python 3.13+, [Flask 3.1](https://flask.palletsprojects.com), [Jinja2 3.1](https://jinja.palletsprojects.com), [Litestar 2.24](https://litestar.dev).
- **HTTP & AI Networking:** [Requests](https://requests.readthedocs.io) (`requests.Session` + `urllib3.util.Retry`), [OpenAI Python SDK](https://github.com/openai/openai-python), [Pydantic v2](https://docs.pydantic.dev), [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/), [tenacity](https://tenacity.readthedocs.io/).
- **Testing, Linting & Quality:** [pytest 9](https://pytest.org), [pytest-mock](https://github.com/pytest-dev/pytest-mock), [pytest-cov](https://pytest-cov.readthedocs.io/), [djlint](https://www.djlint.com), [BeautifulSoup4](https://beautiful-soup-4.readthedocs.io/).

---

## Contributing

Contributions are welcome! If you'd like to propose a new track (e.g., DSPy optimization, local vLLM/Ollama streaming, or agent memory graphs):

1. Fork the repo and create your branch (`git checkout -b feature/new-track`).
2. Add your curriculum module under `src/lib/data/curriculum/`.
3. Ensure `pnpm check`, `pnpm lint`, and `pnpm build` pass with zero errors.
4. Submit a Pull Request describing your architecture pattern and test suite.

---

## License

This project is licensed under the [MIT License](LICENSE).
