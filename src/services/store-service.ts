import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Material {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StoreMaterialRelation {
  material: {
    id: string;
    name: string;
  };
}

export interface Store {
  id: string;
  service_engineer_id: string;
  service_engineer: {
    id: string;
    full_name: string;
  };
  customer_id: string;
  customer: {
    id: string;
    name: string;
  };
  quantity: number;
  warranty_status: string;
  frame_number: string;
  return_status: string;
  inflow_status: string;
  barcode?: string;
  provider_name?: string;
  invoice_number?: string;
  created_at: string;
  updated_at: string;
  materials: StoreMaterialRelation[];
}

export interface StoresResponse {
  stores: Store[];
  total: number;
}

export interface MaterialsResponse {
  materials: Material[];
  total: number;
}

// --- Materials Service Hooks ---

export const useMaterials = (params?: { skip?: number; take?: number; search?: string; status?: string }) => {
  return useQuery({
    queryKey: ["materials", params],
    queryFn: async () => {
      const { data } = await api.get<MaterialsResponse>("/materials", { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
};

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (materialData: { name: string; description?: string; status?: string }) => {
      const { data } = await api.post<Material>("/materials", materialData);
      return data;
    },
    onSuccess: (newMaterial) => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success(`Material "${newMaterial.name}" created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create material");
    }
  });
};

// --- Stores Service Hooks ---

export const useStores = (params: {
  skip: number;
  take: number;
  search?: string;
  service_engineer_id?: string;
  customer_id?: string;
  material_id?: string;
  warranty_status?: string;
  return_status?: string;
  inflow_status?: string;
}) => {
  return useQuery({
    queryKey: ["stores", params],
    queryFn: async () => {
      const { data } = await api.get<StoresResponse>("/stores", { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
};

export const useStore = (id: string | null) => {
  return useQuery({
    queryKey: ["store", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<Store>(`/stores/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (storeData: {
      service_engineer_id: string;
      customer_id: string;
      material_ids: string[];
      quantity: number;
      warranty_status: string;
      frame_number: string;
      return_status: string;
      inflow_status: string;
      barcode?: string;
      provider_name?: string;
      invoice_number?: string;
    }) => {
      const { data } = await api.post("/stores", storeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success("Store record created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create store record");
    }
  });
};

export const useUpdateStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...storeData }: {
      id: string;
      service_engineer_id?: string;
      customer_id?: string;
      material_ids?: string[];
      quantity?: number;
      warranty_status?: string;
      frame_number?: string;
      return_status?: string;
      inflow_status?: string;
      barcode?: string;
      provider_name?: string;
      invoice_number?: string;
    }) => {
      const { data } = await api.put(`/stores/${id}`, storeData);
      return data;
    },
    onSuccess: (updatedStore) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.setQueryData(["store", updatedStore.id], updatedStore);
      toast.success("Store record updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update store record");
    }
  });
};

export const useDeleteStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/stores/${id}`);
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["stores"] });
      const previousStores = queryClient.getQueryData<StoresResponse>(["stores"]);

      if (previousStores) {
        queryClient.setQueryData<StoresResponse>(["stores"], {
          ...previousStores,
          stores: previousStores.stores.filter((s) => s.id !== id),
          total: previousStores.total - 1,
        });
      }

      return { previousStores };
    },
    onError: (err, id, context: any) => {
      if (context?.previousStores) {
        queryClient.setQueryData(["stores"], context.previousStores);
      }
      toast.error("Failed to delete store record");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
};
