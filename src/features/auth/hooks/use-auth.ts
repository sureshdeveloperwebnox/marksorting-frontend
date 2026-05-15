'use client';

import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useAuth() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const registerMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/auth/register', values);
      return response.data;
    },
    onSuccess: (data) => {
      const { user } = data;
      setAuth(user);
      toast.success('Account created! Welcome to Marksorting.');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/auth/login', values);
      return response.data;
    },
    onSuccess: (data) => {
      const { user } = data;
      setAuth(user);
      toast.success('Welcome back!');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // 1. Immediate UI cleanup
      useAuthStore.getState().logout();
      
      // 2. Start a safety timer (force redirect after 2s if API hangs)
      const safetyTimer = setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        clearTimeout(safetyTimer);
        window.location.href = '/login';
      }
    }
  });

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data) {
        setAuth(response.data);
      }
    } catch (error) {
      // Not logged in or session expired
      useAuthStore.getState().logout();
    }
  };

  return {
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    checkAuth,
  };
}
