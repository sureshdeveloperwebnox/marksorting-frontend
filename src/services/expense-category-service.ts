import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ExpenseCategory {
    id: string;
    name: string;
    description?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface ExpenseCategoriesResponse {
    expenseCategories: ExpenseCategory[];
    total: number;
}

export const useExpenseCategories = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
}) => {
    return useQuery({
        queryKey: ["expenseCategories", params],
        queryFn: async () => {
            const { data } = await api.get<ExpenseCategoriesResponse>("/expense-categories", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useExpenseCategory = (id: string | null) => {
    return useQuery({
        queryKey: ["expenseCategory", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<ExpenseCategory>(`/expense-categories/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateExpenseCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (categoryData: any) => {
            const { data } = await api.post("/expense-categories", categoryData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
            toast.success("Expense category created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create expense category");
        },
    });
};

export const useUpdateExpenseCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...categoryData }: any) => {
            const { data } = await api.put(`/expense-categories/${id}`, categoryData);
            return data;
        },
        onSuccess: (updatedCategory) => {
            queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
            queryClient.setQueryData(["expenseCategory", updatedCategory.id], updatedCategory);
            toast.success("Expense category updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update expense category");
        },
    });
};

export const useDeleteExpenseCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/expense-categories/${id}`);
            return data;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["expenseCategories"] });

            const queryCache = queryClient.getQueryCache();
            const expenseCategoryQueries = queryCache.findAll({
                queryKey: ["expenseCategories"],
            });

            const snapshots: Array<{ queryKey: readonly unknown[]; data: ExpenseCategoriesResponse }> = [];

            for (const query of expenseCategoryQueries) {
                const previousData = query.state.data as ExpenseCategoriesResponse | undefined;
                if (previousData) {
                    snapshots.push({ queryKey: query.queryKey, data: previousData });
                    queryClient.setQueryData<ExpenseCategoriesResponse>(query.queryKey, {
                        ...previousData,
                        expenseCategories: previousData.expenseCategories.filter((c) => c.id !== id),
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
            toast.error("Failed to delete expense category");
        },
        onSuccess: () => {
            toast.success("Expense category deleted successfully");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
        },
    });
};
