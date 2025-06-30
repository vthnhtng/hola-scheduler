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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return null;
  }

  // Check access permissions
  if (requiredRole === 'scheduler' && user.role !== 'scheduler') {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">No access permission!</h4>
              <p>
                You need <strong>Scheduler</strong> permission to access this page.
                Please contact the administrator to get permission.
              </p>
              <hr />
              <button 
                className="btn btn-outline-danger"
                onClick={() => router.push('/')}
              >
                Back to home page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 