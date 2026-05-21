'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  Bell,
  Sun,
  Moon,
  Menu,
  LogOut,
  Settings,
  ChevronDown,
  Users,
  DollarSign,
  Receipt,
  Layers,
  Wrench,
  BarChart3,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger, SheetHeader } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/use-auth';

interface NavLink {
  label: string;
  href: string;
  icon: any;
}

const navLinks: NavLink[] = [
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Expense Type', href: '/expense-type', icon: DollarSign },
  { label: 'Expense', href: '/expense', icon: Receipt },
  { label: 'Service List', href: '/service-list', icon: Layers },
  { label: 'Installation List', href: '/installation-list', icon: Wrench },
  { label: 'Report', href: '/report', icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme } = useTheme();
  const { logout, isLoggingOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const userRoleName = (user as any)?.role?.name || 'Admin';

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-white/5 shadow-sm">
      <div className="flex items-center h-16 px-4 md:px-6 gap-4">

        {/* ── Logo ── */}
        <Link
          href="/dashboard"
          className="flex-shrink-0 flex items-center mr-2 md:mr-4"
          aria-label="Go to dashboard"
        >
          {/* Compact inline logo — constrained to navbar height */}
          <div className="relative h-9 w-auto">
            <Image
              src="/assets/logo.png"
              alt="Mark Sorting Logo"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </div>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-none">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap group',
                  active
                    ? 'text-primary'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                )}
              >
                <link.icon size={15} strokeWidth={active ? 2.5 : 2} />
                {link.label}
                {/* Active indicator bar */}
                {active && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 bg-primary/8 dark:bg-primary/15 rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {/* Hover underline */}
                <span className={cn(
                  'absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary transition-all duration-300',
                  active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                )} />
              </Link>
            );
          })}
        </nav>

        {/* ── Right Section ── */}
        <div className="ml-auto flex items-center gap-1.5 md:gap-2 flex-shrink-0">

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-all"
            aria-label="Toggle theme"
          >
            {mounted && (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ scale: 0, rotate: -90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
                </motion.div>
              </AnimatePresence>
            )}
          </motion.button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNotifOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-all relative"
              aria-label="Notifications"
            >
              <Bell size={17} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white dark:ring-gray-900" />
            </motion.button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-xl shadow-black/8 p-4 z-50"
                >
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Notifications</p>
                  <div className="flex flex-col gap-3">
                    {[
                      { msg: 'New user registered', time: '2m ago', dot: 'bg-emerald-500' },
                      { msg: 'Installation #142 completed', time: '1h ago', dot: 'bg-blue-500' },
                      { msg: 'Report generated', time: '3h ago', dot: 'bg-primary' },
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', n.dot)} />
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{n.msg}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <Avatar className="h-8 w-8 ring-2 ring-primary/20 shadow-sm">
                <AvatarImage src={user?.profile_image_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-orange-400 text-white text-xs font-black">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start leading-none">
                <span className="text-[13px] font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  {user?.full_name || 'User'}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                  {userRoleName}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  'hidden lg:block text-gray-400 transition-transform duration-200',
                  userMenuOpen && 'rotate-180'
                )}
              />
            </motion.button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-xl shadow-black/8 p-2 z-50"
                >
                  {/* User info header */}
                  <div className="px-3 py-2.5 mb-1 border-b border-gray-100 dark:border-white/5">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate uppercase tracking-wide">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{user?.email || ''}</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
                  >
                    <Settings size={15} className="text-gray-400" />
                    Settings
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all disabled:opacity-50"
                  >
                    <LogOut size={15} />
                    {isLoggingOut ? 'Logging out…' : 'Logout'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Mobile hamburger ── */}
          <Sheet>
            <SheetTrigger render={
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex md:hidden w-9 h-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-all"
              >
                <Menu size={18} />
              </motion.button>
            } />
            <SheetContent
              side="left"
              className="fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-white/10 p-6 shadow-2xl flex flex-col"
              showCloseButton={true}
            >
              <SheetHeader className="pb-5 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center">
                  <Image
                    src="/assets/logo.png"
                    alt="Mark Sorting Logo"
                    width={130}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                  />
                </div>
              </SheetHeader>
              <nav className="flex flex-col gap-1 pt-5 flex-1 overflow-y-auto scrollbar-none">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                        active
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      <link.icon size={16} strokeWidth={active ? 2.5 : 2} />
                      {link.label}
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,107,0,0.5)]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
              {/* Mobile logout */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                >
                  <LogOut size={16} />
                  {isLoggingOut ? 'Logging out…' : 'Logout'}
                </button>
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </header>
  );
}
