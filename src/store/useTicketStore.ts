import { create } from "zustand";

interface TicketState {
    pagination: { pageIndex: number; pageSize: number };
    search: string;
    statusFilter: string;
    priorityFilter: string;
    setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
    setSearch: (search: string) => void;
    setStatusFilter: (statusFilter: string) => void;
    setPriorityFilter: (priorityFilter: string) => void;
    resetFilters: () => void;
    // UI State
    deleteId: string | null;
    setDeleteId: (id: string | null) => void;
    isFormDrawerOpen: boolean;
    selectedId: string | null;
    openFormDrawer: (id?: string) => void;
    closeFormDrawer: () => void;
}

const useTicketStore = create<TicketState>((set) => ({
    pagination: { pageIndex: 0, pageSize: 10 },
    search: "",
    statusFilter: "",
    priorityFilter: "",
    setPagination: (pagination) => set({ pagination }),
    setSearch: (search) =>
        set((state) => ({
            search,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setStatusFilter: (statusFilter) =>
        set((state) => ({
            statusFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setPriorityFilter: (priorityFilter) =>
        set((state) => ({
            priorityFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    resetFilters: () =>
        set((state) => ({
            search: "",
            statusFilter: "",
            priorityFilter: "",
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    deleteId: null,
    setDeleteId: (id) => set({ deleteId: id }),
    isFormDrawerOpen: false,
    selectedId: null,
    openFormDrawer: (id?: string) => set({ isFormDrawerOpen: true, selectedId: id ?? null }),
    closeFormDrawer: () => set({ isFormDrawerOpen: false, selectedId: null }),
}));

export default useTicketStore;
