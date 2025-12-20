# Course Knowledge Graph - Setup Guide

## Step-by-Step Installation

### 1. Neo4j Setup

#### Option A: Neo4j Desktop (Recommended for Development)

1. **Download Neo4j Desktop**

   - Visit https://neo4j.com/download/
   - Download for your OS (Windows/Mac/Linux)

2. **Install and Launch**

   - Install Neo4j Desktop
   - Open the application

3. **Create a Project**

   - Click "New Project"
   - Name it "Course Knowledge Graph"

4. **Create a Database**

   - Click "Add Database"
   - Choose "Create a Local Database"
   - Set password (remember this!)
   - Version: 5.x (latest)
   - Click "Create"

5. **Start the Database**

   - Click "Start" on your database
   - Wait for it to say "Active"

6. **Note Your Connection Details**
   - URI: `bolt://localhost:7687` (default)
   - Username: `neo4j`
   - Password: (what you set)

#### Option B: Neo4j Aura (Cloud - Free Tier Available)

1. Visit https://neo4j.com/cloud/aura/
2. Sign up for free tier
3. Create new instance
4. Save connection credentials

### 2. Python Environment Setup

1. **Open Terminal/PowerShell**

   ```bash
   cd "c:\Users\DananjayaAbey\Desktop\course scrape"
   ```

2. **Create Virtual Environment (Optional but Recommended)**

   ```bash
   python -m venv venv

   # Activate (Windows PowerShell)
   .\venv\Scripts\Activate.ps1

   # Or (Windows CMD)
   venv\Scripts\activate.bat
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### 3. Configuration

1. **Create .env file**

   ```bash
   Copy-Item .env.example .env
   ```

2. **Edit .env with your Neo4j credentials**

   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_actual_password_here

   API_HOST=0.0.0.0
   API_PORT=8000
   API_RELOAD=True
   ```

### 4. Import Data

Run the data import script:

```bash
python data_loader.py
```

Expected output:

```
INFO: Loading data from data/Coursera.csv
INFO: Loaded 3532 courses
INFO: Successfully connected to Neo4j
INFO: Created index: course_id
INFO: Created index: course_name
INFO: Created index: skill_name
...
INFO: Import complete! Statistics:
  total_courses: 3532
  total_universities: 345
  total_skills: 1250
  total_relationships: 25000+
```

### 5. Start the API

```bash
python main.py
```

You should see:

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 6. Test the API

Open your browser:

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### 7. Explore with Jupyter

```bash
jupyter notebook notebook.ipynb
```

Or if using VS Code, just open the notebook file.

## Troubleshooting

### Issue: Neo4j Connection Failed

**Error**: `Failed to connect to Neo4j: Unable to retrieve routing information`

**Solutions**:

1. Check Neo4j is running (should show "Active" in Neo4j Desktop)
2. Verify connection details in `.env`
3. Test connection in Neo4j Browser: http://localhost:7474
4. Ensure no firewall blocking port 7687

### Issue: Import Errors

**Error**: `Import "neo4j" could not be resolved`

**Solution**:

```bash
pip install neo4j pandas python-dotenv
```

### Issue: Data Import Slow

**Normal**: Importing 3,500+ courses takes 2-5 minutes

- Progress is logged every 100 courses
- Be patient!

### Issue: Port Already in Use

**Error**: `Address already in use`

**Solution**:

```bash
# Change port in .env
API_PORT=8001
```

Or kill the process using port 8000

## Verification Checklist

✅ Neo4j Database is running  
✅ Python dependencies installed  
✅ .env file configured  
✅ Data imported successfully  
✅ API server starts without errors  
✅ Can access http://localhost:8000/docs  
✅ Can query courses via API

## Next Steps

1. **Explore the API**: Try different endpoints in Swagger UI
2. **Run Notebook**: Visualize the data and test queries
3. **Query Neo4j**: Open Neo4j Browser and run Cypher queries
4. **Build Features**: Extend the API with new functionality

## Example Usage

### Test in Python

```python
import requests

# Health check
response = requests.get("http://localhost:8000/health")
print(response.json())

# Search courses
response = requests.post(
    "http://localhost:8000/courses/search",
    json={
        "query": "Python",
        "min_rating": 4.5,
        "limit": 5
    }
)
courses = response.json()
for course in courses:
    print(f"{course['name']} - {course['rating']}⭐")
```

### Test with cURL

```bash
# Get statistics
curl http://localhost:8000/stats

# Search courses
curl -X POST http://localhost:8000/courses/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Machine Learning", "limit": 5}'
```

## Need Help?

- Check Neo4j Browser: http://localhost:7474
- View API logs in terminal
- Review Neo4j Desktop logs
- Open an issue on GitHub
