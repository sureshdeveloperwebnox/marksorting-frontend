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
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import { Check, RotateCcw, ShieldCheck } from "lucide-react";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterDrawer({ isOpen, onClose }: FilterDrawerProps) {
  const { statusFilter, setStatusFilter, resetFilters } = useUserStore();
  
  // Local state to hold temporary selections before applying
  const [localStatus, setLocalStatus] = React.useState<string>(statusFilter);

  // Sync local state when drawer opens/store changes
  React.useEffect(() => {
    if (isOpen) {
      setLocalStatus(statusFilter);
    }
  }, [isOpen, statusFilter]);

  const handleApply = () => {
    setStatusFilter(localStatus);
    onClose();
  };

  const handleReset = () => {
    setLocalStatus("");
    resetFilters();
    onClose();
  };

  const statusOptions = [
    {
      value: "",
      label: "All Statuses",
      description: "Show all active and inactive team members.",
      color: "bg-gray-400 dark:bg-gray-500",
      glow: "shadow-[0_0_12px_rgba(156,163,175,0.2)]",
    },
    {
      value: "ACTIVE",
      label: "Active Only",
      description: "Show only members who currently have active accounts.",
      color: "bg-emerald-500",
      glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]",
    },
    {
      value: "INACTIVE",
      label: "Inactive Only",
      description: "Show only suspended or pending inactive accounts.",
      color: "bg-rose-500",
      glow: "shadow-[0_0_12px_rgba(244,63,94,0.3)]",
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col h-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <SheetTitle>Directory Filters</SheetTitle>
          </div>
          <SheetDescription>
            Refine your team directory view by applying specific status parameters.
          </SheetDescription>
        </SheetHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-8 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Account Status
            </h3>
            
            <div className="grid gap-3">
              {statusOptions.map((option) => {
                const isSelected = localStatus === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setLocalStatus(option.value)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer",
                      isSelected
                        ? "bg-primary/[0.03] dark:bg-primary/[0.05] border-primary shadow-md shadow-primary/5"
                        : "bg-transparent border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/10"
                    )}
                  >
                    {/* Glowing Accent Ring on Selection */}
                    {isSelected && (
                      <div className="absolute inset-y-0 left-0 w-[4px] bg-primary" />
                    )}

                    {/* Status Dot with Glow */}
                    <div className="mt-1 relative flex items-center justify-center">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full animate-pulse",
                          option.color,
                          isSelected ? option.glow : ""
                        )}
                      />
                    </div>

                    <div className="flex-1 pr-6">
                      <p
                        className={cn(
                          "font-bold text-sm leading-none transition-colors",
                          isSelected
                            ? "text-primary"
                            : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 font-medium leading-relaxed">
                        {option.description}
                      </p>
                    </div>

                    {/* Checkmark Indicator */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300 mt-0.5",
                        isSelected
                          ? "bg-primary border-primary text-white scale-110"
                          : "border-gray-200 dark:border-white/10 text-transparent opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <SheetFooter className="mt-auto pt-6 pb-2">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="flex-1 rounded-[16px] h-12 gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 rounded-[16px] h-12 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
