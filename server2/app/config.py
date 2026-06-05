from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 5002
    DATABASE_URL: str
    REDIS_URL: str
    TRUSTED_GATEWAY_HEADER: str = "x-skillbridge-gateway"
    TRUSTED_GATEWAY_SECRET: str
    CORS_ORIGIN: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
