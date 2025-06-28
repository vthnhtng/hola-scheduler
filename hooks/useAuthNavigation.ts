import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

/**
 * Hook để handle navigation với authentication
 */
export function useAuthNavigation() {
  const { user, isLoading, authToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Kiểm tra authentication khi navigate
  useEffect(() => {
    if (isLoading) return;

    // Danh sách các route cần authentication
    const protectedRoutes = [
      '/timetable',
      '/subjects',
      '/lecturers',
      '/locations',
      '/curriculums',
      '/teams',
      '/users',
      '/holidays',
      '/calendar'
    ];

    // Danh sách các route chỉ dành cho scheduler
    const schedulerOnlyRoutes = [
      '/scheduler',
      '/api/generate-schedules',
      '/api/export-schedule'
    ];

    // Kiểm tra xem route hiện tại có cần authentication không
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isSchedulerRoute = schedulerOnlyRoutes.some(route => pathname.startsWith(route));

    // Nếu là protected route và chưa đăng nhập
    if (isProtectedRoute && (!user || !authToken)) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    // Nếu là scheduler route và không có quyền scheduler
    if (isSchedulerRoute && user?.role !== 'scheduler') {
      router.push('/?error=insufficient_permissions');
      return;
    }

    // Nếu đã đăng nhập và đang ở trang login, redirect về trang chủ
    if (pathname === '/login' && user && authToken) {
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
      router.push(redirectTo);
    }
  }, [user, authToken, isLoading, pathname, router]);

  return {
    user,
    isLoading,
    authToken,
    isAuthenticated: !!user && !!authToken,
    hasSchedulerRole: user?.role === 'scheduler',
  };
} 