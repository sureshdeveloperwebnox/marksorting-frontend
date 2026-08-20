"use client";

/**
 * PageHeaderControls
 * ─────────────────────────────────────────────────────────────────
 * Reusable card-header control components used across all list pages
 * (Installations, Services, Expenses, Stores, Masters, Users, Roles, …).
 *
 * Exports:
 *   • PageHeaderControls (legacy all-in-one unified toolbar)
 *   • PageHeaderActions  (top row: refresh, bulk actions, primary CTA)
 *   • PageFilterToolbar  (second row: search, date range picker, filter drawer trigger)
 */

import * as React from "react";
import { Filter, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── 1. PageHeaderActions (Top Row Actions) ─────────────────────── */

export interface PageHeaderActionsProps {
    /** Called when the refresh button is clicked */
    onRefresh?: () => void;
    /** Whether the data is currently refreshing/refetching */
    isRefreshing?: boolean;
    /** Optional extra controls rendered between Refresh and Primary CTA */
    renderExtraControls?: () => React.ReactNode;

    /** Label for the primary action button */
    addLabel?: string;
    /** Icon rendered inside the primary action button */
    addIcon?: React.ReactNode;
    /** Called when the primary action button is clicked */
    onAddClick?: () => void;

    className?: string;
}

export function PageHeaderActions({
    onRefresh,
    isRefreshing = false,
    renderExtraControls,
    addLabel,
    addIcon,
    onAddClick,
    className,
}: PageHeaderActionsProps) {
    return (
        <div className={cn("flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end", className)}>
            {/* ── Refresh ── */}
            {onRefresh && (
                <Button
                    variant="outline"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className={cn(
                        "relative h-10 w-10 p-0 rounded-xl transition-all duration-200 justify-center items-center flex shrink-0",
                        "bg-transparent border border-gray-200 dark:border-white/10",
                        "text-gray-600 dark:text-gray-400",
                        "hover:border-primary/50 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10",
                        "disabled:opacity-50 cursor-pointer shadow-xs"
                    )}
                    title="Refresh data"
                >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-primary")} />
                </Button>
            )}

            {/* ── Extra controls (e.g. Bulk Delete Old, Upload Excel) ── */}
            {renderExtraControls && renderExtraControls()}

            {/* ── Primary Action Button ── */}
            {onAddClick && addLabel && (
                <Button
                    onClick={onAddClick}
                    className={cn(
                        "gap-2 h-10 px-5 rounded-xl text-sm font-bold transition-all duration-200 shrink-0",
                        "bg-transparent border-2 border-primary text-primary",
                        "hover:bg-primary hover:text-white",
                        "hover:shadow-md hover:shadow-primary/20",
                        "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    )}
                >
                    {addIcon}
                    {addLabel}
                </Button>
            )}
        </div>
    );
}

/* ─── 2. PageFilterToolbar (Search + Date Picker + Filter Button) ─── */

export interface PageFilterToolbarProps {
    /** Current value of the search input (controlled by parent) */
    searchValue: string;
    /** Called on every keystroke */
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;

    /** Optional date range control slot */
    dateRangePicker?: React.ReactNode;

    /** Opens the filter drawer */
    onFilterClick?: () => void;
    /** Number of active filters — shows a badge when > 0 */
    activeFiltersCount?: number;

    className?: string;
}

export function PageFilterToolbar({
    searchValue,
    onSearchChange,
    searchPlaceholder = "Search...",
    dateRangePicker,
    onFilterClick,
    activeFiltersCount = 0,
    className,
}: PageFilterToolbarProps) {
    return (
        <div className={cn("flex items-center gap-2.5 flex-wrap sm:flex-nowrap", className)}>
            {/* ── Search ── */}
            <div className="relative min-w-[200px] max-w-[280px] w-full sm:w-auto">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={15}
                />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={cn(
                        "w-full pl-9 pr-4 py-2 text-sm font-medium",
                        "bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl",
                        "text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500",
                        "outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10",
                        "transition-all duration-200 shadow-xs"
                    )}
                />
            </div>

            {/* ── Date Range Picker ── */}
            {dateRangePicker}

            {/* ── Filter ── */}
            {onFilterClick && (
                <Button
                    variant="outline"
                    onClick={onFilterClick}
                    className={cn(
                        "relative gap-2 h-9 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shrink-0",
                        "bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10",
                        "text-gray-600 dark:text-gray-400",
                        "hover:border-primary/50 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10",
                        activeFiltersCount > 0 &&
                        "border-primary/50 text-primary bg-primary/5 dark:bg-primary/10 shadow-xs"
                    )}
                >
                    <Filter size={13} />
                    Filter
                    {activeFiltersCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-sm">
                            {activeFiltersCount}
                        </span>
                    )}
                </Button>
            )}
        </div>
    );
}

/* ─── 3. PageHeaderControls (All-in-One Unified Component) ───────── */

export interface PageHeaderControlsProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;

    onFilterClick?: () => void;
    activeFiltersCount?: number;

    addLabel: string;
    addIcon?: React.ReactNode;
    onAddClick: () => void;

    onRefresh?: () => void;
    isRefreshing?: boolean;

    renderExtraControls?: () => React.ReactNode;
    dateRangePicker?: React.ReactNode;

    className?: string;
}

export function PageHeaderControls({
    searchValue,
    onSearchChange,
    searchPlaceholder = "Search...",
    onFilterClick,
    activeFiltersCount = 0,
    addLabel,
    addIcon,
    onAddClick,
    onRefresh,
    isRefreshing = false,
    renderExtraControls,
    dateRangePicker,
    className,
}: PageHeaderControlsProps) {
    return (
        <div className={cn("flex items-center gap-2.5 flex-wrap justify-end", className)}>
            {/* Refresh */}
            {onRefresh && (
                <Button
                    variant="outline"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className={cn(
                        "relative h-10 w-10 p-0 rounded-xl transition-all duration-200 justify-center items-center flex shrink-0",
                        "bg-transparent border border-gray-200 dark:border-white/10",
                        "text-gray-600 dark:text-gray-400",
                        "hover:border-primary/50 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10",
                        "disabled:opacity-50 cursor-pointer"
                    )}
                    title="Refresh data"
                >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-primary")} />
                </Button>
            )}

            {/* Extra Controls */}
            {renderExtraControls && renderExtraControls()}

            {/* Search */}
            <div className="relative">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={15}
                />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={cn(
                        "pl-9 pr-4 py-2 text-sm w-44 font-medium",
                        "bg-transparent border border-gray-200 dark:border-white/10 rounded-xl",
                        "text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600",
                        "outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10",
                        "transition-all duration-200 shadow-xs"
                    )}
                />
            </div>

            {/* Date Range Picker */}
            {dateRangePicker}

            {/* Filter */}
            {onFilterClick && (
                <Button
                    variant="outline"
                    onClick={onFilterClick}
                    className={cn(
                        "relative gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0",
                        "bg-transparent border-gray-200 dark:border-white/10",
                        "text-gray-600 dark:text-gray-400",
                        "hover:border-primary/50 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10",
                        activeFiltersCount > 0 &&
                        "border-primary/50 text-primary bg-primary/5 dark:bg-primary/10 shadow-xs"
                    )}
                >
                    <Filter size={14} />
                    Filter
                    {activeFiltersCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-sm">
                            {activeFiltersCount}
                        </span>
                    )}
                </Button>
            )}

            {/* Primary Action Button */}
            <Button
                onClick={onAddClick}
                className={cn(
                    "gap-2 h-10 px-5 rounded-xl text-sm font-bold transition-all duration-200 shrink-0",
                    "bg-transparent border-2 border-primary text-primary",
                    "hover:bg-primary hover:text-white",
                    "hover:shadow-md hover:shadow-primary/20",
                    "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                )}
            >
                {addIcon}
                {addLabel}
            </Button>
        </div>
    );
}
