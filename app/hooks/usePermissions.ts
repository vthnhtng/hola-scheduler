import { useAuth } from '../contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  const isScheduler = user?.role === 'scheduler';
  const isViewer = user?.role === 'viewer';
  const isAuthenticated = !!user;

  const canAccessSchedulerFeatures = isScheduler;
  const canViewData = isViewer || isScheduler;
  const canManageUsers = isScheduler;

  return {
    isScheduler,
    isViewer,
    isAuthenticated,
    canAccessSchedulerFeatures,
    canViewData,
    canManageUsers,
    userRole: user?.role,
  };
} 