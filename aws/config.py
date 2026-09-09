import os


DEFAULT_AWS_PROFILE = "cloudsentinel-audit"
DEFAULT_AWS_REGION = "ap-south-1"


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