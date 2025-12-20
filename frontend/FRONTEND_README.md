# Course Knowledge Graph - Frontend

React + TypeScript + Tailwind CSS frontend for testing all FastAPI backend endpoints.

## 🚀 Features

### Dashboard Tab

- **API Health Check** - Tests `GET /health` endpoint
- **Statistics Overview** - Tests `GET /stats` endpoint
- Shows total courses, universities, skills, and relationships
- Displays top universities and skills with visual cards

### Courses Tab

Tests multiple course endpoints:

- `GET /courses` - Get all courses with pagination
- `POST /courses/search` - Search courses with filters (query, skills, difficulty, rating)
- `GET /courses/by-skill/{skill}` - Get courses by specific skill
- `GET /courses/{id}` - Get detailed course information with similar courses
- Interactive course cards with click-to-view details

### Recommendations Tab

Tests recommendation endpoints:

- `GET /recommendations/similar/{id}` - Get similar courses
- `POST /recommendations` - Get personalized recommendations
- `GET /recommendations/popular` - Get popular courses
- Supports filtering by skills and difficulty

### Skills Tab

Tests skill endpoints:

- `GET /skills` - Get all skills with course counts
- `GET /skills/{skill}/related` - Get related skills
- Interactive skill cards showing relationships

### Universities Tab

Tests university endpoint:

- `GET /universities` - Get all universities with course counts
- Search functionality
- Statistics dashboard

### Learning Path Tab

Tests learning path generation:

- `POST /learning-path` - Generate skill-based learning paths
- Visual step-by-step progression
- Customizable path length and starting point

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- Backend API running on http://127.0.0.1:5000

### Installation

\`\`\`bash
cd frontend
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Frontend will run on http://localhost:5173

### Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

## 📁 Project Structure

\`\`\`
src/
├── api.ts # API client with all endpoint functions
├── App.tsx # Main app with tab navigation
├── components/
│ ├── Dashboard.tsx # Stats & health check
│ ├── CoursesTab.tsx # Course search & viewing
│ ├── RecommendationsTab.tsx # Recommendation testing
│ ├── SkillsTab.tsx # Skills catalog
│ ├── UniversitiesTab.tsx # Universities list
│ └── LearningPathTab.tsx # Learning path generator
└── index.css # Tailwind imports
\`\`\`

## 🎨 UI Features

- **Responsive Design** - Works on mobile, tablet, and desktop
- **Loading States** - Spinners for all async operations
- **Error Handling** - User-friendly error messages
- **Interactive Cards** - Hover effects and click interactions
- **Color-Coded** - Different colors for different difficulty levels
- **Real-time Updates** - Refresh buttons for all data

## 🔗 API Configuration

Backend URL is configured in `src/api.ts`:

\`\`\`typescript
const API_BASE_URL = 'http://127.0.0.1:5000';
\`\`\`

Change this if your backend runs on a different port.

## 📊 Testing All Endpoints

Each tab is designed to test specific API endpoints:

1. **Dashboard** - Health & Stats
2. **Courses** - 4 course endpoints
3. **Recommendations** - 3 recommendation endpoints
4. **Skills** - 2 skill endpoints
5. **Universities** - 1 university endpoint
6. **Learning Path** - 1 learning path endpoint

Total: **12+ API endpoints** fully tested!

## 🎯 Usage Tips

1. **Start with Dashboard** - Verify API is running
2. **Load All Courses** - Click "All Courses" button
3. **Try Search** - Use filters to narrow results
4. **View Details** - Click any course card
5. **Get Recommendations** - Enter course ID or skills
6. **Generate Path** - Enter target skill to create learning roadmap

## 🐛 Troubleshooting

### CORS Errors

- Ensure FastAPI has CORS middleware enabled
- Check backend logs for connection attempts

### Port Already in Use

- Stop other apps using port 5173
- Or change port in vite.config.ts

### API Not Responding

- Verify backend is running on port 5000
- Check backend health: http://127.0.0.1:5000/health
- Review backend console for errors

## 🚀 Next Steps

- Add authentication
- Implement course bookmarking
- Add user profiles
- Create course comparison feature
- Add data visualization charts
- Implement course reviews

---

Built with ❤️ using React, TypeScript, Tailwind CSS, and Vite
