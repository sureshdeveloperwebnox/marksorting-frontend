import { create } from "zustand";

interface ExpenseState {
    pagination: {
        pageIndex: number;
        pageSize: number;
    };
    search: string;
    statusFilter: string;
    technicianFilter: string;
    dateFrom: string;
    dateTo: string;
    createdDateFrom: string;
    createdDateTo: string;
    expenseDateFrom: string;
    expenseDateTo: string;
    setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
    setSearch: (search: string) => void;
    setStatusFilter: (statusFilter: string) => void;
    setTechnicianFilter: (technicianFilter: string) => void;
    setDateFrom: (dateFrom: string) => void;
    setDateTo: (dateTo: string) => void;
    setCreatedDateFrom: (date: string) => void;
    setCreatedDateTo: (date: string) => void;
    setExpenseDateFrom: (date: string) => void;
    setExpenseDateTo: (date: string) => void;
    resetFilters: () => void;
    // UI State
    deleteId: string | null;
    setDeleteId: (id: string | null) => void;
    isFormDrawerOpen: boolean;
    selectedId: string | null;
    openFormDrawer: (id?: string) => void;
    closeFormDrawer: () => void;
}

const useExpenseStore = create<ExpenseState>((set) => ({
    pagination: {
        pageIndex: 0,
        pageSize: 10,
    },
    search: "",
    statusFilter: "",
    technicianFilter: "",
    dateFrom: "",
    dateTo: "",
    createdDateFrom: "",
    createdDateTo: "",
    expenseDateFrom: "",
    expenseDateTo: "",
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
    setTechnicianFilter: (technicianFilter) =>
        set((state) => ({
            technicianFilter,
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
    setCreatedDateFrom: (createdDateFrom) =>
        set((state) => ({
            createdDateFrom,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setCreatedDateTo: (createdDateTo) =>
        set((state) => ({
            createdDateTo,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setExpenseDateFrom: (expenseDateFrom) =>
        set((state) => ({
            expenseDateFrom,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setExpenseDateTo: (expenseDateTo) =>
        set((state) => ({
            expenseDateTo,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    resetFilters: () =>
        set((state) => ({
            search: "",
            statusFilter: "",
            technicianFilter: "",
            dateFrom: "",
            dateTo: "",
            createdDateFrom: "",
            createdDateTo: "",
            expenseDateFrom: "",
            expenseDateTo: "",
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    deleteId: null,
    setDeleteId: (id) => set({ deleteId: id }),
    isFormDrawerOpen: false,
    selectedId: null,
    openFormDrawer: (id?: string) => set({ isFormDrawerOpen: true, selectedId: id ?? null }),
    closeFormDrawer: () => set({ isFormDrawerOpen: false, selectedId: null }),
}));

export default useExpenseStore;
