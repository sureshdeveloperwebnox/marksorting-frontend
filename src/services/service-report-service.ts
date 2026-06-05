import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ServiceReportTechnicianEntry {
    technician: {
        id: string;
        full_name: string;
    };
}

export interface ServiceReport {
    id: string;
    report_number: string;
    service_category_id: string;
    mill_id: string;
    place: string;
    mill_whatsapp_number: string;
    mill_email?: string;
    visit_date: string;
    visit_time: string;
    call_registered_date: string;
    machine_model: string;
    machine_mfg_date?: string;
    machine_installation_date?: string;
    serial_or_frame_no: string;
    authorized_person: string;
    previous_visit_engineer?: string;
    nature_of_complaint: string;
    problem_observed?: string;
    action_taken: string;
    commodity?: string;
    contamination?: string;
    output_capacity_per_hour?: string;
    rejection_ratio?: string;
    purity?: string;
    no_of_programs_set?: number;
    ac_provided: boolean;
    compressor_details?: string;
    air_drier_details?: string;
    line_filter_condition?: string;
    machine_filter_condition?: string;
    auto_drain_valve_working: boolean;
    engineer_remarks: string;
    engineer_signature: string;
    customer_remarks?: string;
    customer_signature: string;
    status: string;
    created_at: string;
    updated_at: string;
    mill: { id: string; name: string };
    serviceCategory: { id: string; name: string };
    technicians: ServiceReportTechnicianEntry[];
}

export interface ServiceReportsResponse {
    serviceReports: ServiceReport[];
    total: number;
}

export const useServiceReports = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
    serviceCategoryId?: string;
    technicianId?: string;
    dateFrom?: string;
    dateTo?: string;
}) => {
    return useQuery({
        queryKey: ["serviceReports", params],
        queryFn: async () => {
            const { data } = await api.get<ServiceReportsResponse>("/service-reports", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useServiceReport = (id: string | null) => {
    return useQuery({
        queryKey: ["serviceReport", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<ServiceReport>(`/service-reports/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const downloadServiceReportPdf = async (id: string, reportNumber: string) => {
    const { data } = await api.get<Blob>(`/service-reports/${id}/pdf`, {
        responseType: "blob",
    });

    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `service-report-${reportNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const useCreateServiceReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (reportData: any) => {
            const { data } = await api.post("/service-reports", reportData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["serviceReports"] });
            toast.success("Service report created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create service report");
        },
    });
};

export const useUpdateServiceReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...reportData }: any) => {
            const { data } = await api.put(`/service-reports/${id}`, reportData);
            return data;
        },
        onSuccess: (updatedReport: any) => {
            queryClient.invalidateQueries({ queryKey: ["serviceReports"] });
            // Invalidate the single-report cache so the view drawer refetches
            // fresh data from the server (e.g. updated S3 signature URLs).
            const reportId = updatedReport.id || updatedReport.after?.id;
            queryClient.invalidateQueries({ queryKey: ["serviceReport", reportId] });
            toast.success("Service report updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update service report");
        },
    });
};

export const useDeleteServiceReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/service-reports/${id}`);
            return data;
        },
        // Optimistic delete: immediately remove from all caches
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["serviceReports"] });

            const queryCache = queryClient.getQueryCache();
            const serviceReportQueries = queryCache.findAll({
                queryKey: ["serviceReports"],
            });

            const snapshots: Array<{ queryKey: readonly unknown[]; data: ServiceReportsResponse }> = [];

            for (const query of serviceReportQueries) {
                const previousData = query.state.data as ServiceReportsResponse | undefined;
                if (previousData) {
                    snapshots.push({ queryKey: query.queryKey, data: previousData });
                    queryClient.setQueryData<ServiceReportsResponse>(query.queryKey, {
                        ...previousData,
                        serviceReports: previousData.serviceReports.filter((r) => r.id !== id),
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
            toast.error("Failed to delete service report");
        },
        onSuccess: () => {
            toast.success("Service report deleted successfully");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["serviceReports"] });
        },
    });
};
