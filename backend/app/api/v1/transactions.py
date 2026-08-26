from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_merchant
from app.core.database import get_db
from app.models.merchant import Merchant
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionCreateRequest,
    TransactionResponse,
)


router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"],
)


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    payload: TransactionCreateRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> TransactionResponse:
    """Create a transaction for the authenticated merchant."""

    existing = db.scalar(
        select(Transaction).where(
            Transaction.transaction_reference
            == payload.transaction_reference
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A transaction with this reference already exists.",
        )

    transaction = Transaction(
        merchant_id=current_merchant.id,
        transaction_reference=payload.transaction_reference,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        amount=payload.amount,
        currency=payload.currency.upper(),
        payment_method=payload.payment_method,
        status=payload.status.upper(),
        failure_reason=payload.failure_reason,
        occurred_at=payload.occurred_at,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return TransactionResponse.model_validate(transaction)


@router.get(
    "",
    response_model=list[TransactionResponse],
)
def list_transactions(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> list[TransactionResponse]:
    """List transactions belonging to the authenticated merchant."""

    transactions = db.scalars(
        select(Transaction)
        .where(Transaction.merchant_id == current_merchant.id)
        .order_by(Transaction.occurred_at.desc())
    ).all()

    return [
        TransactionResponse.model_validate(transaction)
        for transaction in transactions
    ]


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
)
def get_transaction(
    transaction_id: UUID,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> TransactionResponse:
    """Get one transaction belonging to the authenticated merchant."""

    transaction = db.scalar(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.merchant_id == current_merchant.id,
        )
    )

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    return TransactionResponse.model_validate(transaction)