import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Role {
  id: string;
  name: string;
  description?: string;
  _count?: {
    users: number;
  };
  created_at: string;
  updated_at: string;
}

export interface RolesResponse {
  roles: Role[];
  total: number;
}

export const useRoles = (params: { skip: number; take: number; search?: string }) => {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: async () => {
      const { data } = await api.get<RolesResponse>("/roles", { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleData: any) => {
      const { data } = await api.post("/roles", roleData);
      return data;
    },
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.setQueryData(["role", newRole.id], newRole);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create role");
    }
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...roleData }: any) => {
      const { data } = await api.put(`/roles/${id}`, roleData);
      return data;
    },
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.setQueryData(["role", updatedRole.id], updatedRole);
      toast.success("Role updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/roles/${id}`);
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["roles"] });
      const previousRoles = queryClient.getQueryData<RolesResponse>(["roles"]);

      if (previousRoles) {
        queryClient.setQueryData<RolesResponse>(["roles"], {
          ...previousRoles,
          roles: previousRoles.roles.filter((r) => r.id !== id),
          total: previousRoles.total - 1,
        });
      }

      return { previousRoles };
    },
    onError: (err, id, context: any) => {
      if (context?.previousRoles) {
        queryClient.setQueryData(["roles"], context.previousRoles);
      }
      toast.error("Failed to delete role");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

export const useRole = (id: string | null) => {
  return useQuery({
    queryKey: ["role", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<Role>(`/roles/${id}`);
      return data;
    },
    enabled: !!id,
  });
};
