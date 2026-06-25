import api from "@/lib/api";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export interface ReportTechnicianEntry {
    technician: {
        id: string;
        full_name: string;
    };
}

export interface ReportsServiceReport {
    id: string;
    report_number: string;
    place: string;
    visit_date: string;
    nature_of_complaint: string;
    status: string;
    mill: { id: string; name: string };
    serviceCategory: { id: string; name: string };
    technicians: ReportTechnicianEntry[];
}

export interface ReportsInstallationReport {
    id: string;
    report_number: string;
    place: string;
    visit_date: string;
    machine_model: string;
    serial_or_frame_no: string;
    status: string;
    mill: { id: string; name: string };
    technicians: ReportTechnicianEntry[];
}

export interface ReportsExpenseReport {
    id: string;
    expense_number: string;
    place?: string;
    others?: string;
    visit_date: string;
    amount: string;
    admin_amount?: string;
    status: string;
    mill?: { id: string; name: string };
    expenseCategory: { id: string; name: string };
    technicians: ReportTechnicianEntry[];
}

export interface ReportsMasterMill {
    id: string;
    invoice_no: string;
    invoice_date?: string;
    ref_no?: string;
    mill_id?: string;
    address?: string;
    place?: string;
    state?: string;
    phone_no?: string;
    mc_model?: string;
    frame_no?: string;
    warranty_years?: number;
    warranty_months?: number;
    installation_date?: string;
    warranty_closing_date?: string;
    all_warranty?: string;
    amc_starting_date?: string;
    amc_period?: number;
    amc_particular?: string;
    amc_closing_date?: string;
    amc_amount?: string;
    status: string;
    type: string;
    mill?: { id: string; name: string };
}

export interface ServicesReportResponse {
    reports: ReportsServiceReport[];
    total: number;
    metrics: {
        totalCount: number;
        pendingCount: number;
        inProgressCount: number;
        completedCount: number;
    };
}

export interface InstallationsReportResponse {
    reports: ReportsInstallationReport[];
    total: number;
    metrics: {
        totalCount: number;
        pendingCount: number;
        inProgressCount: number;
        completedCount: number;
    };
}

export interface ExpensesReportResponse {
    reports: ReportsExpenseReport[];
    total: number;
    metrics: {
        totalCount: number;
        totalAmount: number;
        pendingCount: number;
        inProgressCount: number;
        completedCount: number;
    };
}

export interface MasterMillsReportResponse {
    reports: ReportsMasterMill[];
    total: number;
    metrics: {
        totalCount: number;
        underWarrantyCount: number;
        underAmcCount: number;
        nonWarrantyCount: number;
    };
}

export const useReportsServices = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    millId?: string;
    technicianId?: string;
}) => {
    return useQuery({
        queryKey: ["reports", "services", params],
        queryFn: async () => {
            const { data } = await api.get<ServicesReportResponse>("/reports/services", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useReportsInstallations = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    millId?: string;
    technicianId?: string;
}) => {
    return useQuery({
        queryKey: ["reports", "installations", params],
        queryFn: async () => {
            const { data } = await api.get<InstallationsReportResponse>("/reports/installations", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useReportsExpenses = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    millId?: string;
    technicianId?: string;
}) => {
    return useQuery({
        queryKey: ["reports", "expenses", params],
        queryFn: async () => {
            const { data } = await api.get<ExpensesReportResponse>("/reports/expenses", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useReportsMasterMills = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    millId?: string;
}) => {
    return useQuery({
        queryKey: ["reports", "master-mills", params],
        queryFn: async () => {
            const { data } = await api.get<MasterMillsReportResponse>("/reports/master-mills", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const downloadReportFile = async (
    tab: "services" | "installations" | "expenses" | "master-mills",
    format: "pdf" | "csv" | "excel",
    params: Record<string, any>
) => {
    const { data } = await api.get<Blob>(`/reports/${tab}`, {
        params: { ...params, export: format },
        responseType: "blob",
    });

    const extension = format === "excel" ? "xlsx" : format;
    const contentType =
        format === "pdf"
            ? "application/pdf"
            : format === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    const blob = new Blob([data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tab}_report_${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
