"""
Learner Profile Prediction Service

Runs a three-stage ML pipeline:
  1. Learner profile classification   (profile_classifier.joblib)
  2. Academic outcome prediction       (best_model_pipeline.joblib →
                                        GradientBoosting_pipeline.joblib fallback)
  3. Early-warning / at-risk detection (early_warning_pipeline.joblib →
                                        rule-based fallback)

Models are loaded once at module import time (singleton pattern).
"""

from __future__ import annotations

import json
import logging
import warnings
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"

FEATURE_NAMES: list[str] = [
    "gender",
    "region",
    "highest_education",
    "imd_band",
    "age_band",
    "disability",
    "code_module",
    "code_presentation",
    "total_clicks",
    "days_active",
    "max_daily_clicks",
    "mean_daily_clicks",
    "early_clicks",
    "mean_score",
    "num_assessments",
    "first_reg_before_start",
    "ever_unregistered",
    "num_of_prev_attempts",
    "studied_credits",
]

# Engagement thresholds used by the rule-based early-warning fallback.
# Derived from OULAD domain knowledge.
_RISK_THRESHOLDS = {
    "total_clicks": 500,
    "days_active": 15,
    "mean_score": 40.0,
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _load_model(path: Path, label: str) -> Any | None:
    """Load a joblib model, suppressing sklearn version warnings."""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = joblib.load(path)
        logger.info("Loaded %s from %s", label, path.name)
        return model
    except Exception as exc:
        logger.warning("Could not load %s (%s): %s", label, path.name, exc)
        return None


def _rule_based_early_warning(features: dict) -> tuple[str, float]:
    """
    Fallback early-warning logic when the ML model cannot be loaded.

    Returns (risk_label, risk_score) where risk_score ∈ [0, 1].
    """
    risk_points = 0
    total_points = len(_RISK_THRESHOLDS)

    if features.get("total_clicks", 0) < _RISK_THRESHOLDS["total_clicks"]:
        risk_points += 1
    if features.get("days_active", 0) < _RISK_THRESHOLDS["days_active"]:
        risk_points += 1
    if features.get("mean_score", 100.0) < _RISK_THRESHOLDS["mean_score"]:
        risk_points += 1

    risk_score = round(risk_points / total_points, 4)
    risk_label = "At-Risk" if risk_score >= 0.5 else "Not At-Risk"
    return risk_label, risk_score


# ---------------------------------------------------------------------------
# Singleton model registry (loaded once at import)
# ---------------------------------------------------------------------------

class _ModelRegistry:
    """Holds all loaded ML artefacts as class-level attributes."""

    profile_classifier: Any = None
    outcome_model: Any = None
    early_warning_model: Any = None
    learning_path_map: dict = {}

    _initialised: bool = False

    @classmethod
    def initialise(cls) -> None:
        if cls._initialised:
            return

        # 1. Learner profile classifier (pure sklearn – always loadable)
        cls.profile_classifier = _load_model(
            ARTIFACTS_DIR / "profile_classifier.joblib",
            "profile_classifier",
        )

        # 2. Outcome prediction – prefer best_model, fall back to GradientBoosting
        cls.outcome_model = _load_model(
            ARTIFACTS_DIR / "best_model_pipeline.joblib",
            "best_model_pipeline",
        )
        if cls.outcome_model is None:
            logger.info(
                "Falling back to GradientBoosting_pipeline for outcome prediction."
            )
            cls.outcome_model = _load_model(
                ARTIFACTS_DIR / "GradientBoosting_pipeline.joblib",
                "GradientBoosting_pipeline (fallback)",
            )

        # 3. Early-warning model (may require xgboost; fallback handled at predict time)
        cls.early_warning_model = _load_model(
            ARTIFACTS_DIR / "early_warning_pipeline.joblib",
            "early_warning_pipeline",
        )

        # 4. Learning path recommendation map
        lpr_path = ARTIFACTS_DIR / "learning_path_recommendations.json"
        try:
            with lpr_path.open() as fh:
                cls.learning_path_map = json.load(fh)
            logger.info("Loaded learning_path_recommendations.json")
        except Exception as exc:
            logger.warning("Could not load learning_path_recommendations.json: %s", exc)

        cls._initialised = True


# Trigger loading at import time so the first request has no startup latency.
_ModelRegistry.initialise()


# ---------------------------------------------------------------------------
# Public prediction result type
# ---------------------------------------------------------------------------


class LearnerProfilePrediction:
    """Plain data container returned by the service."""

    __slots__ = (
        "learner_profile",
        "profile_confidence",
        "predicted_outcome",
        "outcome_confidence",
        "risk_prediction",
        "risk_score",
        "learning_path_recommendation",
    )

    def __init__(
        self,
        learner_profile: str,
        profile_confidence: float,
        predicted_outcome: str,
        outcome_confidence: float,
        risk_prediction: str,
        risk_score: float,
        learning_path_recommendation: dict,
    ) -> None:
        self.learner_profile = learner_profile
        self.profile_confidence = profile_confidence
        self.predicted_outcome = predicted_outcome
        self.outcome_confidence = outcome_confidence
        self.risk_prediction = risk_prediction
        self.risk_score = risk_score
        self.learning_path_recommendation = learning_path_recommendation

    def to_dict(self) -> dict:
        return {
            "learner_profile": self.learner_profile,
            "profile_confidence": self.profile_confidence,
            "predicted_outcome": self.predicted_outcome,
            "outcome_confidence": self.outcome_confidence,
            "risk_prediction": self.risk_prediction,
            "risk_score": self.risk_score,
            "learning_path_recommendation": self.learning_path_recommendation,
        }


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class LearnerProfileService:
    """
    Stateless service class that exposes a single ``predict`` class-method.

    Usage::

        result = LearnerProfileService.predict(features_dict)
    """

    @classmethod
    def predict(cls, features: dict) -> LearnerProfilePrediction:
        """
        Run the full three-stage prediction pipeline.

        Parameters
        ----------
        features:
            A dictionary with exactly the 19 OULAD feature keys.

        Returns
        -------
        LearnerProfilePrediction
        """
        # Build a single-row DataFrame using the canonical column order so that
        # the pipeline preprocessors receive columns in the expected order.
        df = pd.DataFrame([features], columns=FEATURE_NAMES)

        # ------------------------------------------------------------------
        # Stage 1 – Learner profile classification
        # ------------------------------------------------------------------
        learner_profile, profile_confidence = cls._predict_profile(df)

        # ------------------------------------------------------------------
        # Stage 2 – Outcome prediction
        # ------------------------------------------------------------------
        predicted_outcome, outcome_confidence = cls._predict_outcome(df)

        # ------------------------------------------------------------------
        # Stage 3 – Early warning / at-risk detection
        # ------------------------------------------------------------------
        risk_prediction, risk_score = cls._predict_risk(df, features)

        # ------------------------------------------------------------------
        # Enrich with learning path recommendation from JSON map
        # ------------------------------------------------------------------
        learning_path_recommendation = _ModelRegistry.learning_path_map.get(
            predicted_outcome, {}
        )

        return LearnerProfilePrediction(
            learner_profile=learner_profile,
            profile_confidence=profile_confidence,
            predicted_outcome=predicted_outcome,
            outcome_confidence=outcome_confidence,
            risk_prediction=risk_prediction,
            risk_score=risk_score,
            learning_path_recommendation=learning_path_recommendation,
        )

    # ------------------------------------------------------------------
    # Private stage-runners
    # ------------------------------------------------------------------

    @staticmethod
    def _predict_profile(df: pd.DataFrame) -> tuple[str, float]:
        model = _ModelRegistry.profile_classifier
        if model is None:
            return "Unknown", 0.0

        prediction: str = model.predict(df)[0]
        probabilities: np.ndarray = model.predict_proba(df)[0]
        confidence = float(round(float(np.max(probabilities)), 4))
        return prediction, confidence

    @staticmethod
    def _predict_outcome(df: pd.DataFrame) -> tuple[str, float]:
        model = _ModelRegistry.outcome_model
        if model is None:
            return "Unknown", 0.0

        prediction: str = model.predict(df)[0]
        probabilities: np.ndarray = model.predict_proba(df)[0]
        confidence = float(round(float(np.max(probabilities)), 4))
        return prediction, confidence

    @staticmethod
    def _predict_risk(
        df: pd.DataFrame, features: dict
    ) -> tuple[str, float]:
        model = _ModelRegistry.early_warning_model
        if model is not None:
            try:
                prediction: str = model.predict(df)[0]
                probabilities: np.ndarray = model.predict_proba(df)[0]
                risk_score = float(round(float(np.max(probabilities)), 4))
                return prediction, risk_score
            except Exception as exc:
                logger.warning(
                    "early_warning_pipeline inference failed, using rule-based fallback: %s",
                    exc,
                )

        # Rule-based fallback
        return _rule_based_early_warning(features)
