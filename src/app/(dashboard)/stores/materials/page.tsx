"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Ruler,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableTabs, TableTab } from "@/components/ui/table-tabs";
import { MaterialFormDrawer } from "@/components/forms/material-form-drawer";
import { ViewDetailsDrawer } from "@/components/ui/view-details-drawer";
import {
  useMaterials,
  useDeleteMaterial,
  Material,
} from "@/services/store-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { RouteGuard } from "@/components/guards/route-guard";

export default function MaterialsPage() {
  // Pagination & Filter States
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusTab, setStatusTab] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Drawer & Modal States
  const [isFormDrawerOpen, setIsFormDrawerOpen] = React.useState(false);
  const [selectedMaterial, setSelectedMaterial] = React.useState<Material | null>(null);
  const [viewMaterial, setViewMaterial] = React.useState<Material | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Material | null>(null);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Main data query
  const { data, isLoading, isFetching, refetch } = useMaterials({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search: debouncedSearch || undefined,
    status: statusTab === "ALL" ? undefined : statusTab,
  });

  // Tab counts query
  const { data: allData } = useMaterials({
    skip: 0,
    take: 1,
    search: debouncedSearch || undefined,
  });
  const { data: activeData } = useMaterials({
    skip: 0,
    take: 1,
    search: debouncedSearch || undefined,
    status: "ACTIVE",
  });
  const { data: inactiveData } = useMaterials({
    skip: 0,
    take: 1,
    search: debouncedSearch || undefined,
    status: "INACTIVE",
  });

  const deleteMaterial = useDeleteMaterial();
  const materials = data?.materials || [];
  const totalCount = data?.total || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const tabs: TableTab[] = [
    {
      value: "ALL",
      label: "ALL",
      count: allData?.total || 0,
      color: "primary",
    },
    {
      value: "ACTIVE",
      label: "ACTIVE",
      count: activeData?.total || 0,
      color: "emerald",
    },
    {
      value: "INACTIVE",
      label: "INACTIVE",
      count: inactiveData?.total || 0,
      color: "gray",
    },
  ];

  const handleTabChange = (val: string) => {
    setStatusTab(val as "ALL" | "ACTIVE" | "INACTIVE");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleOpenAdd = () => {
    setSelectedMaterial(null);
    setIsFormDrawerOpen(true);
  };

  const handleOpenEdit = (material: Material) => {
    setSelectedMaterial(material);
    setIsFormDrawerOpen(true);
  };

  const handleOpenView = (material: Material) => {
    setViewMaterial(material);
    setIsViewDrawerOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteMaterial.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // TanStack Table Column Definitions
  const columns = React.useMemo<ColumnDef<Material>[]>(
    () => [
      {
        accessorKey: "name",
        header: "MATERIAL NAME",
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Package size={16} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {m.name}
                </span>
                {m.description && (
                  <span className="text-[11px] text-gray-400 truncate max-w-xs block sm:hidden">
                    {m.description}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "uom",
        header: "UOM",
        cell: ({ row }) => {
          const uom = row.original.uom || "PCS";
          return (
            <Badge
              variant="outline"
              className="font-extrabold text-[11px] bg-primary/5 text-primary border-primary/20 px-2.5 py-0.5 rounded-lg inline-flex items-center"
            >
              <Ruler size={11} className="mr-1" />
              {uom}
            </Badge>
          );
        },
      },
      {
        accessorKey: "description",
        header: "DESCRIPTION / NOTES",
        cell: ({ row }) => {
          const desc = row.original.description;
          return (
            <span className="text-xs text-gray-500 dark:text-gray-400 max-w-md truncate block">
              {desc || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ row }) => {
          const status = (row.original.status || "ACTIVE").toUpperCase();
          const isActive = status === "ACTIVE";
          return (
            <Badge
              className={`text-[10px] font-extrabold rounded-md px-2.5 py-0.5 inline-flex items-center border ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10"
              }`}
            >
              {isActive ? (
                <CheckCircle2 size={11} className="mr-1.5" />
              ) : (
                <XCircle size={11} className="mr-1.5" />
              )}
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "CREATED DATE",
        cell: ({ row }) => {
          const dateStr = row.original.created_at;
          if (!dateStr) return <span className="text-xs text-gray-400">—</span>;
          try {
            return (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {format(new Date(dateStr), "dd MMM yyyy")}
              </span>
            );
          } catch {
            return <span className="text-xs text-gray-400">—</span>;
          }
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">ACTIONS</div>,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleOpenView(m)}
                className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
                title="View Details"
              >
                <Eye size={14} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleOpenEdit(m)}
                className="h-8 w-8 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                title="Edit Material"
              >
                <Edit2 size={14} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeleteTarget(m)}
                className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500"
                title="Delete Material"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <RouteGuard requiredPermission="materials.view">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent flex items-center justify-center text-primary border border-primary/20 shadow-sm">
              <Package size={22} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Material List
                </h1>
                <Badge
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black rounded-md px-2 py-0.5"
                >
                  {totalCount} Items
                </Badge>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                Manage material names, units of measurement (UOM), and returnable catalog items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="h-10 w-10 rounded-xl border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-transform active:scale-95"
              title="Refresh List"
              disabled={isFetching}
            >
              <RefreshCw
                size={16}
                className={isFetching ? "animate-spin text-primary" : "text-gray-600 dark:text-gray-300"}
              />
            </Button>

            <Button
              onClick={handleOpenAdd}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus size={18} />
              Add Material
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="pt-1">
          <TableTabs
            tabs={tabs}
            activeValue={statusTab}
            onChange={handleTabChange}
          />
        </div>

        {/* DataTable with Server-Side Pagination & Controls */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={materials}
            loading={isLoading}
            pageCount={pageCount}
            totalCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            onGlobalFilterChange={setSearch}
            globalFilterValue={search}
            searchPlaceholder="Search by material name, UOM, or description..."
            entityName="materials"
          />
        </div>

        {/* Material Form Drawer (Add / Edit) */}
        <MaterialFormDrawer
          isOpen={isFormDrawerOpen}
          onClose={() => setIsFormDrawerOpen(false)}
          material={selectedMaterial}
        />

        {/* View Details Drawer */}
        <ViewDetailsDrawer
          isOpen={isViewDrawerOpen}
          onClose={() => setIsViewDrawerOpen(false)}
          title="Material Details"
          description="Detailed specifications and configuration for this material catalog item."
          sections={[
            {
              title: "Material Information",
              items: [
                {
                  label: "Material Name",
                  value: viewMaterial?.name || "—",
                  icon: Layers,
                },
                {
                  label: "Unit of Measurement (UOM)",
                  value: viewMaterial?.uom || "PCS",
                  icon: Ruler,
                },
                {
                  label: "Status",
                  value: (
                    <Badge
                      className={`text-[10px] font-extrabold rounded-md px-2 py-0.5 border ${
                        (viewMaterial?.status || "ACTIVE").toUpperCase() === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {(viewMaterial?.status || "ACTIVE").toUpperCase()}
                    </Badge>
                  ),
                  icon: Sparkles,
                },
              ],
            },
            {
              title: "Description & Notes",
              items: [
                {
                  label: "Description",
                  value: viewMaterial?.description || "No description provided for this material item.",
                  fullWidth: true,
                },
              ],
            },
            {
              title: "System Metadata",
              items: [
                {
                  label: "Record ID",
                  value: viewMaterial?.id || "—",
                },
                {
                  label: "Created On",
                  value: viewMaterial?.created_at
                    ? format(new Date(viewMaterial.created_at), "dd MMM yyyy, hh:mm a")
                    : "—",
                  icon: Calendar,
                },
                {
                  label: "Last Updated",
                  value: viewMaterial?.updated_at
                    ? format(new Date(viewMaterial.updated_at), "dd MMM yyyy, hh:mm a")
                    : "—",
                  icon: Calendar,
                },
              ],
            },
          ]}
          actions={[
            {
              label: "Edit Material",
              icon: <Edit2 size={14} />,
              onClick: () => {
                setIsViewDrawerOpen(false);
                if (viewMaterial) handleOpenEdit(viewMaterial);
              },
              variant: "outline",
            },
          ]}
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 shadow-2xl">
            <DialogHeader className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
                <Trash2 size={24} />
              </div>
              <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
                Delete Material Record?
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete material{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  &quot;{deleteTarget?.name}&quot;
                </span>
                ? This will remove it from the material catalog, but existing store transaction records will retain their history.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end pt-4 border-t border-gray-100 dark:border-white/5">
              <Button
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs gap-2 shadow-lg shadow-rose-600/20"
              >
                <Trash2 size={14} /> Delete Material
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
