"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
    useExpenseCategories,
    ExpenseCategory,
    useDeleteExpenseCategory,
    useUpdateExpenseCategory,
} from "@/services/expense-category-service";
import useExpenseCategoryStore from "@/store/useExpenseCategoryStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Edit,
    Trash2,
    Loader2,
    Tag,
    TrendingUp,
    CheckCircle2,
    XCircle,
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
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { ExpenseCategoryFormDrawer } from "@/components/forms/expense-category-form-drawer";

/* ─── Helpers ──────────────────────────────────────────────────── */

const getStatusColors = (status: string) => {
    switch (status?.toUpperCase()) {
        case "ACTIVE":
            return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400";
        case "INACTIVE":
            return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500 dark:border-amber-400";
        default:
            return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500 dark:border-gray-400";
    }
};

const getStatusDotColors = (status: string) => {
    switch (status?.toUpperCase()) {
        case "ACTIVE":
            return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
        case "INACTIVE":
            return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
        default:
            return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
    }
};

const categoryFilterFields: FilterField[] = [
    {
        id: "status",
        label: "Category Status",
        options: [
            { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
            { value: "ACTIVE", label: "Active Only", iconColor: "bg-emerald-500", animatePulse: true },
            { value: "INACTIVE", label: "Inactive Only", iconColor: "bg-amber-500", animatePulse: true },
        ],
    },
];

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
            <div
                className={cn(
                    "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 -translate-y-6 translate-x-6",
                    gradient
                )}
            />
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
                <div
                    className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                        iconBg
                    )}
                >
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function ExpenseCategoryPage() {
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
    } = useExpenseCategoryStore();

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
    const [localSearch, setLocalSearch] = React.useState(search);

    React.useEffect(() => {
        const t = setTimeout(() => setSearch(localSearch), 350);
        return () => clearTimeout(t);
    }, [localSearch, setSearch]);

    /* ── Data queries ── */
    const { data, isLoading } = useExpenseCategories({
        skip: pagination.pageIndex * pagination.pageSize,
        take: pagination.pageSize,
        search,
        status: statusFilter || undefined,
    });

    const { data: totalData } = useExpenseCategories({ skip: 0, take: 1 });
    const { data: activeData } = useExpenseCategories({ skip: 0, take: 1, status: "ACTIVE" });
    const { data: inactiveData } = useExpenseCategories({ skip: 0, take: 1, status: "INACTIVE" });

    const deleteMutation = useDeleteExpenseCategory();
    const updateMutation = useUpdateExpenseCategory();

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteMutation.mutateAsync(deleteId);
        } catch {
            // Error handled in mutation hook
        } finally {
            setDeleteId(null);
        }
    };

    /* ── Table columns ── */
    const columns: ColumnDef<ExpenseCategory>[] = [
        {
            accessorKey: "name",
            header: "Category Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3.5">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-semibold text-sm relative border border-primary/10 transition-transform duration-500 group-hover:scale-110">
                            {row.original.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <span className="font-semibold text-[14px] text-gray-900 dark:text-white tracking-tight">
                        {row.original.name}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1 max-w-[240px]">
                    {row.original.description || "—"}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                const categoryId = row.original.id;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <button className="flex items-center gap-2 cursor-pointer outline-none select-none group/status hover:scale-105 active:scale-95 transition-all duration-300">
                                    <div
                                        className={cn(
                                            "w-2 h-2 rounded-full animate-pulse",
                                            getStatusDotColors(status)
                                        )}
                                    />
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
                        <DropdownMenuContent
                            align="start"
                            className="w-36 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 z-[9999]"
                        >
                            <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-1.5 mb-1 select-none">
                                Set Status
                            </div>
                            {[
                                { value: "ACTIVE", label: "Active", dotClass: "bg-emerald-500", textClass: "text-emerald-500" },
                                { value: "INACTIVE", label: "Inactive", dotClass: "bg-amber-500", textClass: "text-amber-500" },
                            ].map((s) => (
                                <DropdownMenuItem
                                    key={s.value}
                                    className={cn(
                                        "rounded-lg font-semibold text-xs my-0.5 cursor-pointer flex items-center gap-2 py-2 px-2.5 transition-colors",
                                        status === s.value
                                            ? `${s.textClass} bg-gray-50 dark:bg-white/5`
                                            : "text-gray-700 dark:text-gray-300"
                                    )}
                                    onClick={() => updateMutation.mutate({ id: categoryId, status: s.value })}
                                >
                                    <span className={cn("w-1.5 h-1.5 rounded-full", s.dotClass)} />
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
                        disabled={deleteMutation.isPending}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    /* ── Render ── */
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="grid grid-cols-1 xl:grid-cols-4 gap-5"
        >
            {/* LEFT — Category List Card (3/4 width) */}
            <div className="xl:col-span-3">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
                    {/* Card header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                Expense Category{" "}
                                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                                    Management
                                </span>
                            </h1>
                            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                                Manage all expense categories and their details
                            </p>
                        </div>

                        <PageHeaderControls
                            searchValue={localSearch}
                            onSearchChange={setLocalSearch}
                            searchPlaceholder="Search categories..."
                            onFilterClick={() => setIsFilterDrawerOpen(true)}
                            activeFiltersCount={statusFilter ? 1 : 0}
                            addLabel="Add New Category"
                            addIcon={<Tag size={15} />}
                            onAddClick={() => openFormDrawer()}
                        />
                    </div>

                    {/* Table */}
                    <div className="p-6 pt-4">
                        <DataTable
                            columns={columns}
                            data={data?.expenseCategories || []}
                            loading={isLoading}
                            pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
                            totalCount={data?.total || 0}
                            entityName="categories"
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            onGlobalFilterChange={setSearch}
                            globalFilterValue={search}
                            searchPlaceholder="Search categories..."
                            onFilterClick={() => setIsFilterDrawerOpen(true)}
                            activeFiltersCount={statusFilter ? 1 : 0}
                            hideToolbar
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT — Statistics Panel (1/4 width) */}
            <div className="xl:col-span-1 flex flex-col gap-4">
                <StatsCard
                    title="Total Categories"
                    value={totalData?.total}
                    loading={!totalData}
                    icon={<Tag size={20} className="text-primary" />}
                    iconBg="bg-primary/10 dark:bg-primary/15"
                    gradient="bg-primary"
                    trend="All registered categories"
                />
                <StatsCard
                    title="Active Categories"
                    value={activeData?.total}
                    loading={!activeData}
                    icon={<CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />}
                    iconBg="bg-emerald-50 dark:bg-emerald-500/15"
                    gradient="bg-emerald-500"
                    trend="Currently active"
                />
                <StatsCard
                    title="Inactive Categories"
                    value={inactiveData?.total}
                    loading={!inactiveData}
                    icon={<XCircle size={20} className="text-amber-600 dark:text-amber-400" />}
                    iconBg="bg-amber-50 dark:bg-amber-500/15"
                    gradient="bg-amber-500"
                    trend="Disabled categories"
                />

                {/* Quick Stats gradient card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-[20px] p-5 bg-gradient-to-br from-primary to-orange-500 border border-primary/20 shadow-sm shadow-primary/20"
                >
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bS0xMiAxMnY2aDZ2LTZoLTZ6bTAtMTJ2Nmg2di02aC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                    <p className="text-xs font-bold text-white/70 uppercase tracking-[0.12em] mb-2 relative">
                        Quick Stats
                    </p>
                    <div className="space-y-1.5 relative">
                        {[
                            {
                                label: "Active rate",
                                value: totalData?.total
                                    ? `${Math.round(((activeData?.total || 0) / totalData.total) * 100)}%`
                                    : "—",
                            },
                            {
                                label: "Inactive rate",
                                value: totalData?.total
                                    ? `${Math.round(((inactiveData?.total || 0) / totalData.total) * 100)}%`
                                    : "—",
                            },
                        ].map((s) => (
                            <div key={s.label} className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-white/70">{s.label}</span>
                                <span className="text-sm font-black text-white">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Filter Drawer */}
            <GenericFilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                fields={categoryFilterFields}
                activeValues={{ status: statusFilter || "ALL" }}
                onApply={(values) =>
                    setStatusFilter(values.status === "ALL" ? "" : values.status)
                }
                onReset={() => {
                    setStatusFilter("");
                    resetFilters();
                }}
            />

            {/* Form Drawer */}
            <ExpenseCategoryFormDrawer />

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
                            This action cannot be undone. This will permanently remove the category from the
                            system.
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
                            disabled={deleteMutation.isPending}
                            className="flex-1 rounded-xl h-12 bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20"
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Delete Category"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
