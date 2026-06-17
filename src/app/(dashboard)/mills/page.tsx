"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useMills, Mill, useDeleteMill, useUpdateMill } from "@/services/mill-service";
import { useMillStore } from "@/store/useMillStore";
import { useCustomers } from "@/services/customer-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Loader2,
  Factory,
  Eye,
  Building2,
  Phone,
  Mail,
  MapPin,
  Hash,
  Calendar,
  Users,
} from "lucide-react";
import { ViewDetailsDrawer } from "@/components/ui/view-details-drawer";
import { useMill } from "@/services/mill-service";
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
import { cn, formatPhoneNumber } from "@/lib/utils";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { MillFormDrawer } from "@/components/forms/mill-form-drawer";
import { RouteGuard } from "@/components/guards/route-guard";

/* ─── Helpers ──────────────────────────────────────────────────── */

const getStatusColors = (status: string) => {
  switch (status?.toUpperCase()) {
    case "ACTIVE": return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400";
    case "INACTIVE": return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500 dark:border-amber-400";
    case "CLOSED": return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500 dark:border-rose-400";
    default: return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500 dark:border-gray-400";
  }
};

const getStatusDotColors = (status: string) => {
  switch (status?.toUpperCase()) {
    case "ACTIVE": return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    case "INACTIVE": return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    case "CLOSED": return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
    default: return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
  }
};

const millStatusFilterField: FilterField = {
  id: "status",
  label: "Mill Status",
  options: [
    { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
    { value: "ACTIVE", label: "Active Only", iconColor: "bg-emerald-500", animatePulse: true },
    { value: "INACTIVE", label: "Inactive Only", iconColor: "bg-amber-500", animatePulse: true },
    { value: "CLOSED", label: "Closed Only", iconColor: "bg-rose-500", animatePulse: true },
  ],
};


/* ─── Page ──────────────────────────────────────────────────────── */

export default function MillsPage() {
  const {
    pagination,
    setPagination,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    customerFilter,
    setCustomerFilter,
    resetFilters,
    deleteId,
    setDeleteId,
    openFormDrawer,
  } = useMillStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);
  const [selectedViewId, setSelectedViewId] = React.useState<string | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false);

  const { data: viewMillData, isLoading: isViewMillLoading } = useMill(selectedViewId);

  // Load all customers for the filter dropdown
  const { data: customersData } = useCustomers({ skip: 0, take: 500 });
  const customers = customersData?.customers || [];

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  /* ── Data queries ── */
  const { data, isLoading, isFetching, refetch } = useMills({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search,
    status: statusFilter || undefined,
    customer_id: customerFilter || undefined,
  });

  const { data: totalData, refetch: refetchTotal, isFetching: isFetchingTotal } = useMills({ skip: 0, take: 1 });
  const { data: activeData, refetch: refetchActive, isFetching: isFetchingActive } = useMills({ skip: 0, take: 1, status: "ACTIVE" });
  const { data: inactiveData, refetch: refetchInactive, isFetching: isFetchingInactive } = useMills({ skip: 0, take: 1, status: "INACTIVE" });
  const { data: closedData, refetch: refetchClosed, isFetching: isFetchingClosed } = useMills({ skip: 0, take: 1, status: "CLOSED" });

  const isRefreshing = isFetching || isFetchingTotal || isFetchingActive || isFetchingInactive || isFetchingClosed;

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchTotal(), refetchActive(), refetchInactive(), refetchClosed()]);
  };

  const deleteMillMutation = useDeleteMill();
  const updateMillMutation = useUpdateMill();

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMillMutation.mutateAsync(deleteId);
      toast.success("Mill deleted successfully");
    } catch {
      // Error handled in mutation
    } finally {
      setDeleteId(null);
    }
  };

  /* ── Dynamic filter fields (includes customer list) ── */
  const millFilterFields: FilterField[] = [
    millStatusFilterField,
    {
      id: "customer",
      label: "Customer",
      options: [
        { value: "ALL", label: "All Customers", iconColor: "bg-gray-400 dark:bg-gray-500" },
        ...customers.map((c) => ({
          value: c.id,
          label: c.name,
          iconColor: "bg-primary",
        })),
      ],
    },
  ];

  const activeFilterCount = [statusFilter, customerFilter].filter(Boolean).length;

  /* ── View sections ── */
  const viewSections = React.useMemo(() => {
    if (!viewMillData) return [];
    const m = viewMillData;

    const statusColor = (s: string) => {
      switch (s?.toUpperCase()) {
        case 'ACTIVE': return 'text-emerald-600 dark:text-emerald-400';
        case 'INACTIVE': return 'text-amber-500 dark:text-amber-400';
        case 'CLOSED': return 'text-rose-500 dark:text-rose-400';
        default: return 'text-gray-500';
      }
    };

    return [
      {
        title: 'Mill Information',
        items: [
          {
            label: 'Mill Name',
            value: (
              <span className="font-bold text-gray-900 dark:text-white">
                {m.name}
              </span>
            ),
            icon: Building2,
          },
          {
            label: 'Ref No',
            value: m.ref_no ? (
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {m.ref_no}
              </span>
            ) : null,
            icon: Hash,
          },
          {
            label: 'Status',
            value: (
              <span className={`font-black text-xs uppercase tracking-widest ${statusColor(m.status)}`}>
                {m.status}
              </span>
            ),
            icon: Building2,
          },
          {
            label: 'Customer',
            value: m.customer?.name || null,
            icon: Users,
          },
        ],
      },
      {
        title: 'Contact Details',
        items: [
          {
            label: 'Email',
            value: m.email ? (
              <a href={`mailto:${m.email}`} className="text-primary font-bold hover:underline">
                {m.email}
              </a>
            ) : null,
            icon: Mail,
          },
          {
            label: 'Primary Phone',
            value: m.phone ? (
              <a href={`tel:${m.phone}`} className="text-primary font-bold hover:underline">
                {m.phone}
              </a>
            ) : null,
            icon: Phone,
          },
          {
            label: 'Phone 2',
            value: m.phone_2 ? (
              <a href={`tel:${m.phone_2}`} className="text-primary font-bold hover:underline">
                {m.phone_2}
              </a>
            ) : null,
            icon: Phone,
          },
          {
            label: 'Phone 3',
            value: m.phone_3 ? (
              <a href={`tel:${m.phone_3}`} className="text-primary font-bold hover:underline">
                {m.phone_3}
              </a>
            ) : null,
            icon: Phone,
          },
        ],
      },
      {
        title: 'Location',
        items: [
          {
            label: 'Address',
            value: m.address || null,
            icon: MapPin,
            fullWidth: true,
          },
          {
            label: 'Place',
            value: m.place || null,
            icon: MapPin,
          },
          {
            label: 'City',
            value: m.city || null,
            icon: MapPin,
          },
        ],
      },
      {
        title: 'System Info',
        items: [
          {
            label: 'Created',
            value: format(new Date(m.created_at), 'dd MMM yyyy, hh:mm a'),
            icon: Calendar,
          },
          {
            label: 'Last Updated',
            value: format(new Date(m.updated_at), 'dd MMM yyyy, hh:mm a'),
            icon: Calendar,
          },
        ],
      },
    ];
  }, [viewMillData]);

  /* ── Table columns ── */
  const columns: ColumnDef<Mill>[] = [
    {
      accessorKey: "name",
      header: "Mill Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-semibold text-sm relative border border-primary/10 transition-transform duration-500 group-hover:scale-110 overflow-hidden">
              {row.original.name.charAt(0)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[14px] text-gray-900 dark:text-white tracking-tight">
                {row.original.name}
              </span>
              {row.original.ref_no && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 dark:bg-primary/20 px-1.5 py-0.5 rounded">
                  {row.original.ref_no}
                </span>
              )}
            </div>
            {(row.original.address || row.original.place || row.original.city) && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">
                {[row.original.address, row.original.place, row.original.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
            {row.original.email || "—"}
          </span>
          {row.original.phone && (
            <span className="text-primary font-bold text-xs bg-primary/5 px-2 py-0.5 rounded w-fit border border-primary/10">
              {formatPhoneNumber(row.original.phone)}
            </span>
          )}
          {row.original.phone_2 && (
            <span className="text-primary font-bold text-xs bg-primary/5 px-2 py-0.5 rounded w-fit border border-primary/10">
              {formatPhoneNumber(row.original.phone_2)}
            </span>
          )}
          {row.original.phone_3 && (
            <span className="text-primary font-bold text-xs bg-primary/5 px-2 py-0.5 rounded w-fit border border-primary/10">
              {formatPhoneNumber(row.original.phone_3)}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const millId = row.original.id;
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
                    {status}
                  </Badge>
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-36 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 z-[9999]">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-1.5 mb-1 select-none">
                Set Status
              </div>
              {[
                { value: "ACTIVE", label: "Active", color: "emerald" },
                { value: "INACTIVE", label: "Inactive", color: "amber" },
                { value: "CLOSED", label: "Closed", color: "rose" },
              ].map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  className={cn(
                    "rounded-lg font-semibold text-xs my-0.5 cursor-pointer flex items-center gap-2 py-2 px-2.5 transition-colors",
                    status === s.value
                      ? `text-${s.color}-500 bg-${s.color}-500/5`
                      : "text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => updateMillMutation.mutate({ id: millId, status: s.value })}
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
      accessorKey: "created_at",
      header: "Created Date",
      cell: ({ row }) => (
        <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">
          {format(new Date(row.original.created_at), "MMM dd, yyyy")}
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
            className="h-9 w-9 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 hover:text-indigo-700 hover:bg-indigo-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
            onClick={() => {
              setSelectedViewId(row.original.id);
              setIsViewDrawerOpen(true);
            }}
            title="View Details"
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
            disabled={deleteMillMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
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
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full"
      >
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Mill List &amp;{" "}
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                  Details
                </span>
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Manage all mills and their information
              </p>
            </div>

            <PageHeaderControls
              searchValue={localSearch}
              onSearchChange={setLocalSearch}
              searchPlaceholder="Search mills..."
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              activeFiltersCount={activeFilterCount}
              addLabel="Add New Mill"
              addIcon={<Factory size={15} />}
              onAddClick={() => openFormDrawer()}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </div>

          {/* Status Tabs */}
          <div className="px-6 pt-4 pb-0 border-b border-gray-100 dark:border-white/5 bg-gray-50/10 dark:bg-white/[0.01]">
            <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-none">
              {[
                { value: "", label: "All Mills", count: totalData?.total, color: "text-primary bg-primary/10 border-primary/20", dotColor: "bg-primary" },
                { value: "ACTIVE", label: "Active", count: activeData?.total, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", dotColor: "bg-emerald-500" },
                { value: "INACTIVE", label: "Inactive", count: inactiveData?.total, color: "text-amber-500 bg-amber-500/10 border-amber-500/20", dotColor: "bg-amber-500" },
                { value: "CLOSED", label: "Closed", count: closedData?.total, color: "text-rose-500 bg-rose-500/10 border-rose-500/20", dotColor: "bg-rose-500" },
              ].map((tab) => {
                const isActive = statusFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border",
                      isActive
                        ? `${tab.color} shadow-sm scale-105`
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 border-transparent"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", tab.dotColor, isActive ? "animate-pulse" : "")} />
                    <span>{tab.label}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none",
                      isActive
                        ? "bg-current/15"
                        : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                    )}>
                      {tab.count ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="p-6 pt-4">
            <DataTable
              columns={columns}
              data={data?.mills || []}
              loading={isLoading || isFetching}
              pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
              totalCount={data?.total || 0}
              entityName="mills"
              pagination={pagination}
              onPaginationChange={setPagination}
              onGlobalFilterChange={setSearch}
              globalFilterValue={search}
              searchPlaceholder="Search mills..."
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              activeFiltersCount={statusFilter ? 1 : 0}
              hideToolbar
            />
          </div>
        </div>

        {/* ── Filter Drawer ── */}
        <GenericFilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          fields={millFilterFields}
          activeValues={{
            status: statusFilter || "ALL",
            customer: customerFilter || "ALL",
          }}
          onApply={(values) => {
            setStatusFilter(values.status === "ALL" ? "" : values.status);
            setCustomerFilter(values.customer === "ALL" ? "" : values.customer);
          }}
          onReset={() => {
            setStatusFilter("");
            setCustomerFilter("");
            resetFilters();
          }}
        />

        {/* ── Mill Form Drawer ── */}
        <MillFormDrawer />

        {/* ── View Details Drawer ── */}
        <ViewDetailsDrawer
          isOpen={isViewDrawerOpen}
          onClose={() => {
            setIsViewDrawerOpen(false);
            setSelectedViewId(null);
          }}
          title="Mill Details"
          description="Complete information for this mill and its contacts."
          icon={<Building2 size={22} />}
          isLoading={isViewMillLoading}
          sections={viewSections}
          size="lg"
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
                This action cannot be undone. This will permanently remove the mill from the system.
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
                disabled={deleteMillMutation.isPending}
                className="flex-1 rounded-xl h-12 bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20"
              >
                {deleteMillMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete Mill"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </RouteGuard>
  );
}
