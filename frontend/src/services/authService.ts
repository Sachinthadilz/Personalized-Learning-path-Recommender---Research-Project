import axios, { AxiosError } from "axios";

const AUTH_API_BASE_URL = "http://localhost:5001";

const authApi = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle token refresh
authApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${AUTH_API_BASE_URL}/api/auth/refresh-token`,
            { refreshToken },
          );

          const { accessToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return authApi(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  isEmailVerified?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: User;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface AcademicModule {
  moduleId?: string;
  name: string;
  credits: number;
}

export interface AcademicWeakSubject {
  name: string;
  grade: string;
  marks: number;
}

export interface AcademicProfile {
  _id?: string;
  user?: string;
  university: string;
  degree: string;
  yearOfStudy: number;
  modules: AcademicModule[];
  weakSubjects?: AcademicWeakSubject[];
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicProfileResponse {
  success: boolean;
  data: AcademicProfile | null;
}

// Auth API functions
export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>(
      "/api/auth/register",
      data,
    );
    if (response.data.success) {
      // Save tokens and user to localStorage
      localStorage.setItem("accessToken", response.data.data.accessToken);
      localStorage.setItem("refreshToken", response.data.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>("/api/auth/login", data);
    if (response.data.success) {
      // Save tokens and user to localStorage
      localStorage.setItem("accessToken", response.data.data.accessToken);
      localStorage.setItem("refreshToken", response.data.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authApi.post("/api/auth/logout", { refreshToken });
      }
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await authApi.get<ProfileResponse>("/api/auth/profile");
    if (response.data.success) {
      localStorage.setItem("user", JSON.stringify(response.data.data));
    }
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
  }): Promise<ProfileResponse> {
    const response = await authApi.put<ProfileResponse>(
      "/api/auth/profile",
      data,
    );
    if (response.data.success) {
      localStorage.setItem("user", JSON.stringify(response.data.data));
    }
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await authApi.put("/api/auth/change-password", data);
    // After password change, user needs to login again
    if (response.data.success) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
    return response.data;
  },

  /**
   * Verify if token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await authApi.get("/api/auth/verify");
      return response.data.success;
    } catch {
      return false;
    }
  },

  /**
   * Get user from localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem("accessToken");
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  },

  // ─── Academic Profile (Onboarding) ────────────────────────────────────────

  /**
   * Fetch the academic profile for the logged-in user.
   * Returns { success: true, data: null } when onboarding not yet done.
   */
  async getAcademicProfile(): Promise<AcademicProfileResponse> {
    const response = await authApi.get<AcademicProfileResponse>("/api/profile");
    return response.data;
  },

  /**
   * Save (create or replace) the academic profile on onboarding completion.
   */
  async saveAcademicProfile(data: Omit<AcademicProfile, "_id" | "user" | "onboardingCompleted" | "createdAt" | "updatedAt">): Promise<AcademicProfileResponse> {
    const response = await authApi.post<AcademicProfileResponse>("/api/profile", data);
    return response.data;
  },

  // ─── Study Material (Groq AI generated) ───────────────────────────────────

  /**
   * Fetch cached study material for a subject (returns null if not generated yet).
   */
  async getStudyMaterial(subjectName: string): Promise<StudyMaterialResponse> {
    const response = await authApi.get<StudyMaterialResponse>(
      `/api/study-material?subject=${encodeURIComponent(subjectName)}`
    );
    return response.data;
  },

  /**
   * Generate (or return fresh cache) AI study material for a subject.
   * Falls back to stale cache if Groq API key is not configured.
   */
  async generateStudyMaterial(
    subjectName: string,
    marks?: number,
    grade?: string,
    forceRegenerate?: boolean
  ): Promise<StudyMaterialResponse> {
    const response = await authApi.post<StudyMaterialResponse>(
      "/api/study-material/generate",
      { subjectName, marks, grade, forceRegenerate: forceRegenerate ?? false }
    );
    return response.data;
  },
};

export default authApi;

// ─── Study Material types ──────────────────────────────────────────────────

export interface MindMapNode {
  label: string;
  children?: { label: string }[];
}

export interface NoteSection {
  title: string;
  bullets: string[];
}

export interface WeekDay {
  day: string;
  slots: string[];
}

export interface PracticeItem {
  question: string;
  answer: string;
}

export interface StudyMaterialData {
  _id?: string;
  subjectName: string;
  marks?: number;
  grade?: string;
  mindMap: { title: string; nodes: MindMapNode[] };
  timetable: WeekDay[];
  notes: NoteSection[];
  practiceSet: PracticeItem[];
  quizQuestions?: { question: string; options: string[]; correctIndex: number }[];
  generatedAt?: string;
}

export interface StudyMaterialResponse {
  success: boolean;
  data: StudyMaterialData | null;
  cached?: boolean;
}
