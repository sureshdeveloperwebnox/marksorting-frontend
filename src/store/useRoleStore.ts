import { create } from "zustand";

interface RoleState {
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  search: string;
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
  // UI State
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  isFormDrawerOpen: boolean;
  selectedRoleId: string | null;
  openFormDrawer: (id?: string) => void;
  closeFormDrawer: () => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  pagination: {
    pageIndex: 0,
    pageSize: 5,
  },
  search: "",
  setPagination: (pagination) => set({ pagination }),
  setSearch: (search) => set((state) => ({ search, pagination: { pageIndex: 0, pageSize: state.pagination.pageSize } })),
  resetFilters: () =>
    set({
      pagination: { pageIndex: 0, pageSize: 5 },
      search: "",
    }),
  deleteId: null,
  setDeleteId: (id) => set({ deleteId: id }),
  isFormDrawerOpen: false,
  selectedRoleId: null,
  openFormDrawer: (id?: string) => set({ isFormDrawerOpen: true, selectedRoleId: id || null }),
  closeFormDrawer: () => set({ isFormDrawerOpen: false, selectedRoleId: null }),
}));
