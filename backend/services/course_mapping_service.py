"""
Course Mapping Service
======================

Maps ``course_id`` values coming from browser-extension activity logs into
the ``code_module`` and ``code_presentation`` fields required by the OULAD
ML pipeline.

The mapping is defined in ``backend/data/course_mapping.json``.  If a
``course_id`` is not found the service returns the ``_default`` entry (or
raises :class:`CourseMappingError` when no default exists).

Usage::

    from services.course_mapping_service import CourseMappingService

    mapping = CourseMappingService.map_course(course_id)
    # {"code_module": "DDD", "code_presentation": "2014J"}
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Dict

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_MAPPING_FILE = _DATA_DIR / "course_mapping.json"


class CourseMappingError(Exception):
    """Raised when a course_id cannot be resolved and no default exists."""


class CourseMappingService:
    """Singleton loader + lookup for the course → OULAD module mapping."""

    _mapping: Dict[str, Dict[str, str]] = {}
    _loaded: bool = False

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @classmethod
    def _load(cls) -> None:
        """Load the JSON mapping file once."""
        if cls._loaded:
            return
        try:
            with _MAPPING_FILE.open(encoding="utf-8") as fh:
                raw: dict = json.load(fh)
            # Strip comment keys
            cls._mapping = {
                k: v for k, v in raw.items()
                if not k.startswith("_") and isinstance(v, dict)
            }
            # Store default separately (if present)
            cls._default = raw.get("_default")
            cls._loaded = True
            logger.info(
                "Loaded course mapping with %d entries from %s",
                len(cls._mapping),
                _MAPPING_FILE.name,
            )
        except FileNotFoundError:
            logger.error("Course mapping file not found: %s", _MAPPING_FILE)
            cls._mapping = {}
            cls._default = None
            cls._loaded = True
        except json.JSONDecodeError as exc:
            logger.error("Invalid JSON in course mapping file: %s", exc)
            cls._mapping = {}
            cls._default = None
            cls._loaded = True

    @classmethod
    def reload(cls) -> None:
        """Force-reload the mapping (useful after editing the JSON file)."""
        cls._loaded = False
        cls._load()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @classmethod
    def map_course(cls, course_id: str) -> Dict[str, str]:
        """
        Resolve a ``course_id`` to ``{"code_module": …, "code_presentation": …}``.

        Parameters
        ----------
        course_id:
            The identifier sent by the browser extension (e.g.
            ``"ml-fundamentals"``).

        Returns
        -------
        dict
            Always contains exactly ``code_module`` and ``code_presentation``.

        Raises
        ------
        CourseMappingError
            If ``course_id`` is unknown **and** no ``_default`` entry is
            defined in the mapping file.
        """
        cls._load()

        result = cls._mapping.get(course_id)
        if result is not None:
            return {"code_module": result["code_module"],
                    "code_presentation": result["code_presentation"]}

        if cls._default is not None:
            logger.warning(
                "course_id '%s' not in mapping — using default (%s / %s)",
                course_id,
                cls._default["code_module"],
                cls._default["code_presentation"],
            )
            return {"code_module": cls._default["code_module"],
                    "code_presentation": cls._default["code_presentation"]}

        raise CourseMappingError(
            f"Unknown course_id '{course_id}' and no _default mapping configured."
        )

    @classmethod
    def list_mappings(cls) -> Dict[str, Dict[str, str]]:
        """Return the full mapping dictionary (excluding internal keys)."""
        cls._load()
        return dict(cls._mapping)
