import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface DashboardStat {
  id: 'customers' | 'installations' | 'services' | 'expenses';
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  variant: 'emerald' | 'blue' | 'rose' | 'amber' | 'violet' | 'cyan' | 'orange';
  subtitle: string;
}

export interface ChartDataPoint {
  name: string;
  [key: string]: any;
}

export interface CombinedTrendPoint {
  name: string;
  services: number;
  installations: number;
  expenses: number;
}

export interface MillStatus {
  id: string;
  name: string;
  type: string;
  rate: number;
  profit: string;
  icon: string;
  color: string;
}

export interface DashboardContext {
  performance: ChartDataPoint[];
  weeklyTrend?: ChartDataPoint[];
  thisMonthTrend?: ChartDataPoint[];
  production: ChartDataPoint[];
  comparison: Array<{ name: string; completed: number; pending: number }>;
  statusList: MillStatus[];
}

export interface DashboardResponse {
  stats: DashboardStat[];
  contexts: {
    customers: DashboardContext;
    installations: DashboardContext;
    services: DashboardContext;
    expenses: DashboardContext;
  };
  expenseRatio: { name: string; value: number; color: string }[];
}

export const useDashboard = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ["dashboard", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const { data } = await api.get<DashboardResponse>(`/dashboard${queryString}`);
      return data;
    },
    refetchInterval: 15000, // 15 seconds auto background sync
  });
};
