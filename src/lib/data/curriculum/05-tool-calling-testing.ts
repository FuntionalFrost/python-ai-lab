import type { CurriculumLesson } from '../../types/curriculum';

export const track05: CurriculumLesson = {
	id: 'track-05',
	slug: '05-tool-calling-testing',
	trackNumber: 5,
	title: 'Tool Calling & Unit Testing Tool Executions',
	shortTitle: 'Tool Calling & Testing',
	subtitle: 'Pydantic Function Schemas, Dispatch Engines, and Deterministic pytest Mocks',
	estimatedMinutes: 40,
	topics: [
		'Generating OpenAI Function Schemas from Pydantic Models',
		'Multi-Turn Tool Call Dispatch Engine',
		'Pydantic model_validate_json() Parameter Enforcement',
		'Handling Malformed JSON & Error Recovery',
		'Unit Testing LLM Tool Selection with pytest-mock'
	],
	frameworks: ['openai>=3.35.1', 'pydantic>=2.14.1', 'pytest>=9.0', 'pytest-mock>=3.17'],
	tags: ['Function Calling', 'Agent', 'Testing', 'Mocking', 'Pydantic'],
	summary:
		'Bridge LLM intelligence to real-world APIs with strict Pydantic tool schemas. Build an extensible tool dispatch engine with self-healing error recovery, and write robust pytest suites that test tool routing, parameter validation, and network failures without paying for API calls.',
	objectives: [
		'Generate standards-compliant OpenAI tool schemas directly from Pydantic v2 models.',
		'Implement a type-safe tool dispatch registry that auto-validates raw LLM arguments.',
		'Gracefully recover from malformed tool call arguments by sending validation feedback back to the LLM.',
		'Mock OpenAI tool completions deterministically using pytest-mock and MagicMock.',
		'Verify parallel tool execution and error handling under external API failure scenarios.'
	],
	architecture: {
		patternName: 'Closed-Loop Tool Calling & Validation Dispatch Engine',
		diagram: `+--------------------+
|     User Prompt    | ("What's the weather in Vienna in celsius?")
+---------+----------+
          |
          v
+--------------------+
|  LLM Tool Router   | (Generates tool_calls: [{name: "get_weather", args: '{"location":"Vienna"}'}])
+---------+----------+
          |
          v
+--------------------+
| Dispatch Registry  | 1. Find tool in registry
+---------+----------+
          |
          v
+--------------------+
| Pydantic Validator | 2. WeatherQuery.model_validate_json(args)
+---------+----------+
     |             |
     | (Valid)     | (Invalid JSON / Schema Violation)
     v             v
+-----------+  +-------------------------------------------------+
| Execute   |  | Self-Healing Error Recovery                     |
| Python Fn |  | Returns validation error feedback to LLM prompt |
+-----+-----+  +-------------------------------------------------+
      |
      v
+--------------------+
| Ingest Tool Result | (role: "tool", content: '{"temp": 19, "unit": "celsius"}')
+---------+----------+
          |
          v
+--------------------+
| Final Synthesis    | ("The current weather in Vienna is 19 degrees Celsius.")
+--------------------+`,
		explanation: `Large Language Models cannot directly execute external code; they output structured JSON containing the function name and arguments they wish to invoke.

The backend application is strictly responsible for:
1. Validating the LLM-generated JSON using Pydantic v2 models before executing code (never trust LLM output).
2. Dispatching the validated arguments to deterministic Python functions.
3. Catching runtime exceptions (e.g. timeout, 404) and returning error explanations back as tool responses rather than crashing the request.`,
		keyConcepts: [
			{
				name: 'Pydantic Schema Serialization',
				description:
					'Using Model.model_json_schema() creates JSON schema definitions with descriptions, types, and regex validation patterns readable by OpenAI models.'
			},
			{
				name: 'Safe Tool Dispatcher',
				description:
					'A dictionary registry mapping tool names to callable handlers and Pydantic validator schemas.'
			},
			{
				name: 'pytest-mock MagicMock',
				description:
					'Simulating OpenAI.chat.completions.create to verify that the tool call was made with exact expected arguments without network calls.'
			},
			{
				name: 'Human Linguistic Entropy in Tool Calling',
				description:
					'Real users never speak like API documentation. They use abbreviations ("lax"), colloquial units ("in C"), and missing parameters. Designing Pydantic schemas with flexible aliases and pre-validators prepares your application for authentic human dialogue.'
			}
		]
	},
	comparisons: [
		{
			title: 'Unsafe Dict Parsing vs. Pydantic-Validated Tool Dispatch',
			description:
				'Raw dictionary access crashes on missing keys or bad types, whereas Pydantic guarantees valid types or provides actionable feedback.',
			leftTitle: 'Naive Tool Dispatch (Fragile)',
			leftLanguage: 'python',
			leftCode: `import json

# Fragile: Assumes LLM produced perfectly formatted JSON
# No type checking: unit could be "kelvin" or an arbitrary string
# KeyError if location is missing
def handle_weather_call(raw_arguments: str):
    data = json.loads(raw_arguments)
    # CRASH: KeyError if location not provided
    city = data["location"]
    # BUG: No validation for unit
    unit = data.get("unit", "celsius")
    return fetch_weather_api(city=city, unit=unit)`,
			rightTitle: 'Production Pydantic Dispatch Engine',
			rightLanguage: 'python',
			rightCode: `from pydantic import BaseModel, Field, ValidationError

class WeatherQuery(BaseModel):
    location: str = Field(description="City and country, e.g. Vienna, Austria")
    unit: str = Field(default="celsius", pattern="^(celsius|fahrenheit)$")

def safe_dispatch_weather(raw_arguments: str) -> dict:
    try:
        query = WeatherQuery.model_validate_json(raw_arguments)
        return {"status": "ok", "data": fetch_weather_api(query.location, query.unit)}
    except ValidationError as err:
        # Graceful error feedback returned to model to prompt self-correction
        return {
            "status": "error",
            "message": f"Validation failed: {err.errors()}"
        }`
		}
	],
	codeSnippets: [
		{
			id: 'agent-service-full',
			title: 'Production AgentService with Tool Registry & OpenAI SDK',
			filePath: 'app/services/agent.py',
			description:
				'Complete agent service managing tool schema registration, dispatch loop, and error handling.',
			language: 'python',
			code: `from typing import Any, Callable
from pydantic import BaseModel, Field
from openai import OpenAI
from app.config import Settings

class WeatherQuery(BaseModel):
    location: str = Field(description="City and country, e.g. Vienna, Austria")
    unit: str = Field(default="celsius", pattern="^(celsius|fahrenheit)$")

class StockQuery(BaseModel):
    ticker: str = Field(description="Stock ticker symbol, e.g. AAPL, MSFT", max_length=5)

# Tool implementations
def get_current_weather(query: WeatherQuery) -> dict[str, Any]:
    # Mocked or real external API call
    return {"location": query.location, "temperature": 18.5, "unit": query.unit, "condition": "Sunny"}

def get_stock_price(query: StockQuery) -> dict[str, Any]:
    return {"ticker": query.ticker.upper(), "price": 224.50, "currency": "USD"}

class AgentService:
    def __init__(self, client: OpenAI, settings: Settings) -> None:
        self.client = client
        self.model = settings.llm.model
        self._tools = {
            "get_current_weather": (WeatherQuery, get_current_weather),
            "get_stock_price": (StockQuery, get_stock_price),
        }

    def get_tool_definitions(self) -> list[dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_current_weather",
                    "description": "Fetch real-time weather information for a specified location.",
                    "parameters": WeatherQuery.model_json_schema(),
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_stock_price",
                    "description": "Retrieve current trading price for a stock ticker symbol.",
                    "parameters": StockQuery.model_json_schema(),
                },
            },
        ]

    def execute_query(self, prompt: str) -> dict[str, Any]:
        messages = [{"role": "user", "content": prompt}]
        tools = self.get_tool_definitions()

        # Turn 1: LLM selects tool
        first_resp = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )

        choice = first_resp.choices[0]
        if not choice.message.tool_calls:
            return {"type": "direct_answer", "content": choice.message.content}

        tool_call = choice.message.tool_calls[0]
        fn_name = tool_call.function.name
        fn_args = tool_call.function.arguments

        # Turn 2: Dispatch and Validate
        if fn_name not in self._tools:
            return {"type": "error", "message": f"Unknown tool requested: {fn_name}"}

        schema_cls, handler = self._tools[fn_name]
        try:
            validated_args = schema_cls.model_validate_json(fn_args)
            tool_result = handler(validated_args)
        except Exception as exc:
            tool_result = {"error": f"Execution error: {str(exc)}"}

        # Turn 3: Submit tool result back to model for synthesis
        messages.append(choice.message)
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": str(tool_result),
        })

        final_resp = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
        )
        return {
            "type": "tool_executed",
            "tool": fn_name,
            "tool_input": fn_args,
            "tool_result": tool_result,
            "content": final_resp.choices[0].message.content,
        }`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Agent Tool Calling & Mocking Suite (pytest-mock)',
		testFilePath: 'tests/test_agent_tools.py',
		command: 'pytest -v --cov=app/services/agent tests/test_agent_tools.py',
		executionTimeSec: 0.89,
		testCode: `import pytest
import json
from unittest.mock import MagicMock
from app.services.agent import AgentService, WeatherQuery
from app.config import Settings, LLMSettings

@pytest.fixture
def mock_settings():
    settings = MagicMock(spec=Settings)
    settings.llm = MagicMock(spec=LLMSettings)
    settings.llm.model = "gpt-4o-mini"
    return settings

def test_agent_dispatches_tool_call(mocker, mock_settings):
    # 1. Setup mock tool call response from OpenAI
    mock_client = mocker.MagicMock()

    mock_tool_call = MagicMock()
    mock_tool_call.id = "call_abc123"
    mock_tool_call.function.name = "get_current_weather"
    mock_tool_call.function.arguments = json.dumps({"location": "Vienna, Austria", "unit": "celsius"})

    first_completion = MagicMock()
    first_completion.choices = [
        MagicMock(message=MagicMock(tool_calls=[mock_tool_call], content=None))
    ]

    second_completion = MagicMock()
    second_completion.choices = [
        MagicMock(message=MagicMock(tool_calls=None, content="The weather in Vienna is 18.5°C and Sunny."))
    ]

    mock_client.chat.completions.create.side_effect = [first_completion, second_completion]

    # 2. Run agent execution
    agent = AgentService(client=mock_client, settings=mock_settings)
    result = agent.execute_query("What's the weather in Vienna?")

    # 3. Assertions
    assert result["type"] == "tool_executed"
    assert result["tool"] == "get_current_weather"
    assert result["tool_result"]["location"] == "Vienna, Austria"
    assert result["content"] == "The weather in Vienna is 18.5°C and Sunny."
    assert mock_client.chat.completions.create.call_count == 2

def test_agent_handles_invalid_arguments_gracefully(mocker, mock_settings):
    mock_client = mocker.MagicMock()

    mock_tool_call = MagicMock()
    mock_tool_call.id = "call_err456"
    mock_tool_call.function.name = "get_current_weather"
    # Invalid unit "kelvin" violating regex pattern
    mock_tool_call.function.arguments = json.dumps({"location": "Vienna", "unit": "kelvin"})

    first_completion = MagicMock()
    first_completion.choices = [
        MagicMock(message=MagicMock(tool_calls=[mock_tool_call], content=None))
    ]

    second_completion = MagicMock()
    second_completion.choices = [
        MagicMock(message=MagicMock(tool_calls=None, content="I could not fetch weather with unit kelvin."))
    ]

    mock_client.chat.completions.create.side_effect = [first_completion, second_completion]

    agent = AgentService(client=mock_client, settings=mock_settings)
    result = agent.execute_query("Weather in Vienna in kelvin")

    # Assert error was caught and tool result captured error message
    assert "error" in result["tool_result"]
    assert mock_client.chat.completions.create.call_count == 2`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: anyio-4.6.2, mock-3.17.0, cov-7.1.0
collected 2 items

tests/test_agent_tools.py::test_agent_dispatches_tool_call PASSED        [ 50%]
tests/test_agent_tools.py::test_agent_handles_invalid_arguments_gracefully PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name                      Stmts   Miss  Cover   Missing
-------------------------------------------------------
app/services/agent.py        42      1    98%   48
-------------------------------------------------------
TOTAL                        42      1    98%

============================== 2 passed in 0.89s ===============================`,
		coverage: {
			files: [{ name: 'app/services/agent.py', stmts: 42, miss: 1, cover: '98%', missing: '48' }],
			total: { stmts: 42, miss: 1, cover: '98%' }
		},
		summary:
			'All 2 tests passed. 98% coverage verifying OpenAI tool mocks, argument validation, and edge-case handling.'
	},
	interactiveComponent: 'tool-visualizer'
};
