from secrets import token_hex

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.merchant import Merchant
from app.schemas.auth import (
    MerchantLoginRequest,
    MerchantRegisterRequest,
    MerchantResponse,
    TokenResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


def generate_merchant_code() -> str:
    """Generate a unique merchant identifier."""
    return f"MRC_{token_hex(4).upper()}"


@router.post(
    "/register",
    response_model=MerchantResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_merchant(
    payload: MerchantRegisterRequest,
    db: Session = Depends(get_db),
) -> MerchantResponse:
    """Register a new merchant account."""

    existing_merchant = db.scalar(
        select(Merchant).where(
            Merchant.email == payload.email
        )
    )

    if existing_merchant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A merchant with this email already exists.",
        )

    merchant = Merchant(
        merchant_code=generate_merchant_code(),
        business_name=payload.business_name,
        legal_name=payload.legal_name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        industry=payload.industry,
        country=payload.country.upper(),
        currency=payload.currency.upper(),
        timezone=payload.timezone,
        status="ACTIVE",
    )

    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    return MerchantResponse.model_validate(merchant)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    payload: MerchantLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate a merchant and return a JWT access token."""

    merchant = db.scalar(
        select(Merchant).where(
            Merchant.email == payload.email
        )
    )

    if not merchant or not verify_password(
        payload.password,
        merchant.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if merchant.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Merchant account is not active.",
        )

    access_token = create_access_token(
        subject=str(merchant.id)
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


def get_current_merchant(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Merchant:
    """Resolve the authenticated merchant from the JWT."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        merchant_id = payload.get("sub")

        if not merchant_id:
            raise credentials_exception

    except Exception:
        raise credentials_exception

    merchant = db.scalar(
        select(Merchant).where(
            Merchant.id == merchant_id
        )
    )

    if not merchant:
        raise credentials_exception

    return merchant


@router.get(
    "/me",
    response_model=MerchantResponse,
)
def get_me(
    current_merchant: Merchant = Depends(get_current_merchant),
) -> MerchantResponse:
    """Return the currently authenticated merchant."""

    return MerchantResponse.model_validate(current_merchant)