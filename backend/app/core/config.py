from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RecoverAI API"
    app_version: str = "0.1.0"
    environment: str = "development"

    database_url: str

    jwt_secret_key: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(
        default=60,
        gt=0,
        le=1440,
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("jwt_algorithm")
    @classmethod
    def validate_jwt_algorithm(cls, value: str) -> str:
        allowed_algorithms = {
            "HS256",
            "HS384",
            "HS512",
        }

        if value not in allowed_algorithms:
            raise ValueError(
                "Unsupported JWT algorithm. "
                "Allowed values: HS256, HS384, HS512."
            )

        return value


settings = Settings()