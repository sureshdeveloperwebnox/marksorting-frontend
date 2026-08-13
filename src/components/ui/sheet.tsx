"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/60 backdrop-blur-sm duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

interface SheetContentProps extends DialogPrimitive.Popup.Props {
  showCloseButton?: boolean
  side?: "top" | "bottom" | "left" | "right"
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  side = "right",
  ...props
}: SheetContentProps) {
  const sideVariants = {
    top: "fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-100 dark:border-white/5 bg-white dark:bg-gray-950 p-6 shadow-2xl duration-300 ease-out outline-none transition-all data-open:animate-in data-open:slide-in-from-top data-closed:animate-out data-closed:slide-out-to-top",
    bottom: "fixed bottom-0 left-0 right-0 z-50 w-full border-t border-gray-100 dark:border-white/5 bg-white dark:bg-gray-950 p-6 shadow-2xl duration-300 ease-out outline-none transition-all data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
    left: "fixed top-0 left-0 z-50 h-full w-full max-w-xs border-r border-gray-100 dark:border-white/5 bg-white dark:bg-gray-950 p-6 shadow-2xl duration-300 ease-out outline-none transition-all data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left",
    right: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 h-[85vh] w-[92vw] sm:w-full sm:max-w-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/10 rounded-[28px] p-0 shadow-2xl duration-300 ease-out outline-none transition-all flex flex-col overflow-hidden data-open:animate-in data-open:zoom-in-95 data-closed:animate-out data-closed:zoom-out-95",
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          sideVariants[side],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4 h-10 w-10 rounded-xl text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all hover:rotate-90 duration-300"
                size="icon"
              />
            }
          >
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 pb-5 border-b border-gray-100 dark:border-white/5", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-4 flex items-center gap-3 flex-shrink-0 mt-auto",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-sans text-xl font-bold tracking-tight text-gray-900 dark:text-white",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn(
        "text-sm font-medium text-gray-400 dark:text-gray-500",
        className
      )}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
