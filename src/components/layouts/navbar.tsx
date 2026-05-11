'use client';

import { ModeToggle } from '@/components/common/mode-toggle';
import { useAuthStore } from '@/store/auth-store';

export function Navbar() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 border-b bg-white dark:bg-gray-800 flex items-center justify-between px-6">
      <div className="text-sm text-gray-500">
        {user ? `Welcome back, ${user.full_name}` : 'Welcome'}
      </div>
      <div className="flex items-center space-x-4">
        <ModeToggle />
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
}
