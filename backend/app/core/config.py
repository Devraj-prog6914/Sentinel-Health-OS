import os
from typing import List, Union
from pydantic import AnyHttpUrl, BeforeValidator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated

def parse_cors(v: Union[str, List[str]]) -> List[str]:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, (list, str)):
        return v
    raise ValueError(v)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentinel Health Operating System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "SUPER_SECRET_SECURITY_KEY_SENTINEL_HEALTH_OS_2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: Annotated[
        List[str], BeforeValidator(parse_cors)
    ] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # DB URL - Fallback to SQLite local file for easy execution
    DATABASE_URL: str = "sqlite:///./sentinel_health.db"
    
    # Redis configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Vector dimensions (for clinical knowledge embeddings or Medical OCR)
    VECTOR_DIMENSION: int = 1536
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )

settings = Settings()
