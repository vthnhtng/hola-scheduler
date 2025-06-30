import { useAuth } from '../contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  const isScheduler = user?.role === 'scheduler';
  const isViewer = user?.role === 'viewer';
  const isAdmin = user?.role === 'admin';
  const isData = user?.role === 'data';
  const isAuthenticated = !!user;

  // Cho phép tất cả các role đã đăng nhập đều xem menu quản lý
  const canViewData = isAuthenticated;
  const canManageUsers = isAdmin || isScheduler;

  return {
    isScheduler,
    isViewer,
    isAdmin,
    isData,
    isAuthenticated,
    canViewData,
    canManageUsers,
    userRole: user?.role,
  };
} 