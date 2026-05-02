# Learning Paths Migration Guide

## Overview

The `savedLearningPaths` array has been moved from the User schema to a separate `LearningPath` collection to improve performance and scalability.

## Why This Change?

**Previous Issues:**
- Large nested arrays in User documents caused performance degradation
- Document size could approach MongoDB's 16MB limit with many learning paths
- Queries had to load entire User documents even when only accessing learning paths
- Updates to learning paths locked the entire User document
- Inefficient indexing for learning path queries

**Benefits of New Schema:**
- ✅ Better query performance (dedicated indexes on LearningPath collection)
- ✅ Reduced memory usage (load only what you need)
- ✅ No document size limitations
- ✅ Better concurrent access (updates don't lock User document)
- ✅ Easier to implement features like sharing, analytics, etc.

## Migration Steps

### Step 1: Backup Your Database

**IMPORTANT:** Always backup before running migrations!

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/learning-platform" --out=./backup-$(date +%Y%m%d)
```

### Step 2: Run the Migration Script

The migration script moves data from `User.savedLearningPaths` to the new `LearningPath` collection:

```bash
cd backend-auth
node src/migrations/migrateLearningPaths.js
```

**What it does:**
- Reads all users with `savedLearningPaths`
- Creates new `LearningPath` documents for each path
- Preserves all data including enrollment status and quiz results
- Is idempotent (safe to run multiple times)

**Output example:**
```
============================================================
Learning Paths Migration Script
============================================================
✓ Connected to MongoDB

Found 15 users with saved learning paths

Processing user: john@example.com (3 paths)
  ✓ Migrated path "Machine Learning Fundamentals"
  ✓ Migrated path "Web Development Bootcamp"
  ✓ Migrated path "Data Science Path"

Processing user: jane@example.com (2 paths)
  ✓ Migrated path "Python Basics"
  ⊘ Skipping path "React Advanced" - already migrated

============================================================
Migration Summary:
  ✓ Migrated: 45 learning paths
  ⊘ Skipped:  2 (already existed)
  ✗ Errors:   0
============================================================
```

### Step 3: Verify the Migration

Check that all data was migrated successfully:

```javascript
// In MongoDB shell or Compass
use learning-platform

// Count learning paths in new collection
db.learningpaths.countDocuments()

// Check a sample document
db.learningpaths.findOne()

// Verify enrollment data
db.learningpaths.find({ "enrollment.isEnrolled": true }).count()
```

### Step 4: Test Your Application

1. **Start your server:**
   ```bash
   cd backend-auth
   npm start
   ```

2. **Test key endpoints:**
   - GET `/api/learning-paths` - List all learning paths
   - GET `/api/learning-paths/:pathId` - Get specific path
   - POST `/api/learning-paths` - Create new path
   - GET `/api/learning-paths/:pathId/enrollment` - Check enrollment
   - POST `/api/learning-paths/:pathId/enroll` - Enroll in path
   - POST `/api/learning-paths/:pathId/courses/:courseId/quiz` - Quiz generation

3. **Verify frontend:**
   - Check that saved paths display correctly
   - Test enrollment functionality
   - Verify quiz and progress tracking works

### Step 5: Clean Up Old Data (Optional)

After confirming everything works, remove the old `savedLearningPaths` field from User documents:

```bash
node src/migrations/cleanupUserLearningPaths.js
```

**⚠️ WARNING:** This is destructive! Only run after thorough testing.

The script will:
1. Ask for confirmation twice
2. Remove `savedLearningPaths` from all User documents
3. Provide a summary of changes

## API Changes

### No Breaking Changes!

The API endpoints remain the same - only the backend implementation changed:

```javascript
// Before and After - Same API
GET    /api/learning-paths              // Get all paths
GET    /api/learning-paths/:pathId      // Get specific path
POST   /api/learning-paths              // Create new path
PUT    /api/learning-paths/:pathId      // Update path name
DELETE /api/learning-paths/:pathId      // Delete path
```

### Controller Changes (Internal)

**Before:**
```javascript
const user = await User.findById(userId);
const path = user.savedLearningPaths.find(p => p.pathId === pathId);
```

**After:**
```javascript
const path = await LearningPath.findByUserAndPath(userId, pathId);
```

## New Model Methods

The `LearningPath` model includes helpful methods:

```javascript
// Static methods
LearningPath.findByUser(userId, options)
LearningPath.findByUserAndPath(userId, pathId)

// Instance methods
learningPath.enroll()
learningPath.unenroll()
learningPath.getCourseProgress(courseId)
learningPath.updateCourseProgress(courseId, updates)
learningPath.completeCourse(courseId, quizResult)
```

## Performance Improvements

### Query Performance

**Before:**
```javascript
// Had to load entire User document with all learning paths
const user = await User.findById(userId); // Slow with many paths
```

**After:**
```javascript
// Load only the specific learning path needed
const path = await LearningPath.findByUserAndPath(userId, pathId); // Fast!
```

### Indexing

The new schema includes optimized indexes:
- `{ userId: 1, pathId: 1 }` - Fast user+path lookups
- `{ userId: 1, "enrollment.isEnrolled": 1 }` - Quick enrolled paths filter
- `{ userId: 1, createdAt: -1 }` - Efficient sorting

## Rollback Plan

If you need to rollback:

1. **Stop the application**

2. **Restore from backup:**
   ```bash
   mongorestore --uri="mongodb://localhost:27017/learning-platform" ./backup-YYYYMMDD
   ```

3. **Revert code changes:**
   ```bash
   git checkout <previous-commit>
   ```

4. **Restart application**

## Troubleshooting

### Migration Script Errors

**Error: "User not found"**
- Ensure MongoDB connection string is correct in `.env`
- Check database name matches your environment

**Error: "Duplicate key"**
- The script is idempotent - this just means paths already exist
- Safe to continue; check the summary for successful migrations

### Application Errors After Migration

**Error: "Learning path not found"**
- Verify migration completed successfully
- Check `LearningPath` collection has data
- Ensure `userId` and `pathId` are correct

**Enrollment/Quiz Issues**
- Verify enrollment data migrated correctly
- Check `enrollment.courseProgress` array exists
- Ensure `quizResult` data is preserved

## Need Help?

If you encounter issues:

1. Check the migration script output for errors
2. Verify database connection and permissions
3. Review application logs for detailed error messages
4. Ensure all dependencies are installed (`npm install`)
5. Test with a single user before running full migration

## Technical Details

### Schema Comparison

**Old Schema (Embedded):**
```javascript
User {
  _id,
  email,
  savedLearningPaths: [  // Array grows indefinitely
    {
      pathId,
      pathName,
      courses: [...],     // Nested array
      enrollment: {
        courseProgress: [...]  // Another nested array
      }
    }
  ]
}
```

**New Schema (Separate Collection):**
```javascript
User {
  _id,
  email
  // savedLearningPaths removed
}

LearningPath {
  _id,
  userId,              // Reference to User
  pathId,
  pathName,
  courses: [...],
  enrollment: {
    courseProgress: [...]
  }
}
```

### Data Integrity

The migration preserves:
- ✅ All path metadata (name, type, target skill)
- ✅ All courses and their details
- ✅ Enrollment status
- ✅ Course progress and completion status
- ✅ Quiz results and scores
- ✅ Creation timestamps

## Summary

This migration improves performance without changing your API or frontend code. Follow the steps above to safely migrate your data, and enjoy better performance and scalability!
