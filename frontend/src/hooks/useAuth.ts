import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  return {
    user,
    isAdmin: user?.role === 'admin',
    isViewer: user?.role === 'viewer',
  };
}
