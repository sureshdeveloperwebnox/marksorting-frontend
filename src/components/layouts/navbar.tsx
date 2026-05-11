'use client';

import { useAuthStore } from '@/store/auth-store';
import { Search, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Navbar() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-20 bg-white/80 dark:bg-[#0f1110]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-2xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors">
          <Bell size={22} />
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-[#0f1110]" />
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-gray-100 dark:border-gray-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">
              {user?.full_name || 'Admin User'}
            </p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">
              {user?.role || 'Super Admin'}
            </p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-primary/10 transition-transform hover:scale-105">
            <AvatarImage src="/avatars/admin.png" />
            <AvatarFallback className="bg-primary/5 text-primary font-bold">
              {user?.full_name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
