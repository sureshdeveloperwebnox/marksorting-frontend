'use client';

import * as React from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<'days' | 'months' | 'years'>('days');
  const [popoverStyle, setPopoverStyle] = React.useState<React.CSSProperties>({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Parse value to Date object or default to null
  const selectedDate = React.useMemo(() => {
    if (!value) return null;
    try {
      const date = parseISO(value);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }, [value]);

  // Sync current month to selected date when opened
  React.useEffect(() => {
    if (isOpen && selectedDate) {
      setCurrentMonth(selectedDate);
    }
    if (!isOpen) {
      setViewMode('days'); // Reset view to day grid when closed
    }
  }, [isOpen, selectedDate]);

  React.useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const estimatedPopoverHeight = viewMode === 'years' ? 310 : 390;

    setPopoverStyle({
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: 0,
      width: '100%',
      minWidth: '280px',
      maxWidth: '320px',
      maxHeight: `${Math.min(estimatedPopoverHeight, window.innerHeight - 24)}px`,
    });
  }, [isOpen, viewMode]);

  // Handle click outside to close popover
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    // Listen for Escape key
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

  // Month navigation
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Quick select functions
  const handleSelectDate = (date: Date) => {
    const formatted = format(date, 'yyyy-MM-dd');
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    handleSelectDate(new Date());
  };

  // Calendar Day Generation
  const renderDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;

    const parsedMinDate = minDate ? parseISO(minDate) : null;
    const parsedMaxDate = maxDate ? parseISO(maxDate) : null;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(day, dateFormat);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isToday = isSameDay(day, new Date());
        
        let isDateDisabled = false;
        if (parsedMinDate && cloneDay < parsedMinDate) isDateDisabled = true;
        if (parsedMaxDate && cloneDay > parsedMaxDate) isDateDisabled = true;

        days.push(
          <button
            key={cloneDay.toString()}
            type="button"
            disabled={isDateDisabled}
            onClick={() => !isDateDisabled && handleSelectDate(cloneDay)}
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-xs font-medium transition-all relative flex items-center justify-center cursor-pointer select-none",
              !isCurrentMonth && "text-gray-300 dark:text-gray-600 font-medium",
              isCurrentMonth && "text-gray-800 dark:text-gray-200",
              isToday && !isSelected && "border border-primary/40 text-primary dark:text-primary",
              isSelected && "bg-primary text-white shadow-md shadow-primary/20 scale-105",
              !isSelected && !isDateDisabled && isCurrentMonth && "hover:bg-gray-100 dark:hover:bg-white/5 hover:scale-105",
              isDateDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
            )}
          >
            {formattedDate}
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

  // Month selection view helper
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const handleSelectMonth = (monthIndex: number) => {
    const newDate = new Date(currentMonth.getFullYear(), monthIndex, 1);
    setCurrentMonth(newDate);
    setViewMode('days');
  };

  // Year selection view helper
  const currentYear = currentMonth.getFullYear();
  const years = React.useMemo(() => {
    const list = [];
    for (let y = currentYear - 30; y <= currentYear + 10; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const handleSelectYear = (year: number) => {
    const newDate = new Date(year, currentMonth.getMonth(), 1);
    setCurrentMonth(newDate);
    setViewMode('days');
  };

  // Ref to automatically scroll to current year in year list view
  const yearListRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (viewMode === 'years' && yearListRef.current) {
      const activeYearBtn = yearListRef.current.querySelector('[data-active="true"]');
      if (activeYearBtn) {
        activeYearBtn.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [viewMode]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 px-4 rounded-xl flex items-center justify-between text-left text-sm transition-all outline-hidden border border-transparent select-none cursor-pointer",
          "bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/8 text-gray-800 dark:text-gray-200 font-medium shadow-sm",
          isOpen && "ring-2 ring-primary/20 bg-white dark:bg-gray-900 border-primary/20",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !value && "text-gray-400 dark:text-gray-600 font-medium")}>
          {selectedDate ? format(selectedDate, 'dd-MM-yyyy') : placeholder}
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
          <CalendarIcon size={16} className="text-gray-400 dark:text-gray-500" />
        </div>
      </button>

      {/* Floating Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={popoverStyle}
            className={cn(
              "z-[9999] overflow-y-auto p-3 sm:p-4 rounded-2xl border bg-white dark:bg-gray-950 border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-black/60 backdrop-blur-xl origin-top"
            )}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-1">
                {viewMode === 'days' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewMode('months')}
                      className="px-2 py-1 text-sm font-medium rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      {format(currentMonth, 'MMMM')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('years')}
                      className="px-2 py-1 text-sm font-medium rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      {format(currentMonth, 'yyyy')}
                    </button>
                  </>
                )}
                {viewMode === 'months' && (
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 px-2">
                    Select Month
                  </span>
                )}
                {viewMode === 'years' && (
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 px-2">
                    Select Year
                  </span>
                )}
              </div>

              {/* Navigation Chevrons */}
              {viewMode === 'days' ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewMode('days')}
                  className="text-xs font-medium text-primary hover:underline px-2 cursor-pointer"
                >
                  Back
                </button>
              )}
            </div>

            {/* DAY GRID VIEW */}
            {viewMode === 'days' && (
              <>
                {/* Weekdays header */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mt-3">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div
                      key={d}
                      className="h-8 flex items-center justify-center text-[10px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days matrix */}
                {renderDays()}
              </>
            )}

            {/* MONTH SELECTOR VIEW */}
            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {months.map((m, idx) => {
                  const isCurrent = currentMonth.getMonth() === idx;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      className={cn(
                        "h-10 rounded-xl text-xs font-medium transition-all cursor-pointer",
                        isCurrent 
                          ? "bg-primary text-white shadow-md shadow-primary/20" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            )}

            {/* YEAR SELECTOR VIEW */}
            {viewMode === 'years' && (
              <div
                ref={yearListRef}
                className="grid grid-cols-3 gap-2 mt-4 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10"
              >
                {years.map((y) => {
                  const isCurrent = currentMonth.getFullYear() === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      data-active={isCurrent ? 'true' : 'false'}
                      onClick={() => handleSelectYear(y)}
                      className={cn(
                        "h-10 rounded-xl text-xs font-medium transition-all cursor-pointer",
                        isCurrent 
                          ? "bg-primary text-white shadow-md shadow-primary/20" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                      )}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Calendar Footer Shortcuts */}
            {viewMode === 'days' && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-medium text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
