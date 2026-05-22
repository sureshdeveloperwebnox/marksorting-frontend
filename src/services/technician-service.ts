import api from "@/lib/api";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

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
    return useQuery({
        queryKey: ["technicians", queryParams],
        queryFn: async () => {
            const { data } = await api.get<TechniciansResponse>("/technicians", { params: queryParams });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};
