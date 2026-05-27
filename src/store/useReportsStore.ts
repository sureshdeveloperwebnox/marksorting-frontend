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
    millFilter: string;
    technicianFilter: string;
    setActiveTab: (tab: "services" | "installations" | "expenses") => void;
    setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
    setSearch: (search: string) => void;
    setStatusFilter: (status: string) => void;
    setCategoryFilter: (categoryId: string) => void;
    setDateFrom: (date: string) => void;
    setDateTo: (date: string) => void;
    setMillFilter: (millId: string) => void;
    setTechnicianFilter: (technicianId: string) => void;
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
    millFilter: "",
    technicianFilter: "",
    setActiveTab: (activeTab) =>
        set((state) => ({
            activeTab,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
            search: "",
            statusFilter: "",
            categoryFilter: "",
            dateFrom: "",
            dateTo: "",
            millFilter: "",
            technicianFilter: "",
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
    setMillFilter: (millFilter) =>
        set((state) => ({
            millFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setTechnicianFilter: (technicianFilter) =>
        set((state) => ({
            technicianFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    resetFilters: () =>
        set((state) => ({
            search: "",
            statusFilter: "",
            categoryFilter: "",
            dateFrom: "",
            dateTo: "",
            millFilter: "",
            technicianFilter: "",
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
}));

export default useReportsStore;
