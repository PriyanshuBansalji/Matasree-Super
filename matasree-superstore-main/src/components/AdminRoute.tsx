import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Double check both role and isAdmin flag for better security
  if (user?.role !== 'admin' && !user?.isAdmin) {
    // If authenticated but not admin, send to regular dashboard/profile
    return <Navigate to="/profile" replace />;
  }

  return children;
}
