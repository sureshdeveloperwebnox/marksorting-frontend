import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";

export interface ExpenseTechnicianEntry {
    technician: {
        id: string;
        full_name: string;
    };
}

export interface ExpenseItem {
    id: string;
    expense_id: string;
    expense_category_id: string;
    amount: string;
    admin_amount?: string;
    remarks?: string;
    expense_images: string[];
    expenseCategory?: { id: string; name: string };
}

export interface Expense {
    id: string;
    expense_number: string;
    expense_type: string;
    mill_id?: string;
    place?: string;
    visit_date: string;
    visit_time: string;
    expense_category_id?: string;
    expenseCategory?: { id: string; name: string };
    others?: string;
    remarks?: string;
    amount: string; // From Decimal on backend, represented as string or number in frontend
    admin_amount?: string;
    expense_images: string[];
    status: string;
    created_at: string;
    updated_at: string;
    service_report_id?: string | null;
    installation_report_id?: string | null;
    mill?: { id: string; name: string };
    technicians: ExpenseTechnicianEntry[];
    expense_items?: ExpenseItem[];
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
    technicianId?: string;
    dateFrom?: string;
    dateTo?: string;
}) => {
    const user = useAuthStore((state) => state.user);
    const isServiceEngineer = user?.role === 'Service Engineer';

    return useQuery({
        queryKey: ["expenses", params, isServiceEngineer],
        queryFn: async () => {
            const endpoint = isServiceEngineer ? "/mobile/expenses" : "/expenses";
            const { data } = await api.get<ExpensesResponse>(endpoint, { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useExpense = (id: string | null) => {
    const user = useAuthStore((state) => state.user);
    const isServiceEngineer = user?.role === 'Service Engineer';

    return useQuery({
        queryKey: ["expense", id, isServiceEngineer],
        queryFn: async () => {
            if (!id) return null;
            const endpoint = isServiceEngineer ? `/mobile/expenses/${id}` : `/expenses/${id}`;
            const { data } = await api.get<Expense>(endpoint);
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateExpense = () => {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const isServiceEngineer = user?.role === 'Service Engineer';

    return useMutation({
        mutationFn: async (expenseData: any) => {
            const endpoint = isServiceEngineer ? "/mobile/expenses" : "/expenses";
            const { data } = await api.post(endpoint, expenseData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expense-eligibility"] });
            toast.success("Expense created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create expense");
        },
    });
};

export const useUpdateExpense = () => {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const isServiceEngineer = user?.role === 'Service Engineer';

    return useMutation({
        mutationFn: async ({ id, ...expenseData }: any) => {
            const endpoint = isServiceEngineer ? `/mobile/expenses/${id}` : `/expenses/${id}`;
            const { data } = await api.put(endpoint, expenseData);
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expense-eligibility"] });
            queryClient.invalidateQueries({ queryKey: ["expense", variables.id] });
            if (data?.after) {
                queryClient.setQueryData(["expense", variables.id, isServiceEngineer], data.after);
            }
            toast.success("Expense updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update expense");
        },
    });
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const isServiceEngineer = user?.role === 'Service Engineer';

    return useMutation({
        mutationFn: async (id: string) => {
            const endpoint = isServiceEngineer ? `/mobile/expenses/${id}` : `/expenses/${id}`;
            const { data } = await api.delete(endpoint);
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
            queryClient.invalidateQueries({ queryKey: ["expense-eligibility"] });
        },
    });
};

export interface EligibilityResponse {
    eligible: boolean;
    serviceReports: Array<{
        id: string;
        report_number: string;
        mill_id: string;
        place: string;
        visit_date: string;
        mill_name: string;
    }>;
    installationReports: Array<{
        id: string;
        report_number: string;
        mill_id: string;
        place: string;
        visit_date: string;
        mill_name: string;
    }>;
}

export const useExpenseEligibility = (technicianId?: string, excludeExpenseId?: string) => {
    const user = useAuthStore((state) => state.user);
    const isServiceEngineer = user?.role === 'Service Engineer';

    return useQuery({
        queryKey: ["expense-eligibility", technicianId, excludeExpenseId, isServiceEngineer],
        queryFn: async () => {
            const endpoint = isServiceEngineer 
                ? "/mobile/expenses/eligibility" 
                : "/expenses/eligibility";
            
            const params: any = {};
            if (technicianId) params.technicianId = technicianId;
            if (excludeExpenseId) params.excludeExpenseId = excludeExpenseId;

            const { data } = await api.get<EligibilityResponse>(endpoint, { params });
            return data;
        },
        enabled: isServiceEngineer || !!technicianId,
    });
};
