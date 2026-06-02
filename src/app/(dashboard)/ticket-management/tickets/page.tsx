"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
  useTickets,
  SupportTicket,
  useDeleteTicket,
  useUpdateTicket,
} from "@/services/ticket-service";
import useTicketStore from "@/store/useTicketStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Ticket,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  ShieldAlert,
  History,
} from "lucide-react";
import { PageHeaderControls } from "@/components/ui/page-header-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { TicketFormDrawer } from "@/components/forms/ticket-form-drawer";
import { TicketTimelineDrawer } from "@/components/forms/ticket-timeline-drawer";
import { TicketViewDrawer } from "@/components/forms/ticket-view-drawer";
import { ViewButton } from "@/components/ui/view-button";
import { RouteGuard } from "@/components/guards/route-guard";

/* ─── Helpers ──────────────────────────────────────────────────── */

const getStatusColors = (status: string) => {
  switch (status?.toUpperCase()) {
    case "OPEN":        return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500 dark:border-blue-400";
    case "IN_PROGRESS": return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500 dark:border-amber-400";
    case "RESOLVED":    return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400";
    case "ESCALATED":   return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500 dark:border-rose-400";
    default:            return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500 dark:border-gray-400";
  }
};

const getStatusDotColors = (status: string) => {
  switch (status?.toUpperCase()) {
    case "OPEN":        return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
    case "IN_PROGRESS": return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    case "RESOLVED":    return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    case "ESCALATED":   return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
    default:            return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]";
  }
};

const getPriorityColors = (priority: string) => {
  switch (priority?.toUpperCase()) {
    case "LOW":    return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800";
    case "MEDIUM": return "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-200 dark:border-amber-900/30";
    case "HIGH":   return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30";
    case "URGENT": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 font-black";
    default:       return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800";
  }
};

/* ─── Stats Card ────────────────────────────────────────────────── */

interface StatsCardProps {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  iconBg: string;
  gradient: string;
  trend?: string;
  loading?: boolean;
}

function StatsCard({ title, value, icon, iconBg, gradient, trend, loading }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-[20px] p-5 border border-gray-100 dark:border-white/5",
        "bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-300"
      )}
    >
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 -translate-y-6 translate-x-6", gradient)} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em] mb-3">
            {title}
          </p>
          {loading ? (
            <div className="h-9 w-16 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">
              {value ?? 0}
            </p>
          )}
          {trend && (
            <p className="flex items-center gap-1 text-xs font-semibold text-gray-450 dark:text-gray-500 mt-2">
              {trend}
            </p>
          )}
        </div>
        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm", iconBg)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function TicketsPage() {
  const {
    pagination,
    setPagination,
    search,
    setSearch,
    statusFilter,
    priorityFilter,
    setStatusFilter,
    setPriorityFilter,
    resetFilters,
    deleteId,
    setDeleteId,
    openFormDrawer,
    openTimelineDrawer,
    openViewDrawer,
  } = useTicketStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  const { data, isLoading, isFetching, refetch } = useTickets({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });

  // Individual status queries for stats panel
  const { data: totalData, refetch: refetchTotal, isFetching: isFetchingTotal } = useTickets({ skip: 0, take: 1 });
  const { data: openData, refetch: refetchOpen, isFetching: isFetchingOpen } = useTickets({ skip: 0, take: 1, status: "OPEN" });
  const { data: inProgressData, refetch: refetchInProgress, isFetching: isFetchingInProgress } = useTickets({ skip: 0, take: 1, status: "IN_PROGRESS" });
  const { data: resolvedData, refetch: refetchResolved, isFetching: isFetchingResolved } = useTickets({ skip: 0, take: 1, status: "RESOLVED" });
  const { data: escalatedData, refetch: refetchEscalated, isFetching: isFetchingEscalated } = useTickets({ skip: 0, take: 1, status: "ESCALATED" });

  const isRefreshing = isFetching || isFetchingTotal || isFetchingOpen || isFetchingInProgress || isFetchingResolved || isFetchingEscalated;

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchTotal(), refetchOpen(), refetchInProgress(), refetchResolved(), refetchEscalated()]);
  };

  const deleteMutation = useDeleteTicket();
  const updateTicketMutation = useUpdateTicket();

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
    } catch {
      // Handled in mutation
    } finally {
      setDeleteId(null);
    }
  };

  const activeFilterCount = [statusFilter, priorityFilter].filter(Boolean).length;

  /* ── Filter fields ── */
  const filterFields: FilterField[] = [
    {
      id: "status",
      label: "Ticket Status",
      options: [
        { value: "ALL", label: "All Statuses", iconColor: "bg-gray-400 dark:bg-gray-500" },
        { value: "OPEN", label: "Open", iconColor: "bg-blue-500", animatePulse: true },
        { value: "IN_PROGRESS", label: "In Progress", iconColor: "bg-amber-500", animatePulse: true },
        { value: "RESOLVED", label: "Resolved", iconColor: "bg-emerald-500", animatePulse: true },
        { value: "ESCALATED", label: "Escalated", iconColor: "bg-rose-500", animatePulse: true },
      ],
    },
    {
      id: "priority",
      label: "Priority Level",
      options: [
        { value: "ALL", label: "All Priorities", iconColor: "bg-gray-400 dark:bg-gray-500" },
        { value: "LOW", label: "Low", iconColor: "bg-slate-400" },
        { value: "MEDIUM", label: "Medium", iconColor: "bg-amber-400" },
        { value: "HIGH", label: "High", iconColor: "bg-orange-500" },
        { value: "URGENT", label: "Urgent", iconColor: "bg-rose-500", animatePulse: true },
      ],
    },
  ];

  /* ── Table columns ── */
  const columns: ColumnDef<SupportTicket>[] = [
    {
      accessorKey: "ticket_number",
      header: "Ticket ID",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="rounded-md font-black text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 border-primary/20 bg-primary/5 text-primary whitespace-nowrap"
        >
          {row.original.ticket_number || row.original.id.slice(0, 8).toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject / Description",
      cell: ({ row }) => (
        <div className="flex items-start gap-3.5 max-w-sm sm:max-w-md">
          <div className="relative group flex-shrink-0 mt-0.5">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-semibold text-sm relative border border-primary/10 transition-transform duration-500 group-hover:scale-105">
              <Ticket size={16} />
            </div>
          </div>
          <div className="flex flex-col gap-1 overflow-hidden">
            <span className="font-semibold text-[14px] text-gray-900 dark:text-white tracking-tight truncate">
              {row.original.subject}
            </span>
            <span className="text-gray-450 dark:text-gray-500 font-medium text-xs line-clamp-1">
              {row.original.description}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "service_engineer.full_name",
      header: "Service Engineer",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
            <User size={12} />
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
                {row.original.service_engineer?.full_name || "Unassigned"}
              </span>
              {row.original.service_engineer && (
                <Badge
                  variant="outline"
                  className="text-[9px] uppercase tracking-wider px-1.5 py-0 rounded font-black bg-blue-500/5 text-blue-500 border-blue-500/20"
                >
                  Engineer
                </Badge>
              )}
            </div>
            <span className="text-gray-400 dark:text-gray-500 font-medium text-xs">
              {row.original.service_engineer?.email || ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "customer.name",
      header: "Customer / Mill",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
            {row.original.customer?.name || "No customer"}
          </span>
          <span className="text-gray-400 dark:text-gray-500 font-medium text-xs">
            {row.original.mill?.name || "No mill selected"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.original.priority;
        return (
          <Badge
            variant="outline"
            className={cn(
              "rounded-md font-semibold text-[10px] uppercase tracking-[0.12em] px-2.5 py-0.5 shadow-sm border",
              getPriorityColors(priority)
            )}
          >
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-gray-405 dark:text-gray-500" />
          <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">
            {row.original.created_at ? format(new Date(row.original.created_at), "MMM dd, yyyy") : "—"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const ticketId = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 cursor-pointer outline-none select-none group/status hover:scale-105 active:scale-95 transition-all duration-300">
                  <div className={cn("w-2 h-2 rounded-full", getStatusDotColors(status))} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md font-semibold text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 shadow-sm transition-all duration-300 cursor-pointer group-hover/status:border-primary/50",
                      getStatusColors(status)
                    )}
                  >
                    {status?.replace("_", " ")}
                  </Badge>
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-44 rounded-xl p-1.5 border border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 z-[9999]">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-1.5 mb-1 select-none">Set Status</div>
              {[
                { value: "OPEN", label: "Open", color: "blue" },
                { value: "IN_PROGRESS", label: "In Progress", color: "amber" },
                { value: "RESOLVED", label: "Resolved", color: "emerald" },
                { value: "ESCALATED", label: "Escalated", color: "rose" },
              ].map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  className={cn(
                    "rounded-lg font-semibold text-xs my-0.5 cursor-pointer flex items-center gap-2 py-2 px-2.5 transition-colors",
                    status === s.value
                      ? `text-${s.color}-500 bg-${s.color}-500/5`
                      : "text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => updateTicketMutation.mutate({ id: ticketId, status: s.value })}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-${s.color}-500`} />
                  {s.label.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right w-full font-bold">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <ViewButton
            onClick={() => openViewDrawer(row.original.id)}
            title="View Ticket Details"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-primary dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30 hover:text-orange-600 hover:bg-orange-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
            onClick={() => openTimelineDrawer(row.original.id)}
            title="View Ticket Timeline"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 hover:text-amber-700 hover:bg-amber-100/80 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
            onClick={() => openFormDrawer(row.original.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 hover:text-rose-700 hover:bg-rose-100/80 hover:scale-110 active:scale-95 transition-all duration-300 hover:shadow-[0_0_12px_rgba(244,63,94,0.15)] shadow-sm"
            onClick={() => setDeleteId(row.original.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <RouteGuard module="tickets" action="view">
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-cols-1 xl:grid-cols-4 gap-5"
    >
      {/* LEFT — Ticket List Card (3/4 width) */}
      <div className="xl:col-span-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Tickets {" "}
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                  Support
                </span>
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Manage system support cases and operational tickets
              </p>
            </div>

            <PageHeaderControls
              searchValue={localSearch}
              onSearchChange={setLocalSearch}
              searchPlaceholder="Search tickets..."
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              activeFiltersCount={activeFilterCount}
              addLabel="New Ticket"
              addIcon={<Ticket size={15} />}
              onAddClick={() => openFormDrawer()}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </div>

          <div className="p-6 pt-4">
            <DataTable
              columns={columns}
              data={data?.tickets || []}
              loading={isLoading || isFetching}
              pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
              totalCount={data?.total || 0}
              entityName="support tickets"
              pagination={pagination}
              onPaginationChange={setPagination}
              onGlobalFilterChange={setSearch}
              globalFilterValue={search}
              searchPlaceholder="Search..."
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              activeFiltersCount={activeFilterCount}
              hideToolbar
            />
          </div>
        </div>
      </div>

      {/* RIGHT — Statistics Panel (1/4 width) */}
      <div className="xl:col-span-1 flex flex-col gap-4">
        <StatsCard
          title="Total Tickets"
          value={totalData?.total}
          loading={!totalData}
          icon={<Ticket size={20} className="text-primary" />}
          iconBg="bg-primary/10 dark:bg-primary/15"
          gradient="bg-primary"
          trend="All registered issues"
        />
        <StatsCard
          title="Open"
          value={openData?.total}
          loading={!openData}
          icon={<Clock size={20} className="text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-500/15"
          gradient="bg-blue-500"
          trend="Awaiting action"
        />
        <StatsCard
          title="In Progress"
          value={inProgressData?.total}
          loading={!inProgressData}
          icon={<AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-500/15"
          gradient="bg-amber-500"
          trend="Currently resolving"
        />
        <StatsCard
          title="Resolved"
          value={resolvedData?.total}
          loading={!resolvedData}
          icon={<CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-500/15"
          gradient="bg-emerald-500"
          trend="Successfully closed"
        />
        <StatsCard
          title="Escalated"
          value={escalatedData?.total}
          loading={!escalatedData}
          icon={<ShieldAlert size={20} className="text-rose-600 dark:text-rose-400" />}
          iconBg="bg-rose-50 dark:bg-rose-500/15"
          gradient="bg-rose-500"
          trend="High priority attention"
        />
      </div>

      {/* Filter Drawer */}
      <GenericFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        fields={filterFields}
        activeValues={{
          status: statusFilter || "ALL",
          priority: priorityFilter || "ALL",
        }}
        onApply={(values) => {
          setStatusFilter(values.status === "ALL" ? "" : values.status);
          setPriorityFilter(values.priority === "ALL" ? "" : values.priority);
        }}
        onReset={() => {
          resetFilters();
        }}
      />

      {/* Form Drawer */}
      <TicketFormDrawer />

      {/* Timeline Drawer */}
      <TicketTimelineDrawer />

      {/* View Drawer */}
      <TicketViewDrawer />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-8 bg-white dark:bg-gray-900">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto animate-bounce">
              <Trash2 size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-gray-900 dark:text-white">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500 font-bold">
              This action cannot be undone. This will permanently remove the support ticket from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-center pt-6">
            <Button
              variant="ghost"
              onClick={() => setDeleteId(null)}
              className="flex-1 rounded-xl h-12 font-black text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl h-12 bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
    </RouteGuard>
  );
}
