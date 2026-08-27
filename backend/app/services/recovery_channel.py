def determine_recovery_channel(strategy: str) -> str:
    """
    Determine the delivery channel for a recovery strategy.
    """

    channel_map = {
        "PAYMENT_RETRY": "PAYMENT",
        "CUSTOMER_CONTACT": "EMAIL",
        "MANUAL_REVIEW": "MANUAL",
    }

    return channel_map.get(strategy, "MANUAL")