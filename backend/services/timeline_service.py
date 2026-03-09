"""
Timeline Service
================

Aggregates student activity events by day using a MongoDB aggregation
pipeline, returning data shaped for frontend chart libraries (Recharts,
Chart.js, D3, etc.).

Primary method: :meth:`TimelineService.get_daily_timeline`.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from mongo_activity import get_activity_collection

logger = logging.getLogger(__name__)


class TimelineService:
    """Aggregate activity events into daily buckets for timeline charts."""

    @classmethod
    async def get_daily_timeline(
        cls,
        student_id: str,
        *,
        course_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """
        Return a list of ``{date, events, total_duration}`` dicts — one
        per calendar day that has at least one event — sorted ascending.

        Parameters
        ----------
        student_id : str
            Required student identifier.
        course_id : str, optional
            Restrict to a single course.
        start_date / end_date : date, optional
            Bounding dates (inclusive).  Interpreted as UTC midnight.

        Returns
        -------
        list[dict]
            Each element::

                {
                    "date":           "2026-03-01",
                    "events":         12,
                    "total_duration": 3420
                }
        """
        match_stage: Dict[str, Any] = {"student_id": student_id}

        if course_id:
            match_stage["course_id"] = course_id

        if start_date or end_date:
            ts_filter: Dict[str, Any] = {}
            if start_date:
                ts_filter["$gte"] = datetime(
                    start_date.year, start_date.month, start_date.day,
                    tzinfo=timezone.utc,
                )
            if end_date:
                ts_filter["$lte"] = datetime(
                    end_date.year, end_date.month, end_date.day,
                    23, 59, 59, tzinfo=timezone.utc,
                )
            match_stage["timestamp"] = ts_filter

        pipeline = [
            {"$match": match_stage},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$timestamp",
                        }
                    },
                    "events": {"$sum": 1},
                    "total_duration": {
                        "$sum": {"$ifNull": ["$duration", 0]}
                    },
                }
            },
            {"$sort": {"_id": 1}},
            {
                "$project": {
                    "_id": 0,
                    "date": "$_id",
                    "events": 1,
                    "total_duration": 1,
                }
            },
        ]

        col = await get_activity_collection()
        cursor = col.aggregate(pipeline)
        return await cursor.to_list(length=None)
