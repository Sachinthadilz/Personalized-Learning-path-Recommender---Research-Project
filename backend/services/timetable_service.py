"""
Timetable Planner Service
Handles ML predictions and timetable generation.
Storage is handled by the Node.js auth backend (MongoDB via Mongoose).
"""

from __future__ import annotations

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Lazy imports so the backend still starts if ML deps are missing ──────────
try:
    import joblib
    _joblib_ok = True
except ImportError:
    _joblib_ok = False
    logger.warning("joblib not installed – timetable ML predictions will be unavailable")

# ── Hard Constraint Layer (inline, no extra file needed) ─────────────────────

class HardConstraintLayer:
    """Mirrors the training constraint layer so predictions are consistent."""

    def __init__(self, min_allocation_threshold: float = 0.25):
        self.min_allocation_threshold = min_allocation_threshold

    def apply(self, predictions: np.ndarray, daily_capacity: np.ndarray) -> np.ndarray:
        predictions = np.maximum(predictions, 0)
        predictions[predictions < self.min_allocation_threshold] = 0
        totals = predictions.sum(axis=1, keepdims=True)
        mask = totals > 0
        scale = np.where(mask, daily_capacity.reshape(-1, 1) / np.where(mask, totals, 1), 0)
        predictions = predictions * np.minimum(scale, 1.0)
        return predictions


# ── Singleton service ─────────────────────────────────────────────────────────

class TimetableService:
    """All timetable business logic lives here."""

    _instance: Optional["TimetableService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._model = None
        self._scaler = None
        self._day_encoder = None
        self._constraint_layer = HardConstraintLayer(min_allocation_threshold=0.25)
        self._load_ml_model()

    # ── Initialization ────────────────────────────────────────────────────────

    def _load_dependencies(self):
        self._load_ml_model()

    def _load_ml_model(self):
        if not _joblib_ok:
            return
        try:
            from config import settings
            base = os.path.dirname(os.path.dirname(__file__))  # backend/
            model_path   = os.path.join(base, settings.TIMETABLE_MODEL_PATH)
            scaler_path  = os.path.join(base, settings.TIMETABLE_SCALER_PATH)
            encoder_path = os.path.join(base, settings.TIMETABLE_ENCODER_PATH)

            if all(os.path.exists(p) for p in [model_path, scaler_path, encoder_path]):
                self._model       = joblib.load(model_path)
                self._scaler      = joblib.load(scaler_path)
                self._day_encoder = joblib.load(encoder_path)
                logger.info("✅ Timetable: ML model loaded")
            else:
                logger.warning("⚠️  Timetable: model .pkl files not found – using rule-based fallback")
        except Exception as e:
            logger.error(f"❌ Timetable: model load failed – {e}")

    # ── Public properties ─────────────────────────────────────────────────────

    @property
    def model_ready(self) -> bool:
        return self._model is not None

    # ── Prediction ────────────────────────────────────────────────────────────

    def _predict_allocation(
        self,
        day_of_week: str,
        hours_available: float,
        days_until_end: int,
        subjects: List[dict],
    ) -> Dict[str, float]:
        """Return {subject_id: hours} using ML model or equal-split fallback."""

        if self.model_ready:
            return self._ml_predict(day_of_week, hours_available, days_until_end, subjects)
        return self._fallback_predict(hours_available, subjects)

    def _ml_predict(self, day_of_week, hours_available, days_until_end, subjects) -> Dict[str, float]:
        try:
            import warnings
            day_enc = int(self._day_encoder.transform([day_of_week])[0])
            features = [day_enc, hours_available, days_until_end]
            for s in subjects:
                features += [s["credits"], s["remaining_needed"]]
            X = np.array(features).reshape(1, -1)

            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", message="X does not have valid feature names")
                X_scaled = self._scaler.transform(X)
            raw = self._model.predict(X_scaled)
            preds = raw[0] if raw.ndim > 1 else raw.flatten()
            constrained = self._constraint_layer.apply(
                preds.reshape(1, -1), np.array([hours_available])
            )[0]
            allocation: Dict[str, float] = {}
            for i, s in enumerate(subjects):
                hrs = float(constrained[i]) if i < len(constrained) else 0.0
                if s["remaining_needed"] <= 0:
                    hrs = 0.0
                hrs = min(hrs, s["remaining_needed"])
                hrs = round(hrs * 2) / 2  # round to 0.5
                allocation[s["subject_id"]] = hrs
            return allocation
        except Exception as e:
            logger.error(f"ML prediction failed, using fallback: {e}")
            return self._fallback_predict(hours_available, subjects)

    def _fallback_predict(self, hours_available: float, subjects: List[dict]) -> Dict[str, float]:
        """Equally distribute available hours proportional to remaining hours."""
        total_remaining = sum(s["remaining_needed"] for s in subjects)
        allocation: Dict[str, float] = {}
        if total_remaining == 0:
            for s in subjects:
                allocation[s["subject_id"]] = 0.0
            return allocation
        for s in subjects:
            proportion = s["remaining_needed"] / total_remaining
            hrs = round(proportion * hours_available * 2) / 2
            hrs = min(hrs, s["remaining_needed"])
            allocation[s["subject_id"]] = hrs
        return allocation

    # ── Generate timetable ────────────────────────────────────────────────────

    def generate_timetable(self, data: dict) -> dict:
        """
        Generate a full timetable and return it as data.
        No DB write — saving is handled by the Node.js auth backend.
        """
        student_id = data["student_id"]
        start_date = datetime.fromisoformat(data["start_date"])
        end_date   = datetime.fromisoformat(data["end_date"])
        subjects   = [dict(s) for s in data["subjects"]]  # shallow copy
        hours_per_day: Dict[str, float] = data.get("hours_per_day", {})

        days = []
        current = start_date
        while current <= end_date:
            date_str    = current.strftime("%Y-%m-%d")
            dow         = current.strftime("%A")
            hours_avail = float(hours_per_day.get(dow, 4.0))
            days_left   = (end_date - current).days

            allocation = self._predict_allocation(dow, hours_avail, days_left, subjects)

            daily_allocs = []
            for s in subjects:
                sid = s["subject_id"]
                hrs = allocation.get(sid, 0.0)
                if hrs > 0:
                    daily_allocs.append({
                        "subject_id":      sid,
                        "subject_name":    s.get("name", sid),
                        "planned_hours":   hrs,
                        "completed_hours": 0.0,
                        "status":          "planned",
                    })
                    s["remaining_needed"] = max(0, s["remaining_needed"] - hrs)

            days.append({
                "date":                  date_str,
                "day_of_week":           dow,
                "total_hours_available": hours_avail,
                "allocations":           daily_allocs,
                "total_planned":         sum(a["planned_hours"] for a in daily_allocs),
                "total_completed":       0.0,
                "is_locked":             False,
            })
            current += timedelta(days=1)

        return {
            "success":    True,
            "student_id": student_id,
            "name":       data.get("name", "Student"),
            "start_date": data["start_date"],
            "end_date":   data["end_date"],
            "subjects":   data["subjects"],
            "days":       days,
        }


timetable_service = TimetableService()
