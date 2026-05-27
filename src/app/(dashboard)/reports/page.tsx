"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
    useReportsServices,
    useReportsInstallations,
    useReportsExpenses,
    downloadReportFile,
    ReportsServiceReport,
    ReportsInstallationReport,
    ReportsExpenseReport,
} from "@/services/reports-service";
import useReportsStore from "@/store/useReportsStore";
import { useServiceCategories } from "@/services/service-category-service";
import { useExpenseCategories } from "@/services/expense-category-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
    TrendingUp,
    FileText,
    Loader2,
    Search,
    Calendar,
    Wrench,
    Factory,
    Receipt,
    FileDown,
    X,
    Filter,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─── Helpers ──────────────────────────────────────────────────── */

const getStatusColors = (status: string) => {
    switch (status?.toUpperCase()) {
        case "PENDING":
            return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20 dark:border-amber-400/20";
        case "IN_PROGRESS":
            return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20 dark:border-blue-400/20";
        case "COMPLETED":
            return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-400/20";
        case "CANCELLED":
            return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20 dark:border-rose-400/20";
        default:
            return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20 dark:border-gray-400/20";
    }
};

const getStatusDotColors = (status: string) => {
    switch (status?.toUpperCase()) {
        case "PENDING":
            return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
        case "IN_PROGRESS":
            return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
        case "COMPLETED":
            return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
        case "CANCELLED":
            return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
        default:
            return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
    }
};

/* ─── Stats Card Component ─────────────────────────────────────── */

interface StatsCardProps {
    title: string;
    value: number | string | undefined;
    icon: React.ReactNode;
    iconBg: string;
    gradient: string;
    description?: string;
    loading?: boolean;
}

function StatsCard({ title, value, icon, iconBg, gradient, description, loading }: StatsCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "relative overflow-hidden rounded-[24px] p-5 border border-gray-100 dark:border-white/5",
                "bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-300"
            )}
        >
            <div className={cn("absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-10 -translate-y-6 translate-x-6", gradient)} />
            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em] mb-2.5">
                        {title}
                    </p>
                    {loading ? (
                        <div className="h-9 w-20 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
                    ) : (
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                            {value ?? 0}
                        </p>
                    )}
                    {description && (
                        <p className="text-[11px] font-medium text-gray-400 mt-2">
                            {description}
                        </p>
                    )}
                </div>
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm", iconBg)}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Main Reports Page ────────────────────────────────────────── */

export default function ReportsPage() {
    const {
        activeTab,
        setActiveTab,
        pagination,
        setPagination,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        resetFilters,
    } = useReportsStore();

    const [isExporting, setIsExporting] = React.useState<"pdf" | "csv" | "excel" | null>(null);
    const [localSearch, setLocalSearch] = React.useState(search);

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(localSearch);
        }, 350);
        return () => clearTimeout(timer);
    }, [localSearch, setSearch]);

    // Fetch lists and stats using React Query
    const servicesQuery = useReportsServices({
        skip: pagination.pageIndex * pagination.pageSize,
        take: pagination.pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    });

    const installationsQuery = useReportsInstallations({
        skip: pagination.pageIndex * pagination.pageSize,
        take: pagination.pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    });

    const expensesQuery = useReportsExpenses({
        skip: pagination.pageIndex * pagination.pageSize,
        take: pagination.pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    });

    // Fetch categories for select dropdowns
    const { data: serviceCategoriesData } = useServiceCategories({ skip: 0, take: 100 });
    const { data: expenseCategoriesData } = useExpenseCategories({ skip: 0, take: 100 });

    const handleExport = async (format: "pdf" | "csv" | "excel") => {
        setIsExporting(format);
        try {
            const params = {
                search: search || undefined,
                status: statusFilter || undefined,
                categoryId: categoryFilter || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            };
            await downloadReportFile(activeTab, format, params);
            toast.success(`${format.toUpperCase()} report downloaded successfully`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report download");
        } finally {
            setIsExporting(null);
        }
    };

    const hasActiveFilters = !!(search || statusFilter || categoryFilter || dateFrom || dateTo);

    /* ─── TABLE COLUMNS DEFINITION ────────────────────────────────── */

    // 1. Service List Columns
    const serviceColumns: ColumnDef<ReportsServiceReport>[] = [
        {
            accessorKey: "report_number",
            header: "Report No",
            cell: ({ row }) => (
                <span className="font-semibold text-gray-900 dark:text-white">{row.original.report_number}</span>
            ),
        },
        {
            accessorKey: "mill.name",
            header: "Mill Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{row.original.mill?.name || "—"}</span>
                    <span className="text-xs text-gray-400">{row.original.place || "—"}</span>
                </div>
            ),
        },
        {
            accessorKey: "visit_date",
            header: "Visit Date",
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-gray-400">
                    {row.original.visit_date ? format(new Date(row.original.visit_date), "dd-MM-yyyy") : "—"}
                </span>
            ),
        },
        {
            accessorKey: "serviceCategory.name",
            header: "Category",
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 py-0.5">
                    {row.original.serviceCategory?.name || "—"}
                </Badge>
            ),
        },
        {
            accessorKey: "nature_of_complaint",
            header: "Complaint",
            cell: ({ row }) => (
                <span className="truncate max-w-[200px] block text-gray-600 dark:text-gray-400">{row.original.nature_of_complaint || "—"}</span>
            ),
        },
        {
            id: "technicians",
            header: "Technicians",
            cell: ({ row }) => (
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {row.original.technicians?.map(t => t.technician?.full_name).join(", ") || "—"}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <div className="flex items-center gap-2 select-none">
                        <div className={cn("w-1.5 h-1.5 rounded-full", getStatusDotColors(status))} />
                        <Badge variant="outline" className={cn("rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm", getStatusColors(status))}>
                            {status}
                        </Badge>
                    </div>
                );
            },
        },
    ];

    // 2. Installation List Columns
    const installationColumns: ColumnDef<ReportsInstallationReport>[] = [
        {
            accessorKey: "report_number",
            header: "Report No",
            cell: ({ row }) => (
                <span className="font-semibold text-gray-900 dark:text-white">{row.original.report_number}</span>
            ),
        },
        {
            accessorKey: "mill.name",
            header: "Mill Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{row.original.mill?.name || "—"}</span>
                    <span className="text-xs text-gray-400">{row.original.place || "—"}</span>
                </div>
            ),
        },
        {
            accessorKey: "visit_date",
            header: "Visit Date",
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-gray-400">
                    {row.original.visit_date ? format(new Date(row.original.visit_date), "dd-MM-yyyy") : "—"}
                </span>
            ),
        },
        {
            accessorKey: "machine_model",
            header: "Machine Model",
            cell: ({ row }) => (
                <span className="text-gray-700 dark:text-gray-300 font-medium">{row.original.machine_model || "—"}</span>
            ),
        },
        {
            accessorKey: "serial_or_frame_no",
            header: "Sl/Frame No",
            cell: ({ row }) => (
                <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">{row.original.serial_or_frame_no || "—"}</span>
            ),
        },
        {
            id: "technicians",
            header: "Technicians",
            cell: ({ row }) => (
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {row.original.technicians?.map(t => t.technician?.full_name).join(", ") || "—"}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <div className="flex items-center gap-2 select-none">
                        <div className={cn("w-1.5 h-1.5 rounded-full", getStatusDotColors(status))} />
                        <Badge variant="outline" className={cn("rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm", getStatusColors(status))}>
                            {status}
                        </Badge>
                    </div>
                );
            },
        },
    ];

    // 3. Expense List Columns
    const expenseColumns: ColumnDef<ReportsExpenseReport>[] = [
        {
            accessorKey: "expense_number",
            header: "Expense No",
            cell: ({ row }) => (
                <span className="font-semibold text-gray-900 dark:text-white">{row.original.expense_number}</span>
            ),
        },
        {
            accessorKey: "mill.name",
            header: "Mill Name / Details",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {row.original.mill?.name || row.original.others || "—"}
                    </span>
                    <span className="text-xs text-gray-400">{row.original.place || "—"}</span>
                </div>
            ),
        },
        {
            accessorKey: "visit_date",
            header: "Visit Date",
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-gray-400">
                    {row.original.visit_date ? format(new Date(row.original.visit_date), "dd-MM-yyyy") : "—"}
                </span>
            ),
        },
        {
            accessorKey: "expenseCategory.name",
            header: "Category",
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 py-0.5">
                    {row.original.expenseCategory?.name || "—"}
                </Badge>
            ),
        },
        {
            accessorKey: "amount",
            header: "Amount",
            cell: ({ row }) => (
                <span className="font-bold text-gray-900 dark:text-white">
                    ₹{Number(row.original.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            id: "technicians",
            header: "Technicians",
            cell: ({ row }) => (
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {row.original.technicians?.map(t => t.technician?.full_name).join(", ") || "—"}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <div className="flex items-center gap-2 select-none">
                        <div className={cn("w-1.5 h-1.5 rounded-full", getStatusDotColors(status))} />
                        <Badge variant="outline" className={cn("rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm", getStatusColors(status))}>
                            {status}
                        </Badge>
                    </div>
                );
            },
        },
    ];

    // Determine current query loading state & response values
    const currentQuery =
        activeTab === "services"
            ? servicesQuery
            : activeTab === "installations"
            ? installationsQuery
            : expensesQuery;

    const reportsData = currentQuery.data?.reports || [];
    const reportsTotal = currentQuery.data?.total || 0;
    const reportsMetrics = currentQuery.data?.metrics;
    const isReportsLoading = currentQuery.isLoading;

    return (
        <div className="space-y-6">
            {/* Header controls & titles */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                            Reports
                        </span>
                    </h1>
                    <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                        Generate, filter, and export detailed analytical reports logs
                    </p>
                </div>

                {/* Switchable segmented tab navigation (Framer Motion sliding effect) */}
                <div className="relative flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/20 dark:border-white/5 shadow-inner">
                    {[
                        { id: "services", label: "Service List", icon: Wrench },
                        { id: "installations", label: "Installation List", icon: Factory },
                        { id: "expenses", label: "Expenses", icon: Receipt },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isTabActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "relative flex items-center gap-2 px-4 py-2 text-xs xl:text-sm font-bold rounded-xl transition-all duration-300 z-10 cursor-pointer select-none",
                                    isTabActive ? "text-primary dark:text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                                )}
                            >
                                <Icon size={14} />
                                {tab.label}

                                {isTabActive && (
                                    <motion.span
                                        layoutId="active-report-tab-pill"
                                        className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-white/5"
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                        style={{ zIndex: -1 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Metrics cards row based on current active tab */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeTab === "expenses" ? (
                    <>
                        <StatsCard
                            title="Total Transactions"
                            value={reportsMetrics?.totalCount}
                            loading={isReportsLoading}
                            icon={<Receipt size={18} className="text-primary" />}
                            iconBg="bg-primary/10"
                            gradient="bg-primary"
                            description="Filtered transactions records"
                        />
                        <StatsCard
                            title="Total Outflow"
                            value={
                                reportsMetrics
                                    ? `₹${Number((reportsMetrics as any).totalAmount || 0).toLocaleString("en-IN", {
                                          maximumFractionDigits: 0,
                                      })}`
                                    : "₹0"
                            }
                            loading={isReportsLoading}
                            icon={<DollarSign size={18} className="text-emerald-500" />}
                            iconBg="bg-emerald-500/10"
                            gradient="bg-emerald-500"
                            description="Total amount on current filters"
                        />
                        <StatsCard
                            title="Approved/Completed"
                            value={reportsMetrics?.completedCount}
                            loading={isReportsLoading}
                            icon={<CheckCircle2 size={18} className="text-emerald-500" />}
                            iconBg="bg-emerald-500/10"
                            gradient="bg-emerald-500"
                            description="Processed expenses"
                        />
                        <StatsCard
                            title="Pending Review"
                            value={
                                reportsMetrics
                                    ? (reportsMetrics.pendingCount || 0) + (reportsMetrics.inProgressCount || 0)
                                    : 0
                            }
                            loading={isReportsLoading}
                            icon={<Clock size={18} className="text-amber-500" />}
                            iconBg="bg-amber-500/10"
                            gradient="bg-amber-500"
                            description="Awaiting processing"
                        />
                    </>
                ) : (
                    <>
                        <StatsCard
                            title="Total Reports"
                            value={reportsMetrics?.totalCount}
                            loading={isReportsLoading}
                            icon={<FileText size={18} className="text-primary" />}
                            iconBg="bg-primary/10"
                            gradient="bg-primary"
                            description={`Total ${activeTab} log entries`}
                        />
                        <StatsCard
                            title="Completed"
                            value={reportsMetrics?.completedCount}
                            loading={isReportsLoading}
                            icon={<CheckCircle2 size={18} className="text-emerald-500" />}
                            iconBg="bg-emerald-500/10"
                            gradient="bg-emerald-500"
                            description="Successfully executed logs"
                        />
                        <StatsCard
                            title="In Progress"
                            value={reportsMetrics?.inProgressCount}
                            loading={isReportsLoading}
                            icon={<Clock size={18} className="text-blue-500" />}
                            iconBg="bg-blue-500/10"
                            gradient="bg-blue-500"
                            description="Under dynamic processing"
                        />
                        <StatsCard
                            title="Pending"
                            value={reportsMetrics?.pendingCount}
                            loading={isReportsLoading}
                            icon={<AlertTriangle size={18} className="text-amber-500" />}
                            iconBg="bg-amber-500/10"
                            gradient="bg-amber-500"
                            description="Awaiting initialization"
                        />
                    </>
                )}
            </div>

            {/* Filter and Exports panel */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                        {/* Search Input */}
                        <div className="relative w-full max-w-xs group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="pl-10 pr-4 h-11 w-full bg-gray-50/50 dark:bg-white/5 border border-transparent rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all outline-none shadow-inner"
                            />
                        </div>

                        {/* Visit From Date */}
                        <div className="w-full max-w-[170px]">
                            <DatePicker
                                value={dateFrom}
                                onChange={setDateFrom}
                                placeholder="From Date"
                            />
                        </div>

                        {/* Visit To Date */}
                        <div className="w-full max-w-[170px]">
                            <DatePicker
                                value={dateTo}
                                onChange={setDateTo}
                                placeholder="To Date"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-11 px-4 rounded-xl border border-transparent bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/8 text-gray-800 dark:text-gray-200 font-semibold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all cursor-pointer appearance-none pr-8 min-w-[140px]"
                            >
                                <option value="" className="dark:bg-gray-900 text-gray-400 font-semibold">All Statuses</option>
                                <option value="PENDING" className="dark:bg-gray-900">Pending</option>
                                <option value="IN_PROGRESS" className="dark:bg-gray-900">In Progress</option>
                                <option value="COMPLETED" className="dark:bg-gray-900">Completed</option>
                                <option value="CANCELLED" className="dark:bg-gray-900">Cancelled</option>
                            </select>
                            <ChevronDownIconForSelect />
                        </div>

                        {/* Conditional Category Filter (Only for services or expenses) */}
                        {activeTab === "services" && (
                            <div className="relative">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="h-11 px-4 rounded-xl border border-transparent bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/8 text-gray-800 dark:text-gray-200 font-semibold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all cursor-pointer appearance-none pr-8 min-w-[160px]"
                                >
                                    <option value="" className="dark:bg-gray-900 text-gray-400 font-semibold">All Service Categories</option>
                                    {serviceCategoriesData?.serviceCategories?.map((cat) => (
                                        <option key={cat.id} value={cat.id} className="dark:bg-gray-900">
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDownIconForSelect />
                            </div>
                        )}

                        {activeTab === "expenses" && (
                            <div className="relative">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="h-11 px-4 rounded-xl border border-transparent bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/8 text-gray-800 dark:text-gray-200 font-semibold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all cursor-pointer appearance-none pr-8 min-w-[160px]"
                                >
                                    <option value="" className="dark:bg-gray-900 text-gray-400 font-semibold">All Expense Categories</option>
                                    {expenseCategoriesData?.expenseCategories?.map((cat) => (
                                        <option key={cat.id} value={cat.id} className="dark:bg-gray-900">
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDownIconForSelect />
                            </div>
                        )}

                        {/* Reset Filters Trigger */}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    resetFilters();
                                    setLocalSearch("");
                                }}
                                className="h-11 px-3 rounded-xl gap-2 font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 transition-colors cursor-pointer"
                            >
                                <X size={15} />
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* Report Export Button Group */}
                    <div className="flex items-center gap-2 border border-gray-200/50 dark:border-white/5 p-1 rounded-xl bg-gray-50/30 dark:bg-white/5 shadow-sm">
                        {[
                            { format: "pdf", label: "PDF" },
                            { format: "excel", label: "Excel" },
                            { format: "csv", label: "CSV" },
                        ].map((exp) => {
                            const isThisExporting = isExporting === exp.format;
                            return (
                                <button
                                    key={exp.format}
                                    disabled={!!isExporting || isReportsLoading}
                                    onClick={() => handleExport(exp.format as any)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all duration-300 cursor-pointer shadow-xs select-none disabled:opacity-50 disabled:cursor-not-allowed",
                                        exp.format === "pdf"
                                            ? "border-rose-100 dark:border-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/5"
                                            : exp.format === "excel"
                                            ? "border-emerald-100 dark:border-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5"
                                            : "border-blue-100 dark:border-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5"
                                    )}
                                >
                                    {isThisExporting ? (
                                        <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                        <FileDown size={13} />
                                    )}
                                    {exp.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Paginated Reports Data Table */}
                <div className="pt-2">
                    <DataTable
                        columns={
                            activeTab === "services"
                                ? (serviceColumns as any)
                                : activeTab === "installations"
                                ? (installationColumns as any)
                                : (expenseColumns as any)
                        }
                        data={reportsData as any}
                        loading={isReportsLoading}
                        pageCount={Math.ceil(reportsTotal / pagination.pageSize)}
                        totalCount={reportsTotal}
                        entityName={
                            activeTab === "services"
                                ? "service reports"
                                : activeTab === "installations"
                                ? "installations"
                                : "expenses"
                        }
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        hideToolbar
                    />
                </div>
            </div>
        </div>
    );
}

/* Custom indicator chevron for drop-down */
function ChevronDownIconForSelect() {
    return (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400">
            <svg
                className="w-4 h-4 fill-none stroke-current stroke-2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    );
}
