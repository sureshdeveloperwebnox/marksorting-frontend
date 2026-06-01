"use client";

/**
 * PageHeaderControls
 * ─────────────────────────────────────────────────────────────────
 * Reusable card-header control bar used across all list pages
 * (Users, Roles, Mills, …).
 *
 * Renders:
 *   • Debounced search input
 *   • Outline filter button with active-count badge
 *   • Outline add/action button
 *
 * Usage:
 *   <PageHeaderControls
 *     searchValue={localSearch}
 *     onSearchChange={setLocalSearch}
 *     searchPlaceholder="Search mills..."
 *     onFilterClick={() => setFilterOpen(true)}
 *     activeFiltersCount={statusFilter ? 1 : 0}
 *     addLabel="Add New Mill"
 *     addIcon={<Factory size={15} />}
 *     onAddClick={() => openFormDrawer()}
 *   />
 */

import * as React from "react";
import { Filter, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PageHeaderControlsProps {
    /** Current value of the search input (controlled by parent) */
    searchValue: string;
    /** Called on every keystroke — parent should debounce if needed */
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;

    /** Opens the filter drawer */
    onFilterClick: () => void;
    /** Number of active filters — shows a badge when > 0 */
    activeFiltersCount?: number;

    /** Label for the primary action button */
    addLabel: string;
    /** Icon rendered inside the primary action button */
    addIcon?: React.ReactNode;
    /** Called when the primary action button is clicked */
    onAddClick: () => void;

    /** Called when the refresh button is clicked */
    onRefresh?: () => void;
    /** Whether the data is currently refreshing/refetching */
    isRefreshing?: boolean;

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
    className,
}: PageHeaderControlsProps) {
    return (
        <div className={cn("flex items-center gap-2.5 flex-wrap", className)}>
            {/* ── Refresh ── */}
            {onRefresh && (
                <Button
                    variant="outline"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className={cn(
                        "relative h-10 w-10 p-0 rounded-xl transition-all duration-200 justify-center items-center flex",
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

            {/* ── Search ── */}
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
                        "pl-9 pr-4 py-2.5 text-sm w-48 font-medium",
                        "bg-transparent border border-gray-200 dark:border-white/10 rounded-xl",
                        "text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600",
                        "outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10",
                        "transition-all duration-200"
                    )}
                />
            </div>

            {/* ── Filter ── */}
            <Button
                variant="outline"
                onClick={onFilterClick}
                className={cn(
                    "relative gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition-all duration-200",
                    "bg-transparent border-gray-200 dark:border-white/10",
                    "text-gray-600 dark:text-gray-400",
                    "hover:border-primary/50 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10",
                    activeFiltersCount > 0 &&
                    "border-primary/50 text-primary bg-primary/5 dark:bg-primary/10"
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

            {/* ── Primary action (outline style) ── */}
            <Button
                onClick={onAddClick}
                className={cn(
                    "gap-2 h-10 px-5 rounded-xl text-sm font-bold transition-all duration-200",
                    "bg-transparent border-2 border-primary text-primary",
                    "hover:bg-primary hover:text-white",
                    "hover:shadow-md hover:shadow-primary/20",
                    "hover:scale-[1.02] active:scale-[0.98]"
                )}
            >
                {addIcon}
                {addLabel}
            </Button>
        </div>
    );
}
