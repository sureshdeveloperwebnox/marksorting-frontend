import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  account_status: string;
  role: {
    id: string;
    name: string;
  };
  profile_image?: string;
  profile_image_url?: string;
  created_at: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export const useUsers = (params: { skip: number; take: number; search?: string; status?: string }) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const { data } = await api.get<UsersResponse>("/users", { params });
      return data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: any) => {
      const { data } = await api.post("/users", userData);
      return data;
    },
    onSuccess: (newUser) => {
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Pre-populate the cache for the individual user
      queryClient.setQueryData(["user", newUser.id], newUser);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...userData }: any) => {
      const { data } = await api.put(`/users/${id}`, userData);
      return data;
    },
    onSuccess: (updatedUser) => {
      // Invalidate list and specific user
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.setQueryData(["user", updatedUser.id], updatedUser);
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/users/${id}`);
      return data;
    },
    // Optimistic Update for "Instant Performance"
    onMutate: async (id) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["users"] });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<UsersResponse>(["users"]);

      // Optimistically update to the new value
      if (previousUsers) {
        queryClient.setQueryData<UsersResponse>(["users"], {
          ...previousUsers,
          users: previousUsers.users.filter((u) => u.id !== id),
          total: previousUsers.total - 1,
        });
      }

      return { previousUsers };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, id, context: any) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      toast.error("Failed to delete user");
    },
    // Always refetch after error or success to ensure we are in sync with the server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await api.get<Role[]>("/users/meta/roles");
      return data;
    },
  });
};

export const useUser = (id: string | null) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<User>(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
};
