'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeDisplayProps {
  className?: string;
  startDate?: Date;
  endDate?: Date;
}

export function DateRangeDisplay({ className, startDate, endDate }: DateRangeDisplayProps) {
  // Format current month dates by default if not provided
  const formatMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const yearFormatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
    });

    return `${formatter.format(start)} - ${formatter.format(end)}, ${yearFormatter.format(end)}`;
  };

  const displayText = startDate && endDate 
    ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : formatMonthRange();

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer',
        className
      )}
    >
      <Calendar size={14} className="text-zinc-400 dark:text-zinc-500" />
      <span>{displayText}</span>
    </button>
  );
}
