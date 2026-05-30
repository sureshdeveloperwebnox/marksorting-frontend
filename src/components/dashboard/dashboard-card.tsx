'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  titleIcon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardCard({
  title,
  titleIcon,
  action,
  children,
  className,
  ...props
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-zinc-800/80 dark:bg-zinc-950 transition-all duration-300',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 mb-4">
          {title && (
            <div className="flex items-center gap-2">
              {titleIcon && <div className="text-zinc-500 dark:text-zinc-400">{titleIcon}</div>}
              <h3 className="font-heading text-sm font-semibold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">
                {title}
              </h3>
            </div>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="relative w-full h-full">{children}</div>
    </div>
  );
}
