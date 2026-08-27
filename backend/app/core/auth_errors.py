from fastapi import HTTPException, status


def authentication_exception() -> HTTPException:
    """
    Return the standard authentication failure response.
    """

    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def inactive_account_exception() -> HTTPException:
    """
    Return the response used when a merchant account is inactive.
    """

    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Merchant account is not active.",
    )