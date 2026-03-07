"""
MongoDB connection helper for the Activity Log database.

Provides a single ``motor`` AsyncIOMotorClient that is shared across all
requests (one client → one connection pool).  The client is created lazily
on first use so the server still starts even when MongoDB is unreachable.

Usage
-----
    from mongo_activity import get_activity_collection

    async def my_route():
        col = await get_activity_collection()
        await col.insert_one(doc)

Indexes
-------
Call ``ensure_indexes()`` once at application startup (registered as a
FastAPI ``lifespan`` or ``on_event("startup")`` handler in ``main.py``).
The indexes created are:

* ``student_id``        ascending  – fast per-student queries
* ``course_id``         ascending  – optional course filter
* ``event_type``        ascending  – optional type filter
* ``timestamp``         descending – default sort order
* ``(student_id, timestamp)`` compound – engagement feature aggregation
"""

from __future__ import annotations

import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from pymongo import ASCENDING, DESCENDING, IndexModel

from config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singleton client
# ---------------------------------------------------------------------------

_client: Optional[AsyncIOMotorClient] = None   # type: ignore[type-arg]


def _get_client() -> AsyncIOMotorClient:        # type: ignore[return]
    """Return (or lazily create) the shared Motor client."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.MONGODB_ACTIVITY_URI,
            # Keep the pool small – activity writes are low-throughput
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5_000,
        )
        logger.info("Motor client created → %s", settings.MONGODB_ACTIVITY_URI)
    return _client


async def get_activity_collection() -> AsyncIOMotorCollection:  # type: ignore[return]
    """
    Return the ``activity_logs`` collection, connecting on first call.

    Raises
    ------
    pymongo.errors.ServerSelectionTimeoutError
        If MongoDB is unreachable within the configured timeout.
    """
    client = _get_client()
    db     = client[settings.MONGODB_ACTIVITY_DB]
    return db[settings.MONGODB_ACTIVITY_COL]


async def ensure_indexes() -> None:
    """
    Create indexes on the activity_logs collection (idempotent).

    Should be called once at application startup.
    """
    try:
        col = await get_activity_collection()
        indexes = [
            IndexModel([("student_id", ASCENDING)]),
            IndexModel([("course_id",  ASCENDING)]),
            IndexModel([("event_type", ASCENDING)]),
            IndexModel([("timestamp",  DESCENDING)]),
            IndexModel([("student_id", ASCENDING), ("timestamp", DESCENDING)]),
        ]
        await col.create_indexes(indexes)
        logger.info(
            "MongoDB activity_logs indexes ensured on %s/%s",
            settings.MONGODB_ACTIVITY_DB,
            settings.MONGODB_ACTIVITY_COL,
        )
    except Exception as exc:
        # Non-fatal: server continues; logs will still be written once MongoDB
        # becomes available.
        logger.warning("Could not ensure MongoDB indexes: %s", exc)


def close_client() -> None:
    """Close the Motor client (call at application shutdown)."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("Motor client closed")
