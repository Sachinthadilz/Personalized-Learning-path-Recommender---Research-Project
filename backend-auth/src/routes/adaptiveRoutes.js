const express = require("express");
const router = express.Router();
const adaptiveController = require("../controllers/adaptiveController");
const { authenticate } = require("../middleware/auth");

// All routes require a valid JWT access token
router.use(authenticate);

router.get("/session",      adaptiveController.getSession);
router.post("/session",     adaptiveController.saveSession);
router.post("/quiz-result", adaptiveController.saveQuizResult);
router.delete("/session",   adaptiveController.resetSession);

module.exports = router;
