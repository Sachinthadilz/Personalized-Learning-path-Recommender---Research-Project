const { v4: uuidv4 } = require("uuid");
const AcademicProfile = require("../models/AcademicProfile");

/**
 * GET /api/profile
 * Returns the academic profile for the logged-in user.
 * Returns { success: true, data: null } if not yet created (onboarding not done).
 */
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await AcademicProfile.findOne({ user: req.user.id });
    res.status(200).json({
      success: true,
      data: profile || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/profile
 * Create or replace the academic profile (called on onboarding completion).
 * Body: { university, degree, yearOfStudy, modules: [{ name, credits }] }
 */
exports.saveProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { university, degree, yearOfStudy, modules } = req.body;

    if (!university || !modules || modules.length === 0) {
      return res.status(400).json({
        success: false,
        message: "university and at least one module are required",
      });
    }

    // Attach generated IDs to modules
    const normalizedModules = modules.map((m) => ({
      moduleId: m.moduleId || uuidv4(),
      name: m.name,
      credits: Number(m.credits),
    }));

    const profile = await AcademicProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          user: userId,
          university,
          degree: degree || "",
          yearOfStudy: yearOfStudy || 1,
          modules: normalizedModules,
          onboardingCompleted: true,
        },
      },
      { upsert: true, new: true, runValidators: false, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Academic profile saved",
      data: profile,
    });
  } catch (error) {
    console.error("saveProfile error:", error.message);
    next(error);
  }
};

/**
 * PATCH /api/profile
 * Update individual fields on an existing profile.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { university, degree, yearOfStudy, modules } = req.body;

    const updates = {};
    if (university !== undefined) updates.university = university;
    if (degree !== undefined) updates.degree = degree;
    if (yearOfStudy !== undefined) updates.yearOfStudy = yearOfStudy;
    if (modules !== undefined) {
      updates.modules = modules.map((m) => ({
        moduleId: m.moduleId || uuidv4(),
        name: m.name,
        credits: Number(m.credits),
      }));
    }

    const profile = await AcademicProfile.findOneAndUpdate(
      { user: userId },
      { $set: updates },
      { new: true, runValidators: false }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};
