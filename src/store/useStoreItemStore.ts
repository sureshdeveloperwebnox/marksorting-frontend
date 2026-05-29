import { create } from "zustand";

interface StoreItemState {
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  search: string;
  serviceEngineerFilter: string;
  customerFilter: string;
  materialFilter: string;
  warrantyFilter: string;
  returnFilter: string;
  inflowFilter: string;
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  setSearch: (search: string) => void;
  setServiceEngineerFilter: (val: string) => void;
  setCustomerFilter: (val: string) => void;
  setMaterialFilter: (val: string) => void;
  setWarrantyFilter: (val: string) => void;
  setReturnFilter: (val: string) => void;
  setInflowFilter: (val: string) => void;
  resetFilters: () => void;
  // UI State
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  isFormDrawerOpen: boolean;
  selectedStoreId: string | null;
  openFormDrawer: (id?: string) => void;
  closeFormDrawer: () => void;
  // View Details Drawer UI State
  isViewDrawerOpen: boolean;
  selectedViewStoreId: string | null;
  openViewDrawer: (id: string) => void;
  closeViewDrawer: () => void;
}

export const useStoreItemStore = create<StoreItemState>((set) => ({
  pagination: {
    pageIndex: 0,
    pageSize: 10,
  },
  search: "",
  serviceEngineerFilter: "",
  customerFilter: "",
  materialFilter: "",
  warrantyFilter: "",
  returnFilter: "",
  inflowFilter: "",
  setPagination: (pagination) => set({ pagination }),
  setSearch: (search) =>
    set((state) => ({
      search,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setServiceEngineerFilter: (val) =>
    set((state) => ({
      serviceEngineerFilter: val,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setCustomerFilter: (val) =>
    set((state) => ({
      customerFilter: val,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setMaterialFilter: (val) =>
    set((state) => ({
      materialFilter: val,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setWarrantyFilter: (val) =>
    set((state) => ({
      warrantyFilter: val,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setReturnFilter: (val) =>
    set((state) => ({
      returnFilter: val,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  setInflowFilter: (val) =>
    set((state) => ({
      inflowFilter: val,
      pagination: { pageIndex: 0, pageSize: state.pagination.pageSize },
    })),
  resetFilters: () =>
    set({
      pagination: { pageIndex: 0, pageSize: 10 },
      search: "",
      serviceEngineerFilter: "",
      customerFilter: "",
      materialFilter: "",
      warrantyFilter: "",
      returnFilter: "",
      inflowFilter: "",
    }),
  deleteId: null,
  setDeleteId: (id) => set({ deleteId: id }),
  isFormDrawerOpen: false,
  selectedStoreId: null,
  openFormDrawer: (id?: string) =>
    set({ isFormDrawerOpen: true, selectedStoreId: id || null }),
  closeFormDrawer: () =>
    set({ isFormDrawerOpen: false, selectedStoreId: null }),
  isViewDrawerOpen: false,
  selectedViewStoreId: null,
  openViewDrawer: (id) =>
    set({ isViewDrawerOpen: true, selectedViewStoreId: id }),
  closeViewDrawer: () =>
    set({ isViewDrawerOpen: false, selectedViewStoreId: null }),
}));
