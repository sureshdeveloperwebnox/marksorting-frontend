"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
  useMasterMills,
  MasterMill,
  useDeleteMasterMill,
  useUpdateMasterMill,
  useMasterMillStats,
} from "@/services/master-mill-service";
import { useMasterMillStore } from "@/store/useMasterMillStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Loader2,
  FileText,
  TrendingUp,
  Shield,
  ShieldOff,
  ShieldCheck,
  IndianRupee,
} from "lucide-react";
import { PageHeaderControls } from "@/components/ui/page-header-controls";
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
import { format, isPast, isValid } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { MasterMillFormDrawer } from "@/components/forms/master-mill-form-drawer";
import { RouteGuard } from "@/components/guards/route-guard";

/* ─── Helpers ──────────────────────────────────────────────────── */

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Delhi","Ladakh","Jammu and Kashmir","Puducherry",
];

const getWarrantyColors = (type: string) => {
  switch (type) {
    case "Under Warranty":
      return "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "Expired":
      return "bg-rose-500/8 text-rose-600 dark:text-rose-400 border-rose-500/30";
    default:
      return "bg-gray-500/8 text-gray-500 dark:text-gray-400 border-gray-500/30";
  }
};

const getWarrantyDot = (type: string) => {
  switch (type) {
    case "Under Warranty": return "bg-emerald-500";
    case "Expired": return "bg-rose-500";
    default: return "bg-gray-400";
  }
};

function formatDateSafe(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (!isValid(d)) return "—";
  return format(d, "dd-MM-yyyy");
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return isValid(d) && isPast(d);
}

const filterFields: FilterField[] = [
  {
    id: "all_warranty",
    label: "Warranty Type",
    options: [
      { value: "ALL", label: "All Types", iconColor: "bg-gray-400" },
      { value: "Non Warranty", label: "Non Warranty", iconColor: "bg-gray-400" },
      { value: "Under Warranty", label: "Under Warranty", iconColor: "bg-emerald-500", animatePulse: true },
      { value: "Expired", label: "Expired", iconColor: "bg-rose-500" },
    ],
  },
  {
    id: "state",
    label: "State",
    options: [
      { value: "ALL", label: "All States", iconColor: "bg-gray-400" },
      ...INDIAN_STATES.map((s) => ({ value: s, label: s, iconColor: "bg-primary" })),
    ],
  },
];

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
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">
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

export default function MasterMillsPage() {
  const {
    pagination,
    setPagination,
    search,
    setSearch,
    statusFilter,
    stateFilter,
    setStateFilter,
    warrantyFilter,
    setWarrantyFilter,
    resetFilters,
    deleteId,
    setDeleteId,
    openFormDrawer,
  } = useMasterMillStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  /* ── Data queries ── */
  const { data, isLoading, isFetching, refetch } = useMasterMills({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search,
    all_warranty: warrantyFilter || undefined,
    state: stateFilter || undefined,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useMasterMillStats();

  const isRefreshing = isFetching;

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchStats()]);
  };

  const deleteMutation = useDeleteMasterMill();
  const updateMutation = useUpdateMasterMill();

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Master mill record deleted successfully");
    } catch {
      /* handled in mutation */
    } finally {
      setDeleteId(null);
    }
  };

  /* ── Active filters count ── */
  const activeFiltersCount = [warrantyFilter, stateFilter].filter(Boolean).length;

  /* ── Columns ─────────────────────────────────────────────────── */
  const columns: ColumnDef<MasterMill>[] = [
    {
      id: "sno",
      header: "S.No",
      cell: ({ row }) => (
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
          {pagination.pageIndex * pagination.pageSize + row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "invoice_no",
      header: "Invoice No",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[120px]">
          <span className="font-black text-sm text-gray-900 dark:text-white tracking-tight">
            {row.original.invoice_no}
          </span>
          {row.original.ref_no && (
            <span className="text-[10px] text-gray-400 font-semibold">
              Ref: {row.original.ref_no}
            </span>
          )}
          {row.original.invoice_date && (
            <span className="text-[10px] text-gray-400 font-medium">
              {formatDateSafe(row.original.invoice_date)}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "mill",
      header: "Mill Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 min-w-[160px]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-black text-xs border border-primary/10 flex-shrink-0">
            {(row.original.mill?.name || row.original.mc_model || "?").charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
              {row.original.mill?.name || <span className="text-gray-400">—</span>}
            </p>
            {row.original.place && (
              <p className="text-[11px] text-gray-400 truncate">
                {row.original.place}{row.original.state ? `, ${row.original.state}` : ""}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "mc_model",
      header: "MC Model",
      cell: ({ row }) => (
        <div className="min-w-[120px]">
          <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
            {row.original.mc_model || "—"}
          </p>
          {row.original.frame_no && (
            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">
              Frame: {row.original.frame_no}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "warranty_period",
      header: "Warranty",
      cell: ({ row }) => {
        const years = row.original.warranty_years ?? 0;
        const months = row.original.warranty_months ?? 0;
        const period = [
          years > 0 ? `${years}Y` : null,
          months > 0 ? `${months}M` : null,
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div className="min-w-[90px]">
            <p className="font-black text-sm text-gray-700 dark:text-gray-300">
              {period || "—"}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Inst: {formatDateSafe(row.original.installation_date)}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "warranty_closing_date",
      header: "W. Closing",
      cell: ({ row }) => {
        const expired = isExpired(row.original.warranty_closing_date);
        return (
          <span
            className={cn(
              "text-sm font-bold",
              expired
                ? "text-rose-500 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {formatDateSafe(row.original.warranty_closing_date)}
          </span>
        );
      },
    },
    {
      accessorKey: "all_warranty",
      header: "Warranty Type",
      cell: ({ row }) => {
        const type = row.original.all_warranty || "Non Warranty";
        const millId = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-1.5 cursor-pointer outline-none select-none group/status hover:scale-105 active:scale-95 transition-all duration-300">
                  <div className={cn("w-1.5 h-1.5 rounded-full", getWarrantyDot(type))} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md font-bold text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 cursor-pointer",
                      getWarrantyColors(type)
                    )}
                  >
                    {type}
                  </Badge>
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-40 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 z-[9999]">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-1.5 mb-1">
                Set Warranty
              </div>
              {["Non Warranty", "Under Warranty", "Expired"].map((w) => (
                <DropdownMenuItem
                  key={w}
                  className={cn(
                    "rounded-lg font-semibold text-xs my-0.5 cursor-pointer flex items-center gap-2 py-2 px-2.5",
                    type === w ? "text-primary bg-primary/5" : "text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() =>
                    updateMutation.mutate({ id: millId, all_warranty: w })
                  }
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", getWarrantyDot(w))} />
                  {w}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      id: "amc",
      header: "AMC",
      cell: ({ row }) => {
        const hasAmc =
          row.original.amc_starting_date || row.original.amc_amount;
        const amcExpired = isExpired(row.original.amc_closing_date);
        return hasAmc ? (
          <div className="min-w-[110px]">
            {row.original.amc_amount != null && row.original.amc_amount > 0 && (
              <p className="font-black text-sm text-gray-800 dark:text-gray-200">
                ₹{Number(row.original.amc_amount).toLocaleString("en-IN")}
              </p>
            )}
            {row.original.amc_closing_date && (
              <p
                className={cn(
                  "text-[10px] font-semibold mt-0.5",
                  amcExpired
                    ? "text-rose-500"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                Till: {formatDateSafe(row.original.amc_closing_date)}
              </p>
            )}
            {row.original.amc_particular && (
              <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                {row.original.amc_particular}
              </p>
            )}
          </div>
        ) : (
          <span className="text-gray-300 dark:text-gray-600 text-sm font-bold">—</span>
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
            className="h-8 w-8 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 hover:text-amber-700 hover:bg-amber-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
            onClick={() => openFormDrawer(row.original.id)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 hover:text-rose-700 hover:bg-rose-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
            onClick={() => setDeleteId(row.original.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <RouteGuard module="master_mills" action="view">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="grid grid-cols-1 xl:grid-cols-4 gap-5"
      >
        {/* ════════════════════════════════════════
            LEFT — Main Table (3/4 width)
        ════════════════════════════════════════ */}
        <div className="xl:col-span-3">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Master Mills{" "}
                  <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                    Registry
                  </span>
                </h1>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                  Machine installation, warranty &amp; AMC management
                </p>
              </div>

              <PageHeaderControls
                searchValue={localSearch}
                onSearchChange={setLocalSearch}
                searchPlaceholder="Search invoice, mill, model..."
                onFilterClick={() => setIsFilterDrawerOpen(true)}
                activeFiltersCount={activeFiltersCount}
                addLabel="Add Record"
                addIcon={<FileText size={15} />}
                onAddClick={() => openFormDrawer()}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />
            </div>

            {/* Table */}
            <div className="p-6 pt-4">
              <DataTable
                columns={columns}
                data={data?.masterMills || []}
                loading={isLoading || isFetching}
                pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
                totalCount={data?.total || 0}
                entityName="records"
                pagination={pagination}
                onPaginationChange={setPagination}
                onGlobalFilterChange={setSearch}
                globalFilterValue={search}
                searchPlaceholder="Search records..."
                onFilterClick={() => setIsFilterDrawerOpen(true)}
                activeFiltersCount={activeFiltersCount}
                hideToolbar
              />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT — Statistics Panel (1/4 width)
        ════════════════════════════════════════ */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <StatsCard
            title="Total Records"
            value={stats?.total}
            loading={statsLoading}
            icon={<FileText size={20} className="text-primary" />}
            iconBg="bg-primary/10 dark:bg-primary/15"
            gradient="bg-primary"
            trend="All registered"
          />
          <StatsCard
            title="Under Warranty"
            value={stats?.underWarranty}
            loading={statsLoading}
            icon={<ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-50 dark:bg-emerald-500/15"
            gradient="bg-emerald-500"
            trend="Active warranties"
          />
          <StatsCard
            title="Under AMC"
            value={stats?.underAmc}
            loading={statsLoading}
            icon={<IndianRupee size={20} className="text-amber-600 dark:text-amber-400" />}
            iconBg="bg-amber-50 dark:bg-amber-500/15"
            gradient="bg-amber-500"
            trend="Active contracts"
          />
          <StatsCard
            title="Non Warranty"
            value={stats?.nonWarranty}
            loading={statsLoading}
            icon={<ShieldOff size={20} className="text-gray-500 dark:text-gray-400" />}
            iconBg="bg-gray-100 dark:bg-white/10"
            gradient="bg-gray-500"
            trend="No warranty coverage"
          />

          {/* Quick Stats card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[20px] p-5 bg-gradient-to-br from-primary to-orange-500 border border-primary/20 shadow-sm shadow-primary/20"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bS0xMiAxMnY2aDZ2LTZoLTZ6bTAtMTJ2Nmg2di02aC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
            <p className="text-xs font-bold text-white/70 uppercase tracking-[0.12em] mb-2 relative">
              Coverage
            </p>
            <div className="space-y-2 relative">
              {[
                {
                  label: "Warranty rate",
                  value:
                    stats?.total
                      ? `${Math.round(((stats.underWarranty || 0) / stats.total) * 100)}%`
                      : "—",
                },
                {
                  label: "AMC rate",
                  value:
                    stats?.total
                      ? `${Math.round(((stats.underAmc || 0) / stats.total) * 100)}%`
                      : "—",
                },
                {
                  label: "Non-coverage",
                  value:
                    stats?.total
                      ? `${Math.round(((stats.nonWarranty || 0) / stats.total) * 100)}%`
                      : "—",
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
            all_warranty: warrantyFilter || "ALL",
            state: stateFilter || "ALL",
          }}
          onApply={(values) => {
            setWarrantyFilter(values.all_warranty === "ALL" ? "" : values.all_warranty);
            setStateFilter(values.state === "ALL" ? "" : values.state);
          }}
          onReset={() => {
            setWarrantyFilter("");
            setStateFilter("");
            resetFilters();
          }}
        />

        {/* ── Form Drawer ── */}
        <MasterMillFormDrawer />

        {/* ── Delete Dialog ── */}
        <Dialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-8 bg-white dark:bg-gray-900">
            <DialogHeader className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto animate-bounce">
                <Trash2 size={32} />
              </div>
              <DialogTitle className="text-2xl font-black text-center text-gray-900 dark:text-white">
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-center text-gray-500 font-bold">
                This will permanently remove this master mill record from the
                system. This action cannot be undone.
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
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete Record"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </RouteGuard>
  );
}
