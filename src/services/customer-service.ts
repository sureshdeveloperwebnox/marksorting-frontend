import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface CustomersResponse {
    customers: Customer[];
    total: number;
}

export const useCustomers = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
}) => {
    const user = useAuthStore((state) => state.user);
    const isServiceEngineer = user?.role === 'Service Engineer';

    return useQuery({
        queryKey: ["customers", params, isServiceEngineer],
        queryFn: async () => {
            const endpoint = isServiceEngineer ? "/mobile/customers" : "/customers";
            const { data } = await api.get<CustomersResponse>(endpoint, { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useCustomer = (id: string | null) => {
    return useQuery({
        queryKey: ["customer", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<Customer>(`/customers/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customerData: any) => {
            const { data } = await api.post("/customers", customerData);
            return data;
        },
        onSuccess: (newCustomer) => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.setQueryData(["customer", newCustomer.id], newCustomer);
            toast.success("Customer created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create customer");
        },
    });
};

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...customerData }: any) => {
            const { data } = await api.put(`/customers/${id}`, customerData);
            return data;
        },
        onSuccess: (updatedCustomer) => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.setQueryData(["customer", updatedCustomer.id], updatedCustomer);
            toast.success("Customer updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update customer");
        },
    });
};

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/customers/${id}`);
            return data;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["customers"] });
            const previousCustomers = queryClient.getQueryData<CustomersResponse>(["customers"]);
            if (previousCustomers) {
                queryClient.setQueryData<CustomersResponse>(["customers"], {
                    ...previousCustomers,
                    customers: previousCustomers.customers.filter((c) => c.id !== id),
                    total: previousCustomers.total - 1,
                });
            }
            return { previousCustomers };
        },
        onError: (_err, _id, context: any) => {
            if (context?.previousCustomers) {
                queryClient.setQueryData(["customers"], context.previousCustomers);
            }
            toast.error("Failed to delete customer");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
};
