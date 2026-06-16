"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
    useCustomers,
    Customer,
    useDeleteCustomer,
    useUpdateCustomer,
} from "@/services/customer-service";
import { useCustomerStore } from "@/store/useCustomerStore";
import { Button } from "@/components/ui/button";
import {
    Edit,
    Trash2,
    Loader2,
    User,
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
import { cn, formatPhoneNumber } from "@/lib/utils";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { CustomerFormDrawer } from "@/components/forms/customer-form-drawer";
import { RouteGuard } from "@/components/guards/route-guard";
import { TableStatus, StatusOption } from "@/components/ui/table-status";

/* ─── Helpers ──────────────────────────────────────────────────── */

const customerStatusOptions: StatusOption[] = [
    { value: "ACTIVE", label: "Active", color: "emerald" },
    { value: "INACTIVE", label: "Inactive", color: "amber" },
];

const customerFilterFields: FilterField[] = [
    {
        id: "status",
        label: "Customer Status",
        options: [
            { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
            { value: "ACTIVE", label: "Active Only", iconColor: "bg-emerald-500", animatePulse: true },
            { value: "INACTIVE", label: "Inactive Only", iconColor: "bg-amber-500", animatePulse: true },
        ],
    },
];

/* ─── Page ──────────────────────────────────────────────────────── */

export default function CustomersPage() {
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
        openFormDrawer,
    } = useCustomerStore();

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
    const [localSearch, setLocalSearch] = React.useState(search);

    React.useEffect(() => {
        const t = setTimeout(() => setSearch(localSearch), 350);
        return () => clearTimeout(t);
    }, [localSearch, setSearch]);

    /* ── Data queries ── */
    const { data, isLoading, isFetching, refetch } = useCustomers({
        skip: pagination.pageIndex * pagination.pageSize,
        take: pagination.pageSize,
        search,
        status: statusFilter || undefined,
    });

    const isRefreshing = isFetching;

    const handleRefresh = async () => {
        await refetch();
    };

    const deleteCustomerMutation = useDeleteCustomer();
    const updateCustomerMutation = useUpdateCustomer();

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteCustomerMutation.mutateAsync(deleteId);
            toast.success("Customer deleted successfully");
        } catch {
            // handled in mutation
        } finally {
            setDeleteId(null);
        }
    };

    /* ── Columns ── */
    const columns: ColumnDef<Customer>[] = [
        {
            accessorKey: "name",
            header: "Customer Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3.5">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-semibold text-sm relative border border-primary/10 transition-transform duration-500 group-hover:scale-110">
                            {row.original.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div>
                        <span className="font-semibold text-[14px] text-gray-900 dark:text-white tracking-tight">
                            {row.original.name}
                        </span>
                        {row.original.address && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">
                                {row.original.address}
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
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                const customerId = row.original.id;
                return (
                    <TableStatus
                        value={status}
                        options={customerStatusOptions}
                        onStatusChange={(newStatus) =>
                            updateCustomerMutation.mutate({ id: customerId, status: newStatus })
                        }
                    />
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
                        disabled={deleteCustomerMutation.isPending}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    /* ── Render ── */
    return (
        <RouteGuard module="customers" action="view">
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full"
        >
            {/* Customer List Card (Full Width) */}
            <div className="w-full">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
                    {/* Card header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                Customer List &amp;{" "}
                                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                                    Details
                                </span>
                            </h1>
                            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                                Manage all customers and their information
                            </p>
                        </div>

                        <PageHeaderControls
                            searchValue={localSearch}
                            onSearchChange={setLocalSearch}
                            searchPlaceholder="Search customers..."
                            onFilterClick={() => setIsFilterDrawerOpen(true)}
                            activeFiltersCount={statusFilter ? 1 : 0}
                            addLabel="Add New Customer"
                            addIcon={<User size={15} />}
                            onAddClick={() => openFormDrawer()}
                            onRefresh={handleRefresh}
                            isRefreshing={isRefreshing}
                        />
                    </div>

                    {/* Table */}
                    <div className="p-6 pt-4">
                        <DataTable
                            columns={columns}
                            data={data?.customers || []}
                            loading={isLoading || isFetching}
                            pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
                            totalCount={data?.total || 0}
                            entityName="customers"
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            onGlobalFilterChange={setSearch}
                            globalFilterValue={search}
                            searchPlaceholder="Search customers..."
                            onFilterClick={() => setIsFilterDrawerOpen(true)}
                            activeFiltersCount={statusFilter ? 1 : 0}
                            hideToolbar
                        />
                    </div>
                </div>
            </div>

            {/* Filter Drawer */}
            <GenericFilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                fields={customerFilterFields}
                activeValues={{ status: statusFilter || "ALL" }}
                onApply={(values) => setStatusFilter(values.status === "ALL" ? "" : values.status)}
                onReset={() => { setStatusFilter(""); resetFilters(); }}
            />

            {/* Customer Form Drawer */}
            <CustomerFormDrawer />

            {/* Delete Confirm Dialog */}
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
                            This action cannot be undone. This will permanently remove the customer from the system.
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
                            disabled={deleteCustomerMutation.isPending}
                            className="flex-1 rounded-xl h-12 bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20"
                        >
                            {deleteCustomerMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Delete Customer"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
        </RouteGuard>
    );
}
