import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Mill {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  customer_id?: string;
  customer?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface MillsResponse {
  mills: Mill[];
  total: number;
}

export const useMills = (params: { skip: number; take: number; search?: string; status?: string; customer_id?: string }) => {
  return useQuery({
    queryKey: ["mills", params],
    queryFn: async () => {
      const { data } = await api.get<MillsResponse>("/mills", { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
};

export const useMill = (id: string | null) => {
  return useQuery({
    queryKey: ["mill", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<Mill>(`/mills/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateMill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (millData: any) => {
      const { data } = await api.post("/mills", millData);
      return data;
    },
    onSuccess: (newMill) => {
      queryClient.invalidateQueries({ queryKey: ["mills"] });
      queryClient.setQueryData(["mill", newMill.id], newMill);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create mill");
    }
  });
};

export const useUpdateMill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...millData }: any) => {
      const { data } = await api.put(`/mills/${id}`, millData);
      return data;
    },
    onSuccess: (updatedMill) => {
      queryClient.invalidateQueries({ queryKey: ["mills"] });
      queryClient.setQueryData(["mill", updatedMill.id], updatedMill);
      toast.success("Mill updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update mill");
    }
  });
};

export const useDeleteMill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/mills/${id}`);
      return data;
    },
    // Optimistic Update for "Instant Performance"
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["mills"] });
      const previousMills = queryClient.getQueryData<MillsResponse>(["mills"]);

      if (previousMills) {
        queryClient.setQueryData<MillsResponse>(["mills"], {
          ...previousMills,
          mills: previousMills.mills.filter((m) => m.id !== id),
          total: previousMills.total - 1,
        });
      }

      return { previousMills };
    },
    onError: (err, id, context: any) => {
      if (context?.previousMills) {
        queryClient.setQueryData(["mills"], context.previousMills);
      }
      toast.error("Failed to delete mill");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["mills"] });
    },
  });
};
