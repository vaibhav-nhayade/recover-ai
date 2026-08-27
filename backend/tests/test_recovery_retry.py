from types import SimpleNamespace

from app.services import recovery_retry


class FakeSession:
    def __init__(self, count=0, latest_attempt=None):
        self.count = count
        self.latest_attempt = latest_attempt

    def scalar(self, statement):
        statement_text = str(statement)

        if "count(" in statement_text.lower():
            return self.count

        return self.latest_attempt


def make_case(status):
    return SimpleNamespace(
        id="case-1",
        status=status,
    )


def test_recovered_case_cannot_retry():
    case = make_case("RECOVERED")

    assert recovery_retry.can_retry_recovery(
        case,
        FakeSession(),
    ) is False


def test_closed_case_cannot_retry():
    case = make_case("CLOSED")

    assert recovery_retry.can_retry_recovery(
        case,
        FakeSession(),
    ) is False


def test_open_case_cannot_retry():
    case = make_case("OPEN")

    assert recovery_retry.can_retry_recovery(
        case,
        FakeSession(),
    ) is False


def test_failed_case_without_previous_attempt_cannot_retry():
    case = make_case("FAILED")

    assert recovery_retry.can_retry_recovery(
        case,
        FakeSession(count=0, latest_attempt=None),
    ) is False


def test_failed_case_with_failed_attempt_can_retry():
    case = make_case("FAILED")

    latest_attempt = SimpleNamespace(
        status="FAILED",
    )

    session = FakeSession(
        count=1,
        latest_attempt=latest_attempt,
    )

    assert recovery_retry.can_retry_recovery(
        case,
        session,
    ) is True