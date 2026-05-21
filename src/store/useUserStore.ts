import { create } from "zustand";

interface UserState {
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  search: string;
  statusFilter: string;
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: string) => void;
  resetFilters: () => void;
  // UI State
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  isFormDrawerOpen: boolean;
  selectedUserId: string | null;
  openFormDrawer: (id?: string) => void;
  closeFormDrawer: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  pagination: {
    pageIndex: 0,
    pageSize: 5,
  },
  search: "",
  statusFilter: "",
  setPagination: (pagination) => set({ pagination }),
  setSearch: (search) => set((state) => ({ search, pagination: { pageIndex: 0, pageSize: state.pagination.pageSize } })),
  setStatusFilter: (status) => set((state) => ({ statusFilter: status, pagination: { pageIndex: 0, pageSize: state.pagination.pageSize } })),
  resetFilters: () =>
    set({
      pagination: { pageIndex: 0, pageSize: 5 },
      search: "",
      statusFilter: "",
    }),
  deleteId: null,
  setDeleteId: (id) => set({ deleteId: id }),
  isFormDrawerOpen: false,
  selectedUserId: null,
  openFormDrawer: (id?: string) => set({ isFormDrawerOpen: true, selectedUserId: id || null }),
  closeFormDrawer: () => set({ isFormDrawerOpen: false, selectedUserId: null }),
}));
