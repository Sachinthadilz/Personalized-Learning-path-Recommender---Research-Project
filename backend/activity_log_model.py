"""
Pydantic models for the Student Activity Log System.

An activity log captures a single behavioural event emitted when a student
interacts with learning content (VLE clicks, video plays, assessment
submissions, etc.).  The schema is intentionally flexible so that the
``metadata`` field can carry event-specific payload without requiring schema
changes for every new event type.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Event type vocabulary
# ---------------------------------------------------------------------------

class EventType(str, Enum):
    """
    Supported student activity event types.

    Events beginning with ``assessment_`` count as assessment interactions.
    All events except non-interactive ones (login/logout) increment click
    counters used by the ML engagement features.
    """
    CLICK              = "click"
    VIDEO_PLAY         = "video_play"
    VIDEO_PAUSE        = "video_pause"
    VIDEO_COMPLETE     = "video_complete"
    RESOURCE_DOWNLOAD  = "resource_download"
    RESOURCE_VIEW      = "resource_view"
    FORUM_POST         = "forum_post"
    FORUM_VIEW         = "forum_view"
    ASSESSMENT_START   = "assessment_start"
    ASSESSMENT_SUBMIT  = "assessment_submit"
    QUIZ_ATTEMPT       = "quiz_attempt"
    LOGIN              = "login"
    LOGOUT             = "logout"


# Events that count as a VLE "click" for engagement feature calculation.
# login/logout are excluded as they are not direct content interactions.
CLICK_EVENT_TYPES: frozenset[EventType] = frozenset({
    EventType.CLICK,
    EventType.VIDEO_PLAY,
    EventType.VIDEO_PAUSE,
    EventType.VIDEO_COMPLETE,
    EventType.RESOURCE_DOWNLOAD,
    EventType.RESOURCE_VIEW,
    EventType.FORUM_POST,
    EventType.FORUM_VIEW,
    EventType.ASSESSMENT_START,
    EventType.ASSESSMENT_SUBMIT,
    EventType.QUIZ_ATTEMPT,
})

# Events that count toward the `num_assessments` feature.
ASSESSMENT_EVENT_TYPES: frozenset[EventType] = frozenset({
    EventType.ASSESSMENT_SUBMIT,
    EventType.QUIZ_ATTEMPT,
})


# ---------------------------------------------------------------------------
# Request / storage models
# ---------------------------------------------------------------------------

class ActivityLogEntry(BaseModel):
    """
    Payload for a single student activity event.

    Fields
    ------
    student_id  : Unique identifier for the student (string / UUID).
    course_id   : Identifier of the course or module the event belongs to.
    event_type  : One of the :class:`EventType` values.
    timestamp   : UTC datetime of the event.  Defaults to *now* if omitted.
    duration    : Optional event duration in **seconds** (e.g. video watch
                  time, time-on-task for an assessment).
    metadata    : Arbitrary event-specific payload (resource name, score,
                  page URL, etc.).  Must be JSON-serialisable.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "student_id": "stu_001",
                "course_id":  "DDD_2014J",
                "event_type": "click",
                "timestamp":  "2026-03-07T09:15:00Z",
                "duration":   None,
                "metadata":   {"resource": "lecture_notes_week3.pdf"},
            }
        }
    )

    student_id : str       = Field(..., description="Unique student identifier")
    course_id  : str       = Field(..., description="Module / course identifier")
    event_type : EventType = Field(..., description="Type of activity event")
    timestamp  : datetime  = Field(
        default_factory=datetime.utcnow,
        description="UTC datetime of the event",
    )
    duration   : Optional[float] = Field(
        None,
        ge=0,
        description="Event duration in seconds (optional)",
    )
    metadata   : Dict[str, Any] = Field(
        default_factory=dict,
        description="Arbitrary event-specific key/value payload",
    )


class ActivityLogResponse(BaseModel):
    """
    Stored activity log entry returned after a successful ``POST /log-event``.

    Adds a server-generated ``log_id`` to the original payload.
    """

    log_id     : str       = Field(..., description="Unique server-generated log ID")
    student_id : str
    course_id  : str
    event_type : EventType
    timestamp  : datetime
    duration   : Optional[float]
    metadata   : Dict[str, Any]

    @classmethod
    def from_entry(cls, entry: ActivityLogEntry) -> "ActivityLogResponse":
        """Create a stored record from an incoming entry, attaching a UUID."""
        return cls(
            log_id=str(uuid4()),
            **entry.model_dump(),
        )


# ---------------------------------------------------------------------------
# Engagement feature output model
# ---------------------------------------------------------------------------

class EngagementFeatures(BaseModel):
    """
    Aggregated VLE engagement features for a single student.

    These match the numerical engagement columns expected by the ML pipeline
    in :mod:`backend.services.learner_profile_service`.

    Fields
    ------
    student_id          : The student these features belong to.
    total_clicks        : Total content-interaction events across all courses.
    days_active         : Number of distinct calendar days with at least one
                          click event.
    max_daily_clicks    : Highest single-day click count.
    mean_daily_clicks   : Mean click count per active day.
    early_clicks        : Clicks recorded within the first 14 days of the
                          student's earliest logged event (per course).
    num_assessments     : Total assessment / quiz submission events.
    log_count           : Total raw events in the log (informational).
    """

    student_id        : str
    code_module       : Optional[str] = Field(None, description="OULAD module code resolved from course_id")
    code_presentation : Optional[str] = Field(None, description="OULAD presentation code resolved from course_id")
    total_clicks      : int   = 0
    days_active       : int   = 0
    max_daily_clicks  : int   = 0
    mean_daily_clicks : float = 0.0
    early_clicks      : int   = 0
    num_assessments   : int   = 0
    log_count         : int   = 0
