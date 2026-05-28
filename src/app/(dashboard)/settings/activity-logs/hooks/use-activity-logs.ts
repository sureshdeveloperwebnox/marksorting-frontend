import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { QueryActivityLogsDto, ActivityLogsResponse, ActivityStats } from '../types/activity-log.types';

export function useActivityLogs(filters: QueryActivityLogsDto) {
  const logsQuery = useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: async (): Promise<ActivityLogsResponse> => {
      const params = new URLSearchParams();
      if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
      if (filters.take !== undefined) params.append('take', filters.take.toString());
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.action) params.append('action', filters.action);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.entity_id) params.append('entity_id', filters.entity_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/activity-logs?${params.toString()}`);
      return response.data;
    },
  });

  const statsQuery = useQuery({
    queryKey: ['activity-logs-stats', filters.start_date, filters.end_date],
    queryFn: async (): Promise<ActivityStats> => {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await api.get(`/activity-logs/stats?${params.toString()}`);
      return response.data;
    },
  });

  return {
    logs: logsQuery.data,
    stats: statsQuery.data,
    isLoading: logsQuery.isLoading,
    isStatsLoading: statsQuery.isLoading,
    error: logsQuery.error || statsQuery.error,
    refetch: () => {
      logsQuery.refetch();
      statsQuery.refetch();
    },
  };
}
