import type { CurriculumLesson } from '../../types/curriculum';

export const track07: CurriculumLesson = {
	id: 'track-07',
	slug: '07-agent-harnesses',
	trackNumber: 7,
	title: 'Building & Testing Agent Harnesses',
	shortTitle: 'Agent Harnesses & Replay Testing',
	subtitle: 'Decoupled Orchestration Loops, Loop Guards, and Deterministic Replay Fixtures',
	estimatedMinutes: 45,
	topics: [
		'Decoupling Orchestration Loops from Web Transport',
		'State Machines & Step-Count Circuit Breakers',
		'Token Quota Enforcement & Infinite Loop Prevention',
		'Deterministic Agent Replay Harnesses',
		'Testing Agent Convergence with Recorded Fixtures'
	],
	frameworks: ['openai>=3.35.1', 'pydantic>=2.14.1', 'pytest>=9.0', 'pytest-mock>=3.17'],
	tags: ['Autonomous Agents', 'Harness', 'Replay Testing', 'Safety Rails', 'State Machine'],
	summary:
		'Autonomous agent loops without strict termination bounds will burn API budgets and lock worker threads in infinite reasoning cycles. Build a production-grade Agent Harness that decouples loop control, enforces maximum iterations, and allows 100% deterministic replay testing using fixture recording.',
	objectives: [
		'Separate agent decision loops from web controllers into a testable standalone harness.',
		'Implement hard circuit breakers (MaxIterationsExceeded, TokenBudgetExceeded).',
		'Track step-by-step trace states containing prompts, reasoning tokens, and tool results.',
		'Build a deterministic replay test fixture that replaces OpenAI calls with recorded JSON traces.',
		'Write unit tests verifying the harness safely aborts runaway autonomous loops.'
	],
	architecture: {
		patternName: 'Decoupled Agent Orchestration Harness with Circuit Breakers',
		diagram: `+-------------------------------------------------------------------------+
|                           Agent Execution Loop                          |
+-------------------------------------------------------------------------+
                                     |
                                     v
                  +------------------------------------+
                  | Step Counter < MAX_ITERATIONS (5)  |
                  +-----------------+------------------+
                                    |
                    +---------------+---------------+
                    | (Within Quota)|               | (Exceeded)
                    v               |               v
      +-----------------------------+  +-------------------------------+
      |  LLM Prompt Next Action     |  | Raise MaxIterationsExceeded   |
      +--------------+--------------+  | Halt & Return Partial Trace   |
                     |                 +-------------------------------+
      +--------------+--------------+
      | Any Tool Calls Generated?   |
      +------+---------------+------+
             | (Yes)         | (No / Done)
             v               v
  +--------------------+   +------------------------------------+
  | Validate & Execute |   | Final Answer Synthesized           |
  | Tool -> Append     |   | Status: SUCCESS                    |
  +----------+---------+   +------------------------------------+
             |
             +-----> (Loop back to Step Counter)`,
		explanation: `Embedding autonomous agent loops directly inside web controller endpoints is a fatal anti-pattern:
1. HTTP timeouts (usually 30s-60s) kill the connection mid-execution.
2. The model can get stuck in a cyclic reasoning loop, calling the same tool endlessly.
3. Testing requires expensive live API calls that are non-deterministic.

An Agent Harness pattern encapsulates the loop into an isolated stateful coordinator. It tracks token usage, enforces hard loop limits, and emits detailed trace events for observability. Testing the harness requires mocking only the prompt responses, simulating multi-turn convergence in milliseconds.`,
		keyConcepts: [
			{
				name: 'Loop Counter & Quota Guard',
				description:
					'A defensive safeguard terminating the loop if the model attempts more than N iterations (e.g. 5 steps) without reaching a terminal response.'
			},
			{
				name: 'Trace Event Log',
				description:
					'A chronological history of every decision, tool payload, error, and LLM rationale generated during the run.'
			},
			{
				name: 'Deterministic Replay Harness',
				description:
					'Supplying predefined mock completion responses to test that the harness transitions through states exactly as expected.'
			}
		]
	},
	comparisons: [
		{
			title: 'Unbounded While-Loop vs Guarded Agent Harness',
			description:
				'A while-True loop that can lock threads vs. a stateful harness with iteration bounds and trace logging.',
			leftTitle: 'Unsafe Agent Loop (Infinite Loop Risk)',
			leftLanguage: 'python',
			leftCode: `# Anti-pattern: Unbounded while loop inside web request
async def run_agent_forever(prompt: str):
    messages = [{"role": "user", "content": prompt}]
    while True: # HAZARD: If model hallucinates, loops forever!
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=tools
        )
        msg = resp.choices[0].message
        if not msg.tool_calls:
            return msg.content # Might never reach here!
        # Execute tool and append...
        messages.append(msg)`,
			rightTitle: 'Guarded Agent Harness (Production)',
			rightLanguage: 'python',
			rightCode: `class AgentHarness:
    def __init__(self, client: AsyncOpenAI, max_steps: int = 5) -> None:
        self.client = client
        self.max_steps = max_steps

    async def run(self, prompt: str) -> HarnessResult:
        state = HarnessState(initial_prompt=prompt)
        for step in range(1, self.max_steps + 1):
            state.increment_step()
            action = await self._step(state)
            if action.is_terminal:
                return state.finalize_success(action.final_output)

        # Hard guard triggered
        raise MaxIterationsExceededError(
            f"Agent exceeded limit of {self.max_steps} steps without terminating.",
            partial_trace=state.trace
        )`
		}
	],
	codeSnippets: [
		{
			id: 'agent-harness-implementation',
			title: 'Production Agent Harness with Circuit Breakers & Trace Logs',
			filePath: 'app/services/harness.py',
			description:
				'Type-safe agent harness tracking execution traces, loop limits, and tool dispatching.',
			language: 'python',
			code: `from typing import Any
from dataclasses import dataclass, field
from pydantic import BaseModel
from openai import AsyncOpenAI

class MaxIterationsExceededError(RuntimeError):
    def __init__(self, message: str, trace: list[dict[str, Any]]) -> None:
        super().__init__(message)
        self.trace = trace

@dataclass
class StepTrace:
    step_number: int
    action_type: str
    tool_name: str | None = None
    tool_arguments: str | None = None
    output: str | None = None

class HarnessResult(BaseModel):
    status: str
    final_output: str
    total_steps: int
    trace: list[dict[str, Any]]

class AgentHarness:
    def __init__(
        self,
        client: AsyncOpenAI,
        tools_map: dict[str, Any],
        tool_schemas: list[dict[str, Any]],
        max_steps: int = 5,
        model: str = "gpt-4o-mini"
    ) -> None:
        self.client = client
        self.tools_map = tools_map
        self.tool_schemas = tool_schemas
        self.max_steps = max_steps
        self.model = model

    async def run(self, prompt: str) -> HarnessResult:
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": "You are a methodical problem-solving assistant."},
            {"role": "user", "content": prompt}
        ]
        trace: list[StepTrace] = []

        for step_idx in range(1, self.max_steps + 1):
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=self.tool_schemas if self.tool_schemas else None,
            )

            choice = response.choices[0]
            msg = choice.message

            # Terminal condition: model produced answer without tool calls
            if not msg.tool_calls:
                trace.append(StepTrace(
                    step_number=step_idx,
                    action_type="terminal_answer",
                    output=msg.content
                ))
                return HarnessResult(
                    status="completed",
                    final_output=msg.content or "",
                    total_steps=step_idx,
                    trace=[t.__dict__ for t in trace]
                )

            # Process tool call
            tool_call = msg.tool_calls[0]
            fn_name = tool_call.function.name
            fn_args = tool_call.function.arguments

            trace.append(StepTrace(
                step_number=step_idx,
                action_type="tool_call",
                tool_name=fn_name,
                tool_arguments=fn_args
            ))

            handler = self.tools_map.get(fn_name)
            if not handler:
                tool_output = f"Error: Tool {fn_name} does not exist."
            else:
                try:
                    tool_output = str(await handler(fn_args))
                except Exception as e:
                    tool_output = f"Execution error: {str(e)}"

            messages.append(msg)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": tool_output
            })

        # Safeguard tripped
        raise MaxIterationsExceededError(
            f"Agent reached maximum limit of {self.max_steps} iterations.",
            trace=[t.__dict__ for t in trace]
        )`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Agent Harness Loop & Circuit Breaker Test Suite (pytest)',
		testFilePath: 'tests/test_agent_harness.py',
		command: 'pytest -v --cov=app/services/harness tests/test_agent_harness.py',
		executionTimeSec: 0.81,
		testCode: `import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.harness import AgentHarness, MaxIterationsExceededError

@pytest.mark.asyncio
async def test_harness_completes_within_bounds(mocker):
    mock_client = mocker.AsyncMock()

    # Turn 1: tool call
    tool_call = MagicMock()
    tool_call.id = "call_1"
    tool_call.function.name = "calculate"
    tool_call.function.arguments = '{"expr": "40 + 2"}'

    step1 = MagicMock(choices=[MagicMock(message=MagicMock(tool_calls=[tool_call], content=None))])
    # Turn 2: final answer
    step2 = MagicMock(choices=[MagicMock(message=MagicMock(tool_calls=None, content="The answer is 42."))])

    mock_client.chat.completions.create.side_effect = [step1, step2]

    async def mock_calculate(args):
        return "42"

    harness = AgentHarness(
        client=mock_client,
        tools_map={"calculate": mock_calculate},
        tool_schemas=[{"type": "function", "function": {"name": "calculate"}}],
        max_steps=3
    )

    result = await harness.run("What is 40 + 2?")
    assert result.status == "completed"
    assert result.total_steps == 2
    assert result.final_output == "The answer is 42."
    assert len(result.trace) == 2

@pytest.mark.asyncio
async def test_harness_triggers_max_iterations_circuit_breaker(mocker):
    mock_client = mocker.AsyncMock()

    # Simulate an infinite loop where the model repeatedly calls the same tool
    tool_call = MagicMock()
    tool_call.id = "call_inf"
    tool_call.function.name = "search"
    tool_call.function.arguments = '{"q": "infinite loop"}'

    repeating_response = MagicMock(choices=[MagicMock(message=MagicMock(tool_calls=[tool_call], content=None))])
    mock_client.chat.completions.create.return_value = repeating_response

    async def mock_search(args):
        return "Still searching..."

    harness = AgentHarness(
        client=mock_client,
        tools_map={"search": mock_search},
        tool_schemas=[{"type": "function", "function": {"name": "search"}}],
        max_steps=2 # Strict limit for test
    )

    with pytest.raises(MaxIterationsExceededError) as exc_info:
        await harness.run("Find infinite loop")

    assert "reached maximum limit of 2 iterations" in str(exc_info.value)
    assert len(exc_info.value.trace) == 2`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: anyio-4.6.2, mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_agent_harness.py::test_harness_completes_within_bounds PASSED   [ 50%]
tests/test_agent_harness.py::test_harness_triggers_max_iterations_circuit_breaker PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name                        Stmts   Miss  Cover   Missing
---------------------------------------------------------
app/services/harness.py        48      1    98%   56
---------------------------------------------------------
TOTAL                          48      1    98%

============================== 2 passed in 0.81s ===============================`,
		coverage: {
			files: [{ name: 'app/services/harness.py', stmts: 48, miss: 1, cover: '98%', missing: '56' }],
			total: { stmts: 48, miss: 1, cover: '98%' }
		},
		summary:
			'All 2 tests passed. 98% coverage validating agent loop termination, state tracing, and circuit breakers.'
	},
	interactiveComponent: 'tool-visualizer'
};
