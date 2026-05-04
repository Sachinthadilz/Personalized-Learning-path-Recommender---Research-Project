import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";
const AUTH_API_BASE_URL = "http://localhost:5001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Separate axios instance for auth API
const authApi = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token for auth API
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export interface Course {
  id: string;
  name: string;
  url: string;
  description: string;
  rating: number;
  university?: string;
  difficulty?: string;
  skills?: string[];
}

export interface CourseDetail extends Course {
  similar_courses?: Course[];
}

export interface Skill {
  name: string;
  course_count: number;
}

export interface University {
  name: string;
  course_count: number;
}

export interface Stats {
  total_courses: number;
  total_universities: number;
  total_skills: number;
  total_relationships: number;
  avg_rating: number;
  top_universities: University[];
  top_skills: Skill[];
}

export interface AISearchResult extends Course {
  similarity_score: number;
}

export interface CrossDomainCourse {
  course: string;
  id: string;
  url: string;
  domain: string;
  rating: number;
  difficulty: string;
  similarity_score: number;
  skill_overlap: number;
  reason: string;
}

export interface LearningPathResponse {
  learning_path: {
    beginner: AISearchResult[];
    intermediate: AISearchResult[];
    advanced: AISearchResult[];
  };
  cross_domain_courses: CrossDomainCourse[];
  summary: {
    total_courses: number;
    beginner_count: number;
    intermediate_count: number;
    advanced_count: number;
    cross_domain_count: number;
  };
}

export interface SavedLearningPath {
  pathId: string;
  pathName: string;
  pathType: "ai_search" | "ai_generator" | "manual";
  targetSkill: string;
  courses: (Course | AISearchResult)[];
  metadata?: {
    difficulty?: string;
    totalCourses?: number;
    avgRating?: number;
    estimatedDuration?: string;
  };
  enrollment?: EnrollmentData;
  createdAt: string;
}

export interface CourseProgress {
  courseId: string;
  status: "locked" | "unlocked" | "completed";
  completedAt?: string;
  quizResult?: QuizResult;
}

export interface EnrollmentData {
  isEnrolled: boolean;
  enrolledAt?: string;
  currentCourseIndex: number;
  courseProgress: CourseProgress[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer?: number;
  userAnswer?: number;
  isCorrect?: boolean;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  questions: QuizQuestion[];
  completedAt?: string;
}

export interface QuizData {
  quizId?: string;
  courseId: string;
  courseName: string;
  questions: { question: string; options: string[] }[];
  _quizKey?: string;
}

// Course endpoints
export const getCourses = async (skip = 0, limit = 20): Promise<Course[]> => {
  const response = await api.get("/courses", { params: { skip, limit } });
  return response.data;
};

export const getCourseById = async (
  courseId: string,
): Promise<CourseDetail> => {
  const response = await api.get(`/courses/${courseId}`);
  return response.data;
};

export const searchCourses = async (
  query: string,
  skills?: string[],
  difficulty?: string,
  minRating?: number,
  limit = 20,
): Promise<Course[]> => {
  const response = await api.post("/courses/search", {
    query,
    skills,
    difficulty,
    min_rating: minRating,
    limit,
  });
  return response.data;
};

export const getCoursesBySkill = async (
  skill: string,
  limit = 10,
): Promise<Course[]> => {
  const response = await api.get(
    `/courses/by-skill/${encodeURIComponent(skill)}`,
    {
      params: { limit },
    },
  );
  return response.data;
};

// Recommendation endpoints
export const getSimilarCourses = async (
  courseId: string,
  limit = 10,
): Promise<Course[]> => {
  const response = await api.get(`/recommendations/similar/${courseId}`, {
    params: { limit },
  });
  return response.data;
};

export const getRecommendations = async (
  courseId?: string,
  skills?: string[],
  difficulty?: string,
  limit = 10,
): Promise<Course[]> => {
  const response = await api.post("/recommendations", {
    course_id: courseId,
    skills,
    difficulty,
    limit,
  });
  return response.data;
};

export const getPopularCourses = async (limit = 10): Promise<Course[]> => {
  const response = await api.get("/recommendations/popular", {
    params: { limit },
  });
  return response.data;
};

export const getLearningPath = async (
  targetSkill: string,
  startCourseId?: string,
  maxCourses = 5,
): Promise<Course[]> => {
  const response = await api.post("/learning-path", {
    target_skill: targetSkill,
    start_course_id: startCourseId,
    max_courses: maxCourses,
  });
  return response.data;
};

// Skill endpoints
export const getAllSkills = async (limit = 100): Promise<Skill[]> => {
  const response = await api.get("/skills", { params: { limit } });
  return response.data;
};

export const getRelatedSkills = async (
  skill: string,
  limit = 10,
): Promise<string[]> => {
  const response = await api.get(
    `/skills/${encodeURIComponent(skill)}/related`,
    {
      params: { limit },
    },
  );
  return response.data;
};

// University endpoints
export const getAllUniversities = async (
  limit = 100,
): Promise<University[]> => {
  const response = await api.get("/universities", { params: { limit } });
  return response.data;
};

// Stats endpoints
export const getStats = async (): Promise<Stats> => {
  const response = await api.get("/stats");
  return response.data;
};

// AI Search endpoints
export const aiSemanticSearch = async (
  query: string,
  limit = 10,
): Promise<LearningPathResponse> => {
  const response = await api.post("/ai-search", { query, limit });
  return response.data;
};

// Health check
export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get("/health");
  return response.data;
};

// Learning Path Management endpoints (Auth API)
export const saveLearningPath = async (learningPath: {
  pathName: string;
  pathType: "ai_search" | "ai_generator" | "manual";
  targetSkill: string;
  courses: (Course | AISearchResult)[];
  metadata?: {
    difficulty?: string;
    totalCourses?: number;
    avgRating?: number;
    estimatedDuration?: string;
  };
}): Promise<{
  success: boolean;
  data: { pathId: string; savedPath: SavedLearningPath };
}> => {
  const response = await authApi.post("/api/learning-paths", learningPath);
  return response.data;
};

export const getSavedLearningPaths = async (): Promise<{
  success: boolean;
  data: { learningPaths: SavedLearningPath[]; count: number };
}> => {
  const response = await authApi.get("/api/learning-paths");
  return response.data;
};

export const getSavedLearningPath = async (
  pathId: string,
): Promise<{ success: boolean; data: SavedLearningPath }> => {
  const response = await authApi.get(`/api/learning-paths/${pathId}`);
  return response.data;
};

export const updateLearningPathName = async (
  pathId: string,
  pathName: string,
): Promise<{ success: boolean; data: SavedLearningPath }> => {
  const response = await authApi.patch(`/api/learning-paths/${pathId}`, {
    pathName,
  });
  return response.data;
};

export const deleteLearningPath = async (
  pathId: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await authApi.delete(`/api/learning-paths/${pathId}`);
  return response.data;
};

// Enrollment & Quiz endpoints (Auth API)
export const enrollInPath = async (
  pathId: string,
): Promise<{
  success: boolean;
  message: string;
  data: { enrollment: EnrollmentData };
}> => {
  const response = await authApi.post(`/api/learning-paths/${pathId}/enroll`);
  return response.data;
};

export const getEnrollmentStatus = async (
  pathId: string,
): Promise<{ success: boolean; data: { enrollment: EnrollmentData } }> => {
  const response = await authApi.get(
    `/api/learning-paths/${pathId}/enrollment`,
  );
  return response.data;
};

export const generateQuiz = async (
  pathId: string,
  courseId: string,
): Promise<{ success: boolean; data: QuizData }> => {
  const response = await authApi.post(
    `/api/learning-paths/${pathId}/courses/${courseId}/quiz`,
  );
  return response.data;
};

export const submitQuiz = async (
  pathId: string,
  courseId: string,
  answers: number[],
  quizData: QuizData,
): Promise<{
  success: boolean;
  message: string;
  data: {
    result: QuizResult;
    nextCourseUnlocked: boolean;
    enrollment: EnrollmentData;
  };
}> => {
  const response = await authApi.post(
    `/api/learning-paths/${pathId}/courses/${courseId}/submit-quiz`,
    { answers, quizData },
  );
  return response.data;
};

export const unenrollFromPath = async (
  pathId: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await authApi.post(`/api/learning-paths/${pathId}/unenroll`);
  return response.data;
};

// ── Activity Timeline ─────────────────────────────────────────────────────────

export interface TimelineDataPoint {
  date: string; // "YYYY-MM-DD"
  events: number;
  total_duration: number; // seconds
}

export const fetchActivityTimeline = async (
  studentId: string,
  courseId?: string,
  startDate?: string,
  endDate?: string,
): Promise<TimelineDataPoint[]> => {
  const params: Record<string, string> = {};
  if (courseId) params.course_id = courseId;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const response = await authApi.get(`/logs/timeline/${studentId}`, { params });
  return response.data;
};

// ── Video Activity Logs ───────────────────────────────────────────────────────

export interface VideoActivityLog {
  log_id: string;
  student_id: string;
  course_id: string;
  event_type: string;
  timestamp: string;
  duration: number | null;
}

export const fetchVideoActivityLogs = async (
  studentId: string,
  courseId?: string,
): Promise<VideoActivityLog[]> => {
  const baseParams: Record<string, string> = { limit: "500" };
  if (courseId) baseParams.course_id = courseId;

  // Fetch play events (for session counts) + pause/complete events (for watch durations)
  // in parallel, then combine.
  const [playRes, pauseRes, completeRes] = await Promise.all([
    authApi.get(`/logs/${studentId}`, {
      params: { ...baseParams, event_type: "video_play" },
    }),
    authApi.get(`/logs/${studentId}`, {
      params: { ...baseParams, event_type: "video_pause" },
    }),
    authApi.get(`/logs/${studentId}`, {
      params: { ...baseParams, event_type: "video_complete" },
    }),
  ]);

  return [...playRes.data, ...pauseRes.data, ...completeRes.data];
};

// ── Quiz Marks ────────────────────────────────────────────────────────────────

export interface CourseQuizMark {
  pathId: string;
  pathName: string;
  courseId: string;
  courseName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
}

export interface ProgressQuizMark {
  subjectId: string;
  subjectName: string;
  score: number;
  total: number;
  percentage: number;
  band: string;
  takenAt: string;
}

export interface SubjectMark {
  subjectName: string;
  marks: number; // 0–100
  grade: string | null;
  isWeak: boolean;
  difficulty: number | null;
  confidence: number | null;
  source: "study_material" | "profile" | "adaptive";
}

export interface QuizMarksResponse {
  courseQuizMarks: CourseQuizMark[];
  progressQuizMarks: ProgressQuizMark[];
  subjectMarks: SubjectMark[];
  summary: {
    totalCourseQuizzes: number;
    totalProgressQuizzes: number;
    totalSubjectMarks: number;
    overallAverage: number | null;
  };
}

export const fetchQuizMarks = async (): Promise<QuizMarksResponse> => {
  const response = await authApi.get("/api/quiz-marks");
  // Controller wraps in { success, data: { ... } }
  return response.data.data ?? response.data;
};

// ── Learner Profile Prediction ────────────────────────────────────────────────

export interface LearnerProfileInput {
  gender: string;
  region: string;
  highest_education: string;
  imd_band: string;
  age_band: string;
  disability: string;
  code_module: string;
  code_presentation: string;
  total_clicks: number;
  days_active: number;
  max_daily_clicks: number;
  mean_daily_clicks: number;
  early_clicks: number;
  mean_score: number;
  num_assessments: number;
  first_reg_before_start: number;
  ever_unregistered: number;
  num_of_prev_attempts: number;
  studied_credits: number;
}

export interface AutoLearnerProfileInput {
  student_id: string;
  course_id?: string;
  code_module?: string;
  code_presentation?: string;
}

export interface LearnerProfileResult {
  learner_profile: string;
  profile_confidence: number;
  predicted_outcome: string;
  outcome_confidence: number;
  risk_prediction: string;
  risk_score: number;
  learning_path_recommendation: Record<string, any>;
}

export const predictLearnerProfile = async (
  input: LearnerProfileInput,
): Promise<LearnerProfileResult> => {
  const response = await api.post("/predict-learner-profile", input);
  return response.data;
};

export const predictLearnerProfileAuto = async (
  input: AutoLearnerProfileInput,
): Promise<LearnerProfileResult> => {
  const response = await authApi.post("/predict/auto", input, {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  return response.data;
};

export default api;
