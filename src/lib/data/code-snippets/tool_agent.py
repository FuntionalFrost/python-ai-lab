"""
Tool Calling Reference Implementation
Demonstrates schema generation from Pydantic, tool dispatching, and multi-turn execution.
"""
from typing import Any
from pydantic import BaseModel, Field
from openai import AsyncOpenAI

class WeatherQuery(BaseModel):
    location: str = Field(description="City and country, e.g. Vienna, Austria")
    unit: str = Field(default="celsius", pattern="^(celsius|fahrenheit)$")

class AgentService:
    def __init__(self, client: AsyncOpenAI, model: str = "gpt-4o-mini") -> None:
        self.client = client
        self.model = model

    def tool_definitions(self) -> list[dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_current_weather",
                    "description": "Get current weather for a city",
                    "parameters": WeatherQuery.model_json_schema(),
                },
            }
        ]

    async def execute_query(self, prompt: str) -> dict[str, Any]:
        resp = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            tools=self.tool_definitions(),
            tool_choice="auto",
        )
        return resp.model_dump()
