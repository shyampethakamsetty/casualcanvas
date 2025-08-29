"use client";
import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios";

const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const ax = axios.create({ baseURL: base + "/api/v1" });

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

ax.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (t) {
    cfg.headers.set('Authorization', `Bearer ${t}`);
  }
  return cfg;
});

// Response interceptor to handle token refresh
ax.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && typeof window !== "undefined") {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return ax(original);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await fetch(`${base}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          const newAccessToken = data.access_token;
          
          // Update stored token
          localStorage.setItem("token", newAccessToken);
          
          // Update default auth header
          ax.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          
          // Process queued requests
          processQueue(null, newAccessToken);
          
          // Retry original request with new token
          original.headers.Authorization = `Bearer ${newAccessToken}`;
          return ax(original);
        } else {
          throw new Error("Token refresh failed");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clear tokens and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        
        // Trigger logout by dispatching a custom event
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

interface User {
  id: string;
  email: string;
  is_active: boolean;
  role: string;
  created_at: string;
  last_login?: string;
  preferences: Record<string, any>;
  profile: Record<string, any>;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const api = {
  async get(path: string, params?: any) { 
    const r = await ax.get(path, { params }); 
    return r.data; 
  },
  async post(path: string, body?: any) { 
    const r = await ax.post(path, body); 
    return r.data; 
  },
  async put(path: string, body?: any) { 
    const r = await ax.put(path, body); 
    return r.data; 
  },
  async delete(path: string) { 
    const r = await ax.delete(path); 
    return r.data; 
  },

  // User management methods
  async updateUserProfile(preferences?: Record<string, any>, profile?: Record<string, any>) {
    const updateData: any = {};
    if (preferences !== undefined) updateData.preferences = preferences;
    if (profile !== undefined) updateData.profile = profile;

    return this.put("/auth/me", updateData);
  },

  async getUserProfile() {
    return this.get("/auth/me");
  },

  // Admin functions
  async listUsers(skip = 0, limit = 50) {
    return this.get(`/auth/users?skip=${skip}&limit=${limit}`);
  },

  async getUser(userId: string) {
    return this.get(`/auth/users/${userId}`);
  },

  async updateUser(userId: string, updateData: any) {
    return this.put(`/auth/users/${userId}`, updateData);
  },

  async deleteUser(userId: string) {
    return this.delete(`/auth/users/${userId}`);
  }
};
