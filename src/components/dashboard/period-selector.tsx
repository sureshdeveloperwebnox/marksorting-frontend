'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PeriodSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function PeriodSelector({ value = 'monthly', onValueChange, className }: PeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={(val) => val && onValueChange?.(val)}>
      <SelectTrigger className="w-[110px] rounded-lg border-zinc-200/80 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 h-8 font-bold text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-300 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <SelectValue placeholder="Period" />
      </SelectTrigger>
      <SelectContent className="rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-md">
        <SelectItem value="weekly" className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 rounded-md">Weekly</SelectItem>
        <SelectItem value="monthly" className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 rounded-md">Monthly</SelectItem>
        <SelectItem value="yearly" className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 rounded-md">Yearly</SelectItem>
      </SelectContent>
    </Select>
  );
}
