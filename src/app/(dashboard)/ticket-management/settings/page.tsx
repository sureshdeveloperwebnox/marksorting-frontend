"use client";

import * as React from "react";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
  useSettings,
  Setting,
  useDeleteSetting,
} from "@/services/setting-service";
import useSettingStore from "@/store/useSettingStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Settings,
  Loader2,
  Search,
  Filter,
  Check,
  Copy,
  Layout,
  CreditCard,
  Bell,
  Shield,
  FileCode,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GenericFilterDrawer, FilterField } from "@/components/ui/filter-drawer";
import { SettingFormDrawer } from "@/components/forms/setting-form-drawer";

/* ─── Helpers ──────────────────────────────────────────────────── */

const getGroupColors = (group: string) => {
  switch (group?.toUpperCase()) {
    case "GENERAL":      return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500 dark:border-blue-400";
    case "APP":          return "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500 dark:border-amber-400";
    case "PAYMENT":      return "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400";
    case "NOTIFICATION": return "bg-purple-500/5 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500 dark:border-purple-400";
    case "SECURITY":     return "bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500 dark:border-rose-400";
    default:             return "bg-gray-500/5 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500 dark:border-gray-400";
  }
};

const getGroupIcon = (group: string) => {
  switch (group?.toUpperCase()) {
    case "GENERAL":      return <Settings size={14} />;
    case "APP":          return <Layout size={14} />;
    case "PAYMENT":      return <CreditCard size={14} />;
    case "NOTIFICATION": return <Bell size={14} />;
    case "SECURITY":     return <Shield size={14} />;
    default:             return <Settings size={14} />;
  }
};

/* ─── Stats Card ────────────────────────────────────────────────── */

interface StatsCardProps {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  iconBg: string;
  gradient: string;
  loading?: boolean;
}

function StatsCard({ title, value, icon, iconBg, gradient, loading }: StatsCardProps) {
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
            <p className="text-4xl font-black text-gray-900 dark:text-white leading-none">
              {value ?? 0}
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

export default function SettingsPage() {
  const {
    pagination,
    setPagination,
    search,
    setSearch,
    groupFilter,
    setGroupFilter,
    resetFilters,
    deleteId,
    setDeleteId,
    openFormDrawer,
  } = useSettingStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  const { data, isLoading } = useSettings({
    skip: pagination.pageIndex * pagination.pageSize,
    take: pagination.pageSize,
    search,
    group: groupFilter || undefined,
  });

  // Individual group counts
  const { data: totalData } = useSettings({ skip: 0, take: 1 });
  const { data: generalData } = useSettings({ skip: 0, take: 1, group: "GENERAL" });
  const { data: appData } = useSettings({ skip: 0, take: 1, group: "APP" });
  const { data: paymentData } = useSettings({ skip: 0, take: 1, group: "PAYMENT" });
  const { data: notificationData } = useSettings({ skip: 0, take: 1, group: "NOTIFICATION" });
  const { data: securityData } = useSettings({ skip: 0, take: 1, group: "SECURITY" });

  const deleteMutation = useDeleteSetting();

  const handleCopy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(id);
    toast.success("Value copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

  const activeFilterCount = groupFilter ? 1 : 0;

  /* ── Filter fields ── */
  const filterFields: FilterField[] = [
    {
      id: "group",
      label: "Setting Group",
      options: [
        { value: "ALL", label: "All Groups", iconColor: "bg-gray-400 dark:bg-gray-500" },
        { value: "GENERAL", label: "General Settings", iconColor: "bg-blue-500" },
        { value: "APP", label: "Application Config", iconColor: "bg-amber-500" },
        { value: "PAYMENT", label: "Payment Systems", iconColor: "bg-emerald-500" },
        { value: "NOTIFICATION", label: "Notification Channels", iconColor: "bg-purple-500" },
        { value: "SECURITY", label: "Access & Security", iconColor: "bg-rose-500" },
      ],
    },
  ];

  /* ── Table columns ── */
  const columns: ColumnDef<Setting>[] = [
    {
      accessorKey: "key",
      header: "Parameter Key",
      cell: ({ row }) => (
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary border border-primary/10 transition-transform duration-500 group-hover:scale-105">
              <FileCode size={16} />
            </div>
          </div>
          <span className="font-black text-[13px] text-gray-900 dark:text-white tracking-wider font-mono bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-150 dark:border-white/5 select-all">
            {row.original.key}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "group",
      header: "Group",
      cell: ({ row }) => {
        const group = row.original.group;
        return (
          <Badge
            variant="outline"
            className={cn(
              "rounded-md font-bold text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 shadow-sm flex items-center gap-1.5 w-fit border",
              getGroupColors(group)
            )}
          >
            {getGroupIcon(group)}
            {group}
          </Badge>
        );
      },
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => {
        const val = row.original.value;
        const id = row.original.id;
        const isCopied = copiedKey === id;
        return (
          <div className="flex items-center gap-2 max-w-xs sm:max-w-md">
            <code className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 py-1 px-2.5 rounded-lg truncate block flex-1 select-all select-none">
              {val}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/5 flex-shrink-0"
              onClick={() => handleCopy(val, id)}
            >
              {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </Button>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right w-full font-bold">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-cols-1 xl:grid-cols-4 gap-5"
    >
      {/* LEFT — Settings List Card (3/4 width) */}
      <div className="xl:col-span-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5 border-b border-gray-100 dark:border-white/5">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                System Configuration{" "}
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                  Settings
                </span>
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Manage system variables, configuration key-values, and platform variables
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  id="setting-search"
                  type="text"
                  placeholder="Search settings..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all w-48 font-medium"
                />
              </div>

              <Button
                id="setting-filter-btn"
                variant="outline"
                onClick={() => setIsFilterDrawerOpen(true)}
                className={cn(
                  "gap-2 h-10 px-4 rounded-xl text-sm font-semibold border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all",
                  activeFilterCount > 0 && "border-primary/50 text-primary bg-primary/5 dark:bg-primary/10"
                )}
              >
                <Filter size={14} />
                Filter
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 bg-primary text-white rounded-full text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <Button
                id="setting-add-btn"
                onClick={() => openFormDrawer()}
                className="gap-2 h-10 px-5 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md hover:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Settings size={15} className="animate-spin-slow" />
                New Parameter
              </Button>
            </div>
          </div>

          <div className="p-6 pt-4">
            <DataTable
              columns={columns}
              data={data?.settings || []}
              loading={isLoading}
              pageCount={Math.ceil((data?.total || 0) / pagination.pageSize)}
              totalCount={data?.total || 0}
              entityName="settings"
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
          title="Total Parameters"
          value={totalData?.total}
          loading={!totalData}
          icon={<Settings size={20} className="text-primary animate-spin-slow" />}
          iconBg="bg-primary/10 dark:bg-primary/15"
          gradient="bg-primary"
        />
        <StatsCard
          title="General"
          value={generalData?.total}
          loading={!generalData}
          icon={<Settings size={20} className="text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-500/15"
          gradient="bg-blue-500"
        />
        <StatsCard
          title="App"
          value={appData?.total}
          loading={!appData}
          icon={<Layout size={20} className="text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-500/15"
          gradient="bg-amber-500"
        />
        <StatsCard
          title="Payment"
          value={paymentData?.total}
          loading={!paymentData}
          icon={<CreditCard size={20} className="text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-500/15"
          gradient="bg-emerald-500"
        />
        <StatsCard
          title="Notification"
          value={notificationData?.total}
          loading={!notificationData}
          icon={<Bell size={20} className="text-purple-600 dark:text-purple-400" />}
          iconBg="bg-purple-50 dark:bg-purple-500/15"
          gradient="bg-purple-500"
        />
        <StatsCard
          title="Security"
          value={securityData?.total}
          loading={!securityData}
          icon={<Shield size={20} className="text-rose-600 dark:text-rose-400" />}
          iconBg="bg-rose-50 dark:bg-rose-500/15"
          gradient="bg-rose-500"
        />
      </div>

      {/* Filter Drawer */}
      <GenericFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        fields={filterFields}
        activeValues={{
          group: groupFilter || "ALL",
        }}
        onApply={(values) => {
          setGroupFilter(values.group === "ALL" ? "" : values.group);
        }}
        onReset={() => {
          resetFilters();
        }}
      />

      {/* Form Drawer */}
      <SettingFormDrawer />

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
              This action cannot be undone. Removing a system parameter might break connected APIs or features.
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
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Parameter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
