from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional


class Settings(BaseSettings):
    DATABASE_PATH: str = "data/urtrack.db"
    SECRET_KEY: str = "urtrack-dev-secret-change-in-production"
    APP_NAME: str = "UrTrack"
    DATA_DIR: str = "data"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    PRODUCTION: bool = False
    ALLOWED_IPS: Optional[list[str]] = None
    FRONTEND_DIST: Optional[str] = None

    class Config:
        env_file = ".env"

    @field_validator("ALLOWED_IPS", mode="before")
    @classmethod
    def split_ips(cls, v):
        if isinstance(v, str) and v:
            return [ip.strip() for ip in v.split(",") if ip.strip()]
        return v


settings = Settings()
