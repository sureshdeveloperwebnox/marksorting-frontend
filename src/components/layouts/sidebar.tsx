'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Factory, 
  Settings, 
  LogOut,
  ChevronRight,
  ClipboardList,
  PieChart
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import { motion } from 'framer-motion';
import { useState } from 'react';

const items = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Mills', href: '/mills', icon: Factory },
  { label: 'Orders', href: '/orders', icon: ClipboardList },
  { label: 'Analytics', href: '/analytics', icon: PieChart },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="relative p-4 h-screen">
      <motion.div 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="h-full bg-gradient-to-b from-primary to-primary/90 flex flex-col z-40 rounded-[32px] overflow-hidden shadow-2xl relative border border-white/10"
      >
        <div className="p-6 mb-2">
          <Logo 
            isCollapsed={isCollapsed}
            className="transition-all duration-300" 
          />
        </div>

        <div className="px-6 mb-4">
          {!isCollapsed && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em] ml-4"
            >
              Management
            </motion.p>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 relative pt-4">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative block group"
              >
                <div
                  className={cn(
                    'flex items-center gap-4 py-3.5 transition-all duration-300 relative',
                    isCollapsed ? 'px-0 justify-center' : 'px-6',
                    isActive
                      ? 'bg-gray-50 dark:bg-[#0f1110] text-primary rounded-l-3xl shadow-[-10px_0_20px_rgba(0,0,0,0.05)] ml-2 -mr-4'
                      : 'text-white/60 hover:text-white hover:bg-white/5 rounded-2xl'
                  )}
                >
                  {isActive && (
                    <>
                      {/* Inverted Corner Top */}
                      <div className="absolute -top-[20px] right-0 w-[20px] h-[20px] bg-transparent pointer-events-none hidden md:block">
                        <div className="w-full h-full bg-gray-50 dark:bg-[#0f1110]" />
                        <div className="absolute inset-0 bg-primary rounded-br-[20px]" />
                      </div>
                      
                      {/* Inverted Corner Bottom */}
                      <div className="absolute -bottom-[20px] right-0 w-[20px] h-[20px] bg-transparent pointer-events-none hidden md:block">
                        <div className="w-full h-full bg-gray-50 dark:bg-[#0f1110]" />
                        <div className="absolute inset-0 bg-primary rounded-tr-[20px]" />
                      </div>
                    </>
                  )}

                  <div className="relative z-10 flex items-center justify-center w-6 h-6">
                    <item.icon 
                      size={20} 
                      strokeWidth={isActive ? 2.5 : 2} 
                      className={cn("transition-colors", isActive ? "text-primary" : "group-hover:text-white")}
                    />
                  </div>
                  
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative z-10 font-black text-[14px] tracking-tight"
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {isActive && !isCollapsed && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-8 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,107,0,0.4)]"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "flex items-center gap-3 px-6 py-4 w-full text-white/60 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 group",
              isCollapsed && "justify-center px-0",
              isLoggingOut && "opacity-50 cursor-not-allowed"
            )}
          >
            <LogOut size={20} className={cn("group-hover:rotate-12 transition-transform", isLoggingOut && "animate-pulse")} />
            {!isCollapsed && <span className="font-bold text-[14px]">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-1 top-20 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-primary hover:scale-110 active:scale-95 transition-all z-50 translate-x-1/2 border-2 border-primary/10"
        >
          <ChevronRight 
            size={16} 
            strokeWidth={3}
            className={cn("transition-transform duration-500", !isCollapsed && "rotate-180")} 
          />
        </button>
      </motion.div>
    </div>
  );
}
