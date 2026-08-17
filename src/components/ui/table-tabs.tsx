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
  layoutId?: string;
}

const colorStyles = {
  primary: {
    active: "text-primary border-primary/30 bg-primary/10 dark:bg-primary/20 shadow-xs font-black ring-1 ring-primary/25",
    inactive: "text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/5",
    badgeActive: "bg-primary text-white font-black border-transparent shadow-xs",
    badgeInactive: "bg-primary/10 text-primary border-primary/25 font-bold",
    dot: "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]",
    iconColor: "text-primary",
  },
  amber: {
    active: "text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/15 dark:bg-amber-500/25 shadow-xs font-black ring-1 ring-amber-500/25",
    inactive: "text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/5",
    badgeActive: "bg-amber-500 text-white font-black border-transparent shadow-xs",
    badgeInactive: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-bold",
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    iconColor: "text-amber-500",
  },
  blue: {
    active: "text-blue-700 dark:text-blue-300 border-blue-500/30 bg-blue-500/15 dark:bg-blue-500/25 shadow-xs font-black ring-1 ring-blue-500/25",
    inactive: "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/5",
    badgeActive: "bg-blue-500 text-white font-black border-transparent shadow-xs",
    badgeInactive: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 font-bold",
    dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    iconColor: "text-blue-500",
  },
  emerald: {
    active: "text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/15 dark:bg-emerald-500/25 shadow-xs font-black ring-1 ring-emerald-500/25",
    inactive: "text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5",
    badgeActive: "bg-emerald-500 text-white font-black border-transparent shadow-xs",
    badgeInactive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-bold",
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    iconColor: "text-emerald-500",
  },
  rose: {
    active: "text-rose-700 dark:text-rose-300 border-rose-500/30 bg-rose-500/15 dark:bg-rose-500/25 shadow-xs font-black ring-1 ring-rose-500/25",
    inactive: "text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/5",
    badgeActive: "bg-rose-500 text-white font-black border-transparent shadow-xs",
    badgeInactive: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 font-bold",
    dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
    iconColor: "text-rose-500",
  },
  gray: {
    active: "text-gray-900 dark:text-white border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/10 shadow-xs font-black ring-1 ring-gray-400/20",
    inactive: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50",
    badgeActive: "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 font-black border-transparent shadow-xs",
    badgeInactive: "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200/50 font-bold",
    dot: "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]",
    iconColor: "text-gray-500",
  },
};

export function TableTabs({ tabs, activeValue, onChange, className, layoutId = "active-table-tab" }: TableTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 p-1 bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/10 rounded-2xl overflow-x-auto scrollbar-none max-w-full w-fit shadow-xs",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeValue === tab.value;
        const colorCfg = colorStyles[tab.color] || colorStyles.gray;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 select-none outline-none cursor-pointer border",
              isActive
                ? cn("border", colorCfg.active)
                : cn("border-transparent", colorCfg.inactive)
            )}
          >
            {/* Status Indicator Icon / Dot */}
            {tab.icon ? (
              <span className={cn("flex-shrink-0 transition-colors", isActive ? "scale-105" : colorCfg.iconColor)}>
                {tab.icon}
              </span>
            ) : (
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", colorCfg.dot)} />
            )}

            {/* Tab Label */}
            <span>{tab.label}</span>

            {/* Dynamic Count Badge */}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal border transition-colors duration-200 min-w-[20px]",
                  isActive ? colorCfg.badgeActive : colorCfg.badgeInactive
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
