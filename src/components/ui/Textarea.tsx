import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, placeholder, ...props }, ref) => {
    return (
      <textarea
        placeholder={placeholder !== undefined ? placeholder : " "}
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          "not-placeholder-shown:bg-primary/[0.035] not-placeholder-shown:border-2 not-placeholder-shown:border-gray-900 not-placeholder-shown:text-gray-900 dark:not-placeholder-shown:bg-primary/[0.08] dark:not-placeholder-shown:border-2 dark:not-placeholder-shown:border-gray-100 dark:not-placeholder-shown:text-white",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
