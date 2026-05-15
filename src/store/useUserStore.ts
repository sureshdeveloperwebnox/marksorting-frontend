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
    pageSize: 10,
  },
  search: "",
  statusFilter: "",
  setPagination: (pagination) => set({ pagination }),
  setSearch: (search) => set({ search, pagination: { pageIndex: 0, pageSize: 10 } }),
  setStatusFilter: (status) => set({ statusFilter: status, pagination: { pageIndex: 0, pageSize: 10 } }),
  resetFilters: () =>
    set({
      pagination: { pageIndex: 0, pageSize: 10 },
      search: "",
      statusFilter: "",
    }),
  deleteId: null,
  setDeleteId: (id) => set({ deleteId: id }),
}));
