import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

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
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User) => void;
  logout: () => void;
  setInitialized: (isInitialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user) => {
    set({ user, isAuthenticated: true, isInitialized: true });
  },
  logout: () => {
    set({ user: null, isAuthenticated: false, isInitialized: true });
  },
  setInitialized: (isInitialized) => {
    set({ isInitialized });
  },
}));
