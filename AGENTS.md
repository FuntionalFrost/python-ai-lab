## Project Configuration

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Add-ons**: prettier, eslint, tailwindcss, sveltekit-adapter, ai-tools

---

## Core Project Focus: Prototyping, Testing, Benchmarking & Rapid Iteration

> **PRIMARY MANDATE**: Focus this project mainly on **prototyping, testing, benchmarking, and iterating on prototypes**, NOT on production or enterprise infrastructure.

### Guiding Principles:

1. **Prototype First**: Build fast, testable, and lean prototypes of AI backends and web interfaces. Avoid premature optimization, heavy DevOps/orchestration, or over-engineered enterprise setups.
2. **Deterministic & Fast Testing**: Emphasize automated test harnesses (`pytest`, `pytest-mock`, deterministic mocks, replay fixtures) that enable instant validation of prototypes without flaky network calls or LLM API costs.
3. **Cross-Model & Intra-Model Benchmarking**:
   - **Cross-Model Benchmarking**: Systematically benchmark prototypes across different LLM models (e.g., GPT-4o, GPT-4o-mini, Claude, Gemma, Llama) on latency, TTFT, token throughput, parameter precision, and cost.
   - **Same-Model Benchmarking**: Benchmark and ablate the _same_ LLM model across prompt variants, few-shot exemplars, temperature/hyperparameters, and Pydantic schema guardrails.
4. **User Satisfaction at Prototype & Research Stage**:
   - Focus testing and benchmarking on metrics that directly impact real user satisfaction early in development: ambiguity disambiguation, conversational repair on corrections, concise empathetic tone, and low latency streaming responsiveness.
   - Evaluate with structured LLM-as-a-judge rubrics and frozen human dialogue test sets before writing production code.
5. **Tight Iteration Loops**: Optimize for rapid experimentation: flexible schema validation with Pydantic v2, interactive playgrounds, mock SSE streams, simulated tool loops, and prompt/eval iteration.
6. **Explore & Iterate**: Use comparisons (e.g., Flask vs. Litestar, different mocking strategies, prompt variations) to experiment with prototyping techniques and iterate quickly on ideas.

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
