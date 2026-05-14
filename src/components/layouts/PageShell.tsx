'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={cn("min-h-full", className)}
    >
      <div className="bg-white/70 dark:bg-gray-950/40 backdrop-blur-3xl border border-white dark:border-white/5 rounded-[32px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] p-6 md:p-8 space-y-8 h-full">
        {children}
      </div>
    </motion.div>
  );
}

interface PageShellHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageShellHeader({ title, subtitle, action, className }: PageShellHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between gap-6", className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          {title} <span className="text-primary text-4xl leading-none">.</span>
        </h1>
        {subtitle && (
          <p className="text-gray-500 dark:text-gray-400 font-bold">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-4">
          {action}
        </div>
      )}
    </div>
  );
}

interface PageShellContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShellContent({ children, className }: PageShellContentProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}
