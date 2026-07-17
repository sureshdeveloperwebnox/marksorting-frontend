"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { 
  FileDown, 
  Loader2, 
  RotateCcw,
  FileSpreadsheet, 
  FileText, 
  TableProperties
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExportReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "services" | "installations" | "expenses" | "master-mills" | "stores";
  initialDateFrom?: string;
  initialDateTo?: string;
  onExport: (format: "pdf" | "csv" | "excel", dateFrom: string, dateTo: string) => Promise<void>;
}

export function ExportReportDrawer({
  isOpen,
  onClose,
  activeTab,
  initialDateFrom = "",
  initialDateTo = "",
  onExport,
}: ExportReportDrawerProps) {
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [format, setFormat] = React.useState<"pdf" | "excel" | "csv">("excel");
  const [isExporting, setIsExporting] = React.useState(false);

  // Synchronize initial dates whenever drawer opens
  React.useEffect(() => {
    if (isOpen) {
      setDateFrom(initialDateFrom);
      setDateTo(initialDateTo);
      setFormat("excel");
    }
  }, [isOpen, initialDateFrom, initialDateTo]);

  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Please select both From Date and To Date to export reports");
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error("From Date cannot be after To Date");
      return;
    }
    setIsExporting(true);
    try {
      await onExport(format, dateFrom, dateTo);
      onClose();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setFormat("excel");
  };

  const formats = [
    /*
    {
      id: "pdf" as const,
      label: "PDF Document",
      desc: "Best for sharing and printing",
      icon: FileText,
      colorClass: "border-rose-100 dark:border-rose-950/20 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-100/30 dark:hover:bg-rose-950/20",
      activeClass: "ring-2 ring-rose-500 border-rose-300 dark:border-rose-800 bg-rose-100/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300",
    },
    */
    {
      id: "excel" as const,
      label: "Excel Spreadsheet",
      desc: "Best for data analysis and editing",
      icon: FileSpreadsheet,
      colorClass: "border-emerald-100 dark:border-emerald-950/20 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-100/30 dark:hover:bg-emerald-950/20",
      activeClass: "ring-2 ring-emerald-500 border-emerald-300 dark:border-emerald-800 bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
    },
    /*
    {
      id: "csv" as const,
      label: "CSV File",
      desc: "Raw tabular data format",
      icon: TableProperties,
      colorClass: "border-blue-100 dark:border-blue-950/20 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-100/30 dark:hover:bg-blue-950/20",
      activeClass: "ring-2 ring-blue-500 border-blue-300 dark:border-blue-800 bg-blue-100/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
    },
    */
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && !isExporting && onClose()}>
      <SheetContent className="sm:max-w-md bg-white dark:bg-gray-900 border-none shadow-2xl !p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 text-primary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
              <FileDown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Export Reports
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-0.5">
                Configure your export options and date filters below.
              </SheetDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-6 space-y-6" style={{ height: "calc(100% - 80px - 88px)" }}>
          {/* Active Tab Notice */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Dataset</span>
            <span className="text-xs font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              {activeTab === "services"
                ? "Service List"
                : activeTab === "installations"
                ? "Installation List"
                : activeTab === "expenses"
                ? "Expenses"
                : activeTab === "master-mills"
                ? "Master Mills"
                : "Stores Log"}
            </span>
          </div>

          {/* Date Filter Fields */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60">
              Date Range Filters
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  From Date
                </Label>
                <DatePicker
                  value={dateFrom}
                  onChange={setDateFrom}
                  placeholder="Select start date"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  To Date
                </Label>
                <DatePicker
                  value={dateTo}
                  onChange={setDateTo}
                  placeholder="Select end date"
                />
              </div>
            </div>
          </div>

          {/* Export Formats */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60">
              Select Export Format
            </h4>

            <div className="flex flex-col gap-3">
              {formats.map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    disabled={isExporting}
                    onClick={() => setFormat(fmt.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between select-none cursor-pointer",
                      isSelected ? fmt.activeClass : fmt.colorClass,
                      isExporting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-white/5">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {fmt.label}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                          {fmt.desc}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shadow-sm ring-2 ring-primary/20">
                        <span className="text-[10px] font-black">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-5 gap-3">
          <Button
            variant="ghost"
            disabled={isExporting}
            onClick={handleReset}
            className="flex-1 rounded-[16px] h-12 gap-2 text-gray-400 hover:text-gray-900 dark:hover:white hover:bg-gray-100 dark:hover:bg-white/5 font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 rounded-[16px] h-12 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Download Report
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
