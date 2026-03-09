const express = require("express");
const router = express.Router();
const studyMaterialController = require("../controllers/studyMaterialController");
const { authenticate } = require("../middleware/auth");

// All routes require a valid JWT access token
router.use(authenticate);

// GET  /api/study-material?subject=SubjectName  → return cached material (or null)
router.get("/", studyMaterialController.getStudyMaterial);

// POST /api/study-material/generate             → generate (or return fresh cache)
router.post("/generate", studyMaterialController.generateStudyMaterial);

module.exports = router;
