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
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker, DateRangeValue } from "@/components/ui/date-range-picker";
import { RotateCcw, ShieldCheck, ChevronDown, Check, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
  /** "select" (default) renders a dropdown; "date" renders a DatePicker; "date-range" renders a DateRangePicker; "text" renders a text input */
  type?: "select" | "date" | "date-range" | "text";
  options?: FilterOption[];
  /** When true, the field is rendered but interaction is disabled */
  disabled?: boolean;
  /** Optional hint shown below the label when disabled */
  disabledHint?: string;
  /** When set, this field is automatically disabled when the referenced field's value is "ALL" or empty */
  dependsOnField?: string;
  /** When true, renders a searchable dropdown with a filter search box at the top */
  searchable?: boolean;
  /** Optional async search handler to dynamically fetch matching options from the server as user types */
  onSearch?: (query: string) => Promise<FilterOption[]>;
}

function FilterDrawerSearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select option...",
  disabled = false,
  label = "",
  onSearch,
}: {
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  onSearch?: (query: string) => Promise<FilterOption[]>;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [asyncOptions, setAsyncOptions] = React.useState<FilterOption[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [optionsCache, setOptionsCache] = React.useState<Record<string, FilterOption>>({});
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Maintain cache of any options seen or loaded
  React.useEffect(() => {
    if (options && options.length > 0) {
      setOptionsCache((prev) => {
        const next = { ...prev };
        options.forEach((opt) => {
          next[opt.value] = opt;
        });
        return next;
      });
    }
  }, [options]);

  React.useEffect(() => {
    if (asyncOptions && asyncOptions.length > 0) {
      setOptionsCache((prev) => {
        const next = { ...prev };
        asyncOptions.forEach((opt) => {
          next[opt.value] = opt;
        });
        return next;
      });
    }
  }, [asyncOptions]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
        setAsyncOptions(null);
        setIsLoading(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setSearch("");
      setAsyncOptions(null);
      setIsLoading(false);
    }
  }, [open]);

  const onSearchRef = React.useRef(onSearch);
  React.useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Debounced server search when onSearch is supplied (depends ONLY on search, immune to parent re-renders)
  React.useEffect(() => {
    if (!onSearchRef.current) return;
    const term = search.trim();
    if (!term) {
      setAsyncOptions(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        if (!onSearchRef.current) return;
        const results = await onSearchRef.current(term);
        setAsyncOptions(results || []);
      } catch (err) {
        console.error("Filter search error:", err);
        setAsyncOptions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const selectedOption =
    options.find((o) => o.value === value) ||
    (asyncOptions ? asyncOptions.find((o) => o.value === value) : undefined) ||
    optionsCache[value] ||
    (value === "ALL" || !value ? options.find((o) => o.value === "ALL") : undefined);

  const displayOptions = React.useMemo(() => {
    if (onSearch) {
      if (!search.trim()) {
        const base = [...options];
        if (
          selectedOption &&
          selectedOption.value !== "ALL" &&
          !base.some((o) => o.value === selectedOption.value)
        ) {
          // Insert selected option after "ALL" if present
          if (base.length > 0 && base[0].value === "ALL") {
            base.splice(1, 0, selectedOption);
          } else {
            base.unshift(selectedOption);
          }
        }
        return base;
      }
      return asyncOptions ?? [];
    }

    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [onSearch, search, options, asyncOptions, selectedOption]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          "w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl font-bold flex items-center justify-between px-4 transition-all duration-300 shadow-sm text-gray-700 dark:text-gray-300 text-sm outline-none text-left",
          disabled
            ? "cursor-not-allowed bg-gray-100/60 dark:bg-white/[0.02]"
            : "cursor-pointer hover:border-gray-200 dark:hover:border-white/10",
          open && "ring-2 ring-primary/20 border-primary/50"
        )}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.iconColor && (
            <span className={cn("w-2 h-2 rounded-full shrink-0", selectedOption.iconColor)} />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-gray-400 transition-transform duration-200 shrink-0 ml-2",
            open && "rotate-180 text-primary"
          )}
        />
      </button>

      {open && (
        <div className="absolute z-[9999] top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full h-9 pl-9 pr-7 text-xs bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 font-semibold transition-all shadow-inner"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setAsyncOptions(null);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span>{label || "Options"}</span>
              <span>{isLoading ? "Searching..." : `${displayOptions.length} results`}</span>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 scrollbar-thin">
            {isLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-gray-400 font-semibold">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span>Searching {label.toLowerCase()}...</span>
              </div>
            ) : displayOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 font-semibold">
                No matching results found
              </div>
            ) : (
              displayOptions.map((opt) => {
                const isSelected = (value || "ALL") === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                      setAsyncOptions(null);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.iconColor && (
                        <span className={cn("w-2 h-2 rounded-full shrink-0", opt.iconColor)} />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  /** Called when a field value changes inside the drawer (before Apply). Use to reset dependent fields. */
  onLocalChange?: (fieldId: string, value: string, currentLocalValues: Record<string, string>) => Partial<Record<string, string>>;
}

const parseDateRangeValue = (strVal?: string): DateRangeValue => {
  if (!strVal) return { startDate: "", endDate: "", label: "" };
  try {
    return JSON.parse(strVal);
  } catch {
    const parts = strVal.split(":");
    return {
      startDate: parts[0] || "",
      endDate: parts[1] || "",
      label: parts[2] || (parts[0] && parts[1] ? "Custom Range" : ""),
    };
  }
};

export function GenericFilterDrawer({
  isOpen,
  onClose,
  title = "Directory Filters",
  description = "Refine your view by applying specific parameters.",
  fields,
  activeValues,
  onApply,
  onReset,
  onLocalChange,
}: GenericFilterDrawerProps) {
  // Local state to store temporary selection states
  const [localValues, setLocalValues] = React.useState<Record<string, string>>({});

  // Sync state only when the drawer OPENS (not on every fields/activeValues change)
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (isOpen && !wasOpen.current) {
      // Drawer just opened — initialize local values from activeValues
      const initial: Record<string, string> = {};
      fields.forEach((field) => {
        initial[field.id] = activeValues[field.id] || (field.type === "date" || field.type === "date-range" || field.type === "text" ? "" : "ALL");
      });
      setLocalValues(initial);
    }
    if (!isOpen) {
      wasOpen.current = false;
    } else {
      wasOpen.current = true;
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // When new fields arrive (e.g. after async load) while drawer is open,
  // fill in any missing keys WITHOUT overwriting existing user selections
  React.useEffect(() => {
    if (!isOpen) return;
    setLocalValues((prev) => {
      const merged = { ...prev };
      let changed = false;
      fields.forEach((field) => {
        if (!(field.id in merged)) {
          merged[field.id] = activeValues[field.id] || (field.type === "date" || field.type === "date-range" || field.type === "text" ? "" : "ALL");
          changed = true;
        }
      });
      return changed ? merged : prev;
    });
  }, [fields]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => {
    onApply(localValues);
    onClose();
  };

  const handleReset = () => {
    const cleared: Record<string, string> = {};
    fields.forEach((field) => {
      cleared[field.id] = field.type === "date" || field.type === "date-range" || field.type === "text" ? "" : "ALL";
    });
    setLocalValues(cleared);
    onReset();
    onClose();
  };

  const handleValueChange = (fieldId: string, value: string) => {
    setLocalValues((prev) => {
      const next = { ...prev, [fieldId]: value };
      if (onLocalChange) {
        const overrides = onLocalChange(fieldId, value, next);
        const cleanOverrides: Record<string, string> = {};
        for (const [key, val] of Object.entries(overrides)) {
          if (typeof val === "string") {
            cleanOverrides[key] = val;
          }
        }
        return { ...next, ...cleanOverrides };
      }
      return next;
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/5">
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
        </div>

        {/* Scrollable Content — ends above the absolute footer (pb = footer height ~88px) */}
        <div className="overflow-y-auto px-6 py-6 space-y-6" style={{ height: "calc(100% - 80px - 88px)" }}>
          {fields.map((field) => {
            const currentValue = localValues[field.id] || "";
            const isDateField = field.type === "date";
            const isDateRangeField = field.type === "date-range";
            const isDisabled = field.disabled === true ||
              // Dynamic: if field has a dependsOnField, check localValues
              (field.dependsOnField ? (localValues[field.dependsOnField] === "ALL" || !localValues[field.dependsOnField]) : false);

            return (
              <div key={field.id} className={cn("space-y-3", isDisabled && "opacity-50")}>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-primary/60 block">
                    {field.label}
                  </label>
                  {isDisabled && field.disabledHint && (
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 italic">
                      — {field.disabledHint}
                    </span>
                  )}
                </div>

                {isDateRangeField ? (
                  <DateRangePicker
                    value={parseDateRangeValue(currentValue)}
                    onChange={(val) => {
                      if (isDisabled) return;
                      if (!val.startDate && !val.endDate) {
                        handleValueChange(field.id, "");
                      } else {
                        handleValueChange(field.id, JSON.stringify(val));
                      }
                    }}
                    className="w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold flex items-center justify-between px-4 transition-all duration-300 shadow-sm cursor-pointer hover:border-gray-200 dark:hover:border-white/10 text-gray-700 dark:text-gray-300"
                  />
                ) : isDateField ? (
                  <DatePicker
                    value={currentValue}
                    onChange={(val) => { if (!isDisabled) handleValueChange(field.id, val); }}
                    placeholder={field.placeholder || "Select date..."}
                  />
                ) : field.type === "text" ? (
                  <Input
                    value={currentValue}
                    onChange={(e) => { if (!isDisabled) handleValueChange(field.id, e.target.value); }}
                    placeholder={field.placeholder || "Enter search term..."}
                    className="w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold px-4 transition-all duration-300 shadow-sm text-gray-700 dark:text-gray-300"
                    disabled={isDisabled}
                  />
                ) : field.searchable ? (
                  <FilterDrawerSearchableSelect
                    value={currentValue || "ALL"}
                    onChange={(val) => { if (!isDisabled) handleValueChange(field.id, val); }}
                    options={field.options || []}
                    placeholder={field.placeholder}
                    disabled={isDisabled}
                    label={field.label}
                    onSearch={field.onSearch}
                  />
                ) : (
                  <Select
                    value={currentValue || "ALL"}
                    onValueChange={(val) => { if (!isDisabled) handleValueChange(field.id, val ?? "ALL"); }}
                    items={field.options?.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    disabled={isDisabled}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full h-12 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold flex items-center justify-between px-4 transition-all duration-300 shadow-sm text-gray-700 dark:text-gray-300",
                        isDisabled
                          ? "cursor-not-allowed bg-gray-100/60 dark:bg-white/[0.02]"
                          : "cursor-pointer hover:border-gray-200 dark:hover:border-white/10"
                      )}
                    >
                      <SelectValue placeholder={field.placeholder || "Select option..."} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border border-gray-100 dark:border-white/5 shadow-2xl p-1 bg-white dark:bg-gray-900 z-50 min-w-[var(--radix-select-trigger-width)]">
                      {(field.options ?? []).map((option) => (
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
                )}
              </div>
            );
          })}
        </div>

        {/* Footer — absolute, always visible at bottom */}
        <SheetFooter className="px-6 py-5 gap-3">
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
