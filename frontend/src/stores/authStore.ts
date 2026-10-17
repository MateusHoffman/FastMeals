import { create } from 'zustand';

export type UserRole = 'admin' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  sessionHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setSessionHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionHydrated: false,
  setUser: (user) => set({ user }),
  setSessionHydrated: (sessionHydrated) => set({ sessionHydrated }),
}));
