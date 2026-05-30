'use client';

import { Bell, X, Wrench, Receipt, TicketCheck, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PushNotificationType =
  | 'BROADCAST'
  | 'SERVICE_REPORT'
  | 'INSTALLATION'
  | 'EXPENSE'
  | 'TICKET'
  | string;

interface PushNotificationToastProps {
  title: string;
  message: string;
  type?: PushNotificationType;
  createdAt?: string | Date;
  onDismiss?: () => void;
}

interface TypeConfig {
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  iconColor: string;
  badge: string;
  badgeText: string;
  accentBar: string;
  pulseDot: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  BROADCAST: {
    icon: Bell,
    gradient: 'from-orange-500/10 via-transparent to-transparent',
    iconBg: 'bg-orange-100 dark:bg-orange-500/15',
    iconColor: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
    badgeText: 'Broadcast',
    accentBar: 'bg-orange-500',
    pulseDot: 'bg-orange-400',
  },
  SERVICE_REPORT: {
    icon: FileText,
    gradient: 'from-blue-500/10 via-transparent to-transparent',
    iconBg: 'bg-blue-100 dark:bg-blue-500/15',
    iconColor: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    badgeText: 'Service Report',
    accentBar: 'bg-blue-500',
    pulseDot: 'bg-blue-400',
  },
  INSTALLATION: {
    icon: Wrench,
    gradient: 'from-indigo-500/10 via-transparent to-transparent',
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/15',
    iconColor: 'text-indigo-500',
    badge: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
    badgeText: 'Installation',
    accentBar: 'bg-indigo-500',
    pulseDot: 'bg-indigo-400',
  },
  EXPENSE: {
    icon: Receipt,
    gradient: 'from-amber-500/10 via-transparent to-transparent',
    iconBg: 'bg-amber-100 dark:bg-amber-500/15',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    badgeText: 'Expense',
    accentBar: 'bg-amber-500',
    pulseDot: 'bg-amber-400',
  },
  TICKET: {
    icon: TicketCheck,
    gradient: 'from-rose-500/10 via-transparent to-transparent',
    iconBg: 'bg-rose-100 dark:bg-rose-500/15',
    iconColor: 'text-rose-500',
    badge: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    badgeText: 'Ticket',
    accentBar: 'bg-rose-500',
    pulseDot: 'bg-rose-400',
  },
};

const FALLBACK_CONFIG = TYPE_CONFIG.BROADCAST;

function formatToastTime(value?: string | Date): string {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function PushNotificationToast({
  title,
  message,
  type = 'BROADCAST',
  createdAt,
  onDismiss,
}: PushNotificationToastProps) {
  const config = TYPE_CONFIG[type] ?? FALLBACK_CONFIG;
  const Icon = config.icon as any;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3.5 w-full min-w-[300px] max-w-[380px]',
        'bg-white dark:bg-gray-900',
        'border border-gray-100 dark:border-white/10',
        'rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40',
        'px-4 py-3.5 overflow-hidden',
      )}
    >
      {/* Gradient accent background */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none rounded-2xl',
          config.gradient,
        )}
      />

      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-3 bottom-3 w-[3px] rounded-full', config.accentBar)} />

      {/* Icon */}
      <div className={cn('relative flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5', config.iconBg)}>
        <Icon size={16} className={cn('flex-shrink-0', config.iconColor)} strokeWidth={2.5} />
      </div>

      {/* Content */}
      <div className="relative flex-1 min-w-0 pr-1">
        {/* Badge + dismiss row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', config.badge)}>
            {config.badgeText}
          </span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              aria-label="Dismiss notification"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Title */}
        <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-snug truncate">
          {title}
        </p>

        {/* Message */}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium line-clamp-2 leading-relaxed">
          {message}
        </p>

        {/* Footer indicator */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1.5">
            <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', config.pulseDot)} />
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Mark Sorter
            </span>
          </div>
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tabular-nums">
            {formatToastTime(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
