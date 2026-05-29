'use client';

import { useAuthStore } from '@/store/auth-store';
import { usePermissions } from '@/hooks/use-permissions';
import {
  Bell,
  Sun,
  Moon,
  Menu,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Users,
  Factory,
  Wrench,
  Shield,
  Users2,
  Tag,
  FileText,
  Receipt,
  TicketCheck,
  Building2,
  LayoutDashboard,
  Store,
  ArrowRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger, SheetHeader } from '@/components/ui/sheet';
import { NotificationsDrawer } from '@/components/notifications/notifications-drawer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { EditProfileDrawer } from '@/components/forms/edit-profile-drawer';
import { useSocket } from '@/providers/socket-provider';
import { format } from 'date-fns';

/* ─── Nav data types ─────────────────────────────────────────── */

interface NavSubItem {
  label: string;
  href: string;
  icon: any;
  permission?: string;
  module?: string;
  action?: 'view' | 'create' | 'update' | 'delete' | 'export';
}

interface NavItem {
  label: string;
  icon: any;
  href?: string;           // flat link
  subItems?: NavSubItem[]; // dropdown
  permission?: string;
  module?: string;
  action?: 'view' | 'create' | 'update' | 'delete' | 'export';
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    module: 'dashboard',
    action: 'view',
  },
  {
    label: 'User Management',
    icon: Users,
    module: 'users',
    action: 'view',
    subItems: [
      {
        label: 'Users',
        href: '/users',
        icon: Users,
        module: 'users',
        action: 'view',
      },
      {
        label: 'Role Management',
        href: '/roles',
        icon: Shield,
        module: 'roles',
        action: 'view',
      },
    ],
  },
  {
    label: 'Mill Management',
    icon: Factory,
    module: 'mills',
    action: 'view',
    subItems: [
      {
        label: 'Mills',
        href: '/mills',
        icon: Factory,
        module: 'mills',
        action: 'view',
      },
      {
        label: 'Customers',
        href: '/mills/customers',
        icon: Users2,
        module: 'customers',
        action: 'view',
      },
    ],
  },
  {
    label: 'Service Management',
    icon: Tag,
    module: 'service_categories',
    action: 'view',
    subItems: [
      {
        label: 'Service Category',
        href: '/service-management/service-category',
        icon: Tag,
        module: 'service_categories',
        action: 'view',
      },
      {
        label: 'Service List',
        href: '/service-management/service-report',
        icon: FileText,
        module: 'service_reports',
        action: 'view',
      },
    ],
  },
  {
    label: 'Installation Management',
    icon: Wrench,
    module: 'installation_reports',
    action: 'view',
    subItems: [
      {
        label: 'Installation List',
        href: '/installation-management/installation-report',
        icon: FileText,
        module: 'installation_reports',
        action: 'view',
      },
    ],
  },
  {
    label: 'Expenses',
    icon: Receipt,
    module: 'expenses',
    action: 'view',
    subItems: [
      {
        label: 'Expenses',
        href: '/expense/expenses',
        icon: FileText,
        module: 'expenses',
        action: 'view',
      },
      {
        label: 'Expense Category',
        href: '/expense/expense-category',
        icon: Tag,
        module: 'expense_categories',
        action: 'view',
      },
    ],
  },
  {
    label: 'Store Management',
    icon: Store,
    href: '/stores',
    module: 'stores',
    action: 'view',
  },
  {
    label: 'Reports',
    icon: FileText,
    href: '/reports',
    module: 'reports',
    action: 'view',
  },
  {
    label: 'Settings',
    icon: Settings,
    module: 'settings',
    action: 'view',
    subItems: [
      {
        label: 'Tickets',
        href: '/ticket-management/tickets',
        icon: TicketCheck,
        module: 'tickets',
        action: 'view',
      },
      {
        label: 'Company Settings',
        href: '/settings/company',
        icon: Building2,
        module: 'settings',
        action: 'view',
      },
      {
        label: 'Notifications',
        href: '/settings/notifications',
        icon: Bell,
        module: 'notifications',
        action: 'view',
      },
      {
        label: 'Activity Logs',
        href: '/settings/activity-logs',
        icon: FileText,
        module: 'activity_logs',
        action: 'view',
      },
    ],
  },
];

const navPrefetchHrefs = Array.from(
  new Set(
    navItems.flatMap((item) => [
      item.href,
      ...(item.subItems?.map((subItem) => subItem.href) ?? []),
    ]).filter(Boolean) as string[]
  )
);

/* ─── Dropdown Nav Item (desktop) ───────────────────────────── */

function DropdownNavItem({
  item,
  pathname,
  onPrefetch,
}: {
  item: NavItem & { subItems: NavSubItem[] };
  pathname: string;
  onPrefetch: (href: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Returns true only if this sub-item is the best (most specific) match
   * for the current pathname. This prevents /mills matching /mills/customers.
   */
  const isSubItemActive = (sub: NavSubItem): boolean => {
    if (pathname !== sub.href && !pathname.startsWith(`${sub.href}/`)) return false;
    // Check no sibling is a longer/more-specific match
    const betterMatch = item.subItems.some(
      (other) =>
        other.href !== sub.href &&
        (pathname === other.href || pathname.startsWith(`${other.href}/`)) &&
        other.href.length > sub.href.length
    );
    return !betterMatch;
  };

  // Is any sub-item active?
  const isGroupActive = item.subItems.some((s) => isSubItemActive(s));

  // Auto-open when a child is active
  useEffect(() => {
    if (isGroupActive) setOpen(true);
  }, [isGroupActive]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        setOpen(true);
        item.subItems.forEach((subItem) => onPrefetch(subItem.href));
      }}
      onMouseLeave={() => {
        if (!isGroupActive) setOpen(false);
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        className={cn(
          'relative flex items-center gap-1 px-1.5 xl:px-2 2xl:px-2.5 py-2 text-[11px] xl:text-xs 2xl:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap group select-none',
          isGroupActive
            ? 'text-primary'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
        )}
      >
        {item.label}
        <ChevronDown
          size={11}
          className={cn(
            'transition-transform duration-200 ml-0.5 hidden xl:block',
            open && 'rotate-180'
          )}
        />
        {/* Active pill background */}
        {isGroupActive && (
          <motion.span
            layoutId="navbar-active-pill"
            className="absolute inset-0 bg-primary/8 dark:bg-primary/15 rounded-lg"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
        {/* Hover / active underline */}
        <span className={cn(
          'absolute bottom-0 left-2 xl:left-3 right-2 xl:right-3 h-[2px] rounded-full bg-primary transition-all duration-300',
          isGroupActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
        )} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-full mt-1.5 min-w-[11rem] w-max bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl shadow-black/8 p-1.5 z-50"
          >
            {item.subItems.map((sub) => {
              const subActive = isSubItemActive(sub);
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  prefetch
                  onPointerEnter={() => onPrefetch(sub.href)}
                  onFocus={() => onPrefetch(sub.href)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                    subActive
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <sub.icon
                    size={14}
                    strokeWidth={subActive ? 2.5 : 2}
                    className={subActive ? 'text-primary' : ''}
                  />
                  {sub.label}
                  {subActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(255,107,0,0.5)]" />
                  )}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Navbar ────────────────────────────────────────────── */

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { can, isSuperAdmin, isAdmin } = usePermissions();
  const { theme, setTheme } = useTheme();
  const { logout, isLoggingOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  // Mobile sheet accordion state
  const [mobileOpenGroups, setMobileOpenGroups] = useState<Record<string, boolean>>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const prefetchRoute = (href: string) => {
    if (href !== pathname) {
      router.prefetch(href);
    }
  };

  // Filter navigation items based on permissions
  const getFilteredNavItems = (): NavItem[] => {
    return navItems.filter(item => {
      // Super admin / Admin sees everything
      if (isSuperAdmin() || isAdmin()) return true;

      // Check main item permission
      if (item.module && item.action) {
        if (!can(item.action, item.module)) return false;
      }

      // Filter sub-items if they exist
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter(subItem => {
          // Super admin / Admin sees everything
          if (isSuperAdmin() || isAdmin()) return true;

          if (subItem.module && subItem.action) {
            return can(subItem.action, subItem.module);
          }

          return true; // Show if no specific permission required
        });

        // Only show the main item if there are visible sub-items
        return filteredSubItems.length > 0;
      }

      return true; // Show if no specific permission required
    }).map(item => {
      // Filter sub-items for dropdowns
      if (item.subItems) {
        return {
          ...item,
          subItems: item.subItems.filter(subItem => {
            if (isSuperAdmin() || isAdmin()) return true;

            if (subItem.module && subItem.action) {
              return can(subItem.action, subItem.module);
            }

            return true;
          })
        };
      }
      return item;
    });
  };

  useEffect(() => {
    const prefetchAll = () => {
      navPrefetchHrefs.forEach((href) => {
        if (href !== pathname) router.prefetch(href);
      });
      router.prefetch('/dashboard');
    };

    const cancelPrefetch =
      typeof window.requestIdleCallback === 'function'
        ? (() => {
          const idleId = window.requestIdleCallback(prefetchAll, { timeout: 1500 });
          return () => window.cancelIdleCallback(idleId);
        })()
        : (() => {
          const timeoutId = globalThis.setTimeout(prefetchAll, 250);
          return () => globalThis.clearTimeout(timeoutId);
        })();

    return () => {
      cancelPrefetch();
    };
  }, [pathname, router]);

  // Auto-expand mobile groups when a child is active
  useEffect(() => {
    const expanded: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSub = item.subItems.some((s) => {
          if (pathname !== s.href && !pathname.startsWith(`${s.href}/`)) return false;
          const betterMatch = item.subItems!.some(
            (o) => o.href !== s.href && (pathname === o.href || pathname.startsWith(`${o.href}/`)) && o.href.length > s.href.length
          );
          return !betterMatch;
        });
        if (hasActiveSub) expanded[item.label] = true;
      }
    });
    setMobileOpenGroups((prev) => ({ ...prev, ...expanded }));
  }, [pathname]);

  // Close user / notif dropdowns on outside click
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
      <div className="flex items-center h-16 px-4 lg:px-6 gap-3 lg:gap-4">

        {/* ── Logo ── */}
        <Link
          href="/dashboard"
          prefetch
          onPointerEnter={() => prefetchRoute('/dashboard')}
          onFocus={() => prefetchRoute('/dashboard')}
          className="flex-shrink-0 flex items-center mr-1 lg:mr-4"
          aria-label="Go to dashboard"
        >
          <div className="relative h-9 w-auto">
            <Image
              src="/assets/logo.png"
              alt="Mark Sorting Logo"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              style={{ width: 'auto' }}
              priority
            />
          </div>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden xl:flex items-center gap-0.5 2xl:gap-1 flex-1 min-w-0">
          {getFilteredNavItems().map((item) => {
            // Dropdown item
            if (item.subItems) {
              return (
                <DropdownNavItem
                  key={item.label}
                  item={item as NavItem & { subItems: NavSubItem[] }}
                  pathname={pathname}
                  onPrefetch={prefetchRoute}
                />
              );
            }

            // Flat link
            const active = isActive(item.href!);
            return (
              <Link
                key={item.href}
                href={item.href!}
                prefetch
                onPointerEnter={() => prefetchRoute(item.href!)}
                onFocus={() => prefetchRoute(item.href!)}
                className={cn(
                  'relative flex items-center gap-1 px-1.5 xl:px-2 2xl:px-2.5 py-2 text-[11px] xl:text-xs 2xl:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap group',
                  active
                    ? 'text-primary'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 bg-primary/8 dark:bg-primary/15 rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className={cn(
                  'absolute bottom-0 left-1 xl:left-2 2xl:left-3 right-1 xl:right-2 2xl:right-3 h-[2px] rounded-full bg-primary transition-all duration-300',
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
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-primary rounded-full ring-2 ring-white dark:ring-gray-900 flex items-center justify-center text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </motion.button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-xl shadow-black/8 z-50 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Notifications {unreadCount > 0 && <span className="ml-1 text-primary">({unreadCount})</span>}
                    </p>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="flex flex-col max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Bell size={28} className="text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const dotColor =
                          n.type === 'SERVICE_REPORT' ? 'bg-blue-500' :
                            n.type === 'INSTALLATION' ? 'bg-indigo-500' :
                              n.type === 'EXPENSE' ? 'bg-amber-500' :
                                n.type === 'TICKET' ? 'bg-rose-500' :
                                  'bg-primary';
                        return (
                          <button
                            key={n.id}
                            onClick={() => n.status === 'UNREAD' && markAsRead(n.id)}
                            className={cn(
                              'flex items-start gap-3 px-4 py-3 text-left w-full transition-colors',
                              n.status === 'UNREAD'
                                ? 'bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15'
                                : 'hover:bg-gray-50 dark:hover:bg-white/5'
                            )}
                          >
                            <span className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', dotColor)} />
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-sm truncate',
                                n.status === 'UNREAD'
                                  ? 'font-bold text-gray-900 dark:text-white'
                                  : 'font-semibold text-gray-700 dark:text-gray-300'
                              )}>
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                {format(new Date(n.created_at), 'h:mm a, MMM d')}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 dark:border-white/10">
                    <button
                      onClick={() => { setNotifOpen(false); setNotifDrawerOpen(true); }}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors w-full"
                    >
                      View all notifications
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* All-Notifications Drawer */}
          <NotificationsDrawer
            open={notifDrawerOpen}
            onOpenChange={setNotifDrawerOpen}
            onMarkAllRead={markAllAsRead}
          />

          {/* Divider */}
          <div className="hidden xl:block w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

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
              <div className="hidden 2xl:flex flex-col items-start leading-none">
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
                  'hidden 2xl:block text-gray-400 transition-transform duration-200',
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
                  <div className="px-3 py-2.5 mb-1 border-b border-gray-100 dark:border-white/5">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate uppercase tracking-wide">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{user?.email || ''}</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); setProfileDrawerOpen(true); }}
                    className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                  >
                    <User size={15} className="text-gray-400" />
                    Edit Profile
                  </button>
                  {/* <Link
                    href="/settings"
                    prefetch
                    onPointerEnter={() => prefetchRoute('/settings')}
                    onFocus={() => prefetchRoute('/settings')}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
                  >
                    <Settings size={15} className="text-gray-400" />
                    Settings
                  </Link> */}
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
                className="flex xl:hidden w-9 h-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-all"
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
                    style={{ width: 'auto' }}
                    priority
                  />
                </div>
              </SheetHeader>

              <nav className="flex flex-col gap-1 pt-5 flex-1 overflow-y-auto scrollbar-none">
                {getFilteredNavItems().map((item) => {
                  if (item.subItems) {
                    const isGroupActive = item.subItems.some((s) => {
                      if (pathname !== s.href && !pathname.startsWith(`${s.href}/`)) return false;
                      const betterMatch = item.subItems!.some(
                        (o) => o.href !== s.href && (pathname === o.href || pathname.startsWith(`${o.href}/`)) && o.href.length > s.href.length
                      );
                      return !betterMatch;
                    });
                    const isOpen = mobileOpenGroups[item.label];
                    return (
                      <div key={item.label}>
                        <button
                          onClick={() =>
                            setMobileOpenGroups((prev) => ({
                              ...prev,
                              [item.label]: !prev[item.label],
                            }))
                          }
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold transition-all',
                            isGroupActive
                              ? 'text-primary'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                          )}
                        >
                          <item.icon size={16} strokeWidth={isGroupActive ? 2.5 : 2} />
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown
                            size={14}
                            className={cn(
                              'text-gray-400 transition-transform duration-200',
                              isOpen && 'rotate-180'
                            )}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden pl-4"
                            >
                              {item.subItems.map((sub) => {
                                const subActive = (() => {
                                  if (pathname !== sub.href && !pathname.startsWith(`${sub.href}/`)) return false;
                                  const betterMatch = item.subItems!.some(
                                    (o) => o.href !== sub.href && (pathname === o.href || pathname.startsWith(`${o.href}/`)) && o.href.length > sub.href.length
                                  );
                                  return !betterMatch;
                                })();
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    prefetch
                                    onPointerEnter={() => prefetchRoute(sub.href)}
                                    onFocus={() => prefetchRoute(sub.href)}
                                    className={cn(
                                      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                                      subActive
                                        ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                                        : 'text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                    )}
                                  >
                                    <span className={cn(
                                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                      subActive ? 'bg-primary shadow-[0_0_6px_rgba(255,107,0,0.5)]' : 'bg-gray-300 dark:bg-gray-600'
                                    )} />
                                    {sub.label}
                                    {subActive && (
                                      <span className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
                                    )}
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  // flat link
                  const active = isActive(item.href!);
                  return (
                    <Link
                      key={item.href}
                      href={item.href!}
                      prefetch
                      onPointerEnter={() => prefetchRoute(item.href!)}
                      onFocus={() => prefetchRoute(item.href!)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                        active
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      <item.icon size={16} strokeWidth={active ? 2.5 : 2} />
                      {item.label}
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
      <EditProfileDrawer open={profileDrawerOpen} onOpenChange={setProfileDrawerOpen} />
    </header>
  );
}
