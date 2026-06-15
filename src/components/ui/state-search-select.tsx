'use client';

import * as React from 'react';
import { Check, ChevronDown, Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Delhi","Ladakh","Jammu and Kashmir","Puducherry",
];

interface StateSearchSelectProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  openDirection?: 'up' | 'down';
}

export function StateSearchSelect({
  value,
  onChange,
  placeholder = 'Select State...',
  disabled = false,
  className,
  openDirection = 'down',
}: StateSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const filtered = INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const select = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'w-full px-3 text-left',
          'bg-gray-50/50 dark:bg-white/5 rounded-xl border border-transparent',
          'focus:ring-2 focus:ring-primary/20 focus:border-transparent outline-none',
          'transition-all duration-200',
          'flex items-center justify-between gap-2',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {value ? (
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
            {value}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">
            {placeholder}
          </span>
        )}

        <ChevronDown
          size={16}
          className={cn(
            'text-gray-400 flex-shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className={cn(
          "absolute z-[1000000] left-0 right-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl shadow-black/10 overflow-hidden",
          openDirection === 'up' ? "bottom-full mb-1.5" : "top-full mt-1.5"
        )}>
          <div className="p-2 border-b border-gray-100 dark:border-white/5">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search states..."
                className="w-full h-9 pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-white/5 rounded-lg outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 font-bold"
              />
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto py-1 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 gap-1 text-gray-400">
                <MapPin size={16} className="opacity-40" />
                <span className="text-[10px] font-bold">No states match</span>
              </div>
            ) : (
              filtered.map((state) => {
                const selected = value === state;
                return (
                  <button
                    key={state}
                    type="button"
                    onClick={() => select(state)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-left transition-all duration-150 text-xs font-bold',
                      'hover:bg-primary/5 dark:hover:bg-primary/10',
                      selected ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <span>{state}</span>
                    {selected && <Check size={14} className="text-primary flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
