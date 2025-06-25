'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
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
      // Kiểm tra xem có auth token trong localStorage không
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Gọi API để verify token
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
        // Token không hợp lệ, xóa khỏi localStorage
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
        
        // Lưu auth token vào localStorage
        localStorage.setItem('auth_token', authHeader);
        
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
      localStorage.removeItem('auth_token');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 