"""
Redis Queue — Activity Event Pipeline
======================================

Pushes activity-log events onto a Redis list (``activity_events``) for
asynchronous consumption by the Node.js logging service.

The module exposes:

* ``connect_redis()``  / ``close_redis()``  — lifecycle helpers called
  from the FastAPI lifespan handler.
* ``enqueue_activity_event(event)`` — non-blocking LPUSH of a JSON
  payload onto the queue.

Configuration
-------------
``REDIS_URL``  env-var, defaults to ``redis://localhost:6379/0``.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
QUEUE_NAME: str = "activity_events"

_pool: aioredis.Redis | None = None


async def connect_redis() -> None:
    """
    Create the shared async Redis connection (call once at startup).
    
    Gracefully handles connection failures so the application can start
    without Redis. Activity events will be logged locally if Redis is unavailable.
    """
    global _pool
    try:
        _pool = aioredis.from_url(REDIS_URL, decode_responses=True)
        # Verify connectivity
        await _pool.ping()
        logger.info("Redis connected (%s)", REDIS_URL)
    except Exception as exc:
        logger.warning(
            "Redis connection failed (%s): %s. Activity events will be logged locally.",
            REDIS_URL, exc
        )
        _pool = None


async def close_redis() -> None:
    """Gracefully close the Redis connection (call on shutdown)."""
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None
        logger.info("Redis connection closed")


async def enqueue_activity_event(event: Dict[str, Any]) -> None:
    """
    Serialise *event* to JSON and push it onto the ``activity_events``
    Redis list.

    The call uses ``LPUSH`` so the newest events are at the head.
    A consumer (e.g. the Node.js logging service) can ``BRPOP`` from the
    tail in FIFO order.

    If Redis is unavailable, the event is logged locally instead of raising
    an error, allowing the application to continue functioning.
    """
    if _pool is None:
        logger.warning(
            "Redis unavailable — event %s logged locally (not queued)",
            event.get("log_id", "?")
        )
        return

    try:
        payload = json.dumps(event, default=str)
        await _pool.lpush(QUEUE_NAME, payload)
        logger.debug("Enqueued event %s onto %s", event.get("log_id", "?"), QUEUE_NAME)
    except Exception as exc:
        logger.error(
            "Failed to enqueue event %s: %s",
            event.get("log_id", "?"), exc
        )
