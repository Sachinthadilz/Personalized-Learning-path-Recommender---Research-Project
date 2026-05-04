"""
Student Data Service
====================

Loads student background data from OULAD CSV files:
- Demographics from ``studentInfo.csv``
- Assessment scores from ``studentAssessment.csv``
- Registration info from ``studentRegistration.csv``

Provides a unified interface to build the 19-feature input for the
learner profile ML pipeline.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional

import pandas as pd

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "oulad"

STUDENT_INFO_PATH = DATA_DIR / "studentInfo.csv"
STUDENT_ASSESSMENT_PATH = DATA_DIR / "studentAssessment.csv"
STUDENT_REGISTRATION_PATH = DATA_DIR / "studentRegistration.csv"

# Singleton dataframe cache
_student_info: Optional[pd.DataFrame] = None
_student_assessment: Optional[pd.DataFrame] = None
_student_registration: Optional[pd.DataFrame] = None


# ---------------------------------------------------------------------------
# CSV loaders
# ---------------------------------------------------------------------------


def _load_student_info() -> pd.DataFrame:
    """Load studentInfo.csv once and cache."""
    global _student_info
    if _student_info is None:
        _student_info = pd.read_csv(STUDENT_INFO_PATH)
        logger.info("Loaded %d records from studentInfo.csv", len(_student_info))
    return _student_info


def _load_student_assessment() -> pd.DataFrame:
    """Load studentAssessment.csv once and cache."""
    global _student_assessment
    if _student_assessment is None:
        _student_assessment = pd.read_csv(STUDENT_ASSESSMENT_PATH)
        logger.info(
            "Loaded %d records from studentAssessment.csv", len(_student_assessment)
        )
    return _student_assessment


def _load_student_registration() -> pd.DataFrame:
    """Load studentRegistration.csv once and cache."""
    global _student_registration
    if _student_registration is None:
        _student_registration = pd.read_csv(STUDENT_REGISTRATION_PATH)
        logger.info(
            "Loaded %d records from studentRegistration.csv",
            len(_student_registration),
        )
    return _student_registration


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------


class StudentDataService:
    """
    Stateless service to fetch student background data from OULAD CSV files.

    All methods are class-level for convenient use throughout the application.
    """

    @classmethod
    def get_student_demographics(
        cls,
        student_id: str,
        code_module: Optional[str] = None,
        code_presentation: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetch demographic and background fields for a student from
        ``studentInfo.csv``.

        Parameters
        ----------
        student_id : str
            The OULAD ``id_student`` to look up.
        code_module : str, optional
            Restrict to a specific module.
        code_presentation : str, optional
            Restrict to a specific presentation.

        Returns
        -------
        dict
            Contains keys: ``gender``, ``region``, ``highest_education``,
            ``imd_band``, ``age_band``, ``num_of_prev_attempts``,
            ``studied_credits``, ``disability``, ``code_module``,
            ``code_presentation``.

        Raises
        ------
        ValueError
            If no matching student record is found.
        """
        df = _load_student_info()

        # OULAD uses integer student IDs; auth-system users have MongoDB ObjectId
        # strings. When the ID is not a valid integer, skip the OULAD lookup.
        try:
            oulad_id = int(student_id)
        except (ValueError, TypeError):
            logger.debug(
                "student_id '%s' is not an OULAD integer ID (using default demographics)",
                student_id,
            )
            return {
                "gender": "M",
                "region": "London Region",
                "highest_education": "A Level or Equivalent",
                "imd_band": "50-60%",
                "age_band": "0-35",
                "num_of_prev_attempts": 0,
                "studied_credits": 60,
                "disability": "N",
                "code_module": "FFF",
                "code_presentation": "2014J",
            }

        # Build query
        mask = df["id_student"] == oulad_id
        if code_module:
            mask &= df["code_module"] == code_module
        if code_presentation:
            mask &= df["code_presentation"] == code_presentation

        matches = df[mask]

        if matches.empty:
            raise ValueError(
                f"No demographic data found for student_id={student_id} "
                f"(module={code_module}, presentation={code_presentation})"
            )

        # If multiple matches (student registered in multiple modules),
        # take the first one or the most recent presentation
        row = matches.iloc[0]

        return {
            "gender": row["gender"],
            "region": row["region"],
            "highest_education": row["highest_education"],
            "imd_band": row["imd_band"],
            "age_band": row["age_band"],
            "num_of_prev_attempts": int(row["num_of_prev_attempts"]),
            "studied_credits": int(row["studied_credits"]),
            "disability": row["disability"],
            "code_module": row["code_module"],
            "code_presentation": row["code_presentation"],
        }

    @classmethod
    def get_assessment_metrics(
        cls,
        student_id: str,
        code_module: Optional[str] = None,
        code_presentation: Optional[str] = None,
    ) -> Dict[str, float]:
        """
        Compute mean assessment score for a student from
        ``studentAssessment.csv``.

        Parameters
        ----------
        student_id : str
            The OULAD ``id_student`` to aggregate for.
        code_module : str, optional
            Filter by specific module (requires joining with assessments.csv).
        code_presentation : str, optional
            Filter by specific presentation.

        Returns
        -------
        dict
            Contains ``mean_score`` (0–100 scale).
            If no assessments exist, returns ``mean_score: 0.0``.
        """
        df = _load_student_assessment()

        # Filter by student (guard non-integer IDs for auth-system users)
        try:
            oulad_id = int(student_id)
        except (ValueError, TypeError):
            return {"mean_score": 0.0}

        mask = df["id_student"] == oulad_id
        student_assessments = df[mask]

        if student_assessments.empty:
            logger.warning(
                "No assessment records found for student_id=%s", student_id
            )
            return {"mean_score": 0.0}

        # Convert score to numeric, handling '?' values
        scores = pd.to_numeric(student_assessments["score"], errors="coerce")
        
        # Drop NaN values (from '?' or invalid entries)
        scores = scores.dropna()
        
        if scores.empty:
            logger.warning(
                "No valid assessment scores found for student_id=%s", student_id
            )
            return {"mean_score": 0.0}

        # Compute mean score (scores are already 0–100 in OULAD)
        mean_score = scores.mean()

        return {"mean_score": round(float(mean_score), 1)}

    @classmethod
    def get_registration_info(
        cls,
        student_id: str,
        code_module: Optional[str] = None,
        code_presentation: Optional[str] = None,
    ) -> Dict[str, int]:
        """
        Fetch registration timing data from ``studentRegistration.csv``.

        Parameters
        ----------
        student_id : str
            The OULAD ``id_student`` to look up.
        code_module : str, optional
            Restrict to a specific module.
        code_presentation : str, optional
            Restrict to a specific presentation.

        Returns
        -------
        dict
            Contains:
            - ``first_reg_before_start`` : days between registration and
              module start (negative = registered before start)
            - ``ever_unregistered`` : 1 if student ever unregistered, else 0
        """
        df = _load_student_registration()

        # Guard non-integer IDs for auth-system users
        try:
            oulad_id = int(student_id)
        except (ValueError, TypeError):
            return {"first_reg_before_start": 0, "ever_unregistered": 0}

        # Build query
        mask = df["id_student"] == oulad_id
        if code_module:
            mask &= df["code_module"] == code_module
        if code_presentation:
            mask &= df["code_presentation"] == code_presentation

        matches = df[mask]

        if matches.empty:
            logger.warning(
                "No registration data found for student_id=%s", student_id
            )
            # Return defaults
            return {"first_reg_before_start": 0, "ever_unregistered": 0}

        # Take the earliest registration record
        row = matches.iloc[0]

        # date_registration is already days relative to module start
        # negative = registered before start
        first_reg = int(row["date_registration"])

        # Check if ever unregistered (date_unregistration != "?")
        ever_unregistered = 0 if row["date_unregistration"] == "?" else 1

        return {
            "first_reg_before_start": first_reg,
            "ever_unregistered": ever_unregistered,
        }

    @classmethod
    def build_student_features(
        cls,
        student_id: str,
        code_module: Optional[str] = None,
        code_presentation: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Build a complete feature dictionary for a student by combining:
        - Demographics from ``studentInfo.csv``
        - Assessment metrics from ``studentAssessment.csv``
        - Registration info from ``studentRegistration.csv``

        This returns the static/background features. Engagement features
        (clicks, days active, etc.) must be fetched separately from the
        activity log service.

        Parameters
        ----------
        student_id : str
            The OULAD ``id_student``.
        code_module : str, optional
            Module code filter.
        code_presentation : str, optional
            Presentation code filter.

        Returns
        -------
        dict
            Contains 11 fields: demographics (8) + assessment (1) +
            registration (2).

        Raises
        ------
        ValueError
            If the student does not exist in the dataset.
        """
        demographics = cls.get_student_demographics(
            student_id, code_module, code_presentation
        )
        assessment_metrics = cls.get_assessment_metrics(
            student_id, code_module, code_presentation
        )
        registration_info = cls.get_registration_info(
            student_id, code_module, code_presentation
        )

        # Merge all
        features = {**demographics, **assessment_metrics, **registration_info}

        logger.debug(
            "Built student features for student_id=%s (module=%s, presentation=%s)",
            student_id,
            features.get("code_module"),
            features.get("code_presentation"),
        )

        return features
