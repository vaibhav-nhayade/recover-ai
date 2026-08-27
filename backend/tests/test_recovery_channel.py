from app.services.recovery_channel import determine_recovery_channel


def test_payment_retry_uses_payment_channel():
    assert determine_recovery_channel(
        "PAYMENT_RETRY"
    ) == "PAYMENT"


def test_customer_contact_uses_email_channel():
    assert determine_recovery_channel(
        "CUSTOMER_CONTACT"
    ) == "EMAIL"


def test_manual_review_uses_manual_channel():
    assert determine_recovery_channel(
        "MANUAL_REVIEW"
    ) == "MANUAL"


def test_unknown_strategy_uses_manual_channel():
    assert determine_recovery_channel(
        "UNKNOWN"
    ) == "MANUAL"