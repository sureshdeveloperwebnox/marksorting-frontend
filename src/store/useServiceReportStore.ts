import { create } from "zustand";

interface ServiceReportState {
    pagination: {
        pageIndex: number;
        pageSize: number;
    };
    search: string;
    statusFilter: string;
    categoryFilter: string;
    dateFrom: string;
    dateTo: string;
    setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
    setSearch: (search: string) => void;
    setStatusFilter: (statusFilter: string) => void;
    setCategoryFilter: (categoryFilter: string) => void;
    setDateFrom: (dateFrom: string) => void;
    setDateTo: (dateTo: string) => void;
    resetFilters: () => void;
    // UI State
    deleteId: string | null;
    setDeleteId: (id: string | null) => void;
    isFormDrawerOpen: boolean;
    selectedId: string | null;
    openFormDrawer: (id?: string) => void;
    closeFormDrawer: () => void;
}

const useServiceReportStore = create<ServiceReportState>((set) => ({
    pagination: {
        pageIndex: 0,
        pageSize: 10,
    },
    search: "",
    statusFilter: "",
    categoryFilter: "",
    dateFrom: "",
    dateTo: "",
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
    setCategoryFilter: (categoryFilter) =>
        set((state) => ({
            categoryFilter,
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
        set((state) => ({
            search: "",
            statusFilter: "",
            categoryFilter: "",
            dateFrom: "",
            dateTo: "",
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    deleteId: null,
    setDeleteId: (id) => set({ deleteId: id }),
    isFormDrawerOpen: false,
    selectedId: null,
    openFormDrawer: (id?: string) => set({ isFormDrawerOpen: true, selectedId: id ?? null }),
    closeFormDrawer: () => set({ isFormDrawerOpen: false, selectedId: null }),
}));

export default useServiceReportStore;
