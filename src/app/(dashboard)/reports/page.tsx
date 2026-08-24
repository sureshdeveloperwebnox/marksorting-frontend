"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
    useReportsServices,
    useReportsInstallations,
    useReportsExpenses,
    useReportsMasterMills,
    useReportsStores,
    useReportsMills,
    useReportsFilterOptions,
    downloadReportFile,
    ReportsServiceReport,
    ReportsInstallationReport,
    ReportsExpenseReport,
    ReportsMasterMill,
    ReportsStore,
    ReportsMill,
} from "@/services/reports-service";
import useReportsStore from "@/store/useReportsStore";
import { useServiceCategories } from "@/services/service-category-service";
import { useExpenseCategories } from "@/services/expense-category-service";
import { useMills } from "@/services/mill-service";
import { useTechnicians } from "@/services/technician-service";
import { useCustomers } from "@/services/customer-service";
import { useMaterials } from "@/services/store-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { ExportReportDrawer } from "@/components/forms/export-report-drawer";
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
    RefreshCw,
    Building,
    Building2,
    ShieldAlert,
    ShieldCheck,
    Package,
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
        case "NON_SUCCEED":
        case "NON-SUCCEED":
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
        case "NON_SUCCEED":
        case "NON-SUCCEED":
        case "CANCELLED":
            return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
        default:
            return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
    }
};

const getStatusLabel = (status: string, tab: string) => {
    if (tab === "expenses") {
        switch (status?.toUpperCase()) {
            case "PENDING": return "PENDING";
            case "IN_PROGRESS": return "IN PROGRESS";
            case "COMPLETED": return "APPROVED";
            case "CANCELLED": return "REJECTED";
            default: return status || "";
        }
    }
    switch (status?.toUpperCase()) {
        case "PENDING": return "Pending";
        case "COMPLETED": return "Completed";
        case "NON_SUCCEED":
        case "NON-SUCCEED":
        case "CANCELLED": return "Non-succeed";
        default: return status?.replace("_", " ") || "";
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
        millFilter,
        setMillFilter,
        technicianFilter,
        setTechnicianFilter,
        millNameFilter,
        setMillNameFilter,
        frameNoFilter,
        setFrameNoFilter,
        refNoFilter,
        createdDateFrom,
        setCreatedDateFrom,
        createdDateTo,
        setCreatedDateTo,
        expenseDateFrom,
        setExpenseDateFrom,
        expenseDateTo,
        setExpenseDateTo,
        setRefNoFilter,
        storeWarrantyFilter,
        storeReturnFilter,
        storeInflowFilter,
        storeCustomerFilter,
        storeMaterialFilter,
        setStoreWarrantyFilter,
        setStoreReturnFilter,
        setStoreInflowFilter,
        setStoreCustomerFilter,
        setStoreMaterialFilter,
        resetFilters,
    } = useReportsStore();

    const [isExportDrawerOpen, setIsExportDrawerOpen] = React.useState(false);
    const [localSearch, setLocalSearch] = React.useState(search);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);

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
        createdDateFrom: createdDateFrom || undefined,
        createdDateTo: createdDateTo || undefined,
        millId: millFilter || undefined,
        technicianId: technicianFilter || undefined,
        millName: millNameFilter || undefined,
        frameNo: frameNoFilter || undefined,
        refNo: refNoFilter || undefined,
    });

    const installationsQuery = useReportsInstallations({
        skip: pagination.pageIndex * pagination.pageSize,
        take: pagination.pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        createdDateFrom: createdDateFrom || undefined,
        createdDateTo: createdDateTo || undefined,
        millId: millFilter || undefined,
        technicianId: technicianFilter || undefined,
        millName: millNameFilter || undefined,
        frameNo: frameNoFilter || undefined,
        refNo: refNoFilter || undefined,
    });

    const expensesQuery = useReportsExpenses({
        skip: pagination.pageIndex * pagination.pageSize,
        take: pagination.pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        createdDateFrom: createdDateFrom || undefined,
        createdDateTo: createdDateTo || undefined,
        expenseDateFrom: expenseDateFrom || undefined,
        expenseDateTo: expenseDateTo || undefined,
        millId: millFilter || undefined,
        technicianId: technicianFilter || undefined,
        millName: millNameFilter || undefined,
        frameNo: frameNoFilter || undefined,
        refNo: refNoFilter || undefined,
    });

    const masterMillsQuery = useReportsMasterMills({
        skip: pagination.pageIndex * pagination.pageSize,
        take: pagination.pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        createdDateFrom: createdDateFrom || undefined,
        createdDateTo: createdDateTo || undefined,
        millId: millFilter || undefined,
        millName: millNameFilter || undefined,
        frameNo: frameNoFilter || undefined,
        refNo: refNoFilter || undefined,
    });

    const storesQuery = useReportsStores({
        skip: pagination.pageIndex * pagination.pageSize,
        take: pagination.pageSize,
        search: search || undefined,
        serviceEngineerId: technicianFilter || undefined,
        customerId: storeCustomerFilter || undefined,
        materialId: storeMaterialFilter || undefined,
        warrantyStatus: storeWarrantyFilter || undefined,
        returnStatus: storeReturnFilter || undefined,
        inflowStatus: storeInflowFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        createdDateFrom: createdDateFrom || undefined,
        createdDateTo: createdDateTo || undefined,
    });

    const millsReportQuery = useReportsMills({
        skip: pagination.pageIndex * pagination.pageSize,
        take: pagination.pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        customerId: storeCustomerFilter || undefined,
        refNo: refNoFilter || undefined,
        place: millNameFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        createdDateFrom: createdDateFrom || undefined,
        createdDateTo: createdDateTo || undefined,
    });

    // Fetch categories + lookup data for filter drawer
    const { data: serviceCategoriesData } = useServiceCategories({ skip: 0, take: 100 });
    const { data: expenseCategoriesData } = useExpenseCategories({ skip: 0, take: 100 });
    const { data: millsData } = useMills({ skip: 0, take: 500 });
    const { data: techniciansData } = useTechnicians({ skip: 0, take: 500 });
    const { data: customersData } = useCustomers({ skip: 0, take: 500, status: "ACTIVE" });
    const { data: materialsData } = useMaterials({ skip: 0, take: 500, status: "ACTIVE" });

    // Fetch distinct Ref No + Frame No values for dropdown filters (not needed for stores tab)
    const filterOptionsType = activeTab !== "stores" ? activeTab : undefined;
    const { data: filterOptionsData } = useReportsFilterOptions(filterOptionsType);

    const hasActiveFilters = !!(
        search ||
        statusFilter ||
        categoryFilter ||
        dateFrom ||
        dateTo ||
        createdDateFrom ||
        createdDateTo ||
        expenseDateFrom ||
        expenseDateTo ||
        millFilter ||
        technicianFilter ||
        millNameFilter ||
        frameNoFilter ||
        refNoFilter ||
        storeWarrantyFilter ||
        storeReturnFilter ||
        storeInflowFilter ||
        storeCustomerFilter ||
        storeMaterialFilter
    );
    const activeFilterCount = [
        statusFilter,
        categoryFilter,
        millFilter,
        technicianFilter,
        dateFrom,
        dateTo,
        createdDateFrom,
        createdDateTo,
        expenseDateFrom,
        expenseDateTo,
        millNameFilter,
        frameNoFilter,
        refNoFilter,
        storeWarrantyFilter,
        storeReturnFilter,
        storeInflowFilter,
        storeCustomerFilter,
        storeMaterialFilter,
    ].filter(Boolean).length;

    // Build tab-aware filter fields for the drawer
    const filterFields: FilterField[] = React.useMemo(() => {
        const statusField: FilterField = {
            id: "status",
            label: "Status",
            placeholder: "All Statuses",
            options: activeTab === "master-mills"
                ? [
                    { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
                    { value: "ACTIVE", label: "Active", iconColor: "bg-emerald-500" },
                    { value: "INACTIVE", label: "Inactive", iconColor: "bg-gray-400" },
                  ]
                : activeTab === "expenses"
                ? [
                    { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
                    { value: "PENDING", label: "Pending", iconColor: "bg-amber-500", animatePulse: true },
                    { value: "IN_PROGRESS", label: "In Progress", iconColor: "bg-blue-500", animatePulse: true },
                    { value: "COMPLETED", label: "Approved", iconColor: "bg-emerald-500" },
                    { value: "CANCELLED", label: "Rejected", iconColor: "bg-rose-500" },
                  ]
                : [
                    { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
                    { value: "PENDING", label: "Pending", iconColor: "bg-amber-500", animatePulse: true },
                    { value: "COMPLETED", label: "Completed", iconColor: "bg-emerald-500" },
                    { value: "NON_SUCCEED", label: "Non-succeed", iconColor: "bg-rose-500" },
                  ],
        };

        const millField: FilterField = {
            id: "millId",
            label: "Select Mill",
            placeholder: "All Mills",
            options: [
                { value: "ALL", label: "All Mills" },
                ...(millsData?.mills ?? []).map((m) => ({ value: m.id, label: m.name })),
            ],
        };

        const millNameField: FilterField = {
            id: "millName",
            label: "Mill Name",
            type: "text",
            placeholder: "Enter Mill Name...",
        };

        const frameNos = filterOptionsData?.frameNos ?? [];
        const refNos = filterOptionsData?.refNos ?? [];

        const frameNoField: FilterField = {
            id: "frameNo",
            label: "Machine Frame No",
            placeholder: frameNos.length > 0 ? "Select Frame No..." : "Loading...",
            options: [
                { value: "ALL", label: "All Frame Nos" },
                ...frameNos.map((f) => ({ value: f, label: f })),
            ],
        };

        const refNoField: FilterField = {
            id: "refNo",
            label: "Ref No",
            placeholder: refNos.length > 0 ? "Select Ref No..." : "Loading...",
            options: [
                { value: "ALL", label: "All Ref Nos" },
                ...refNos.map((r) => ({ value: r, label: r })),
            ],
        };

        const techField: FilterField = {
            id: "technicianId",
            label: "Technician",
            placeholder: "All Technicians",
            options: [
                { value: "ALL", label: "All Technicians" },
                ...(techniciansData?.technicians ?? []).map((t) => ({ value: t.id, label: t.full_name })),
            ],
        };

        const serviceCategoryField: FilterField = {
            id: "categoryId",
            label: "Service Category",
            placeholder: "All Service Categories",
            options: [
                { value: "ALL", label: "All Service Categories" },
                ...(serviceCategoriesData?.serviceCategories ?? []).map((c) => ({ value: c.id, label: c.name })),
            ],
        };

        const expenseCategoryField: FilterField = {
            id: "categoryId",
            label: "Expense Category",
            placeholder: "All Expense Categories",
            options: [
                { value: "ALL", label: "All Expense Categories" },
                ...(expenseCategoriesData?.expenseCategories ?? []).map((c) => ({ value: c.id, label: c.name })),
            ],
        };

        const dateFromField: FilterField = {
            id: "dateFrom",
            label: "From Date",
            type: "date",
            placeholder: "From Date",
        };

        const dateToField: FilterField = {
            id: "dateTo",
            label: "To Date",
            type: "date",
            placeholder: "To Date",
        };

        const createdDateFromField: FilterField = {
            id: "createdDateFrom",
            label: "Created Date From",
            type: "date",
            placeholder: "Created Date From",
        };

        const createdDateToField: FilterField = {
            id: "createdDateTo",
            label: "Created Date To",
            type: "date",
            placeholder: "Created Date To",
        };

        const expenseDateFromField: FilterField = {
            id: "expenseDateFrom",
            label: "Expense Date From",
            type: "date",
            placeholder: "Expense Date From",
        };

        const expenseDateToField: FilterField = {
            id: "expenseDateTo",
            label: "Expense Date To",
            type: "date",
            placeholder: "Expense Date To",
        };

        if (activeTab === "services") return [statusField, serviceCategoryField, millField, millNameField, refNoField, frameNoField, techField, createdDateFromField, createdDateToField];
        if (activeTab === "installations") return [statusField, millField, millNameField, refNoField, frameNoField, techField, createdDateFromField, createdDateToField];
        if (activeTab === "master-mills") return [statusField, millField, millNameField, refNoField, frameNoField, createdDateFromField, createdDateToField];
        if (activeTab === "mills") {
            const customerField: FilterField = {
                id: "storeCustomer",
                label: "Customer",
                placeholder: "All Customers",
                options: [
                    { value: "ALL", label: "All Customers" },
                    ...(customersData?.customers ?? []).map((c) => ({ value: c.id, label: c.name })),
                ],
            };
            return [statusField, customerField, refNoField, createdDateFromField, createdDateToField];
        }
        if (activeTab === "stores") {
            const engineerField: FilterField = {
                id: "technicianId",
                label: "Service Engineer",
                placeholder: "All Service Engineers",
                options: [
                    { value: "ALL", label: "All Service Engineers" },
                    ...(techniciansData?.technicians ?? []).map((t) => ({ value: t.id, label: t.full_name })),
                ],
            };

            const customerField: FilterField = {
                id: "storeCustomer",
                label: "Customer",
                placeholder: "All Customers",
                options: [
                    { value: "ALL", label: "All Customers" },
                    ...(customersData?.customers ?? []).map((c) => ({ value: c.id, label: c.name })),
                ],
            };

            const materialField: FilterField = {
                id: "storeMaterial",
                label: "Material",
                placeholder: "All Materials",
                options: [
                    { value: "ALL", label: "All Materials" },
                    ...(materialsData?.materials ?? []).map((m) => ({ value: m.id, label: m.name })),
                ],
            };

            const warrantyStatusField: FilterField = {
                id: "storeWarranty",
                label: "Warranty Status",
                placeholder: "All Warranty Statuses",
                options: [
                    { value: "ALL", label: "All Warranty Statuses" },
                    { value: "Under Warranty", label: "Under Warranty" },
                    { value: "Out of Warranty", label: "Out of Warranty" },
                ],
            };

            const returnStatusField: FilterField = {
                id: "storeReturn",
                label: "Return Status",
                placeholder: "All Return Statuses",
                options: [
                    { value: "ALL", label: "All Return Statuses" },
                    { value: "Pending", label: "Pending" },
                    { value: "In Progress", label: "In Progress" },
                    { value: "Returned", label: "Returned" },
                    { value: "Not Returned", label: "Not Returned" },
                ],
            };

            const inflowStatusField: FilterField = {
                id: "storeInflow",
                label: "Stock Status",
                placeholder: "All Stock Statuses",
                options: [
                    { value: "ALL", label: "All Stock Statuses" },
                    { value: "In Flow", label: "In Flow" },
                    { value: "Out Flow", label: "Out Flow" },
                ],
            };

            return [engineerField, customerField, materialField, warrantyStatusField, returnStatusField, inflowStatusField, createdDateFromField, createdDateToField];
        }
        return [statusField, expenseCategoryField, millField, refNoField, frameNoField, techField, expenseDateFromField, expenseDateToField, createdDateFromField, createdDateToField];
    }, [activeTab, millsData, techniciansData, serviceCategoriesData, expenseCategoriesData, customersData, materialsData, filterOptionsData]);

    const filterActiveValues: Record<string, string> = {
        status: statusFilter || "ALL",
        categoryId: categoryFilter || "ALL",
        millId: millFilter || "ALL",
        technicianId: technicianFilter || "ALL",
        dateFrom: dateFrom || "",
        dateTo: dateTo || "",
        createdDateFrom: createdDateFrom || "",
        createdDateTo: createdDateTo || "",
        expenseDateFrom: expenseDateFrom || "",
        expenseDateTo: expenseDateTo || "",
        millName: millNameFilter || "",
        frameNo: frameNoFilter || "ALL",
        refNo: refNoFilter || "ALL",
        storeWarranty: storeWarrantyFilter || "ALL",
        storeReturn: storeReturnFilter || "ALL",
        storeInflow: storeInflowFilter || "ALL",
        storeCustomer: storeCustomerFilter || "ALL",
        storeMaterial: storeMaterialFilter || "ALL",
    };

    const handleFilterApply = (values: Record<string, string>) => {
        setStatusFilter(values.status === "ALL" ? "" : values.status);
        setCategoryFilter(values.categoryId === "ALL" ? "" : (values.categoryId ?? ""));
        setMillFilter(values.millId === "ALL" ? "" : (values.millId ?? ""));
        setTechnicianFilter(values.technicianId === "ALL" ? "" : (values.technicianId ?? ""));
        setDateFrom(values.dateFrom ?? "");
        setDateTo(values.dateTo ?? "");
        setCreatedDateFrom(values.createdDateFrom ?? "");
        setCreatedDateTo(values.createdDateTo ?? "");
        setExpenseDateFrom(values.expenseDateFrom ?? "");
        setExpenseDateTo(values.expenseDateTo ?? "");
        setMillNameFilter(values.millName ?? "");
        setFrameNoFilter(values.frameNo === "ALL" ? "" : (values.frameNo ?? ""));
        setRefNoFilter(values.refNo === "ALL" ? "" : (values.refNo ?? ""));
        setStoreWarrantyFilter(values.storeWarranty === "ALL" ? "" : (values.storeWarranty ?? ""));
        setStoreReturnFilter(values.storeReturn === "ALL" ? "" : (values.storeReturn ?? ""));
        setStoreInflowFilter(values.storeInflow === "ALL" ? "" : (values.storeInflow ?? ""));
        setStoreCustomerFilter(values.storeCustomer === "ALL" ? "" : (values.storeCustomer ?? ""));
        setStoreMaterialFilter(values.storeMaterial === "ALL" ? "" : (values.storeMaterial ?? ""));
    };

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
            accessorKey: "created_at",
            header: "Created Date",
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-gray-400">
                    {row.original.created_at ? format(new Date(row.original.created_at), "dd-MM-yyyy") : "—"}
                </span>
            ),
        },
        {
            accessorKey: "visit_date",
            header: "Visit Date",
            cell: ({ row }) => (
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
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
                            {getStatusLabel(status, "services")}
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
            accessorKey: "created_at",
            header: "Created Date",
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-gray-400">
                    {row.original.created_at ? format(new Date(row.original.created_at), "dd-MM-yyyy") : "—"}
                </span>
            ),
        },
        {
            accessorKey: "visit_date",
            header: "Visit Date",
            cell: ({ row }) => (
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
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
                            {getStatusLabel(status, "installations")}
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
            cell: ({ row }) => {
                const amt = Number(row.original.amount || 0);
                const adminAmt = Number(row.original.admin_amount || 0);
                const hasAdminAmt = adminAmt > 0;
                return (
                    <div className="flex flex-col gap-0.5">
                        {hasAdminAmt ? (
                            <>
                                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                                    ₹{adminAmt.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold line-through">
                                    Claimed: ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                                </span>
                            </>
                        ) : (
                            <span className="font-bold text-sm text-gray-900 dark:text-white">
                                ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                            </span>
                        )}
                    </div>
                );
            },
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
                            {getStatusLabel(status, "expenses")}
                        </Badge>
                    </div>
                );
            },
        },
    ];

    // 4. Master Mill Columns
    const masterMillColumns: ColumnDef<ReportsMasterMill>[] = [
        {
            accessorKey: "ref_no",
            header: "Ref / Frame No",
            cell: ({ row }) => (
                <div className="flex flex-col font-mono text-xs">
                    <span className="font-semibold text-gray-900 dark:text-white">{row.original.ref_no || "—"}</span>
                    <span className="text-gray-400">{row.original.frame_no || "—"}</span>
                </div>
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
            accessorKey: "place",
            header: "Place / State",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{row.original.place || "—"}</span>
                    <span className="text-xs text-gray-400">{row.original.state || "—"}</span>
                </div>
            ),
        },
        {
            accessorKey: "mc_model",
            header: "Machine Model",
            cell: ({ row }) => (
                <span className="text-gray-700 dark:text-gray-300 font-medium">{row.original.mc_model || "—"}</span>
            ),
        },
        {
            accessorKey: "all_warranty",
            header: "Warranty / AMC",
            cell: ({ row }) => {
                const now = new Date();
                const isUnderWarranty = row.original.warranty_closing_date && new Date(row.original.warranty_closing_date) >= now && row.original.all_warranty !== "Non Warranty";
                const isUnderAmc = row.original.amc_closing_date && new Date(row.original.amc_closing_date) >= now && row.original.amc_starting_date !== null;

                if (isUnderWarranty) {
                    return (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                            <ShieldCheck size={14} />
                            Warranty ({row.original.all_warranty})
                        </div>
                    );
                }
                if (isUnderAmc) {
                    return (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-xs">
                            <CheckCircle2 size={14} />
                            AMC ({row.original.amc_period}m)
                        </div>
                    );
                }
                return (
                    <div className="flex items-center gap-1.5 text-gray-500 font-medium text-xs">
                        <ShieldAlert size={14} />
                        Non Warranty
                    </div>
                );
            },
        },
    ];

    // 5. Stores Log Columns
    const storeColumns: ColumnDef<ReportsStore>[] = [
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
            accessorKey: "mill.name",
            header: "Mill Name",
            cell: ({ row }) => (
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {row.original.mill?.name || "—"}
                </span>
            ),
        },
        {
            accessorKey: "customer.name",
            header: "Customer",
            cell: ({ row }) => (
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {row.original.customer?.name || row.original.mill?.name || "—"}
                </span>
            ),
        },
        {
            accessorKey: "frame_number",
            header: "Frame No",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400 font-semibold">
                    {row.original.frame_number || "—"}
                </span>
            ),
        },
        {
            accessorKey: "service_engineer.full_name",
            header: "Service Engineer",
            cell: ({ row }) => (
                <span className="font-semibold text-gray-900 dark:text-white">
                    {row.original.service_engineer?.full_name || "—"}
                </span>
            ),
        },
        {
            accessorKey: "materials",
            header: "Materials",
            cell: ({ row }) => {
                const materials = row.original.materials || [];
                return (
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {materials.map(m => `${m.material.name} (x${m.quantity || 1})`).join(", ") || "—"}
                    </span>
                );
            },
        },
        {
            accessorKey: "quantity",
            header: "Qty",
            cell: ({ row }) => (
                <span className="text-gray-700 dark:text-gray-300 font-bold">{row.original.quantity || 0}</span>
            ),
        },
        {
            accessorKey: "warranty_status",
            header: "Warranty Status",
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 py-0.5">
                    {row.original.warranty_status || "—"}
                </Badge>
            ),
        },
        {
            accessorKey: "return_status",
            header: "Return Status",
            cell: ({ row }) => {
                const status = row.original.return_status;
                const colors = status === "Returned"
                    ? "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-400/20"
                    : status === "Pending"
                    ? "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20 dark:border-amber-400/20"
                    : "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20 dark:border-rose-400/20";
                return (
                    <Badge variant="outline" className={cn("rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm", colors)}>
                        {status || "—"}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "barcode",
            header: "Barcode",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{row.original.barcode || "—"}</span>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-gray-400">
                    {row.original.created_at ? format(new Date(row.original.created_at), "dd-MM-yyyy") : "—"}
                </span>
            ),
        },
    ];

    // 6. Mills Report Columns
    const millColumns: ColumnDef<ReportsMill>[] = [
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
            accessorKey: "name",
            header: "Mill Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{row.original.name}</span>
                    {row.original.email && (
                        <span className="text-xs text-gray-400">{row.original.email}</span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "customer.name",
            header: "Customer",
            cell: ({ row }) => (
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {row.original.customer?.name || row.original.name || "—"}
                </span>
            ),
        },
        {
            accessorKey: "place",
            header: "Place / City",
            cell: ({ row }) => {
                const place = row.original.place || row.original.city;
                const city = row.original.city && row.original.city !== place ? row.original.city : null;
                return (
                    <div className="flex flex-col">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{place || "—"}</span>
                        {city && <span className="text-xs text-gray-400">{city}</span>}
                    </div>
                );
            },
        },
        {
            accessorKey: "phone",
            header: "Contact",
            cell: ({ row }) => (
                <div className="flex flex-col text-xs font-mono">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">{row.original.phone || "—"}</span>
                    {row.original.phone_2 && <span className="text-gray-400">{row.original.phone_2}</span>}
                </div>
            ),
        },
        {
            accessorKey: "_count.masterMills",
            header: "Machines",
            cell: ({ row }) => {
                const count = row.original._count?.masterMills ?? 0;
                return (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-2 py-0.5">
                        {count} {count === 1 ? "Machine" : "Machines"}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                const colors = status === "ACTIVE"
                    ? "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-400/20"
                    : "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20 dark:border-gray-400/20";
                const dot = status === "ACTIVE"
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
                return (
                    <div className="flex items-center gap-2 select-none">
                        <div className={cn("w-1.5 h-1.5 rounded-full", dot)} />
                        <Badge variant="outline" className={cn("rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm", colors)}>
                            {status}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: "Created Date",
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {row.original.created_at ? format(new Date(row.original.created_at), "dd-MM-yyyy") : "—"}
                </span>
            ),
        },
    ];

    // Determine current query loading state & response values
    const currentQuery =
        activeTab === "services"
            ? servicesQuery
            : activeTab === "installations"
            ? installationsQuery
            : activeTab === "expenses"
            ? expensesQuery
            : activeTab === "master-mills"
            ? masterMillsQuery
            : activeTab === "stores"
            ? storesQuery
            : millsReportQuery;

    const reportsData =
        activeTab === "stores"
            ? (currentQuery.data as any)?.stores || []
            : activeTab === "mills"
            ? (currentQuery.data as any)?.mills || []
            : (currentQuery.data as any)?.reports || [];
    const reportsTotal = currentQuery.data?.total || 0;
    const reportsMetrics = (currentQuery.data as any)?.metrics;
    const isReportsLoading = currentQuery.isLoading;
    const isRefreshing = currentQuery.isFetching;

    const currentColumns =
        activeTab === "services"
            ? serviceColumns
            : activeTab === "installations"
            ? installationColumns
            : activeTab === "expenses"
            ? expenseColumns
            : activeTab === "master-mills"
            ? masterMillColumns
            : activeTab === "stores"
            ? storeColumns
            : millColumns;

    const handleRefresh = async () => {
        await currentQuery.refetch();
    };

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
                        { id: "master-mills", label: "Masters", icon: Building },
                        { id: "stores", label: "Stores", icon: Package },
                        { id: "mills", label: "Mills", icon: Building2 },
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
                            value={(reportsMetrics as any)?.totalCount}
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
                                          minimumFractionDigits: 0,
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
                            value={(reportsMetrics as any)?.completedCount}
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
                                    ? ((reportsMetrics as any).pendingCount || 0) + ((reportsMetrics as any).inProgressCount || 0)
                                    : 0
                            }
                            loading={isReportsLoading}
                            icon={<Clock size={18} className="text-amber-500" />}
                            iconBg="bg-amber-500/10"
                            gradient="bg-amber-500"
                            description="Awaiting processing"
                        />
                    </>
                ) : activeTab === "master-mills" ? (
                    <>
                        <StatsCard
                            title="Total Machines"
                            value={(reportsMetrics as any)?.totalCount}
                            loading={isReportsLoading}
                            icon={<Building size={18} className="text-primary" />}
                            iconBg="bg-primary/10"
                            gradient="bg-primary"
                            description="Total machine register entries"
                        />
                        <StatsCard
                            title="Under Warranty"
                            value={(reportsMetrics as any)?.underWarrantyCount}
                            loading={isReportsLoading}
                            icon={<ShieldCheck size={18} className="text-emerald-500" />}
                            iconBg="bg-emerald-500/10"
                            gradient="bg-emerald-500"
                            description="Active warranty machines"
                        />
                        <StatsCard
                            title="Under AMC"
                            value={(reportsMetrics as any)?.underAmcCount}
                            loading={isReportsLoading}
                            icon={<CheckCircle2 size={18} className="text-blue-500" />}
                            iconBg="bg-blue-500/10"
                            gradient="bg-blue-500"
                            description="Active AMC contracts"
                        />
                        <StatsCard
                            title="Non Warranty"
                            value={(reportsMetrics as any)?.nonWarrantyCount}
                            loading={isReportsLoading}
                            icon={<ShieldAlert size={18} className="text-amber-500" />}
                            iconBg="bg-amber-500/10"
                            gradient="bg-amber-500"
                            description="Out of warranty/AMC"
                        />
                    </>
                ) : activeTab === "stores" ? (
                    <>
                        <StatsCard
                            title="Total Records"
                            value={(reportsMetrics as any)?.totalCount}
                            loading={isReportsLoading}
                            icon={<FileText size={18} className="text-primary" />}
                            iconBg="bg-primary/10"
                            gradient="bg-primary"
                            description="Total store inventory logs"
                        />
                        <StatsCard
                            title="Returned"
                            value={(reportsMetrics as any)?.returnedCount}
                            loading={isReportsLoading}
                            icon={<CheckCircle2 size={18} className="text-emerald-500" />}
                            iconBg="bg-emerald-500/10"
                            gradient="bg-emerald-500"
                            description="Materials returned"
                        />
                        <StatsCard
                            title="Pending"
                            value={(reportsMetrics as any)?.pendingCount}
                            loading={isReportsLoading}
                            icon={<Clock size={18} className="text-amber-500" />}
                            iconBg="bg-amber-500/10"
                            gradient="bg-amber-500"
                            description="Pending return status"
                        />
                        <StatsCard
                            title="Completed"
                            value={(reportsMetrics as any)?.completedCount}
                            loading={isReportsLoading}
                            icon={<ShieldCheck size={18} className="text-blue-500" />}
                            iconBg="bg-blue-500/10"
                            gradient="bg-blue-500"
                            description="Completed return processing"
                        />
                    </>
                ) : activeTab === "mills" ? (
                    <>
                        <StatsCard
                            title="Total Mills"
                            value={(reportsMetrics as any)?.totalCount}
                            loading={isReportsLoading}
                            icon={<Building2 size={18} className="text-primary" />}
                            iconBg="bg-primary/10"
                            gradient="bg-primary"
                            description="Registered mill establishments"
                        />
                        <StatsCard
                            title="Active Mills"
                            value={(reportsMetrics as any)?.activeCount}
                            loading={isReportsLoading}
                            icon={<CheckCircle2 size={18} className="text-emerald-500" />}
                            iconBg="bg-emerald-500/10"
                            gradient="bg-emerald-500"
                            description="Operational facilities"
                        />
                        <StatsCard
                            title="Inactive Mills"
                            value={(reportsMetrics as any)?.inactiveCount}
                            loading={isReportsLoading}
                            icon={<AlertTriangle size={18} className="text-amber-500" />}
                            iconBg="bg-amber-500/10"
                            gradient="bg-amber-500"
                            description="Inactive/archived facilities"
                        />
                        <StatsCard
                            title="Total Machines"
                            value={(reportsMetrics as any)?.totalMachines}
                            loading={isReportsLoading}
                            icon={<Factory size={18} className="text-blue-500" />}
                            iconBg="bg-blue-500/10"
                            gradient="bg-blue-500"
                            description="Total machines deployed"
                        />
                    </>
                ) : (
                    <>
                        <StatsCard
                            title="Total Reports"
                            value={(reportsMetrics as any)?.totalCount}
                            loading={isReportsLoading}
                            icon={<FileText size={18} className="text-primary" />}
                            iconBg="bg-primary/10"
                            gradient="bg-primary"
                            description={`Total ${activeTab} log entries`}
                        />
                        <StatsCard
                            title="Completed"
                            value={(reportsMetrics as any)?.completedCount}
                            loading={isReportsLoading}
                            icon={<CheckCircle2 size={18} className="text-emerald-500" />}
                            iconBg="bg-emerald-500/10"
                            gradient="bg-emerald-500"
                            description="Processed status"
                        />
                        <StatsCard
                            title="In Progress"
                            value={(reportsMetrics as any)?.inProgressCount}
                            loading={isReportsLoading}
                            icon={<Loader2 size={18} className="text-blue-500 animate-spin" />}
                            iconBg="bg-blue-500/10"
                            gradient="bg-blue-500"
                            description="Under dynamic processing"
                        />
                        <StatsCard
                            title="Pending"
                            value={(reportsMetrics as any)?.pendingCount}
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
                        {/* Refresh Button */}
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className={cn(
                                "relative h-11 w-11 p-0 rounded-xl transition-all duration-200 justify-center items-center flex flex-shrink-0",
                                "bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10",
                                "text-gray-600 dark:text-gray-400",
                                "hover:border-primary/50 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10",
                                "disabled:opacity-50 cursor-pointer"
                            )}
                            title="Refresh data"
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-primary")} />
                        </Button>

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

                        {/* Filter Drawer Trigger */}
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterDrawerOpen(true)}
                            className="h-11 gap-2 rounded-xl font-bold border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all cursor-pointer select-none"
                        >
                            <Filter size={15} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-0.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-sm shadow-primary/30">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>

                        {/* Clear Filters */}
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
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Report Export Button */}
                    <Button
                        variant="outline"
                        onClick={() => setIsExportDrawerOpen(true)}
                        disabled={isReportsLoading}
                        className="h-11 gap-2 rounded-xl font-bold border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all cursor-pointer select-none"
                    >
                        <FileDown size={15} />
                        Export
                    </Button>
                </div>

                {/* Paginated Reports Data Table */}
                <div className="pt-2">
                    <DataTable
                        columns={currentColumns as any}
                        data={reportsData as any}
                        loading={isReportsLoading || isRefreshing}
                        pageCount={Math.ceil(reportsTotal / pagination.pageSize)}
                        totalCount={reportsTotal}
                        entityName={
                            activeTab === "services"
                                ? "service reports"
                                : activeTab === "installations"
                                ? "installations"
                                : activeTab === "expenses"
                                ? "expenses"
                                : activeTab === "master-mills"
                                ? "masters"
                                : activeTab === "mills"
                                ? "mills"
                                : "store logs"
                        }
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        hideToolbar
                    />
                </div>
            </div>

            {/* Filter Drawer */}
            <GenericFilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                title="Report Filters"
                description="Refine the report list by status, category, mill, and technician."
                fields={filterFields}
                activeValues={filterActiveValues}
                onApply={handleFilterApply}
                onReset={() => {
                    resetFilters();
                    setLocalSearch("");
                }}
            />

            {/* Export Drawer */}
            <ExportReportDrawer
                isOpen={isExportDrawerOpen}
                onClose={() => setIsExportDrawerOpen(false)}
                activeTab={activeTab}
                initialDateFrom={dateFrom}
                initialDateTo={dateTo}
                onExport={async (fmt, from, to) => {
                    try {
                        const params = {
                            search: search || undefined,
                            status: statusFilter || undefined,
                            categoryId: categoryFilter || undefined,
                            dateFrom: from || undefined,
                            dateTo: to || undefined,
                            createdDateFrom: createdDateFrom || undefined,
                            createdDateTo: createdDateTo || undefined,
                            expenseDateFrom: expenseDateFrom || undefined,
                            expenseDateTo: expenseDateTo || undefined,
                            millId: millFilter || undefined,
                            technicianId: technicianFilter || undefined,
                            millName: millNameFilter || undefined,
                            frameNo: frameNoFilter || undefined,
                            refNo: refNoFilter || undefined,
                            serviceEngineerId: technicianFilter || undefined,
                            customerId: storeCustomerFilter || undefined,
                            materialId: storeMaterialFilter || undefined,
                            warrantyStatus: storeWarrantyFilter || undefined,
                            returnStatus: storeReturnFilter || undefined,
                            inflowStatus: storeInflowFilter || undefined,
                        };
                        await downloadReportFile(activeTab, fmt, params);
                        toast.success(`${fmt.toUpperCase()} report downloaded successfully`);
                    } catch (error) {
                        console.error(error);
                        toast.error("Failed to generate report download");
                        throw error;
                    }
                }}
            />
        </div>
    );
}
