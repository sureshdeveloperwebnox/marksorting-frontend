"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { TableTabs } from "@/components/ui/table-tabs";
import { ColumnDef } from "@tanstack/react-table";
import {
  useMasterMills,
  MasterMill,
  useDeleteMasterMill,
  useUpdateMasterMill,
  useMasterMillStats,
  useMasterMill,
} from "@/services/master-mill-service";
import { useMasterMillStore } from "@/store/useMasterMillStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Loader2,
  FileText,
  ShieldOff,
  ShieldCheck,
  IndianRupee,
  ClipboardCheck,
  Eye,
  Calendar,
  Clock,
  Building2,
  MapPin,
  Phone,
  Hash,
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
import { ViewDetailsDrawer } from "@/components/ui/view-details-drawer";

/* ─── Helpers ──────────────────────────────────────────────────── */

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Delhi", "Ladakh", "Jammu and Kashmir", "Puducherry",
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
      { value: "Under Warranty", label: "Under Warranty", iconColor: "bg-emerald-500", animatePulse: true },
      { value: "Under AMC", label: "Under AMC", iconColor: "bg-amber-500" },
      { value: "Non Warranty", label: "Non Warranty", iconColor: "bg-gray-400" },
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
  {
    id: "dateRange",
    label: "Installation Date",
    type: "date-range",
    placeholder: "Select date range...",
  },
];



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
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    resetFilters,
    deleteId,
    setDeleteId,
    openFormDrawer,
  } = useMasterMillStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);
  const [selectedViewId, setSelectedViewId] = React.useState<string | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false);

  const { data: viewMillData, isLoading: isViewMillLoading } = useMasterMill(selectedViewId);

  /* ── View Sections ── */
  const viewSections = React.useMemo(() => {
    if (!viewMillData) return [];

    const years = viewMillData.warranty_years ?? 0;
    const months = viewMillData.warranty_months ?? 0;
    const warrantyPeriod = [
      years > 0 ? `${years} Year${years > 1 ? "s" : ""}` : null,
      months > 0 ? `${months} Month${months > 1 ? "s" : ""}` : null,
    ]
      .filter(Boolean)
      .join(" ");

    return [
      {
        title: "General & Mill Info",
        items: [
          {
            label: "Record Type",
            value: (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md font-black text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 shadow-sm",
                  viewMillData.type === "Service"
                    ? "bg-blue-500/5 text-blue-500 border-blue-500/30"
                    : "bg-primary/5 text-primary border-primary/30"
                )}
              >
                {viewMillData.type || "Installation"}
              </Badge>
            ),
            icon: FileText,
          },
          {
            label: "Invoice No",
            value: (
              <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                {viewMillData.invoice_no}
              </span>
            ),
            icon: Hash,
          },
          {
            label: "Invoice Date",
            value: formatDateSafe(viewMillData.invoice_date),
            icon: Calendar,
          },
          {
            label: "Reference No",
            value: viewMillData.ref_no || "—",
            icon: FileText,
          },
          {
            label: "Mill Name",
            value: viewMillData.mill?.name || "—",
            icon: Building2,
          },
          {
            label: "Phone No",
            value: viewMillData.phone_no || "—",
            icon: Phone,
          },
          {
            label: "State",
            value: viewMillData.state || "—",
            icon: MapPin,
          },
          {
            label: "Place",
            value: viewMillData.place || "—",
            icon: MapPin,
          },
          {
            label: "Address",
            value: viewMillData.address || "—",
            icon: MapPin,
            fullWidth: true,
          },
        ],
      },
      {
        title: "Machine Specification",
        items: [
          {
            label: "Machine Model",
            value: viewMillData.mc_model || "—",
            icon: FileText,
          },
          {
            label: "Frame Number",
            value: viewMillData.frame_no || "—",
            icon: Hash,
          },
        ],
      },
      {
        title: "Warranty Status",
        items: [
          {
            label: "Warranty Type",
            value: (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md font-bold text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 shadow-sm",
                  getWarrantyColors(viewMillData.all_warranty || "Non Warranty")
                )}
              >
                {viewMillData.all_warranty || "Non Warranty"}
              </Badge>
            ),
            icon: ShieldCheck,
          },
          {
            label: "Installation Date",
            value: formatDateSafe(viewMillData.installation_date),
            icon: Calendar,
          },
          {
            label: "Warranty Period",
            value: warrantyPeriod || "—",
            icon: Clock,
          },
          {
            label: "Warranty Closing Date",
            value: (
              <span
                className={cn(
                  "font-bold",
                  isExpired(viewMillData.warranty_closing_date)
                    ? "text-rose-500 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {formatDateSafe(viewMillData.warranty_closing_date)}
              </span>
            ),
            icon: Calendar,
          },
        ],
      },
      {
        title: "AMC Details",
        items: [
          {
            label: "AMC Amount",
            value: viewMillData.amc_amount != null && viewMillData.amc_amount > 0 ? (
              <span className="font-bold text-gray-900 dark:text-white">
                ₹{Number(viewMillData.amc_amount).toLocaleString("en-IN")}
              </span>
            ) : "—",
            icon: IndianRupee,
          },
          {
            label: "AMC Period",
            value: viewMillData.amc_period ? `${viewMillData.amc_period} Months` : "—",
            icon: Clock,
          },
          {
            label: "AMC Starting Date",
            value: formatDateSafe(viewMillData.amc_starting_date),
            icon: Calendar,
          },
          {
            label: "AMC Closing Date",
            value: (
              <span
                className={cn(
                  "font-bold",
                  isExpired(viewMillData.amc_closing_date)
                    ? "text-rose-500"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {formatDateSafe(viewMillData.amc_closing_date)}
              </span>
            ),
            icon: Calendar,
          },
          {
            label: "AMC Particulars",
            value: viewMillData.amc_particular || "—",
            icon: FileText,
            fullWidth: true,
          },
        ],
      },
      {
        title: "System Information",
        items: [
          {
            label: "Created At",
            value: formatDateSafe(viewMillData.created_at),
            icon: Calendar,
          },
          {
            label: "Updated At",
            value: formatDateSafe(viewMillData.updated_at),
            icon: Calendar,
          },
        ],
      },
    ];
  }, [viewMillData]);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  // Reset pagination on tab change
  React.useEffect(() => {
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
  }, [warrantyFilter, setPagination, pagination.pageSize]);

  /* ── Data queries ── */
  const { data, isLoading, isFetching, refetch } = useMasterMills({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search,
    all_warranty: warrantyFilter || undefined,
    state: stateFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
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
  const activeFiltersCount = [warrantyFilter, stateFilter, dateFrom, dateTo].filter(Boolean).length;

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
        <div className="flex flex-col gap-1 min-w-[160px]">
          <span className="font-medium text-sm text-primary dark:text-orange-400 tracking-tight leading-tight">
            {row.original.invoice_no}
          </span>
          {row.original.ref_no && (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                <Hash className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                  {row.original.ref_no}
                </span>
              </span>
            </div>
          )}
          {row.original.invoice_date && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 text-[10px] font-bold text-gray-600 dark:text-gray-400 w-fit">
              <Calendar className="w-2.5 h-2.5 flex-shrink-0 text-gray-400" />
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
        <div className="flex flex-col gap-1 min-w-[140px]">
          <p className="font-bold text-sm text-gray-700 dark:text-gray-300 leading-tight">
            {row.original.mc_model || "—"}
          </p>
          {row.original.frame_no && (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
                <Hash className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-none">
                  {row.original.frame_no}
                </span>
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "warranty_combined",
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

        const type = row.original.all_warranty || "Non Warranty";
        const millId = row.original.id;
        const expired = isExpired(row.original.warranty_closing_date);
        const closingDate = formatDateSafe(row.original.warranty_closing_date);
        const instDate = formatDateSafe(row.original.installation_date);

        const typeConfig = {
          "Under Warranty": {
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
            border: "border-emerald-200 dark:border-emerald-800/50",
            text: "text-emerald-700 dark:text-emerald-400",
            dot: "bg-emerald-500",
            pulse: true,
          },
          "Under AMC": {
            bg: "bg-amber-50 dark:bg-amber-950/40",
            border: "border-amber-200 dark:border-amber-800/50",
            text: "text-amber-700 dark:text-amber-400",
            dot: "bg-amber-500",
            pulse: false,
          },
          "Expired": {
            bg: "bg-rose-50 dark:bg-rose-950/40",
            border: "border-rose-200 dark:border-rose-800/50",
            text: "text-rose-600 dark:text-rose-400",
            dot: "bg-rose-500",
            pulse: false,
          },
          "Non Warranty": {
            bg: "bg-gray-100 dark:bg-gray-800/40",
            border: "border-gray-200 dark:border-gray-700/50",
            text: "text-gray-500 dark:text-gray-400",
            dot: "bg-gray-400",
            pulse: false,
          },
        };
        const cfg = typeConfig[type as keyof typeof typeConfig] ?? typeConfig["Non Warranty"];

        return (
          <div className="flex flex-col gap-1.5 min-w-[160px]">

            {/* ── Warranty Type badge — clickable dropdown ── */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className={cn(
                    "inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs cursor-pointer outline-none select-none",
                    "hover:opacity-80 active:scale-95 transition-all duration-200",
                    cfg.bg, cfg.border, cfg.text
                  )}>
                    <span className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      cfg.dot,
                      cfg.pulse && "animate-pulse"
                    )} />
                    {type}
                    <svg className="w-3 h-3 opacity-50 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                }
              />
              <DropdownMenuContent align="start" className="w-44 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 z-[9999]">
                <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 pb-1.5 mb-1">
                  Change Status
                </div>
                {(["Under Warranty", "Under AMC", "Non Warranty", "Expired"] as const).map((w) => {
                  const wCfg = typeConfig[w];
                  return (
                    <DropdownMenuItem
                      key={w}
                      className={cn(
                        "rounded-lg font-semibold text-xs my-0.5 cursor-pointer flex items-center gap-2 py-2 px-2.5",
                        type === w
                          ? cn("font-black", wCfg.text, wCfg.bg)
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                      )}
                      onClick={() => updateMutation.mutate({ id: millId, all_warranty: w })}
                    >
                      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", wCfg.dot)} />
                      {w}
                      {type === w && (
                        <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ── Period + Installation date ── */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {period && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50 text-[10px] font-bold text-violet-700 dark:text-violet-400">
                  {period}
                </span>
              )}
              {row.original.installation_date && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 text-[10px] font-bold text-sky-700 dark:text-sky-400">
                  <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                  {instDate}
                </span>
              )}
            </div>

            {/* ── Closing date ── */}
            {row.original.warranty_closing_date && (
              <span className={cn(
                "inline-flex w-fit items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border",
                expired
                  ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", expired ? "bg-rose-500" : "bg-emerald-500")} />
                {expired ? "Exp:" : "Till:"} {closingDate}
              </span>
            )}
          </div>
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
            className="h-8 w-8 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 hover:text-indigo-700 hover:bg-indigo-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
            onClick={() => {
              setSelectedViewId(row.original.id);
              setIsViewDrawerOpen(true);
            }}
            title="View Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
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
        className="grid grid-cols-1 gap-5"
      >
        {/* ════════════════════════════════════════
            LEFT — Main Table (3/4 width)
        ════════════════════════════════════════ */}
        <div>
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

            {/* Reusable Table Tabs */}
            <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/20 dark:bg-black/[0.03]">
              <TableTabs
                tabs={[
                  { value: "", label: "All Records", count: stats?.total || 0, color: "primary", icon: <ClipboardCheck size={14} /> },
                  { value: "Under Warranty", label: "Under Warranty", count: stats?.underWarranty || 0, color: "emerald", icon: <ShieldCheck size={14} /> },
                  { value: "Under AMC", label: "Under AMC", count: stats?.underAmc || 0, color: "amber", icon: <IndianRupee size={14} /> },
                  { value: "Non Warranty", label: "Non Warranty", count: stats?.nonWarranty || 0, color: "gray", icon: <ShieldOff size={14} /> },
                ]}
                activeValue={warrantyFilter || ""}
                onChange={(value) => setWarrantyFilter(value)}
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



        {/* ── Filter Drawer ── */}
        <GenericFilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          fields={filterFields}
          activeValues={{
            all_warranty: warrantyFilter || "ALL",
            state: stateFilter || "ALL",
            dateRange: dateFrom && dateTo ? JSON.stringify({ startDate: dateFrom, endDate: dateTo, label: "Custom Range" }) : "",
          }}
          onApply={(values) => {
            setWarrantyFilter(values.all_warranty === "ALL" ? "" : values.all_warranty);
            setStateFilter(values.state === "ALL" ? "" : values.state);
            if (values.dateRange) {
              try {
                const range = JSON.parse(values.dateRange);
                setDateFrom(range.startDate || "");
                setDateTo(range.endDate || range.startDate || "");
              } catch {
                setDateFrom("");
                setDateTo("");
              }
            } else {
              setDateFrom("");
              setDateTo("");
            }
          }}
          onReset={() => {
            setWarrantyFilter("");
            setStateFilter("");
            setDateFrom("");
            setDateTo("");
            resetFilters();
          }}
        />

        {/* ── Form Drawer ── */}
        <MasterMillFormDrawer />

        {/* ── View Details Drawer ── */}
        <ViewDetailsDrawer
          isOpen={isViewDrawerOpen}
          onClose={() => {
            setIsViewDrawerOpen(false);
            setSelectedViewId(null);
          }}
          title={
            viewMillData
              ? `Master Mill: ${viewMillData.invoice_no}`
              : "Master Mill Details"
          }
          description={
            viewMillData
              ? `${viewMillData.mill?.name || viewMillData.mc_model || "—"} · ${formatDateSafe(viewMillData.invoice_date)}`
              : "Loading master mill details..."
          }
          icon={<Building2 size={22} />}
          isLoading={isViewMillLoading}
          sections={viewSections}
          size="lg"
        />

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
