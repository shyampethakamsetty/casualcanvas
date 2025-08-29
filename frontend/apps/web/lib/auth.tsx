"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  is_active: boolean;
  role: string;
  created_at: string;
  last_login: string | null;
  preferences: Record<string, any>;
  profile: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const refreshAccessToken = async (): Promise<boolean> => {
    const storedRefreshToken = refreshToken || localStorage.getItem("refreshToken");
    
    if (!storedRefreshToken || isRefreshing) {
      return false;
    }

    setIsRefreshing(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.access_token;
        
        // Update tokens
        localStorage.setItem("token", newAccessToken);
        setToken(newAccessToken);
        
        // Fetch updated user data with new token directly without recursive validation
        try {
          const userResponse = await fetch(`${API_BASE}/api/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${newAccessToken}` }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
            console.log("Token refreshed successfully");
            return true;
          } else {
            throw new Error("Failed to fetch user data with new token");
          }
        } catch (userError) {
          console.error("Failed to fetch user data after refresh:", userError);
          throw userError;
        }
      } else {
        throw new Error(`Token refresh failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      // If refresh fails, logout user
      logout();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const validateTokenAndFetchUser = async (storedToken: string): Promise<boolean> => {
    try {
      // Make a direct fetch request to validate the token and get user data
      const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(storedToken);
        return true;
      } else if (response.status === 401 && !isRefreshing) {
        // Token expired, try to refresh only if not already refreshing
        console.log("Access token expired, attempting refresh...");
        const refreshed = await refreshAccessToken();
        return refreshed;
      } else {
        throw new Error(`Token validation failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      // Only logout if we're not in the middle of a refresh attempt
      if (!isRefreshing) {
        logout();
      }
      return false;
    }
  };

  useEffect(() => {
    // Check for existing tokens on mount
    const storedToken = localStorage.getItem("token");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    
    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken);
    }
    
    if (storedToken) {
      validateTokenAndFetchUser(storedToken).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    // Listen for logout events from API interceptor
    const handleLogout = () => {
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      router.push("/login");
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const login = async (newToken: string, newRefreshToken: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    setToken(newToken);
    setRefreshToken(newRefreshToken);
    
    try {
      // Fetch real user data from backend using direct fetch
      const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { 'Authorization': `Bearer ${newToken}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Redirect to workflows page after successful login
        router.push("/workflows" as any);
      } else {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // If fetching user data fails, still redirect but logout
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      refreshToken, 
      login, 
      logout, 
      refreshAccessToken, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 