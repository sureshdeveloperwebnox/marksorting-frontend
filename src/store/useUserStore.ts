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
}));
