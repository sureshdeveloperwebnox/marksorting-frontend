"use client";

import * as React from "react";
import Link from "next/link";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useUsers, User, useDeleteUser } from "@/services/user-service";
import { useUserStore } from "@/store/useUserStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, UserPlus, Eye, Loader2 } from "lucide-react";
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
import { PageShell, PageShellHeader, PageShellContent } from "@/components/layouts/PageShell";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const formatPhoneNumber = (phone?: string) => {
  if (!phone) return "";
  if (!phone.startsWith("+")) return phone;
  const parsed = parsePhoneNumberFromString(phone);
  if (parsed) {
    return `+${parsed.countryCallingCode} ${parsed.nationalNumber}`;
  }
  return phone;
};

const userFilterFields: FilterField[] = [
  {
    id: "status",
    label: "Account Status",
    options: [
      { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
      { value: "ACTIVE", label: "Active Only", iconColor: "bg-emerald-500", animatePulse: true },
      { value: "INACTIVE", label: "Inactive Only", iconColor: "bg-amber-500", animatePulse: true },
      { value: "LOCKED", label: "Locked Only", iconColor: "bg-rose-500", animatePulse: true },
    ]
  }
];

export default function UsersPage() {
  const { 
    pagination, 
    setPagination, 
    search, 
    setSearch,
    statusFilter,
    setStatusFilter,
    resetFilters,
    deleteId,
    setDeleteId
  } = useUserStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);

  const { data, isLoading } = useUsers({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search: search,
    status: statusFilter || undefined,
  });

  const deleteUserMutation = useDeleteUser();

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUserMutation.mutateAsync(deleteId);
      toast.success("User deleted successfully");
    } catch (error) {
      // Error handled in mutation
    } finally {
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "full_name",
      header: "Full Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-all duration-500 opacity-0 group-hover:opacity-100" />
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-semibold text-sm relative border border-primary/10 transition-transform duration-500 group-hover:scale-110 overflow-hidden">
              {row.original.profile_image_url ? (
                <img 
                  src={row.original.profile_image_url} 
                  alt={row.original.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                row.original.full_name.charAt(0)
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-primary dark:text-primary tracking-tight">{row.original.full_name}</span>
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
            {row.original.email}
          </span>
          {row.original.phone_number && (
            <span className="text-primary dark:text-primary/80 font-bold text-xs bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded w-fit border border-primary/5">
              {formatPhoneNumber(row.original.phone_number)}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "role.name",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-primary/5 dark:bg-primary/10 text-primary border-primary/10 font-semibold text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-md shadow-sm">
          {row.original.role.name}
        </Badge>
      ),
    },
    {
      accessorKey: "account_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.account_status;
        const isActive = status === "ACTIVE";
        return (
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
            )} />
            <Badge
              className={cn(
                "rounded-md font-semibold text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 border-none shadow-sm",
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}
            >
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Joined Date",
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
          <Link href={`/users/new?id=${row.original.id}`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 hover:text-amber-700 hover:bg-amber-100/80 dark:hover:bg-amber-950/50 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 hover:text-rose-700 hover:bg-rose-100/80 dark:hover:bg-rose-950/50 hover:scale-110 active:scale-95 transition-all duration-300 hover:shadow-[0_0_12px_rgba(244,63,94,0.15)] shadow-sm"
            onClick={() => setDeleteId(row.original.id)}
            disabled={deleteUserMutation.isPending}
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
        title="User Management"
        action={
          <Link href="/users/new">
            <Button className="border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white rounded-[16px] h-12 px-6 gap-2 transition-all hover:scale-105 active:scale-95 font-semibold shadow-sm hover:shadow-lg hover:shadow-primary/20">
              <UserPlus className="h-4 w-4" />
              Add New User
            </Button>
          </Link>
        }
      />

      <PageShellContent>
        <DataTable
          columns={columns}
          data={data?.users || []}
          loading={isLoading}
          pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
          totalCount={data?.total || 0}
          entityName="users"
          pagination={pagination}
          onPaginationChange={setPagination}
          onGlobalFilterChange={setSearch}
          globalFilterValue={search}
          searchPlaceholder="Search team members..."
          onFilterClick={() => setIsFilterDrawerOpen(true)}
          activeFiltersCount={statusFilter ? 1 : 0}
        />
      </PageShellContent>
      <GenericFilterDrawer 
        isOpen={isFilterDrawerOpen} 
        onClose={() => setIsFilterDrawerOpen(false)} 
        fields={userFilterFields}
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
              This action cannot be undone. This will permanently deactivate the user account from the system.
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
              disabled={deleteUserMutation.isPending}
              className="flex-1 rounded-xl h-12 bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20"
            >
              {deleteUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
