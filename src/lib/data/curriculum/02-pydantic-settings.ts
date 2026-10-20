import type { CurriculumLesson } from '../../types/curriculum';

export const track02: CurriculumLesson = {
	id: 'track-02',
	slug: '02-pydantic-settings',
	trackNumber: 2,
	title: 'Settings, Schemas & Configuration with Pydantic v2',
	shortTitle: 'Pydantic Settings & Schemas',
	subtitle: 'Environment Validation, Secret Masking, and Type-Safe Configuration Management',
	level: 'Beginner',
	estimatedMinutes: 25,
	topics: [
		'pydantic-settings BaseSettings',
		'SecretStr & Accidental Leak Prevention',
		'Nested Configurations (OpenAI, DB, Cache)',
		'@field_validator & @model_validator',
		'Prototype os.getenv() vs Production Settings'
	],
	frameworks: ['pydantic>=2.14.1', 'pydantic-settings>=2.16.0', 'pytest>=9.0'],
	tags: ['Pydantic', 'Configuration', 'Security', 'Validation', 'Best Practices'],
	summary:
		'Tackle the most frequent operational failure in AI apps: configuration drift and leaked keys. Master pydantic-settings, nested environment loading, custom Pydantic v2 validators, and automated testing of invalid settings.',
	objectives: [
		'Construct enterprise-ready settings classes using BaseSettings and SettingsConfigDict.',
		'Protect API keys from log leaking using SecretStr and get_secret_value().',
		'Implement custom field and model validators for cross-field validation.',
		'Avoid circular imports using dependency-injected cached settings (@lru_cache).',
		'Write unit tests that assert startup halts on invalid environment configurations.'
	],
	architecture: {
		patternName: 'Fail-Fast Configuration & Hierarchical Settings Tree',
		diagram: `+-------------------------------------------------------------------------+
|                  Environment Sources (.env / Docker / OS)               |
|      OPENAI_API_KEY=sk-...     DATABASE_URL=postgresql+asyncpg://...    |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                       AppSettings (BaseSettings)                        |
|                                                                         |
|   +-------------------+  +-------------------+  +--------------------+  |
|   |   OpenAISettings  |  |  DatabaseSettings |  |    RedisSettings   |  |
|   |  - api_key (Secret|  |  - url (Postgres) |  |  - host: str       |  |
|   |  - model: str     |  |  - pool_size: int |  |  - port: int       |  |
|   |  - max_retries    |  |  - max_overflow   |  |  - ssl: bool       |  |
|   +-------------------+  +-------------------+  +--------------------+  |
+-------------------------------------------------------------------------+
                                     |
               Validated at Startup -> Halts app if invalid
                                     v
+-------------------------------------------------------------------------+
|            Injected into Services via @lru_cache get_settings()         |
+-------------------------------------------------------------------------+`,
		explanation: `Relying on raw 'os.getenv()' or untyped globals is an anti-pattern that leads to runtime crashes in production when an environment variable is misspelled, missing, or has an invalid type (e.g. timeout='60' parsed as string instead of int).

Pydantic-settings validates every key upon application startup (Fail-Fast principle). It automatically casts data types, validates URL formats, masks secrets in tracebacks and print statements, and groups configuration into nested, domain-specific namespaces.`,
		keyConcepts: [
			{
				name: 'SecretStr',
				description:
					'Wraps sensitive secrets. Printing or logging the object outputs ********** instead of the plaintext key, preventing accidental exposure in Datadog/Sentry.'
			},
			{
				name: 'SettingsConfigDict',
				description:
					'Configures .env path, env_prefix, case_sensitive matching, and extra="forbid" to catch misspelled config keys immediately.'
			},
			{
				name: '@model_validator(mode="after")',
				description:
					'Executes after individual fields are validated to enforce multi-field business invariants (e.g., if env is "production", ssl must be enabled).'
			}
		]
	},
	comparisons: [
		{
			title: 'Prototype (Naive os.getenv) vs Production (pydantic-settings)',
			description:
				'Observe how raw environment access leads to silent bugs, while pydantic-settings guarantees type safety and fail-fast startup.',
			leftTitle: 'Prototype Anti-Pattern (Untyped & Fragile)',
			leftLanguage: 'python',
			leftCode: `import os

# Anti-pattern: Missing keys default to None or empty string
# No type validation: port is a string, not an integer
# Leaked secrets: printing CONFIG exposes raw API tokens
CONFIG = {
    "OPENAI_KEY": os.getenv("OPENAI_KEY"),
    "MODEL": os.getenv("MODEL", "gpt-4o"),
    "MAX_RETRIES": os.getenv("MAX_RETRIES", 3), # BUG: string "3" if passed in env!
    "TIMEOUT": float(os.getenv("TIMEOUT", 30)),
    "DEBUG": os.getenv("DEBUG", "False") == "True",
}

def get_client():
    # If OPENAI_KEY is missing, fails later during network call, not at boot!
    from openai import OpenAI
    return OpenAI(api_key=CONFIG["OPENAI_KEY"])`,
			rightTitle: 'Production Pattern (pydantic-settings + SecretStr)',
			rightLanguage: 'python',
			rightCode: `from functools import lru_cache
from pydantic import BaseModel, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class OpenAISettings(BaseModel):
    api_key: SecretStr = Field(..., description="OpenAI API secret token")
    model: str = Field(default="gpt-4o-mini")
    timeout_seconds: float = Field(default=30.0, ge=1.0, le=300.0)
    max_retries: int = Field(default=3, ge=0, le=10)

class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_nested_delimiter="__", # e.g. OPENAI__API_KEY
        case_sensitive=False,
        extra="ignore"
    )
    environment: str = Field(default="development", pattern="^(development|staging|production)$")
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
			title: 'Production Settings Tree with Nested Configuration',
			filePath: 'app/config.py',
			description:
				'Complete settings module featuring cross-field model validation, database URL validation, and secret masking.',
			language: 'python',
			code: `from functools import lru_cache
from typing import Literal
from pydantic import BaseModel, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class DatabaseSettings(BaseModel):
    host: str = Field(default="localhost")
    port: int = Field(default=5432, ge=1, le=65535)
    user: str = Field(default="postgres")
    password: SecretStr = Field(default=SecretStr("postgres"))
    name: str = Field(default="ai_lab")
    pool_size: int = Field(default=10, ge=1, le=50)

    @property
    def async_dsn(self) -> str:
        pwd = self.password.get_secret_value()
        return f"postgresql+asyncpg://{self.user}:{pwd}@{self.host}:{self.port}/{self.name}"

class LLMSettings(BaseModel):
    api_key: SecretStr
    model: str = "gpt-4o"
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    request_timeout: float = Field(default=30.0, ge=2.0, le=120.0)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_nested_delimiter="__",
        extra="forbid" # Catch misspelled env vars immediately
    )

    env: Literal["dev", "test", "prod"] = "dev"
    db: DatabaseSettings = Field(default_factory=DatabaseSettings)
    llm: LLMSettings

    @model_validator(mode="after")
    def validate_production_invariants(self) -> "Settings":
        if self.env == "prod":
            if self.llm.api_key.get_secret_value().startswith("mock-"):
                raise ValueError("Production environment cannot use mock API keys!")
            if self.db.host in ("localhost", "127.0.0.1"):
                raise ValueError("Production environment cannot target localhost database!")
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
from app.config import Settings, DatabaseSettings, LLMSettings

def test_settings_loads_valid_configuration(monkeypatch):
    monkeypatch.setenv("LLM__API_KEY", "sk-proj-valid-prod-key-12345678")
    monkeypatch.setenv("ENV", "dev")

    settings = Settings()
    assert settings.env == "dev"
    assert settings.llm.model == "gpt-4o"
    # Verify secret masking
    assert str(settings.llm.api_key) == "**********"
    assert settings.llm.api_key.get_secret_value() == "sk-proj-valid-prod-key-12345678"

def test_settings_fails_fast_on_missing_api_key(monkeypatch):
    monkeypatch.delenv("LLM__API_KEY", raising=False)
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    assert "llm.api_key" in str(exc_info.value)

def test_production_validator_blocks_localhost_db(monkeypatch):
    monkeypatch.setenv("LLM__API_KEY", "sk-live-production-secret")
    monkeypatch.setenv("ENV", "prod")
    monkeypatch.setenv("DB__HOST", "127.0.0.1")

    with pytest.raises(ValidationError) as exc_info:
        Settings()
    assert "Production environment cannot target localhost database!" in str(exc_info.value)

def test_production_validator_blocks_mock_key(monkeypatch):
    monkeypatch.setenv("LLM__API_KEY", "mock-key-for-tests")
    monkeypatch.setenv("ENV", "prod")
    monkeypatch.setenv("DB__HOST", "db.internal.aws.com")

    with pytest.raises(ValidationError) as exc_info:
        Settings()
    assert "Production environment cannot use mock API keys!" in str(exc_info.value)`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: mock-3.17.0, cov-7.1.0
collected 4 items

tests/test_config.py::test_settings_loads_valid_configuration PASSED     [ 25%]
tests/test_config.py::test_settings_fails_fast_on_missing_api_key PASSED [ 50%]
tests/test_config.py::test_production_validator_blocks_localhost_db PASSED [ 75%]
tests/test_config.py::test_production_validator_blocks_mock_key PASSED   [100%]

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
