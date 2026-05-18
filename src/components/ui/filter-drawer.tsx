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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  iconColor?: string; // Class for color dot (e.g. 'bg-emerald-500')
  animatePulse?: boolean; // Whether the dot pulses
}

export interface FilterField {
  id: string;
  label: string;
  placeholder?: string;
  options: FilterOption[];
}

interface GenericFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  fields: FilterField[];
  activeValues: Record<string, string>;
  onApply: (values: Record<string, string>) => void;
  onReset: () => void;
}

export function GenericFilterDrawer({
  isOpen,
  onClose,
  title = "Directory Filters",
  description = "Refine your view by applying specific parameters.",
  fields,
  activeValues,
  onApply,
  onReset,
}: GenericFilterDrawerProps) {
  // Local state to store temporary selection states
  const [localValues, setLocalValues] = React.useState<Record<string, string>>({});

  // Sync state whenever the drawer opens or active values change
  React.useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      fields.forEach((field) => {
        initial[field.id] = activeValues[field.id] || "ALL";
      });
      setLocalValues(initial);
    }
  }, [isOpen, activeValues, fields]);

  const handleApply = () => {
    onApply(localValues);
    onClose();
  };

  const handleReset = () => {
    const cleared: Record<string, string> = {};
    fields.forEach((field) => {
      cleared[field.id] = "ALL";
    });
    setLocalValues(cleared);
    onReset();
    onClose();
  };

  const handleValueChange = (fieldId: string, value: string) => {
    setLocalValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col h-full sm:max-w-md bg-white dark:bg-gray-900 border-none shadow-2xl p-6">
        <SheetHeader className="pb-6 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 text-primary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {title}
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-0.5">
                {description}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto py-8 space-y-6">
          {fields.map((field) => {
            const currentValue = localValues[field.id] || "ALL";
            return (
              <div key={field.id} className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
                  {field.label}
                </label>
                
                <Select 
                  value={currentValue} 
                  onValueChange={(val) => handleValueChange(field.id, val ?? "ALL")}
                >
                  <SelectTrigger className="w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold flex items-center justify-between px-4 transition-all duration-300 shadow-sm cursor-pointer hover:border-gray-200 dark:hover:border-white/10 text-gray-700 dark:text-gray-300">
                    <SelectValue placeholder={field.placeholder || "Select option..."} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-gray-100 dark:border-white/5 shadow-2xl p-1 bg-white dark:bg-gray-900 z-50 min-w-[var(--radix-select-trigger-width)]">
                    {field.options.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value} 
                        className={cn(
                          "font-bold py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {option.iconColor && (
                            <div 
                              className={cn(
                                "w-2.5 h-2.5 rounded-full shadow-sm",
                                option.iconColor,
                                option.animatePulse && "animate-pulse"
                              )} 
                            />
                          )}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        {/* Footer Area */}
        <SheetFooter className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5 flex gap-3">
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
