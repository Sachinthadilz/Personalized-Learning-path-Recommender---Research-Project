"""
Activity Log Routes
===================

FastAPI ``APIRouter`` that exposes the Student Activity Log endpoints.
Include this router in ``main.py`` with::

    from activity_log_routes import activity_log_router
    app.include_router(activity_log_router)
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from activity_log_model import (
    ActivityLogEntry,
    ActivityLogResponse,
    EngagementFeatures,
    EventType,
)
from services.activity_log_service import ActivityLogService

logger = logging.getLogger(__name__)

activity_log_router = APIRouter(
    prefix="/activity",
    tags=["Activity Logs"],
)


# ---------------------------------------------------------------------------
# POST /activity/log-event
# ---------------------------------------------------------------------------

@activity_log_router.post(
    "/log-event",
    response_model=ActivityLogResponse,
    status_code=201,
    summary="Record a student activity event",
    description=(
        "Store a single behavioural event emitted by a student interacting "
        "with learning content.  Returns the stored record including the "
        "server-generated ``log_id``."
    ),
)
async def log_event(entry: ActivityLogEntry) -> ActivityLogResponse:
    """
    Record a student activity event.

    **Example events:** ``click``, ``video_play``, ``assessment_submit``.

    - ``timestamp`` defaults to *now (UTC)* if omitted.
    - ``metadata`` accepts any JSON-serialisable key/value pairs.
    """
    try:
        return await ActivityLogService.log_event(entry)
    except Exception as exc:
        logger.error("Failed to log event: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# GET /activity/logs/{student_id}
# ---------------------------------------------------------------------------

@activity_log_router.get(
    "/logs/{student_id}",
    response_model=List[Dict[str, Any]],
    summary="Retrieve activity logs for a student",
    description=(
        "Return stored activity log records for the given student, ordered "
        "most-recent first.  Supports optional filtering by course, event "
        "type, and start date."
    ),
)
async def get_student_logs(
    student_id: str,
    course_id: Optional[str]   = Query(None, description="Filter by course / module ID"),
    event_type: Optional[EventType] = Query(None, description="Filter by event type"),
    since: Optional[datetime]  = Query(None, description="Return events at or after this UTC datetime"),
    limit: int                 = Query(200, ge=1, le=1000, description="Max records to return"),
) -> List[Dict[str, Any]]:
    """
    Fetch activity logs for a student with optional filters.

    Returns an empty list (not 404) when no logs exist for the student.
    """
    return await ActivityLogService.get_student_logs(
        student_id=student_id,
        course_id=course_id,
        event_type=event_type,
        since=since,
        limit=limit,
    )


# ---------------------------------------------------------------------------
# GET /activity/engagement-features/{student_id}
# ---------------------------------------------------------------------------

@activity_log_router.get(
    "/engagement-features/{student_id}",
    response_model=EngagementFeatures,
    summary="Compute engagement features for a student",
    description=(
        "Aggregate activity logs into the numerical engagement features used "
        "by the learner profile ML pipeline: ``total_clicks``, "
        "``days_active``, ``max_daily_clicks``, ``mean_daily_clicks``, "
        "``early_clicks``, and ``num_assessments``."
    ),
)
async def get_engagement_features(
    student_id: str,
    course_id: Optional[str] = Query(
        None,
        description=(
            "Restrict aggregation to a single course.  "
            "Omit to aggregate across all courses."
        ),
    ),
) -> EngagementFeatures:
    """
    Return computed engagement features for a student.

    Features are derived entirely from the student's activity log and map
    directly onto the numerical columns expected by
    ``POST /predict-learner-profile``.
    """
    return await ActivityLogService.generate_engagement_features(
        student_id=student_id,
        course_id=course_id,
    )


# ---------------------------------------------------------------------------
# DELETE /activity/logs/{student_id}  (data-erasure / testing)
# ---------------------------------------------------------------------------

@activity_log_router.delete(
    "/logs/{student_id}",
    summary="Delete all activity logs for a student",
    description=(
        "Permanently remove all stored activity log records for the given "
        "student.  Intended for testing or GDPR data-erasure requests."
    ),
)
async def delete_student_logs(student_id: str) -> Dict[str, Any]:
    """Delete all logs for a student and return the count of removed records."""
    removed = await ActivityLogService.delete_student_logs(student_id)
    return {"student_id": student_id, "deleted_count": removed}
