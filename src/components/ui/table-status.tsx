"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface StatusOption {
    value: string;
    label: string;
    color: "emerald" | "amber" | "rose" | "blue" | "purple" | "teal" | "gray";
}

interface TableStatusProps {
    value: string;
    options: StatusOption[];
    onStatusChange?: (newValue: string) => void;
    title?: string;
    disabled?: boolean;
    align?: "start" | "center" | "end";
}

const getStatusColors = (color: string) => {
    switch (color) {
        case "emerald":
            return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400";
        case "amber":
            return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500 dark:border-amber-400";
        case "rose":
            return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500 dark:border-rose-400";
        case "blue":
            return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500 dark:border-blue-400";
        case "purple":
            return "bg-purple-500/5 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500 dark:border-purple-400";
        case "teal":
            return "bg-teal-500/5 dark:bg-teal-500/10 text-teal-500 dark:text-teal-400 border-teal-500 dark:border-teal-400";
        default:
            return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500 dark:border-gray-400";
    }
};

const getStatusDotColors = (color: string) => {
    switch (color) {
        case "emerald": return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
        case "amber": return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
        case "rose": return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
        case "blue": return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
        case "purple": return "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]";
        case "teal": return "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]";
        default: return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
    }
};

const getOptionItemColors = (color: string, active: boolean) => {
    if (!active) return "text-gray-700 dark:text-gray-300";
    switch (color) {
        case "emerald": return "text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10";
        case "amber": return "text-amber-500 bg-amber-500/5 dark:bg-amber-500/10";
        case "rose": return "text-rose-500 bg-rose-500/5 dark:bg-rose-500/10";
        case "blue": return "text-blue-500 bg-blue-500/5 dark:bg-blue-500/10";
        case "purple": return "text-purple-500 bg-purple-500/5 dark:bg-purple-500/10";
        case "teal": return "text-teal-500 bg-teal-500/5 dark:bg-teal-500/10";
        default: return "text-gray-500 bg-gray-500/5 dark:bg-gray-500/10";
    }
};

const getOptionDotColor = (color: string) => {
    switch (color) {
        case "emerald": return "bg-emerald-500";
        case "amber": return "bg-amber-500";
        case "rose": return "bg-rose-500";
        case "blue": return "bg-blue-500";
        case "purple": return "bg-purple-500";
        case "teal": return "bg-teal-500";
        default: return "bg-gray-500";
    }
};

export function TableStatus({
    value,
    options,
    onStatusChange,
    title = "Set Status",
    disabled = false,
    align = "start",
}: TableStatusProps) {
    const currentOption = options.find(
        (o) => o.value.toUpperCase() === value?.toUpperCase()
    ) || {
        value,
        label: value,
        color: "gray" as const,
    };

    const triggerButton = (
        <button
            type="button"
            disabled={disabled}
            className={cn(
                "flex items-center gap-2 outline-none select-none group/status transition-all duration-300",
                disabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"
            )}
        >
            <div
                className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    getStatusDotColors(currentOption.color)
                )}
            />
            <Badge
                variant="outline"
                className={cn(
                    "rounded-md font-semibold text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 shadow-sm transition-all duration-300",
                    !disabled && "cursor-pointer group-hover/status:border-primary/50",
                    getStatusColors(currentOption.color)
                )}
            >
                {currentOption.label}
            </Badge>
        </button>
    );

    if (disabled || !onStatusChange) {
        return triggerButton;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={triggerButton} />
            <DropdownMenuContent
                align={align}
                className="w-36 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 z-[9999]"
            >
                <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-1.5 mb-1 select-none">
                    {title}
                </div>
                {options.map((s) => {
                    const isActive = currentOption.value.toUpperCase() === s.value.toUpperCase();
                    return (
                        <DropdownMenuItem
                            key={s.value}
                            className={cn(
                                "rounded-lg font-semibold text-xs my-0.5 cursor-pointer flex items-center gap-2 py-2 px-2.5 transition-colors",
                                getOptionItemColors(s.color, isActive)
                            )}
                            onClick={() => onStatusChange(s.value)}
                        >
                            <span className={cn("w-1.5 h-1.5 rounded-full", getOptionDotColor(s.color))} />
                            {s.label.toUpperCase()}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
