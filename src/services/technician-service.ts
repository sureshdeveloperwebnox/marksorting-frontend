import api from "@/lib/api";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";

export interface Technician {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface TechniciansResponse {
    technicians: Technician[];
    total: number;
}

export const useTechnicians = (params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
}) => {
    const queryParams = { skip: 0, take: 500, ...params };
    const user = useAuthStore((state) => state.user);
    const isServiceEngineer = user?.role === 'Service Engineer';

    return useQuery({
        queryKey: ["technicians", queryParams, isServiceEngineer],
        queryFn: async () => {
            const endpoint = isServiceEngineer ? "/mobile/technicians" : "/technicians";
            const { data } = await api.get<TechniciansResponse>(endpoint, { params: queryParams });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

