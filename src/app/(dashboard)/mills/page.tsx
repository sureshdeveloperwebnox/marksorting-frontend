"use client";

import * as React from "react";
import Link from "next/link";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useMills, Mill, useDeleteMill, useUpdateMill } from "@/services/mill-service";
import { useMillStore } from "@/store/useMillStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, Factory } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { PageShell, PageShellHeader, PageShellContent } from "@/components/layouts/PageShell";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { MillFormDrawer } from "@/components/forms/mill-form-drawer";

const formatPhoneNumber = (phone?: string) => {
  if (!phone) return "N/A";
  if (!phone.startsWith("+")) return phone;
  const parsed = parsePhoneNumberFromString(phone);
  if (parsed) {
    return `+${parsed.countryCallingCode} ${parsed.nationalNumber}`;
  }
  return phone;
};

const getStatusColors = (status: string) => {
  const normalized = status?.toUpperCase() || "";
  switch (normalized) {
    case "ACTIVE":
      return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400";
    case "INACTIVE":
      return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500 dark:border-amber-400";
    case "CLOSED":
      return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500 dark:border-rose-400";
    default:
      return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500 dark:border-gray-400";
  }
};

const getStatusDotColors = (status: string) => {
  const normalized = status?.toUpperCase() || "";
  switch (normalized) {
    case "ACTIVE":
      return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    case "INACTIVE":
      return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    case "CLOSED":
      return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
    default:
      return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
  }
};

const millFilterFields: FilterField[] = [
  {
    id: "status",
    label: "Mill Status",
    options: [
      { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
      { value: "ACTIVE", label: "Active Only", iconColor: "bg-emerald-500", animatePulse: true },
      { value: "INACTIVE", label: "Inactive Only", iconColor: "bg-amber-500", animatePulse: true },
      { value: "CLOSED", label: "Closed Only", iconColor: "bg-rose-500", animatePulse: true },
    ]
  }
];

export default function MillsPage() {
  const { 
    pagination, 
    setPagination, 
    search, 
    setSearch,
    statusFilter,
    setStatusFilter,
    resetFilters,
    deleteId,
    setDeleteId,
    openFormDrawer
  } = useMillStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);

  const { data, isLoading } = useMills({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search: search,
    status: statusFilter || undefined,
  });

  const deleteMillMutation = useDeleteMill();
  const updateMillMutation = useUpdateMill();

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMillMutation.mutateAsync(deleteId);
      toast.success("Mill deleted successfully");
    } catch (error) {
      // Error handled in mutation
    } finally {
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Mill>[] = [
    {
      accessorKey: "name",
      header: "Mill Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-all duration-500 opacity-0 group-hover:opacity-100" />
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-semibold text-sm relative border border-primary/10 transition-transform duration-500 group-hover:scale-110 overflow-hidden">
              {row.original.name.charAt(0)}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-primary dark:text-primary tracking-tight">{row.original.name}</span>
            {row.original.address && (
              <span className="text-gray-500 text-xs truncate max-w-[200px]">{row.original.address}</span>
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
          <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
            {row.original.email || "N/A"}
          </span>
          <span className="text-primary dark:text-primary/80 font-bold text-xs bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded w-fit border border-primary/5">
            {formatPhoneNumber(row.original.phone)}
          </span>
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
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse transition-all duration-300",
                    getStatusDotColors(status)
                  )} />
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
            <DropdownMenuContent align="start" className="w-32 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 z-[9999]">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-1.5 mb-1 select-none">
                Set Status
              </div>
              <DropdownMenuItem
                className={cn(
                  "rounded-lg font-semibold text-xs my-0.5 focus:bg-emerald-500/10 focus:text-emerald-500 cursor-pointer flex items-center gap-2 py-2 px-2.5 transition-colors",
                  status === "ACTIVE" ? "text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10" : "text-gray-700 dark:text-gray-300"
                )}
                onClick={() => updateMillMutation.mutate({ id: millId, status: "ACTIVE" })}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ACTIVE
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(
                  "rounded-lg font-semibold text-xs my-0.5 focus:bg-amber-500/10 focus:text-amber-500 cursor-pointer flex items-center gap-2 py-2 px-2.5 transition-colors",
                  status === "INACTIVE" ? "text-amber-500 bg-amber-500/5 dark:bg-amber-500/10" : "text-gray-700 dark:text-gray-300"
                )}
                onClick={() => updateMillMutation.mutate({ id: millId, status: "INACTIVE" })}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                INACTIVE
              </DropdownMenuItem>
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
        <div className="flex items-center justify-end gap-2.5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => openFormDrawer(row.original.id)}
            className="h-9 w-9 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 hover:text-amber-700 hover:bg-amber-100/80 dark:hover:bg-amber-950/50 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 hover:text-rose-700 hover:bg-rose-100/80 dark:hover:bg-rose-950/50 hover:scale-110 active:scale-95 transition-all duration-300 hover:shadow-[0_0_12px_rgba(244,63,94,0.15)] shadow-sm"
            onClick={() => setDeleteId(row.original.id)}
            disabled={deleteMillMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageShell>
      <PageShellHeader
        title="Mill Management"
        action={
          <Button 
            onClick={() => openFormDrawer()}
            className="border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white rounded-[16px] h-12 px-6 gap-2 transition-all hover:scale-105 active:scale-95 font-semibold shadow-sm hover:shadow-lg hover:shadow-primary/20"
          >
            <Factory className="h-4 w-4" />
            Add New Mill
          </Button>
        }
      />

      <PageShellContent>
        <DataTable
          columns={columns}
          data={data?.mills || []}
          loading={isLoading}
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
        />
      </PageShellContent>
      <GenericFilterDrawer 
        isOpen={isFilterDrawerOpen} 
        onClose={() => setIsFilterDrawerOpen(false)} 
        fields={millFilterFields}
        activeValues={{ status: statusFilter || "ALL" }}
        onApply={(values) => {
          setStatusFilter(values.status === "ALL" ? "" : values.status);
        }}
        onReset={() => {
          setStatusFilter("");
          resetFilters();
        }}
      />
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-8 bg-white dark:bg-gray-900">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto animate-bounce">
              <Trash2 size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-gray-900 dark:text-white">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-center text-gray-500 font-bold">
              This action cannot be undone. This will permanently deactivate the mill from the system.
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
              {deleteMillMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Mill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MillFormDrawer />
    </PageShell>
  );
}
