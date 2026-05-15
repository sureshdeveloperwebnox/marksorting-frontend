'use client';

import Image from 'next/image';
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
          ? "w-12 h-12 rounded-2xl p-2" 
          : "rounded-[24px] p-4 w-full max-w-[210px] h-24 shadow-inner bg-white"
      )}>
        <Image
          src={isCollapsed ? "/assets/favicon.png" : "/assets/logo.png"}
          alt="Mark Sorting Logo"
          width={200}
          height={80}
          className="w-full h-full object-contain filter drop-shadow-sm"
          priority
        />
      </div>
    </div>
  );
}
