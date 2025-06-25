'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'scheduler' | 'viewer';
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = 'viewer',
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect nếu chưa đăng nhập
  if (!user) {
    return null;
  }

  // Kiểm tra quyền truy cập
  if (requiredRole === 'scheduler' && user.role !== 'scheduler') {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Không có quyền truy cập!</h4>
              <p>
                Bạn cần quyền <strong>Scheduler</strong> để truy cập trang này.
                Vui lòng liên hệ quản trị viên để được cấp quyền.
              </p>
              <hr />
              <button 
                className="btn btn-outline-danger"
                onClick={() => router.push('/')}
              >
                Quay về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 