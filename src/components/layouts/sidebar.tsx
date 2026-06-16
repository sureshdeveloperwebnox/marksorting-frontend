'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Factory,
  ChevronRight,
  Tag,
  Receipt,
  Building2,
} from 'lucide-react';
import {
  DashboardIcon,
  InstallationIcon,
  InstallationListIcon,
  ServicesIcon,
  ServiceCategoryIcon,
  ServiceListIcon,
  MillsIcon,
  StoreIcon,
  UsersIcon,
  UserListIcon,
  RoleManagementIcon,
  MillsListIcon,
  CustomersIcon,
  ExpensesIcon,
  ManageExpensesIcon,
  ExpenseCategoryIcon,
  ReportsIcon,
  SettingsIcon,
  TicketsIcon,
  CompanySettingsIcon,
  NotificationsIcon,
  ActivityLogsIcon,
  LogoutIcon,
  MasterMillsIcon,
  type IconComponent,
} from '@/components/icons';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/store/auth-store';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SidebarSubItem {
  label: string;
  href: string;
  icon?: IconComponent;
  permission?: string;
  module?: string;
  action?: 'view' | 'create' | 'update' | 'delete' | 'export';
}

interface SidebarItem {
  label: string;
  icon: IconComponent;
  href?: string;
  subItems?: SidebarSubItem[];
  permission?: string;
  module?: string;
  action?: 'view' | 'create' | 'update' | 'delete' | 'export';
}

const items: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: DashboardIcon,
    href: '/dashboard',
    module: 'dashboard',
    action: 'view',
  },
  {
    label: 'Users',
    icon: UsersIcon,
    module: 'users',
    action: 'view',
    subItems: [
      {
        label: 'Manage Users',
        href: '/users',
        icon: UserListIcon,
        module: 'users',
        action: 'view',
      },
      {
        label: 'Role Management',
        href: '/roles',
        icon: RoleManagementIcon,
        module: 'roles',
        action: 'view',
      },
    ],
  },
  {
    label: 'Mills',
    icon: MillsIcon,
    module: 'mills',
    action: 'view',
    subItems: [
      {
        label: 'Manage Mills',
        href: '/mills',
        icon: MillsListIcon,
        module: 'mills',
        action: 'view',
      },
      {
        label: 'Master Mills',
        href: '/mills/master-mills',
        icon: MasterMillsIcon,
        module: 'mills',
        action: 'view',
      },
      {
        label: 'Customers',
        href: '/mills/customers',
        icon: CustomersIcon,
        module: 'customers',
        action: 'view',
      },
    ],
  },
  {
    label: 'Services',
    icon: ServicesIcon,
    module: 'service_categories',
    action: 'view',
    subItems: [
      {
        label: 'Service Category',
        href: '/service-management/service-category',
        icon: ServiceCategoryIcon,
        module: 'service_categories',
        action: 'view',
      },
      {
        label: 'Manage Services',
        href: '/service-management/service-report',
        icon: ServiceListIcon,
        module: 'service_reports',
        action: 'view',
      },
    ],
  },
  {
    label: 'Installations',
    icon: InstallationIcon,
    module: 'installation_reports',
    action: 'view',
    subItems: [
      {
        label: 'Installation List',
        href: '/installation-management/installation-report',
        icon: InstallationListIcon,
        module: 'installation_reports',
        action: 'view',
      },
    ],
  },
  {
    label: 'Expenses',
    icon: ExpensesIcon,
    module: 'expenses',
    action: 'view',
    subItems: [
      {
        label: 'Manage Expenses',
        href: '/expense/expenses',
        icon: ManageExpensesIcon,
        module: 'expenses',
        action: 'view',
      },
      {
        label: 'Expense Category',
        href: '/expense/expense-category',
        icon: ExpenseCategoryIcon,
        module: 'expense_categories',
        action: 'view',
      },
    ],
  },
  {
    label: 'Stores',
    icon: StoreIcon,
    href: '/stores',
    module: 'stores',
    action: 'view',
  },
  {
    label: 'Reports',
    icon: ReportsIcon,
    href: '/reports',
    module: 'reports',
    action: 'view',
  },
  {
    label: 'Settings',
    icon: SettingsIcon,
    module: 'settings',
    action: 'view',
    subItems: [
      {
        label: 'Ticket Management',
        href: '/ticket-management/tickets',
        icon: TicketsIcon,
        module: 'tickets',
        action: 'view',
      },
      {
        label: 'Company Settings',
        href: '/settings/company',
        icon: CompanySettingsIcon,
        module: 'settings',
        action: 'view',
      },
      {
        label: 'Announcement',
        href: '/settings/notifications',
        icon: NotificationsIcon,
        module: 'notifications',
        action: 'view',
      },
      {
        label: 'Activity Logs',
        href: '/settings/activity-logs',
        icon: ActivityLogsIcon,
        module: 'activity_logs',
        action: 'view',
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isMenuAnimating, setIsMenuAnimating] = useState<Record<string, boolean>>({});
  const { can, isSuperAdmin, isAdmin } = usePermissions();

  const getFilteredNavItems = (): SidebarItem[] => {
    return items.filter(item => {
      // Super admin / Admin sees everything
      if (isSuperAdmin() || isAdmin()) return true;

      // Check main item permission
      if (item.module && item.action) {
        if (!can(item.action, item.module)) return false;
      }

      // Filter sub-items if they exist
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter(subItem => {
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

  // Auto-expand menu when subitem is active
  useEffect(() => {
    getFilteredNavItems().forEach((item) => {
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
    <div className="relative h-full hidden md:block select-none">
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{
          type: 'tween',
          ease: [0.16, 1, 0.3, 1],
          duration: 0.22,
        }}
        className="h-full bg-gradient-to-b from-primary to-primary/90 flex flex-col z-40 rounded-[32px] overflow-hidden shadow-2xl relative border border-white/10"
      >
        <div className="p-6 mb-2">
          <Logo
            isCollapsed={isCollapsed}
            className="transition-all duration-300"
          />
        </div>



        <nav className="flex-1 px-4 space-y-1 relative pt-4 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none">
          {getFilteredNavItems().map((item) => {
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
                      'w-full flex items-center py-3.5 transition-all duration-300 relative text-left group px-4 rounded-2xl text-white hover:bg-white/5 font-semibold cursor-pointer',
                      isSubActive && !isCollapsed && 'text-white font-semibold'
                    )}
                  >
                    <div className="flex items-center w-full">
                      {/* Centered Icon Container */}
                      <div className="relative z-10 flex items-center justify-center w-12 h-6 flex-shrink-0">
                        <item.icon
                          size={20}
                          strokeWidth={isSubActive ? 2.5 : 2}
                          className="text-white"
                        />
                      </div>

                      {/* Collapsible Label/Chevron wrapper */}
                      <motion.div
                        animate={{
                          width: isCollapsed ? 0 : 'auto',
                          opacity: isCollapsed ? 0 : 1,
                          marginLeft: isCollapsed ? 0 : 12,
                        }}
                        transition={{
                          type: 'tween',
                          ease: [0.16, 1, 0.3, 1],
                          duration: 0.22,
                        }}
                        className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
                      >
                        <span className="font-semibold text-[14px] tracking-tight font-poppins">
                          {item.label}
                        </span>
                        <ChevronRight
                          size={16}
                          className={cn(
                            "transition-transform duration-300 text-white/40 group-hover:text-white ml-2",
                            isMenuOpen && "rotate-90"
                          )}
                        />
                      </motion.div>
                    </div>
                  </button>

                  {/* Submenu container */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: (isMenuOpen && !isCollapsed) ? 'auto' : 0,
                      opacity: (isMenuOpen && !isCollapsed) ? 1 : 0,
                    }}
                    onAnimationStart={() => {
                      setIsMenuAnimating((prev) => ({ ...prev, [item.label]: true }));
                    }}
                    onAnimationComplete={() => {
                      setIsMenuAnimating((prev) => ({ ...prev, [item.label]: false }));
                    }}
                    transition={{
                      type: 'tween',
                      ease: [0.16, 1, 0.3, 1],
                      duration: 0.22,
                    }}
                    className={cn(
                      "pl-6 -mr-4 pr-4 space-y-1 relative",
                      (isMenuOpen && !isCollapsed && !isMenuAnimating[item.label]) ? "overflow-visible" : "overflow-hidden"
                    )}
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
                              'flex items-center py-3 pl-6 pr-4 transition-all duration-300 relative rounded-l-3xl font-semibold',
                              isSubItemActive
                                ? 'bg-gray-50 dark:bg-gray-900 text-primary hover:text-primary rounded-l-3xl shadow-[-10px_0_20px_rgba(0,0,0,0.05)] -ml-4 -mr-4 !pl-10'
                                : 'text-white hover:bg-white/5'
                            )}
                          >
                            {isSubItemActive && (
                              <>
                                {/* Inverted Corner Top */}
                                <div className="absolute -top-[20px] right-0 w-[20px] h-[20px] bg-transparent pointer-events-none hidden md:block">
                                  <div className="w-full h-full bg-gray-50 dark:bg-gray-900" />
                                  <div className="absolute inset-0 bg-primary rounded-br-[20px]" />
                                </div>

                                {/* Inverted Corner Bottom */}
                                <div className="absolute -bottom-[20px] right-0 w-[20px] h-[20px] bg-transparent pointer-events-none hidden md:block">
                                  <div className="w-full h-full bg-gray-50 dark:bg-gray-900" />
                                  <div className="absolute inset-0 bg-primary rounded-tr-[20px]" />
                                </div>
                              </>
                            )}

                             {subItem.icon ? (
                               <subItem.icon
                                 size={16}
                                 strokeWidth={isSubItemActive ? 2.5 : 2}
                                 className={cn("relative z-10 transition-colors flex-shrink-0", isSubItemActive ? "text-primary hover:text-primary" : "text-white")}
                               />
                             ) : (
                              <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-white/70 group-hover:bg-white transition-colors flex-shrink-0" />
                            )}

                            <span className="relative z-10 font-semibold text-[13px] tracking-tight font-poppins ml-3">
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
                    'flex items-center py-3.5 transition-all duration-300 relative rounded-l-3xl font-semibold pl-4 pr-4',
                    isMainActive
                      ? 'bg-gray-50 dark:bg-gray-900 text-primary hover:text-primary rounded-l-3xl shadow-[-10px_0_20px_rgba(0,0,0,0.05)] ml-2 -mr-4'
                      : 'text-white hover:bg-white/5'
                  )}
                >
                  {isMainActive && (
                    <>
                      {/* Inverted Corner Top */}
                      <div className="absolute -top-[20px] right-0 w-[20px] h-[20px] bg-transparent pointer-events-none hidden md:block">
                        <div className="w-full h-full bg-gray-50 dark:bg-gray-900" />
                        <div className="absolute inset-0 bg-primary rounded-br-[20px]" />
                      </div>

                      {/* Inverted Corner Bottom */}
                      <div className="absolute -bottom-[20px] right-0 w-[20px] h-[20px] bg-transparent pointer-events-none hidden md:block">
                        <div className="w-full h-full bg-gray-50 dark:bg-gray-900" />
                        <div className="absolute inset-0 bg-primary rounded-tr-[20px]" />
                      </div>
                    </>
                  )}

                  <div className="relative z-10 flex items-center justify-center w-12 h-6 flex-shrink-0">
                    <item.icon
                      size={20}
                      strokeWidth={isMainActive ? 2.5 : 2}
                      className={cn("transition-colors", isMainActive ? "text-primary hover:text-primary" : "text-white")}
                    />
                  </div>

                  <motion.div
                    animate={{
                      width: isCollapsed ? 0 : 'auto',
                      opacity: isCollapsed ? 0 : 1,
                      marginLeft: isCollapsed ? 0 : 12,
                    }}
                    transition={{
                      type: 'tween',
                      ease: [0.16, 1, 0.3, 1],
                      duration: 0.22,
                    }}
                    className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
                  >
                    <span className="relative z-10 font-semibold text-[14px] tracking-tight font-poppins">
                      {item.label}
                    </span>

                    {isMainActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-8 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,107,0,0.4)]"
                      />
                    )}
                  </motion.div>
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
              "flex items-center w-full text-white hover:bg-white/10 rounded-2xl transition-all duration-300 group font-semibold p-4 relative cursor-pointer",
              isLoggingOut && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="relative z-10 flex items-center justify-center w-12 h-6 flex-shrink-0">
              <LogoutIcon size={20} className={cn("group-hover:rotate-12 transition-transform", isLoggingOut && "animate-pulse")} />
            </div>

            <motion.div
              animate={{
                width: isCollapsed ? 0 : 'auto',
                opacity: isCollapsed ? 0 : 1,
                marginLeft: isCollapsed ? 0 : 12,
              }}
              transition={{
                type: 'tween',
                ease: [0.16, 1, 0.3, 1],
                duration: 0.22,
              }}
              className="flex-1 text-left overflow-hidden whitespace-nowrap"
            >
              <span className="font-bold text-[14px] font-poppins">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </motion.div>
          </button>
        </div>

      </motion.div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-1 top-20 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-primary hover:scale-110 active:scale-95 transition-all z-50 translate-x-1/2 border-2 border-primary/10 cursor-pointer"
      >
        <ChevronRight
          size={16}
          strokeWidth={3}
          className={cn("transition-transform duration-500", !isCollapsed && "rotate-180")}
        />
      </button>
    </div>
  );
}
