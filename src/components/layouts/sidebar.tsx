'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { useAuthStore } from '@/store/auth-store';
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
  const logout = useAuthStore((state) => state.logout);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="relative h-screen bg-primary flex flex-col z-40 transition-colors duration-300 overflow-hidden shadow-2xl"
    >
      <div className="p-4 mb-4 mt-2">
        <Logo 
          isCollapsed={isCollapsed}
          className="transition-all duration-300" 
        />
      </div>

      <div className="px-4 mb-2">
        {!isCollapsed && <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-4 mb-4">Management</p>}
      </div>

      <nav className="flex-1 space-y-1 relative">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative block"
            >
              <div
                className={cn(
                  'flex items-center gap-4 py-4 px-8 transition-all duration-300 relative',
                  isActive
                    ? 'bg-[#f8f9fa] rounded-l-[30px] ml-4 text-primary'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                {/* Inverted Corners Effect */}
                {isActive && (
                  <>
                    <div className="absolute -top-[30px] right-0 w-[30px] h-[30px] bg-[#f8f9fa] pointer-events-none">
                      <div className="w-full h-full bg-primary rounded-br-[30px]" />
                    </div>
                    <div className="absolute -bottom-[30px] right-0 w-[30px] h-[30px] bg-[#f8f9fa] pointer-events-none">
                      <div className="w-full h-full bg-primary rounded-tr-[30px]" />
                    </div>
                  </>
                )}

                <div className="relative z-10 flex items-center justify-center w-6 h-6">
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10 font-bold text-[15px] tracking-tight"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 px-8 py-4 w-full text-white/80 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-300",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut size={22} />
          {!isCollapsed && <span className="font-bold text-sm">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-[#f8f9fa] rounded-full flex items-center justify-center shadow-lg text-primary hover:scale-110 transition-all z-50 border border-gray-100"
      >
        <ChevronRight 
          size={14} 
          className={cn("transition-transform duration-300", !isCollapsed && "rotate-180")} 
        />
      </button>
    </motion.div>
  );
}
