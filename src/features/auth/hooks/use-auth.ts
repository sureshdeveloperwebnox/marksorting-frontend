'use client';

import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useLayoutStore } from '@/store/layout-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function useAuth() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const registerMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/auth/register', values);
      return response.data;
    },
    onSuccess: (data) => {
      const { user, access_token } = data;
      const decoded = decodeJwt(access_token);
      const expiresAt = decoded?.exp ? decoded.exp * 1000 : null;
      setAuth(user, expiresAt);
      useLayoutStore.getState().setLayoutType('navbar');
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
      const { user, access_token } = data;
      const decoded = decodeJwt(access_token);
      const expiresAt = decoded?.exp ? decoded.exp * 1000 : null;
      setAuth(user, expiresAt);
      useLayoutStore.getState().setLayoutType('navbar');
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
        setAuth(response.data, response.data.expires_at);
      }
    } catch (error) {
      // Not logged in or session expired
      useAuthStore.getState().logout();
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.put('/auth/profile', values);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  return {
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    checkAuth,
  };
}
