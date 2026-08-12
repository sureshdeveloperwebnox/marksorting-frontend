'use client';

import { useState, useEffect } from 'react';
import { QueryActivityLogsDto } from '../types/activity-log.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DatePicker } from '@/components/ui/date-picker';
import { Search, X, Filter, SlidersHorizontal, ShieldCheck, RotateCcw } from 'lucide-react';
import { useUsers } from '@/services/user-service';
import { cn } from '@/lib/utils';

export const ACTION_OPTIONS = [
  { value: 'ALL',      label: 'All Actions',     iconColor: 'bg-gray-400 dark:bg-gray-500' },
  { value: 'LOGIN',    label: 'Login',           iconColor: 'bg-blue-500', animatePulse: true },
  { value: 'LOGOUT',   label: 'Logout',          iconColor: 'bg-slate-500' },
  { value: 'CREATE',   label: 'Create',          iconColor: 'bg-emerald-500', animatePulse: true },
  { value: 'UPDATE',   label: 'Update',          iconColor: 'bg-amber-500', animatePulse: true },
  { value: 'DELETE',   label: 'Delete',          iconColor: 'bg-rose-500', animatePulse: true },
  { value: 'VIEW',     label: 'View',            iconColor: 'bg-cyan-500' },
  { value: 'EXPORT',   label: 'Export',          iconColor: 'bg-violet-500' },
  { value: 'APPROVE',  label: 'Approve',         iconColor: 'bg-green-500', animatePulse: true },
  { value: 'REJECT',   label: 'Reject',          iconColor: 'bg-red-500', animatePulse: true },
  { value: 'ASSIGN',   label: 'Assign',          iconColor: 'bg-indigo-500' },
  { value: 'COMPLETE', label: 'Complete',        iconColor: 'bg-teal-500', animatePulse: true },
];

export const ENTITY_OPTIONS = [
  { value: 'ALL',                  label: 'All Modules',          iconColor: 'bg-gray-400 dark:bg-gray-500' },
  { value: 'customers',            label: 'Customers',            iconColor: 'bg-blue-500' },
  { value: 'mills',                label: 'Mills',                iconColor: 'bg-emerald-500', animatePulse: true },
  { value: 'users',                label: 'Users',                iconColor: 'bg-violet-500' },
  { value: 'service_reports',      label: 'Service Reports',      iconColor: 'bg-amber-500', animatePulse: true },
  { value: 'installation_reports', label: 'Installation Reports', iconColor: 'bg-cyan-500' },
  { value: 'expenses',             label: 'Expenses',             iconColor: 'bg-rose-500' },
  { value: 'expense_categories',   label: 'Expense Categories',   iconColor: 'bg-orange-500' },
  { value: 'service_categories',   label: 'Service Categories',   iconColor: 'bg-teal-500' },
  { value: 'tickets',              label: 'Support Tickets',      iconColor: 'bg-indigo-500', animatePulse: true },
  { value: 'stores',               label: 'Stores',               iconColor: 'bg-pink-500' },
  { value: 'materials',            label: 'Materials',            iconColor: 'bg-lime-500' },
  { value: 'roles',                label: 'Roles',                iconColor: 'bg-purple-500' },
  { value: 'settings',             label: 'Settings',             iconColor: 'bg-slate-500' },
  { value: 'technicians',          label: 'Technicians',          iconColor: 'bg-sky-500' },
];

interface ActivityLogFiltersProps {
  filters: QueryActivityLogsDto;
  onFiltersChange: (filters: QueryActivityLogsDto) => void;
  /** Controlled open state - parent manages visibility */
  isOpen?: boolean;
  onClose?: () => void;
  onReset?: () => void;
}

export function ActivityLogFilters({
  filters,
  onFiltersChange,
  isOpen: controlledIsOpen,
  onClose,
  onReset,
}: ActivityLogFiltersProps) {
  // Support both controlled and uncontrolled modes
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalOpen(value);
    } else if (!value && onClose) {
      onClose();
    }
  };

  // Local draft state — applied on "Apply" click
  const [draft, setDraft] = useState<QueryActivityLogsDto>(filters);

  // Sync draft when filters change externally (e.g. clear all from chips)
  useEffect(() => { setDraft(filters); }, [filters]);

  // Sync draft when drawer opens
  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
    }
  }, [isOpen]);

  const { data: usersData } = useUsers({ skip: 0, take: 200 });
  const users = usersData?.users || [];

  // Debounce search within drawer
  const [searchInput, setSearchInput] = useState(draft.search || '');
  useEffect(() => {
    const t = setTimeout(() => setDraft(d => ({ ...d, search: searchInput || undefined })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const applyFilters = () => {
    onFiltersChange({ ...draft, skip: 0 });
    setIsOpen(false);
    if (onClose) onClose();
  };

  const clearAll = () => {
    const reset: QueryActivityLogsDto = { skip: 0, take: filters.take ?? 5 };
    setDraft(reset);
    setSearchInput('');
    if (onReset) {
      onReset();
    } else {
      onFiltersChange(reset);
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  // Build active chip list from committed filters
  const activeFilters: { key: keyof QueryActivityLogsDto; label: string }[] = [];
  if (filters.action) {
    const a = ACTION_OPTIONS.find(o => o.value === filters.action);
    activeFilters.push({ key: 'action', label: `Action: ${a?.label ?? filters.action}` });
  }
  if (filters.entity_type) {
    const e = ENTITY_OPTIONS.find(o => o.value === filters.entity_type);
    activeFilters.push({ key: 'entity_type', label: `Module: ${e?.label ?? filters.entity_type}` });
  }
  if (filters.user_id) {
    const u = users.find(u => u.id === filters.user_id);
    activeFilters.push({ key: 'user_id', label: `User: ${u?.full_name ?? 'Selected'}` });
  }
  if (filters.search) {
    activeFilters.push({ key: 'search', label: `Search: "${filters.search}"` });
  }
  if (filters.start_date) {
    activeFilters.push({ key: 'start_date', label: `From: ${filters.start_date}` });
  }
  if (filters.end_date) {
    activeFilters.push({ key: 'end_date', label: `To: ${filters.end_date}` });
  }
  if (filters.entity_id) {
    activeFilters.push({ key: 'entity_id', label: `Entity ID: ${filters.entity_id}` });
  }

  const removeFilter = (key: keyof QueryActivityLogsDto) => {
    const updated = { ...filters, [key]: undefined, skip: 0 };
    if (key === 'search') setSearchInput('');
    setDraft(prev => ({ ...prev, [key]: undefined }));
    onFiltersChange(updated);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const activeCount = activeFilters.length;

  return (
    <>
      {/* ── Active chips row (only show when not using controlled drawer from parent) ── */}
      {controlledIsOpen === undefined && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setDraft(filters); setSearchInput(filters.search || ''); setInternalOpen(true); }}
            className="flex items-center gap-2 h-9"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeCount > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">
                {activeCount}
              </Badge>
            )}
          </Button>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Active:
              </span>
              {activeFilters.map((f) => (
                <Badge
                  key={f.key}
                  variant="secondary"
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs h-6 px-2"
                >
                  {f.label}
                  <button onClick={() => removeFilter(f.key)} className="ml-0.5 hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-6 text-xs text-gray-400 hover:text-gray-700 px-2"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Filter Drawer ── */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full max-w-full bg-white dark:bg-gray-900 border-none shadow-2xl !p-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Activity Filters
                </SheetTitle>
                <SheetDescription className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-0.5">
                  Refine your view by applying specific parameters
                </SheetDescription>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto px-6 py-6 space-y-6" style={{ height: "calc(100% - 80px - 88px)" }}>

            {/* Search */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
                Search Description
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search descriptions..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold text-gray-700 dark:text-gray-300 shadow-sm"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* User */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
                User
              </label>
              <Select
                value={draft.user_id || 'ALL'}
                onValueChange={(v) => setDraft(d => ({ ...d, user_id: v === 'ALL' || v == null ? undefined : v }) as QueryActivityLogsDto)}
                items={[{ value: 'ALL', label: 'All Users' }, ...users.map(u => ({ value: u.id, label: u.full_name }))]}
              >
                <SelectTrigger className="w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold flex items-center justify-between px-4 transition-all duration-300 shadow-sm cursor-pointer hover:border-gray-200 dark:hover:border-white/10 text-gray-700 dark:text-gray-300">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-gray-100 dark:border-white/5 shadow-2xl p-1 bg-white dark:bg-gray-900 z-50 min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem
                    value="ALL"
                    className="font-bold py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500 shadow-sm" />
                      <span>All Users</span>
                    </div>
                  </SelectItem>
                  {users.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className="font-bold py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex flex-col py-0.5">
                        <span className="font-medium">{user.full_name}</span>
                        <span className="text-xs text-gray-400">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
                Action
              </label>
              <Select
                value={draft.action || 'ALL'}
                onValueChange={(v) => setDraft(d => ({ ...d, action: v === 'ALL' || v == null ? undefined : v }))}
                items={ACTION_OPTIONS}
              >
                <SelectTrigger className="w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold flex items-center justify-between px-4 transition-all duration-300 shadow-sm cursor-pointer hover:border-gray-200 dark:hover:border-white/10 text-gray-700 dark:text-gray-300">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-gray-100 dark:border-white/5 shadow-2xl p-1 bg-white dark:bg-gray-900 z-50 min-w-[var(--radix-select-trigger-width)]">
                  {ACTION_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={cn(
                        "font-bold py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shadow-sm",
                            option.iconColor,
                            option.animatePulse && "animate-pulse"
                          )}
                        />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Module */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
                Module
              </label>
              <Select
                value={draft.entity_type || 'ALL'}
                onValueChange={(v) => setDraft(d => ({ ...d, entity_type: v === 'ALL' || v == null ? undefined : v }))}
                items={ENTITY_OPTIONS}
              >
                <SelectTrigger className="w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold flex items-center justify-between px-4 transition-all duration-300 shadow-sm cursor-pointer hover:border-gray-200 dark:hover:border-white/10 text-gray-700 dark:text-gray-300">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-gray-100 dark:border-white/5 shadow-2xl p-1 bg-white dark:bg-gray-900 z-50 min-w-[var(--radix-select-trigger-width)]">
                  {ENTITY_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={cn(
                        "font-bold py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shadow-sm",
                            option.iconColor,
                            option.animatePulse && "animate-pulse"
                          )}
                        />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
                Date Range
              </label>
              <div className="space-y-3">
                <DatePicker
                  value={draft.start_date || ''}
                  onChange={(val) => setDraft(d => ({ ...d, start_date: val || undefined }))}
                  placeholder="From date..."
                />
                <DatePicker
                  value={draft.end_date || ''}
                  onChange={(val) => setDraft(d => ({ ...d, end_date: val || undefined }))}
                  placeholder="To date..."
                />
              </div>
            </div>

          </div>

          {/* Footer — absolute, always visible at bottom */}
          <SheetFooter className="px-6 py-5 gap-3 absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5">
            <Button
              variant="ghost"
              onClick={() => {
                const cleared: QueryActivityLogsDto = { skip: 0, take: filters.take ?? 5 };
                setDraft(cleared);
                setSearchInput('');
                if (onReset) onReset();
              }}
              className="flex-1 rounded-[16px] h-12 gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 font-bold transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </Button>
            <Button
              onClick={applyFilters}
              className="flex-1 rounded-[16px] h-12 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Apply Filters
              {activeCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-white text-primary text-[10px]">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
