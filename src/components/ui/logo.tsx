'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  isCollapsed?: boolean;
}

export function Logo({ className, isCollapsed = false }: LogoProps) {
  return (
    <div className={cn('flex items-center justify-center w-full transition-all duration-300', className)}>
      <div className={cn(
        "bg-white shadow-xl flex items-center justify-center overflow-hidden transition-all duration-300",
        isCollapsed 
          ? "w-10 h-10 rounded-xl p-1.5" 
          : "rounded-2xl p-3 w-full max-w-[200px] h-20"
      )}>
        <img
          src={isCollapsed ? "/assets/favion.png" : "/assets/logo.png"}
          alt="Mark Sorting Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
