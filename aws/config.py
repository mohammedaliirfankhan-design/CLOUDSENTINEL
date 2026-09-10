import os


DEFAULT_AWS_PROFILE = "cloudsentinel-audit"
DEFAULT_AWS_REGION = "ap-south-1"

DEFAULT_AWS_POLL_INTERVAL_SECONDS = 60
DEFAULT_AWS_MAX_EVENTS_PER_POLL = 50


def get_aws_profile() -> str:
    """Return the AWS profile used by CloudSentinel."""

    return os.getenv(
        "AWS_PROFILE",
        DEFAULT_AWS_PROFILE,
    )


def get_aws_region() -> str:
    """Return the AWS region used by CloudSentinel."""

    return os.getenv(
        "AWS_REGION",
        DEFAULT_AWS_REGION,
    )


def get_aws_poll_interval() -> int:
    """
    Return the AWS CloudTrail polling interval in seconds.

    The value can be overridden using AWS_POLL_INTERVAL_SECONDS.
    """

    value = os.getenv(
        "AWS_POLL_INTERVAL_SECONDS",
        str(DEFAULT_AWS_POLL_INTERVAL_SECONDS),
    )

    try:
        interval = int(value)
    except ValueError:
        return DEFAULT_AWS_POLL_INTERVAL_SECONDS

    return max(1, interval)


def get_aws_max_events_per_poll() -> int:
    """
    Return the maximum number of CloudTrail events collected
    during each polling cycle.

    The value can be overridden using AWS_MAX_EVENTS_PER_POLL.
    """

    value = os.getenv(
        "AWS_MAX_EVENTS_PER_POLL",
        str(DEFAULT_AWS_MAX_EVENTS_PER_POLL),
    )

    try:
        max_events = int(value)
    except ValueError:
        return DEFAULT_AWS_MAX_EVENTS_PER_POLL

    return max(1, max_events)