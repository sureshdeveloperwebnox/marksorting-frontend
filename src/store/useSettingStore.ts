import { create } from "zustand";

interface SettingState {
    pagination: { pageIndex: number; pageSize: number };
    search: string;
    groupFilter: string;
    setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
    setSearch: (search: string) => void;
    setGroupFilter: (groupFilter: string) => void;
    resetFilters: () => void;
    // UI State
    deleteId: string | null;
    setDeleteId: (id: string | null) => void;
    isFormDrawerOpen: boolean;
    selectedId: string | null;
    openFormDrawer: (id?: string) => void;
    closeFormDrawer: () => void;
}

const useSettingStore = create<SettingState>((set) => ({
    pagination: { pageIndex: 0, pageSize: 10 },
    search: "",
    groupFilter: "",
    setPagination: (pagination) => set({ pagination }),
    setSearch: (search) =>
        set((state) => ({
            search,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setGroupFilter: (groupFilter) =>
        set((state) => ({
            groupFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    resetFilters: () =>
        set((state) => ({
            search: "",
            groupFilter: "",
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    deleteId: null,
    setDeleteId: (id) => set({ deleteId: id }),
    isFormDrawerOpen: false,
    selectedId: null,
    openFormDrawer: (id?: string) => set({ isFormDrawerOpen: true, selectedId: id ?? null }),
    closeFormDrawer: () => set({ isFormDrawerOpen: false, selectedId: null }),
}));

export default useSettingStore;
