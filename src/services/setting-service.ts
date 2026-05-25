import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Setting {
    id: string;
    key: string;
    value: string;
    group: string;
    created_at: string;
    updated_at: string;
}

export interface SettingsResponse {
    settings: Setting[];
    total: number;
}

export interface SettingInput {
    key: string;
    value: string;
    group: string;
}

export const useSettings = (params: {
    skip: number;
    take: number;
    search?: string;
    group?: string;
}) => {
    return useQuery({
        queryKey: ["settings", params],
        queryFn: async () => {
            const { data } = await api.get<SettingsResponse>("/settings", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useSetting = (id: string | null) => {
    return useQuery({
        queryKey: ["setting", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<Setting>(`/settings/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateSetting = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (settingData: any) => {
            const { data } = await api.post("/settings", settingData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            toast.success("Setting created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create setting");
        },
    });
};

export const useUpdateSetting = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...settingData }: any) => {
            const { data } = await api.put(`/settings/${id}`, settingData);
            return data;
        },
        onSuccess: (updatedSetting) => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            queryClient.setQueryData(["setting", updatedSetting.id], updatedSetting);
            toast.success("Setting updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update setting");
        },
    });
};

export const useDeleteSetting = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/settings/${id}`);
            return data;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["settings"] });

            const queryCache = queryClient.getQueryCache();
            const settingQueries = queryCache.findAll({ queryKey: ["settings"] });

            const snapshots: Array<{ queryKey: readonly unknown[]; data: SettingsResponse }> = [];

            for (const query of settingQueries) {
                const previousData = query.state.data as SettingsResponse | undefined;
                if (previousData) {
                    snapshots.push({ queryKey: query.queryKey, data: previousData });
                    queryClient.setQueryData<SettingsResponse>(query.queryKey, {
                        ...previousData,
                        settings: previousData.settings.filter((s) => s.id !== id),
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
            toast.error("Failed to delete setting");
        },
        onSuccess: () => {
            toast.success("Setting deleted successfully");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        },
    });
};

export const useCompanySettings = () => {
    return useSettings({ skip: 0, take: 100, group: "COMPANY" });
};

export const useUpsertSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: SettingInput[]) => {
            const { data: existingData } = await api.get<SettingsResponse>("/settings", {
                params: { skip: 0, take: 200, group: "COMPANY" },
            });

            const existingByKey = new Map(
                existingData.settings.map((setting) => [setting.key, setting])
            );

            const saved = await Promise.all(
                settings.map(async (setting) => {
                    const existing = existingByKey.get(setting.key);
                    if (existing) {
                        const { data } = await api.put<Setting>(`/settings/${existing.id}`, setting);
                        return data;
                    }

                    const { data } = await api.post<Setting>("/settings", setting);
                    return data;
                })
            );

            return saved;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            toast.success("Company settings saved successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to save company settings");
        },
    });
};
