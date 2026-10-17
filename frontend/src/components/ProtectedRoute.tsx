import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const sessionHydrated = useAuthStore((s) => s.sessionHydrated);
  if (!sessionHydrated) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
