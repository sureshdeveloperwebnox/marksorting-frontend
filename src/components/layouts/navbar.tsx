'use client';

import { useAuthStore } from '@/store/auth-store';
import { 
  Search, 
  Bell, 
  Settings, 
  CircleHelp, 
  Mail, 
  Sun, 
  Moon, 
  LayoutDashboard, 
  Users, 
  Factory, 
  ClipboardList, 
  PieChart, 
  Menu,
  ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetHeader } from '@/components/ui/sheet';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

interface NavSubItem {
  label: string;
  href: string;
  icon?: any;
}

interface NavItem {
  label: string;
  icon: any;
  href?: string;
  subItems?: NavSubItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    label: 'User Management', 
    icon: Users,
    subItems: [
      { label: 'Users', href: '/users', icon: Users }
    ]
  },
  { label: 'Mills', href: '/mills', icon: Factory },
  { label: 'Orders', href: '/orders', icon: ClipboardList },
  { label: 'Analytics', href: '/analytics', icon: PieChart },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Auto-expand menu when subitem is active
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSub = item.subItems.some(
          (sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)
        );
        if (hasActiveSub) {
          setOpenMenus((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [pathname]);

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
        className="h-20 bg-white/70 dark:bg-gray-950/40 backdrop-blur-3xl border border-white/40 dark:border-white/5 px-4 md:px-8 flex items-center justify-between shadow-[0_12px_32px_-12px_rgba(0,0,0,0.1)] rounded-[24px]"
      >
        <div className="flex items-center gap-4 md:gap-6 flex-1 max-w-xl">
          {/* Mobile hamburger menu */}
          <Sheet>
            <SheetTrigger render={
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex md:hidden w-11 h-11 items-center justify-center bg-white dark:bg-white/5 text-gray-500 hover:text-primary rounded-full transition-all shadow-sm border border-gray-100 dark:border-white/5 cursor-pointer flex-shrink-0"
              >
                <Menu size={18} />
              </motion.button>
            } />
            <SheetContent 
              side="left" 
              className="fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-primary to-primary/95 border-r border-white/10 p-6 shadow-2xl transition-all duration-300 ease-out outline-none flex flex-col justify-between"
              showCloseButton={true}
            >
              <div className="flex flex-col gap-6">
                <SheetHeader className="pb-6 border-b border-white/10 flex flex-row items-center justify-between">
                  <Logo isCollapsed={false} className="transition-all duration-300 text-white" />
                </SheetHeader>
                <nav className="flex flex-col gap-1 pt-4 overflow-y-auto max-h-[calc(100vh-180px)] scrollbar-none">
                  {navItems.map((item) => {
                    const hasSubItems = !!item.subItems;
                    const isSubActive = hasSubItems && item.subItems!.some(
                      (sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)
                    );
                    const isMainActive = !hasSubItems && item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`));
                    const isMenuOpen = openMenus[item.label];

                    if (hasSubItems) {
                      return (
                        <div key={item.label} className="flex flex-col gap-1">
                          <button
                            onClick={() => setOpenMenus((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                            className={cn(
                              'w-full flex items-center justify-between py-3.5 px-6 transition-all duration-300 relative text-left group',
                              isSubActive
                                ? 'text-white font-semibold'
                                : 'text-white hover:bg-white/10 rounded-2xl font-semibold'
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative z-10 flex items-center justify-center w-6 h-6">
                                <item.icon 
                                  size={20} 
                                  strokeWidth={isSubActive ? 2.5 : 2} 
                                  className="text-white"
                                />
                              </div>
                              <span className="relative z-10 font-semibold text-[14px] tracking-tight font-poppins">
                                {item.label}
                              </span>
                            </div>
                            <ChevronRight 
                              size={16} 
                              className={cn(
                                "transition-transform duration-300 text-white/40 group-hover:text-white",
                                isMenuOpen && "rotate-90"
                              )}
                            />
                          </button>

                          <motion.div
                            initial={false}
                            animate={isMenuOpen ? { height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } } : { height: 0, opacity: 0, overflow: 'hidden' }}
                            className="overflow-hidden pl-6 -mr-4 pr-4 space-y-1 relative"
                          >
                            <div className="absolute left-9 top-0 bottom-4 w-[1.5px] bg-white/10 rounded-full" />
                            
                            {item.subItems!.map((subItem) => {
                              const isSubItemActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  className="relative block group"
                                >
                                  <div
                                    className={cn(
                                      'flex items-center gap-3 py-3 px-6 transition-all duration-300 relative pl-6',
                                      isSubItemActive
                                        ? 'bg-gray-50 dark:bg-[#0f1110] text-primary rounded-2xl shadow-md'
                                        : 'text-white hover:bg-white/10 rounded-2xl font-semibold'
                                    )}
                                  >
                                    {subItem.icon ? (
                                      <subItem.icon 
                                        size={16} 
                                        strokeWidth={isSubItemActive ? 2.5 : 2}
                                        className={cn("relative z-10 transition-colors", isSubItemActive ? "text-primary" : "text-white")}
                                      />
                                    ) : (
                                      <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-white/70 group-hover:bg-white transition-colors" />
                                    )}
                                    <span className="relative z-10 font-semibold text-[13px] tracking-tight font-poppins">
                                      {subItem.label}
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </motion.div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href!}
                        className="relative block group"
                      >
                        <div
                          className={cn(
                            'flex items-center gap-4 py-3.5 px-6 transition-all duration-300 relative',
                            isMainActive
                              ? 'bg-gray-50 dark:bg-[#0f1110] text-primary rounded-2xl shadow-md'
                              : 'text-white hover:bg-white/10 rounded-2xl font-semibold'
                          )}
                        >
                          <div className="relative z-10 flex items-center justify-center w-6 h-6">
                            <item.icon 
                              size={20} 
                              strokeWidth={isMainActive ? 2.5 : 2} 
                              className={cn("transition-colors", isMainActive ? "text-primary" : "text-white")}
                            />
                          </div>
                          <span className="relative z-10 font-semibold text-[14px] tracking-tight font-poppins">
                            {item.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
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
              <AvatarImage src={user?.profile_image_url || '/avatars/admin.png'} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {user?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden lg:block">
              <p className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">
                {user?.full_name || 'Team Member'}
              </p>
              <p className="text-[11px] text-gray-400 font-medium">
                {user?.email || ''}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.header>
    </div>
  );
}
