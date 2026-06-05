import { create } from 'zustand';
import { format, subDays } from 'date-fns';

export interface DateRange {
  startDate: string; // 'yyyy-MM-dd' format
  endDate: string;   // 'yyyy-MM-dd' format
  label: string;     // Preset label, e.g. 'Last 30 Days'
}

interface DashboardFilterState {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  resetDateRange: () => void;
}

const getDefaultDateRange = (): DateRange => {
  const end = new Date();
  const start = subDays(end, 30); // Last 30 Days as default
  
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    label: 'Last 30 Days',
  };
};

export const useDashboardFilterStore = create<DashboardFilterState>((set) => ({
  dateRange: getDefaultDateRange(),
  setDateRange: (dateRange) => set({ dateRange }),
  resetDateRange: () => set({ dateRange: getDefaultDateRange() }),
}));
