const Timetable = require("../models/Timetable");

/**
 * Save (or replace) the generated timetable for the authenticated user.
 * Called right after the Python backend generates the timetable.
 *
 * POST /api/timetable
 * Body: { student_id, name, start_date, end_date, subjects, days }
 */
exports.saveTimetable = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { student_id, name, start_date, end_date, subjects, days } = req.body;

    if (!student_id || !start_date || !end_date || !days) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: student_id, start_date, end_date, days",
      });
    }

    // Upsert — one timetable per user (regenerating replaces the old one)
    const timetable = await Timetable.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          user: userId,
          student_id,
          name: name || "Student",
          start_date,
          end_date,
          subjects: subjects || [],
          days,
        },
      },
      { upsert: true, new: true, runValidators: false, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Timetable saved successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("saveTimetable error:", error.message, error.code);
    next(error);
  }
};

/**
 * Get the current user's timetable, optionally filtered by date range.
 *
 * GET /api/timetable?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
exports.getTimetable = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    const timetable = await Timetable.findOne({ user: userId });

    if (!timetable) {
      return res.status(200).json({
        success: true,
        data: null,
        timetables: [],
      });
    }

    let days = timetable.days;

    // Apply optional date range filter
    if (start_date || end_date) {
      days = days.filter((d) => {
        if (start_date && d.date < start_date) return false;
        if (end_date && d.date > end_date) return false;
        return true;
      });
    }

    res.status(200).json({
      success: true,
      data: {
        student_id: timetable.student_id,
        name: timetable.name,
        start_date: timetable.start_date,
        end_date: timetable.end_date,
        subjects: timetable.subjects,
      },
      timetables: days,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update completion hours for a specific subject on a specific day.
 *
 * PATCH /api/timetable/completion
 * Body: { date, subject_id, completed_hours }
 */
exports.updateCompletion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date, subject_id, completed_hours } = req.body;

    if (!date || !subject_id || completed_hours === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: date, subject_id, completed_hours",
      });
    }

    const timetable = await Timetable.findOne({ user: userId });
    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable not found" });
    }

    const day = timetable.days.find((d) => d.date === date);
    if (!day) {
      return res.status(404).json({ success: false, message: `No entry found for date ${date}` });
    }

    const alloc = day.allocations.find((a) => a.subject_id === subject_id);
    if (!alloc) {
      return res.status(404).json({ success: false, message: `Subject ${subject_id} not found on ${date}` });
    }

    alloc.completed_hours = completed_hours;
    if (completed_hours >= alloc.planned_hours) {
      alloc.status = "completed";
    } else if (completed_hours > 0) {
      alloc.status = "in_progress";
    } else {
      alloc.status = "missed";
    }

    day.total_completed = day.allocations.reduce((sum, a) => sum + a.completed_hours, 0);

    await timetable.save();

    res.status(200).json({
      success: true,
      message: "Completion updated",
      data: day,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete the current user's timetable (reset).
 *
 * DELETE /api/timetable
 */
exports.deleteTimetable = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await Timetable.findOneAndDelete({ user: userId });
    res.status(200).json({ success: true, message: "Timetable deleted" });
  } catch (error) {
    next(error);
  }
};
