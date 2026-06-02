"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewButtonProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "icon";
  title?: string;
  disabled?: boolean;
}

export function ViewButton({
  onClick,
  className,
  size = "icon",
  title = "View Details",
  disabled = false,
}: ViewButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(
        "h-9 w-9 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 hover:text-blue-700 hover:bg-blue-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <Eye className="h-4 w-4" />
    </Button>
  );
}
