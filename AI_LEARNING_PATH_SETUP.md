# 🤖 AI-Powered Learning Path - Setup & User Guide

## Overview

The Learning Path feature now uses **Groq AI** (Llama 3.3 70B) to intelligently generate personalized learning paths. Instead of simple database queries, the AI analyzes all available courses and creates an optimal progression tailored to your learning goals.

---

## 🎯 What Makes It AI-Powered?

### Traditional Approach (Before)

- ❌ Simple database query by skill name
- ❌ Basic sorting by difficulty
- ❌ Limited to 10 courses
- ❌ No understanding of learning progression
- ❌ No course quality analysis

### AI-Powered Approach (Now)

- ✅ **Intelligent Analysis** - AI evaluates ALL available courses
- ✅ **Smart Progression** - Understands beginner → intermediate → advanced flow
- ✅ **Quality Ranking** - Prioritizes highly-rated courses
- ✅ **Diverse Perspectives** - Includes courses from multiple universities
- ✅ **Personalized** - Adapts to your specific skill goal
- ✅ **Comprehensive** - Can recommend up to 100 courses
- ✅ **Context-Aware** - Considers prerequisites and skill dependencies

---

## 🔧 Setup Instructions

### Step 1: Get Your Groq API Key

1. **Visit Groq Console**
   - Go to: https://console.groq.com/

2. **Sign Up / Log In**
   - Create a free account or log in
   - Free tier includes generous API credits

3. **Create API Key**
   - Navigate to "API Keys" section
   - Click "Create API Key"
   - Copy your API key (starts with `gsk_...`)
   - ⚠️ **Important:** Save it securely - you won't see it again!

### Step 2: Configure Backend

1. **Open your `.env` file** in the backend directory:

   ```bash
   cd backend
   ```

2. **Add your Groq API key:**

   ```env
   GROQ_API_KEY=gsk_your_actual_api_key_here
   ```

3. **Verify other required variables are set:**

   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_neo4j_password

   # Add this line:
   GROQ_API_KEY=gsk_your_groq_key_here
   ```

### Step 3: Install Required Packages

The Groq Python SDK should already be installed, but if not:

```bash
cd backend
pip install groq
# or with uv:
uv pip install groq
```

### Step 4: Restart Backend Server

```bash
cd backend
uv run main.py
```

You should see:

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## 🚀 How to Use

### 1. Navigate to Learning Path Tab

In your browser at `http://localhost:3000`, click on **"🛤️ Learning Path"** tab.

### 2. Enter Your Learning Goal

**Target Skill:** Enter what you want to learn

- Examples: "Machine Learning", "Python", "Web Development", "Data Science"

### 3. Generate AI Learning Path

Click **"🚀 Generate AI-Powered Learning Path"**

**What happens:**

1. ⏱️ AI takes 5-10 seconds to analyze courses
2. 🔍 Searches database for relevant courses
3. 🤖 Groq AI evaluates and ranks courses
4. 📊 Orders courses by optimal learning progression
5. ✨ Returns personalized learning path

### 4. View Your Results

- **First 5 courses** display automatically
- **Course details** show:
  - Title & university
  - Difficulty level (color-coded)
  - Rating
  - Description in bullet points
  - Skills you'll learn
  - Direct enrollment link

### 5. Load More Courses

**Click "📚 Load More Courses"** button to reveal additional courses (5 at a time)

---

## 🧠 How the AI Works

### Behind the Scenes

1. **Query Database**
   - Fetches up to 100 courses matching your target skill
   - Includes course metadata: difficulty, rating, skills, university

2. **AI Prompt Engineering**

   ```
   The AI receives:
   - Your target skill
   - List of all available courses with details
   - Instructions to create optimal learning path
   - Requirements for diverse difficulty levels
   ```

3. **AI Analysis**
   - **Llama 3.3 70B** model evaluates each course
   - Considers difficulty progression
   - Values higher-rated courses
   - Ensures skill prerequisites are met
   - Balances university diversity

4. **Path Generation**
   - AI returns ordered list of course IDs
   - Backend retrieves full course details
   - Frontend displays with pagination

### AI Model Details

- **Model:** `llama-3.3-70b-versatile`
- **Provider:** Groq (ultra-fast inference)
- **Temperature:** 0.3 (consistent, focused results)
- **Context:** Full course catalog analysis
- **Output:** JSON array of course IDs in optimal order

---

## 🎓 Example Use Cases

### Example 1: Complete Beginner - Python

**Input:**

```
Target Skill: Python Programming
```

**AI Process:**

1. Finds 50+ Python courses
2. Identifies absolute beginner courses
3. Creates progression: Syntax → Data Structures → Projects → Advanced
4. Recommends courses from MIT, Stanford, etc.
5. Returns 30+ courses in optimal order

**Result:** Complete beginner-to-expert Python journey

---

### Example 2: Career Switcher - Data Science

**Input:**

```
Target Skill: Data Science
```

**AI Process:**

1. Analyzes 80+ data science courses
2. Starts with Python/statistics foundations
3. Progresses to data analysis, visualization
4. Advances to machine learning
5. Ends with specialized topics (deep learning, big data)

**Result:** Career-ready data science curriculum

---

### Example 3: Specialization - Deep Learning

**Input:**

```
Target Skill: Deep Learning
```

**AI Process:**

1. Finds 40+ AI/ML courses
2. Assumes basic ML knowledge
3. Starts with neural network fundamentals
4. Progresses to CNNs, RNNs, transformers
5. Includes practical projects

**Result:** Comprehensive deep learning specialization

---

## 🐛 Troubleshooting

### Problem: "GROQ_API_KEY not found"

**Solution:**

1. Ensure `.env` file exists in backend directory
2. Verify key is correctly formatted: `GROQ_API_KEY=gsk_...`
3. No spaces around the `=` sign
4. Restart backend server after adding key

---

### Problem: "Failed to generate learning path"

**Possible Causes & Solutions:**

1. **API Rate Limit**
   - Groq free tier has rate limits
   - Wait a minute and try again
   - Consider upgrading Groq plan

2. **Network Issues**
   - Check internet connection
   - Verify Groq API is accessible

3. **AI Response Parsing Error**
   - The system automatically falls back to traditional method
   - Check backend logs for details

---

### Problem: "No courses found"

**Solution:**

- Try broader skill terms: "Machine Learning" instead of "Advanced GANs"
- Check database has relevant courses
- Use the "Courses" or "Skills" tab to see available topics

---

### Problem: "Only seeing beginner courses"

**Solution:**

- **Click "Load More Courses"** button multiple times
- AI orders by beginner → intermediate → advanced
- Pagination shows 5 courses at a time
- Keep clicking to access advanced courses

---

## ⚡ Performance Tips

### Faster Results

1. **Be Specific**
   - ✅ "Python for Data Science"
   - ❌ "Programming"

2. **Warm Start**
   - First request takes longer (model loading)
   - Subsequent requests are faster

3. **Optimal Skills**
   - Popular skills have more courses
   - More courses = better AI analysis

### API Costs

- **Groq Free Tier:** Very generous limits
- **Cost per Request:** Minimal (fractions of a cent)
- **Recommended:** Free tier sufficient for personal use
- **Production:** Consider paid plan for high-volume usage

---

## 🔐 Security Best Practices

### Protecting Your API Key

1. ✅ **Never commit `.env` to Git**

   ```bash
   # Add to .gitignore:
   .env
   ```

2. ✅ **Use environment variables in production**

   ```bash
   export GROQ_API_KEY=your_key
   ```

3. ✅ **Rotate keys periodically**
   - Generate new key every 3-6 months
   - Delete old keys from Groq console

4. ❌ **Never share your API key**
   - Don't post in issues/forums
   - Don't include in screenshots

---

## 📊 Comparison: AI vs Traditional

| Feature               | Traditional Method     | AI-Powered Method             |
| --------------------- | ---------------------- | ----------------------------- |
| **Analysis Depth**    | Basic keyword match    | Deep course evaluation        |
| **Course Limit**      | 10 courses max         | Up to 100 courses             |
| **Progression Logic** | Simple difficulty sort | Intelligent curriculum design |
| **Quality Ranking**   | Rating only            | Multi-factor analysis         |
| **Personalization**   | None                   | Adapted to goal               |
| **Response Time**     | 1-2 seconds            | 5-10 seconds                  |
| **Accuracy**          | Good                   | Excellent                     |
| **Diversity**         | Limited                | High                          |

---

## 🚀 Advanced Configuration

### Customizing AI Behavior

Edit `backend/services/ai_learning_path_service.py`:

```python
# Line 125 - Adjust temperature for more/less creativity
temperature=0.3  # Lower = more consistent, Higher = more creative

# Line 126 - Adjust max tokens for longer/shorter responses
max_tokens=2000  # Increase if AI responses are cut off

# Line 24 - Change model
self.model = "llama-3.3-70b-versatile"  # Try other Groq models
```

### Fallback Behavior

If AI fails, the system automatically uses traditional method:

- Sorts by difficulty (Beginner → Advanced)
- Orders by rating (highest first)
- Returns consistent results

---

## 📝 Technical Architecture

```
User Request
    ↓
Frontend (React)
    ↓
Backend API (FastAPI)
    ↓
AI Service
    ├→ Neo4j Database (fetch courses)
    ├→ Groq API (AI analysis)
    └→ Course Ordering
    ↓
Return Ordered List
    ↓
Frontend Display (Pagination)
```

### Key Files

- **Backend Service:** `backend/services/ai_learning_path_service.py`
- **API Endpoint:** `backend/main.py` (line ~159)
- **Frontend Component:** `frontend/src/components/LearningPathTab.tsx`
- **Models:** `backend/models.py` (`LearningPathRequest`)

---

## ✅ Verification Checklist

Before using AI-powered learning paths:

- [ ] Groq API key obtained from console.groq.com
- [ ] API key added to backend `.env` file
- [ ] Backend server restarted
- [ ] Frontend shows "🤖 AI-Powered" banner
- [ ] Test with simple skill (e.g., "Python")
- [ ] Verify 5-10 second response time
- [ ] Check courses span beginner to advanced
- [ ] Can load more courses via pagination

---

## 🎉 Benefits Summary

### For Learners

- 🎯 Truly personalized learning paths
- 📈 Optimal skill progression
- ⭐ High-quality course recommendations
- 🌍 Diverse university perspectives
- 📚 Comprehensive coverage (100+ courses)

### For Educators

- 🤖 Automated curriculum design
- 💡 AI insights into course relationships
- 📊 Data-driven recommendations
- 🔄 Easy to update and maintain

---

## 📞 Support

### Getting Help

1. **Check logs:**

   ```bash
   # Backend logs
   cd backend
   uv run main.py
   # Look for error messages
   ```

2. **Verify API key:**

   ```bash
   # In backend directory
   cat .env | grep GROQ_API_KEY
   ```

3. **Test Groq connection:**
   ```python
   # Python test
   from groq import Groq
   import os
   client = Groq(api_key=os.getenv("GROQ_API_KEY"))
   # Should not raise errors
   ```

---

## 🎓 Next Steps

1. ✅ Complete setup (API key, backend restart)
2. ✅ Generate your first AI learning path
3. ✅ Explore different skills and compare results
4. ✅ Use pagination to see full curriculum
5. ✅ Enroll in recommended courses!

---

**Powered by Groq AI (Llama 3.3 70B) • Built with FastAPI & React**

---

**Happy AI-Powered Learning! 🤖🎓✨**
