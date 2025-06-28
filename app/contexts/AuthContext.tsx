'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  authToken: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  getAuthHeaders: () => { Authorization: string } | {};
  createAuthenticatedRequest: (url: string, options?: RequestInit) => Promise<Response>;
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
  const [authToken, setAuthToken] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      // Kiểm tra xem có auth token trong localStorage không
      const storedToken = localStorage.getItem('auth_token');
      
      if (!storedToken) {
        setUser(null);
        setAuthToken(null);
        setIsLoading(false);
        return;
      }

      setAuthToken(storedToken);

      // Gọi API verify để kiểm tra token
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': storedToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token không hợp lệ, xóa khỏi localStorage
        localStorage.removeItem('auth_token');
        setUser(null);
        setAuthToken(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Tạo Basic Auth header
      const credentials = `${username}:${password}`;
      const base64Credentials = btoa(credentials);
      const authHeader = `Basic ${base64Credentials}`;

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Lưu auth token vào localStorage và state
        localStorage.setItem('auth_token', authHeader);
        setAuthToken(authHeader);
        
        return true;
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Gọi API logout
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Xóa thông tin user và token
      setUser(null);
      setAuthToken(null);
      localStorage.removeItem('auth_token');
    }
  };

  // Utility function để lấy auth headers
  const getAuthHeaders = () => {
    if (authToken) {
      return { Authorization: authToken };
    }
    return {};
  };

  // Utility function để tạo authenticated request
  const createAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    authToken,
    login,
    logout,
    checkAuth,
    getAuthHeaders,
    createAuthenticatedRequest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 