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
  PieChart,
  Shield,
  Users2,
  Tag,
  FileText,
  Wrench,
  Receipt,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SidebarSubItem {
  label: string;
  href: string;
  icon?: any;
}

interface SidebarItem {
  label: string;
  icon: any;
  href?: string;
  subItems?: SidebarSubItem[];
}

const items: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'User Management',
    icon: Users,
    subItems: [
      { label: 'Users', href: '/users', icon: Users },
      { label: 'Roles', href: '/roles', icon: Shield }
    ]
  },
  {
    label: 'Mill Management',
    icon: Factory,
    subItems: [
      { label: 'Mills', href: '/mills', icon: Factory },
      { label: 'Customers', href: '/mills/customers', icon: Users2 },
    ]
  },
  {
    label: 'Service Management',
    icon: Tag,
    subItems: [
      { label: 'Service Category', href: '/service-management/service-category', icon: Tag },
      { label: 'Service Report', href: '/service-management/service-report', icon: FileText },
    ]
  },
  {
    label: 'Installation Management',
    icon: Wrench,
    subItems: [
      { label: 'Installation Report', href: '/installation-management/installation-report', icon: FileText },
    ]
  },
  {
    label: 'Expense',
    icon: Receipt,
    subItems: [
      { label: 'Expenses', href: '/expense/expenses', icon: FileText },
      { label: 'Expense Category', href: '/expense/expense-category', icon: Tag },
    ]
  },
  { label: 'Orders', href: '/orders', icon: ClipboardList },
  { label: 'Analytics', href: '/analytics', icon: PieChart },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Auto-expand menu when subitem is active
  useEffect(() => {
    items.forEach((item) => {
      if (item.subItems) {
        const hasActiveSub = item.subItems.some((sub) => {
          if (pathname !== sub.href && !pathname.startsWith(`${sub.href}/`)) return false;
          const betterMatch = item.subItems!.some(
            (o) => o.href !== sub.href && (pathname === o.href || pathname.startsWith(`${o.href}/`)) && o.href.length > sub.href.length
          );
          return !betterMatch;
        });
        if (hasActiveSub) {
          setOpenMenus((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [pathname]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="relative h-full hidden md:block">
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
              className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em] ml-4 font-poppins"
            >
              Management
            </motion.p>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 relative pt-4 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none">
          {items.map((item) => {
            const hasSubItems = !!item.subItems;

            // Check if any sub-item is active (best match wins)
            const isSubActive = hasSubItems && item.subItems!.some((sub) => {
              if (pathname !== sub.href && !pathname.startsWith(`${sub.href}/`)) return false;
              const betterMatch = item.subItems!.some(
                (o) => o.href !== sub.href && (pathname === o.href || pathname.startsWith(`${o.href}/`)) && o.href.length > sub.href.length
              );
              return !betterMatch;
            });

            const isMainActive = !hasSubItems && item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`));

            const isMenuOpen = openMenus[item.label];

            if (hasSubItems) {
              return (
                <div key={item.label} className="relative space-y-1">
                  {/* Parent Item */}
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                        setOpenMenus((prev) => ({ ...prev, [item.label]: true }));
                      } else {
                        setOpenMenus((prev) => ({ ...prev, [item.label]: !prev[item.label] }));
                      }
                    }}
                    className={cn(
                      'w-full flex items-center justify-between py-3.5 transition-all duration-300 relative text-left group',
                      isCollapsed ? 'px-0 justify-center' : 'px-6',
                      isSubActive && !isCollapsed
                        ? 'text-white font-semibold'
                        : 'text-white hover:bg-white/5 rounded-2xl font-semibold'
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

                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="relative z-10 font-semibold text-[14px] tracking-tight font-poppins"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <ChevronRight
                        size={16}
                        className={cn(
                          "transition-transform duration-300 text-white/40 group-hover:text-white",
                          isMenuOpen && "rotate-90"
                        )}
                      />
                    )}
                  </button>

                  {/* Submenu container */}
                  {!isCollapsed && (
                    <motion.div
                      initial={false}
                      animate={isMenuOpen ? { height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } } : { height: 0, opacity: 0, overflow: 'hidden' }}
                      className="overflow-hidden pl-6 -mr-4 pr-4 space-y-1 relative"
                    >
                      {/* Vertical line indicator */}
                      <div className="absolute left-9 top-0 bottom-4 w-[1.5px] bg-white/10 rounded-full" />

                      {item.subItems!.map((subItem) => {
                        const isSubItemActive = (() => {
                          if (pathname !== subItem.href && !pathname.startsWith(`${subItem.href}/`)) return false;
                          const betterMatch = item.subItems!.some(
                            (o) => o.href !== subItem.href && (pathname === o.href || pathname.startsWith(`${o.href}/`)) && o.href.length > subItem.href.length
                          );
                          return !betterMatch;
                        })();
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
                                  ? 'bg-gray-50 dark:bg-[#0f1110] text-primary rounded-l-3xl shadow-[-10px_0_20px_rgba(0,0,0,0.05)] ml-2 -mr-4'
                                  : 'text-white hover:bg-white/5 rounded-xl font-semibold'
                              )}
                            >
                              {isSubItemActive && (
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

                              {isSubItemActive && (
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
                    </motion.div>
                  )}
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
                    'flex items-center gap-4 py-3.5 transition-all duration-300 relative',
                    isCollapsed ? 'px-0 justify-center' : 'px-6',
                    isMainActive
                      ? 'bg-gray-50 dark:bg-[#0f1110] text-primary rounded-l-3xl shadow-[-10px_0_20px_rgba(0,0,0,0.05)] ml-2 -mr-4'
                      : 'text-white hover:bg-white/5 rounded-2xl font-semibold'
                  )}
                >
                  {isMainActive && (
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
                      strokeWidth={isMainActive ? 2.5 : 2}
                      className={cn("transition-colors", isMainActive ? "text-primary" : "text-white")}
                    />
                  </div>

                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative z-10 font-semibold text-[14px] tracking-tight font-poppins"
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {isMainActive && !isCollapsed && (
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
              "flex items-center gap-3 px-6 py-4 w-full text-white hover:bg-white/10 rounded-2xl transition-all duration-300 group font-semibold",
              isCollapsed && "justify-center px-0",
              isLoggingOut && "opacity-50 cursor-not-allowed"
            )}
          >
            <LogOut size={20} className={cn("group-hover:rotate-12 transition-transform", isLoggingOut && "animate-pulse")} />
            {!isCollapsed && <span className="font-bold text-[14px] font-poppins">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
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
