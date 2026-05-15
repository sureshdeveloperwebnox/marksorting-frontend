'use client';

import { useAuthStore } from '@/store/auth-store';
import { Search, Bell, Settings, CircleHelp, Mail, Sun, Moon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="sticky top-0 z-50 w-full transition-all duration-300">
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="h-20 bg-white/70 dark:bg-gray-950/40 backdrop-blur-3xl border border-white/40 dark:border-white/5 px-8 flex items-center justify-between shadow-[0_12px_32px_-12px_rgba(0,0,0,0.1)] rounded-[24px]"
      >
        <div className="flex items-center gap-6 flex-1 max-w-xl">
          <motion.div 
            className="relative w-full group"
            animate={{ width: isSearchFocused ? '100%' : '90%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Search 
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                isSearchFocused ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
              }`} 
              size={18} 
            />
            <input
              type="text"
              placeholder="Search task"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-gray-50/50 dark:bg-white/5 border border-transparent focus:border-primary/10 rounded-full py-2.5 pl-12 pr-6 transition-all text-sm outline-none placeholder:text-gray-400 font-medium"
            />
          </motion.div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 flex items-center justify-center bg-white dark:bg-white/5 text-gray-500 hover:text-primary rounded-full transition-all shadow-sm border border-gray-100 dark:border-white/5"
            >
              <Mail size={18} />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 flex items-center justify-center bg-white dark:bg-white/5 text-gray-500 hover:text-primary rounded-full transition-all shadow-sm border border-gray-100 dark:border-white/5 relative"
            >
              <Bell size={18} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full ring-2 ring-white dark:ring-[#0f1110]" />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-11 h-11 flex items-center justify-center bg-white dark:bg-white/5 text-gray-500 hover:text-primary rounded-full transition-all shadow-sm border border-gray-100 dark:border-white/5"
            >
              {mounted && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme === 'dark' ? 'dark' : 'light'}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.button>
          </div>

          <motion.div 
            className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-white/10 group cursor-pointer"
            whileHover={{ x: 2 }}
          >
            <Avatar className="h-11 w-11 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300 shadow-md">
              <AvatarImage src="/avatars/admin.png" />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {user?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden lg:block">
              <p className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">
                {user?.full_name || 'Totok Michael'}
              </p>
              <p className="text-[11px] text-gray-400 font-medium">
                {user?.email || 'tmichael20@mail.com'}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.header>
    </div>
  );
}
