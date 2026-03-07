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

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
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
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    const response = await authApi.get("/api/admin/users", { params });
    return response.data;
  },

  async adminUpdateRole(
    userId: string,
    role: "user" | "admin" | "moderator",
  ): Promise<{ success: boolean; message: string; data: User }> {
    const response = await authApi.patch(`/api/admin/users/${userId}/role`, { role });
    return response.data;
  },

  async adminUpdateStatus(
    userId: string,
    isActive: boolean,
  ): Promise<{ success: boolean; message: string; data: User }> {
    const response = await authApi.patch(`/api/admin/users/${userId}/status`, { isActive });
    return response.data;
  },

  async adminDeleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await authApi.delete(`/api/admin/users/${userId}`);
    return response.data;
  },
};

export default authApi;
