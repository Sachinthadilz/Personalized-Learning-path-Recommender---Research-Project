"""
Node Logger Forwarder
=====================

Asynchronous HTTP client that forwards activity-log events to the
Node.js logging service (``POST /logs``).

Node.js is the **sole writer** to MongoDB.  FastAPI awaits the forward
call so the client gets a confirmed 201 only after the event is safely
stored.  Retries with exponential back-off handle transient failures.

Configuration
-------------
Set the environment variable ``NODE_LOGGER_URL`` to override the
default ``http://localhost:4000/logs``.
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any, Dict

import httpx

logger = logging.getLogger(__name__)

NODE_LOGGER_URL: str = os.getenv("NODE_LOGGER_URL", "http://localhost:4000/logs")
MAX_RETRIES: int = 3
INITIAL_BACKOFF: float = 0.5        # seconds; doubles each retry
REQUEST_TIMEOUT: float = 5.0        # per-attempt timeout

_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT)
    return _client


async def close_client() -> None:
    """Gracefully close the shared httpx client (call on app shutdown)."""
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
        _client = None


async def forward_to_node_logger(payload: Dict[str, Any]) -> None:
    """
    POST *payload* to the Node.js logging service with retry.

    This is an **awaitable** call — the caller blocks until the Node
    service confirms storage or all retries are exhausted.

    Raises
    ------
    RuntimeError
        If the Node service is unreachable after all retry attempts.
    """
    client = _get_client()
    backoff = INITIAL_BACKOFF

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = await client.post(NODE_LOGGER_URL, json=payload)
            resp.raise_for_status()
            logger.debug(
                "Forwarded event %s to Node logger (attempt %d)",
                payload.get("log_id", "?"),
                attempt,
            )
            return
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.warning(
                "Node logger attempt %d/%d failed: %s",
                attempt,
                MAX_RETRIES,
                exc,
            )
            if attempt < MAX_RETRIES:
                await asyncio.sleep(backoff)
                backoff *= 2

    raise RuntimeError(
        f"Node logger unreachable after {MAX_RETRIES} attempts "
        f"— event {payload.get('log_id', '?')} not stored"
    )
