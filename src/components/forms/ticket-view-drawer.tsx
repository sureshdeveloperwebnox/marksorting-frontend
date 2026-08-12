"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Calendar,
  User,
  Clock,
  X,
  Ticket,
  FileText,
  Building2,
  UserCircle,
  Tag,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useTicketStore from "@/store/useTicketStore";
import { useTicket } from "@/services/ticket-service";
import { format } from "date-fns";

const getStatusColors = (status: string) => {
  switch (status?.toUpperCase()) {
    case "OPEN":
      return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30";
    case "IN_PROGRESS":
      return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30";
    case "RESOLVED":
      return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30";
    case "ESCALATED":
      return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30";
    default:
      return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/30";
  }
};

const getStatusDotColors = (status: string) => {
  switch (status?.toUpperCase()) {
    case "OPEN":
      return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
    case "IN_PROGRESS":
      return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    case "RESOLVED":
      return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    case "ESCALATED":
      return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
    default:
      return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
  }
};

const getPriorityColors = (priority: string) => {
  switch (priority?.toUpperCase()) {
    case "LOW":
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-200 dark:border-amber-900/30";
    case "HIGH":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30";
    case "URGENT":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 font-black";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800";
  }
};

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}

function DetailItem({ icon, label, value, className }: DetailItemProps) {
  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5", className)}>
      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-primary flex-shrink-0 shadow-sm border border-gray-100 dark:border-white/10">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export function TicketViewDrawer() {
  const { isViewDrawerOpen, viewTicketId, closeViewDrawer } = useTicketStore();

  const { data: ticket, isLoading: isLoadingTicket } = useTicket(viewTicketId);

  return (
    <Sheet open={isViewDrawerOpen} onOpenChange={(open) => !open && closeViewDrawer()}>
      <SheetContent className="flex flex-col h-full w-full max-w-full bg-white dark:bg-gray-900 border-none shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/5 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-inner flex-shrink-0 border border-primary/10">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                {isLoadingTicket ? "Loading..." : ticket?.subject || "Ticket Details"}
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-1 flex items-center gap-2 flex-wrap">
                {isLoadingTicket ? (
                  "Fetching ticket details..."
                ) : (
                  <>
                    <Badge
                      variant="outline"
                      className="rounded-md font-black text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 border-primary/20 bg-primary/5 text-primary"
                    >
                      {ticket?.ticket_number || ticket?.id?.slice(0, 8).toUpperCase()}
                    </Badge>
                    <span className="text-gray-300">|</span>
                    <span>Support Ticket</span>
                  </>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-250 dark:scrollbar-thumb-white/10">
          {isLoadingTicket ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                Loading ticket details...
              </p>
            </div>
          ) : ticket ? (
            <>
              {/* Status & Priority Banner */}
              <div className="flex flex-wrap gap-3 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", getStatusDotColors(ticket.status))} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md font-semibold text-[10px] uppercase tracking-[0.12em] px-2.5 py-1",
                      getStatusColors(ticket.status)
                    )}
                  >
                    {ticket.status?.replace("_", " ")}
                  </Badge>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md font-semibold text-[10px] uppercase tracking-[0.12em] px-2.5 py-1",
                    getPriorityColors(ticket.priority)
                  )}
                >
                  {ticket.priority} Priority
                </Badge>
              </div>

              {/* Description Section */}
              <Section title="Description" icon={<FileText className="w-4 h-4" />}>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {ticket.description || "No description provided."}
                  </p>
                </div>
              </Section>

              {/* Assignment Section */}
              <Section title="Assignment" icon={<UserCircle className="w-4 h-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    icon={<User className="w-4 h-4" />}
                    label="Service Engineer"
                    value={ticket.service_engineer?.full_name || "Unassigned"}
                  />
                  <DetailItem
                    icon={<Building2 className="w-4 h-4" />}
                    label="Customer"
                    value={ticket.customer?.name || "No customer"}
                  />
                  <DetailItem
                    icon={<Tag className="w-4 h-4" />}
                    label="Mill / Location"
                    value={ticket.mill?.name || "No mill selected"}
                  />
                </div>
              </Section>

              {/* Timeline Section */}
              <Section title="Timeline" icon={<History className="w-4 h-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Created Date"
                    value={
                      ticket.created_at
                        ? format(new Date(ticket.created_at), "MMM dd, yyyy hh:mm a")
                        : "—"
                    }
                  />
                  <DetailItem
                    icon={<Clock className="w-4 h-4" />}
                    label="Last Updated"
                    value={
                      ticket.updated_at
                        ? format(new Date(ticket.updated_at), "MMM dd, yyyy hh:mm a")
                        : "—"
                    }
                  />
                </div>
              </Section>

            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <Ticket className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Ticket not found
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 flex-shrink-0">
          <Button
            onClick={closeViewDrawer}
            className="w-full rounded-xl h-12 bg-primary hover:bg-primary/95 text-white font-bold text-sm shadow-lg shadow-primary/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <X size={16} />
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
