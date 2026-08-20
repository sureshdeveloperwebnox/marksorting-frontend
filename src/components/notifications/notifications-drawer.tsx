'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  X,
  Layers,
  Receipt,
  Wrench,
  Package,
  Ticket,
  Megaphone,
  RotateCcw,
  LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import api from '@/lib/api';
import {
  NotificationScope,
  getTypesForScope,
  getScopeLabel,
} from '@/utils/notification-scope';
import { DateRangePicker, DateRangeValue } from '@/components/ui/date-range-picker';

/* ─── Types ────────────────────────────────────────────────────── */

interface DrawerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: 'UNREAD' | 'READ';
  created_at: string;
}

interface DrawerResponse {
  notifications: DrawerNotification[];
  total: number;
  unreadCount: number;
}

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAllRead?: () => void;
  initialScope?: NotificationScope;
}

/* ─── Constants ─────────────────────────────────────────────────── */

const PAGE_SIZE = 20;

const TYPE_DOT: Record<string, string> = {
  SERVICE_REPORT: 'bg-blue-500',
  INSTALLATION:   'bg-indigo-500',
  EXPENSE:        'bg-amber-500',
  STORE:          'bg-emerald-500',
  TICKET:         'bg-rose-500',
  BROADCAST:      'bg-primary',
};

const TYPE_BADGE: Record<string, string> = {
  SERVICE_REPORT: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  INSTALLATION:   'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
  EXPENSE:        'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  STORE:          'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  TICKET:         'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  BROADCAST:      'bg-primary/10 text-primary border-primary/20',
};

const TYPE_LABEL: Record<string, string> = {
  SERVICE_REPORT: 'Service Report',
  INSTALLATION:   'Installation',
  EXPENSE:        'Expense',
  STORE:          'Store',
  TICKET:         'Ticket',
  BROADCAST:      'Broadcast',
};

const MODULE_OPTIONS: { id: NotificationScope; label: string; icon: LucideIcon }[] = [
  { id: 'ALL', label: 'All Notifications', icon: Layers },
  { id: 'EXPENSE', label: 'Expenses', icon: Receipt },
  { id: 'SERVICE_INSTALLATION', label: 'Services & Installations', icon: Wrench },
  { id: 'STORE', label: 'Stores', icon: Package },
  { id: 'TICKET', label: 'Tickets', icon: Ticket },
  { id: 'BROADCAST', label: 'Announcements', icon: Megaphone },
];

/* ─── Pagination component ──────────────────────────────────────── */

interface PaginationProps {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

function DrawerPagination({ page, totalPages, isFetching, onPageChange }: PaginationProps) {
  const MAX_VISIBLE = 5;

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= MAX_VISIBLE) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const pages: (number | '...')[] = [];
    const left  = Math.max(0, page - 1);
    const right = Math.min(totalPages - 1, page + 1);

    if (left > 0) {
      pages.push(0);
      if (left > 1) pages.push('...');
    }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) {
      if (right < totalPages - 2) pages.push('...');
      pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 sm:px-8 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-gray-950 flex-shrink-0">
      {/* Left: info */}
      <span className="text-xs text-gray-400 font-medium">
        Page <span className="font-bold text-gray-700 dark:text-gray-200">{page + 1}</span>
        {' '}of{' '}
        <span className="font-bold text-gray-700 dark:text-gray-200">{totalPages}</span>
      </span>

      {/* Center: page numbers */}
      <div className="flex items-center gap-1.5">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0 || isFetching}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={isFetching}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all',
                p === page
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40',
              )}
              aria-current={p === page ? 'page' : undefined}
            >
              {(p as number) + 1}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1 || isFetching}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Right: fetching indicator */}
      <div className="w-16 flex justify-end">
        {isFetching && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
            <Loader2 size={13} className="animate-spin" />
            <span>Updating…</span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main drawer component ─────────────────────────────────────── */

export function NotificationsDrawer({
  open,
  onOpenChange,
  onMarkAllRead,
  initialScope = 'ALL',
}: NotificationsDrawerProps) {
  const [page, setPage] = useState(0);
  const [activeScope, setActiveScope] = useState<NotificationScope>(initialScope);
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null);
  const qc = useQueryClient();

  // Sync with initialScope when drawer opens
  useEffect(() => {
    if (open) {
      if (initialScope) setActiveScope(initialScope);
      setDateRange(null);
      setPage(0);
    }
  }, [open, initialScope]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notif-drawer', page, activeScope, dateRange?.startDate, dateRange?.endDate],
    queryFn: async () => {
      const types = getTypesForScope(activeScope);
      const params = new URLSearchParams();
      params.set('skip', String(page * PAGE_SIZE));
      params.set('take', String(PAGE_SIZE));
      if (types && types.length > 0) {
        params.set('types', types.join(','));
      }
      if (dateRange?.startDate) params.set('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.set('endDate', dateRange.endDate);

      const { data } = await api.get<DrawerResponse>(`/notifications?${params.toString()}`);
      return data;
    },
    enabled: open,
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const notifications = data?.notifications ?? [];
  const total         = data?.total         ?? 0;
  const unreadCount   = data?.unreadCount   ?? 0;
  const totalPages    = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notif-drawer', page, activeScope, dateRange?.startDate, dateRange?.endDate] });
      qc.setQueryData<DrawerResponse>(['notif-drawer', page, activeScope, dateRange?.startDate, dateRange?.endDate], (old) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: Math.max(0, old.unreadCount - 1),
          notifications: old.notifications.map((n) =>
            n.id === id ? { ...n, status: 'READ' } : n,
          ),
        };
      });
    },
    onError: () => qc.invalidateQueries({ queryKey: ['notif-drawer'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      qc.setQueryData<DrawerResponse>(['notif-drawer', page, activeScope, dateRange?.startDate, dateRange?.endDate], (old) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: 0,
          notifications: old.notifications.map((n) => ({ ...n, status: 'READ' })),
        };
      });
      qc.invalidateQueries({ queryKey: ['notif-drawer'] });
      onMarkAllRead?.();
    },
  });

  const handleScopeChange = (scope: NotificationScope) => {
    setActiveScope(scope);
    setPage(0);
  };

  const handleDateRangeChange = (val: DateRangeValue) => {
    setDateRange(val);
    setPage(0);
  };

  const handleResetFilters = () => {
    setActiveScope('ALL');
    setDateRange(null);
    setPage(0);
  };

  const hasActiveFilters =
    activeScope !== 'ALL' ||
    (dateRange !== null && !!dateRange.startDate);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl p-0 flex flex-col"
      >
        {/* ── Header ── */}
        <SheetHeader className="flex-row items-center justify-between px-6 pt-6 pb-4 sm:px-8 border-b border-gray-100 dark:border-white/10 gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <SheetTitle className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                  Notifications
                </SheetTitle>
                {unreadCount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {unreadCount} unread
                  </span>
                )}
                {activeScope !== 'ALL' && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-primary text-white shadow-xs">
                    {getScopeLabel(activeScope)}
                  </span>
                )}
              </div>
              <SheetDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {total} total notification{total !== 1 ? 's' : ''} {activeScope !== 'ALL' ? `in ${getScopeLabel(activeScope)}` : ''}
              </SheetDescription>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 mr-8 px-3 py-1.5 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10"
            >
              {markAllRead.isPending
                ? <Loader2 size={13} className="animate-spin" />
                : <CheckCheck size={14} />}
              Mark all read
            </button>
          )}
        </SheetHeader>

        {/* ── Modern Segmented Filter Controls ── */}
        <div className="px-6 py-3.5 sm:px-8 border-b border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] flex flex-col gap-3 flex-shrink-0">
          {/* Module scope segmented pill container */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-200/60 dark:bg-gray-800/60 rounded-xl overflow-x-auto scrollbar-none">
            {MODULE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = activeScope === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleScopeChange(opt.id)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap flex-shrink-0 cursor-pointer',
                    isActive
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs font-bold ring-1 ring-black/5 dark:ring-white/10 scale-[1.01]'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                  )}
                >
                  <Icon size={13} className={cn(isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500')} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Date range filter picker & Reset button */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto scrollbar-none pt-0.5">
            <div className="flex items-center gap-2">
              <DateRangePicker
                value={
                  dateRange || {
                    startDate: '',
                    endDate: '',
                    label: 'Select Date Range',
                  }
                }
                onChange={handleDateRangeChange}
                placeholder="Select Date Range"
                className={cn(
                  'h-8 text-xs px-3 py-1 rounded-lg border transition-all duration-150 font-medium cursor-pointer shadow-2xs',
                  dateRange?.startDate && dateRange?.endDate
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-gray-200/90 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-white/20'
                )}
              />
              {dateRange?.startDate && dateRange?.endDate && (
                <button
                  onClick={() => setDateRange(null)}
                  className="p-1 rounded-md text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Clear date filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors ml-auto flex-shrink-0 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/30 cursor-pointer"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* ── Scrollable notification list ── */}
        <div
          className={cn(
            'flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent divide-y divide-gray-100 dark:divide-white/5 transition-opacity duration-150',
            isFetching && !isLoading && 'opacity-60',
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <Loader2 size={22} className="animate-spin text-primary" />
              <span className="text-sm font-medium">Loading notifications…</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center mb-4">
                <Bell size={26} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                {hasActiveFilters ? 'No matching notifications' : 'No notifications yet'}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-sm">
                {hasActiveFilters
                  ? 'Try changing or clearing your module and date filters to see more results.'
                  : "You're all caught up! When new updates arrive, they will appear here."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/15 transition-colors"
                >
                  Show all notifications
                </button>
              )}
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => n.status === 'UNREAD' && markRead.mutate(n.id)}
                className={cn(
                  'flex items-start gap-4 px-6 py-4.5 sm:px-8 w-full text-left transition-colors group',
                  n.status === 'UNREAD'
                    ? 'bg-primary/[0.04] dark:bg-primary/[0.08] hover:bg-primary/[0.08] dark:hover:bg-primary/[0.12]'
                    : 'hover:bg-gray-50/80 dark:hover:bg-white/[0.03]',
                )}
              >
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 transition-transform group-hover:scale-125',
                    TYPE_DOT[n.type] ?? 'bg-primary',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p
                      className={cn(
                        'text-sm sm:text-base leading-snug flex-1 min-w-0 truncate',
                        n.status === 'UNREAD'
                          ? 'font-bold text-gray-900 dark:text-white'
                          : 'font-semibold text-gray-700 dark:text-gray-300',
                      )}
                    >
                      {n.title}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full border',
                        TYPE_BADGE[n.type] ?? 'bg-primary/10 text-primary border-primary/20',
                      )}
                    >
                      {TYPE_LABEL[n.type] ?? n.type}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    {format(new Date(n.created_at), 'h:mm a, MMM d, yyyy')}
                  </p>
                </div>
                {n.status === 'READ' && (
                  <Check size={14} className="text-gray-300 dark:text-gray-600 mt-1 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <DrawerPagination
            page={page}
            totalPages={totalPages}
            isFetching={isFetching}
            onPageChange={setPage}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

