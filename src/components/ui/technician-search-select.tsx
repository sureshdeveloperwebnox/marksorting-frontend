'use client';

import * as React from 'react';
import { Check, ChevronDown, Search, Wrench, X, Phone, Mail } from 'lucide-react';
import { useTechnicians, Technician } from '@/services/technician-service';
import { cn } from '@/lib/utils';

interface TechnicianSearchSelectProps {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function TechnicianSearchSelect({
  value,
  onChange,
  placeholder = 'Search and select service engineer...',
  disabled = false,
  className,
  error = false,
}: TechnicianSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const { data, isLoading } = useTechnicians({ skip: 0, take: 500 });
  const technicians: Technician[] = data?.technicians || [];

  // Filter out INACTIVE technicians and apply search
  const activeTechnicians = React.useMemo(() => {
    return technicians.filter((t) => t.status !== 'INACTIVE');
  }, [technicians]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return activeTechnicians;
    const q = search.toLowerCase().trim();
    return activeTechnicians.filter(
      (t) =>
        t.full_name.toLowerCase().includes(q) ||
        (t.phone || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q)
    );
  }, [activeTechnicians, search]);

  const selectedTechnician = React.useMemo(() => {
    return technicians.find((t) => t.id === value);
  }, [technicians, value]);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus search input on open
  React.useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  const getInitials = (name: string) => {
    if (!name) return 'SE';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          'w-full h-11 px-3 text-left rounded-xl outline-none transition-all duration-200 flex items-center justify-between gap-2.5',
          'bg-white dark:bg-gray-900 border text-xs font-semibold shadow-sm',
          error
            ? 'border-rose-500 ring-1 ring-rose-500/20'
            : open
            ? 'border-primary ring-2 ring-primary/20 shadow-md'
            : 'border-gray-200 dark:border-white/10 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-white/5',
          className
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedTechnician ? (
            <>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm flex-shrink-0">
                {getInitials(selectedTechnician.full_name)}
              </div>
              <div className="min-w-0 flex-1 truncate">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block truncate">
                  {selectedTechnician.full_name}
                </span>
                {selectedTechnician.phone && (
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block truncate">
                    {selectedTechnician.phone}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
              <Wrench size={14} className="opacity-60 shrink-0" />
              <span className="text-xs font-medium truncate">
                {isLoading ? 'Loading service engineers...' : placeholder}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedTechnician && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
              className="p-1 rounded-md text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={15}
            className={cn(
              'text-gray-400 transition-transform duration-200',
              open && 'rotate-180 text-primary'
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute z-[9999] top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/15 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type name, phone, or email to search..."
                className="w-full h-9 pl-9 pr-8 py-2 text-xs bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 font-semibold transition-all shadow-inner"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Service Engineers</span>
              <span>{filtered.length} available</span>
            </div>
          </div>

          {/* Engineers List */}
          <div className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-xs font-bold">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading service engineers...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
                <Wrench size={24} className="opacity-30" />
                <span className="text-xs font-semibold">
                  {search ? `No engineers match "${search}"` : 'No service engineers available'}
                </span>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            ) : (
              filtered.map((tech) => {
                const isSelected = value === tech.id;
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => handleSelect(tech.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150 group cursor-pointer',
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-gray-100/80 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-transform duration-150 group-hover:scale-105',
                          isSelected
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-primary/10 text-primary border border-primary/10 dark:bg-white/10 dark:text-gray-100'
                        )}
                      >
                        {getInitials(tech.full_name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate leading-tight">
                          {tech.full_name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                          {tech.phone ? (
                            <span className="flex items-center gap-1 truncate">
                              <Phone size={10} className="opacity-70" />
                              {tech.phone}
                            </span>
                          ) : tech.email ? (
                            <span className="flex items-center gap-1 truncate">
                              <Mail size={10} className="opacity-70" />
                              {tech.email}
                            </span>
                          ) : (
                            <span className="opacity-60">Service Technician</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
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
