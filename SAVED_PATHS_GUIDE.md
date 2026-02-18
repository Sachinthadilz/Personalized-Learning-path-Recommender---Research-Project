# Saved Learning Paths Feature - Setup & Usage Guide

## Overview

You can now save learning paths from both **AI-Powered Learning Path Discovery** (AI Search) and **AI-Powered Learning Path Generator** to your user profile for easy access later.

## What Was Implemented

### 1. Backend Updates (Node.js - backend-auth)

#### User Model Enhancement

- Added `savedLearningPaths` array to User schema
- Each saved path includes:
  - Path ID (unique identifier)
  - Path name (customizable)
  - Path type (ai_search or ai_generator)
  - Target skill
  - Array of courses
  - Metadata (total courses, average rating, difficulty)
  - Creation timestamp

#### New API Endpoints

All endpoints require authentication (Bearer token).

**Base URL:** `http://localhost:5001/api/learning-paths`

1. **Save Learning Path**
   - `POST /api/learning-paths`
   - Save a new learning path
2. **Get All Saved Paths**
   - `GET /api/learning-paths`
   - Retrieve all saved learning paths for the authenticated user
3. **Get Specific Path**
   - `GET /api/learning-paths/:pathId`
   - Get details of a specific learning path
4. **Update Path Name**
   - `PATCH /api/learning-paths/:pathId`
   - Rename a saved learning path
5. **Delete Path**
   - `DELETE /api/learning-paths/:pathId`
   - Remove a saved learning path

### 2. Frontend Updates (React/TypeScript)

#### New Components

1. **SavedPathsTab** - New tab to view and manage saved learning paths
   - View all saved paths
   - Expand/collapse to see courses
   - Rename paths
   - Delete paths
   - Filter by path type

#### Updated Components

1. **AISearchTab** - Added "Save Learning Path" button
   - Appears after successful AI search
   - Saves all courses (beginner, intermediate, advanced)
   - Only visible when logged in

2. **LearningPathTab** - Added "Save Learning Path" button
   - Appears after generating a learning path
   - Saves the complete AI-generated path
   - Only visible when logged in

## Setup Instructions

### 1. Install Backend Dependencies

Navigate to the backend-auth directory and install the new dependency:

```powershell
cd "C:\Users\sachi\OneDrive\Desktop\up knowledge graph\backend-auth"
npm install
```

This will install the `uuid` package required for generating unique path IDs.

### 2. Restart Backend Services

#### Restart Auth Server

In the "node" terminal:

```powershell
cd "C:\Users\sachi\OneDrive\Desktop\up knowledge graph\backend-auth"
npm run server
```

The server should restart at `http://localhost:5001`

#### Verify Python Backend is Running

In the "uv" terminal, ensure the Python backend is running:

```powershell
cd "C:\Users\sachi\OneDrive\Desktop\up knowledge graph\backend"
python main.py
```

Should be running at `http://127.0.0.1:5000`

### 3. Restart Frontend

In the "esbuild" terminal:

```powershell
cd "C:\Users\sachi\OneDrive\Desktop\up knowledge graph\frontend"
npm run dev
```

Frontend should start at `http://localhost:5173`

## How to Use

### Saving a Learning Path

#### From AI Search

1. Go to the **AI Search** tab
2. Enter a search query (e.g., "machine learning for beginners")
3. Click **🔍 AI Search**
4. After results appear, click **💾 Save Learning Path** (top right)
5. Success message will appear confirming the save

#### From Learning Path Generator

1. Go to the **Learning Path** tab
2. Enter a target skill (e.g., "Python Programming")
3. Click **🚀 Generate AI-Powered Learning Path**
4. After the path is generated, click **💾 Save Learning Path** (top right)
5. Success message will appear confirming the save

### Viewing Saved Paths

1. Go to the **Saved Paths** tab (💾 icon in navigation)
2. You'll see all your saved learning paths with:
   - Path name
   - Type badge (🔍 AI Search or 🤖 AI Generator)
   - Target skill
   - Number of courses
   - Average rating
   - Difficulty level
   - Save date/time

### Managing Saved Paths

#### Expand/Collapse

- Click **▼ Expand** to see all courses in the path
- Click **▲ Collapse** to hide the courses

#### Rename

1. Click **✏️ Rename**
2. Edit the name in the text field
3. Click **✓** to save or **✕** to cancel

#### Delete

1. Click **🗑️ Delete**
2. Confirm the deletion in the popup
3. Path will be removed permanently

## Features

### Path Information

Each saved path displays:

- Custom name (editable)
- Path type (AI Search or AI Generator)
- Target skill
- Total number of courses
- Average rating across all courses
- Difficulty classification
- Timestamp of when it was saved

### Course Details (when expanded)

For each course in a saved path:

- Course name and description (as bullet points)
- University/Institution
- Rating (⭐)
- Difficulty level (Beginner/Intermediate/Advanced)
- Similarity score (for AI Search results)
- Skills taught
- Direct link to the course

## API Request Examples

### Save a Learning Path

```javascript
POST http://localhost:5001/api/learning-paths
Headers:
  Authorization: Bearer <your_access_token>
  Content-Type: application/json

Body:
{
  "pathName": "My Machine Learning Journey",
  "pathType": "ai_search",
  "targetSkill": "Machine Learning",
  "courses": [
    {
      "id": "course-123",
      "name": "Introduction to ML",
      "description": "Learn ML basics",
      "rating": 4.8,
      "url": "https://coursera.org/...",
      "university": "Stanford",
      "difficulty": "Beginner",
      "skills": ["Python", "Machine Learning"]
    }
  ],
  "metadata": {
    "totalCourses": 10,
    "avgRating": 4.7,
    "difficulty": "Progressive"
  }
}
```

### Get All Saved Paths

```javascript
GET http://localhost:5001/api/learning-paths
Headers:
  Authorization: Bearer <your_access_token>
```

### Delete a Path

```javascript
DELETE http://localhost:5001/api/learning-paths/{pathId}
Headers:
  Authorization: Bearer <your_access_token>
```

## Data Storage

- Learning paths are stored in MongoDB in the User collection
- Each user can save unlimited learning paths
- Paths include complete course information (no references to external data)
- All metadata is calculated and stored at save time

## Security

- All endpoints require authentication
- Users can only access their own saved paths
- JWT tokens are used for authentication
- Refresh tokens are supported for session management

## Notes

- You must be logged in to save or view learning paths
- Saved paths persist across sessions
- Course information is a snapshot at the time of saving
- Original course data may have been updated since saving
- Deleting a path is permanent and cannot be undone

## Troubleshooting

### "Please login to save learning paths"

- You need to be authenticated
- Log in or sign up first

### "Failed to save learning path"

- Check if backend-auth server is running on port 5001
- Verify your authentication token is valid
- Check browser console for detailed errors

### Save button not appearing

- Ensure you've completed a search or generated a path first
- Verify you're logged in (check header for user name)

### Saved paths not loading

- Verify backend-auth is running
- Check MongoDB connection
- Look for errors in browser console and server logs

## File Changes Summary

### Backend (backend-auth)

- `src/models/User.js` - Added savedLearningPaths schema
- `src/controllers/learningPathController.js` - New controller
- `src/routes/learningPathRoutes.js` - New routes
- `src/app.js` - Registered new routes
- `package.json` - Added uuid dependency

### Frontend

- `src/api.ts` - Added learning path API functions
- `src/components/AISearchTab.tsx` - Added save button
- `src/components/LearningPathTab.tsx` - Added save button
- `src/components/SavedPathsTab.tsx` - New component
- `src/App.tsx` - Added Saved Paths tab to navigation

---

**Enjoy your personalized learning journey! 🚀📚**
