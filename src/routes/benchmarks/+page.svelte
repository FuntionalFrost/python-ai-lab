<script lang="ts">
	import BenchmarkGraph from '#lib/components/BenchmarkGraph.svelte';
	import CodeBlock from '#lib/components/CodeBlock.svelte';
	import { Activity, ShieldCheck, Scale } from '@lucide/svelte';

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

	const judgePromptExample = `class RubricScore(BaseModel):
    factual_precision: int = Field(ge=1, le=5)
    clarity: int = Field(ge=1, le=5)
    groundedness: int = Field(ge=1, le=5)
    reasoning: str

async def evaluate_candidate(prompt: str, candidate_answer: str) -> RubricScore:
    completion = await client.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an impartial judge scoring candidate responses."},
            {"role": "user", "content": f"Query: {prompt}\\nAnswer: {candidate_answer}"}
        ],
        response_format=RubricScore
    )
    return completion.choices[0].message.parsed`;
</script>

<div class="space-y-10">
	<!-- Page Header -->
	<div class="border-b border-zinc-800/80 pb-6">
		<div class="mb-1 flex items-center gap-2 font-mono text-xs text-emerald-400">
			<Activity class="h-4 w-4" />
			<span>Telemetry & Quality Engineering</span>
		</div>
		<h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
			Evaluations, Latency & Benchmarks
		</h1>
		<p class="mt-2 max-w-3xl text-sm text-zinc-300">
			Move beyond impressionistic "vibe checks" to empirical telemetry: measure Time-To-First-Token
			(TTFT), token generation throughput under high concurrency, LLM-as-a-Judge rubrics, and
			automated pytest-cov 90%+ quality gates.
		</p>
	</div>

	<!-- Interactive Benchmark Graph Component -->
	<BenchmarkGraph />

	<!-- Evaluation Strategy Pillars -->
	<div class="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
		<!-- Pillar 1: pytest-cov Quality Gate -->
		<div class="space-y-3">
			<div class="flex items-center gap-2">
				<ShieldCheck class="h-5 w-5 text-emerald-400" />
				<h3 class="text-sm font-bold tracking-wide text-zinc-100 uppercase">
					CI Quality Gate: .coveragerc (&ge; 90%)
				</h3>
			</div>
			<p class="text-xs leading-relaxed text-zinc-400">
				Enforcing a strict 90% threshold ensures that routing logic, prompt generators, and Pydantic
				validators are covered by automated unit tests before any pull request can merge.
			</p>
			<CodeBlock code={coveragercConfig} language="ini" title=".coveragerc" />
		</div>

		<!-- Pillar 2: LLM-as-a-Judge Rubric -->
		<div class="space-y-3">
			<div class="flex items-center gap-2">
				<Scale class="h-5 w-5 text-cyan-400" />
				<h3 class="text-sm font-bold tracking-wide text-zinc-100 uppercase">
					LLM-as-a-Judge Structured Scoring
				</h3>
			</div>
			<p class="text-xs leading-relaxed text-zinc-400">
				Using OpenAI's Structured Outputs with Pydantic ensures the judge model produces valid
				numeric scores (1-5) and explanations that can be stored and graphed in telemetry databases.
			</p>
			<CodeBlock code={judgePromptExample} language="python" title="app/evals/judge.py" />
		</div>
	</div>
</div>
