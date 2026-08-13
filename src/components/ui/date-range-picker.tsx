'use client';

import * as React from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
  isAfter,
  isBefore,
  subDays,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  startDate: string; // 'yyyy-MM-dd'
  endDate: string;   // 'yyyy-MM-dd'
  label: string;     // Preset or 'Custom Range'
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  // Internal selection state for custom range
  const [tempStart, setTempStart] = React.useState<Date | null>(null);
  const [tempEnd, setTempEnd] = React.useState<Date | null>(null);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = React.useState<React.CSSProperties>({});

  const parsedStart = React.useMemo(() => (value.startDate ? parseISO(value.startDate) : null), [value.startDate]);
  const parsedEnd = React.useMemo(() => (value.endDate ? parseISO(value.endDate) : null), [value.endDate]);

  // Sync internal dates when popover opens
  React.useEffect(() => {
    if (isOpen) {
      setTempStart(parsedStart);
      setTempEnd(parsedEnd);
      if (parsedStart) {
        setCurrentMonth(parsedStart);
      }
    }
  }, [isOpen, parsedStart, parsedEnd]);

  // Handle outside click and escape key
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

  // Dynamically position the popover
  React.useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const estimatedHeight = 380;

    setPopoverStyle({
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: 0,
      width: '100%',
      minWidth: '280px',
      maxWidth: '540px',
      maxHeight: `${Math.min(estimatedHeight, window.innerHeight - 24)}px`,
    });
  }, [isOpen]);

  // Presets definition
  const presets = React.useMemo(() => {
    const today = new Date();
    const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');
    
    return [
      {
        label: 'Today',
        startDate: formatDate(today),
        endDate: formatDate(today),
      },
      {
        label: 'Yesterday',
        startDate: formatDate(subDays(today, 1)),
        endDate: formatDate(subDays(today, 1)),
      },
      {
        label: 'Last 7 Days',
        startDate: formatDate(subDays(today, 6)),
        endDate: formatDate(today),
      },
      {
        label: 'Last 30 Days',
        startDate: formatDate(subDays(today, 29)),
        endDate: formatDate(today),
      },
      {
        label: 'This Month',
        startDate: formatDate(startOfMonth(today)),
        endDate: formatDate(today),
      },
      {
        label: 'Last Month',
        startDate: formatDate(startOfMonth(subMonths(today, 1))),
        endDate: formatDate(endOfMonth(subMonths(today, 1))),
      },
      {
        label: 'Custom Range',
        startDate: value.startDate,
        endDate: value.endDate,
      },
    ];
  }, [value.startDate, value.endDate]);

  const handlePresetSelect = (preset: typeof presets[0]) => {
    if (preset.label === 'Custom Range') {
      return;
    }
    onChange({
      startDate: preset.startDate,
      endDate: preset.endDate,
      label: preset.label,
    });
    setIsOpen(false);
  };

  const handleDateClick = (date: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (isBefore(date, tempStart)) {
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
    }
  };

  const handleApply = () => {
    if (tempStart) {
      const effectiveEnd = tempEnd ?? tempStart;
      onChange({
        startDate: format(tempStart, 'yyyy-MM-dd'),
        endDate: format(effectiveEnd, 'yyyy-MM-dd'),
        label: 'Custom Range',
      });
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      startDate: '',
      endDate: '',
      label: '',
    });
    setIsOpen(false);
  };

  // Helper to determine if day is inside active range
  const isDayInRange = (day: Date) => {
    if (tempStart && tempEnd) {
      return (
        (isAfter(day, tempStart) || isSameDay(day, tempStart)) &&
        (isBefore(day, tempEnd) || isSameDay(day, tempEnd))
      );
    }
    if (tempStart && hoverDate && !tempEnd) {
      return (
        (isAfter(day, tempStart) || isSameDay(day, tempStart)) &&
        (isBefore(day, hoverDate) || isSameDay(day, hoverDate))
      );
    }
    return false;
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const today = new Date();

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, today);
        
        const isSelectedStart = tempStart ? isSameDay(day, tempStart) : false;
        const isSelectedEnd = tempEnd ? isSameDay(day, tempEnd) : false;
        const inRange = isDayInRange(day);

        days.push(
          <button
            key={cloneDay.toString()}
            type="button"
            onClick={() => handleDateClick(cloneDay)}
            onMouseEnter={() => !tempEnd && setHoverDate(cloneDay)}
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 text-xs font-medium transition-all relative flex items-center justify-center cursor-pointer select-none",
              !isCurrentMonth && "text-gray-300 dark:text-gray-700",
              isCurrentMonth && "text-gray-800 dark:text-gray-200",
              inRange && "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light font-bold",
              isToday && !isSelectedStart && !isSelectedEnd && "border border-primary/40 text-primary rounded-xl",
              isSelectedStart && "bg-primary text-white rounded-l-xl font-bold shadow-md shadow-primary/20",
              isSelectedEnd && "bg-primary text-white rounded-r-xl font-bold shadow-md shadow-primary/20",
              isSelectedStart && isSelectedEnd && "rounded-xl",
              !isSelectedStart && !isSelectedEnd && !inRange && isCurrentMonth && "hover:bg-gray-100 dark:hover:bg-white/5 hover:rounded-xl hover:scale-105"
            )}
          >
            {format(day, 'd')}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1 mt-2">{rows}</div>;
  };

  const formattedDisplayRange = React.useMemo(() => {
    if (!parsedStart || !parsedEnd) return 'Select dates';
    
    if (value.label && value.label !== 'Custom Range') {
      return value.label;
    }
    
    const startStr = format(parsedStart, 'dd MMM yyyy');
    const endStr = format(parsedEnd, 'dd MMM yyyy');
    return `${startStr} - ${endStr}`;
  }, [parsedStart, parsedEnd, value.label]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-10 px-4 rounded-xl flex items-center justify-between gap-2.5 text-xs font-bold transition-all outline-hidden border select-none cursor-pointer",
          "bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5",
          "text-gray-700 dark:text-gray-300 shadow-sm hover:border-primary/50 hover:text-primary",
          isOpen && "ring-2 ring-primary/20 border-primary/50 text-primary bg-primary/5 dark:bg-primary/10",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon size={14} className="shrink-0 text-gray-400 dark:text-gray-500" />
          <span className="truncate">{formattedDisplayRange}</span>
        </div>
        {value.startDate && value.endDate && !disabled && (
          <span
            onClick={handleClear}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 hover:text-rose-500 transition-colors cursor-pointer shrink-0 ml-1.5"
            title="Clear Selection"
          >
            <X size={12} className="text-gray-400 hover:text-rose-500" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={popoverStyle}
            className={cn(
              "z-[9999] p-2 sm:p-3 rounded-2xl border bg-white dark:bg-gray-950 border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-black/60 backdrop-blur-xl origin-top flex flex-col md:flex-row gap-4"
            )}
          >
            {/* Presets Sidebar */}
            <div className="w-full md:w-[160px] flex flex-col gap-1 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 pb-3 md:pb-0 md:pr-3 shrink-0">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 mb-1.5 block">
                Filter Presets
              </span>
              {presets.map((preset) => {
                const isActive = value.label === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer w-full hover:bg-gray-50 dark:hover:bg-white/5",
                      isActive
                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-bold"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white"
                    )}
                  >
                    {preset.label}
                    {isActive && <Check size={12} className="text-primary shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {/* Calendar Pane */}
            <div className="flex-1 flex flex-col">
              {/* Header with Navigation */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mt-2.5">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <div
                    key={d}
                    className="h-8 flex items-center justify-center text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
              {renderCalendar()}

              {/* Custom Selector Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/5 gap-2">
                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  {tempStart && tempEnd ? (
                    <span>
                      Selected {format(tempStart, 'dd MMM')} to {format(tempEnd, 'dd MMM')}
                    </span>
                  ) : tempStart ? (
                    <span>Selected {format(tempStart, 'dd MMM')}</span>
                  ) : (
                    <span>Choose start date...</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(tempStart || tempEnd || value.startDate || value.endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempStart(null);
                        setTempEnd(null);
                        onChange({ startDate: "", endDate: "", label: "" });
                        setIsOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!tempStart}
                    onClick={handleApply}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md",
                      tempStart
                        ? "bg-primary text-white hover:bg-primary/95 shadow-primary/10"
                        : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-600 cursor-not-allowed shadow-none"
                    )}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
