"""
Engagement Feature Service
===========================

High-performance engagement feature computation using MongoDB aggregation
pipelines. This service computes all ML features server-side in MongoDB,
minimizing data transfer and client-side processing.

Key advantage over client-side aggregation: all computation happens in the
database, drastically reducing network transfer and memory usage for students
with thousands of activity logs.

Primary method: :meth:`EngagementFeatureService.generate_engagement_features`.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from activity_log_model import (
    ASSESSMENT_EVENT_TYPES,
    CLICK_EVENT_TYPES,
    EngagementFeatures,
)
from mongo_activity import get_activity_collection
from services.course_mapping_service import CourseMappingService, CourseMappingError

logger = logging.getLogger(__name__)

_EARLY_PERIOD_DAYS = 14


class EngagementFeatureService:
    """
    Compute engagement features using MongoDB aggregation pipelines.

    All six ML features are computed server-side:
    - total_clicks
    - days_active
    - max_daily_clicks
    - mean_daily_clicks
    - early_clicks
    - num_assessments
    """

    @classmethod
    async def generate_engagement_features(
        cls,
        student_id: str,
        course_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate all engagement features for a student using MongoDB aggregation.

        When ``course_id`` is provided the query is scoped to that course.
        When omitted, all activity logs for the student are aggregated.

        Parameters
        ----------
        student_id : str
            Target student identifier.
        course_id : str, optional
            Course identifier to filter activity logs. If *None*, engagement
            features are computed across all courses for the student.

        Returns
        -------
        dict
            Feature dictionary with keys:
            - total_clicks: int
            - days_active: int
            - max_daily_clicks: int
            - mean_daily_clicks: float
            - early_clicks: int
            - num_assessments: int
            - code_module: str | None
            - code_presentation: str | None

        Example
        -------
        >>> features = await EngagementFeatureService.generate_engagement_features(
        ...     student_id="student_123",
        ...     course_id="ml-fundamentals"
        ... )
        >>> print(features)
        {
            'total_clicks': 450,
            'days_active': 24,
            'max_daily_clicks': 63,
            'mean_daily_clicks': 18.75,
            'early_clicks': 120,
            'num_assessments': 5,
            'code_module': 'DDD',
            'code_presentation': '2014J'
        }
        """
        # Match by student_id; optionally narrow to a specific course
        match_stage: Dict[str, Any] = {"student_id": student_id}
        if course_id:
            match_stage["course_id"] = course_id

        # Resolve OULAD code_module / code_presentation from course_id
        resolved_module: str | None = None
        resolved_presentation: str | None = None
        try:
            mapping = CourseMappingService.map_course(course_id)
            resolved_module = mapping["code_module"]
            resolved_presentation = mapping["code_presentation"]
            logger.info(
                "Mapped course_id '%s' → %s / %s for engagement features",
                course_id, resolved_module, resolved_presentation
            )
        except CourseMappingError:
            logger.warning(
                "Could not resolve course_id=%s to OULAD module", course_id
            )

        # Get collection
        col = await get_activity_collection()

        # ──────────────────────────────────────────────────────────────────
        # 1. Compute total_clicks, num_assessments, and find first event time
        # ──────────────────────────────────────────────────────────────────

        click_types = [et.value for et in CLICK_EVENT_TYPES]
        assessment_types = [et.value for et in ASSESSMENT_EVENT_TYPES]

        basic_pipeline = [
            {"$match": match_stage},
            {
                "$facet": {
                    "clicks": [
                        {"$match": {"event_type": {"$in": click_types}}},
                        {"$count": "total"},
                    ],
                    "assessments": [
                        {"$match": {"event_type": {"$in": assessment_types}}},
                        {"$count": "total"},
                    ],
                    "first_event": [
                        {"$match": {"event_type": {"$in": click_types}}},
                        {"$sort": {"timestamp": 1}},
                        {"$limit": 1},
                        {"$project": {"timestamp": 1}},
                    ],
                }
            },
        ]

        cursor = col.aggregate(basic_pipeline)
        basic_results = await cursor.to_list(length=1)
        basic_data = basic_results[0] if basic_results else {}

        total_clicks = (
            basic_data.get("clicks", [{}])[0].get("total", 0)
            if basic_data.get("clicks")
            else 0
        )
        num_assessments = (
            basic_data.get("assessments", [{}])[0].get("total", 0)
            if basic_data.get("assessments")
            else 0
        )

        # Get first event timestamp for early_clicks calculation
        first_event_data = basic_data.get("first_event", [])
        first_event_time = None
        if first_event_data:
            ts = first_event_data[0].get("timestamp")
            if isinstance(ts, str):
                first_event_time = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            elif isinstance(ts, datetime):
                first_event_time = ts

        # ──────────────────────────────────────────────────────────────────
        # 2. Compute days_active (distinct days with click events)
        # ──────────────────────────────────────────────────────────────────

        days_active_pipeline = [
            {"$match": {**match_stage, "event_type": {"$in": click_types}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": "$timestamp"}}
                    }
                }
            },
            {"$count": "days"},
        ]

        cursor = col.aggregate(days_active_pipeline)
        days_result = await cursor.to_list(length=1)
        days_active = days_result[0].get("days", 0) if days_result else 0

        # ──────────────────────────────────────────────────────────────────
        # 3. Compute max_daily_clicks
        # ──────────────────────────────────────────────────────────────────

        max_daily_pipeline = [
            {"$match": {**match_stage, "event_type": {"$in": click_types}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": "$timestamp"}}
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 1},
        ]

        cursor = col.aggregate(max_daily_pipeline)
        max_result = await cursor.to_list(length=1)
        max_daily_clicks = max_result[0].get("count", 0) if max_result else 0

        # ──────────────────────────────────────────────────────────────────
        # 4. Compute early_clicks (first 14 days after first event)
        # ──────────────────────────────────────────────────────────────────

        early_clicks = 0
        if first_event_time:
            # Calculate cutoff time (14 days after first event)
            cutoff_time = first_event_time + timedelta(days=_EARLY_PERIOD_DAYS)

            # Convert to ISO format for query
            cutoff_iso = cutoff_time.isoformat()

            early_clicks_pipeline = [
                {
                    "$match": {
                        **match_stage,
                        "event_type": {"$in": click_types},
                        "timestamp": {"$lte": cutoff_iso},
                    }
                },
                {"$count": "total"},
            ]

            cursor = col.aggregate(early_clicks_pipeline)
            early_result = await cursor.to_list(length=1)
            early_clicks = early_result[0].get("total", 0) if early_result else 0

        # ──────────────────────────────────────────────────────────────────
        # 5. Compute mean_daily_clicks
        # ──────────────────────────────────────────────────────────────────

        mean_daily_clicks = (
            round(total_clicks / days_active, 1) if days_active > 0 else 0.0
        )

        # ──────────────────────────────────────────────────────────────────
        # 6. Assemble result
        # ──────────────────────────────────────────────────────────────────

        features = {
            "student_id": student_id,
            "code_module": resolved_module,
            "code_presentation": resolved_presentation,
            "total_clicks": total_clicks,
            "days_active": days_active,
            "max_daily_clicks": max_daily_clicks,
            "mean_daily_clicks": mean_daily_clicks,
            "early_clicks": early_clicks,
            "num_assessments": num_assessments,
        }

        if not any(
            [
                features["total_clicks"],
                features["days_active"],
                features["num_assessments"],
            ]
        ):
            logger.warning(
                "No activity logs found for student_id=%s (course_id=%s)",
                student_id,
                course_id or "<all>",
            )

        return features

    @classmethod
    async def generate_engagement_features_as_model(
        cls,
        student_id: str,
        course_id: Optional[str] = None,
    ) -> EngagementFeatures:
        """
        Generate engagement features and return as EngagementFeatures model.

        This is a convenience wrapper around :meth:`generate_engagement_features`
        that returns a Pydantic model instance instead of a dict.

        Parameters
        ----------
        student_id : str
            Target student identifier.
        course_id : str, optional
            Course identifier to filter activity logs. If *None*, aggregates
            across all courses.

        Returns
        -------
        EngagementFeatures
            Pydantic model instance with all computed features.
        """
        features = await cls.generate_engagement_features(student_id, course_id)
        return EngagementFeatures(**features)
