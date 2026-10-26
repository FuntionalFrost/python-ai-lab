import type { CurriculumLesson } from '../../types/curriculum';

export const track02: CurriculumLesson = {
	id: 'track-02',
	slug: '02-pydantic-settings',
	trackNumber: 2,
	title: 'Settings, Schemas & Configuration with Pydantic v2',
	shortTitle: 'Pydantic Settings & Schemas',
	subtitle: 'Environment Validation, Secret Masking, and Type-Safe Configuration Management',
	estimatedMinutes: 25,
	topics: [
		'pydantic-settings BaseSettings',
		'SecretStr & Accidental Leak Prevention',
		'Nested Configurations (OpenAI, Benchmark, Cache)',
		'@field_validator & @model_validator',
		'Ad-Hoc os.getenv() vs Validated Typed Settings'
	],
	frameworks: ['pydantic>=2.14.1', 'pydantic-settings>=2.16.0', 'pytest>=9.0'],
	tags: ['Pydantic', 'Configuration', 'Security', 'Validation', 'Best Practices'],
	summary:
		'Tackle the most frequent failure in AI prototypes and benchmarks: configuration drift and leaked keys. Master pydantic-settings, nested environment loading, custom Pydantic v2 validators, and automated testing of invalid settings.',
	objectives: [
		'Construct type-safe settings classes using BaseSettings and SettingsConfigDict.',
		'Protect API keys from log leaking using SecretStr and get_secret_value().',
		'Implement custom field and model validators for cross-field validation.',
		'Avoid circular imports using dependency-injected cached settings (@lru_cache).',
		'Write unit tests that assert startup halts on invalid environment configurations.'
	],
	architecture: {
		patternName: 'Fail-Fast Configuration & Hierarchical Settings Tree',
		diagram: `+-------------------------------------------------------------------------+
|                  Environment Sources (.env / CLI / OS)                  |
|      OPENAI_API_KEY=sk-...     BENCHMARK__MAX_CONCURRENCY=10            |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                       AppSettings (BaseSettings)                        |
|                                                                         |
|   +-------------------+  +-------------------+  +--------------------+  |
|   |   OpenAISettings  |  | BenchmarkSettings |  |   SessionSettings  |  |
|   |  - api_key (Secret|  |  - concurrency    |  |  - connect_timeout |  |
|   |  - model: str     |  |  - judge_model    |  |  - read_timeout    |  |
|   |  - max_retries    |  |  - candidates     |  |  - pool_maxsize    |  |
|   +-------------------+  +-------------------+  +--------------------+  |
+-------------------------------------------------------------------------+
                                     |
               Validated at Startup -> Halts run if invalid
                                     v
+-------------------------------------------------------------------------+
|            Injected into Services via @lru_cache get_settings()         |
+-------------------------------------------------------------------------+`,
		explanation: `Relying on raw 'os.getenv()' or untyped globals is an anti-pattern that leads to runtime crashes during benchmarking or testing when an environment variable is misspelled, missing, or has an invalid type (e.g. timeout='60' parsed as string instead of int).

Pydantic-settings validates every key upon startup (Fail-Fast principle). It automatically casts data types, validates bounds, masks secrets in tracebacks and print statements, and groups configuration into nested, domain-specific namespaces.`,
		keyConcepts: [
			{
				name: 'SecretStr',
				description:
					'Wraps sensitive secrets. Printing or logging the object outputs ********** instead of the plaintext key, preventing accidental exposure in logs.'
			},
			{
				name: 'SettingsConfigDict',
				description:
					'Configures .env path, env_prefix, case_sensitive matching, and extra="forbid" to catch misspelled config keys immediately.'
			},
			{
				name: '@model_validator(mode="after")',
				description:
					'Executes after individual fields are validated to enforce multi-field invariants (e.g., if env is "benchmark", mock keys must be rejected).'
			}
		]
	},
	comparisons: [
		{
			title: 'Ad-Hoc os.getenv() vs. Validated Settings (pydantic-settings)',
			description:
				'Observe how raw environment access leads to silent bugs, while pydantic-settings guarantees type safety and fail-fast startup.',
			leftTitle: 'Ad-Hoc Anti-Pattern (Untyped & Fragile)',
			leftLanguage: 'python',
			leftCode: `import os

# Anti-pattern: Missing keys default to None or empty string
# No type validation: max_retries is a string if passed via env
# Leaked secrets: printing CONFIG exposes raw API tokens
CONFIG = {
    "OPENAI_KEY": os.getenv("OPENAI_KEY"),
    "MODEL": os.getenv("MODEL", "gemma-4-e4b-it"),
    "MAX_RETRIES": os.getenv("MAX_RETRIES", 3), # BUG: string "3" if passed in env!
    "TIMEOUT": float(os.getenv("TIMEOUT", 30)),
    "DEBUG": os.getenv("DEBUG", "False") == "True",
}

def get_client():
    # If OPENAI_KEY is missing, fails later during network call, not at boot!
    from openai import OpenAI
    return OpenAI(api_key=CONFIG["OPENAI_KEY"])`,
			rightTitle: 'Validated Prototype Pattern (pydantic-settings + SecretStr)',
			rightLanguage: 'python',
			rightCode: `from functools import lru_cache
from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class OpenAISettings(BaseModel):
    api_key: SecretStr = Field(..., description="OpenAI API secret token")
    model: str = Field(default="gemma-4-e4b-it")
    timeout_seconds: float = Field(default=30.0, ge=1.0, le=300.0)
    max_retries: int = Field(default=3, ge=0, le=10)

class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_nested_delimiter="__", # e.g. OPENAI__API_KEY
        case_sensitive=False,
        extra="ignore"
    )
    environment: str = Field(default="dev", pattern="^(dev|test|benchmark)$")
    openai: OpenAISettings

@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    """Cached singleton prevents reading filesystem repeatedly."""
    return AppSettings()`
		}
	],
	codeSnippets: [
		{
			id: 'complete-settings-model',
			title: 'Hierarchical Settings Tree with Cross-Field Validation',
			filePath: 'app/config.py',
			description:
				'Complete settings module featuring cross-field model validation, benchmark concurrency bounds, and secret masking.',
			language: 'python',
			code: `from functools import lru_cache
from typing import Literal
from pydantic import BaseModel, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class BenchmarkConfig(BaseModel):
    judge_model: str = Field(default="gemma-4-e4b-it")
    max_concurrency: int = Field(default=10, ge=1, le=50)
    use_live_network: bool = Field(default=False)

class LLMSettings(BaseModel):
    api_key: SecretStr
    model: str = "gemma-4-e4b-it"
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    request_timeout: float = Field(default=30.0, ge=2.0, le=120.0)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_nested_delimiter="__",
        extra="forbid" # Catch misspelled env vars immediately
    )

    env: Literal["dev", "test", "benchmark"] = "dev"
    benchmark: BenchmarkConfig = Field(default_factory=BenchmarkConfig)
    llm: LLMSettings

    @model_validator(mode="after")
    def validate_benchmark_invariants(self) -> "Settings":
        if self.env == "benchmark":
            if self.llm.api_key.get_secret_value().startswith("mock-"):
                raise ValueError("Live benchmark mode cannot use mock API keys!")
            if not self.benchmark.use_live_network:
                raise ValueError("Benchmark mode requires BENCHMARK__USE_LIVE_NETWORK=True!")
        return self

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()`,
			runnable: true
		}
	],
	testSuite: {
		title: 'Settings Validation Test Suite (pytest)',
		testFilePath: 'tests/test_config.py',
		command: 'pytest -v --cov=app/config tests/test_config.py',
		executionTimeSec: 0.62,
		testCode: `import pytest
from pydantic import ValidationError
from app.config import Settings, BenchmarkConfig, LLMSettings

def test_settings_loads_valid_configuration(monkeypatch):
    monkeypatch.setenv("LLM__API_KEY", "sk-proj-valid-key-12345678")
    monkeypatch.setenv("ENV", "dev")

    settings = Settings()
    assert settings.env == "dev"
    assert settings.llm.model == "gemma-4-e4b-it"
    # Verify secret masking
    assert str(settings.llm.api_key) == "**********"
    assert settings.llm.api_key.get_secret_value() == "sk-proj-valid-key-12345678"

def test_settings_fails_fast_on_missing_api_key(monkeypatch):
    monkeypatch.delenv("LLM__API_KEY", raising=False)
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    assert "llm.api_key" in str(exc_info.value)

def test_benchmark_validator_requires_live_network(monkeypatch):
    monkeypatch.setenv("LLM__API_KEY", "sk-live-secret-key")
    monkeypatch.setenv("ENV", "benchmark")
    monkeypatch.setenv("BENCHMARK__USE_LIVE_NETWORK", "false")

    with pytest.raises(ValidationError) as exc_info:
        Settings()
    assert "Benchmark mode requires BENCHMARK__USE_LIVE_NETWORK=True!" in str(exc_info.value)

def test_benchmark_validator_blocks_mock_key(monkeypatch):
    monkeypatch.setenv("LLM__API_KEY", "mock-key-for-tests")
    monkeypatch.setenv("ENV", "benchmark")
    monkeypatch.setenv("BENCHMARK__USE_LIVE_NETWORK", "true")

    with pytest.raises(ValidationError) as exc_info:
        Settings()
    assert "Live benchmark mode cannot use mock API keys!" in str(exc_info.value)`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: mock-3.17.0, cov-7.1.0
collected 4 items

tests/test_config.py::test_settings_loads_valid_configuration PASSED     [ 25%]
tests/test_config.py::test_settings_fails_fast_on_missing_api_key PASSED [ 50%]
tests/test_config.py::test_benchmark_validator_requires_live_network PASSED [ 75%]
tests/test_config.py::test_benchmark_validator_blocks_mock_key PASSED    [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name             Stmts   Miss  Cover   Missing
----------------------------------------------
app/config.py       32      0   100%
----------------------------------------------
TOTAL               32      0   100%

============================== 4 passed in 0.62s ===============================`,
		coverage: {
			files: [{ name: 'app/config.py', stmts: 32, miss: 0, cover: '100%', missing: '' }],
			total: { stmts: 32, miss: 0, cover: '100%' }
		},
		summary: 'All 4 test cases passed with 100% test coverage on configuration & validation rules.'
	},
	interactiveComponent: 'code-comparison'
};
