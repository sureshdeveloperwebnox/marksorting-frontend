'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendBadgeProps {
  trend: 'up' | 'down' | 'neutral';
  value: string;
  subtitle?: string;
  className?: string;
}

export function TrendBadge({ trend, value, subtitle, className }: TrendBadgeProps) {
  const isUp = trend === 'up';
  const isDown = trend === 'down';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors duration-300',
        isUp && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        isDown && 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
        !isUp && !isDown && 'bg-zinc-50 text-zinc-600 dark:bg-zinc-500/10 dark:text-zinc-400',
        className
      )}
    >
      {isUp ? (
        <TrendingUp size={12} className="shrink-0" />
      ) : isDown ? (
        <TrendingDown size={12} className="shrink-0" />
      ) : (
        <Minus size={12} className="shrink-0" />
      )}
      <span>{value}</span>
      {subtitle && (
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium ml-1">
          {subtitle}
        </span>
      )}
    </div>
  );
}
