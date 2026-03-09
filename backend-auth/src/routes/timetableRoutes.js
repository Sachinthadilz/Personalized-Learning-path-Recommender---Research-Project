const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetableController");
const { authenticate } = require("../middleware/auth");

// All routes require authentication
router.post("/", authenticate, timetableController.saveTimetable);
router.get("/", authenticate, timetableController.getTimetable);
router.patch("/completion", authenticate, timetableController.updateCompletion);
router.delete("/", authenticate, timetableController.deleteTimetable);

module.exports = router;
