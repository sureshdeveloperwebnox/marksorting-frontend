import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'white';
}

export function Logo({ className, showText = true, variant = 'default' }: LogoProps) {
  const isWhite = variant === 'white';
  const mainColor = isWhite ? '#FFFFFF' : '#F37021';
  const bgColor = isWhite ? 'rgba(255,255,255,0.1)' : '#1A2B23';
  const textColor = isWhite ? 'text-white' : 'text-[#F37021]';
  const subTextColor = isWhite ? 'text-white/60' : 'text-[#1A2B23] dark:text-gray-400';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background Square */}
          <rect width="100" height="100" rx="12" fill={bgColor} />
          
          {/* Stylized Arrow/Shape */}
          <path
            d="M25 80L45 35L55 80H25Z"
            fill={mainColor}
          />
          <path
            d="M48 80L68 35L78 80H48Z"
            fill={mainColor}
            fillOpacity="0.8"
          />
          
          {/* Three Dots */}
          <circle cx="35" cy="25" r="4" fill={mainColor} />
          <circle cx="45" cy="15" r="4" fill={mainColor} />
          <circle cx="55" cy="25" r="4" fill={mainColor} />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-0.5 leading-none">
            <span className={cn("text-2xl font-black tracking-tight", textColor)}>mark</span>
            <span className={cn("text-[10px] font-bold align-top", textColor)}>®</span>
          </div>
          <span className={cn("text-[9px] font-black tracking-[0.2em] uppercase -mt-0.5", subTextColor)}>
            Sorting System
          </span>
        </div>
      )}
    </div>
  );
}
