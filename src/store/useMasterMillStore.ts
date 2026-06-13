import { create } from 'zustand';

interface MasterMillState {
  pagination: { pageIndex: number; pageSize: number };
  search: string;
  statusFilter: string;
  stateFilter: string;
  warrantyFilter: string;
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: string) => void;
  setStateFilter: (state: string) => void;
  setWarrantyFilter: (warranty: string) => void;
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
  pagination: { pageIndex: 0, pageSize: 15 },
  search: '',
  statusFilter: '',
  stateFilter: '',
  warrantyFilter: '',
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
  resetFilters: () =>
    set({ pagination: { pageIndex: 0, pageSize: 15 }, search: '', statusFilter: '', stateFilter: '', warrantyFilter: '' }),
  deleteId: null,
  setDeleteId: (id) => set({ deleteId: id }),
  isFormDrawerOpen: false,
  selectedMasterMillId: null,
  openFormDrawer: (id?: string) =>
    set({ isFormDrawerOpen: true, selectedMasterMillId: id || null }),
  closeFormDrawer: () =>
    set({ isFormDrawerOpen: false, selectedMasterMillId: null }),
}));
