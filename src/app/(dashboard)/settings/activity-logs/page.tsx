'use client';

import * as React from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/tables/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { useActivityLogs } from './hooks/use-activity-logs';
import { ActivityLogFilters, ACTION_OPTIONS, ENTITY_OPTIONS } from './components/activity-log-filters';
import { ActivityStatsCards } from './components/activity-stats-cards';
import { ActivityLogDetailDrawer } from './components/activity-log-detail-drawer';
import { ActivityLogExportDrawer } from './components/activity-log-export-drawer';
import { QueryActivityLogsDto, ActivityLog } from './types/activity-log.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, RefreshCw, FileText, Activity } from 'lucide-react';
import { PageHeaderControls } from '@/components/ui/page-header-controls';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RouteGuard } from '@/components/guards/route-guard';

/* ─── Helpers ──────────────────────────────────────────────────── */

const getActionColors = (action: string) => {
  switch (action?.toUpperCase()) {
    case 'LOGIN': return 'bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 dark:border-blue-500/30';
    case 'LOGOUT': return 'bg-slate-500/5 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 dark:border-slate-500/30';
    case 'CREATE': return 'bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-500/30';
    case 'UPDATE': return 'bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/30';
    case 'DELETE': return 'bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 dark:border-rose-500/30';
    case 'VIEW': return 'bg-cyan-500/5 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 dark:border-cyan-500/30';
    case 'EXPORT': return 'bg-violet-500/5 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30 dark:border-violet-500/30';
    case 'APPROVE': return 'bg-green-500/5 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 dark:border-green-500/30';
    case 'REJECT': return 'bg-red-500/5 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 dark:border-red-500/30';
    case 'ASSIGN': return 'bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 dark:border-indigo-500/30';
    case 'COMPLETE': return 'bg-teal-500/5 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 dark:border-teal-500/30';
    default: return 'bg-gray-500/5 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30 dark:border-gray-500/30';
  }
};

const getActionDotColors = (action: string) => {
  switch (action?.toUpperCase()) {
    case 'LOGIN': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
    case 'LOGOUT': return 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]';
    case 'CREATE': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    case 'UPDATE': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    case 'DELETE': return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
    case 'VIEW': return 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]';
    case 'EXPORT': return 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]';
    case 'APPROVE': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]';
    case 'REJECT': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
    case 'ASSIGN': return 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]';
    case 'COMPLETE': return 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]';
    default: return 'bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]';
  }
};

const getEntityColor = (entityType: string | null) => {
  if (!entityType) return 'bg-gray-400';
  const entity = ENTITY_OPTIONS.find(e => e.value === entityType);
  return entity?.iconColor || 'bg-gray-400';
};

/* ─── Page ──────────────────────────────────────────────────────── */

export default function ActivityLogsPage() {
  const [filters, setFilters] = useState<QueryActivityLogsDto>({
    skip: 0,
    take: 5,
  });
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isExportDrawerOpen, setIsExportDrawerOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const { logs, stats, isLoading, isStatsLoading, refetch } = useActivityLogs(filters);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: localSearch || undefined, skip: 0 }));
    }, 350);
    return () => clearTimeout(t);
  }, [localSearch]);

  const handleViewDetail = (log: ActivityLog) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => setIsExportDrawerOpen(true);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.action) count++;
    if (filters.entity_type) count++;
    if (filters.user_id) count++;
    if (filters.start_date) count++;
    if (filters.end_date) count++;
    if (filters.search) count++;
    if (filters.entity_id) count++;
    return count;
  };

  const resetFilters = () => {
    setLocalSearch('');
    setFilters({ skip: 0, take: 5 });
  };

  /* ── Table columns ── */
  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: 'created_at',
      header: 'Time',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {format(new Date(row.original.created_at), 'MMM d, yyyy')}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {format(new Date(row.original.created_at), 'h:mm a')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-semibold text-xs relative border border-primary/10 transition-transform duration-500 group-hover:scale-110 overflow-hidden">
              {(row.original.user?.full_name || 'U').charAt(0)}
            </div>
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {row.original.user?.full_name || 'Unknown'}
            </span>
            <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 max-w-[150px]">
              {row.original.user?.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.original.action;
        const actionOption = ACTION_OPTIONS.find(a => a.value === action);
        return (
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full animate-pulse', getActionDotColors(action))} />
            <Badge
              variant="outline"
              className={cn(
                'rounded-md font-semibold text-[10px] uppercase tracking-[0.12em] px-2 py-1 shadow-sm transition-all duration-300',
                getActionColors(action)
              )}
            >
              {actionOption?.label || action}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'entity_type',
      header: 'Entity',
      cell: ({ row }) => {
        const entityType = row.original.entity_type;
        if (!entityType) return <span className="text-gray-400 text-xs">—</span>;
        const entityOption = ENTITY_OPTIONS.find(e => e.value === entityType);
        return (
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full shadow-sm', getEntityColor(entityType))} />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">
              {entityOption?.label || entityType.replace(/_/g, ' ')}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[250px]" title={row.original.description}>
          {row.original.description}
        </p>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right w-full font-bold">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 hover:text-blue-700 hover:bg-blue-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
            onClick={() => handleViewDetail(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <RouteGuard>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="grid grid-cols-1 xl:grid-cols-4 gap-5"
      >
        {/* ════════════════════════════════════════
            LEFT — Activity Logs List  (3/4 width)
        ════════════════════════════════════════ */}
        <div className="xl:col-span-3">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Activity Logs &{' '}
                  <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                    Records
                  </span>
                </h1>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                  Track all user activities and system events
                </p>
              </div>

              <div className="flex items-center gap-2">
                <PageHeaderControls
                  searchValue={localSearch}
                  onSearchChange={setLocalSearch}
                  searchPlaceholder="Search activities..."
                  onFilterClick={() => setIsFilterDrawerOpen(true)}
                  activeFiltersCount={getActiveFiltersCount()}
                  addLabel="Export Logs"
                  addIcon={<FileText size={15} />}
                  onAddClick={handleExport}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-10 w-10 rounded-xl border-gray-200 dark:border-white/10 hover:border-primary/50 hover:text-primary"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="p-6 pt-4">
              <DataTable
                columns={columns}
                data={logs?.data || []}
                loading={isLoading}
                pageCount={Math.ceil((logs?.meta?.total || 0) / (filters.take || 5))}
                totalCount={logs?.meta?.total || 0}
                entityName="activity logs"
                pagination={{
                  pageIndex: Math.floor((filters.skip || 0) / (filters.take || 5)),
                  pageSize: filters.take || 5,
                }}
                onPaginationChange={(pagination) =>
                  setFilters(prev => ({
                    ...prev,
                    skip: pagination.pageIndex * pagination.pageSize,
                    take: pagination.pageSize,
                  }))
                }
                onGlobalFilterChange={setLocalSearch}
                globalFilterValue={localSearch}
                searchPlaceholder="Search activities..."
                onFilterClick={() => setIsFilterDrawerOpen(true)}
                activeFiltersCount={getActiveFiltersCount()}
                hideToolbar
              />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT — Statistics Panel  (1/4 width)
        ════════════════════════════════════════ */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <ActivityStatsCards stats={stats} isLoading={isStatsLoading} />
        </div>

        {/* ── Filter Drawer ── */}
        <ActivityLogFilters
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          onReset={resetFilters}
        />

        {/* Detail Drawer */}
        <ActivityLogDetailDrawer
          log={selectedLog}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />

        {/* Export Drawer */}
        <ActivityLogExportDrawer
          isOpen={isExportDrawerOpen}
          onClose={() => setIsExportDrawerOpen(false)}
          currentFilters={filters}
        />
      </motion.div>
    </RouteGuard>
  );
}
