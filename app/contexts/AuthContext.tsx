'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean, error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      // Check if there's auth token in localStorage
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Call API to verify token
      const response = await fetch('/api/auth/login', {
        method: 'GET',
        headers: {
          'Authorization': authToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token is invalid, remove from localStorage
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'GET',
        headers: {
          'Authorization': authToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Session expired, logout
        await logout();
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      await logout();
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean, error?: string }> => {
    try {
      setIsLoading(true);
      const credentials = `${username}:${password}`;
      const base64Credentials = btoa(credentials);
      const authHeader = `Basic ${base64Credentials}`;

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        },
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('auth_token', authHeader);
        return { success: true };
      } else {
        // Return error from API if any
        return { success: false, error: data?.error || 'Tên đăng nhập hoặc mật khẩu không đúng' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Không gọi API logout nữa, chỉ xóa token ở client
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Remove user info and token
      setUser(null);
      localStorage.removeItem('auth_token');
    }
  };

  // Auto-refresh session every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refreshSession();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Listen for storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        if (e.newValue) {
          checkAuth();
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    checkAuth,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 