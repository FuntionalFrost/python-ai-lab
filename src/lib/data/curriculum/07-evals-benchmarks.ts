import type { CurriculumLesson } from '../../types/curriculum';

export const track07: CurriculumLesson = {
	id: 'track-07',
	slug: '07-evals-benchmarks',
	trackNumber: 7,
	title: 'Benchmarking, Metrics & Model Evals',
	shortTitle: 'Evals, Latency & Coverage',
	subtitle: 'TTFT, Tokens/Sec, LLM-as-a-Judge Rubrics, and pytest-cov 90%+ Enforcement',
	level: 'Advanced',
	estimatedMinutes: 40,
	topics: [
		'Time To First Token (TTFT) & Inter-Token Latency (ITL)',
		'LLM-as-a-Judge Rubrics with Pydantic Structured Outputs',
		'Deterministic Assertion Evals vs Model Grading',
		'Configuring .coveragerc for AI Backends',
		'CI/CD Quality Gates & Regressions'
	],
	frameworks: ['pytest>=9.0', 'pytest-cov>=7.1', 'pydantic>=2.14.1', 'openai>=3.35.1'],
	tags: ['Evaluation', 'Benchmarking', 'Latency', 'Coverage', 'LLM-as-a-Judge'],
	summary:
		'Move beyond "vibe checks" to empirical telemetry and quantitative evaluations. Measure TTFT and token throughput, build automated LLM-as-a-Judge evaluation pipelines with Pydantic rubric schemas, and enforce 90%+ code coverage on business logic using pytest-cov.',
	objectives: [
		'Measure streaming performance metrics: TTFT (Time To First Token) and ITL (Inter-Token Latency).',
		'Implement an LLM-as-a-Judge evaluator outputting structured Pydantic rubric scores (1 to 5).',
		'Combine deterministic unit assertions (schema validity, regex checks) with heuristic model grading.',
		'Configure .coveragerc to bypass external network interfaces while enforcing strict 90%+ coverage on prompts and agents.',
		'Automate regression testing in CI pipelines to block deployment of deteriorating prompts.'
	],
	architecture: {
		patternName: 'Dual-Layer Evaluation Harness: Deterministic + Judge Model',
		diagram: `+-------------------------------------------------------------------------+
|                         Candidate LLM Generation                         |
| Prompt -> Candidate Model (gpt-4o-mini) -> Generated Output Response    |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| Layer 1: Deterministic Assertions (Fast, Zero Cost, 0ms)                |
| - Pydantic schema validation (model_validate_json)                      |
| - Key presence check ("contains expected keywords")                     |
| - Regex format matching (e.g. valid ISO dates, no markdown leaks)       |
+---------------------------------+---------------------------------------+
                                  |
                                  v (If assertions pass)
+-------------------------------------------------------------------------+
| Layer 2: LLM-as-a-Judge (Rubric Scoring, Heuristic Quality)             |
| Candidate Output + Ground Truth Reference + Scoring Rubric              |
|                                |                                        |
|                                v                                        |
|                     Judge Model (gpt-4o)                                |
|                                |                                        |
|                                v                                        |
|             Pydantic Structured Evaluation Rubric:                      |
|             - Accuracy (1-5), Completeness (1-5),                       |
|             - Groundedness (1-5), Reasoning Justification               |
+-------------------------------------------------------------------------+`,
		explanation: `Relying purely on human manual testing ("vibes") makes continuous improvement impossible. A production AI evaluation architecture employs a two-tier strategy:

1. Deterministic Assertion Gates: Executes in microseconds. Checks that the output complies with JSON schemas, contains necessary keys, and matches strict regex patterns. If this fails, the test halts immediately without calling expensive judge models.
2. LLM-as-a-Judge Model: Compares the candidate answer against reference criteria using an independent, more capable model (such as GPT-4o). The judge emits structured Pydantic scores with reasoning justifications, allowing statistical tracking of model degradation across git commits.`,
		keyConcepts: [
			{
				name: 'Time To First Token (TTFT)',
				description:
					'The latency from when the HTTP request is dispatched until the very first token byte is received by the client. Critical for perceived user responsiveness.'
			},
			{
				name: 'Inter-Token Latency (ITL)',
				description:
					'The elapsed duration between consecutive stream chunks. Low ITL ensures smooth, human-like reading speeds without stuttering.'
			},
			{
				name: 'pytest-cov .coveragerc Configuration',
				description:
					'Excludes untestable external third-party I/O mocks while failing the build if agent domain logic drops below 90% test coverage.'
			}
		]
	},
	comparisons: [
		{
			title: 'Unstructured String Eval vs. Pydantic Rubric Judge',
			description:
				'Parsing loose text from a judge model vs. guaranteed Pydantic structured rubric scoring.',
			leftTitle: 'Naive Judge (Unstructured String Output)',
			leftLanguage: 'python',
			leftCode: `# Anti-pattern: Asking model "Is this answer good?"
# 1. Output is arbitrary English ("Yes, it looks mostly good.")
# 2. Cannot parse into CI metrics or numeric databases
# 3. Inconsistent scoring criteria
async def evaluate_naive(candidate_answer: str):
    prompt = f"Rate this answer from 1 to 5: {candidate_answer}"
    resp = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )
    # FRAGILE: parsing int(resp.content) often fails on "I give this a 4/5"
    return resp.choices[0].message.content`,
			rightTitle: 'Production Pydantic Rubric Judge',
			rightLanguage: 'python',
			rightCode: `class EvalRubric(BaseModel):
    factual_accuracy: int = Field(ge=1, le=5, description="1=Hallucinated, 5=Flawless")
    clarity_and_tone: int = Field(ge=1, le=5, description="1=Confusing, 5=Exemplary")
    reasoning: str = Field(description="Step-by-step justification")
    passed: bool = Field(description="True if all criteria >= 4")

async def evaluate_with_rubric(question: str, answer: str) -> EvalRubric:
    resp = await client.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[...],
        response_format=EvalRubric # Guaranteed schema adherence
    )
    return resp.choices[0].message.parsed`
		}
	],
	codeSnippets: [
		{
			id: 'latency-tracker-implementation',
			title: 'Streaming Latency & Throughput Benchmark Collector',
			filePath: 'app/telemetry/benchmarks.py',
			description:
				'Accurate time calculation for TTFT, ITL, and tokens per second during live streaming.',
			language: 'python',
			code: `import time
from dataclasses import dataclass, field
from collections.abc import AsyncIterator

@dataclass
class StreamMetrics:
    ttft_ms: float = 0.0
    total_latency_ms: float = 0.0
    token_count: int = 0
    itl_history_ms: list[float] = field(default_factory=list)

    @property
    def tokens_per_sec(self) -> float:
        duration_sec = self.total_latency_ms / 1000.0
        return round(self.token_count / duration_sec, 2) if duration_sec > 0 else 0.0

    @property
    def avg_itl_ms(self) -> float:
        return round(sum(self.itl_history_ms) / len(self.itl_history_ms), 2) if self.itl_history_ms else 0.0

async def measure_stream_telemetry(chunk_stream: AsyncIterator[str]) -> tuple[list[str], StreamMetrics]:
    metrics = StreamMetrics()
    start_time = time.perf_counter()
    last_chunk_time = start_time
    chunks: list[str] = []

    async for chunk in chunk_stream:
        now = time.perf_counter()
        if metrics.token_count == 0:
            # First token received
            metrics.ttft_ms = round((now - start_time) * 1000.0, 2)
        else:
            # Measure inter-token latency
            metrics.itl_history_ms.append(round((now - last_chunk_time) * 1000.0, 2))

        chunks.append(chunk)
        metrics.token_count += 1
        last_chunk_time = now

    metrics.total_latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
    return chunks, metrics`,
			runnable: true
		},
		{
			id: 'coveragerc-config',
			title: 'Production .coveragerc Configuration',
			filePath: '.coveragerc',
			description:
				'Coverage configuration enforcing 90%+ threshold and omitting mock transport files.',
			language: 'ini',
			code: `[run]
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
    def __repr__
    raise NotImplementedError
    if __name__ == .__main__.:
    if TYPE_CHECKING:
    class .*\\bProtocol\\):`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Eval Judge & Streaming Telemetry Test Suite (pytest)',
		testFilePath: 'tests/test_evals.py',
		command: 'pytest -v --cov=app/telemetry --cov-fail-under=90 tests/test_evals.py',
		executionTimeSec: 0.77,
		testCode: `import pytest
import asyncio
from app.telemetry.benchmarks import measure_stream_telemetry, StreamMetrics

@pytest.mark.asyncio
async def test_measure_stream_telemetry_computes_ttft_and_tokens_per_sec():
    async def simulated_stream():
        await asyncio.sleep(0.05) # TTFT delay
        yield "Hello"
        await asyncio.sleep(0.02) # ITL
        yield " "
        await asyncio.sleep(0.02)
        yield "world!"

    chunks, metrics = await measure_stream_telemetry(simulated_stream())

    assert "".join(chunks) == "Hello world!"
    assert metrics.token_count == 3
    assert metrics.ttft_ms >= 45.0 # At least 45ms TTFT
    assert len(metrics.itl_history_ms) == 2
    assert metrics.tokens_per_sec > 0.0
    assert metrics.avg_itl_ms >= 15.0

def test_stream_metrics_zero_division_guard():
    metrics = StreamMetrics(total_latency_ms=0.0, token_count=0)
    assert metrics.tokens_per_sec == 0.0
    assert metrics.avg_itl_ms == 0.0`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: anyio-4.6.2, mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_evals.py::test_measure_stream_telemetry_computes_ttft_and_tokens_per_sec PASSED [ 50%]
tests/test_evals.py::test_stream_metrics_zero_division_guard PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name                             Stmts   Miss  Cover   Missing
--------------------------------------------------------------
app/telemetry/__init__.py            0      0   100%
app/telemetry/benchmarks.py         28      1    96%   22
--------------------------------------------------------------
TOTAL                               28      1    96%

Required test coverage of 90% reached. Total coverage: 96.43%
============================== 2 passed in 0.77s ===============================`,
		coverage: {
			files: [
				{ name: 'app/telemetry/benchmarks.py', stmts: 28, miss: 1, cover: '96%', missing: '22' }
			],
			total: { stmts: 28, miss: 1, cover: '96%' }
		},
		summary:
			'All 2 tests passed. 96.4% test coverage exceeding the 90% minimum threshold specified in .coveragerc.'
	},
	interactiveComponent: 'benchmark'
};
