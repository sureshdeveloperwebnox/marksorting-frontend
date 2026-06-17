import { create } from "zustand";

interface MillState {
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  search: string;
  statusFilter: string;
  customerFilter: string;
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: string) => void;
  setCustomerFilter: (customerId: string) => void;
  resetFilters: () => void;
  // UI State
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  isFormDrawerOpen: boolean;
  selectedMillId: string | null;
  openFormDrawer: (id?: string) => void;
  closeFormDrawer: () => void;
}

export const useMillStore = create<MillState>((set) => ({
  pagination: {
    pageIndex: 0,
    pageSize: 10,
  },
  search: "",
  statusFilter: "",
  customerFilter: "",
  setPagination: (pagination) => set({ pagination }),
  setSearch: (search) => set((state) => ({ search, pagination: { pageIndex: 0, pageSize: state.pagination.pageSize } })),
  setStatusFilter: (status) => set((state) => ({ statusFilter: status, pagination: { pageIndex: 0, pageSize: state.pagination.pageSize } })),
  setCustomerFilter: (customerId) => set((state) => ({ customerFilter: customerId, pagination: { pageIndex: 0, pageSize: state.pagination.pageSize } })),
  resetFilters: () =>
    set({
      pagination: { pageIndex: 0, pageSize: 10 },
      search: "",
      statusFilter: "",
      customerFilter: "",
    }),
  deleteId: null,
  setDeleteId: (id) => set({ deleteId: id }),
  isFormDrawerOpen: false,
  selectedMillId: null,
  openFormDrawer: (id?: string) => set({ isFormDrawerOpen: true, selectedMillId: id || null }),
  closeFormDrawer: () => set({ isFormDrawerOpen: false, selectedMillId: null }),
}));
