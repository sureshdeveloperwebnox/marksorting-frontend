import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ServiceCategory {
    id: string;
    name: string;
    description?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface ServiceCategoriesResponse {
    serviceCategories: ServiceCategory[];
    total: number;
}

export const useServiceCategories = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
}) => {
    return useQuery({
        queryKey: ["serviceCategories", params],
        queryFn: async () => {
            const { data } = await api.get<ServiceCategoriesResponse>("/service-categories", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useServiceCategory = (id: string | null) => {
    return useQuery({
        queryKey: ["serviceCategory", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<ServiceCategory>(`/service-categories/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateServiceCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (categoryData: any) => {
            const { data } = await api.post("/service-categories", categoryData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
            toast.success("Service category created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create service category");
        },
    });
};

export const useUpdateServiceCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...categoryData }: any) => {
            const { data } = await api.put(`/service-categories/${id}`, categoryData);
            return data;
        },
        onSuccess: (updatedCategory) => {
            queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
            queryClient.setQueryData(["serviceCategory", updatedCategory.id], updatedCategory);
            toast.success("Service category updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update service category");
        },
    });
};

export const useDeleteServiceCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/service-categories/${id}`);
            return data;
        },
        // Optimistic Update for "Instant Performance"
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["serviceCategories"] });

            const queryCache = queryClient.getQueryCache();
            const serviceCategoryQueries = queryCache.findAll({
                queryKey: ["serviceCategories"],
            });

            const snapshots: Array<{ queryKey: readonly unknown[]; data: ServiceCategoriesResponse }> = [];

            for (const query of serviceCategoryQueries) {
                const previousData = query.state.data as ServiceCategoriesResponse | undefined;
                if (previousData) {
                    snapshots.push({ queryKey: query.queryKey, data: previousData });
                    queryClient.setQueryData<ServiceCategoriesResponse>(query.queryKey, {
                        ...previousData,
                        serviceCategories: previousData.serviceCategories.filter((c) => c.id !== id),
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
            toast.error("Failed to delete service category");
        },
        onSuccess: () => {
            toast.success("Service category deleted successfully");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
        },
    });
};
