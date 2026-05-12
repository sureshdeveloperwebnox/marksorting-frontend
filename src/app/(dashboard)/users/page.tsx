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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {row.original.full_name.charAt(0)}
          </div>
          <span className="font-medium text-slate-700">{row.original.full_name}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-slate-500">{row.original.email}</span>,
    },
    {
      accessorKey: "role.name",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium">
          {row.original.role.name}
        </Badge>
      ),
    },
    {
      accessorKey: "account_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.account_status;
        return (
          <Badge
            className={
              status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-emerald-100"
                : "bg-rose-50 text-rose-600 hover:bg-rose-50 border-rose-100"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Joined Date",
      cell: ({ row }) => (
        <span className="text-slate-500">{format(new Date(row.original.created_at), "MMM dd, yyyy")}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-500">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-rose-500"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-8 space-y-8 max-w-[1600px] mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your team members and their permissions</p>
        </div>
        <Button className="rounded-xl h-12 px-6 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-semibold">
          <UserPlus className="h-5 w-5" />
          Add New User
        </Button>
      </div>

      <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-1 border border-slate-200/60 shadow-sm">
        <DataTable
          columns={columns}
          data={data?.users || []}
          loading={isLoading}
          pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
          pagination={pagination}
          onPaginationChange={setPagination}
          onGlobalFilterChange={setSearch}
          searchPlaceholder="Search users by name or email..."
        />
      </div>
    </motion.div>
  );
}
