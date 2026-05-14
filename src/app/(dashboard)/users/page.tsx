"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useUsers, User, useDeleteUser } from "@/services/user-service";
import { useUserStore } from "@/store/useUserStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, UserPlus, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PageShell, PageShellHeader, PageShellContent } from "@/components/layouts/PageShell";

export default function UsersPage() {
  const { pagination, setPagination, search, setSearch } = useUserStore();
  const { data, isLoading } = useUsers({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search: search,
  });

  const deleteUserMutation = useDeleteUser();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUserMutation.mutateAsync(id);
        toast.success("User deleted successfully");
      } catch (error) {
        toast.error("Failed to delete user");
      }
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
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-black text-sm relative border border-primary/10 transition-transform duration-500 group-hover:scale-110">
              {row.original.full_name.charAt(0)}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-[15px] text-gray-900 dark:text-white tracking-tight">{row.original.full_name}</span>
            <span className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">User ID: #{row.original.id.slice(-4)}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-sm">
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: "role.name",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-white/10 font-black text-[10px] uppercase tracking-[0.1em] px-3 py-1 rounded-lg">
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
                "rounded-lg font-black text-[10px] uppercase tracking-[0.1em] px-3 py-1 border-none shadow-sm",
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
        <span className="text-gray-400 dark:text-gray-500 font-bold text-sm">
          {format(new Date(row.original.created_at), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
            onClick={() => handleDelete(row.original.id)}
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
        subtitle="Monitor and manage your mill operation team members."
        action={
          <Button className="rounded-[16px] h-12 px-6 gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-black transition-all hover:scale-105 active:scale-95">
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        }
      />

      <PageShellContent>
        <DataTable
          columns={columns}
          data={data?.users || []}
          loading={isLoading}
          pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
          pagination={pagination}
          onPaginationChange={setPagination}
          onGlobalFilterChange={setSearch}
          searchPlaceholder="Search team members..."
        />
      </PageShellContent>
    </PageShell>
  );
}
