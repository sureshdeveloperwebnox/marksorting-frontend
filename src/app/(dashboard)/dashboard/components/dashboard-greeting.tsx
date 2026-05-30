'use client';

import * as React from 'react';
import { useAuthStore } from '@/store/auth-store';

export function DashboardGreeting() {
  const user = useAuthStore((state) => state.user);
  const [greeting, setGreeting] = React.useState('Hello');

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const name = user?.full_name ? user.full_name.split(' ')[0] : 'User';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
          {greeting}, {name}! 👋
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium mt-1">
          Here's what's happening with your business today.
        </p>
      </div>
    </div>
  );
}
