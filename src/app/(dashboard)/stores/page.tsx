"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useStores, Store, useDeleteStore, useUpdateStore, useStore } from "@/services/store-service";
import { useStoreItemStore } from "@/store/useStoreItemStore";
import { useTechnicians } from "@/services/technician-service";
import { useCustomers } from "@/services/customer-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Loader2,
  Store as StoreIcon,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Wrench,
  Users,
  Hash,
  Package,
  ShieldAlert,
  Barcode,
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
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { StoreFormDrawer } from "@/components/forms/store-form-drawer";
import { RouteGuard } from "@/components/guards/route-guard";
import { ViewDetailsDrawer } from "@/components/ui/view-details-drawer";

/* ─── Helpers ──────────────────────────────────────────────────── */

const getWarrantyColors = (status: string) => {
  switch (status) {
    case "Under Warranty": return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20";
    case "Expired": return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20";
    default: return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20";
  }
};

const getReturnColors = (status: string) => {
  switch (status) {
    case "Returned": return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20";
    case "Pending": return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20";
    case "Not Returned": return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20";
    case "Completed": return "bg-teal-500/5 dark:bg-teal-500/10 text-teal-500 dark:text-teal-400 border-teal-500/20";
    default: return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20";
  }
};

const getReturnDotColors = (status: string) => {
  switch (status) {
    case "Returned": return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    case "Pending": return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    case "Not Returned": return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
    case "Completed": return "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]";
    default: return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
  }
};

const getInflowColors = (status: string) => {
  switch (status) {
    case "Inflow": return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20";
    case "Outflow": return "bg-purple-500/5 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20";
    case "Available": return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20";
    case "Damaged": return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20";
    default: return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20";
  }
};

const getInflowDotColors = (status: string) => {
  switch (status) {
    case "Inflow": return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
    case "Outflow": return "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]";
    case "Available": return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    case "Damaged": return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
    default: return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
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

export default function StoresPage() {
  const {
    pagination,
    setPagination,
    search,
    setSearch,
    serviceEngineerFilter,
    setServiceEngineerFilter,
    customerFilter,
    setCustomerFilter,
    materialFilter,
    setMaterialFilter,
    warrantyFilter,
    setWarrantyFilter,
    returnFilter,
    setReturnFilter,
    inflowFilter,
    setInflowFilter,
    resetFilters,
    deleteId,
    setDeleteId,
    openFormDrawer,
    isViewDrawerOpen,
    selectedViewStoreId,
    openViewDrawer,
    closeViewDrawer,
  } = useStoreItemStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  /* ── Data queries ── */
  const { data, isLoading } = useStores({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search,
    service_engineer_id: serviceEngineerFilter || undefined,
    customer_id: customerFilter || undefined,
    material_id: materialFilter || undefined,
    warranty_status: warrantyFilter || undefined,
    return_status: returnFilter || undefined,
    inflow_status: inflowFilter || undefined,
  });

  const { data: totalData } = useStores({ skip: 0, take: 1 });
  const { data: availableData } = useStores({ skip: 0, take: 1, inflow_status: "Available" });
  const { data: pendingReturnData } = useStores({ skip: 0, take: 1, return_status: "Pending" });
  const { data: damagedData } = useStores({ skip: 0, take: 1, inflow_status: "Damaged" });

  const { data: techniciansData } = useTechnicians({ skip: 0, take: 500 });
  const { data: customersData } = useCustomers({ skip: 0, take: 500 });

  const { data: viewStoreData, isLoading: isViewStoreLoading } = useStore(selectedViewStoreId);

  const deleteStoreMutation = useDeleteStore();
  const updateStoreMutation = useUpdateStore();

  const viewSections = React.useMemo(() => {
    if (!viewStoreData) return [];

    return [
      {
        title: "People & Ownership",
        items: [
          {
            label: "Service Engineer",
            value: viewStoreData.service_engineer?.full_name || "—",
            icon: Wrench,
          },
          {
            label: "Customer",
            value: viewStoreData.customer?.name || "—",
            icon: Users,
          },
        ],
      },
      {
        title: "Item Details",
        items: [
          {
            label: "Frame Number",
            value: (
              <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                {viewStoreData.frame_number}
              </span>
            ),
            icon: Hash,
          },
          {
            label: "Quantity",
            value: <span className="font-extrabold text-gray-900 dark:text-white">{viewStoreData.quantity}</span>,
            icon: Hash,
          },
          {
            label: "Materials",
            value: (
              <div className="flex flex-wrap gap-1">
                {viewStoreData.materials?.map((m) => (
                  <Badge
                    key={m.material.id}
                    variant="outline"
                    className="text-[10px] font-bold py-0.5 px-2 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-300 rounded-md"
                  >
                    {m.material.name}
                  </Badge>
                ))}
                {!viewStoreData.materials?.length && "—"}
              </div>
            ),
            icon: Package,
            fullWidth: true,
          },
        ],
      },
      {
        title: "Status & Warranties",
        items: [
          {
            label: "Warranty Status",
            value: (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm",
                  getWarrantyColors(viewStoreData.warranty_status)
                )}
              >
                {viewStoreData.warranty_status}
              </Badge>
            ),
            icon: ShieldAlert,
          },
          {
            label: "Return Status",
            value: (
              <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", getReturnDotColors(viewStoreData.return_status))} />
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm",
                    getReturnColors(viewStoreData.return_status)
                  )}
                >
                  {viewStoreData.return_status}
                </Badge>
              </div>
            ),
            icon: Clock,
          },
          {
            label: "Stock Status",
            value: (
              <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", getInflowDotColors(viewStoreData.inflow_status))} />
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm",
                    getInflowColors(viewStoreData.inflow_status)
                  )}
                >
                  {viewStoreData.inflow_status}
                </Badge>
              </div>
            ),
            icon: StoreIcon,
          },
          {
            label: "Barcode",
            value: viewStoreData.barcode ? (
              <div className="flex items-center gap-2 p-2 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl">
                <Barcode className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                  {viewStoreData.barcode}
                </span>
              </div>
            ) : (
              "—"
            ),
            icon: Barcode,
            fullWidth: true,
          },
        ],
      },
      ...(viewStoreData.provider_name || viewStoreData.invoice_number
        ? [
            {
              title: "Return Shipment Details",
              items: [
                {
                  label: "Provider Name",
                  value: viewStoreData.provider_name || "—",
                  icon: Users,
                },
                {
                  label: "Invoice/Receipt Number",
                  value: viewStoreData.invoice_number || "—",
                  icon: Hash,
                },
              ],
            },
          ]
        : []),
      {
        title: "Metadata",
        items: [
          {
            label: "Created At",
            value: viewStoreData.created_at
              ? format(new Date(viewStoreData.created_at), "PPP p")
              : "—",
            icon: Clock,
          },
          {
            label: "Updated At",
            value: viewStoreData.updated_at
              ? format(new Date(viewStoreData.updated_at), "PPP p")
              : "—",
            icon: Clock,
          },
        ],
      },
    ];
  }, [viewStoreData]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStoreMutation.mutateAsync(deleteId);
      toast.success("Store record deleted successfully");
    } catch {
      // Error handled in mutation
    } finally {
      setDeleteId(null);
    }
  };

  const storeFilterFields: FilterField[] = React.useMemo(() => [
    {
      id: "service_engineer_id",
      label: "Service Engineer",
      options: [
        { value: "ALL", label: "All Engineers" },
        ...(techniciansData?.technicians ?? []).map((t) => ({ value: t.id, label: t.full_name })),
      ],
    },
    {
      id: "customer_id",
      label: "Customer",
      options: [
        { value: "ALL", label: "All Customers" },
        ...(customersData?.customers ?? []).map((c) => ({ value: c.id, label: c.name })),
      ],
    },
    {
      id: "warranty_status",
      label: "Warranty Status",
      options: [
        { value: "ALL", label: "All Warranty" },
        { value: "Under Warranty", label: "Under Warranty", iconColor: "bg-emerald-500" },
        { value: "Expired", label: "Expired", iconColor: "bg-rose-500" },
      ],
    },
    {
      id: "return_status",
      label: "Return Status",
      options: [
        { value: "ALL", label: "All Returns" },
        { value: "Returned", label: "Returned", iconColor: "bg-emerald-500" },
        { value: "Pending", label: "Pending", iconColor: "bg-amber-500" },
        { value: "Not Returned", label: "Not Returned", iconColor: "bg-rose-500" },
        { value: "Completed", label: "Completed", iconColor: "bg-teal-500" },
      ],
    },
    {
      id: "inflow_status",
      label: "Stock Status",
      options: [
        { value: "ALL", label: "All Statuses" },
        { value: "Inflow", label: "Inflow", iconColor: "bg-blue-500" },
        { value: "Outflow", label: "Outflow", iconColor: "bg-purple-500" },
        { value: "Available", label: "Available", iconColor: "bg-emerald-500" },
        { value: "Damaged", label: "Damaged", iconColor: "bg-rose-500" },
      ],
    },
  ], [techniciansData, customersData]);

  const activeFiltersCount = [
    serviceEngineerFilter,
    customerFilter,
    materialFilter,
    warrantyFilter,
    returnFilter,
    inflowFilter
  ].filter(Boolean).length;

  /* ── Table columns ── */
  const columns: ColumnDef<Store>[] = [
    {
      accessorKey: "service_engineer.full_name",
      header: "Service Engineer",
      cell: ({ row }) => (
        <span className="font-semibold text-[14px] text-gray-900 dark:text-white">
          {row.original.service_engineer?.full_name || "—"}
        </span>
      ),
    },
    {
      accessorKey: "customer.name",
      header: "Customer",
      cell: ({ row }) => (
        <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
          {row.original.customer?.name || "—"}
        </span>
      ),
    },
    {
      id: "materials",
      header: "Materials",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.materials.map((m) => (
            <Badge key={m.material.id} variant="outline" className="text-[10px] font-bold py-0.5 px-1.5 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5">
              {m.material.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => (
        <span className="font-bold text-gray-900 dark:text-white">
          {row.original.quantity}
        </span>
      ),
    },
    {
      accessorKey: "warranty_status",
      header: "Warranty",
      cell: ({ row }) => {
        const val = row.original.warranty_status;
        return (
          <Badge variant="outline" className={cn("rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm", getWarrantyColors(val))}>
            {val}
          </Badge>
        );
      },
    },
    {
      accessorKey: "frame_number",
      header: "Frame Number",
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-gray-400 font-mono text-xs font-bold">
          {row.original.frame_number}
        </span>
      ),
    },
    {
      accessorKey: "return_status",
      header: "Return Status",
      cell: ({ row }) => {
        const val = row.original.return_status;
        const storeId = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-1.5 cursor-pointer outline-none select-none group/status hover:scale-105 transition-all duration-300">
                  <div className={cn("w-2 h-2 rounded-full", getReturnDotColors(val))} />
                  <Badge variant="outline" className={cn("rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm group-hover/status:border-primary/50", getReturnColors(val))}>
                    {val}
                  </Badge>
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-36 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl bg-white dark:bg-gray-900 z-[9999]">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-1.5 mb-1 select-none">
                Set Return
              </div>
              {[
                { value: "Returned", color: "emerald" },
                { value: "Pending", color: "amber" },
                { value: "Not Returned", color: "rose" },
              ].map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  className={cn(
                    "rounded-lg font-semibold text-xs my-0.5 cursor-pointer flex items-center gap-2 py-2 px-2.5 transition-colors",
                    val === s.value
                      ? `text-${s.color}-500 bg-${s.color}-500/5`
                      : "text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => updateStoreMutation.mutate({ id: storeId, return_status: s.value })}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-${s.color}-500`} />
                  {s.value.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      accessorKey: "inflow_status",
      header: "Stock Status",
      cell: ({ row }) => {
        const val = row.original.inflow_status;
        const storeId = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-1.5 cursor-pointer outline-none select-none group/status hover:scale-105 transition-all duration-300">
                  <div className={cn("w-2 h-2 rounded-full", getInflowDotColors(val))} />
                  <Badge variant="outline" className={cn("rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm group-hover/status:border-primary/50", getInflowColors(val))}>
                    {val}
                  </Badge>
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-36 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl bg-white dark:bg-gray-900 z-[9999]">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-1.5 mb-1 select-none">
                Set Stock
              </div>
              {[
                { value: "Inflow", color: "blue" },
                { value: "Outflow", color: "purple" },
                { value: "Available", color: "emerald" },
                { value: "Damaged", color: "rose" },
              ].map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  className={cn(
                    "rounded-lg font-semibold text-xs my-0.5 cursor-pointer flex items-center gap-2 py-2 px-2.5 transition-colors",
                    val === s.value
                      ? `text-${s.color}-500 bg-${s.color}-500/5`
                      : "text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => updateStoreMutation.mutate({ id: storeId, inflow_status: s.value })}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-${s.color}-500`} />
                  {s.value.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      accessorKey: "barcode",
      header: "Barcode",
      cell: ({ row }) => (
        <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold">
          {row.original.barcode || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right w-full font-bold">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 hover:text-blue-700 hover:bg-blue-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
            onClick={() => openViewDrawer(row.original.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
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
            disabled={deleteStoreMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleFilterApply = (values: Record<string, string>) => {
    setServiceEngineerFilter(values.service_engineer_id === "ALL" ? "" : values.service_engineer_id || "");
    setCustomerFilter(values.customer_id === "ALL" ? "" : values.customer_id || "");
    setWarrantyFilter(values.warranty_status === "ALL" ? "" : values.warranty_status || "");
    setReturnFilter(values.return_status === "ALL" ? "" : values.return_status || "");
    setInflowFilter(values.inflow_status === "ALL" ? "" : values.inflow_status || "");
  };

  const filterActiveValues = {
    service_engineer_id: serviceEngineerFilter || "ALL",
    customer_id: customerFilter || "ALL",
    warranty_status: warrantyFilter || "ALL",
    return_status: returnFilter || "ALL",
    inflow_status: inflowFilter || "ALL",
  };

  /* ── Render ── */
  return (
    <RouteGuard module="stores" action="view">
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-cols-1 xl:grid-cols-4 gap-5"
    >
      {/* ════════════════════════════════════════
          LEFT — Store List Card  (3/4 width)
      ════════════════════════════════════════ */}
      <div className="xl:col-span-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Store Management
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                  {/* Inventory */}
                </span>
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Track inflows, outflows, and returnable items
              </p>
            </div>

            <PageHeaderControls
              searchValue={localSearch}
              onSearchChange={setLocalSearch}
              searchPlaceholder="Search store records..."
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              activeFiltersCount={activeFiltersCount}
              addLabel="Add Record"
              addIcon={<StoreIcon size={15} />}
              onAddClick={() => openFormDrawer()}
            />
          </div>

          {/* Table */}
          <div className="p-6 pt-4">
            <DataTable
              columns={columns}
              data={data?.stores || []}
              loading={isLoading}
              pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
              totalCount={data?.total || 0}
              entityName="store records"
              pagination={pagination}
              onPaginationChange={setPagination}
              onGlobalFilterChange={setSearch}
              globalFilterValue={search}
              searchPlaceholder="Search store records..."
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              activeFiltersCount={activeFiltersCount}
              hideToolbar
            />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT — Statistics Panel  (1/4 width)
      ════════════════════════════════════════ */}
      <div className="xl:col-span-1 flex flex-col gap-4">
        <StatsCard
          title="Total Store Records"
          value={totalData?.total}
          loading={!totalData}
          icon={<StoreIcon size={20} className="text-primary" />}
          iconBg="bg-primary/10 dark:bg-primary/15"
          gradient="bg-primary"
          trend="Total logged records"
        />
        <StatsCard
          title="Available Items"
          value={availableData?.total}
          loading={!availableData}
          icon={<CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-500/15"
          gradient="bg-emerald-500"
          trend="Available in inventory"
        />
        <StatsCard
          title="Pending Returns"
          value={pendingReturnData?.total}
          loading={!pendingReturnData}
          icon={<Clock size={20} className="text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-500/15"
          gradient="bg-amber-500"
          trend="Items pending return"
        />
        <StatsCard
          title="Damaged Stock"
          value={damagedData?.total}
          loading={!damagedData}
          icon={<AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />}
          iconBg="bg-rose-50 dark:bg-rose-500/15"
          gradient="bg-rose-500"
          trend="Damaged/unusable items"
        />
      </div>

      {/* ── Filter Drawer ── */}
      <GenericFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        fields={storeFilterFields}
        activeValues={filterActiveValues}
        onApply={handleFilterApply}
        onReset={() => {
          setServiceEngineerFilter("");
          setCustomerFilter("");
          setWarrantyFilter("");
          setReturnFilter("");
          setInflowFilter("");
          resetFilters();
        }}
      />

      {/* ── Store Form Drawer ── */}
      <StoreFormDrawer />

      {/* ── View Details Drawer ── */}
      <ViewDetailsDrawer
        isOpen={isViewDrawerOpen}
        onClose={closeViewDrawer}
        title="Store Record Details"
        description="Detailed view of the registered stores inventory record."
        icon={<StoreIcon size={24} />}
        isLoading={isViewStoreLoading}
        sections={viewSections}
        size="xl"
      />

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
              This action cannot be undone. This will permanently remove the store record from the database.
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
              disabled={deleteStoreMutation.isPending}
              className="flex-1 rounded-xl h-12 bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20"
            >
              {deleteStoreMutation.isPending ? (
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
