import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, error } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated && !localStorage.getItem('authToken')) {
    // Save the intended destination to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
