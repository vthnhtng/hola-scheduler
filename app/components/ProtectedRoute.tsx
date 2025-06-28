'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'scheduler' | 'viewer';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, authToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Chờ cho đến khi authentication check hoàn thành
    if (isLoading) {
      return;
    }

    // Nếu không có user hoặc token, redirect đến login
    if (!user || !authToken) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    // Kiểm tra quyền truy cập nếu có yêu cầu role cụ thể
    if (requiredRole) {
      if (requiredRole === 'scheduler' && user.role !== 'scheduler') {
        // Redirect về trang chủ với thông báo lỗi
        router.push('/?error=insufficient_permissions');
        return;
      }
    }
  }, [user, authToken, isLoading, router, pathname, requiredRole]);

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Nếu không có user, không render gì (sẽ redirect)
  if (!user || !authToken) {
    return null;
  }

  // Kiểm tra quyền truy cập
  if (requiredRole && requiredRole === 'scheduler' && user.role !== 'scheduler') {
    return null;
  }

  // Render children nếu đã xác thực và có quyền truy cập
  return <>{children}</>;
} 