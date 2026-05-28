'use client';

import { useState } from 'react';
import { QueryActivityLogsDto } from '../types/activity-log.types';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { ACTION_OPTIONS, ENTITY_OPTIONS } from './activity-log-filters';
import { useUsers } from '@/services/user-service';
import { cn } from '@/lib/utils';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';

interface ActivityLogExportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters?: QueryActivityLogsDto;
}

const QUICK_RANGES = [
  { label: 'Today',          getValue: () => ({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Last 7 Days',    getValue: () => ({ start: format(subDays(new Date(), 6), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Last 30 Days',   getValue: () => ({ start: format(subDays(new Date(), 29), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'This Month',     getValue: () => ({ start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
  { label: 'Last Month',     getValue: () => ({ start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'), end: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd') }) },
  { label: 'This Year',      getValue: () => ({ start: format(startOfYear(new Date()), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'All Time',       getValue: () => ({ start: '', end: '' }) },
];

const DEFAULT_EXPORT: Partial<QueryActivityLogsDto> = {};

export function ActivityLogExportDrawer({
  isOpen,
  onClose,
  currentFilters,
}: ActivityLogExportDrawerProps) {
  const [exportOptions, setExportOptions] = useState<Partial<QueryActivityLogsDto>>(DEFAULT_EXPORT);
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const { data: usersData } = useUsers({ skip: 0, take: 200 });
  const users = usersData?.users || [];

  const handleClose = () => {
    setExportOptions(DEFAULT_EXPORT);
    setSelectedRange(null);
    setExportSuccess(false);
    onClose();
  };

  const applyQuickRange = (rangeLabel: string) => {
    const range = QUICK_RANGES.find(r => r.label === rangeLabel);
    if (!range) return;
    const { start, end } = range.getValue();
    setSelectedRange(rangeLabel);
    setExportOptions(prev => ({
      ...prev,
      start_date: start || undefined,
      end_date: end || undefined,
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      const params = new URLSearchParams();
      if (exportOptions.user_id) params.append('user_id', exportOptions.user_id);
      if (exportOptions.action) params.append('action', exportOptions.action);
      if (exportOptions.entity_type) params.append('entity_type', exportOptions.entity_type);
      if (exportOptions.start_date) params.append('start_date', exportOptions.start_date);
      if (exportOptions.end_date) params.append('end_date', exportOptions.end_date);
      if (exportOptions.search) params.append('search', exportOptions.search);

      const response = await api.get(`/activity-logs/export/excel?${params.toString()}`, {
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `activity_logs_${new Date().toISOString().split('T')[0]}.xlsx`;

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const resetOptions = () => {
    setExportOptions(DEFAULT_EXPORT);
    setSelectedRange(null);
  };

  const hasActiveOptions =
    !!(exportOptions.start_date || exportOptions.end_date || exportOptions.action || exportOptions.entity_type || exportOptions.user_id);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-md bg-white dark:bg-gray-900 border-none shadow-2xl !p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Export Activity Logs
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-0.5">
                Choose date range and filters for your Excel export
              </SheetDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className="overflow-y-auto px-6 py-6 space-y-6"
          style={{ height: 'calc(100% - 80px - 88px)' }}
        >
          {/* Quick Date Ranges */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Quick Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => applyQuickRange(range.label)}
                  className={cn(
                    'text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all duration-200 text-left',
                    selectedRange === range.label
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-gray-50/80 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:border-primary/40 hover:text-primary'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
              Custom Date Range
            </label>
            <div className="space-y-3">
              <DatePicker
                value={exportOptions.start_date || ''}
                onChange={(val) => {
                  setSelectedRange(null);
                  setExportOptions(prev => ({ ...prev, start_date: val || undefined }));
                }}
                placeholder="From date..."
                maxDate={exportOptions.end_date}
              />
              <DatePicker
                value={exportOptions.end_date || ''}
                onChange={(val) => {
                  setSelectedRange(null);
                  setExportOptions(prev => ({ ...prev, end_date: val || undefined }));
                }}
                placeholder="To date..."
                minDate={exportOptions.start_date}
              />
            </div>
            {exportOptions.start_date && exportOptions.end_date && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium px-1">
                Exporting from <span className="text-primary font-bold">{exportOptions.start_date}</span> to{' '}
                <span className="text-primary font-bold">{exportOptions.end_date}</span>
              </p>
            )}
          </div>

          {/* User Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
              Filter by User
            </label>
            <Select
              value={exportOptions.user_id || 'ALL'}
              onValueChange={(v) =>
                setExportOptions(prev => ({ ...prev, user_id: v === 'ALL' || v == null ? undefined : v }))
              }
            >
              <SelectTrigger className="w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-gray-100 dark:border-white/5 shadow-2xl p-1 bg-white dark:bg-gray-900 z-50">
                <SelectItem value="ALL" className="font-bold py-3 px-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                    All Users
                  </div>
                </SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="font-bold py-3 px-4 rounded-xl">
                    <div className="flex flex-col py-0.5">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-xs text-gray-400">{user.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
              Filter by Action
            </label>
            <Select
              value={exportOptions.action || 'ALL'}
              onValueChange={(v) =>
                setExportOptions(prev => ({ ...prev, action: v === 'ALL' || v == null ? undefined : v }))
              }
            >
              <SelectTrigger className="w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-gray-100 dark:border-white/5 shadow-2xl p-1 bg-white dark:bg-gray-900 z-50">
                {ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="font-bold py-3 px-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-2.5 h-2.5 rounded-full shadow-sm', option.iconColor)} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Module Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
              Filter by Module
            </label>
            <Select
              value={exportOptions.entity_type || 'ALL'}
              onValueChange={(v) =>
                setExportOptions(prev => ({ ...prev, entity_type: v === 'ALL' || v == null ? undefined : v }))
              }
            >
              <SelectTrigger className="w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-gray-100 dark:border-white/5 shadow-2xl p-1 bg-white dark:bg-gray-900 z-50">
                {ENTITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="font-bold py-3 px-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-2.5 h-2.5 rounded-full shadow-sm', option.iconColor)} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary preview */}
          {hasActiveOptions && (
            <div className="rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/10 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Export Preview</p>
              <div className="flex flex-wrap gap-1.5">
                {exportOptions.start_date && (
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-white dark:bg-gray-900">
                    From: {exportOptions.start_date}
                  </Badge>
                )}
                {exportOptions.end_date && (
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-white dark:bg-gray-900">
                    To: {exportOptions.end_date}
                  </Badge>
                )}
                {exportOptions.action && (
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-white dark:bg-gray-900">
                    Action: {ACTION_OPTIONS.find(a => a.value === exportOptions.action)?.label}
                  </Badge>
                )}
                {exportOptions.entity_type && (
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-white dark:bg-gray-900">
                    Module: {ENTITY_OPTIONS.find(e => e.value === exportOptions.entity_type)?.label}
                  </Badge>
                )}
                {exportOptions.user_id && (
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-white dark:bg-gray-900">
                    User: {users.find(u => u.id === exportOptions.user_id)?.full_name ?? 'Selected'}
                  </Badge>
                )}
              </div>
              {!exportOptions.start_date && !exportOptions.end_date && (
                <p className="text-[10px] text-gray-400">No date range — all records will be exported</p>
              )}
            </div>
          )}

          {!hasActiveOptions && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                No filters selected — all activity logs will be exported.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-5 gap-3 absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5">
          <Button
            variant="ghost"
            onClick={resetOptions}
            className="flex-1 rounded-[16px] h-12 gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              'flex-1 rounded-[16px] h-12 gap-2 font-bold shadow-lg transition-all',
              exportSuccess
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-emerald-900/30'
                : 'bg-primary hover:bg-primary/90 shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
            )}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Excel
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
