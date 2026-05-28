'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
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
}

/* ─── Constants ─────────────────────────────────────────────────── */

const PAGE_SIZE = 20;

const TYPE_DOT: Record<string, string> = {
  SERVICE_REPORT: 'bg-blue-500',
  INSTALLATION:   'bg-indigo-500',
  EXPENSE:        'bg-amber-500',
  TICKET:         'bg-rose-500',
  BROADCAST:      'bg-primary',
};

const TYPE_BADGE: Record<string, string> = {
  SERVICE_REPORT: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  INSTALLATION:   'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
  EXPENSE:        'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  TICKET:         'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  BROADCAST:      'bg-primary/10 text-primary border-primary/20',
};

const TYPE_LABEL: Record<string, string> = {
  SERVICE_REPORT: 'Service Report',
  INSTALLATION:   'Installation',
  EXPENSE:        'Expense',
  TICKET:         'Ticket',
  BROADCAST:      'Broadcast',
};

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
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-gray-950 flex-shrink-0">
      {/* Left: info */}
      <span className="text-[11px] text-gray-400">
        Page <span className="font-semibold text-gray-600 dark:text-gray-300">{page + 1}</span>
        {' '}of{' '}
        <span className="font-semibold text-gray-600 dark:text-gray-300">{totalPages}</span>
      </span>

      {/* Center: page numbers */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0 || isFetching}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {getPageNumbers().map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={isFetching}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all',
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
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Right: fetching indicator */}
      <div className="w-12 flex justify-end">
        {isFetching && <Loader2 size={13} className="animate-spin text-primary" />}
      </div>
    </div>
  );
}

/* ─── Main drawer component ─────────────────────────────────────── */

export function NotificationsDrawer({ open, onOpenChange, onMarkAllRead }: NotificationsDrawerProps) {
  const [page, setPage] = useState(0);
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notif-drawer', page],
    queryFn: async () => {
      const { data } = await api.get<DrawerResponse>(
        `/notifications?skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`,
      );
      return data;
    },
    enabled: open,
    placeholderData: (prev) => prev,
  });

  const notifications = data?.notifications ?? [];
  const total         = data?.total         ?? 0;
  const unreadCount   = data?.unreadCount   ?? 0;
  const totalPages    = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notif-drawer', page] });
      qc.setQueryData<DrawerResponse>(['notif-drawer', page], (old) => {
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
      qc.setQueryData<DrawerResponse>(['notif-drawer', page], (old) => {
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton className="w-full max-w-sm p-0 flex flex-col">

        {/* ── Header ── */}
        <SheetHeader className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-white/10 gap-0 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell size={15} className="text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base leading-tight">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1.5 text-sm font-semibold text-primary">({unreadCount})</span>
                )}
              </SheetTitle>
              <SheetDescription className="text-[11px] leading-tight mt-0.5">
                {total} total notification{total !== 1 ? 's' : ''}
              </SheetDescription>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 mr-9"
            >
              {markAllRead.isPending
                ? <Loader2 size={11} className="animate-spin" />
                : <CheckCheck size={11} />}
              Mark all read
            </button>
          )}
        </SheetHeader>

        {/* ── Scrollable notification list ── */}
        <div
          className={cn(
            'flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent divide-y divide-gray-50 dark:divide-white/5 transition-opacity duration-150',
            isFetching && !isLoading && 'opacity-60',
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <Bell size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => n.status === 'UNREAD' && markRead.mutate(n.id)}
                className={cn(
                  'flex items-start gap-3 px-5 py-4 w-full text-left transition-colors',
                  n.status === 'UNREAD'
                    ? 'bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5',
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                    TYPE_DOT[n.type] ?? 'bg-primary',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p
                      className={cn(
                        'text-sm leading-snug flex-1 min-w-0 truncate',
                        n.status === 'UNREAD'
                          ? 'font-bold text-gray-900 dark:text-white'
                          : 'font-semibold text-gray-700 dark:text-gray-300',
                      )}
                    >
                      {n.title}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
                        TYPE_BADGE[n.type] ?? 'bg-primary/10 text-primary border-primary/20',
                      )}
                    >
                      {TYPE_LABEL[n.type] ?? n.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    {format(new Date(n.created_at), 'h:mm a, MMM d, yyyy')}
                  </p>
                </div>
                {n.status === 'READ' && (
                  <Check size={12} className="text-gray-300 dark:text-gray-600 mt-1 flex-shrink-0" />
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
            onPageChange={handlePageChange}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
