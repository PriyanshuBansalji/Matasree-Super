import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role — `isAdmin` is deprecated, use `role` exclusively
  if (user?.role !== 'admin') {
    // If authenticated but not admin, send to regular profile
    return <Navigate to="/profile" replace />;
  }

  return children;
}
