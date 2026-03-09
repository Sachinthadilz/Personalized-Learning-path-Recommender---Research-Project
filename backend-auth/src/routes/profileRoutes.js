const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { authenticate } = require("../middleware/auth");

// GET /api/profile — fetch logged-in user's academic profile (null if not created)
router.get("/", authenticate, profileController.getProfile);

// POST /api/profile — create or replace academic profile (onboarding submission)
router.post("/", authenticate, profileController.saveProfile);

// PATCH /api/profile — partial update of an existing profile
router.patch("/", authenticate, profileController.updateProfile);

module.exports = router;
