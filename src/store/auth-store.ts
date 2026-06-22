import { create } from 'zustand';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  permissions: string[];
  profile_image?: string;
  profile_image_url?: string;
  background_image?: string;
  background_image_url?: string;
}

interface AuthState {
  user: User | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, expiresAt?: number | null) => void;
  setExpiresAt: (expiresAt: number | null) => void;
  logout: () => void;
  setInitialized: (isInitialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  expiresAt: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user, expiresAt = null) => {
    set((state) => ({
      user,
      expiresAt: expiresAt !== null ? expiresAt : state.expiresAt,
      isAuthenticated: true,
      isInitialized: true,
    }));
  },
  setExpiresAt: (expiresAt) => {
    set({ expiresAt });
  },
  logout: () => {
    set({ user: null, expiresAt: null, isAuthenticated: false, isInitialized: true });
  },
  setInitialized: (isInitialized) => {
    set({ isInitialized });
  },
}));
