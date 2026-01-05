import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

// Course endpoints
export const getCourses = async (skip = 0, limit = 20): Promise<Course[]> => {
  const response = await api.get("/courses", { params: { skip, limit } });
  return response.data;
};

export const getCourseById = async (
  courseId: string
): Promise<CourseDetail> => {
  const response = await api.get(`/courses/${courseId}`);
  return response.data;
};

export const searchCourses = async (
  query: string,
  skills?: string[],
  difficulty?: string,
  minRating?: number,
  limit = 20
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
  limit = 10
): Promise<Course[]> => {
  const response = await api.get(
    `/courses/by-skill/${encodeURIComponent(skill)}`,
    {
      params: { limit },
    }
  );
  return response.data;
};

// Recommendation endpoints
export const getSimilarCourses = async (
  courseId: string,
  limit = 10
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
  limit = 10
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
  maxCourses = 5
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
  limit = 10
): Promise<string[]> => {
  const response = await api.get(
    `/skills/${encodeURIComponent(skill)}/related`,
    {
      params: { limit },
    }
  );
  return response.data;
};

// University endpoints
export const getAllUniversities = async (
  limit = 100
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
  limit = 10
): Promise<LearningPathResponse> => {
  const response = await api.post("/ai-search", { query, limit });
  return response.data;
};

// Health check
export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get("/health");
  return response.data;
};

export default api;
