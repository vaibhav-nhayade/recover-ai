import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class MerchantRegisterRequest(BaseModel):
    business_name: str = Field(min_length=2, max_length=150)
    legal_name: str | None = Field(default=None, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    industry: str | None = Field(default=None, max_length=100)
    country: str = Field(default="IN", min_length=2, max_length=2)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    timezone: str = Field(default="Asia/Kolkata", max_length=64)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(character.isupper() for character in value):
            raise ValueError(
                "Password must contain at least one uppercase letter."
            )

        if not any(character.islower() for character in value):
            raise ValueError(
                "Password must contain at least one lowercase letter."
            )

        if not any(character.isdigit() for character in value):
            raise ValueError(
                "Password must contain at least one number."
            )

        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError(
                "Password must contain at least one special character."
            )

        return value


class MerchantLoginRequest(BaseModel):
    email: EmailStr
    password: str


class MerchantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    merchant_code: str
    business_name: str
    legal_name: str | None
    email: EmailStr
    phone: str | None
    industry: str | None
    country: str
    currency: str
    timezone: str
    status: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"]