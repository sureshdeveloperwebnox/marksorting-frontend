"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
  useInstallationReports,
  InstallationReport,
  useDeleteInstallationReport,
  useUpdateInstallationReport,
  downloadInstallationReportPdf,
  useInstallationReport,
} from "@/services/installation-report-service";
import { useTechnicians } from "@/services/technician-service";
import useInstallationReportStore from "@/store/useInstallationReportStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  FileText,
  Loader2,
  Search,
  Filter,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Download,
  Eye,
  Hash,
  User,
  Phone,
  Mail,
  MapPin,
  Activity,
  Package,
  Settings,
  Wrench,
  Check,
  X,
  XCircle,
  Info,
  Building2,
  ShieldCheck,
  Gauge,
  Wind,
  Upload,
} from "lucide-react";
import { BulkUploadDialog } from "@/components/modals/BulkUploadDialog";
import type { InstallationReportColumnConfig } from "@/types/bulk-upload";
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
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { InstallationReportFormDrawer } from "@/components/forms/installation-report-form-drawer";
import { RouteGuard } from "@/components/guards/route-guard";
import { ViewDetailsDrawer } from "@/components/ui/view-details-drawer";
import { PageHeaderControls } from "@/components/ui/page-header-controls";
import { TableTabs } from "@/components/ui/table-tabs";
import { useCustomers } from "@/services/customer-service";
import { useMills } from "@/services/mill-service";
import { useSearchParams } from "next/navigation";

/* ─── Helpers ──────────────────────────────────────────────────── */

const getStatusColors = (status: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500 dark:border-amber-400";
    case "IN_PROGRESS": return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500 dark:border-blue-400";
    case "COMPLETED": return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400";
    case "CANCELLED": return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500 dark:border-rose-400";
    default: return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500 dark:border-gray-400";
  }
};

const getStatusDotColors = (status: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    case "IN_PROGRESS": return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
    case "COMPLETED": return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    case "CANCELLED": return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
    default: return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "Pending";
    case "IN_PROGRESS": return "Work In Progress";
    case "COMPLETED": return "Completed";
    case "CANCELLED": return "Cancelled";
    default: return status || "—";
  }
};



/* ─── Page ──────────────────────────────────────────────────────── */

export default function InstallationReportPage() {
  const {
    pagination,
    setPagination,
    search,
    setSearch,
    statusFilter,
    technicianFilter,
    customerFilter,
    millFilter,
    dateFrom,
    dateTo,
    setStatusFilter,
    setTechnicianFilter,
    setCustomerFilter,
    setMillFilter,
    setDateFrom,
    setDateTo,
    resetFilters,
    deleteId,
    setDeleteId,
    openFormDrawer,
  } = useInstallationReportStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);
  const [downloadingPdfId, setDownloadingPdfId] = React.useState<string | null>(null);
  const [selectedViewId, setSelectedViewId] = React.useState<string | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = React.useState(false);
  // Tracks the customer selected INSIDE the filter drawer (before Apply) for reactive mill list
  const [drawerCustomerId, setDrawerCustomerId] = React.useState<string>("");

  // Load all customers for filter dropdown
  const { data: customersData } = useCustomers({ skip: 0, take: 500 });
  const customers = customersData?.customers || [];

  // Load mills — filtered by drawerCustomerId so the list reacts immediately in the drawer
  const { data: irMillsData } = useMills({
    skip: 0,
    take: 500,
    customer_id: drawerCustomerId || undefined,
  });
  const irMills = irMillsData?.mills || [];

  // All 35 installation report preview columns
  const irColumnConfig: InstallationReportColumnConfig[] = [
    { key: "mill_name", header: "Mill Name" },
    { key: "place", header: "Place" },
    { key: "technician_names", header: "Technicians" },
    { key: "visit_date", header: "Visit Date" },
    { key: "visit_time", header: "Visit Time" },
    { key: "call_registered_date", header: "Call Reg. Date" },
    { key: "mill_whatsapp_number", header: "WhatsApp No" },
    { key: "mill_email", header: "Mill Email" },
    { key: "machine_model", header: "Machine Model" },
    { key: "serial_or_frame_no", header: "Serial / Frame No" },
    { key: "authorized_person", header: "Auth. Person" },
    { key: "authorized_person_phone", header: "Auth. Phone" },
    { key: "invoice_number", header: "Invoice No" },
    { key: "invoice_date", header: "Invoice Date" },
    { key: "warranty_start_date", header: "Warranty Start" },
    { key: "warranty_years", header: "Warranty Yrs" },
    { key: "warranty_months", header: "Warranty Mths" },
    { key: "warranty_end_date", header: "Warranty End" },
    { key: "commodity", header: "Commodity" },
    { key: "contamination", header: "Contamination" },
    { key: "output_capacity_per_hour", header: "Output/Hr" },
    { key: "rejection_ratio", header: "Rejection Ratio" },
    { key: "purity", header: "Purity" },
    { key: "no_of_programs_set", header: "Programs Set" },
    { key: "ac_provided", header: "AC Provided" },
    { key: "compressor_details", header: "Compressor" },
    { key: "air_drier_details", header: "Air Drier" },
    { key: "ground_earth_provided", header: "Ground Earth" },
    { key: "running_channel_combination", header: "Channel Combo" },
    { key: "running_channel_combination_value", header: "Channel Value" },
    { key: "no_of_filters_installed", header: "Filters Installed" },
    { key: "oil_filter_condition", header: "Oil Filter" },
    { key: "line_filter_condition", header: "Line Filter" },
    { key: "auto_drain_valve_working", header: "Auto Drain Valve" },
    { key: "engineer_remarks", header: "Eng. Remarks" },
    { key: "customer_remarks", header: "Cust. Remarks" },
    { key: "status", header: "Status" },
  ];

  const { data: viewReportData, isLoading: isViewReportLoading } = useInstallationReport(selectedViewId);

  const { data: techniciansData } = useTechnicians({ skip: 0, take: 500 });
  const technicians = techniciansData?.technicians || [];

  // Apply millId from URL query param (set when navigating from the Mill Details drawer)
  const searchParams = useSearchParams();
  React.useEffect(() => {
    const millId = searchParams.get("millId");
    if (millId) {
      setMillFilter(millId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  const { data, isLoading, isFetching, refetch } = useInstallationReports({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search,
    status: statusFilter || undefined,
    technicianId: technicianFilter || undefined,
    customerId: customerFilter || undefined,
    millId: millFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: totalData, isFetching: isFetchingTotal, refetch: refetchTotal } = useInstallationReports({
    skip: 0,
    take: 1,
    status: undefined,
    technicianId: technicianFilter || undefined,
    customerId: customerFilter || undefined,
    millId: millFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
  });
  const { data: completedData, isFetching: isFetchingCompleted, refetch: refetchCompleted } = useInstallationReports({
    skip: 0,
    take: 1,
    status: "COMPLETED",
    technicianId: technicianFilter || undefined,
    customerId: customerFilter || undefined,
    millId: millFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
  });
  const { data: pendingData, isFetching: isFetchingPending, refetch: refetchPending } = useInstallationReports({
    skip: 0,
    take: 1,
    status: "PENDING",
    technicianId: technicianFilter || undefined,
    customerId: customerFilter || undefined,
    millId: millFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
  });

  const { data: cancelledData, isFetching: isFetchingCancelled, refetch: refetchCancelled } = useInstallationReports({
    skip: 0,
    take: 1,
    status: "CANCELLED",
    technicianId: technicianFilter || undefined,
    customerId: customerFilter || undefined,
    millId: millFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
  });

  const isRefreshing = isFetching || isFetchingTotal || isFetchingCompleted || isFetchingPending || isFetchingCancelled;

  const handleRefresh = async () => {
    await Promise.all([
      refetch(),
      refetchTotal(),
      refetchCompleted(),
      refetchPending(),
      refetchCancelled(),
    ]);
  };

  const deleteMutation = useDeleteInstallationReport();
  const updateReportMutation = useUpdateInstallationReport();

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Installation report deleted successfully");
    } catch {
      // Handled in mutation
    } finally {
      setDeleteId(null);
    }
  };

  const handleDownloadPdf = async (report: InstallationReport) => {
    try {
      setDownloadingPdfId(report.id);
      await downloadInstallationReportPdf(report.id, report.report_number);
      toast.success("Installation report PDF downloaded");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to download installation report PDF");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const safeFormatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "—";
      return format(d, "MMM dd, yyyy");
    } catch {
      return "—";
    }
  };

  /* ── View Sections ── */
  const viewSections = React.useMemo(() => {
    if (!viewReportData) return [];

    const renderSignature = (sig?: string, altText?: string) => {
      if (!sig) return <span className="text-gray-400 dark:text-gray-600 font-medium">No signature captured</span>;

      const isValid =
        sig.startsWith("http://") ||
        sig.startsWith("https://") ||
        (sig.startsWith("data:image/") && !sig.includes("...") && sig.length >= 100);

      if (!isValid) {
        return <span className="text-gray-400 dark:text-gray-600 font-medium">No signature captured</span>;
      }

      const src =
        sig.startsWith("data:") || sig.startsWith("http://") || sig.startsWith("https://")
          ? sig
          : `data:image/png;base64,${sig}`;

      return (
        <div className="mt-1 p-2 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl flex items-center justify-center min-h-[90px] w-full">
          <img
            src={src}
            alt={altText || "Signature"}
            className="max-h-20 object-contain dark:invert"
          />
        </div>
      );
    };

    const boolField = (val: boolean, trueLabel = "Yes", falseLabel = "No") => (
      <div className="flex items-center gap-1.5">
        {val ? (
          <>
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500 font-bold text-xs uppercase tracking-wider">{trueLabel}</span>
          </>
        ) : (
          <>
            <X className="w-4 h-4 text-rose-500" />
            <span className="text-rose-500 font-bold text-xs uppercase tracking-wider">{falseLabel}</span>
          </>
        )}
      </div>
    );

    return [
      {
        title: "General Information",
        items: [
          {
            label: "Report Number",
            value: (
              <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                {viewReportData.report_number}
              </span>
            ),
            icon: Hash,
          },
          {
            label: "Status",
            value: (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md font-semibold text-[10px] uppercase px-2 py-0.5 shadow-sm",
                  getStatusColors(viewReportData.status)
                )}
              >
                {getStatusLabel(viewReportData.status)}
              </Badge>
            ),
            icon: Activity,
          },
          {
            label: "Visit Date",
            value: safeFormatDate(viewReportData.visit_date),
            icon: Calendar,
          },
          {
            label: "Visit Time",
            value: viewReportData.visit_time || "—",
            icon: Clock,
          },
          {
            label: "Call Registered Date",
            value: safeFormatDate(viewReportData.call_registered_date),
            icon: Calendar,
          },
        ],
      },
      {
        title: "Mill & Client Details",
        items: [
          {
            label: "Mill Name",
            value: viewReportData.mill?.name || "—",
            icon: Building2,
          },
          {
            label: "Location / Place",
            value: viewReportData.place || "—",
            icon: MapPin,
          },
          {
            label: "Authorized Person",
            value: viewReportData.authorized_person
              ? `${viewReportData.authorized_person}${viewReportData.authorized_person_phone ? ` (${viewReportData.authorized_person_phone})` : ""}`
              : "—",
            icon: User,
          },
          {
            label: "WhatsApp Number",
            value: viewReportData.mill_whatsapp_number ? (
              <a
                href={`https://wa.me/${viewReportData.mill_whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-primary font-bold"
              >
                {viewReportData.mill_whatsapp_number}
              </a>
            ) : "—",
            icon: Phone,
          },
          {
            label: "Email Address",
            value: viewReportData.mill_email ? (
              <a href={`mailto:${viewReportData.mill_email}`} className="hover:underline text-primary font-bold">
                {viewReportData.mill_email}
              </a>
            ) : "—",
            icon: Mail,
          },
        ],
      },
      {
        title: "Machine Details",
        items: [
          {
            label: "Machine Model",
            value: viewReportData.machine_model || "—",
            icon: Settings,
          },
          {
            label: "Serial / Frame No",
            value: (
              <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                {viewReportData.serial_or_frame_no || "—"}
              </span>
            ),
            icon: Hash,
          },
          {
            label: "Invoice Number",
            value: viewReportData.invoice_number ? (
              <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                {viewReportData.invoice_number}
              </span>
            ) : "—",
            icon: FileText,
          },
          {
            label: "Invoice Date",
            value: safeFormatDate(viewReportData.invoice_date),
            icon: Calendar,
          },
          {
            label: "Warranty Start",
            value: safeFormatDate(viewReportData.warranty_start_date),
            icon: ShieldCheck,
          },
          {
            label: "Warranty Duration",
            value: (() => {
              const y = viewReportData.warranty_years ?? 0;
              const m = viewReportData.warranty_months ?? 0;
              const parts = [];
              if (y > 0) parts.push(`${y} Year${y > 1 ? "s" : ""}`);
              if (m > 0) parts.push(`${m} Month${m > 1 ? "s" : ""}`);
              return parts.join(" ") || (y === 0 && m === 0 ? "0 Months" : "—");
            })(),
            icon: Clock,
          },
          {
            label: "Warranty End",
            value: safeFormatDate(viewReportData.warranty_end_date),
            icon: ShieldCheck,
          },
        ],
      },
      {
        title: "Machine Performance",
        items: [
          {
            label: "Commodity",
            value: viewReportData.commodity || "—",
            icon: Package,
          },
          {
            label: "Contamination",
            value: viewReportData.contamination || "—",
            icon: Activity,
          },
          {
            label: "Output Capacity / Hour",
            value: viewReportData.output_capacity_per_hour || "—",
            icon: Gauge,
          },
          {
            label: "Rejection Ratio",
            value: viewReportData.rejection_ratio || "—",
            icon: Activity,
          },
          {
            label: "Purity",
            value: viewReportData.purity || "—",
            icon: Activity,
          },
          {
            label: "No of Programs Set",
            value:
              viewReportData.no_of_programs_set !== undefined &&
                viewReportData.no_of_programs_set !== null
                ? String(viewReportData.no_of_programs_set)
                : "—",
            icon: Hash,
          },
        ],
      },
      {
        title: "Utility & Equipment Details",
        items: [
          {
            label: "A/C Provided",
            value: boolField(viewReportData.ac_provided),
            icon: Wind,
          },
          {
            label: "Ground Earth Provided",
            value: boolField(viewReportData.ground_earth_provided),
            icon: Settings,
          },
          {
            label: "Running Channel Combination",
            value:
              viewReportData.running_channel_combination !== undefined && viewReportData.running_channel_combination !== null
                ? String(viewReportData.running_channel_combination)
                : "—",
            icon: Gauge,
          },
          {
            label: "Running Channel Combination Value",
            value: viewReportData.running_channel_combination_value
              ? viewReportData.running_channel_combination_value.replace(/_/g, " ")
              : "—",
            icon: Settings,
          },
          {
            label: "Auto Drain Valve",
            value: boolField(viewReportData.auto_drain_valve_working),
            icon: Settings,
          },
          {
            label: "No of Filters Installed",
            value:
              viewReportData.no_of_filters_installed !== undefined &&
                viewReportData.no_of_filters_installed !== null
                ? String(viewReportData.no_of_filters_installed)
                : "—",
            icon: Hash,
          },
          {
            label: "Compressor Details",
            value: viewReportData.compressor_details || "—",
            icon: Settings,
          },
          {
            label: "Air Drier Details",
            value: viewReportData.air_drier_details || "—",
            icon: Wind,
          },
          {
            label: "Oil Filter Condition",
            value: viewReportData.oil_filter_condition || "—",
            icon: Settings,
          },
          {
            label: "Line Filter Condition",
            value: viewReportData.line_filter_condition || "—",
            icon: Settings,
          },
        ],
      },
      {
        title: "Assigned Engineers & Remarks",
        items: [
          {
            label: "Engineers",
            value:
              viewReportData.technicians?.map((t: any) => t.technician.full_name).join(", ") || "—",
            icon: Wrench,
            fullWidth: true,
          },
          {
            label: "Engineer Remarks",
            value: viewReportData.engineer_remarks || "—",
            icon: Info,
            fullWidth: true,
          },
          {
            label: "Customer Remarks",
            value: viewReportData.customer_remarks || "—",
            icon: Info,
            fullWidth: true,
          },
        ],
      },
      {
        title: "Signatures",
        items: [
          {
            label: "Engineer Signature",
            value: renderSignature(viewReportData.engineer_signature, "Engineer Signature"),
            icon: User,
            fullWidth: true,
          },
          {
            label: "Customer Signature",
            value: renderSignature(viewReportData.customer_signature, "Customer Signature"),
            icon: User,
            fullWidth: true,
          },
        ],
      },
    ];
  }, [viewReportData]);

  const activeFilterCount = [statusFilter, technicianFilter, customerFilter, millFilter, dateFrom, dateTo].filter(Boolean).length;

  /* ── Filter fields ── */
  const filterFields: FilterField[] = [
    {
      id: "status",
      label: "Report Status",
      options: [
        { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
        { value: "PENDING", label: "Pending", iconColor: "bg-amber-500", animatePulse: true },
        { value: "COMPLETED", label: "Completed", iconColor: "bg-emerald-500", animatePulse: true },
        { value: "CANCELLED", label: "Cancelled", iconColor: "bg-rose-500", animatePulse: true },
      ],
    },
    {
      id: "technicianId",
      label: "Service Engineer",
      options: [
        { value: "ALL", label: "All Service Engineers", iconColor: "bg-gray-400 dark:bg-gray-500" },
        ...technicians.map((t) => ({
          value: t.id,
          label: t.full_name,
          iconColor: "bg-primary",
        })),
      ],
    },
    {
      id: "customerId",
      label: "Customer",
      options: [
        { value: "ALL", label: "All Customers", iconColor: "bg-gray-400 dark:bg-gray-500" },
        ...customers.map((c) => ({
          value: c.id,
          label: c.name,
          iconColor: "bg-indigo-500",
        })),
      ],
    },
    {
      id: "millId",
      label: "Mill",
      dependsOnField: "customerId",
      disabledHint: "select a customer first",
      options: [
        {
          value: "ALL",
          label: drawerCustomerId
            ? `All Mills (${irMills.length} found)`
            : "All Mills",
          iconColor: "bg-gray-400 dark:bg-gray-500",
        },
        ...irMills.map((m) => ({
          value: m.id,
          label: m.name,
          iconColor: "bg-orange-500",
        })),
      ],
    },
    {
      id: "dateRange",
      label: "Select Date",
      type: "date-range",
      placeholder: "Select date range...",
    },
  ];

  /* ── Table columns ── */
  const columns: ColumnDef<InstallationReport>[] = [
    {
      accessorKey: "report_number",
      header: "Report No",
      cell: ({ row }) => (
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-semibold text-sm relative border border-primary/10 transition-transform duration-500 group-hover:scale-110 overflow-hidden">
              {row.original.mill?.name?.charAt(0) || "M"}
            </div>
          </div>
          <span className="font-semibold text-[14px] text-gray-900 dark:text-white tracking-tight">
            {row.original.report_number}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "mill.name",
      header: "Mill / Place",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
            {row.original.mill?.name || "—"}
          </span>
          <span className="text-gray-400 dark:text-gray-500 font-medium text-xs">
            {row.original.place || "—"}
          </span>
        </div>
      ),
    },
    {
      id: "engineers",
      header: "Engineers",
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
          {row.original.technicians?.map((t: any) => t.technician.full_name).join(", ") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "visit_date",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">
            {row.original.visit_date ? format(new Date(row.original.visit_date), "MMM dd, yyyy") : "—"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const reportId = row.original.id;
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
                    {getStatusLabel(status)}
                  </Badge>
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-40 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 z-[9999]">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-1.5 mb-1 select-none">Set Status</div>
              {[
                { value: "PENDING", label: "Pending", color: "amber" },
                { value: "COMPLETED", label: "Completed", color: "emerald" },
                { value: "CANCELLED", label: "Cancelled", color: "rose" },
              ].map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  className={cn(
                    "rounded-lg font-semibold text-xs my-0.5 cursor-pointer flex items-center gap-2 py-2 px-2.5 transition-colors",
                    status === s.value
                      ? `text-${s.color}-500 bg-${s.color}-500/5`
                      : "text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => updateReportMutation.mutate({ id: reportId, status: s.value })}
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
      id: "actions",
      header: () => <div className="text-right w-full font-bold">Actions</div>,
      cell: ({ row }) => {
        const isDownloading = downloadingPdfId === row.original.id;
        return (
          <div className="flex items-center justify-end gap-2">
            {/* View Details */}
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
            {/* Download PDF */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/30 hover:text-sky-700 hover:bg-sky-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
              onClick={() => handleDownloadPdf(row.original)}
              disabled={isDownloading}
              title="Download PDF"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 hover:text-amber-700 hover:bg-amber-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
              onClick={() => openFormDrawer(row.original.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {/* Delete */}
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
        );
      },
    },
  ];

  /* ── Render ── */
  return (
    <RouteGuard module="installation_reports" action="view">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full"
      >
        {/* Report List Card (Full width) */}
        <div className="w-full">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Installation{" "}
                  <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                    List
                  </span>
                </h1>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                  Manage all installations and setup statuses
                </p>
              </div>

              <PageHeaderControls
                searchValue={localSearch}
                onSearchChange={setLocalSearch}
                searchPlaceholder="Search installations..."
                onFilterClick={() => {
                  setDrawerCustomerId(customerFilter || "");
                  setIsFilterDrawerOpen(true);
                }}
                activeFiltersCount={activeFilterCount}
                addLabel="New Installation"
                addIcon={<FileText size={15} />}
                onAddClick={() => openFormDrawer()}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                renderExtraControls={() => (
                  <button
                    type="button"
                    onClick={() => setBulkUploadOpen(true)}
                    className={cn(
                      "relative h-10 px-4 gap-2 inline-flex items-center rounded-xl text-sm font-semibold transition-all duration-200",
                      "bg-transparent border border-gray-200 dark:border-white/10",
                      "text-gray-600 dark:text-gray-400",
                      "hover:border-primary/50 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10",
                    )}
                  >
                    <Upload size={14} />
                    Upload Excel
                  </button>
                )}
              />
            </div>

            {/* Reusable Table Tabs */}
            <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/20 dark:bg-black/[0.03]">
              <TableTabs
                tabs={[
                  { value: "", label: "All", count: totalData?.total || 0, color: "primary", icon: <ClipboardCheck size={14} /> },
                  { value: "PENDING", label: "Pending", count: pendingData?.total || 0, color: "amber", icon: <AlertTriangle size={14} /> },
                  { value: "COMPLETED", label: "Completed", count: completedData?.total || 0, color: "emerald", icon: <CheckCircle2 size={14} /> },
                  { value: "CANCELLED", label: "Cancelled", count: cancelledData?.total || 0, color: "rose", icon: <XCircle size={14} /> },
                ]}
                activeValue={statusFilter || ""}
                onChange={(value) => setStatusFilter(value)}
              />
            </div>

            <div className="p-6 pt-4">
              <DataTable
                columns={columns}
                data={data?.installationReports || []}
                loading={isLoading || isFetching}
                pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
                totalCount={data?.total || 0}
                entityName="installation reports"
                pagination={pagination}
                onPaginationChange={setPagination}
                onGlobalFilterChange={setSearch}
                globalFilterValue={search}
                searchPlaceholder="Search..."
                onFilterClick={() => setIsFilterDrawerOpen(true)}
                activeFiltersCount={activeFilterCount}
                hideToolbar
              />
            </div>
          </div>
        </div>

        {/* Filter Drawer */}
        <GenericFilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => {
            setIsFilterDrawerOpen(false);
            setDrawerCustomerId(customerFilter || "");
          }}
          fields={filterFields}
          activeValues={{
            status: statusFilter || "ALL",
            technicianId: technicianFilter || "ALL",
            customerId: customerFilter || "ALL",
            millId: millFilter || "ALL",
            dateRange: dateFrom && dateTo ? JSON.stringify({ startDate: dateFrom, endDate: dateTo, label: "Custom Range" }) : "",
          }}
          onLocalChange={(fieldId, value) => {
            if (fieldId === "customerId") {
              setDrawerCustomerId(value === "ALL" ? "" : value);
              return { millId: "ALL" };
            }
            return {};
          }}
          onApply={(values) => {
            setStatusFilter(values.status === "ALL" ? "" : values.status);
            setTechnicianFilter(values.technicianId === "ALL" ? "" : values.technicianId);
            setCustomerFilter(values.customerId === "ALL" ? "" : values.customerId);
            setMillFilter(values.millId === "ALL" ? "" : values.millId);
            setDrawerCustomerId(values.customerId === "ALL" ? "" : values.customerId);
            if (values.dateRange) {
              try {
                const range = JSON.parse(values.dateRange);
                setDateFrom(range.startDate || "");
                setDateTo(range.endDate || range.startDate || "");
              } catch {
                setDateFrom("");
                setDateTo("");
              }
            } else {
              setDateFrom("");
              setDateTo("");
            }
          }}
          onReset={() => {
            setStatusFilter("");
            setTechnicianFilter("");
            setCustomerFilter("");
            setMillFilter("");
            setDrawerCustomerId("");
            setDateFrom("");
            setDateTo("");
            resetFilters();
          }}
        />

        {/* Form Drawer */}
        <InstallationReportFormDrawer />

        {/* View Details Drawer */}
        <ViewDetailsDrawer
          isOpen={isViewDrawerOpen}
          onClose={() => {
            setIsViewDrawerOpen(false);
            setSelectedViewId(null);
          }}
          title={
            viewReportData
              ? `Installation #${viewReportData.report_number}`
              : "Installation Details"
          }
          description={
            viewReportData
              ? `${viewReportData.mill?.name || "—"} · ${safeFormatDate(viewReportData.visit_date)}`
              : "Loading installation report..."
          }
          icon={<ClipboardCheck size={22} />}
          isLoading={isViewReportLoading}
          sections={viewSections}
          size="2xl"
        />

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
                This action cannot be undone. This will permanently remove the installation report from the system.
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
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Bulk Upload Dialog ── */}
        <BulkUploadDialog
          open={bulkUploadOpen}
          onOpenChange={setBulkUploadOpen}
          onSuccess={() => { refetch(); refetchTotal(); }}
          previewEndpoint="/installation-reports/bulk-upload/preview"
          importEndpoint="/installation-reports/bulk-upload/import"
          statusEndpoint="/installation-reports/bulk-upload/status"
          templateEndpoint="/installation-reports/bulk-upload/template"
          columnConfig={irColumnConfig as any}
        />
      </motion.div>
    </RouteGuard>
  );
}
