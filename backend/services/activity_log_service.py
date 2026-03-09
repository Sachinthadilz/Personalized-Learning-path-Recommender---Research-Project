"""
Activity Log Service
====================

Reads student activity events from MongoDB (via ``motor``) and computes
engagement features for the ML pipeline.

**Writes are delegated to the Node.js logging service.**  The only write
helper remaining here is :meth:`build_response`, which constructs the
response payload (with a server-generated ``log_id``) that gets forwarded
to the Node service by the FastAPI route.

Feature aggregation helpers remain synchronous (pure Python) — they operate
on lists of already-fetched documents and do not touch the database directly.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from activity_log_model import (
    ASSESSMENT_EVENT_TYPES,
    CLICK_EVENT_TYPES,
    ActivityLogEntry,
    ActivityLogResponse,
    EngagementFeatures,
    EventType,
)
from mongo_activity import get_activity_collection
from services.course_mapping_service import CourseMappingService, CourseMappingError

logger = logging.getLogger(__name__)

_EARLY_PERIOD_DAYS = 14


class ActivityLogService:
    """
    Service class for the student activity log pipeline.

    * **Writes** — delegated to the Node.js logging service; this class
      only builds the response payload (:meth:`build_response`).
    * **Reads** — query MongoDB via Motor for log retrieval and feature
      aggregation.
    """

    # ── Write (delegated to Node.js) ──────────────────────────────────────

    @staticmethod
    def build_response(entry: ActivityLogEntry) -> ActivityLogResponse:
        """
        Create an :class:`ActivityLogResponse` with a server-generated
        ``log_id`` — **without** writing to MongoDB.

        Actual persistence is handled by the Node.js logging service;
        this helper is used by the route to build the payload that gets
        forwarded.
        """
        return ActivityLogResponse.from_entry(entry)

    # ── Read ─────────────────────────────────────────────────────────────────

    @classmethod
    async def get_student_logs(
        cls,
        student_id: str,
        course_id:  Optional[str]       = None,
        event_type: Optional[EventType] = None,
        since:      Optional[datetime]  = None,
        limit:      int                 = 500,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve raw log documents for a student from MongoDB, most-recent first.

        All filter parameters are applied at the database level via a MongoDB
        query so only matching documents are transferred over the wire.
        """
        query: Dict[str, Any] = {"student_id": student_id}
        if course_id:
            query["course_id"] = course_id
        if event_type:
            query["event_type"] = event_type.value
        if since:
            query["timestamp"] = {"$gte": since.isoformat()}

        col = await get_activity_collection()
        cursor = col.find(
            query,
            {"_id": 0},          # never return MongoDB internal _id
            sort=[("timestamp", -1)],
            limit=limit,
        )
        return await cursor.to_list(length=limit)

    @classmethod
    async def get_all_students(cls) -> List[str]:
        """Return distinct student IDs that have at least one log entry."""
        col = await get_activity_collection()
        return await col.distinct("student_id")

    @classmethod
    async def delete_student_logs(cls, student_id: str) -> int:
        """
        Permanently delete all logs for a student from MongoDB.

        Returns the count of deleted documents.
        Intended for testing / GDPR data-erasure requests.
        """
        col = await get_activity_collection()
        result = await col.delete_many({"student_id": student_id})
        logger.info(
            "Deleted %d log(s) for student_id=%s", result.deleted_count, student_id
        )
        return result.deleted_count

    # ── Feature aggregation (sync helpers on already-fetched document lists) ─

    @staticmethod
    def _parse_ts(record: Dict[str, Any]) -> datetime:
        """Parse the ISO-format timestamp stored in a log document."""
        raw = record["timestamp"]
        if isinstance(raw, datetime):
            return raw
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return datetime.fromisoformat(raw)

    @classmethod
    def _click_records(cls, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        click_values = {et.value for et in CLICK_EVENT_TYPES}
        return [r for r in records if r["event_type"] in click_values]

    @classmethod
    def compute_total_clicks(cls, records: List[Dict[str, Any]]) -> int:
        return len(cls._click_records(records))

    @classmethod
    def compute_days_active(cls, records: List[Dict[str, Any]]) -> int:
        clicks = cls._click_records(records)
        if not clicks:
            return 0
        return len({cls._parse_ts(r).date() for r in clicks})

    @classmethod
    def compute_max_daily_clicks(cls, records: List[Dict[str, Any]]) -> int:
        clicks = cls._click_records(records)
        if not clicks:
            return 0
        daily: Dict[str, int] = defaultdict(int)
        for r in clicks:
            daily[cls._parse_ts(r).date().isoformat()] += 1
        return max(daily.values())

    @classmethod
    def compute_mean_daily_clicks(cls, records: List[Dict[str, Any]]) -> float:
        total = cls.compute_total_clicks(records)
        days  = cls.compute_days_active(records)
        return 0.0 if days == 0 else round(total / days, 1)

    @classmethod
    def compute_early_clicks(cls, records: List[Dict[str, Any]]) -> int:
        clicks = cls._click_records(records)
        if not clicks:
            return 0
        earliest_per_course: Dict[str, datetime] = {}
        for r in records:
            cid = r["course_id"]
            ts  = cls._parse_ts(r)
            if cid not in earliest_per_course or ts < earliest_per_course[cid]:
                earliest_per_course[cid] = ts
        count = 0
        for r in clicks:
            cid    = r["course_id"]
            ts     = cls._parse_ts(r)
            cutoff = earliest_per_course[cid] + timedelta(days=_EARLY_PERIOD_DAYS)
            if ts.replace(tzinfo=None) <= cutoff.replace(tzinfo=None):
                count += 1
        return count

    @classmethod
    def compute_num_assessments(cls, records: List[Dict[str, Any]]) -> int:
        assessment_values = {et.value for et in ASSESSMENT_EVENT_TYPES}
        return sum(1 for r in records if r["event_type"] in assessment_values)

    # ── Primary feature aggregation ──────────────────────────────────────────

    @classmethod
    async def generate_engagement_features(
        cls,
        student_id: str,
        course_id:  Optional[str] = None,
    ) -> EngagementFeatures:
        """
        Fetch all logs for ``student_id`` from MongoDB and compute the six
        ML engagement features.

        Parameters
        ----------
        student_id:
            Target student.
        course_id:
            Optional — restrict to a single course; otherwise all courses are
            aggregated.

        Returns
        -------
        EngagementFeatures
            Ready-to-use feature object for the learner profile ML pipeline.
        """
        query: Dict[str, Any] = {"student_id": student_id}
        if course_id:
            query["course_id"] = course_id

        col = await get_activity_collection()
        cursor  = col.find(query, {"_id": 0})
        records = await cursor.to_list(length=None)   # load all for exact aggregation

        if not records:
            logger.warning(
                "No activity logs found for student_id=%s (course_id=%s)",
                student_id, course_id,
            )
            return EngagementFeatures(student_id=student_id)

        # Resolve OULAD code_module / code_presentation from course_id
        resolved_module: str | None = None
        resolved_presentation: str | None = None
        if course_id:
            try:
                mapping = CourseMappingService.map_course(course_id)
                resolved_module = mapping["code_module"]
                resolved_presentation = mapping["code_presentation"]
            except CourseMappingError:
                logger.warning(
                    "Could not resolve course_id=%s to OULAD module", course_id,
                )

        features = EngagementFeatures(
            student_id        = student_id,
            code_module       = resolved_module,
            code_presentation = resolved_presentation,
            total_clicks      = cls.compute_total_clicks(records),
            days_active       = cls.compute_days_active(records),
            max_daily_clicks  = cls.compute_max_daily_clicks(records),
            mean_daily_clicks = cls.compute_mean_daily_clicks(records),
            early_clicks      = cls.compute_early_clicks(records),
            num_assessments   = cls.compute_num_assessments(records),
            log_count         = len(records),
        )

        logger.info(
            "Engagement features for student_id=%s: clicks=%d days=%d assessments=%d module=%s/%s",
            student_id, features.total_clicks, features.days_active,
            features.num_assessments, resolved_module, resolved_presentation,
        )
        return features
