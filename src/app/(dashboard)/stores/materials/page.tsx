"use client";

import * as React from "react";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaterialFormDrawer } from "@/components/forms/material-form-drawer";
import { useMaterials, useDeleteMaterial, Material } from "@/services/store-service";

export default function MaterialsPage() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [selectedMaterial, setSelectedMaterial] = React.useState<Material | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Material | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useMaterials({
    skip: 0,
    take: 100,
    search: debouncedSearch || undefined,
  });

  const deleteMaterial = useDeleteMaterial();
  const materials = data?.materials || [];

  const handleOpenAdd = () => {
    setSelectedMaterial(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (material: Material) => {
    setSelectedMaterial(material);
    setIsDrawerOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteMaterial.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Material Master
              </h1>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Manage material names, units of measurement (UOM), and auto-populated return items
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="h-11 px-5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-white font-bold shadow-lg shadow-primary/20 flex items-center gap-2 shrink-0"
        >
          <Plus size={18} />
          Add Material
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by material name or UOM..."
            className="pl-10 h-10 rounded-xl"
          />
        </div>

        <div className="text-xs font-bold text-gray-500">
          Total Records: <span className="text-primary font-black">{data?.total || 0}</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
            <span className="text-sm font-bold">Loading materials...</span>
          </div>
        ) : materials.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <Package size={40} className="text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-bold text-gray-500">No material records found</p>
            <Button onClick={handleOpenAdd} variant="outline" className="rounded-xl font-bold text-xs">
              <Plus size={14} className="mr-1.5" /> Create First Material
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50/70 dark:bg-white/5">
              <TableRow className="h-10">
                <TableHead className="px-5 text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Material Name
                </TableHead>
                <TableHead className="px-4 text-[11px] font-black uppercase tracking-wider text-gray-500">
                  UOM
                </TableHead>
                <TableHead className="px-4 text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Description / Notes
                </TableHead>
                <TableHead className="px-4 text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Status
                </TableHead>
                <TableHead className="px-5 text-right text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m) => (
                <TableRow key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Package size={16} />
                      </div>
                      <span>{m.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Badge variant="outline" className="font-extrabold text-[11px] bg-primary/5 text-primary border-primary/20 px-2.5 py-0.5 rounded-lg">
                      <Ruler size={11} className="mr-1 inline" />
                      {m.uom || "PCS"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-xs text-gray-500 max-w-xs truncate">
                    {m.description || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {m.status === "ACTIVE" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 text-[10px] font-extrabold rounded-md px-2 py-0.5">
                        <CheckCircle2 size={11} className="mr-1 inline" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 dark:bg-white/10 text-gray-500 text-[10px] font-extrabold rounded-md px-2 py-0.5">
                        <XCircle size={11} className="mr-1 inline" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(m)}
                        className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTarget(m)}
                        className="h-8 w-8 rounded-lg hover:bg-rose-50 text-rose-500 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Material Form Drawer */}
      <MaterialFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        material={selectedMaterial}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Material Record?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete material &quot;{deleteTarget.name}&quot;? This action can be safely reverted by system administrators.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button onClick={handleDeleteConfirm} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
                Delete Material
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
