# Course Knowledge Graph 🎓

A Neo4j-powered knowledge graph system for discovering online courses, generating personalized recommendations, and creating learning paths using FastAPI.

## 📋 Project Overview

This project builds a comprehensive knowledge graph from Coursera course data, enabling:

- **Intelligent Course Search**: Full-text search with filters
- **Smart Recommendations**: Similar courses based on skills and content
- **Learning Paths**: Automated progression planning to target skills
- **Skill Mapping**: Relationships between skills and courses
- **University Analytics**: Course offerings and quality metrics

## 🏗️ Architecture

```
Course Knowledge Graph
├── Neo4j Database (Graph Database)
│   ├── Nodes: Courses, Skills, Universities, Difficulty Levels
│   └── Relationships: TEACHES, OFFERED_BY, SIMILAR_TO, RELATED_TO
├── FastAPI Backend (Python REST API)
│   ├── Course Search & Management
│   ├── Recommendation Engine
│   └── Learning Path Generator
└── Data Processing (CSV → Neo4j)
```

## 🛠️ Tech Stack

- **Database**: Neo4j 5.x
- **Backend**: FastAPI + Uvicorn
- **Data Processing**: Pandas, NumPy
- **NLP**: Sentence-Transformers (for advanced recommendations)
- **Visualization**: Matplotlib, Seaborn (in Jupyter notebooks)

## 📊 Knowledge Graph Structure

### Nodes

- **Course**: `{id, name, description, rating, url}`
- **University**: `{name}`
- **Skill**: `{name}`
- **DifficultyLevel**: `{level, order}`

### Relationships

- `(Course)-[:OFFERED_BY]->(University)`
- `(Course)-[:TEACHES]->(Skill)`
- `(Course)-[:HAS_DIFFICULTY]->(DifficultyLevel)`
- `(Course)-[:SIMILAR_TO {common_skills}]-(Course)`
- `(Skill)-[:RELATED_TO {strength}]-(Skill)`

## 🚀 Getting Started

### Prerequisites

1. **Python 3.8+**
2. **Neo4j Database**
   - Download [Neo4j Desktop](https://neo4j.com/download/) OR
   - Use [Neo4j Aura](https://neo4j.com/cloud/aura/) (Cloud)

### Installation

1. **Clone the repository**

```bash
cd "course scrape"
```

2. **Install dependencies**

```bash
pip install -r requirements.txt
```

3. **Configure Neo4j**

   - Copy `.env.example` to `.env`
   - Update with your Neo4j credentials:

   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   ```

4. **Import data into Neo4j**

```bash
python data_loader.py
```

This will:

- Create indexes for performance
- Import 3,500+ courses
- Create skill relationships
- Compute course similarities

5. **Start the API server**

```bash
python main.py
```

API will be available at: `http://localhost:8000`

## 📚 API Documentation

Once the server is running, visit:

- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Course Search

```http
POST /courses/search
{
  "query": "Python programming",
  "difficulty": "Beginner",
  "min_rating": 4.5,
  "limit": 10
}
```

#### Get Course Details

```http
GET /courses/{course_id}
```

#### Get Recommendations

```http
POST /recommendations
{
  "skills": ["Python Programming", "Data Analysis"],
  "difficulty": "Intermediate",
  "limit": 10
}
```

#### Generate Learning Path

```http
POST /learning-path
{
  "target_skill": "Machine Learning",
  "max_courses": 5
}
```

#### Get Statistics

```http
GET /stats
```

## 📓 Jupyter Notebook

Explore the data and test queries in `notebook.ipynb`:

- Dataset exploration and visualization
- Statistical analysis
- Neo4j query examples
- API testing

## 🗂️ Project Structure

```
course-scrape/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration settings
├── database.py            # Neo4j connection manager
├── data_loader.py         # CSV to Neo4j import script
├── models.py              # Pydantic data models
├── services/              # Business logic layer
│   ├── course_service.py
│   ├── recommendation_service.py
│   └── stats_service.py
├── data/
│   └── Coursera.csv       # Course dataset
├── notebook.ipynb         # Data exploration notebook
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🔍 Example Queries

### Find Python courses for beginners

```python
from services import CourseService

courses = CourseService.search_courses(
    query="Python",
    difficulty="Beginner",
    min_rating=4.5,
    limit=5
)
```

### Get similar courses

```python
from services import RecommendationService

similar = RecommendationService.get_similar_courses(
    course_id="abc123",
    limit=10
)
```

### Create learning path to Data Science

```python
path = RecommendationService.get_learning_path(
    target_skill="Data Science",
    max_courses=5
)
```

## 📈 Sample Cypher Queries

```cypher
-- Find most popular skills
MATCH (s:Skill)<-[:TEACHES]-(c:Course)
RETURN s.name, COUNT(c) as course_count
ORDER BY course_count DESC
LIMIT 20

-- Find learning path
MATCH path = (c1:Course)-[:TEACHES]->(:Skill)<-[:TEACHES]-(c2:Course)
WHERE c1.difficulty = 'Beginner'
  AND c2.difficulty = 'Advanced'
RETURN path
LIMIT 5

-- University rankings
MATCH (u:University)<-[:OFFERED_BY]-(c:Course)
RETURN u.name, COUNT(c) as courses, AVG(c.rating) as avg_rating
ORDER BY courses DESC
```

## 🎯 Use Cases

1. **Course Discovery**: Search 3,500+ courses by skills, difficulty, rating
2. **Personalized Recommendations**: Find similar courses based on content
3. **Skill Mapping**: Understand relationships between different skills
4. **Learning Path Planning**: Generate progression from beginner to expert
5. **University Comparison**: Analyze course offerings and quality

## 🔮 Future Enhancements

- [ ] User accounts and personalization
- [ ] Course prerequisite detection
- [ ] Semantic search using embeddings
- [ ] Course completion tracking
- [ ] Advanced skill gap analysis
- [ ] Integration with more course platforms (edX, Udemy, etc.)
- [ ] Web frontend (React/Vue)

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📧 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Built with ❤️ using Neo4j, FastAPI, and Python**
