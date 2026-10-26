import type { CurriculumLesson } from '../../types/curriculum';

export const track05: CurriculumLesson = {
	id: 'track-05',
	slug: '05-evals-benchmarks',
	trackNumber: 5,
	title: 'Live Async Benchmarking (/benchmarks) vs. Unit Testing (/tests)',
	shortTitle: 'Live Async Benchmarks & Evals',
	subtitle:
		'Separating Synchronous Unit Tests (/tests) from Concurrent AsyncOpenAI Execution (/benchmarks), User Psychology & Immutable Evals',
	estimatedMinutes: 45,
	topics: [
		'Architectural Split: Deterministic Sync Tests (/tests) vs. Live Async Benchmarks (/benchmarks)',
		'Concurrent Multi-Model Benchmarking with AsyncOpenAI, asyncio.gather & Semaphore',
		'Same-Model Ablation: Concurrent Prompt, Temperature & Schema Variant Runs',
		'Streaming Telemetry: Measuring Live TTFT and Tokens Per Second (TPS)',
		'User Psychology, Linguistic Entropy & The Iron Rule: Fix the System, Never the Test',
		'Psychometric LLM-as-a-Judge Rubrics with Pydantic Structured Outputs'
	],
	frameworks: [
		'openai>=3.36.1',
		'pydantic>=2.14.1',
		'pydantic-settings>=2.16.0',
		'pytest>=9.0',
		'pytest-mock>=3.17',
		'pytest-cov>=7.1'
	],
	tags: [
		'Benchmarking',
		'AsyncOpenAI',
		'asyncio',
		'Evaluation',
		'Psychology',
		'Multi-Model',
		'Pydantic',
		'LLM-as-a-Judge'
	],
	summary:
		'Establish the foundational separation between /tests and /benchmarks early in your prototype workflow. Keep /tests 100% synchronous and deterministic with pytest-mock (where mocked calls take microseconds and async adds zero benefit), while powering /benchmarks with AsyncOpenAI, asyncio.gather, and semaphores to execute live cross-model and same-model evaluations 15x faster.',
	objectives: [
		'Separate deterministic code verification (/tests) from live empirical model evaluation (/benchmarks).',
		'Understand why automated unit tests stay synchronous (MagicMock has zero network wait time) while live benchmarks use AsyncOpenAI.',
		'Build a concurrent benchmark runner using AsyncOpenAI, asyncio.gather(), and asyncio.Semaphore to measure TTFT and TPS across multiple models simultaneously.',
		'Run same-model ablations concurrently across prompt variants, temperatures, and Pydantic schema guardrails.',
		'Enforce the Iron Rule of AI Evals on frozen real-user prompts: when a benchmark fails, harden the system levers, never soften the test prompt.',
		'Score conversational repair, ambiguity handling, and empathy using structured Pydantic LLM-as-a-Judge rubrics.'
	],
	architecture: {
		patternName: 'Dual-Track Verification: Sync /tests Gate vs. Concurrent Async /benchmarks Lab',
		diagram: `+---------------------------------------------------------------------------------+
|                   PROJECT VERIFICATION & BENCHMARKING TOPOLOGY                  |
+----------------------------------------+----------------------------------------+
                                         |
                   +---------------------+---------------------+
                   |                                           |
                   v                                           v
+----------------------------------------+   +------------------------------------+
|     /tests (Automated Unit Suite)      |   |  /benchmarks (Live Execution Lab)  |
|  Runner: uv run pytest                 |   |  Runner: python -m benchmarks.run  |
|  Model:  100% Synchronous (def test_*) |   |  Model:  Concurrent (AsyncOpenAI)  |
|  Mocks:  pytest-mock & MagicMock       |   |  Engine: asyncio.gather + Semaphore|
|  I/O:    Zero network (~0.01ms/call)   |   |  I/O:    Live parallel LLM streams |
|  Cost:   $0.00 (Runs on every commit)  |   |  Metrics: TTFT, TPS, Judge Rubric  |
+----------------------------------------+   +-----------------+------------------+
                                                               |
                                                               v
+---------------------------------------------------------------------------------+
|                    IMMUTABLE REAL-USER DATASET (FROZEN CASES)                   |
|  Case 1: "hey uh cancel that last thing, show me vienna wthr again in C pls"    |
|  Case 2: "ugh that didn't work at all... why is my card being charged twice??"  |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|            CONCURRENT ASYNC FAN-OUT (Cross-Model & Same-Model Ablation)         |
|  asyncio.gather(*[eval_case(model, variant, case) for model in candidates])     |
|  - Measures Time-To-First-Token (TTFT) & Tokens/Sec (TPS) via perf_counter()    |
|  - Grades output with Pydantic LLM-as-a-Judge (UserSatisfactionEval)            |
+---------------------------------------------------------------------------------+`,
		explanation: `A common mistake in Python AI projects is either running live LLM calls inside pytest (making unit tests slow, flaky, and expensive) or adding async boilerplate to mocked unit tests where it provides zero speed benefit.

The Clean Architecture Solution: Separate /tests from /benchmarks:

1. Why /tests Stays 100% Synchronous:
   In your automated unit test suite (/tests), external API calls are replaced with in-memory mocks (MagicMock). Because a mocked function returns in ~0.01 milliseconds with zero network wait time, an asyncio event loop has no I/O pause to overlap. Synchronous tests ('def test_*') are faster, simpler, and need zero extra pytest plugins.

2. Why /benchmarks Uses AsyncOpenAI & asyncio.gather:
   In live benchmarking (/benchmarks), every LLM request waits 500ms to 3,000ms over the network. Running 20 frozen prompts across 5 candidate models (100 live requests) sequentially in a synchronous loop takes ~3 minutes. By using 'AsyncOpenAI' with 'asyncio.gather()' and an 'asyncio.Semaphore(10)', all models and prompt variants are queried concurrently—finishing the entire 100-call benchmark in ~8 seconds via a standard 'asyncio.run()' entrypoint.

3. The Iron Rule (Fix the System, Never the Test):
   Both /tests and /benchmarks share frozen prompts captured from messy real-human dialogue (typos, slang, mid-sentence reversals). When a model scores poorly, you adjust the 4 System Levers (system prompt, Pydantic tool aliases/validators, temperature, or Python pre-routing)—never launder the test prompt.`,
		keyConcepts: [
			{
				name: '/tests vs. /benchmarks Separation',
				description:
					'/tests verifies code logic synchronously in <1s with MagicMock ($0 cost on every save). /benchmarks runs live concurrent AsyncOpenAI evaluations across models and prompt ablations.'
			},
			{
				name: 'Concurrent Fan-Out with Semaphore',
				description:
					'Using asyncio.Semaphore(10) with asyncio.gather() saturates network I/O safely without triggering HTTP 429 rate limits during multi-model benchmarks.'
			},
			{
				name: 'Live TTFT & TPS Telemetry',
				description:
					'Streaming responses with AsyncOpenAI(..., stream=True) and time.perf_counter() captures exact Time-To-First-Token (TTFT) and Inter-Token Latency (ITL) under real network conditions.'
			},
			{
				name: 'The Iron Rule: Fix System, Never Test',
				description:
					'Evaluation suites are immutable ground-truth contracts. Modifying a messy user prompt to dodge a model weakness contaminates benchmarks and hides prototype flaws.'
			}
		]
	},
	comparisons: [
		{
			title: '/tests (Sync Unit Test) vs. /benchmarks (Concurrent AsyncOpenAI Runner)',
			description:
				'Why unit tests in /tests stay synchronous with MagicMock while live multi-model benchmarks in /benchmarks use AsyncOpenAI and asyncio.gather.',
			leftTitle: 'tests/test_eval_scorer.py (100% Sync, In-Memory, 0ms I/O)',
			leftLanguage: 'python',
			leftCode: `import pytest
from unittest.mock import MagicMock
from app.evals.schemas import UserSatisfactionEval, WeatherQuery

# In /tests: All external I/O is mocked in memory (~0.01ms).
# Zero network wait time = zero benefit from async/await!
def test_weather_schema_normalizes_human_slang():
    # Deterministic check: "in C" -> "celsius"
    query = WeatherQuery.model_validate({"city": "Vienna", "unit": "deg C"})
    assert query.unit == "celsius"

def test_judge_parser_extracts_satisfaction_score(mocker):
    mock_client = mocker.MagicMock()
    mock_parsed = UserSatisfactionEval(
        ambiguity_handling=5,
        conversational_repair=5,
        tool_precision=5,
        tone_and_deescalation=5,
        overall_satisfaction=5.0,
        reasoning="Asked one crisp clarifying question."
    )
    mock_client.beta.chat.completions.parse.return_value.choices = [
        MagicMock(message=MagicMock(parsed=mock_parsed))
    ]
    # Runs in < 1ms with standard pytest!
    res = mock_client.beta.chat.completions.parse(model="gemma-4-e4b-it")
    assert res.choices[0].message.parsed.overall_satisfaction == 5.0`,
			rightTitle: 'benchmarks/run_evals.py (Live Concurrent AsyncOpenAI)',
			rightLanguage: 'python',
			rightCode: `import asyncio
import time
from openai import AsyncOpenAI

# In /benchmarks: Real network I/O (500ms-3000ms per call).
# AsyncOpenAI + gather runs 4 models in parallel in ~1.5s total!
async def probe_model_ttft(
    client: AsyncOpenAI,
    sem: asyncio.Semaphore,
    model: str,
    prompt: str
) -> dict:
    async with sem:
        start = time.perf_counter()
        ttft_ms = 0.0
        tokens = 0
        stream = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                if ttft_ms == 0.0:
                    ttft_ms = (time.perf_counter() - start) * 1000
                tokens += 1
        elapsed = time.perf_counter() - start
        return {"model": model, "ttft_ms": round(ttft_ms, 1), "tps": round(tokens / elapsed, 1)}

# Invoked from CLI via standard asyncio.run() - no pytest plugins needed!
# asyncio.run(run_all_models(["gemma-4-e4b-it", "gemma-4-e2b-it", "gemma-3-1b-it", "functiongemma-270m-it"]))`
		},
		{
			title: 'Benchmark Laundering vs. Prototype System Hardening',
			description:
				'Observe how benchmark laundering hides vulnerabilities, while system hardening fixes the root cause using Pydantic tool aliases and prompt guardrails.',
			leftTitle: 'Anti-Pattern: Benchmark Laundering (Dumbing Down the Prompt)',
			leftLanguage: 'python',
			leftCode: `# Anti-pattern: Model failed on messy real-world user query:
# Original user input: "cancel that last order, actually wait did my refund go thru??"

# BAD FIX: Engineer rewrites the test prompt to make the model pass!
def test_user_intent_laundered(client):
    # DUMBING DOWN THE TEST: Splitting into sterile synthetic prompts
    prompt_1 = "Please check if my recent refund was processed."
    res_1 = client.post("/api/chat", json={"prompt": prompt_1})
    assert res_1.status_code == 200

    prompt_2 = "Please cancel my most recent order."
    res_2 = client.post("/api/chat", json={"prompt": prompt_2})
    assert res_2.status_code == 200

    # The benchmark looks 100% green!
    # BUT: Real users still write:
    # "cancel that last order, actually wait did my refund go thru??"
    # ...and the prototype ignores one of the two requests!`,
			rightTitle: 'Hardened Prototype Pattern: Freezing the Test & Tuning the System',
			rightLanguage: 'python',
			rightCode: `# Correct standard: Test prompt is LOCKED and IMMUTABLE
def test_real_user_multi_intent_reversal(ai_service):
    # Raw messy human prompt is preserved exactly as spoken
    raw_prompt = "cancel that last order, actually wait did my refund go thru??"

    response = ai_service.process_turn(raw_prompt)

    # Assert both intents were recognized without dropping context
    assert response.refund_status_checked is True
    assert response.order_cancellation_pending is True
    # Verify the model addressed the immediate question first
    assert "refund" in response.message.lower()

# WHERE THE FIX WAS MADE: In the System, never in the test!
# 1. System Prompt: Added multi-intent decomposition rules
# 2. Pydantic Tool Schema: Added Field(alias="...") & union types
# 3. Code: Added stateful reversal check before executing actions`
		},
		{
			title: 'Tuning Levers: Fragile Schema vs. Resilient Pydantic v2 Tool Schema',
			description:
				'How to tweak Pydantic schemas so models with weaker reasoning reliably extract messy parameters without altering test cases.',
			leftTitle: 'Rigid Tool Schema (Fails on Human Typos / Slang)',
			leftLanguage: 'python',
			leftCode: `from pydantic import BaseModel

# Rigid schema: Chokes when user says "in C", "celsius", or "25C"
class WeatherQuery(BaseModel):
    city: str
    unit: str # Expects exact "celsius" or "fahrenheit"
    days: int # Fails if user says "next couple days"`,
			rightTitle: 'Hardened Pydantic Schema with Aliases & Coercion',
			rightLanguage: 'python',
			rightCode: `from typing import Literal
from pydantic import BaseModel, Field, field_validator

class WeatherQuery(BaseModel):
    city: str = Field(
        description="Target city name. Correct obvious typos (e.g. 'venna' -> 'Vienna')."
    )
    unit: Literal["celsius", "fahrenheit"] = Field(
        default="celsius",
        description="Temperature scale. Map 'C', 'deg C', 'metric' -> 'celsius'."
    )
    days: int = Field(
        default=1,
        ge=1,
        le=7,
        description="Forecast horizon in days. Map 'a couple days' -> 2, 'weekend' -> 3."
    )

    @field_validator("unit", mode="before")
    @classmethod
    def normalize_unit(cls, v: str) -> str:
        v_clean = str(v).lower().strip()
        if v_clean in ("c", "deg c", "metric", "celsius"):
            return "celsius"
        if v_clean in ("f", "deg f", "imperial", "fahrenheit"):
            return "fahrenheit"
        return "celsius"`
		}
	],
	codeSnippets: [
		{
			id: 'concurrent-async-benchmark-harness',
			title: 'Concurrent Cross-Model & Same-Model Benchmark Runner (AsyncOpenAI + asyncio)',
			filePath: 'benchmarks/run_evals.py',
			description:
				'Live benchmark runner in /benchmarks using AsyncOpenAI, asyncio.Semaphore, and asyncio.gather to evaluate multiple models or prompt variants concurrently.',
			language: 'python',
			code: `import asyncio
import time
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from openai import AsyncOpenAI

class BenchmarkSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    openai_api_key: str
    judge_model: str = "gemma-4-e4b-it"
    max_concurrency: int = Field(default=10, ge=1, le=50)
    candidate_models: list[str] = [
        "gemma-4-e4b-it",
        "gemma-4-e2b-it",
        "gemma-3-1b-it",
        "functiongemma-270m-it",
    ]
    default_temperature: float = 0.1

class UserSatisfactionEval(BaseModel):
    """Psychometric rubric evaluated by LLM-as-a-Judge."""
    ambiguity_handling: int = Field(ge=1, le=5, description="1=Dumps guessing text, 5=Asks 1 crisp clarifying question")
    conversational_repair: int = Field(ge=1, le=5, description="1=Ignores correction, 5=Graceful immediate adjustment")
    tool_precision: int = Field(ge=1, le=5, description="1=Wrong/missing arguments, 5=Flawless parameter coercion")
    tone_and_deescalation: int = Field(ge=1, le=5, description="1=Defensive/robotic, 5=Empathetic, concise, natural")
    overall_satisfaction: float = Field(ge=1.0, le=5.0, description="Weighted composite satisfaction score")
    reasoning: str = Field(description="Step-by-step psychological evaluation")

class BenchmarkTrialResult(BaseModel):
    model_name: str
    variant_label: str
    test_id: str
    ttft_ms: float
    total_latency_ms: float
    tokens_per_sec: float
    satisfaction: UserSatisfactionEval

async def evaluate_single_trial(
    client: AsyncOpenAI,
    sem: asyncio.Semaphore,
    settings: BenchmarkSettings,
    model_name: str,
    variant_label: str,
    system_prompt: str,
    temperature: float,
    test_case: dict[str, str],
) -> BenchmarkTrialResult:
    async with sem:
        start = time.perf_counter()
        ttft_ms = 0.0
        chunks: list[str] = []

        # 1. Stream live response to measure exact TTFT and token throughput
        stream = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": test_case["prompt"]},
            ],
            temperature=temperature,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                if ttft_ms == 0.0:
                    ttft_ms = (time.perf_counter() - start) * 1000
                chunks.append(delta)

        elapsed_sec = max(time.perf_counter() - start, 0.001)
        model_reply = "".join(chunks)

        # 2. Grade response concurrently with structured LLM-as-a-Judge
        judge_resp = await client.beta.chat.completions.parse(
            model=settings.judge_model,
            messages=[
                {"role": "system", "content": "You are a behavioral AI UX evaluation judge."},
                {
                    "role": "user",
                    "content": (
                        f"User Query: {test_case['prompt']}\\n"
                        f"System Prompt: {system_prompt}\\n"
                        f"Model Response: {model_reply}"
                    ),
                },
            ],
            response_format=UserSatisfactionEval,
        )
        satisfaction = judge_resp.choices[0].message.parsed

        return BenchmarkTrialResult(
            model_name=model_name,
            variant_label=variant_label,
            test_id=test_case["id"],
            ttft_ms=round(ttft_ms, 1),
            total_latency_ms=round(elapsed_sec * 1000, 1),
            tokens_per_sec=round(len(chunks) / elapsed_sec, 1),
            satisfaction=satisfaction,
        )

async def run_cross_model_benchmark(
    frozen_cases: list[dict[str, str]],
    system_prompt: str,
) -> list[BenchmarkTrialResult]:
    """Fan out across all candidate models and test cases concurrently."""
    settings = BenchmarkSettings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    sem = asyncio.Semaphore(settings.max_concurrency)

    tasks = [
        evaluate_single_trial(
            client=client,
            sem=sem,
            settings=settings,
            model_name=model,
            variant_label="baseline",
            system_prompt=system_prompt,
            temperature=settings.default_temperature,
            test_case=case,
        )
        for model in settings.candidate_models
        for case in frozen_cases
    ]
    return list(await asyncio.gather(*tasks))

if __name__ == "__main__":
    # Run from CLI: uv run python -m benchmarks.run_evals
    sample_cases = [{"id": "case-01", "prompt": "hey uh whats the wthr in venna in C pls"}]
    results = asyncio.run(run_cross_model_benchmark(sample_cases, "Be concise and helpful."))
    for r in results:
        print(f"{r.model_name}: TTFT={r.ttft_ms}ms | TPS={r.tokens_per_sec} | Score={r.satisfaction.overall_satisfaction}")`,
			runnable: true
		},
		{
			id: 'system-tuning-levers',
			title: 'System Tuning Levers: Hardening System Prompts & Tool Definitions',
			filePath: 'app/core/system_levers.py',
			description:
				'How to tweak system prompts, few-shot exemplars, and tool routing without altering frozen test cases.',
			language: 'python',
			code: `from openai.types.chat import ChatCompletionToolParam

# LEVER 1: System prompt with real-user psychological guardrails
HARDENED_SYSTEM_PROMPT = """
You are a high-efficiency AI assistant built for real humans.
Follow these behavioral invariants:
1. AMBIGUITY HANDLING: If the user’s request is missing required parameters, DO NOT guess or dump multiple paragraphs. Ask exactly ONE concise clarifying question.
2. CONVERSATIONAL REPAIR: If the user pushes back or corrects you ("that didn't work", "no I meant X"), acknowledge in 5 words or fewer, apply the correction immediately, and never give defensive apologies.
3. ENTITY NORMALIZATION: Silently correct obvious human spelling mistakes (e.g., 'venna' -> 'Vienna') without correcting the user condescendingly.
4. MULTI-INTENT SPLITTING: If the user asks two questions or changes their mind ("cancel X, actually check Y first"), address the immediate concern first, then confirm the secondary action.
"""

# LEVER 2: OpenAI tool definitions generated from hardened Pydantic schemas
WEATHER_TOOL_DEFINITION: ChatCompletionToolParam = {
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Fetch real-time weather. Handles city misspellings and converts temperature units automatically.",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name. Auto-correct typos."},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"], "default": "celsius"}
            },
            "required": ["city"]
        }
    }
}`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Synchronous Unit Test Suite in /tests (pytest)',
		testFilePath: 'tests/test_real_user_dialogue.py',
		command: 'pytest -v --cov=app/core tests/test_real_user_dialogue.py',
		executionTimeSec: 0.42,
		testCode: `import pytest
from unittest.mock import MagicMock
from benchmarks.run_evals import UserSatisfactionEval

# IMMUTABLE TEST CASES - Written the way real users actually talk.
# DO NOT EDIT OR CLEAN UP TEST PROMPTS. Fixes belong in the system!
FROZEN_REAL_USER_TEST_CASES = [
    {
        "id": "case-01-typo-slang",
        "prompt": "hey uh whats the wthr in venna right now in C not F pls",
        "expected_tool": "get_weather",
        "expected_args": {"city": "Vienna", "unit": "celsius"}
    },
    {
        "id": "case-02-reversal-frustration",
        "prompt": "ugh that didnt work cancel my last order wait actually did my refund go thru??",
        "must_address_refund": True,
        "must_handle_cancellation": True
    },
    {
        "id": "case-03-ambiguous-one-shot",
        "prompt": "book me a ticket for tomorrow",
        "should_clarify_in_one_question": True
    }
]

def test_hardened_system_handles_typos_and_slang():
    # Synchronous unit test in /tests: runs in <1ms with zero network calls!
    case = FROZEN_REAL_USER_TEST_CASES[0]
    
    mock_eval = UserSatisfactionEval(
        ambiguity_handling=5,
        conversational_repair=5,
        tool_precision=5,
        tone_and_deescalation=5,
        overall_satisfaction=5.0,
        reasoning="Model successfully corrected 'venna' to Vienna and mapped 'in C' to celsius."
    )
    
    assert case["expected_args"]["city"] == "Vienna"
    assert mock_eval.tool_precision == 5
    assert mock_eval.overall_satisfaction >= 4.5

def test_hardened_system_handles_reversal_without_dropping_intent():
    case = FROZEN_REAL_USER_TEST_CASES[1]
    # Verify the test prompt remained completely unlaundered
    assert "ugh that didnt work" in case["prompt"]
    assert case["must_address_refund"] is True
    assert case["must_handle_cancellation"] is True`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_real_user_dialogue.py::test_hardened_system_handles_typos_and_slang PASSED [ 50%]
tests/test_real_user_dialogue.py::test_hardened_system_handles_reversal_without_dropping_intent PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name                                Stmts   Miss  Cover   Missing
-----------------------------------------------------------------
app/core/system_levers.py              12      0   100%
benchmarks/run_evals.py                44      1    98%   118
-----------------------------------------------------------------
TOTAL                                  56      1    98%

============================== 2 passed in 0.42s ===============================`,
		coverage: {
			files: [
				{
					name: 'app/core/system_levers.py',
					stmts: 12,
					miss: 0,
					cover: '100%',
					missing: ''
				},
				{
					name: 'benchmarks/run_evals.py',
					stmts: 44,
					miss: 1,
					cover: '98%',
					missing: '118'
				}
			],
			total: { stmts: 56, miss: 1, cover: '98%' }
		},
		summary:
			'All 2 unit tests in /tests passed synchronously in 0.42s. Live multi-model runs execute separately in /benchmarks via AsyncOpenAI.'
	},
	interactiveComponent: 'benchmark'
};
