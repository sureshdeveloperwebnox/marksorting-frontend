"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
  useServiceReports,
  ServiceReport,
  useDeleteServiceReport,
  useUpdateServiceReport,
} from "@/services/service-report-service";
import useServiceReportStore from "@/store/useServiceReportStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  FileText,
  Loader2,
  Search,
  Filter,
  ClipboardCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { ServiceReportFormDrawer } from "@/components/forms/service-report-form-drawer";
import { useServiceCategories } from "@/services/service-category-service";

/* ─── Helpers ──────────────────────────────────────────────────── */

const getStatusColors = (status: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING":     return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500 dark:border-amber-400";
    case "IN_PROGRESS": return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500 dark:border-blue-400";
    case "COMPLETED":   return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400";
    case "CANCELLED":   return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500 dark:border-rose-400";
    default:            return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500 dark:border-gray-400";
  }
};

const getStatusDotColors = (status: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING":     return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    case "IN_PROGRESS": return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
    case "COMPLETED":   return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    case "CANCELLED":   return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
    default:            return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
  }
};

/* ─── Stats Card ────────────────────────────────────────────────── */

interface StatsCardProps {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  iconBg: string;
  gradient: string;
  trend?: string;
  loading?: boolean;
}

function StatsCard({ title, value, icon, iconBg, gradient, trend, loading }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-[20px] p-5 border border-gray-100 dark:border-white/5",
        "bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-300"
      )}
    >
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 -translate-y-6 translate-x-6", gradient)} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em] mb-3">
            {title}
          </p>
          {loading ? (
            <div className="h-9 w-16 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <p className="text-4xl font-black text-gray-900 dark:text-white leading-none">
              {value ?? 0}
            </p>
          )}
          {trend && (
            <p className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
              <TrendingUp size={11} />
              {trend}
            </p>
          )}
        </div>
        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm", iconBg)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function ServiceReportPage() {
  const {
    pagination,
    setPagination,
    search,
    setSearch,
    statusFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    setStatusFilter,
    setCategoryFilter,
    setDateFrom,
    setDateTo,
    resetFilters,
    deleteId,
    setDeleteId,
    openFormDrawer,
  } = useServiceReportStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  const { data, isLoading } = useServiceReports({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search,
    status: statusFilter || undefined,
    serviceCategoryId: categoryFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: totalData } = useServiceReports({
    skip: 0, take: 1, status: undefined, serviceCategoryId: undefined,
  });
  const { data: completedData } = useServiceReports({
    skip: 0, take: 1, status: "COMPLETED",
  });
  const { data: pendingData } = useServiceReports({
    skip: 0, take: 1, status: "PENDING",
  });
  const { data: inProgressData } = useServiceReports({
    skip: 0, take: 1, status: "IN_PROGRESS",
  });

  const { data: categoriesData } = useServiceCategories({ skip: 0, take: 500 });
  const categories = categoriesData?.serviceCategories || [];

  const deleteMutation = useDeleteServiceReport();
  const updateReportMutation = useUpdateServiceReport();

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Service report deleted successfully");
    } catch {
      // Handled in mutation
    } finally {
      setDeleteId(null);
    }
  };

  const activeFilterCount = [statusFilter, categoryFilter, dateFrom, dateTo].filter(Boolean).length;

  /* ── Filter fields ── */
  const filterFields: FilterField[] = [
    {
      id: "status",
      label: "Report Status",
      options: [
        { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
        { value: "PENDING", label: "Pending", iconColor: "bg-amber-500", animatePulse: true },
        { value: "IN_PROGRESS", label: "In Progress", iconColor: "bg-blue-500", animatePulse: true },
        { value: "COMPLETED", label: "Completed", iconColor: "bg-emerald-500", animatePulse: true },
        { value: "CANCELLED", label: "Cancelled", iconColor: "bg-rose-500", animatePulse: true },
      ],
    },
    {
      id: "category",
      label: "Service Category",
      options: [
        { value: "ALL", label: "All Categories", iconColor: "bg-gray-400 dark:bg-gray-500" },
        ...categories.map((cat) => ({
          value: cat.id,
          label: cat.name,
          iconColor: "bg-primary",
        })),
      ],
    },
  ];

  /* ── Table columns ── */
  const columns: ColumnDef<ServiceReport>[] = [
    {
      accessorKey: "report_number",
      header: "Report No",
      cell: ({ row }) => (
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-semibold text-sm relative border border-primary/10 transition-transform duration-500 group-hover:scale-110 overflow-hidden">
              {row.original.mill?.name?.charAt(0) || "M"}
            </div>
          </div>
          <span className="font-semibold text-[14px] text-gray-900 dark:text-white tracking-tight">
            {row.original.report_number}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "mill.name",
      header: "Mill / Place",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
            {row.original.mill?.name || "—"}
          </span>
          <span className="text-gray-400 dark:text-gray-500 font-medium text-xs">
            {row.original.place || "—"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "serviceCategory.name",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-semibold text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-md shadow-sm bg-primary/5 dark:bg-primary/10 text-primary border-primary/30">
          {row.original.serviceCategory?.name || "—"}
        </Badge>
      ),
    },
    {
      id: "engineers",
      header: "Engineers",
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
          {row.original.technicians?.map((t: any) => t.technician.full_name).join(", ") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "visit_date",
      header: "Visit Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">
            {row.original.visit_date ? format(new Date(row.original.visit_date), "MMM dd, yyyy") : "—"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const reportId = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 cursor-pointer outline-none select-none group/status hover:scale-105 active:scale-95 transition-all duration-300">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", getStatusDotColors(status))} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md font-semibold text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 shadow-sm transition-all duration-300 cursor-pointer group-hover/status:border-primary/50",
                      getStatusColors(status)
                    )}
                  >
                    {status?.replace("_", " ")}
                  </Badge>
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-40 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 z-[9999]">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-1.5 mb-1 select-none">Set Status</div>
              {[
                { value: "PENDING", label: "Pending", color: "amber" },
                { value: "IN_PROGRESS", label: "In Progress", color: "blue" },
                { value: "COMPLETED", label: "Completed", color: "emerald" },
                { value: "CANCELLED", label: "Cancelled", color: "rose" },
              ].map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  className={cn(
                    "rounded-lg font-semibold text-xs my-0.5 cursor-pointer flex items-center gap-2 py-2 px-2.5 transition-colors",
                    status === s.value
                      ? `text-${s.color}-500 bg-${s.color}-500/5`
                      : "text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => updateReportMutation.mutate({ id: reportId, status: s.value })}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-${s.color}-500`} />
                  {s.label.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right w-full font-bold">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 hover:text-amber-700 hover:bg-amber-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
            onClick={() => openFormDrawer(row.original.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 hover:text-rose-700 hover:bg-rose-100/80 hover:scale-110 active:scale-95 transition-all duration-300 hover:shadow-[0_0_12px_rgba(244,63,94,0.15)] shadow-sm"
            onClick={() => setDeleteId(row.original.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-cols-1 xl:grid-cols-4 gap-5"
    >
      {/* ════════════════════════════════════════
          LEFT — Report List Card  (3/4 width)
      ════════════════════════════════════════ */}
      <div className="xl:col-span-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Service Report{" "}
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                  List
                </span>
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Manage all service reports and track engineer visits
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  id="sr-search"
                  type="text"
                  placeholder="Search reports..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all w-48 font-medium"
                />
              </div>

              <Button
                id="sr-filter-btn"
                variant="outline"
                onClick={() => setIsFilterDrawerOpen(true)}
                className={cn(
                  "gap-2 h-10 px-4 rounded-xl text-sm font-semibold border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all",
                  activeFilterCount > 0 && "border-primary/50 text-primary bg-primary/5 dark:bg-primary/10"
                )}
              >
                <Filter size={14} />
                Filter
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 bg-primary text-white rounded-full text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <Button
                id="sr-add-btn"
                onClick={() => openFormDrawer()}
                className="gap-2 h-10 px-5 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md hover:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileText size={15} />
                New Report
              </Button>
            </div>
          </div>

          <div className="p-6 pt-4">
            <DataTable
              columns={columns}
              data={data?.serviceReports || []}
              loading={isLoading}
              pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
              totalCount={data?.total || 0}
              entityName="service reports"
              pagination={pagination}
              onPaginationChange={setPagination}
              onGlobalFilterChange={setSearch}
              globalFilterValue={search}
              searchPlaceholder="Search..."
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              activeFiltersCount={activeFilterCount}
            />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT — Statistics Panel  (1/4 width)
      ════════════════════════════════════════ */}
      <div className="xl:col-span-1 flex flex-col gap-4">
        <StatsCard
          title="Total Reports"
          value={totalData?.total}
          loading={!totalData}
          icon={<ClipboardCheck size={20} className="text-primary" />}
          iconBg="bg-primary/10 dark:bg-primary/15"
          gradient="bg-primary"
          trend="All service reports"
        />
        <StatsCard
          title="Completed"
          value={completedData?.total}
          loading={!completedData}
          icon={<CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-500/15"
          gradient="bg-emerald-500"
          trend="Successfully completed"
        />
        <StatsCard
          title="In Progress"
          value={inProgressData?.total}
          loading={!inProgressData}
          icon={<Clock size={20} className="text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-500/15"
          gradient="bg-blue-500"
          trend="Currently in progress"
        />
        <StatsCard
          title="Pending"
          value={pendingData?.total}
          loading={!pendingData}
          icon={<AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-500/15"
          gradient="bg-amber-500"
          trend="Awaiting action"
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[20px] p-5 bg-gradient-to-br from-primary to-orange-500 border border-primary/20 shadow-sm shadow-primary/20"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bS0xMiAxMnY2aDZ2LTZoLTZ6bTAtMTJ2Nmg2di02aC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <p className="text-xs font-bold text-white/70 uppercase tracking-[0.12em] mb-2 relative">Quick Stats</p>
          <div className="space-y-1.5 relative">
            {[
              {
                label: "Completion rate",
                value: totalData?.total ? `${Math.round(((completedData?.total || 0) / totalData.total) * 100)}%` : "—",
              },
              {
                label: "Pending rate",
                value: totalData?.total ? `${Math.round(((pendingData?.total || 0) / totalData.total) * 100)}%` : "—",
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">{s.label}</span>
                <span className="text-sm font-black text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Filter Drawer ── */}
      <GenericFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        fields={filterFields}
        activeValues={{
          status: statusFilter || "ALL",
          category: categoryFilter || "ALL",
        }}
        onApply={(values) => {
          setStatusFilter(values.status === "ALL" ? "" : values.status);
          setCategoryFilter(values.category === "ALL" ? "" : values.category);
        }}
        onReset={() => {
          resetFilters();
        }}
      />

      {/* ── Form Drawer ── */}
      <ServiceReportFormDrawer />

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-8 bg-white dark:bg-gray-900">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto animate-bounce">
              <Trash2 size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-gray-900 dark:text-white">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500 font-bold">
              This action cannot be undone. This will permanently remove the service report from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-center pt-6">
            <Button
              variant="ghost"
              onClick={() => setDeleteId(null)}
              className="flex-1 rounded-xl h-12 font-black text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl h-12 bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
