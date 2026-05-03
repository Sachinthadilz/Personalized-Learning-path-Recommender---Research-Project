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
  isActive?: boolean;
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

export interface MindMapNode {
  id?: string;
  label: string;
  children?: MindMapNode[];
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
  subject?: string;
  subjectName?: string;
  marks?: number;
  grade?: string;
  summary?: string;
  keyTopics?: string[];
  mindMap: MindMapNode | { title: string; nodes: MindMapNode[] };
  timetable?: WeekDay[];
  notes?: NoteSection[];
  practiceSet?: PracticeItem[];
  weeklyPlan?: {
    day: string;
    topic: string;
    activities: string[];
  }[];
  resources?: {
    title: string;
    type: string;
    url?: string;
  }[];
  practiceQuestions?: {
    question: string;
    answer: string;
  }[];
  quizQuestions?: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
  generatedAt?: string;
}

export interface StudyMaterialResponse {
  success: boolean;
  data: StudyMaterialData | null;
  cached?: boolean;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface AdminQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface AdminQuizBankItem {
  id: string;
  courseKey: string;
  courseId?: string | null;
  courseName: string;
  courseDescription?: string;
  difficulty?: string;
  skills?: string[];
  questions?: AdminQuizQuestion[];
  createdBy: "ai" | "admin";
  sourceModel?: string;
  updatedAt: string;
  createdAt: string;
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
    // Don't save tokens on registration - user must login separately
    // Only return the response without auto-authenticating
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
      localStorage.setItem("student_id", String(response.data.data.user.id));
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
      localStorage.removeItem("student_id");
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await authApi.get<ProfileResponse>("/api/auth/profile");
    if (response.data.success) {
      localStorage.setItem("user", JSON.stringify(response.data.data));
      localStorage.setItem("student_id", String(response.data.data.id));
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
      localStorage.setItem("student_id", String(response.data.data.id));
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
      localStorage.removeItem("student_id");
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
        const user = JSON.parse(userStr);
        // Ensure the flat student_id key always exists for the browser extension
        if (
          user?.id &&
          localStorage.getItem("student_id") !== String(user.id)
        ) {
          localStorage.setItem("student_id", String(user.id));
        }
        return user;
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

  /**
   * Check if current user has admin role
   */
  isAdmin(): boolean {
    const user = authService.getCurrentUser();
    return user?.role === "admin";
  },

  // ── Admin API methods (require admin role) ─────────────────────────────

  async adminGetCurrentAdmin(): Promise<{ success: boolean; data: User }> {
    const response = await authApi.get("/api/admin/me");
    return response.data;
  },

  async adminGetStats(): Promise<{
    success: boolean;
    data: {
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      verifiedUsers: number;
      newUsersThisMonth: number;
      roleBreakdown: Record<string, number>;
    };
  }> {
    const response = await authApi.get("/api/admin/stats");
    return response.data;
  },

  async adminGetUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    success: boolean;
    data: {
      users: User[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    };
  }> {
    const response = await authApi.get("/api/admin/users", { params });
    return response.data;
  },

  async adminUpdateRole(
    userId: string,
    role: "user" | "admin" | "moderator",
  ): Promise<{ success: boolean; message: string; data: User }> {
    const response = await authApi.patch(`/api/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  },

  async adminUpdateStatus(
    userId: string,
    isActive: boolean,
  ): Promise<{ success: boolean; message: string; data: User }> {
    const response = await authApi.patch(`/api/admin/users/${userId}/status`, {
      isActive,
    });
    return response.data;
  },

  async adminDeleteUser(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await authApi.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  async adminGetQuizzes(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    success: boolean;
    data: {
      quizzes: AdminQuizBankItem[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    };
  }> {
    const response = await authApi.get("/api/admin/quizzes", { params });
    return response.data;
  },

  async adminGetQuizById(quizId: string): Promise<{
    success: boolean;
    data: AdminQuizBankItem;
  }> {
    const response = await authApi.get(`/api/admin/quizzes/${quizId}`);
    return response.data;
  },

  async adminUpdateQuiz(
    quizId: string,
    payload: {
      courseName?: string;
      courseDescription?: string;
      difficulty?: string;
      skills?: string[];
      questions?: AdminQuizQuestion[];
    },
  ): Promise<{
    success: boolean;
    message: string;
    data: AdminQuizBankItem;
  }> {
    const response = await authApi.patch(
      `/api/admin/quizzes/${quizId}`,
      payload,
    );
    return response.data;
  },

  async adminDeleteQuiz(
    quizId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await authApi.delete(`/api/admin/quizzes/${quizId}`);
    return response.data;
  },

  /**
   * Request a new email verification link (for logged-in user)
   */
  async requestVerification(): Promise<{ success: boolean; message: string }> {
    const response = await authApi.post("/api/auth/request-verification");
    return response.data;
  },

  /**
   * Request password reset email (public)
   */
  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await authApi.post("/api/auth/forgot-password", { email });
    return response.data;
  },

  /**
   * Reset password with token (public)
   */
  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await authApi.post(`/api/auth/reset-password/${token}`, {
      password,
    });
    return response.data;
  },

  /**
   * Get academic profile for the logged-in user (null if not yet created)
   */
  async getAcademicProfile(): Promise<AcademicProfileResponse> {
    const response = await authApi.get<AcademicProfileResponse>("/api/profile");
    return response.data;
  },

  /**
   * Create or replace academic profile (onboarding submission)
   */
  async saveAcademicProfile(
    data: Omit<
      AcademicProfile,
      "_id" | "user" | "onboardingCompleted" | "createdAt" | "updatedAt"
    >,
  ): Promise<AcademicProfileResponse> {
    const response = await authApi.post<AcademicProfileResponse>(
      "/api/profile",
      data,
    );
    return response.data;
  },

  /**
   * Partially update an existing academic profile
   */
  async updateAcademicProfile(
    data: Partial<
      Omit<AcademicProfile, "_id" | "user" | "createdAt" | "updatedAt">
    >,
  ): Promise<AcademicProfileResponse> {
    const response = await authApi.patch<AcademicProfileResponse>(
      "/api/profile",
      data,
    );
    return response.data;
  },

  /**
   * Get cached study material for a subject (null if not yet generated)
   */
  async getStudyMaterial(subjectName: string): Promise<StudyMaterialResponse> {
    const response = await authApi.get<StudyMaterialResponse>(
      `/api/study-material?subject=${encodeURIComponent(subjectName)}`,
    );
    return response.data;
  },

  /**
   * Generate (or return fresh cached) study material for a subject
   */
  async generateStudyMaterial(
    subjectName: string,
    marks?: number,
    grade?: string,
    forceRegenerate = false,
  ): Promise<StudyMaterialResponse> {
    const response = await authApi.post<StudyMaterialResponse>(
      "/api/study-material/generate",
      {
        subjectName,
        marks,
        grade,
        forceRegenerate,
      },
    );
    return response.data;
  },
};

export default authApi;
