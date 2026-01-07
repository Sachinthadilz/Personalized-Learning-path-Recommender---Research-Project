# Personalized Learning Path Recommender - Research Project

<p align="center">
  <img src="images/A_clean_professional_2k_202601050032.jpeg" alt="Learning Path Recommender Banner" width="100%" />
</p>

The Personalized Learning Path Recommender is an applied research and system-development project that leverages Neo4j knowledge graphs and AI-driven recommendations to create personalized learning paths for university students, optimizing their course selection and academic progression.

At its core, this system addresses a critical need in higher education: university undergraduates often struggle with course selection, understanding skill dependencies, and planning optimal learning progressions. The system provides a digital ecosystem that connects course discovery, skill mapping, personalized recommendations, and intelligent path planning into one cohesive platform.

The project aims to become a pioneering AI-powered academic planning tool. By integrating knowledge graphs, machine learning algorithms, and cross-domain course analysis, it enhances student learning experiences and improves educational outcomes for university undergraduates.

## 📃 Overall System Architecture

<p align="center">
  <img src="images/Overall System Diagram.drawio.png" alt="Overall architecture diagram" />
</p>

## 🧩 Core System Components

| Component                                                  | Description                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Course Knowledge Graph Generator**                       | • Extracts concepts and relationships from course data.<br>• Builds graph structure representing course dependencies and skill mappings.<br>• Integrates with massive open online course (MOOC) data sources.                                                                                                                                                                                                    |
| **Course Prioritization & Timetable Generator (ML-based)** | • Understands selected courses and matches with credit values.<br>• Collects assigned credits and prioritizes by weight.<br>• Generates optimized timetables using machine learning algorithms.                                                                                                                                                                                                                  |
| **Learner Profile Classifier**                             | • Data preprocessing and embedding generation for student categorization.<br>• Classification model for personalized learner profiles.<br>• Tracks learning patterns and skill acquisition.                                                                                                                                                                                                                      |
| **Progress Tracking & Adaptive Visualizer**                | Identifies weak subjects using learner self-input, mentor/team feedback, and performance data.<br>• Generates personalized supports (mind maps, timetables, short notes) for targeted improvement.<br>• Runs quizzes to validate mastery and provides progress visualizations with feedback comments.<br>• Triggers adaptive retraining (interactive activities/games) and repeats assessment until improvement. |

## Research Purpose

This research aims to develop and evaluate an AI-driven knowledge graph ecosystem that supports university undergraduates by:

- Enhancing course discovery through intelligent search and filtering
- Reducing decision-making complexity using data-driven recommendations
- Providing structured and adaptive learning path planning
- Delivering personalized skill-based course suggestions to improve learning outcomes

## Methodology

The project follows a rigorous, data-driven, and user-centered approach that includes:

- **Graph-based data modeling** combining course relationships, skills, and university metadata
- **Machine learning algorithms** for course similarity, recommendation generation, and path optimization
- **Neo4j knowledge graph** for efficient relationship traversal and pattern discovery
- **RESTful API architecture** for scalable, secure, and modular service integration

## 🔗 System Dependencies

| Category                        | Technologies / Tools                                               | Purpose                                                                                     |
| ------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Frontend (Web Application)**  | React, TypeScript, Vite, D3.js, TailwindCSS, Axios                 | Builds the student-facing web application with interactive visualizations and responsive UI |
| **Backend & API Services**      | Python, FastAPI, Uvicorn, Pydantic, JWT, dotenv                    | Manages authentication, business logic, secure RESTful APIs, and data validation            |
| **Graph Database**              | Neo4j 5.x, Cypher Query Language, Neo4j Driver for Python          | Stores and queries course relationships, skills, and learning path connections efficiently  |
| **AI / Machine Learning**       | Sentence-Transformers, Scikit-learn, Pandas, NumPy                 | Enables semantic search, course similarity analysis, and personalized recommendations       |
| **Data Processing**             | Python, Pandas, NumPy, Matplotlib, Seaborn                         | Handles data cleaning, preprocessing, analysis, and visualization in Jupyter notebooks      |
| **Cloud & Storage**             | Neo4j Aura (optional), CSV data storage, REST APIs                 | Provides scalable database hosting, data persistence, and service communication             |
| **Security**                    | Environment Variables (.env), Password Hashing, CORS Configuration | Ensures secure API access, credential management, and cross-origin resource sharing         |
| **Development & Collaboration** | Git, GitHub, VS Code, Postman, Jupyter Notebooks                   | Supports version control, API testing, data exploration, and development workflows          |

## 🏷️ Expected Outcomes

- Improved course selection efficiency and academic planning
- Reduced decision-making complexity for students
- AI-powered personalized learning path recommendations
- Enhanced skill mapping and prerequisite understanding
- A scalable knowledge graph solution for educational institutions

## 👥 Research Team

| Name                   | Role                   | GitHub                                                     |
| ---------------------- | ---------------------- | ---------------------------------------------------------- |
| **Disanayaka H.M.S.D** | Researcher / Team Lead | [@Sachinthadilz](https://github.com/Sachinthadilz)         |
| **Rajapaksha.H**       | Researcher             | [@himashirajapaksha](https://github.com/himashirajapaksha) |
| **Thennakoon H.M.U.N** | Researcher             | [@UdithaNeth](https://github.com/UdithaNeth)               |
| **Nirmani A.K.G.B**    | Researcher             | [@Bawanthika](https://github.com/Bawanthika)               |
