# Python AI Lab

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Svelte](<https://img.shields.io/badge/Svelte-5%20(Runes)-FF3E00?logo=svelte&logoColor=white>)](https://svelte.dev)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-3-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Python](https://img.shields.io/badge/Python-3.13%2B-3776AB?logo=python&logoColor=white)](https://python.org)
[![Litestar](https://img.shields.io/badge/Litestar-2.24%2B-edb641)](https://litestar.dev)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2.14%2B-E92063?logo=pydantic&logoColor=white)](https://docs.pydantic.dev)
[![pytest](https://img.shields.io/badge/tested%20with-pytest-0A9EDC?logo=pytest&logoColor=white)](https://pytest.org)

**An interactive self-teaching platform and production curriculum for modern Python Web & AI backend architectures.**

[Explore Curriculum](#curriculum-tracks) • [Interactive Features](#interactive-platform-features) • [Quickstart](#quickstart) • [Tech Stack](#tech-stack)

</div>

---

## Overview

Most AI tutorials stop at basic Jupyter notebooks or fragile single-file scripts. In production, however, AI backends fail due to **socket exhaustion**, **unhandled rate limits**, **threadpool starvation**, and **untyped configuration drift**.

**Python AI Lab** is a modular, interactive educational platform built with **SvelteKit 3** and **Svelte 5** (runes) accompanied by fully tested, runnable **Python 3.13+** reference architectures. It bridges the gap between quick prototypes and enterprise-grade AI services using **Clean Architecture**, **Dependency Injection**, **Pydantic v2 validation**, and **`pytest-mock` test suites**.

---

## Interactive Platform Features

The platform is not just static documentation—it includes live interactive simulators and execution harnesses:

- **Simulated SSE Streaming Chat:** Configurable Time-To-First-Token (TTFT) and Inter-Token Latency (ITL) sliders, live chunk monitor, and Pydantic validation status indicators.
- **Closed-Loop Tool Call Visualizer:** Step through the 5-stage LLM function calling lifecycle (Prompt $\to$ LLM Tool Proposal $\to$ Pydantic Validation $\to$ Python Execution $\to$ Synthesis) with interactive schema error injection (`unit="kelvin"`).
- **Realistic Pytest Terminal Modal:** Watch animated test suites execute line-by-line with ANSI highlights, `--cov` coverage breakdowns, `-v` verbose flags, and failure simulations.
- **Side-by-Side Code Comparators:** Dual-pane diff viewers comparing Flask 3.x vs. Litestar 2.24, and Hackathon Prototype vs. Production-grade patterns.
- **Concurrency Load Simulator:** Live throughput & latency benchmark graphing how Flask's synchronous threadpool saturates under load compared to Litestar's non-blocking ASGI event loop.
- **Local Progress Tracker:** Browser-persisted (`localStorage`) track completion badges and instant global search (**Cmd+K**).

---

## Curriculum Tracks

The platform features 10 comprehensive, production-grade technical tracks:

| #      | Track                                   | Focus & Architectural Concepts                                                                                                           | Stack                                 |
| :----- | :-------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| **01** | **Flask vs. Litestar Architecture**     | App Factory & Blueprints vs. Litestar Controllers, Compile-time Dependency Injection (`Provide`), Clean Architecture Service Layer.      | Flask 3.1, Litestar 2.24              |
| **02** | **Settings & Schemas with Pydantic v2** | `pydantic-settings` `BaseSettings`, `SecretStr` log protection, nested config trees, and `@model_validator(mode='after')`.               | Pydantic v2, pydantic-settings        |
| **03** | **LLM Chats & Streaming Backends**      | `AsyncOpenAI` connection pooling, Flask `stream_with_context` vs. Litestar `ServerSentEvent`, sliding-window memory buffers.             | OpenAI SDK, Litestar, Flask           |
| **04** | **Tool Calling & Unit Testing**         | Generating OpenAI function schemas from Pydantic models, dispatch registries, self-healing error recovery, and `pytest-mock` assertions. | OpenAI, Pydantic, pytest-mock         |
| **05** | **RAG Pipelines & Testing**             | Semantic chunking, cosine vector similarity, in-memory vector store protocols, grounded context injection, and deterministic fixtures.   | OpenAI Embeddings, Pydantic           |
| **06** | **Building & Testing Agent Harnesses**  | Decoupling LLM loops from web transports, step-count circuit breakers (`MaxIterationsExceededError`), and replay fixtures.               | OpenAI SDK, pytest-mock               |
| **07** | **Benchmarking, Metrics & Model Evals** | TTFT and ITL telemetry, LLM-as-a-Judge rubrics with structured Pydantic outputs, and `.coveragerc` $\ge 90\%$ quality gates.             | pytest-cov, OpenAI Structured Outputs |
| **08** | **Prototyping vs. Production**          | The 4 Pillars: Strict config, client DI pooling, exponential backoff with `tenacity`, and CI test suites with fallback degradation.      | Tenacity, Litestar, Pydantic          |
| **09** | **Migrating from Flask to Litestar**    | Strangler Fig gateway cutover, converting Blueprints to Controllers, eliminating `current_app` globals, and `AsyncTestClient` testing.   | Flask 3.x, Litestar 2.24              |
| **10** | **Moving from Litestar to SvelteKit**   | Backend-for-Frontend (BFF) pattern, Web-standard `ReadableStream` SSE endpoints (`+server.ts`), and compile-time `$env/static/private`.  | SvelteKit 3, TypeScript, OpenAI Node  |

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
│   │   │   ├── curriculum/            # All 10 typed curriculum modules
│   │   │   └── code-snippets/         # Pure Python runnable reference snippets & tests
│   │   ├── types/
│   │   │   └── curriculum.ts          # TypeScript type definitions
│   │   └── progress.svelte.ts         # Svelte 5 reactive progress store
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

- **Frontend:** [SvelteKit 3](https://kit.svelte.dev) + [Svelte 5](https://svelte.dev) (Runes `$state`, `$derived`, `$props`), [Tailwind CSS v4](https://tailwindcss.com), [Lucide Svelte](https://lucide.dev), [PrismJS](https://prismjs.com).
- **Python Backends:** Python 3.13+, [Flask 3.1](https://flask.palletsprojects.com), [Litestar 2.24](https://litestar.dev).
- **AI & Schemas:** [OpenAI Python SDK](https://github.com/openai/openai-python), [Pydantic v2](https://docs.pydantic.dev), [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/), [tenacity](https://tenacity.readthedocs.io/).
- **Testing & Quality:** [pytest 9](https://pytest.org), [pytest-mock](https://github.com/pytest-dev/pytest-mock), [pytest-cov](https://pytest-cov.readthedocs.io/).

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
