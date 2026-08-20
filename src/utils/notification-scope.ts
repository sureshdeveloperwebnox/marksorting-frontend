import { AppNotification } from '@/providers/socket-provider';

export type NotificationScope =
  | 'ALL'
  | 'EXPENSE'
  | 'SERVICE_INSTALLATION'
  | 'STORE'
  | 'TICKET'
  | 'BROADCAST';

export type NotificationDateFilter =
  | 'ALL'
  | 'TODAY'
  | 'YESTERDAY'
  | 'WEEK'
  | 'MONTH';

/**
 * Resolves the contextual notification scope based on active route pathname.
 * 1. Expense module (/expense/*) -> EXPENSE
 * 2. Service & Installation module (/service-management/*, /installation-management/*) -> SERVICE_INSTALLATION
 * 3. Store module (/stores/*) -> STORE
 * 4. All other modules -> ALL
 */
export function resolveScopeFromPath(pathname: string): NotificationScope {
  if (!pathname) return 'ALL';
  if (pathname.startsWith('/expense')) {
    return 'EXPENSE';
  }
  if (
    pathname.startsWith('/service-management') ||
    pathname.startsWith('/installation-management')
  ) {
    return 'SERVICE_INSTALLATION';
  }
  if (pathname.startsWith('/stores')) {
    return 'STORE';
  }
  return 'ALL';
}

/**
 * Maps a NotificationScope to its associated notification type strings.
 * Returns null if all types should be included.
 */
export function getTypesForScope(scope: NotificationScope): string[] | null {
  switch (scope) {
    case 'EXPENSE':
      return ['EXPENSE'];
    case 'SERVICE_INSTALLATION':
      return ['SERVICE_REPORT', 'INSTALLATION'];
    case 'STORE':
      return ['STORE'];
    case 'TICKET':
      return ['TICKET'];
    case 'BROADCAST':
      return ['BROADCAST'];
    case 'ALL':
    default:
      return null;
  }
}

/**
 * Returns human-readable label for a notification scope.
 */
export function getScopeLabel(scope: NotificationScope): string {
  switch (scope) {
    case 'EXPENSE':
      return 'Expenses';
    case 'SERVICE_INSTALLATION':
      return 'Services & Installations';
    case 'STORE':
      return 'Stores';
    case 'TICKET':
      return 'Tickets';
    case 'BROADCAST':
      return 'Announcements';
    case 'ALL':
    default:
      return 'All Notifications';
  }
}

/**
 * Short label for filter chips.
 */
export function getScopeChipLabel(scope: NotificationScope): string {
  switch (scope) {
    case 'EXPENSE':
      return 'Expenses';
    case 'SERVICE_INSTALLATION':
      return 'Service & Install';
    case 'STORE':
      return 'Stores';
    case 'TICKET':
      return 'Tickets';
    case 'BROADCAST':
      return 'Announcements';
    case 'ALL':
    default:
      return 'All';
  }
}

/**
 * Filters a notification list in memory by NotificationScope.
 */
export function filterNotificationsByScope(
  notifications: AppNotification[],
  scope: NotificationScope,
): AppNotification[] {
  const types = getTypesForScope(scope);
  if (!types) return notifications;
  return notifications.filter((n) => types.includes(n.type));
}

/**
 * Computes unread count for a given scope.
 */
export function getUnreadCountForScope(
  notifications: AppNotification[],
  scope: NotificationScope,
): number {
  const scopedList = filterNotificationsByScope(notifications, scope);
  return scopedList.filter((n) => n.status === 'UNREAD').length;
}

/**
 * Filters notifications by date filter preset.
 */
export function filterNotificationsByDateRange(
  notifications: AppNotification[],
  dateFilter: NotificationDateFilter,
): AppNotification[] {
  if (dateFilter === 'ALL') return notifications;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return notifications.filter((n) => {
    if (!n.created_at) return false;
    const createdAt = new Date(n.created_at);
    if (isNaN(createdAt.getTime())) return false;

    switch (dateFilter) {
      case 'TODAY':
        return createdAt >= startOfToday;
      case 'YESTERDAY': {
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        return createdAt >= startOfYesterday && createdAt < startOfToday;
      }
      case 'WEEK': {
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        return createdAt >= startOfWeek;
      }
      case 'MONTH': {
        const startOfMonth = new Date(startOfToday);
        startOfMonth.setDate(startOfMonth.getDate() - 30);
        return createdAt >= startOfMonth;
      }
      default:
        return true;
    }
  });
}

/**
 * Computes ISO date range boundaries for backend querying.
 */
export function getDateFilterRange(
  dateFilter: NotificationDateFilter,
): { startDate?: string; endDate?: string } {
  if (dateFilter === 'ALL') return {};
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (dateFilter) {
    case 'TODAY':
      return { startDate: startOfToday.toISOString() };
    case 'YESTERDAY': {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      return {
        startDate: startOfYesterday.toISOString(),
        endDate: startOfToday.toISOString(),
      };
    }
    case 'WEEK': {
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      return { startDate: startOfWeek.toISOString() };
    }
    case 'MONTH': {
      const startOfMonth = new Date(startOfToday);
      startOfMonth.setDate(startOfMonth.getDate() - 30);
      return { startDate: startOfMonth.toISOString() };
    }
    default:
      return {};
  }
}
