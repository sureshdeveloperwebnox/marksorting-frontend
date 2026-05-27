import { create } from "zustand";

interface ReportsState {
    activeTab: "services" | "installations" | "expenses";
    pagination: {
        pageIndex: number;
        pageSize: number;
    };
    search: string;
    statusFilter: string;
    categoryFilter: string;
    dateFrom: string;
    dateTo: string;
    setActiveTab: (tab: "services" | "installations" | "expenses") => void;
    setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
    setSearch: (search: string) => void;
    setStatusFilter: (status: string) => void;
    setCategoryFilter: (categoryId: string) => void;
    setDateFrom: (date: string) => void;
    setDateTo: (date: string) => void;
    resetFilters: () => void;
}

const useReportsStore = create<ReportsState>((set) => ({
    activeTab: "services",
    pagination: {
        pageIndex: 0,
        pageSize: 10,
    },
    search: "",
    statusFilter: "",
    categoryFilter: "",
    dateFrom: "",
    dateTo: "",
    setActiveTab: (activeTab) =>
        set((state) => ({
            activeTab,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
            search: "",
            statusFilter: "",
            categoryFilter: "",
            dateFrom: "",
            dateTo: "",
        })),
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
}));

export default useReportsStore;
