<script lang="ts">
	import BenchmarkGraph from '#lib/components/BenchmarkGraph.svelte';
	import CodeBlock from '#lib/components/CodeBlock.svelte';
	import { Activity, ShieldCheck, Scale, Wrench, Sliders } from '@lucide/svelte';

	const multiModelRunnerSnippet = `import asyncio
from pydantic_settings import BaseSettings, SettingsConfigDict
from openai import AsyncOpenAI
from app.schemas.eval_rubric import UserSatisfactionEval

# /benchmarks runs live concurrent LLM evaluations via AsyncOpenAI,
# whereas /tests runs deterministic synchronous unit tests via pytest.
class EvalSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    openai_api_key: str
    judge_model: str = "gemma-4-e4b-it"
    candidate_models: list[str] = [
        "gemma-4-e4b-it",
        "gemma-4-e2b-it",
        "gemma-3-1b-it",
        "functiongemma-270m-it"
    ]
    default_temperature: float = 0.1

sem = asyncio.Semaphore(10)

async def evaluate_case(client: AsyncOpenAI, settings: EvalSettings, model: str, case: dict) -> float:
    async with sem:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": HARDENED_SYSTEM_PROMPT},
                {"role": "user", "content": case["prompt"]}
            ],
            temperature=settings.default_temperature
        )
        rubric = await grade_with_judge(client, settings.judge_model, case["prompt"], response.choices[0].message.content)
        return rubric.overall_satisfaction

async def benchmark_models_on_frozen_cases(settings: EvalSettings, frozen_test_cases: list[dict]):
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    results = {}
    for model in settings.candidate_models:
        scores = await asyncio.gather(*(evaluate_case(client, settings, model, c) for c in frozen_test_cases))
        results[model] = sum(scores) / len(scores)
    return results

if __name__ == "__main__":
    asyncio.run(benchmark_models_on_frozen_cases(EvalSettings(), FROZEN_CASES))`;

	const hardenedToolSchemaSnippet = `from typing import Literal
from pydantic import BaseModel, Field, field_validator

class BookFlightQuery(BaseModel):
    """Hardened tool schema tolerating human colloquialisms & missing data."""
    destination: str = Field(
        description="IATA airport code or city name. Auto-corrects typos (e.g. 'sfo' -> 'SFO', 'lax' -> 'LAX')."
    )
    max_stops: int = Field(
        default=0,
        description="Number of layovers. Map 'no layovers' / 'direct' -> 0."
    )
    cabin: Literal["economy", "business"] = Field(
        default="economy",
        description="Seating class. Normalize 'cheap' -> 'economy'."
    )

    @field_validator("destination", mode="before")
    @classmethod
    def clean_destination(cls, v: str) -> str:
        return str(v).strip().upper()`;

	const satisfactionJudgeSnippet = `from pydantic import BaseModel, Field

class UserSatisfactionEval(BaseModel):
    """Psychometric evaluation rubric for authentic human dialogue."""
    ambiguity_handling: int = Field(ge=1, le=5, description="1=Guessed/rambled, 5=Asked 1 crisp clarifying question")
    conversational_repair: int = Field(ge=1, le=5, description="1=Ignored pushback, 5=Graceful immediate adjustment")
    tool_precision: int = Field(ge=1, le=5, description="1=Malformed/missing args, 5=Flawless parameter coercion")
    tone_and_deescalation: int = Field(ge=1, le=5, description="1=Defensive bot apologies, 5=Empathetic, concise, natural")
    overall_satisfaction: float = Field(ge=1.0, le=5.0, description="Weighted composite satisfaction score")
    reasoning: str = Field(description="Step-by-step psychological evaluation")`;

	const coveragercConfig = `[run]
branch = True
source = app
omit =
    app/main.py
    */__pycache__/*
    */tests/*

[report]
show_missing = True
skip_covered = False
fail_under = 90
exclude_lines =
    pragma: no cover
    raise NotImplementedError
    if __name__ == .__main__.:
    if TYPE_CHECKING:`;
</script>

<svelte:head>
	<title>Telemetry, Benchmarks & Evaluation Lab — Python AI Lab</title>
	<meta
		name="description"
		content="Empirical latency, throughput (TPS), and psychometric user satisfaction evaluations across open-weight <=4B LLMs and prompt ablations."
	/>
</svelte:head>

<div class="space-y-10">
	<!-- Page Header -->
	<div class="border-b border-zinc-800/80 pb-6">
		<div class="mb-1 flex items-center gap-2 font-mono text-xs text-emerald-400">
			<Activity class="h-4 w-4" />
			<span>Prototype Benchmarking, Psychology & Model Evaluation</span>
		</div>
		<h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
			Prototype Benchmarks & User Satisfaction Lab
		</h1>
		<p class="mt-2 max-w-3xl text-sm text-zinc-300">
			Benchmark prototypes across different LLM models and systematically benchmark the same model
			across prompt and schema variations. Focus on empirical testing to maximize real human
			satisfaction at the prototype and research stage before committing to production designs using
			<strong class="font-semibold text-white">openai</strong>,
			<strong class="font-semibold text-white">pydantic</strong>, and
			<strong class="font-semibold text-white">pydantic-settings</strong>.
		</p>
	</div>

	<!-- Interactive Benchmark Graph Component -->
	<BenchmarkGraph />

	<!-- Evaluation Strategy Pillars -->
	<div class="space-y-6 pt-4">
		<div>
			<h2 class="text-lg font-bold text-zinc-100">Prototype Evaluation & Satisfaction Pillars</h2>
			<p class="text-xs text-zinc-400">
				The 4 architectural cornerstones of empirical, real-user evaluation and iterative model
				tuning at the prototype stage.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Pillar 1: Cross-Model & Same-Model Evaluation Harness -->
			<div class="min-w-0 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
				<div class="flex items-center gap-2">
					<Sliders class="h-5 w-5 text-cyan-400" />
					<h3 class="text-sm font-bold tracking-wide text-zinc-100 uppercase">
						Cross-Model & Intra-Model Benchmarking
					</h3>
				</div>
				<p class="text-xs leading-relaxed text-zinc-400">
					Runs live concurrent benchmarks in <code class="text-zinc-300">/benchmarks</code> via
					<code class="text-zinc-300">AsyncOpenAI</code> &amp;
					<code class="text-zinc-300">asyncio.gather</code> across candidate models and prompt
					ablations, while keeping automated unit tests in <code class="text-zinc-300">/tests</code>
					synchronous.
				</p>
				<CodeBlock
					code={multiModelRunnerSnippet}
					language="python"
					title="benchmarks/run_evals.py"
				/>
			</div>

			<!-- Pillar 2: Psychometric Satisfaction Judge -->
			<div class="min-w-0 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
				<div class="flex items-center gap-2">
					<Scale class="h-5 w-5 text-purple-400" />
					<h3 class="text-sm font-bold tracking-wide text-zinc-100 uppercase">
						Research-Stage User Satisfaction Rubric
					</h3>
				</div>
				<p class="text-xs leading-relaxed text-zinc-400">
					Evaluates authentic conversational dynamics: Did the model ask one crisp clarifying
					question instead of guessing? Did it de-escalate frustration without defensive bot
					apologies?
				</p>
				<CodeBlock
					code={satisfactionJudgeSnippet}
					language="python"
					title="app/schemas/eval_rubric.py"
				/>
			</div>

			<!-- Pillar 3: Hardened Tool Calling with Pydantic -->
			<div class="min-w-0 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
				<div class="flex items-center gap-2">
					<Wrench class="h-5 w-5 text-emerald-400" />
					<h3 class="text-sm font-bold tracking-wide text-zinc-100 uppercase">
						Resilient Tool Schemas with @field_validator
					</h3>
				</div>
				<p class="text-xs leading-relaxed text-zinc-400">
					Improves tool-calling reliability for weaker models by adding parameter descriptions,
					synonym aliases, and Pydantic validators that safely normalize messy human speech.
				</p>
				<CodeBlock code={hardenedToolSchemaSnippet} language="python" title="app/tools/flight.py" />
			</div>

			<!-- Pillar 4: CI Quality Gate -->
			<div class="min-w-0 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
				<div class="flex items-center gap-2">
					<ShieldCheck class="h-5 w-5 text-amber-400" />
					<h3 class="text-sm font-bold tracking-wide text-zinc-100 uppercase">
						CI Quality Gate: .coveragerc (&ge; 90%)
					</h3>
				</div>
				<p class="text-xs leading-relaxed text-zinc-400">
					Enforces strict 90%+ branch test coverage on prompt generators, tool registries, and
					Pydantic validators, ensuring regressions are caught before pull requests can merge.
				</p>
				<CodeBlock code={coveragercConfig} language="ini" title=".coveragerc" />
			</div>
		</div>
	</div>
</div>
