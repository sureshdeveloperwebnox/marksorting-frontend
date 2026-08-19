'use client';

import * as React from 'react';
import { Check, ChevronDown, Search, Users } from 'lucide-react';
import { useCustomers, useCustomer } from '@/services/customer-service';
import { cn } from '@/lib/utils';

interface CustomerSearchSelectProps {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CustomerSearchSelect({
  value,
  onChange,
  placeholder = 'Select a customer...',
  disabled = false,
}: CustomerSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const { data, isLoading } = useCustomers({ skip: 0, take: 500, status: 'ACTIVE' });
  const customers = data?.customers || [];

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  // Primary lookup: find in the active list
  const selectedCustomer = customers.find((c) => c.id === value);

  // Fallback: fetch by ID when editing a record whose customer isn't in the ACTIVE list
  const { data: fallbackCustomer } = useCustomer(
    value && !selectedCustomer && !isLoading ? value : null
  );

  // Resolved display name — always shows name, never the raw ID
  const displayName = selectedCustomer?.name ?? fallbackCustomer?.name ?? null;

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

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        data-filled={Boolean(displayName)}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'w-full h-11 px-3 text-left rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 flex items-center justify-between gap-2',
          displayName
            ? 'bg-white dark:bg-[#18181b] border-2 border-gray-900 dark:border-white shadow-sm'
            : 'bg-primary/[0.025] dark:bg-primary/[0.05] border-2 border-primary dark:border-primary',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {displayName ? (
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
            {displayName}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">
            {isLoading ? 'Loading customers...' : placeholder}
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
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl shadow-black/10 overflow-hidden">
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
                placeholder="Search customers..."
                className="w-full h-9 pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-white/5 rounded-lg outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto py-1.5 scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-gray-400">
                <Users size={20} className="opacity-40" />
                <span className="text-xs font-semibold">
                  {search ? 'No customers match your search' : 'No customers available'}
                </span>
              </div>
            ) : (
              filtered.map((customer) => {
                const selected = value === customer.id;
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => select(customer.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150',
                      'hover:bg-primary/5 dark:hover:bg-primary/10',
                      selected && 'bg-primary/5 dark:bg-primary/10'
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-bold text-xs border border-primary/10 flex-shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', selected ? 'text-primary' : 'text-gray-800 dark:text-gray-200')}>
                        {customer.name}
                      </p>
                      {customer.email && (
                        <p className="text-[11px] text-gray-400 truncate">{customer.email}</p>
                      )}
                    </div>

                    {selected && <Check size={16} className="text-primary flex-shrink-0" />}
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
