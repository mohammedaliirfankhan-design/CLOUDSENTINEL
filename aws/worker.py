import logging
import time

from aws.config import get_aws_max_events_per_poll, get_aws_poll_interval
from aws.processor import AWSCloudTrailProcessor


logger = logging.getLogger("cloudsentinel.aws.worker")


def configure_logging() -> None:
    """Configure basic logging for the CloudSentinel AWS worker."""

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


class AWSRuntimeWorker:
    """
    Continuously collect AWS CloudTrail events and process them
    through the existing CloudSentinel AWS processing pipeline.

    The worker is intentionally responsible only for runtime
    scheduling. Collection, normalization, deduplication,
    detection, scoring, alert persistence, and notifications
    remain inside AWSCloudTrailProcessor.
    """

    def __init__(
        self,
        poll_interval: int | None = None,
        max_events_per_poll: int | None = None,
    ) -> None:
        self.poll_interval = (
            poll_interval
            if poll_interval is not None
            else get_aws_poll_interval()
        )

        self.max_events_per_poll = (
            max_events_per_poll
            if max_events_per_poll is not None
            else get_aws_max_events_per_poll()
        )

        self.processor = AWSCloudTrailProcessor()
        self.running = False

    def run_once(self) -> list[dict]:
        """
        Execute one AWS collection and processing cycle.

        Returns the alerts detected during this cycle.
        """

        logger.info(
            "Starting AWS CloudTrail collection cycle "
            "(max_events=%s)",
            self.max_events_per_poll,
        )

        alerts = self.processor.process_events(
            max_results=self.max_events_per_poll
        )

        logger.info(
            "AWS CloudTrail collection cycle completed "
            "(alerts_detected=%s)",
            len(alerts),
        )

        return alerts

    def run(self) -> None:
        """
        Run the worker continuously until interrupted.
        """

        self.running = True

        logger.info(
            "CloudSentinel AWS runtime worker started "
            "(poll_interval=%ss, max_events=%s)",
            self.poll_interval,
            self.max_events_per_poll,
        )

        while self.running:

            cycle_started = time.monotonic()

            try:
                self.run_once()

            except Exception:
                logger.exception(
                    "AWS CloudTrail processing cycle failed"
                )

            elapsed = time.monotonic() - cycle_started
            sleep_seconds = max(
                0,
                self.poll_interval - elapsed,
            )

            if sleep_seconds > 0 and self.running:
                logger.info(
                    "Next AWS collection cycle in %ss",
                    sleep_seconds,
                )

                try:
                    time.sleep(sleep_seconds)
                except KeyboardInterrupt:
                    self.stop()
                    break

        logger.info(
            "CloudSentinel AWS runtime worker stopped"
        )

    def stop(self) -> None:
        """Request a graceful worker shutdown."""

        self.running = False


def main() -> None:
    """Start the CloudSentinel AWS runtime worker."""

    configure_logging()

    worker = AWSRuntimeWorker()

    try:
        worker.run()
    except KeyboardInterrupt:
        worker.stop()


if __name__ == "__main__":
    main()