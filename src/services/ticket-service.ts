import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export interface TicketServiceEngineer {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    status: string;
}

export interface TicketCustomer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

export interface TicketMill {
    id: string;
    name: string;
}

export interface SupportTicket {
    id: string;
    ticket_number?: string;
    service_engineer_id?: string;
    customer_id?: string;
    mill_id?: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    service_engineer?: TicketServiceEngineer | null;
    customer?: TicketCustomer | null;
    mill?: TicketMill | null;
}

export interface TicketsResponse {
    tickets: SupportTicket[];
    total: number;
}

export const useTickets = (params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
}) => {
    return useQuery({
        queryKey: ["tickets", params],
        queryFn: async () => {
            const { data } = await api.get<TicketsResponse>("/tickets", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const useTicket = (id: string | null) => {
    return useQuery({
        queryKey: ["ticket", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<SupportTicket>(`/tickets/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ticketData: any) => {
            const { data } = await api.post("/tickets", ticketData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            toast.success("Support ticket created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create ticket");
        },
    });
};

export const useUpdateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...ticketData }: any) => {
            const { data } = await api.put(`/tickets/${id}`, ticketData);
            return data;
        },
        onSuccess: (updatedTicket) => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            queryClient.setQueryData(["ticket", updatedTicket.id], updatedTicket);
            toast.success("Ticket updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update ticket");
        },
    });
};

export const useDeleteTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/tickets/${id}`);
            return data;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["tickets"] });

            const queryCache = queryClient.getQueryCache();
            const ticketQueries = queryCache.findAll({ queryKey: ["tickets"] });

            const snapshots: Array<{ queryKey: readonly unknown[]; data: TicketsResponse }> = [];

            for (const query of ticketQueries) {
                const previousData = query.state.data as TicketsResponse | undefined;
                if (previousData) {
                    snapshots.push({ queryKey: query.queryKey, data: previousData });
                    queryClient.setQueryData<TicketsResponse>(query.queryKey, {
                        ...previousData,
                        tickets: previousData.tickets.filter((t) => t.id !== id),
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
            toast.error("Failed to delete ticket");
        },
        onSuccess: () => {
            toast.success("Ticket deleted successfully");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
        },
    });
};

export interface TicketTimeline {
    id: string;
    ticket_id: string;
    user_id: string;
    notes: string;
    status?: string | null;
    timeline_date: string;
    next_follow_up_date?: string | null;
    created_at: string;
    updated_at: string;
    user: {
        id: string;
        full_name: string;
        email: string;
    };
}

export interface CreateTimelineInput {
    notes: string;
    timeline_date?: string;
    next_follow_up_date?: string;
    status?: string;
}

export const useTicketTimelines = (ticketId: string | null) => {
    return useQuery({
        queryKey: ["ticket-timelines", ticketId],
        queryFn: async () => {
            if (!ticketId) return [];
            const { data } = await api.get<TicketTimeline[]>(`/tickets/${ticketId}/timeline`);
            return data;
        },
        enabled: !!ticketId,
    });
};

export const useCreateTicketTimeline = (ticketId: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (timelineData: CreateTimelineInput) => {
            if (!ticketId) throw new Error("Ticket ID is required");
            const { data } = await api.post<TicketTimeline>(`/tickets/${ticketId}/timeline`, timelineData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ticket-timelines", ticketId] });
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
            toast.success("Timeline entry added successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to add timeline entry");
        },
    });
};

