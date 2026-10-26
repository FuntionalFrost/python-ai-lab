"""
Litestar 2.24+ Reference Implementation
Demonstrates Async Controller, Dependency Injection (Provide), and Pydantic DTOs.
"""
from litestar import Controller, Litestar, post, status_codes
from litestar.di import Provide
from pydantic import BaseModel, Field
from openai import AsyncOpenAI

class PromptPayload(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)

class CompletionResult(BaseModel):
    result: str
    model: str

class AIController(Controller):
    path = "/api"

    @post("/completion", status_code=status_codes.HTTP_200_OK)
    async def create_completion(
        self,
        data: PromptPayload,
        client: AsyncOpenAI,
    ) -> CompletionResult:
        response = await client.chat.completions.create(
            model="gemma-4-e4b-it",
            messages=[{"role": "user", "content": data.prompt}],
            temperature=data.temperature,
        )
        return CompletionResult(
            result=response.choices[0].message.content or "",
            model="gemma-4-e4b-it",
        )

async def provide_openai() -> AsyncOpenAI:
    return AsyncOpenAI()

app = Litestar(
    route_handlers=[AIController],
    dependencies={"client": Provide(provide_openai, sync_to_thread=False)},
)
