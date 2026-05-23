import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ExpenseTechnicianEntry {
    technician: {
        id: string;
        full_name: string;
    };
}

export interface Expense {
    id: string;
    expense_number: string;
    mill_id?: string;
    place?: string;
    visit_date: string;
    visit_time: string;
    expense_category_id: string;
    expenseCategory?: { id: string; name: string };
    others?: string;
    amount: string; // From Decimal on backend, represented as string or number in frontend
    expense_images: string[];
    status: string;
    created_at: string;
    updated_at: string;
    mill?: { id: string; name: string };
    technicians: ExpenseTechnicianEntry[];
}

export interface ExpensesResponse {
    expenses: Expense[];
    total: number;
}

export const useExpenses = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
}) => {
    return useQuery({
        queryKey: ["expenses", params],
        queryFn: async () => {
            const { data } = await api.get<ExpensesResponse>("/expenses", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useExpense = (id: string | null) => {
    return useQuery({
        queryKey: ["expense", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<Expense>(`/expenses/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (expenseData: any) => {
            const { data } = await api.post("/expenses", expenseData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            toast.success("Expense created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create expense");
        },
    });
};

export const useUpdateExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...expenseData }: any) => {
            const { data } = await api.put(`/expenses/${id}`, expenseData);
            return data;
        },
        onSuccess: (updatedExpense) => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.setQueryData(["expense", updatedExpense.id], updatedExpense);
            toast.success("Expense updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update expense");
        },
    });
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/expenses/${id}`);
            return data;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["expenses"] });

            const queryCache = queryClient.getQueryCache();
            const expenseQueries = queryCache.findAll({
                queryKey: ["expenses"],
            });

            const snapshots: Array<{ queryKey: readonly unknown[]; data: ExpensesResponse }> = [];

            for (const query of expenseQueries) {
                const previousData = query.state.data as ExpensesResponse | undefined;
                if (previousData) {
                    snapshots.push({ queryKey: query.queryKey, data: previousData });
                    queryClient.setQueryData<ExpensesResponse>(query.queryKey, {
                        ...previousData,
                        expenses: previousData.expenses.filter((r) => r.id !== id),
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
            toast.error("Failed to delete expense");
        },
        onSuccess: () => {
            toast.success("Expense deleted successfully");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
        },
    });
};
