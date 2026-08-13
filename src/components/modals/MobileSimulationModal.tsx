"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Smartphone,
  Search,
  Package,
  Barcode,
  ChevronDown,
  Hash,
  CheckCircle2,
  ArrowLeftRight,
  RefreshCw,
  Copy,
  X,
  Loader2,
  Save,
} from "lucide-react";
import { useStores, useMaterials, useUpdateStore, Store, Material } from "@/services/store-service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── helpers ─────────────────────────────────────────── */

interface ParsedSerial {
  barcode: string;
  used: boolean;
}

const extractCleanRemarks = (remarks?: string | null): string => {
  if (!remarks) return "";
  let cleaned = remarks;
  const serialIdx = cleaned.search(/\(?\s*Serial Nos:/i);
  if (serialIdx !== -1) {
    cleaned = cleaned.substring(0, serialIdx);
  }
  const stIdx = cleaned.search(/\(?\s*Service Type:/i);
  if (stIdx !== -1) {
    cleaned = cleaned.substring(0, stIdx);
  }
  cleaned = cleaned.replace(/[\(\)\|\s,]+$/, "").trim();
  return cleaned;
};

const parseSerialMapFromRemarks = (
  remarks?: string | null
): Record<string, ParsedSerial[]> => {
  if (!remarks) return {};
  const map: Record<string, ParsedSerial[]> = {};
  
  const serialNosIdx = remarks.indexOf("Serial Nos:");
  if (serialNosIdx === -1) return {};

  let serialStr = remarks.substring(serialNosIdx + "Serial Nos:".length);
  const stIdx = serialStr.indexOf("Service Type:");
  if (stIdx !== -1) {
    serialStr = serialStr.substring(0, stIdx);
  }
  serialStr = serialStr.replace(/[\)\|\s]+$/, "").trim();

  const parts = serialStr.split("|");
  parts.forEach((part) => {
    const colIdx = part.indexOf(":");
    if (colIdx !== -1) {
      const matName = part.substring(0, colIdx).trim();
      const serialsStr = part.substring(colIdx + 1).trim();
      const bracketMatch = serialsStr.match(/\[(.*?)\]/);
      if (bracketMatch && bracketMatch[1]) {
        const serials = bracketMatch[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => {
            const isUsed = /\(USED\)/i.test(s);
            const cleanCode = s.replace(/\s*\(USED\)/gi, "").trim();
            return { barcode: cleanCode, used: isUsed };
          });
        map[matName] = serials;
      }
    }
  });

  return map;
};

const constructUpdatedRemarks = (
  existingRemarks: string | null | undefined,
  currentMaterialName: string,
  tableRows: BarcodeRow[],
  serviceType: "Replacement" | "Acknowledgement"
): string => {
  const cleanRemarks = extractCleanRemarks(existingRemarks);
  const currentSerialMap = parseSerialMapFromRemarks(existingRemarks);

  currentSerialMap[currentMaterialName] = tableRows.map((r) => ({
    barcode: r.barcode,
    used: r.used,
  }));

  const serialSummaries: string[] = [];
  Object.entries(currentSerialMap).forEach(([matName, items]) => {
    if (items.length > 0) {
      const itemStrs = items.map((it) => (it.used ? `${it.barcode} (USED)` : it.barcode));
      serialSummaries.push(`${matName}: [${itemStrs.join(", ")}]`);
    }
  });

  const extraParts: string[] = [];
  if (serialSummaries.length > 0) {
    extraParts.push(`Serial Nos: ${serialSummaries.join(" | ")}`);
  }
  extraParts.push(`Service Type: ${serviceType}`);

  const extraText = extraParts.join(" | ");
  return cleanRemarks ? `${cleanRemarks} (${extraText})` : `(${extraText})`;
};

const parseServiceTypeFromRemarks = (
  remarks?: string | null
): "Replacement" | "Acknowledgement" => {
  if (!remarks) return "Acknowledgement";
  const matches = [...remarks.matchAll(/Service Type:\s*([^\s|)]+)/gi)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    if (lastMatch && lastMatch[1]) {
      const val = lastMatch[1].trim().toLowerCase();
      if (val === "replacement") return "Replacement";
      if (val === "acknowledgement" || val === "payment") return "Acknowledgement";
    }
  }
  return "Acknowledgement";
};

/* ── types ───────────────────────────────────────────── */

interface BarcodeRow {
  barcode: string;
  qty: number;
  used: boolean;
}

interface MaterialTableState {
  materialId: string;
  materialName: string;
  rows: BarcodeRow[];
}

/* ── main component ──────────────────────────────────── */

interface MobileSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSimulationModal({
  isOpen,
  onClose,
}: MobileSimulationModalProps) {
  const [storeSearch, setStoreSearch] = React.useState("");
  const [debouncedStoreSearch, setDebouncedStoreSearch] = React.useState("");
  const [materialSearch, setMaterialSearch] = React.useState("");
  const [selectedStore, setSelectedStore] = React.useState<Store | null>(null);
  const [selectedMaterial, setSelectedMaterial] =
    React.useState<Material | null>(null);
  const [tableState, setTableState] =
    React.useState<MaterialTableState | null>(null);
  const [materialDropdownOpen, setMaterialDropdownOpen] = React.useState(false);
  const [acknowledgementStatus, setAcknowledgementStatus] = React.useState<"Acknowledged" | "Pending">("Pending");
  const [courierName, setCourierName] = React.useState("");
  const [trackingId, setTrackingId] = React.useState("");
  const [serviceType, setServiceType] = React.useState<"Replacement" | "Acknowledgement">("Replacement");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedStoreSearch(storeSearch), 350);
    return () => clearTimeout(t);
  }, [storeSearch]);

  const { data: storesData, isLoading: storesLoading } = useStores({
    skip: 0,
    take: 15,
    search: debouncedStoreSearch || undefined,
  });
  const stores = storesData?.stores || [];

  const { data: materialsData } = useMaterials({ skip: 0, take: 500 });
  const allMaterials = materialsData?.materials || [];

  const filteredMaterials = React.useMemo(() => {
    if (!materialSearch.trim()) return allMaterials;
    const q = materialSearch.toLowerCase();
    return allMaterials.filter((m) => m.name.toLowerCase().includes(q));
  }, [allMaterials, materialSearch]);

  React.useEffect(() => {
    if (!isOpen) {
      setStoreSearch("");
      setDebouncedStoreSearch("");
      setMaterialSearch("");
      setSelectedStore(null);
      setSelectedMaterial(null);
      setTableState(null);
      setMaterialDropdownOpen(false);
      setAcknowledgementStatus("Pending");
      setCourierName("");
      setTrackingId("");
      setServiceType("Replacement");
    }
  }, [isOpen]);

  const updateStoreMutation = useUpdateStore();

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setTableState(null);
    setSelectedMaterial(null);
    setMaterialSearch("");
    setCourierName(store.provider_name || "");
    setTrackingId(store.invoice_number || "");
    setServiceType(parseServiceTypeFromRemarks(store.remarks));
  };

  const handleSaveToDb = async () => {
    if (!selectedStore) {
      toast.error("Please select a store record first");
      return;
    }
    const newRemarks = tableState
      ? constructUpdatedRemarks(selectedStore.remarks, tableState.materialName, tableState.rows, serviceType)
      : selectedStore.remarks;

    const shouldSetInProgress = courierName.trim() !== "" && trackingId.trim() !== "";

    try {
      const res: any = await updateStoreMutation.mutateAsync({
        id: selectedStore.id,
        provider_name: courierName || undefined,
        invoice_number: trackingId || undefined,
        remarks: newRemarks || undefined,
        ...(shouldSetInProgress ? { return_status: "In Progress" } : {}),
      });
      const updatedStoreObj = res?.after || res;
      if (updatedStoreObj && updatedStoreObj.id) {
        setSelectedStore((prev) => prev ? {
          ...prev,
          ...updatedStoreObj,
          customer: updatedStoreObj.customer || prev.customer,
          materials: updatedStoreObj.materials || prev.materials,
        } : updatedStoreObj);
      }

      if (tableState && newRemarks) {
        const updatedSerialMap = parseSerialMapFromRemarks(newRemarks);
        const updatedSerials = updatedSerialMap[tableState.materialName] || [];
        setTableState((prev) => {
          if (!prev) return prev;
          const newRows = prev.rows.map((r, idx) => {
            const matchItem = updatedSerials[idx];
            return {
              ...r,
              barcode: matchItem?.barcode || r.barcode,
              used: matchItem ? matchItem.used : r.used,
            };
          });
          return { ...prev, rows: newRows };
        });
      }

      if (shouldSetInProgress) {
        toast.success("Store record saved! Status changed to In Progress.");
      } else {
        toast.success("Store record and barcode used status saved to database!");
      }
    } catch (error) {
      // error handled by mutation toast
    }
  };

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setMaterialDropdownOpen(false);
    setMaterialSearch("");
    if (!selectedStore) return;
    const storeMatRelation = (selectedStore.materials || []).find(
      (m) => m.material.id === material.id
    );
    if (!storeMatRelation) {
      toast.error(`Material "${material.name}" is not part of this store record.`);
      return;
    }
    const serialMap = parseSerialMapFromRemarks(selectedStore.remarks);
    const serials = serialMap[material.name] || [];
    const qty = storeMatRelation.quantity || 1;
    const rows: BarcodeRow[] = Array.from({ length: qty }).map((_, idx) => {
      const item = serials[idx];
      return {
        barcode: item?.barcode || `UNIT-${idx + 1}`,
        qty: 1,
        used: item?.used || false,
      };
    });
    setTableState({
      materialId: material.id,
      materialName: material.name,
      rows,
    });
  };

  const handleUsedToggle = (rowIdx: number, checked: boolean) => {
    setTableState((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r, i) =>
        i !== rowIdx ? r : { ...r, used: checked }
      );
      return { ...prev, rows };
    });
  };

  const usedCount = tableState?.rows.filter((r) => r.used).length ?? 0;
  const totalCount = tableState?.rows.length ?? 0;
  const newProductReturn = totalCount - usedCount;
  const oldProductReturn = usedCount;

  const handleCopyApiPayload = () => {
    if (!selectedStore || !tableState) return;
    const payload = {
      store_id: selectedStore.id,
      material_id: tableState.materialId,
      material_name: tableState.materialName,
      frame_number: selectedStore.frame_number,
      service_type: serviceType,
      barcodes: tableState.rows.map((r) => ({
        barcode: r.barcode,
        qty: r.qty,
        used: r.used,
        ...(serviceType === "Replacement" ? { product_type: r.used ? "old_product_return" : "new_product_return" } : { product_type: "new_product_return" }),
      })),
      summary: {
        total: totalCount,
        used: oldProductReturn,
        new_product_return: newProductReturn,
        ...(serviceType === "Replacement" ? { old_product_return: oldProductReturn } : {}),
      },
      acknowledgement: {
        ...(serviceType === "Acknowledgement" ? { status: acknowledgementStatus } : {}),
        courier_service_name: courierName || null,
        tracking_id: trackingId || null,
      },
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("API payload copied to clipboard!");
  };

  const apiPayloadStr = React.useMemo(() => {
    if (!selectedStore || !tableState) return "";
    return JSON.stringify(
      {
        store_id: selectedStore.id,
        material_id: tableState.materialId,
        material_name: tableState.materialName,
        frame_number: selectedStore.frame_number,
        service_type: serviceType,
        barcodes: tableState.rows.map((r) => ({
          barcode: r.barcode,
          qty: r.qty,
          used: r.used,
          ...(serviceType === "Replacement" ? { product_type: r.used ? "old_product_return" : "new_product_return" } : { product_type: "new_product_return" }),
        })),
        summary: {
          total: totalCount,
          used: oldProductReturn,
          new_product_return: newProductReturn,
          ...(serviceType === "Replacement" ? { old_product_return: oldProductReturn } : {}),
        },
        acknowledgement: {
          ...(serviceType === "Acknowledgement" ? { status: acknowledgementStatus } : {}),
          courier_service_name: courierName || null,
          tracking_id: trackingId || null,
        },
      },
      null,
      2
    );
  }, [selectedStore, tableState, totalCount, usedCount, newProductReturn, oldProductReturn, acknowledgementStatus, courierName, trackingId, serviceType]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="w-[95vw] sm:w-[95vw] sm:max-w-[95vw] h-[92vh] overflow-hidden flex flex-col rounded-[28px] border-none shadow-2xl bg-white dark:bg-gray-900 p-0">
        {/* Header */}
        <div className="flex items-center gap-4 px-8 py-6 border-b border-gray-100 dark:border-white/5 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Smartphone size={22} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">
              Mobile Flow Simulation
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 font-medium mt-0.5">
              Simulate mobile app flow and generate API payload for the app developer.
            </DialogDescription>
          </div>
          <button
            onClick={onClose}
            className="ml-auto shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {/* Body — two-column desktop layout */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* LEFT PANEL — Search & Selection */}
          <div className="w-[340px] shrink-0 border-r border-gray-100 dark:border-white/5 overflow-y-auto flex flex-col gap-6 px-6 py-6">

            {/* Step 1: Search Store Record */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">1</div>
                <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Search Store Record</h3>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Search by frame no, customer..."
                  className="pl-9 h-11 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-medium"
                />
                {storesLoading && (
                  <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
              </div>
              {stores.length > 0 && !selectedStore && (
                <div className="border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-gray-50 dark:divide-white/5 bg-white dark:bg-gray-800/60 shadow-sm">
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStore(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Package size={15} className="text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{s.customer?.name || "—"}</div>
                        <div className="text-xs text-gray-400 font-medium">Frame: {s.frame_number} · QTY: {s.quantity}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5 shrink-0">
                        {s.warranty_status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
              {selectedStore && (
                <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Package size={15} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{selectedStore.customer?.name}</div>
                    <div className="text-xs text-gray-400 font-medium truncate">Frame: {selectedStore.frame_number}</div>
                  </div>
                  <button
                    onClick={() => { setSelectedStore(null); setSelectedMaterial(null); setTableState(null); setStoreSearch(""); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </section>

            {/* Step 2: Select Material */}
            {selectedStore && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">2</div>
                  <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Select Material</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Materials in this record:</p>
                  {(selectedStore.materials || []).map((sm) => (
                    <button
                      key={sm.material.id}
                      onClick={() => handleSelectMaterial({ id: sm.material.id, name: sm.material.name, status: "ACTIVE", created_at: "", updated_at: "" })}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                        selectedMaterial?.id === sm.material.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-primary/30 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <Package size={15} className={selectedMaterial?.id === sm.material.id ? "text-primary" : "text-gray-400"} />
                      <span className="text-sm font-bold flex-1">{sm.material.name}</span>
                      <Badge variant="outline" className="text-[10px] font-bold border-gray-200 dark:border-white/10 text-gray-500 bg-white dark:bg-white/5 shrink-0">
                        QTY {sm.quantity}
                      </Badge>
                    </button>
                  ))}
                  <div className="pt-1">
                    <p className="text-xs text-gray-400 font-medium mb-2">Or search all materials:</p>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMaterialDropdownOpen((p) => !p)}
                        className="w-full flex items-center gap-3 px-4 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-primary/40 transition-colors"
                      >
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <span className="flex-1 text-left text-sm font-medium text-gray-400">Search material...</span>
                        <ChevronDown size={14} className={cn("text-gray-400 transition-transform shrink-0", materialDropdownOpen && "rotate-180")} />
                      </button>
                      {materialDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
                          <div className="p-2 border-b border-gray-50 dark:border-white/5">
                            <Input autoFocus value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)} placeholder="Search material..." className="h-9 text-sm rounded-xl border-gray-100 dark:border-white/10" />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredMaterials.length === 0 ? (
                              <div className="px-4 py-6 text-center text-sm text-gray-400">No materials found</div>
                            ) : (
                              filteredMaterials.map((mat) => {
                                const isInStore = (selectedStore.materials || []).some((sm) => sm.material.id === mat.id);
                                return (
                                  <button key={mat.id} onClick={() => isInStore && handleSelectMaterial(mat)} className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors", isInStore ? "hover:bg-primary/5 text-gray-800 dark:text-gray-200 font-semibold cursor-pointer" : "text-gray-400 cursor-not-allowed opacity-50")}>
                                    <Package size={13} className={isInStore ? "text-primary" : "text-gray-300"} />
                                    <span>{mat.name}</span>
                                    {isInStore && <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">In Record</span>}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT PANEL — Table, Payment Fields, API Payload */}
          <div className="flex-1 min-w-0 overflow-y-auto px-8 py-6 space-y-6">
            {!tableState ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-24">
                <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <Barcode size={36} className="text-gray-300 dark:text-gray-600" />
                </div>
                <div>
                  <p className="text-base font-black text-gray-400 dark:text-gray-500">No material selected</p>
                  <p className="text-sm text-gray-300 dark:text-gray-600 font-medium mt-1">Search a store record and select a material to see the barcode table</p>
                </div>
              </div>
            ) : (
              <>
                {/* Step 3 header */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">3</div>
                  <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Barcode Management Table</h3>
                  
                  {/* Service Type Toggle */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl ml-2">
                    <button
                      type="button"
                      onClick={() => setServiceType("Replacement")}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                        serviceType === "Replacement"
                          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      )}
                    >
                      Replacement
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceType("Acknowledgement")}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                        serviceType === "Acknowledgement"
                          ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      )}
                    >
                      Acknowledgement
                    </button>
                  </div>

                  <Badge variant="outline" className="ml-auto text-[10px] font-bold border-primary/20 text-primary bg-primary/5">
                    {tableState.materialName}
                  </Badge>
                </div>

                {/* Summary chips */}
                <div className={cn("grid gap-4", serviceType === "Replacement" ? "grid-cols-4" : "grid-cols-3")}>
                  {[
                    { label: "Total", value: totalCount, colorClass: "text-gray-700 bg-gray-100 dark:bg-white/5 dark:text-gray-300" },
                    { label: "Used", value: oldProductReturn, colorClass: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400" },
                    { label: "New Product Return", value: newProductReturn, colorClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400" },
                    ...(serviceType === "Replacement" ? [{ label: "Old Product Return", value: oldProductReturn, colorClass: "text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400" }] : []),
                  ].map((chip) => (
                    <div key={chip.label} className={cn("flex flex-col items-center justify-center py-4 rounded-2xl text-center font-bold gap-1", chip.colorClass)}>
                      <span className="text-3xl font-black">{chip.value}</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">{chip.label}</span>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
                        <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-gray-400">
                          <div className="flex items-center gap-1.5"><Barcode size={13} /> Barcode</div>
                        </th>
                        <th className="text-center px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-gray-400">
                          <div className="flex items-center justify-center gap-1.5"><Hash size={13} /> QTY</div>
                        </th>
                        <th className="text-center px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-gray-400">
                          <div className="flex items-center justify-center gap-1.5"><CheckCircle2 size={13} /> Used</div>
                        </th>
                        <th className="text-center px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-emerald-500">
                          <div className="flex items-center justify-center gap-1.5"><RefreshCw size={13} /> New Product Return</div>
                        </th>
                        {serviceType === "Replacement" && (
                          <th className="text-center px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-rose-500">
                            <div className="flex items-center justify-center gap-1.5"><ArrowLeftRight size={13} /> Old Product Return</div>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {tableState.rows.map((row, rIdx) => {
                        const isUsed = row.used;
                        const newPR = isUsed ? 0 : 1;
                        const oldPR = isUsed ? 1 : 0;
                        return (
                          <tr key={rIdx} className={cn("transition-colors", isUsed ? "bg-amber-50/40 dark:bg-amber-950/10" : "bg-white dark:bg-transparent hover:bg-gray-50/50 dark:hover:bg-white/[0.02]")}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <Barcode size={16} className="text-primary" />
                                </div>
                                <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{row.barcode}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <Badge variant="outline" className="text-xs font-bold border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 mx-auto">
                                {row.qty}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="flex justify-center">
                                <Checkbox checked={isUsed} onCheckedChange={(checked) => handleUsedToggle(rIdx, !!checked)} className="w-5 h-5 rounded-md border-gray-300 dark:border-white/20 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500" />
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={cn("inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black mx-auto", newPR > 0 ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-gray-600")}>
                                {newPR}
                              </span>
                            </td>
                            {serviceType === "Replacement" && (
                              <td className="px-5 py-4 text-center">
                                <span className={cn("inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black mx-auto", oldPR > 0 ? "bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400" : "bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-gray-600")}>
                                  {oldPR}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50/80 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5">
                        <td className="px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider">Totals</td>
                        <td className="px-5 py-3.5 text-center"><span className="text-sm font-black text-gray-700 dark:text-gray-300">{totalCount}</span></td>
                        <td className="px-5 py-3.5 text-center"><span className="text-sm font-black text-amber-500">{oldProductReturn} used</span></td>
                        <td className="px-5 py-3.5 text-center"><span className="text-sm font-black text-emerald-500">{newProductReturn}</span></td>
                        {serviceType === "Replacement" && (
                          <td className="px-5 py-3.5 text-center"><span className="text-sm font-black text-rose-500">{oldProductReturn}</span></td>
                        )}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Acknowledgement & Shipment Fields */}
                <div className="space-y-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-5 rounded-2xl">
                  <div className={cn("grid gap-5", serviceType === "Acknowledgement" ? "grid-cols-3" : "grid-cols-2")}>
                    {serviceType === "Acknowledgement" && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Acknowledgement Status</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setAcknowledgementStatus("Acknowledged")} className={cn("flex-1 h-11 rounded-xl text-sm font-bold border-2 transition-all", acknowledgementStatus === "Acknowledged" ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:border-emerald-300")}>
                            ✓ Acknowledged
                          </button>
                          <button type="button" onClick={() => setAcknowledgementStatus("Pending")} className={cn("flex-1 h-11 rounded-xl text-sm font-bold border-2 transition-all", acknowledgementStatus === "Pending" ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:border-amber-300")}>
                            ⏳ Pending
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Courier Service Name</label>
                      <Input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. DHL, FedEx, BlueDart..." className="h-11 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Tracking ID</label>
                      <Input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="e.g. TRK-0012345..." className="h-11 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSaveToDb}
                      disabled={updateStoreMutation.isPending}
                      className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-black flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      {updateStoreMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      Save Record to DB
                    </Button>
                  </div>
                </div>

                {/* API Payload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">API Payload (for app developer)</span>
                    <button onClick={handleCopyApiPayload} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                      <Copy size={12} />
                      Copy JSON
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-5 overflow-x-auto text-gray-600 dark:text-gray-300 leading-relaxed max-h-72 overflow-y-auto">
                    {apiPayloadStr}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-4 bg-gray-50/30 dark:bg-black/[0.03]">
          <span className="text-xs text-gray-400 font-medium">Click "Save Record to DB" to persist Courier & Tracking details to the database</span>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveToDb}
              disabled={!selectedStore || updateStoreMutation.isPending}
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold flex items-center gap-2 shadow-md shadow-primary/20"
            >
              {updateStoreMutation.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save Record
            </Button>
            <Button onClick={onClose} variant="ghost" className="h-10 px-5 rounded-xl font-bold text-gray-500">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
