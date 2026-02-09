"""애플리케이션 설정 및 환경 변수."""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """환경 변수 기반 설정."""

    # Database
    database_url: str = "sqlite+aiosqlite:///./storm_drain.db"

    # vLLM (Tailscale IP 필수)
    vllm_base_url: str = "http://100.x.x.x:8000/v1"
    vllm_api_key: Optional[str] = None
    vllm_model: str = "meta-llama/Llama-3-70b-instruct"

    # Fallback & Timeout
    fallback_enabled: bool = True
    llm_timeout_seconds: int = 30

    # Admin Alert
    admin_webhook_url: Optional[str] = None
    admin_email: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
