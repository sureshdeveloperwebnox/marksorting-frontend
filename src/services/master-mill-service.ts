import api from '@/lib/api';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'sonner';

export interface MasterMill {
  id: string;
  invoice_no: string;
  invoice_date?: string;
  ref_no?: string;
  mill_id?: string;
  mill?: { id: string; name: string };
  address?: string;
  place?: string;
  state?: string;
  phone_no?: string;
  mc_model?: string;
  frame_no?: string;
  warranty_years?: number;
  warranty_months?: number;
  installation_date?: string;
  warranty_closing_date?: string;
  all_warranty?: string;
  amc_starting_date?: string;
  amc_period?: number;
  amc_particular?: string;
  amc_closing_date?: string;
  amc_amount?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MasterMillsResponse {
  masterMills: MasterMill[];
  total: number;
}

export interface MasterMillStats {
  total: number;
  underWarranty: number;
  underAmc: number;
  nonWarranty: number;
}

export const useMasterMills = (params: {
  skip: number;
  take: number;
  search?: string;
  status?: string;
  state?: string;
  all_warranty?: string;
  mill_id?: string;
}) => {
  return useQuery({
    queryKey: ['master-mills', params],
    queryFn: async () => {
      const { data } = await api.get<MasterMillsResponse>('/master-mills', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
};

export const useMasterMill = (id: string | null) => {
  return useQuery({
    queryKey: ['master-mill', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<MasterMill>(`/master-mills/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useMasterMillStats = () => {
  return useQuery({
    queryKey: ['master-mills-stats'],
    queryFn: async () => {
      const { data } = await api.get<MasterMillStats>('/master-mills/stats');
      return data;
    },
    staleTime: 60_000,
  });
};

export const useCreateMasterMill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (millData: any) => {
      const { data } = await api.post('/master-mills', millData);
      return data;
    },
    onSuccess: (newRecord) => {
      queryClient.invalidateQueries({ queryKey: ['master-mills'] });
      queryClient.invalidateQueries({ queryKey: ['master-mills-stats'] });
      queryClient.setQueryData(['master-mill', newRecord.id], newRecord);
      toast.success('Master mill record created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create master mill record');
    },
  });
};

export const useUpdateMasterMill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...millData }: any) => {
      const { data } = await api.put(`/master-mills/${id}`, millData);
      return data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['master-mills'] });
      queryClient.invalidateQueries({ queryKey: ['master-mills-stats'] });
      const record = updated?.after || updated;
      if (record?.id) {
        queryClient.setQueryData(['master-mill', record.id], record);
      }
      toast.success('Master mill record updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update master mill record');
    },
  });
};

export const useDeleteMasterMill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/master-mills/${id}`);
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['master-mills'] });
      const previous = queryClient.getQueryData<MasterMillsResponse>(['master-mills']);
      if (previous) {
        queryClient.setQueryData<MasterMillsResponse>(['master-mills'], {
          ...previous,
          masterMills: previous.masterMills.filter((m) => m.id !== id),
          total: previous.total - 1,
        });
      }
      return { previous };
    },
    onError: (_err, _id, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['master-mills'], context.previous);
      }
      toast.error('Failed to delete master mill record');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['master-mills'] });
      queryClient.invalidateQueries({ queryKey: ['master-mills-stats'] });
    },
  });
};
