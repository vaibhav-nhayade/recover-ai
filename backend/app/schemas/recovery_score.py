from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RecoveryScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    transaction_id: UUID
    transaction_reference: str
    amount: Decimal
    currency: str

    probability: float
    probability_percent: float

    confidence: float
    confidence_percent: float

    score: float
    risk_band: str
    recommended_strategy: str

    features: dict[str, float]
    evidence: list[str]