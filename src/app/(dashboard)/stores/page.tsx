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
  Info,
  RefreshCw,
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
import { TableTabs } from "@/components/ui/table-tabs";
import { MobileSimulationModal } from "@/components/modals/MobileSimulationModal";
import { Smartphone } from "lucide-react";

/* ─── Helpers ──────────────────────────────────────────────────── */

const getWarrantyColors = (status: string) => {
  switch (status) {
    case "Non Warranty": return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20";
    case "Supplementary": return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20";
    case "AMC With Spare": return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20";
    case "AMC Without Spare": return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20";
    default: return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20";
  }
};

const getReturnColors = (status: string) => {
  switch (status) {
    case "Returned": return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20";
    case "Pending": return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20";
    case "In Progress": return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20";
    case "Not Returned": return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20";
    case "Completed": return "bg-teal-500/5 dark:bg-teal-500/10 text-teal-500 dark:text-teal-400 border-teal-500/20";
    default: return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20";
  }
};

const getReturnDotColors = (status: string) => {
  switch (status) {
    case "Returned": return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    case "Pending": return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    case "In Progress": return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
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
    stockTypeFilter,
    setStockTypeFilter,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
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
  const [isSimulationOpen, setIsSimulationOpen] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  /* ── Data queries ── */
  const { data, isLoading, isFetching, refetch } = useStores({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search,
    service_engineer_id: serviceEngineerFilter || undefined,
    customer_id: customerFilter || undefined,
    material_id: materialFilter || undefined,
    warranty_status: warrantyFilter || undefined,
    return_status: returnFilter || undefined,
    inflow_status: inflowFilter || undefined,
    stock_type: stockTypeFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // Shared filters applied to tab counts so they reflect the current filter context
  const sharedCountFilters = {
    search,
    service_engineer_id: serviceEngineerFilter || undefined,
    customer_id: customerFilter || undefined,
    material_id: materialFilter || undefined,
    warranty_status: warrantyFilter || undefined,
    stock_type: stockTypeFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data: totalData, refetch: refetchTotal, isFetching: isFetchingTotal } = useStores({ skip: 0, take: 1, ...sharedCountFilters });
  const { data: pendingData, refetch: refetchPending, isFetching: isFetchingPending } = useStores({ skip: 0, take: 1, ...sharedCountFilters, return_status: "Pending" });
  const { data: inProgressData, refetch: refetchInProgress, isFetching: isFetchingInProgress } = useStores({ skip: 0, take: 1, ...sharedCountFilters, return_status: "In Progress" });
  const { data: returnedData, refetch: refetchReturned, isFetching: isFetchingReturned } = useStores({ skip: 0, take: 1, ...sharedCountFilters, return_status: "Returned" });
  const { data: notReturnedData, refetch: refetchNotReturned, isFetching: isFetchingNotReturned } = useStores({ skip: 0, take: 1, ...sharedCountFilters, return_status: "Not Returned" });

  const isRefreshing = isFetching || isFetchingTotal || isFetchingPending || isFetchingInProgress || isFetchingReturned || isFetchingNotReturned;

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchTotal(), refetchPending(), refetchInProgress(), refetchReturned(), refetchNotReturned()]);
  };

  const { data: techniciansData } = useTechnicians({ skip: 0, take: 500 });
  const { data: customersData } = useCustomers({ skip: 0, take: 500 });

  const { data: viewStoreData, isLoading: isViewStoreLoading } = useStore(selectedViewStoreId);

  const deleteStoreMutation = useDeleteStore();
  const updateStoreMutation = useUpdateStore();

  const parseSerialMapFromRemarks = (remarks?: string | null): Record<string, string[]> => {
    if (!remarks) return {};
    const map: Record<string, string[]> = {};
    const serialNosIdx = remarks.indexOf('Serial Nos:');
    if (serialNosIdx === -1) return {};

    let serialStr = remarks.substring(serialNosIdx + 'Serial Nos:'.length);
    const stIdx = serialStr.indexOf('Service Type:');
    if (stIdx !== -1) {
      serialStr = serialStr.substring(0, stIdx);
    }
    serialStr = serialStr.replace(/[\)\|\s]+$/, '').trim();

    const parts = serialStr.split('|');
    parts.forEach((part) => {
      const colIdx = part.indexOf(':');
      if (colIdx !== -1) {
        const matName = part.substring(0, colIdx).trim();
        const serialsStr = part.substring(colIdx + 1).trim();
        const bracketMatch = serialsStr.match(/\[(.*?)\]/);
        if (bracketMatch && bracketMatch[1]) {
          const serials = bracketMatch[1].split(',').map((s) => s.trim().replace(/\s*\(USED\)/gi, '')).filter(Boolean);
          map[matName] = serials;
        }
      }
    });
    return map;
  };

  // Parse full serial info including (USED) flag for barcode table in view
  const parseFullSerialMapFromRemarks = (remarks?: string | null): Record<string, { barcode: string; used: boolean }[]> => {
    if (!remarks) return {};
    const map: Record<string, { barcode: string; used: boolean }[]> = {};
    const serialNosIdx = remarks.indexOf('Serial Nos:');
    if (serialNosIdx === -1) return {};

    let serialStr = remarks.substring(serialNosIdx + 'Serial Nos:'.length);
    const stIdx = serialStr.indexOf('Service Type:');
    if (stIdx !== -1) {
      serialStr = serialStr.substring(0, stIdx);
    }
    serialStr = serialStr.replace(/[\)\|\s]+$/, '').trim();

    const parts = serialStr.split('|');
    parts.forEach((part) => {
      const colIdx = part.indexOf(':');
      if (colIdx !== -1) {
        const matName = part.substring(0, colIdx).trim();
        const serialsStr = part.substring(colIdx + 1).trim();
        const bracketMatch = serialsStr.match(/\[(.*?)\]/);
        if (bracketMatch && bracketMatch[1]) {
          const serials = bracketMatch[1].split(',').map((s) => {
            const raw = s.trim();
            const used = /\(USED\)/i.test(raw);
            const barcode = raw.replace(/\s*\(USED\)/gi, '').trim();
            return { barcode, used };
          }).filter((s) => s.barcode);
          map[matName] = serials;
        }
      }
    });
    return map;
  };

  const parseServiceTypeFromRemarks = (remarks?: string | null): string => {
    if (!remarks) return 'Acknowledgement';
    const matches = [...remarks.matchAll(/Service Type:\s*([^\s|)]+)/gi)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      if (lastMatch && lastMatch[1]) return lastMatch[1].trim();
    }
    return 'Acknowledgement';
  };

  const extractCleanRemarks = (remarks?: string | null): string => {
    if (!remarks) return "—";
    let cleaned = remarks;
    const serialIdx = cleaned.search(/\(?\s*Serial Nos:/i);
    if (serialIdx !== -1) {
      cleaned = cleaned.substring(0, serialIdx);
    }
    const stIdx = cleaned.search(/\(?\s*Service Type:/i);
    if (stIdx !== -1) {
      cleaned = cleaned.substring(0, stIdx);
    }
    cleaned = cleaned.replace(/[\(\)\|\s,]+$/, "").trim();
    return cleaned || "—";
  };

  const viewSections = React.useMemo(() => {
    if (!viewStoreData) return [];

    const serialMap = parseSerialMapFromRemarks(viewStoreData.remarks);
    const cleanRemarks = extractCleanRemarks(viewStoreData.remarks);

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
              <div className="space-y-2.5 w-full">
                {viewStoreData.materials?.map((m) => {
                  const serials = serialMap[m.material.name] || [];

                  return (
                    <div
                      key={m.material.id}
                      className="p-3 bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Package size={14} className="text-primary/70 shrink-0" />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            {m.material.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-extrabold py-0.5 px-2 rounded-md uppercase",
                              m.stock_type === "From Store"
                                ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            )}
                          >
                            {m.stock_type || "Inflow"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold py-0.5 px-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 text-primary rounded-md"
                          >
                            QTY: {m.quantity || 1}
                          </Badge>
                        </div>
                      </div>

                      {serials.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-gray-100 dark:border-white/5">
                          {serials.map((ser, sIdx) => (
                            <div
                              key={sIdx}
                              className="flex items-center gap-2 bg-white dark:bg-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-white/5 text-xs"
                            >
                              <span className="text-[10px] font-extrabold text-primary/70 shrink-0">
                                Unit {sIdx + 1}:
                              </span>
                              <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                {ser}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!viewStoreData.materials?.length && "—"}
              </div>
            ),
            icon: Package,
            fullWidth: true,
          },
          {
            label: "Remarks",
            value: cleanRemarks,
            icon: Info,
            fullWidth: true,
          },
        ],
      },
      // Show barcode table section when return_status is "In Progress", "Returned", "Not Returned", or "Completed"
      ...(['In Progress', 'Returned', 'Not Returned', 'Completed'].includes(viewStoreData.return_status) ? [{
        title: "Barcode / Return Details",
        items: [
          {
            label: "Shipment",
            icon: Barcode,
            fullWidth: true,
            value: (() => {
              const fullSerialMap = parseFullSerialMapFromRemarks(viewStoreData.remarks);
              const serviceType = parseServiceTypeFromRemarks(viewStoreData.remarks);
              const allMats = viewStoreData.materials || [];
              if (allMats.length === 0) return <span className="text-gray-400 text-xs">No barcode data available.</span>;
              return (
                <div className="w-full space-y-4">
                  {/* Courier details */}
                  {(viewStoreData.provider_name || viewStoreData.invoice_number) && (
                    <div className="flex flex-wrap gap-4 mb-2">
                      {viewStoreData.provider_name && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-extrabold text-primary/70 uppercase tracking-wide">Courier Service</span>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{viewStoreData.provider_name}</span>
                        </div>
                      )}
                      {viewStoreData.invoice_number && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-extrabold text-primary/70 uppercase tracking-wide">Tracking ID</span>
                          <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">{viewStoreData.invoice_number}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {allMats.map((m) => {
                    const serials = fullSerialMap[m.material.name] || [];
                    if (serials.length === 0) return null;
                    return (
                      <div key={m.material.id} className="rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                          <Package size={13} className="text-primary/70" />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{m.material.name}</span>
                          <span className="ml-auto text-[10px] font-bold text-primary/60">QTY: {serials.length}</span>
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                              <th className="text-left px-3 py-2 text-[10px] font-extrabold text-gray-500 uppercase">Barcode</th>
                              <th className="text-center px-3 py-2 text-[10px] font-extrabold text-orange-500 uppercase">Used</th>
                              <th className="text-center px-3 py-2 text-[10px] font-extrabold text-emerald-600 uppercase">New Return</th>
                              {serviceType === 'Replacement' && (
                                <th className="text-center px-3 py-2 text-[10px] font-extrabold text-rose-500 uppercase">Old Return</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {serials.map((s, idx) => {
                              const newReturn = !s.used ? 1 : 0;
                              const oldReturn = s.used && serviceType === 'Replacement' ? 1 : 0;
                              return (
                                <tr key={idx} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                                  <td className="px-3 py-2 font-mono font-bold text-gray-800 dark:text-gray-200">{s.barcode}</td>
                                  <td className="px-3 py-2 text-center">
                                    {s.used
                                      ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30"><svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg></span>
                                      : <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-200 dark:border-white/20" />}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {newReturn > 0
                                      ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-bold text-emerald-600">{newReturn}</span>
                                      : <span className="text-gray-300 dark:text-gray-600">0</span>}
                                  </td>
                                  {serviceType === 'Replacement' && (
                                    <td className="px-3 py-2 text-center">
                                      {oldReturn > 0
                                        ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-xs font-bold text-rose-500">{oldReturn}</span>
                                        : <span className="text-gray-300 dark:text-gray-600">0</span>}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              );
            })(),
          },
        ],
      }] : []),
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
            label: "Stock Type",
            value: (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm",
                  viewStoreData.stock_type === "From Store"
                    ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                )}
              >
                {viewStoreData.stock_type || "Inflow"}
              </Badge>
            ),
            icon: Package,
          },
        ],
      },
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
      id: "stock_type",
      label: "Stock Type",
      options: [
        { value: "ALL", label: "All Stock Types" },
        { value: "Inflow", label: "Inflow", iconColor: "bg-emerald-500" },
        { value: "From Store", label: "From Store", iconColor: "bg-purple-500" },
      ],
    },
    {
      id: "warranty_status",
      label: "Warranty Status",
      options: [
        { value: "ALL", label: "All Warranty" },
        { value: "Non Warranty", label: "Non Warranty", iconColor: "bg-rose-500" },
        { value: "Supplementary", label: "Supplementary", iconColor: "bg-blue-500" },
        { value: "AMC With Spare", label: "AMC With Spare", iconColor: "bg-emerald-500" },
        { value: "AMC Without Spare", label: "AMC Without Spare", iconColor: "bg-amber-500" },
      ],
    },
    {
      id: "return_status",
      label: "Return Status",
      options: [
        { value: "ALL", label: "All Returns" },
        { value: "Pending", label: "Pending", iconColor: "bg-amber-500" },
        { value: "In Progress", label: "In Progress", iconColor: "bg-blue-500" },
        { value: "Returned", label: "Returned", iconColor: "bg-emerald-500" },
        { value: "Not Returned", label: "Not Returned", iconColor: "bg-rose-500" },
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
    {
      id: "dateRange",
      label: "Select Date",
      type: "date-range",
      placeholder: "Select date range...",
    },
  ], [techniciansData, customersData]);

  const activeFiltersCount = [
    serviceEngineerFilter,
    customerFilter,
    materialFilter,
    warrantyFilter,
    returnFilter,
    inflowFilter,
    stockTypeFilter,
    dateFrom,
    dateTo,
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
        <div className="flex flex-wrap gap-1 max-w-[170px]">
          {row.original.materials.map((m) => (
            <Badge
              key={m.material.id}
              variant="outline"
              className={cn(
                "text-[10px] font-bold py-0.5 px-1.5 border",
                m.stock_type === "From Store"
                  ? "bg-purple-50 dark:bg-purple-950/20 text-purple-600 border-purple-200 dark:border-purple-900/30"
                  : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 dark:border-emerald-900/30"
              )}
              title={`Stock Type: ${m.stock_type || 'Inflow'}`}
            >
              {m.material.name} (x{m.quantity || 1})
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
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => {
        const clean = extractCleanRemarks(row.original.remarks);
        return (
          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs truncate max-w-[110px] block" title={clean}>
            {clean}
          </span>
        );
      },
    },
    {
      accessorKey: "return_status",
      header: "Return Status",
      cell: ({ row }) => {
        const val = row.original.return_status;
        return (
          <div className="flex items-center gap-1.5 select-none">
            <div className={cn("w-2 h-2 rounded-full", getReturnDotColors(val))} />
            <Badge variant="outline" className={cn("rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm", getReturnColors(val))}>
              {val}
            </Badge>
          </div>
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
    setStockTypeFilter(values.stock_type === "ALL" ? "" : values.stock_type || "");
    setWarrantyFilter(values.warranty_status === "ALL" ? "" : values.warranty_status || "");
    setReturnFilter(values.return_status === "ALL" ? "" : values.return_status || "");
    setInflowFilter(values.inflow_status === "ALL" ? "" : values.inflow_status || "");
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
  };

  const filterActiveValues = {
    service_engineer_id: serviceEngineerFilter || "ALL",
    customer_id: customerFilter || "ALL",
    stock_type: stockTypeFilter || "ALL",
    warranty_status: warrantyFilter || "ALL",
    return_status: returnFilter || "ALL",
    inflow_status: inflowFilter || "ALL",
    dateRange: dateFrom && dateTo ? JSON.stringify({ startDate: dateFrom, endDate: dateTo, label: "Custom Range" }) : "",
  };

  /* ── Render ── */
  return (
    <RouteGuard module="stores" action="view">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full"
      >
        {/* Store List Card (Full width) */}
        <div className="w-full">
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

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setIsSimulationOpen(true)}
                  variant="outline"
                  className="h-9 px-4 rounded-xl font-bold text-sm border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 gap-2 transition-all shadow-sm"
                >
                  <Smartphone size={15} />
                  Simulation
                </Button>
                <PageHeaderControls
                  searchValue={localSearch}
                  onSearchChange={setLocalSearch}
                  searchPlaceholder="Search store records..."
                  onFilterClick={() => setIsFilterDrawerOpen(true)}
                  activeFiltersCount={activeFiltersCount}
                  addLabel="Add Record"
                  addIcon={<StoreIcon size={15} />}
                  onAddClick={() => openFormDrawer()}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                />
              </div>
            </div>

            {/* Reusable Table Tabs */}
            <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/20 dark:bg-black/[0.03]">
              <TableTabs
                tabs={[
                  { value: "ALL", label: "All", count: totalData?.total || 0, color: "primary", icon: <Package size={14} /> },
                  { value: "PENDING", label: "Pending", count: pendingData?.total || 0, color: "amber", icon: <Clock size={14} /> },
                  { value: "IN_PROGRESS", label: "In Progress", count: inProgressData?.total || 0, color: "blue", icon: <RefreshCw size={14} /> },
                  { value: "RETURNED", label: "Returned", count: returnedData?.total || 0, color: "emerald", icon: <CheckCircle2 size={14} /> },
                  { value: "NOT_RETURNED", label: "Not Returned", count: notReturnedData?.total || 0, color: "rose", icon: <AlertTriangle size={14} /> },
                ]}
                activeValue={
                  returnFilter === "Pending" && !inflowFilter
                    ? "PENDING"
                    : returnFilter === "In Progress" && !inflowFilter
                      ? "IN_PROGRESS"
                      : returnFilter === "Returned" && !inflowFilter
                        ? "RETURNED"
                        : returnFilter === "Not Returned" && !inflowFilter
                          ? "NOT_RETURNED"
                          : inflowFilter === "" && returnFilter === ""
                            ? "ALL"
                            : ""
                }
                onChange={(value) => {
                  if (value === "ALL") {
                    setInflowFilter("");
                    setReturnFilter("");
                  } else if (value === "PENDING") {
                    setInflowFilter("");
                    setReturnFilter("Pending");
                  } else if (value === "IN_PROGRESS") {
                    setInflowFilter("");
                    setReturnFilter("In Progress");
                  } else if (value === "RETURNED") {
                    setInflowFilter("");
                    setReturnFilter("Returned");
                  } else if (value === "NOT_RETURNED") {
                    setInflowFilter("");
                    setReturnFilter("Not Returned");
                  }
                }}
              />
            </div>

            {/* Table */}
            <div className="p-6 pt-4">
              <DataTable
                columns={columns}
                data={data?.stores || []}
                loading={isLoading || isFetching}
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
            setStockTypeFilter("");
            setWarrantyFilter("");
            setReturnFilter("");
            setInflowFilter("");
            setDateFrom("");
            setDateTo("");
            resetFilters();
          }}
        />

        {/* ── Mobile Simulation Modal ── */}
        <MobileSimulationModal
          isOpen={isSimulationOpen}
          onClose={() => setIsSimulationOpen(false)}
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
