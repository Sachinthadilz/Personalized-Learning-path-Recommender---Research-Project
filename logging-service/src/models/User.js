const mongoose = require("mongoose");

/**
 * Minimal User schema – just enough so that the `ref: "User"` on
 * ActivityLog.student_id can be populated when needed.
 *
 * The authoritative User model lives in backend-auth; this is a
 * read-only mirror registered on the same Atlas database/collection.
 */
const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    role: { type: String, default: "user" },
  },
  {
    timestamps: true,
    // Explicitly target the same collection as backend-auth
    collection: "users",
  },
);

module.exports = mongoose.model("User", userSchema);
