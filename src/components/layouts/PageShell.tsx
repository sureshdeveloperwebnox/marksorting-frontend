'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PageShell({ children, className, contentClassName }: PageShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={cn("min-h-full", className)}
    >
      <div className={cn(
        "bg-white dark:bg-gray-900/60 backdrop-blur-3xl border border-slate-200/65 dark:border-white/5 rounded-[32px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] p-6 md:p-8 space-y-8 h-full",
        contentClassName
      )}>
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
  const words = title.split(' ');
  const lastWord = words[words.length - 1];
  const mainTitle = words.slice(0, -1).join(' ');

  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between gap-6", className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
          {mainTitle && `${mainTitle} `}
          <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            {lastWord}
          </span>
        </h1>
        {subtitle && (
          <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">
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
