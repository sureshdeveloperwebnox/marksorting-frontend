import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export interface InstallationReportTechnicianEntry {
    technician: {
        id: string;
        full_name: string;
    };
}

export interface InstallationReport {
    id: string;
    report_number: string;
    mill_id: string;
    place: string;
    mill_whatsapp_number: string;
    mill_email?: string;
    visit_date: string;
    visit_time: string;
    call_registered_date: string;
    machine_model: string;
    serial_or_frame_no: string;
    authorized_person: string;
    invoice_number?: string;
    invoice_date?: string;
    warranty_start_date?: string;
    warranty_end_date?: string;
    commodity?: string;
    contamination?: string;
    output_capacity_per_hour?: string;
    rejection_ratio?: string;
    purity?: string;
    no_of_programs_set?: number;
    ac_provided: boolean;
    compressor_details?: string;
    air_drier_details?: string;
    ground_earth_provided: boolean;
    ground_earth_value?: number;
    ground_earth_field?: string;
    no_of_filters_installed?: number;
    oil_filter_condition?: string;
    line_filter_condition?: string;
    auto_drain_valve_working: boolean;
    engineer_remarks: string;
    engineer_signature: string;
    customer_remarks?: string;
    customer_signature: string;
    status: string;
    created_at: string;
    updated_at: string;
    mill: { id: string; name: string };
    technicians: InstallationReportTechnicianEntry[];
}

export interface InstallationReportsResponse {
    installationReports: InstallationReport[];
    total: number;
}

export const useInstallationReports = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
    technicianId?: string;
    dateFrom?: string;
    dateTo?: string;
}) => {
    return useQuery({
        queryKey: ["installationReports", params],
        queryFn: async () => {
            const { data } = await api.get<InstallationReportsResponse>("/installation-reports", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useInstallationReport = (id: string | null) => {
    return useQuery({
        queryKey: ["installationReport", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<InstallationReport>(`/installation-reports/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const downloadInstallationReportPdf = async (id: string, reportNumber: string) => {
    const { data } = await api.get(`/installation-reports/${id}/pdf`, {
        responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `installation-report-${reportNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const useCreateInstallationReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (reportData: any) => {
            const { data } = await api.post("/installation-reports", reportData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["installationReports"] });
            toast.success("Installation report created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create installation report");
        },
    });
};

export const useUpdateInstallationReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...reportData }: any) => {
            const { data } = await api.put(`/installation-reports/${id}`, reportData);
            return data;
        },
        onSuccess: (updatedReport: any) => {
            queryClient.invalidateQueries({ queryKey: ["installationReports"] });
            // Invalidate (not setQueryData) so the view drawer always refetches
            // fresh data from the server, especially updated S3 signature URLs.
            const reportId = updatedReport.id || updatedReport.after?.id;
            queryClient.invalidateQueries({ queryKey: ["installationReport", reportId] });
            toast.success("Installation report updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update installation report");
        },
    });
};

export const useDeleteInstallationReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/installation-reports/${id}`);
            return data;
        },
        // Optimistic delete: immediately remove from all caches
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["installationReports"] });

            const queryCache = queryClient.getQueryCache();
            const installationReportQueries = queryCache.findAll({
                queryKey: ["installationReports"],
            });

            const snapshots: Array<{ queryKey: readonly unknown[]; data: InstallationReportsResponse }> = [];

            for (const query of installationReportQueries) {
                const previousData = query.state.data as InstallationReportsResponse | undefined;
                if (previousData) {
                    snapshots.push({ queryKey: query.queryKey, data: previousData });
                    queryClient.setQueryData<InstallationReportsResponse>(query.queryKey, {
                        ...previousData,
                        installationReports: previousData.installationReports.filter((r) => r.id !== id),
                        total: previousData.total - 1,
                    });
                }
            }

            return { snapshots };
        },
        onError: (_err, _id, context: any) => {
            if (context?.snapshots) {
                for (const snapshot of context.snapshots) {
                    queryClient.setQueryData(snapshot.queryKey, snapshot.data);
                }
            }
            toast.error("Failed to delete installation report");
        },
        onSuccess: () => {
            toast.success("Installation report deleted successfully");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["installationReports"] });
        },
    });
};
