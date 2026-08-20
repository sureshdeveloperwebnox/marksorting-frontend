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
  Check,
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
  Truck,
  Building2,
  MapPin,
  Cpu,
} from "lucide-react";
import { PageHeaderActions, PageFilterToolbar } from "@/components/ui/page-header-controls";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { DateRangePicker, DateRangeValue } from "@/components/ui/date-range-picker";
import { StoreFormDrawer } from "@/components/forms/store-form-drawer";
import { RouteGuard } from "@/components/guards/route-guard";
import { ViewDetailsDrawer } from "@/components/ui/view-details-drawer";
import { TableTabs } from "@/components/ui/table-tabs";
import { MobileSimulationModal } from "@/components/modals/MobileSimulationModal";
import { Smartphone } from "lucide-react";
import { useSearchParams } from "next/navigation";

/* ─── Helpers ──────────────────────────────────────────────────── */

export interface MaterialUnitStatus {
  barcode: string;
  used: boolean;
  return_status?: 'Returned' | 'Not Returned';
  engineer_ack?: 'Acknowledged' | 'Pending';
  admin_ack?: 'Acknowledged' | 'Pending';
}

const getWarrantyColors = (status: string) => {
  switch (status) {
    case "Warranty": return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20";
    case "Non Warranty": return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20";
    case "Supplementary": return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20";
    case "AMC With Spare": return "bg-teal-500/5 dark:bg-teal-500/10 text-teal-500 dark:text-teal-400 border-teal-500/20";
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
  const [pendingReturnStatus, setPendingReturnStatus] = React.useState<string>("Pending");
  const [isSavingReturnStatus, setIsSavingReturnStatus] = React.useState(false);

  // Apply filters from URL query param (set when navigating from Dashboard or other views)
  const searchParams = useSearchParams();
  React.useEffect(() => {
    const qDateFrom = searchParams.get("dateFrom");
    if (qDateFrom) {
      setDateFrom(qDateFrom);
    }
    const qDateTo = searchParams.get("dateTo");
    if (qDateTo) {
      setDateTo(qDateTo);
    }
    const qReturnStatus = searchParams.get("return_status");
    if (qReturnStatus) {
      setReturnFilter(qReturnStatus);
    }
  }, [searchParams, setDateFrom, setDateTo, setReturnFilter]);

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

  const cleanBarcodeString = (str: string): string => {
    let clean = str;
    // Remove parenthesized content
    clean = clean.replace(/\(.*?\)/g, '');
    clean = clean.replace(/\[.*?\]/g, '');
    // Remove unclosed/unopened tag keywords and everything after them
    clean = clean.replace(/(?:,\s*)?(?:RETURNED|NOT_RETURNED|ENG_ACK:[^,;)]+|ADM_ACK:[^,;)]+|RET:[^,;)]+|USED).*/gi, '');
    // Strip leftover punctuation
    clean = clean.replace(/[()\[\];,:]+/g, ' ');
    return clean.trim();
  };

  const splitSerialsString = (str: string): string[] => {
    const result: string[] = [];
    let current = '';
    let parenDepth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '(') {
        parenDepth++;
        current += char;
      } else if (char === ')') {
        if (parenDepth > 0) parenDepth--;
        current += char;
      } else if (char === ',' && parenDepth === 0) {
        if (current.trim()) result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      result.push(current.trim());
    }

    // Filter out orphan fragments from past malformed comma splits
    return result.filter((s) => {
      const t = s.trim();
      const isOrphan = /^(RETURNED|NOT_RETURNED|ENG_ACK:|ADM_ACK:)/i.test(t);
      return !isOrphan && t.length > 0;
    });
  };

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
          const rawSerials = splitSerialsString(bracketMatch[1]);
          const serials = rawSerials
            .map((s) => cleanBarcodeString(s))
            .filter(Boolean);
          map[matName] = serials;
        }
      }
    });
    return map;
  };

  // Parse full serial info including Used, Return Status, Engineer Ack, and Admin Ack
  const parseFullSerialMapFromRemarks = (
    remarks?: string | null
  ): Record<string, MaterialUnitStatus[]> => {
    if (!remarks) return {};
    const map: Record<string, MaterialUnitStatus[]> = {};
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
          const rawSerials = splitSerialsString(bracketMatch[1]);
          const serials: MaterialUnitStatus[] = rawSerials
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => {
              const used = /\(USED/i.test(s) || /USED/i.test(s);
              const isNotReturned = /NOT_RETURNED|RET:Not Returned|Not Returned/i.test(s);
              const engAckMatch = s.match(/ENG_ACK:(Acknowledged|Pending)/i);
              const admAckMatch = s.match(/ADM_ACK:(Acknowledged|Pending)/i);
              const barcode = cleanBarcodeString(s);

              return {
                barcode,
                used,
                return_status: used
                  ? (isNotReturned ? ('Not Returned' as const) : ('Returned' as const))
                  : undefined,
                engineer_ack: used
                  ? (engAckMatch ? (engAckMatch[1] as 'Acknowledged' | 'Pending') : 'Acknowledged')
                  : undefined,
                admin_ack: used
                  ? (admAckMatch ? (admAckMatch[1] as 'Acknowledged' | 'Pending') : 'Pending')
                  : undefined,
              };
            })
            .filter((s) => s.barcode);
          map[matName] = serials;
        }
      }
    });
    return map;
  };

  const serializeSerialMapToRemarks = (
    existingRemarks: string | null | undefined,
    updatedMap: Record<string, MaterialUnitStatus[]>,
    serviceType: string
  ): string => {
    const cleanRemarks = extractCleanRemarks(existingRemarks);
    const serialSummaries: string[] = [];

    Object.entries(updatedMap).forEach(([matName, items]) => {
      if (items.length > 0) {
        const itemStrs = items.map((it) => {
          if (!it.used) return it.barcode;
          const tags: string[] = ['USED'];
          if (it.return_status) {
            tags.push(`RET:${it.return_status}`);
          }
          if (it.engineer_ack) tags.push(`ENG_ACK:${it.engineer_ack}`);
          if (it.admin_ack) tags.push(`ADM_ACK:${it.admin_ack}`);
          return `${it.barcode} (${tags.join('; ')})`;
        });
        serialSummaries.push(`${matName}: [${itemStrs.join(', ')}]`);
      }
    });

    const extraParts: string[] = [];
    if (serialSummaries.length > 0) {
      extraParts.push(`Serial Nos: ${serialSummaries.join(' | ')}`);
    }
    if (serviceType) {
      extraParts.push(`Service Type: ${serviceType}`);
    }

    const extraText = extraParts.join(' | ');
    return cleanRemarks !== '—' && cleanRemarks ? `${cleanRemarks} (${extraText})` : `(${extraText})`;
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

  // Sync pendingReturnStatus when viewStoreData changes
  React.useEffect(() => {
    if (viewStoreData) {
      setPendingReturnStatus(viewStoreData.return_status || 'Pending');
    }
  }, [viewStoreData]);

  const handleReturnStatusChange = async (newStatus: string) => {
    if (!selectedViewStoreId || !viewStoreData) return;
    setIsSavingReturnStatus(true);
    try {
      await updateStoreMutation.mutateAsync({
        id: selectedViewStoreId,
        return_status: newStatus,
      });
      setPendingReturnStatus(newStatus);
      await handleRefresh();
      toast.success(`Return status updated to "${newStatus}"`);
    } catch {
      setPendingReturnStatus(viewStoreData.return_status || 'Pending');
    } finally {
      setIsSavingReturnStatus(false);
    }
  };

  const handleMaterialAdminAckChange = async (
    matName: string,
    unitIdx: number,
    newAdminAck: 'Acknowledged' | 'Pending'
  ) => {
    if (!selectedViewStoreId || !viewStoreData) return;
    const currentMap = parseFullSerialMapFromRemarks(viewStoreData.remarks);
    if (!currentMap[matName] || !currentMap[matName][unitIdx]) return;

    currentMap[matName][unitIdx].admin_ack = newAdminAck;
    const currentServiceType = parseServiceTypeFromRemarks(viewStoreData.remarks);
    const newRemarks = serializeSerialMapToRemarks(
      viewStoreData.remarks,
      currentMap,
      currentServiceType
    );

    try {
      await updateStoreMutation.mutateAsync({
        id: selectedViewStoreId,
        remarks: newRemarks,
      });
      await handleRefresh();
      toast.success(`Admin acknowledge status updated to "${newAdminAck}"`);
    } catch {
      // toast handled in mutation
    }
  };

  const handleMaterialAdminAckAll = async (
    matName: string,
    newAdminAck: 'Acknowledged' | 'Pending'
  ) => {
    if (!selectedViewStoreId || !viewStoreData) return;
    const currentMap = parseFullSerialMapFromRemarks(viewStoreData.remarks);
    if (!currentMap[matName]) return;

    currentMap[matName] = currentMap[matName].map((u) =>
      u.used ? { ...u, admin_ack: newAdminAck } : u
    );

    const currentServiceType = parseServiceTypeFromRemarks(viewStoreData.remarks);
    const newRemarks = serializeSerialMapToRemarks(
      viewStoreData.remarks,
      currentMap,
      currentServiceType
    );

    try {
      await updateStoreMutation.mutateAsync({
        id: selectedViewStoreId,
        remarks: newRemarks,
      });
      await handleRefresh();
      toast.success(`All used units of ${matName} updated to "${newAdminAck}"`);
    } catch {
      // toast handled in mutation
    }
  };



  const viewSections = React.useMemo(() => {
    if (!viewStoreData) return [];

    const serialMap = parseSerialMapFromRemarks(viewStoreData.remarks);
    const cleanRemarks = extractCleanRemarks(viewStoreData.remarks);
    const currentServiceType = parseServiceTypeFromRemarks(viewStoreData.remarks);
    const isReturnStatusEditable = viewStoreData.return_status === "In Progress";

    return [
      {
        title: "Status Actions",
        items: [
          {
            label: "Return Status",
            value: isReturnStatusEditable ? (
              <div className="flex items-center gap-2">
                <Select
                  value={pendingReturnStatus}
                  onValueChange={(val) => val && setPendingReturnStatus(val)}
                >
                  <SelectTrigger className="h-8 w-44 text-xs font-bold bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl z-[9999]">
                    <SelectItem value="In Progress" className="font-bold py-2 text-xs text-blue-500">In Progress</SelectItem>
                    <SelectItem value="Returned" className="font-bold py-2 text-xs text-emerald-500">Returned</SelectItem>
                    <SelectItem value="Not Returned" className="font-bold py-2 text-xs text-rose-500">Not Returned</SelectItem>
                  </SelectContent>
                </Select>
                {pendingReturnStatus !== viewStoreData.return_status && (
                  <Button
                    size="sm"
                    onClick={() => handleReturnStatusChange(pendingReturnStatus)}
                    disabled={isSavingReturnStatus}
                    className="h-8 px-3 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm gap-1"
                  >
                    {isSavingReturnStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check size={12} strokeWidth={3} />}
                    Submit
                  </Button>
                )}
                {isSavingReturnStatus && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
              </div>
            ) : (
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
            label: "Service Type (Shared by Engineer)",
            value: (
              <span className={cn(
                "font-semibold text-xs",
                currentServiceType === 'Replacement'
                  ? "text-blue-500 dark:text-blue-400"
                  : "text-emerald-500 dark:text-emerald-400"
              )}>
                {currentServiceType}
              </span>
            ),
            icon: Wrench,
          },
        ],
      },
      {
        title: "Customer & Mill Information",
        items: [
          {
            label: "Customer",
            value: viewStoreData.customer?.name || "—",
            icon: Users,
          },
          {
            label: "Mill Name",
            value: viewStoreData.mill?.name || "—",
            icon: Building2,
          },
          {
            label: "Mill Ref No",
            value: viewStoreData.ref_no || viewStoreData.mill?.ref_no || "—",
            icon: Hash,
          },
          ...(viewStoreData.mill?.place ? [{
            label: "Mill Location / Place",
            value: viewStoreData.mill.place,
            icon: MapPin,
          }] : []),
          ...(viewStoreData.mc_model ? [{
            label: "Machine Model",
            value: viewStoreData.mc_model,
            icon: Cpu,
          }] : []),
          {
            label: "Service Engineer",
            value: viewStoreData.service_engineer?.full_name || "—",
            icon: Wrench,
          },
        ],
      },
      {
        title: "Record Status",
        items: [
          {
            label: "Store ID",
            value: (
              <span className="font-mono font-bold text-xs text-primary dark:text-primary-foreground">
                {viewStoreData.store_number || "—"}
              </span>
            ),
            icon: Hash,
          },
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
          {
            label: "Service Type",
            value: (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm",
                  currentServiceType === 'Replacement'
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                )}
              >
                {currentServiceType}
              </Badge>
            ),
            icon: Wrench,
          },
          ...(viewStoreData.provider_name ? [{
            label: "Courier Service",
            value: <span className="font-bold text-gray-800 dark:text-gray-200">{viewStoreData.provider_name}</span>,
            icon: Truck,
          }] : []),
          ...(viewStoreData.invoice_number ? [{
            label: "Tracking ID",
            value: <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">{viewStoreData.invoice_number}</span>,
            icon: Hash,
          }] : []),
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
              <div className="space-y-3.5 w-full">
                {viewStoreData.materials?.map((m) => {
                  const fullSerialMap = parseFullSerialMapFromRemarks(viewStoreData.remarks);
                  const units = fullSerialMap[m.material.name] || [];

                  const totalQty = m.quantity || units.length || 1;
                  const usedQty = units.filter((u) => u.used).length;
                  const unusedQty = Math.max(0, totalQty - usedQty);
                  const returnedQty = units.filter((u) => u.used && u.return_status === 'Returned').length;
                  const notReturnedQty = units.filter((u) => u.used && u.return_status === 'Not Returned').length;
                  const admAckQty = units.filter((u) => u.used && u.admin_ack === 'Acknowledged').length;
                  const admPendingQty = units.filter((u) => u.used && u.admin_ack === 'Pending').length;

                  return (
                    <div
                      key={m.material.id}
                      className="p-4 bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl space-y-3"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Package size={15} className="text-primary" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate block">
                              {m.material.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                              Material Details &amp; Inventory Breakdown
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold py-0.5 px-2 rounded-md uppercase",
                              m.stock_type === "From Store"
                                ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            )}
                          >
                            {m.stock_type || "Inflow"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs font-semibold py-0.5 px-2 bg-primary/10 border-primary/20 text-primary rounded-md"
                          >
                            QTY: {totalQty}
                          </Badge>
                        </div>
                      </div>

                      {/* Quantity Status Breakdown Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-white dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-white/5 text-[11px]">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold uppercase text-gray-400">Total Units</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{totalQty} Units Total</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold uppercase text-amber-500">Used / Unused</span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                            {usedQty} Used · {unusedQty} Unused
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold uppercase text-blue-500">Return Status</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                            {returnedQty} Returned · {notReturnedQty} Not Ret
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold uppercase text-emerald-500">Admin Acknowledge Status</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {admAckQty} Acknowledged · {admPendingQty} Pending
                          </span>
                        </div>
                      </div>

                      {/* Quick Bulk Admin Acknowledge Action if pending units exist */}
                      {usedQty > 0 && admPendingQty > 0 && (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30">
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            {admPendingQty} used {admPendingQty === 1 ? 'unit is' : 'units are'} pending admin acknowledgment
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMaterialAdminAckAll(m.material.name, "Acknowledged")}
                            className="text-[10px] font-semibold px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            ✓ Acknowledge All ({admPendingQty})
                          </button>
                        </div>
                      )}

                      {/* Units list */}
                      {units.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
                          {units.map((unit, sIdx) => {
                            const isUsed = unit.used;
                            const admAck = unit.admin_ack || 'Pending';
                            const engAck = unit.engineer_ack || 'Acknowledged';
                            const retStatus = unit.return_status || 'Returned';

                            return (
                              <div
                                key={sIdx}
                                className={cn(
                                  "p-3 rounded-xl border transition-all space-y-2.5",
                                  isUsed
                                    ? "bg-amber-50/25 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/20"
                                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-white/5"
                                )}
                              >
                                {/* Unit Header with Clean Barcode */}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary border-primary/20 rounded-md shrink-0"
                                    >
                                      Unit {sIdx + 1}
                                    </Badge>
                                    <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                      <Barcode size={15} className="text-primary/70 shrink-0" />
                                      <span>{unit.barcode}</span>
                                    </div>
                                  </div>

                                  <div>
                                    {isUsed ? (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300/40 rounded-md"
                                      >
                                        Used Material
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 rounded-md"
                                      >
                                        ✓ New Product Return (Unused)
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Status Details Bar (Shown only when Used) */}
                                {isUsed && (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-amber-200/30 dark:border-amber-900/20">
                                    {/* Return Status */}
                                    <div className="flex flex-col gap-1 p-2.5 bg-white/90 dark:bg-gray-900/70 rounded-lg border border-amber-100 dark:border-white/5">
                                      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Return Status
                                      </span>
                                      <div>
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "text-xs font-semibold px-2.5 py-0.5 rounded-md border w-fit inline-flex items-center gap-1",
                                            retStatus === "Returned"
                                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-300/50"
                                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border-rose-300/50"
                                          )}
                                        >
                                          {retStatus === "Returned" ? "✓ Returned" : "✕ Not Returned"}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Engineer Acknowledge Status */}
                                    <div className="flex flex-col gap-1 p-2.5 bg-white/90 dark:bg-gray-900/70 rounded-lg border border-amber-100 dark:border-white/5">
                                      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Engineer Acknowledge Status
                                      </span>
                                      <div>
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "text-xs font-semibold px-2.5 py-0.5 rounded-md border w-fit inline-flex items-center gap-1",
                                            engAck === "Acknowledged"
                                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-300/50"
                                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-300/50"
                                          )}
                                        >
                                          {engAck === "Acknowledged" ? "✓ Acknowledged" : "⏳ Pending"}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Admin Acknowledge Status */}
                                    <div className="flex flex-col gap-1 p-2.5 bg-white/90 dark:bg-gray-900/70 rounded-lg border border-amber-100 dark:border-white/5">
                                      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Admin Acknowledge Status
                                      </span>
                                      <Select
                                        value={admAck}
                                        onValueChange={(val) => {
                                          if (val === "Acknowledged" || val === "Pending") {
                                            handleMaterialAdminAckChange(m.material.name, sIdx, val);
                                          }
                                        }}
                                      >
                                        <SelectTrigger
                                          className={cn(
                                            "h-7.5 w-full px-2.5 text-xs font-semibold rounded-md border focus:ring-2 focus:ring-primary/20 cursor-pointer",
                                            admAck === "Acknowledged"
                                              ? "bg-emerald-500 text-white border-emerald-600"
                                              : "bg-amber-500 text-white border-amber-600"
                                          )}
                                        >
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100 dark:border-white/10 shadow-2xl z-[9999]">
                                          <SelectItem value="Acknowledged" className="font-semibold py-1.5 text-xs text-emerald-600 cursor-pointer">
                                            ✓ Acknowledged
                                          </SelectItem>
                                          <SelectItem value="Pending" className="font-semibold py-1.5 text-xs text-amber-600 cursor-pointer">
                                            ⏳ Pending
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
  }, [viewStoreData, pendingReturnStatus, isSavingReturnStatus]);

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
        { value: "Warranty", label: "Warranty", iconColor: "bg-emerald-500" },
        { value: "Non Warranty", label: "Non Warranty", iconColor: "bg-rose-500" },
        { value: "AMC With Spare", label: "AMC With Spare", iconColor: "bg-teal-500" },
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

  const dateRangeValue: DateRangeValue = React.useMemo(() => ({
    startDate: dateFrom || "",
    endDate: dateTo || "",
    label: dateFrom && dateTo ? "Custom Range" : "",
  }), [dateFrom, dateTo]);

  const handleDateRangeChange = (val: DateRangeValue) => {
    setDateFrom(val.startDate || "");
    setDateTo(val.endDate || "");
  };

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
      accessorKey: "store_number",
      header: "Store ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-primary dark:text-primary-foreground tracking-tight">
          {row.original.store_number || "—"}
        </span>
      ),
    },
    {
      accessorKey: "ref_no",
      header: "Ref No",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
          {row.original.ref_no || "—"}
        </span>
      ),
    },
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
      accessorKey: "mill.name",
      header: "Mill / Customer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {row.original.mill?.name || row.original.customer?.name || "—"}
          </span>
          {row.original.customer?.name && row.original.mill?.name && row.original.customer.name !== row.original.mill.name && (
            <span className="text-xs text-gray-400">{row.original.customer.name}</span>
          )}
        </div>
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

              <PageHeaderActions
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                renderExtraControls={() => (
                  <Button
                    onClick={() => setIsSimulationOpen(true)}
                    variant="outline"
                    className="h-10 px-4 rounded-xl font-bold text-sm border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 gap-2 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Smartphone size={15} />
                    Simulation
                  </Button>
                )}
                addLabel="Add Record"
                addIcon={<StoreIcon size={15} />}
                onAddClick={() => openFormDrawer()}
              />
            </div>

            {/* Reusable Table Tabs & Filter Toolbar (Row 2) */}
            <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/20 dark:bg-black/[0.03] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <TableTabs
                tabs={[
                  { value: "ALL", label: "All", count: totalData?.total || 0, color: "primary", icon: <Package size={14} /> },
                  { value: "PENDING", label: "Pending", count: pendingData?.total || 0, color: "amber", icon: <Clock size={14} /> },
                  { value: "IN_PROGRESS", label: "In Progress", count: inProgressData?.total || 0, color: "blue", icon: <RefreshCw size={14} /> },
                  { value: "RETURNED", label: "Returned", count: returnedData?.total || 0, color: "emerald", icon: <CheckCircle2 size={14} /> },
                  { value: "NOT_RETURNED", label: "Not Returned", count: notReturnedData?.total || 0, color: "rose", icon: <AlertTriangle size={14} /> },
                ]}
                activeValue={
                  returnFilter === "Pending"
                    ? "PENDING"
                    : returnFilter === "In Progress"
                      ? "IN_PROGRESS"
                      : returnFilter === "Returned"
                        ? "RETURNED"
                        : returnFilter === "Not Returned"
                          ? "NOT_RETURNED"
                          : "ALL"
                }
                onChange={(value) => {
                  if (value === "ALL") {
                    setReturnFilter("");
                  } else if (value === "PENDING") {
                    setReturnFilter("Pending");
                  } else if (value === "IN_PROGRESS") {
                    setReturnFilter("In Progress");
                  } else if (value === "RETURNED") {
                    setReturnFilter("Returned");
                  } else if (value === "NOT_RETURNED") {
                    setReturnFilter("Not Returned");
                  }
                }}
              />

              <PageFilterToolbar
                searchValue={localSearch}
                onSearchChange={setLocalSearch}
                searchPlaceholder="Search store records..."
                dateRangePicker={
                  <DateRangePicker
                    value={dateRangeValue}
                    onChange={handleDateRangeChange}
                    align="auto"
                  />
                }
                onFilterClick={() => setIsFilterDrawerOpen(true)}
                activeFiltersCount={activeFiltersCount}
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
          title={viewStoreData?.store_number ? `Store #${viewStoreData.store_number}` : "Store Record Details"}
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
