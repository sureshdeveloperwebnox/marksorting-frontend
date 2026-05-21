"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useRoles, Role, useDeleteRole, useUpdateRole } from "@/services/role-service";
import { useRoleStore } from "@/store/useRoleStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Shield,
  Loader2,
  Users,
  TrendingUp,
} from "lucide-react";
import { PageHeaderControls } from "@/components/ui/page-header-controls";
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
import { RoleFormDrawer } from "@/components/forms/role-form-drawer";

const roleFilterFields: FilterField[] = [];

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

export default function RolesPage() {
  const {
    pagination,
    setPagination,
    search,
    setSearch,
    resetFilters,
    deleteId,
    setDeleteId,
    openFormDrawer,
  } = useRoleStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  const { data, isLoading } = useRoles({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search,
  });

  const { data: totalData } = useRoles({ skip: 0, take: 1 });

  const deleteRoleMutation = useDeleteRole();
  const updateRoleMutation = useUpdateRole();

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRoleMutation.mutateAsync(deleteId);
      toast.success("Role deleted successfully");
    } catch {
      // Error handled in mutation
    } finally {
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: "Role Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-semibold text-sm relative border border-primary/10 transition-transform duration-500 group-hover:scale-110 overflow-hidden">
              <Shield size={18} />
            </div>
          </div>
          <div>
            <span className="font-semibold text-[14px] text-gray-900 dark:text-white tracking-tight">{row.original.name}</span>
            {row.original.description && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{row.original.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "_count.users",
      header: "Assigned Users",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users size={14} className="text-gray-400" />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            {row.original._count?.users ?? 0}
          </span>
        </div>
      ),
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
            disabled={deleteRoleMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-cols-1 xl:grid-cols-4 gap-5"
    >
      {/* LEFT — Role List Card (3/4 width) */}
      <div className="xl:col-span-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Role List &amp;{" "}
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                  Details
                </span>
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Manage system roles and their permissions
              </p>
            </div>

            <PageHeaderControls
              searchValue={localSearch}
              onSearchChange={setLocalSearch}
              searchPlaceholder="Search roles..."
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              activeFiltersCount={0}
              addLabel="Add New Role"
              addIcon={<Shield size={15} />}
              onAddClick={() => openFormDrawer()}
            />
          </div>

          {/* Table */}
          <div className="p-6 pt-4">
            <DataTable
              columns={columns}
              data={data?.roles || []}
              loading={isLoading}
              pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
              totalCount={data?.total || 0}
              entityName="roles"
              pagination={pagination}
              onPaginationChange={setPagination}
              onGlobalFilterChange={setSearch}
              globalFilterValue={search}
              searchPlaceholder="Search..."
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              activeFiltersCount={0}
              hideToolbar
            />
          </div>
        </div>
      </div>

      {/* RIGHT — Statistics Panel (1/4 width) */}
      <div className="xl:col-span-1 flex flex-col gap-4">
        <StatsCard
          title="Total Roles"
          value={totalData?.total}
          loading={!totalData}
          icon={<Shield size={20} className="text-primary" />}
          iconBg="bg-primary/10 dark:bg-primary/15"
          gradient="bg-primary"
          trend="All system roles"
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[20px] p-5 bg-gradient-to-br from-primary to-orange-500 border border-primary/20 shadow-sm shadow-primary/20"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bS0xMiAxMnY2aDZ2LTZoLTZ6bTAtMTJ2Nmg2di02aC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <p className="text-xs font-bold text-white/70 uppercase tracking-[0.12em] mb-2 relative">Quick Info</p>
          <div className="space-y-3 relative">
            <p className="text-xs font-semibold text-white/80">
              Roles define access levels and permissions for users in the system.
            </p>
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Shield size={12} />
              <span>Cannot delete roles with assigned users</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Drawer */}
      <GenericFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        fields={roleFilterFields}
        activeValues={{}}
        onApply={() => { }}
        onReset={() => { resetFilters(); }}
      />

      {/* Role Form Drawer */}
      <RoleFormDrawer />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-8 bg-white dark:bg-gray-900">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto animate-bounce">
              <Trash2 size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-gray-900 dark:text-white">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-center text-gray-500 font-bold">
              This action cannot be undone. This will permanently remove the role from the system.
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
              disabled={deleteRoleMutation.isPending}
              className="flex-1 rounded-xl h-12 bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20"
            >
              {deleteRoleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
