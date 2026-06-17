"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ViewDetailItem {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

export interface ViewDetailSection {
  title?: string;
  items: ViewDetailItem[];
}

export interface ViewDrawerAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

interface ViewDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  sections: ViewDetailSection[];
  size?: "md" | "lg" | "xl" | "2xl";
  /** Optional quick-action buttons rendered above the Close button in the footer */
  actions?: ViewDrawerAction[];
}

const sizeClasses = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
};

export function ViewDetailsDrawer({
  isOpen,
  onClose,
  title,
  description,
  icon,
  isLoading = false,
  sections,
  size = "lg",
  actions,
}: ViewDetailsDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full p-0 flex flex-col h-screen max-h-screen bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-white/5 shadow-2xl",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                {icon}
              </div>
            )}
            <div>
              <SheetTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {title}
              </SheetTitle>
              {description && (
                <SheetDescription className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-0.5">
                  {description}
                </SheetDescription>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6 custom-scrollbar pb-28 space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2].map((group) => (
                <div key={group} className="space-y-4">
                  <Skeleton className="h-4 w-28 bg-gray-100 dark:bg-white/5 rounded-lg" />
                  <div className="grid grid-cols-2 gap-4 bg-gray-50/30 dark:bg-white/[0.02] border border-gray-100/50 dark:border-white/5 rounded-2xl p-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="space-y-2">
                        <Skeleton className="h-3 w-16 bg-gray-100/50 dark:bg-white/5 rounded-md" />
                        <Skeleton className="h-5 w-24 bg-gray-200/50 dark:bg-white/10 rounded-md" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            sections.map((section, secIdx) => (
              <div key={secIdx} className="space-y-4">
                {section.title && (
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80 dark:text-primary/70">
                    {section.title}
                  </h3>
                )}
                <div className="grid grid-cols-2 gap-4 bg-gray-50/30 dark:bg-white/[0.02] border border-gray-100/50 dark:border-white/5 rounded-2xl p-4 shadow-sm">
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className={cn(
                        "space-y-1.5",
                        item.fullWidth ? "col-span-2" : "col-span-1"
                      )}
                    >
                      <span className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500 flex items-center gap-1.5 select-none">
                        {item.icon && (
                          <item.icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        )}
                        {item.label}
                      </span>
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-200 break-words">
                        {item.value || <span className="text-gray-400 dark:text-gray-600 font-medium">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5">
          <div className="w-full flex flex-col gap-2">
            {/* Quick-action buttons */}
            {actions && actions.length > 0 && (
              <div className="flex gap-2">
                {actions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.variant ?? "outline"}
                    onClick={action.onClick}
                    className={cn(
                      "flex-1 rounded-xl h-10 font-bold text-sm gap-2 transition-all",
                      action.className
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full rounded-xl h-11 font-black text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Close Details
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
