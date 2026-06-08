"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TableTab {
  value: string;
  label: string;
  count?: number;
  color: "primary" | "amber" | "blue" | "emerald" | "rose" | "gray";
  icon?: React.ReactNode;
}

interface TableTabsProps {
  tabs: TableTab[];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
}

const colorStyles = {
  primary: {
    active: "text-primary border-primary/20 bg-primary/5 dark:bg-primary/10",
    badgeActive: "bg-primary/20 text-primary border-primary/30",
    dot: "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]",
  },
  amber: {
    active: "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10",
    badgeActive: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
  },
  blue: {
    active: "text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10",
    badgeActive: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
    dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
  },
  emerald: {
    active: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10",
    badgeActive: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
  },
  rose: {
    active: "text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10",
    badgeActive: "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
    dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
  },
  gray: {
    active: "text-gray-700 dark:text-gray-300 border-gray-500/20 bg-gray-500/5 dark:bg-gray-500/10",
    badgeActive: "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30",
    dot: "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]",
  },
};

export function TableTabs({ tabs, activeValue, onChange, className }: TableTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 p-1 bg-gray-50/60 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl overflow-x-auto scrollbar-none max-w-full w-fit shadow-inner",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeValue === tab.value;
        const colorCfg = colorStyles[tab.color] || colorStyles.gray;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 select-none outline-none cursor-pointer border border-transparent hover:scale-[1.02] active:scale-[0.98]",
              isActive
                ? cn("border", colorCfg.active, "shadow-sm")
                : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-white/5"
            )}
          >
            {/* Status Indicator Icon / Dot */}
            {tab.icon ? (
              <span className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                {tab.icon}
              </span>
            ) : (
              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", colorCfg.dot)} />
            )}

            {/* Tab Label */}
            <span>{tab.label}</span>

            {/* Dynamic Count Badge */}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal border transition-colors duration-300",
                  isActive
                    ? colorCfg.badgeActive
                    : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200/50 dark:border-white/5"
                )}
              >
                {tab.count}
              </span>
            )}
            
            {/* Smooth Pill Background Slide animation using LayoutID */}
            {isActive && (
              <motion.div
                layoutId="active-table-tab"
                className="absolute inset-0 bg-transparent rounded-xl pointer-events-none z-[-1]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
