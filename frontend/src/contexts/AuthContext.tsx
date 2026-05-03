import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService";
import type {
  AuthResponse,
  LoginData,
  RegisterData,
  User,
} from "../services/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (data: {
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getCurrentUser();
        const token = authService.getAccessToken();

        if (storedUser && token) {
          // Verify token is still valid
          const isValid = await authService.verifyToken();
          if (isValid) {
            setUser(storedUser);
          } else {
            // Token invalid, clear auth
            await authService.logout();
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (data: LoginData) => {
    try {
      const response = await authService.login(data);
      setUser(response.data.user);
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      // Don't auto-authenticate on registration
      // User must login separately after account creation
      // Return success without setting user
      return response;
    } catch (error: any) {
      console.error("Registration failed:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Always clear user state, even if API call fails
      setUser(null);
    }
  }, []);

  const updateUser = useCallback(
    async (data: { firstName?: string; lastName?: string }) => {
      try {
        const response = await authService.updateProfile(data);
        setUser(response.data);
      } catch (error) {
        console.error("Profile update failed:", error);
        throw error;
      }
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data);
      // Sync with localStorage
      const stored = authService.getCurrentUser();
      if (stored) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, updateUser, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
