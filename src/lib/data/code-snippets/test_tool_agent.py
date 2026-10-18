"""
Unit Test Suite for Tool Agent using pytest-mock
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from tool_agent import AgentService, WeatherQuery

@pytest.mark.asyncio
async def test_tool_definitions_generated_correctly():
    mock_client = AsyncMock()
    service = AgentService(client=mock_client)
    tools = service.tool_definitions()

    assert len(tools) == 1
    fn = tools[0]["function"]
    assert fn["name"] == "get_current_weather"
    assert "location" in fn["parameters"]["properties"]
    assert fn["parameters"]["properties"]["unit"]["default"] == "celsius"

@pytest.mark.asyncio
async def test_execute_query_calls_openai(mocker):
    mock_client = mocker.AsyncMock()
    mock_response = MagicMock()
    mock_response.model_dump.return_value = {"id": "mock_id", "choices": []}
    mock_client.chat.completions.create.return_value = mock_response

    service = AgentService(client=mock_client)
    res = await service.execute_query("What is the weather in Vienna?")

    assert res["id"] == "mock_id"
    assert mock_client.chat.completions.create.await_count == 1
