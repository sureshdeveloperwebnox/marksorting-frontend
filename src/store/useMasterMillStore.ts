import { create } from 'zustand';

interface MasterMillState {
  pagination: { pageIndex: number; pageSize: number };
  search: string;
  statusFilter: string;
  stateFilter: string;
  warrantyFilter: string;
  typeFilter: string;
  dateFrom: string;
  dateTo: string;
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: string) => void;
  setStateFilter: (state: string) => void;
  setWarrantyFilter: (warranty: string) => void;
  setTypeFilter: (type: string) => void;
  setDateFrom: (dateFrom: string) => void;
  setDateTo: (dateTo: string) => void;
  resetFilters: () => void;
  // UI State
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  isFormDrawerOpen: boolean;
  selectedMasterMillId: string | null;
  openFormDrawer: (id?: string) => void;
  closeFormDrawer: () => void;
}

export const useMasterMillStore = create<MasterMillState>((set) => ({
  pagination: { pageIndex: 0, pageSize: 10 },
  search: '',
  statusFilter: '',
  stateFilter: '',
  warrantyFilter: '',
  typeFilter: '',
  dateFrom: '',
  dateTo: '',
  setPagination: (pagination) => set({ pagination }),
  setSearch: (search) =>
    set((state) => ({
      search,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setStatusFilter: (status) =>
    set((state) => ({
      statusFilter: status,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setStateFilter: (stateVal) =>
    set((state) => ({
      stateFilter: stateVal,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setWarrantyFilter: (warranty) =>
    set((state) => ({
      warrantyFilter: warranty,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setTypeFilter: (type) =>
    set((state) => ({
      typeFilter: type,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setDateFrom: (dateFrom) =>
    set((state) => ({
      dateFrom,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setDateTo: (dateTo) =>
    set((state) => ({
      dateTo,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  resetFilters: () =>
    set({
      pagination: { pageIndex: 0, pageSize: 10 },
      search: '',
      statusFilter: '',
      stateFilter: '',
      warrantyFilter: '',
      typeFilter: '',
      dateFrom: '',
      dateTo: '',
    }),
  deleteId: null,
  setDeleteId: (id) => set({ deleteId: id }),
  isFormDrawerOpen: false,
  selectedMasterMillId: null,
  openFormDrawer: (id?: string) =>
    set({ isFormDrawerOpen: true, selectedMasterMillId: id || null }),
  closeFormDrawer: () =>
    set({ isFormDrawerOpen: false, selectedMasterMillId: null }),
}));
