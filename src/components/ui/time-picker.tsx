'use client';

import * as React from 'react';
import { Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TimePickerProps {
  value?: string; // "HH:MM" in 24-hour format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  className,
  disabled = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [popoverAlign, setPopoverAlign] = React.useState<'left' | 'right'>('right');
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const hourListRef = React.useRef<HTMLDivElement>(null);
  const minuteListRef = React.useRef<HTMLDivElement>(null);
  const ampmListRef = React.useRef<HTMLDivElement>(null);

  // Parse "HH:MM" (24h) to 12h parts
  const parsedTime = React.useMemo<{ hour: string; minute: string; ampm: 'AM' | 'PM' }>(() => {
    if (!value) return { hour: '12', minute: '00', ampm: 'AM' };
    
    const parts = value.split(':');
    if (parts.length < 2) return { hour: '12', minute: '00', ampm: 'AM' };
    
    let hour24 = parseInt(parts[0], 10);
    const minute = parts[1].padStart(2, '0');
    
    if (isNaN(hour24)) return { hour: '12', minute: '00', ampm: 'AM' };
    
    let ampm: 'AM' | 'PM' = 'AM';
    if (hour24 >= 12) {
      ampm = 'PM';
      if (hour24 > 12) hour24 -= 12;
    } else if (hour24 === 0) {
      hour24 = 12;
    }
    
    return {
      hour: hour24.toString().padStart(2, '0'),
      minute,
      ampm,
    };
  }, [value]);

  // Convert 12h parts back to "HH:MM" (24h)
  const setTimeValue = (hour12: string, min: string, meridian: 'AM' | 'PM') => {
    let hour24 = parseInt(hour12, 10);
    if (isNaN(hour24)) hour24 = 12;
    
    if (meridian === 'PM') {
      if (hour24 < 12) hour24 += 12;
    } else {
      if (hour24 === 12) hour24 = 0;
    }
    
    const formattedHour24 = hour24.toString().padStart(2, '0');
    const formattedMinute = min.padStart(2, '0');
    onChange(`${formattedHour24}:${formattedMinute}`);
  };

  // Close when clicking outside or pressing Escape
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Smooth scroll active items to center when opened
  const scrollToActive = React.useCallback(() => {
    const scrollList = (listRef: React.RefObject<HTMLDivElement | null>) => {
      if (!listRef.current) return;
      const activeBtn = listRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    };

    scrollList(hourListRef);
    scrollList(minuteListRef);
    scrollList(ampmListRef);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure DOM is fully rendered before scrolling
      const t = setTimeout(scrollToActive, 80);
      return () => clearTimeout(t);
    }
  }, [isOpen, scrollToActive]);

  React.useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updateAlignment = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const popoverWidth = Math.min(260, window.innerWidth - 24);
      const rightOverflow = rect.left + popoverWidth > window.innerWidth - 12;
      setPopoverAlign(rightOverflow ? 'right' : 'left');
    };

    updateAlignment();
    window.addEventListener('resize', updateAlignment);
    return () => window.removeEventListener('resize', updateAlignment);
  }, [isOpen]);

  const handleHourSelect = (hour: string) => {
    setTimeValue(hour, parsedTime.minute, parsedTime.ampm);
  };

  const handleMinuteSelect = (min: string) => {
    setTimeValue(parsedTime.hour, min, parsedTime.ampm);
  };

  const handleAmpmSelect = (meridian: 'AM' | 'PM') => {
    setTimeValue(parsedTime.hour, parsedTime.minute, meridian);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const handleNow = () => {
    const now = new Date();
    const formatted = format(now, 'HH:mm');
    onChange(formatted);
    setIsOpen(false);
  };

  // Generate selector lists
  const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Display value formatting
  const displayValue = React.useMemo(() => {
    if (!value) return '';
    return `${parsedTime.hour}:${parsedTime.minute} ${parsedTime.ampm}`;
  }, [value, parsedTime]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 px-4 rounded-xl flex items-center justify-between text-left text-sm transition-all outline-hidden border border-transparent select-none cursor-pointer",
          "bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/8 text-gray-800 dark:text-gray-200 font-bold shadow-sm",
          isOpen && "ring-2 ring-primary/20 bg-white dark:bg-gray-900 border-primary/20",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !value && "text-gray-400 dark:text-gray-600 font-medium")}>
          {displayValue || placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-gray-400">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X size={14} />
            </span>
          )}
          <Clock size={16} className="text-gray-400 dark:text-gray-500" />
        </div>
      </button>

      {/* Popover Columns Selector */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-[9999] mt-1 w-[min(260px,calc(100vw-1.5rem))] rounded-2xl border bg-white dark:bg-gray-950 border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-black/60 backdrop-blur-xl",
              popoverAlign === 'right' ? "right-0 origin-top-right" : "left-0 origin-top-left"
            )}
          >
            {/* Header Display */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Select Time
              </span>
              <span className="text-sm font-black text-primary bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded-lg">
                {displayValue || '12:00 AM'}
              </span>
            </div>

            {/* Selector Grid */}
            <div className="flex flex-row h-[180px] px-2 py-0">
              {/* Hours Column */}
              <div
                ref={hourListRef}
                className="flex-1 w-1/3 overflow-y-auto scrollbar-none space-y-1 px-1"
                style={{ scrollSnapType: 'y mandatory', paddingTop: '74px', paddingBottom: '74px' }}
              >
                {hoursList.map((h) => {
                  const isSelected = parsedTime.hour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-active={isSelected ? 'true' : 'false'}
                      onClick={() => handleHourSelect(h)}
                      style={{ scrollSnapAlign: 'center' }}
                      className={cn(
                        "w-full h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center select-none",
                        isSelected
                          ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                      )}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>

              {/* Minutes Column */}
              <div
                ref={minuteListRef}
                className="flex-1 w-1/3 overflow-y-auto scrollbar-none space-y-1 px-1 border-x border-gray-50 dark:border-white/5"
                style={{ scrollSnapType: 'y mandatory', paddingTop: '74px', paddingBottom: '74px' }}
              >
                {minutesList.map((m) => {
                  const isSelected = parsedTime.minute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      data-active={isSelected ? 'true' : 'false'}
                      onClick={() => handleMinuteSelect(m)}
                      style={{ scrollSnapAlign: 'center' }}
                      className={cn(
                        "w-full h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center select-none",
                        isSelected
                          ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              {/* AM/PM Column */}
              <div
                ref={ampmListRef}
                className="flex-1 w-1/3 overflow-y-auto scrollbar-none space-y-1 px-1"
                style={{ scrollSnapType: 'y mandatory', paddingTop: '74px', paddingBottom: '74px' }}
              >
                {['AM', 'PM'].map((ampm) => {
                  const isSelected = parsedTime.ampm === ampm;
                  return (
                    <button
                      key={ampm}
                      type="button"
                      data-active={isSelected ? 'true' : 'false'}
                      onClick={() => handleAmpmSelect(ampm as 'AM' | 'PM')}
                      style={{ scrollSnapAlign: 'center' }}
                      className={cn(
                        "w-full h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center select-none",
                        isSelected
                          ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                      )}
                    >
                      {ampm}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Shortcuts */}
            <div className="flex items-center justify-between p-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 rounded-b-2xl">
              <button
                type="button"
                onClick={handleNow}
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
