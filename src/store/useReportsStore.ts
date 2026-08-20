import { create } from "zustand";

interface ReportsState {
    activeTab: "services" | "installations" | "expenses" | "master-mills" | "stores" | "mills";
    pagination: {
        pageIndex: number;
        pageSize: number;
    };
    search: string;
    statusFilter: string;
    categoryFilter: string;
    dateFrom: string;
    dateTo: string;
    createdDateFrom: string;
    createdDateTo: string;
    expenseDateFrom: string;
    expenseDateTo: string;
    millFilter: string;
    technicianFilter: string;
    millNameFilter: string;
    frameNoFilter: string;
    refNoFilter: string;
    // Store specific filters
    storeWarrantyFilter: string;
    storeReturnFilter: string;
    storeInflowFilter: string;
    storeCustomerFilter: string;
    storeMaterialFilter: string;

    setActiveTab: (tab: "services" | "installations" | "expenses" | "master-mills" | "stores" | "mills") => void;
    setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
    setSearch: (search: string) => void;
    setStatusFilter: (status: string) => void;
    setCategoryFilter: (categoryId: string) => void;
    setDateFrom: (date: string) => void;
    setDateTo: (date: string) => void;
    setCreatedDateFrom: (date: string) => void;
    setCreatedDateTo: (date: string) => void;
    setExpenseDateFrom: (date: string) => void;
    setExpenseDateTo: (date: string) => void;
    setMillFilter: (millId: string) => void;
    setTechnicianFilter: (technicianId: string) => void;
    setMillNameFilter: (millName: string) => void;
    setFrameNoFilter: (frameNo: string) => void;
    setRefNoFilter: (refNo: string) => void;
    // Store setters
    setStoreWarrantyFilter: (val: string) => void;
    setStoreReturnFilter: (val: string) => void;
    setStoreInflowFilter: (val: string) => void;
    setStoreCustomerFilter: (val: string) => void;
    setStoreMaterialFilter: (val: string) => void;
    
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
    createdDateFrom: "",
    createdDateTo: "",
    expenseDateFrom: "",
    expenseDateTo: "",
    millFilter: "",
    technicianFilter: "",
    millNameFilter: "",
    frameNoFilter: "",
    refNoFilter: "",
    storeWarrantyFilter: "",
    storeReturnFilter: "",
    storeInflowFilter: "",
    storeCustomerFilter: "",
    storeMaterialFilter: "",

    setActiveTab: (activeTab) =>
        set((state) => ({
            activeTab,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
            search: "",
            statusFilter: "",
            categoryFilter: "",
            dateFrom: "",
            dateTo: "",
            createdDateFrom: "",
            createdDateTo: "",
            expenseDateFrom: "",
            expenseDateTo: "",
            millFilter: "",
            technicianFilter: "",
            millNameFilter: "",
            frameNoFilter: "",
            refNoFilter: "",
            storeWarrantyFilter: "",
            storeReturnFilter: "",
            storeInflowFilter: "",
            storeCustomerFilter: "",
            storeMaterialFilter: "",
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
    setMillNameFilter: (millNameFilter) =>
        set((state) => ({
            millNameFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setFrameNoFilter: (frameNoFilter) =>
        set((state) => ({
            frameNoFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setRefNoFilter: (refNoFilter) =>
        set((state) => ({
            refNoFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setStoreWarrantyFilter: (storeWarrantyFilter) =>
        set((state) => ({
            storeWarrantyFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setStoreReturnFilter: (storeReturnFilter) =>
        set((state) => ({
            storeReturnFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setStoreInflowFilter: (storeInflowFilter) =>
        set((state) => ({
            storeInflowFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setStoreCustomerFilter: (storeCustomerFilter) =>
        set((state) => ({
            storeCustomerFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
    setStoreMaterialFilter: (storeMaterialFilter) =>
        set((state) => ({
            storeMaterialFilter,
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),

    resetFilters: () =>
        set((state) => ({
            search: "",
            statusFilter: "",
            categoryFilter: "",
            dateFrom: "",
            dateTo: "",
            createdDateFrom: "",
            createdDateTo: "",
            expenseDateFrom: "",
            expenseDateTo: "",
            millFilter: "",
            technicianFilter: "",
            millNameFilter: "",
            frameNoFilter: "",
            refNoFilter: "",
            storeWarrantyFilter: "",
            storeReturnFilter: "",
            storeInflowFilter: "",
            storeCustomerFilter: "",
            storeMaterialFilter: "",
            pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
        })),
}));

export default useReportsStore;
