"use client";

import * as React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import useSettingStore from "@/store/useSettingStore";
import {
    useCreateSetting,
    useUpdateSetting,
    useSetting,
} from "@/services/setting-service";

const GROUP_OPTIONS = ["GENERAL", "APP", "PAYMENT", "NOTIFICATION", "SECURITY", "COMPANY"];

const groupColors: Record<string, string> = {
    GENERAL: "bg-blue-500",
    APP: "bg-amber-500",
    PAYMENT: "bg-emerald-500",
    NOTIFICATION: "bg-purple-500",
    SECURITY: "bg-rose-500",
    COMPANY: "bg-teal-500",
};

export function SettingFormDrawer() {
    const { isFormDrawerOpen, selectedId, closeFormDrawer } = useSettingStore();
    const isEdit = !!selectedId;

    const { data: setting, isLoading: isLoadingSetting } = useSetting(selectedId);

    const createMutation = useCreateSetting();
    const updateMutation = useUpdateSetting();

    const [form, setForm] = React.useState({
        key: "",
        value: "",
        group: "GENERAL",
    });

    // Populate form on edit
    React.useEffect(() => {
        if (isEdit && setting) {
            setForm({
                key: setting.key,
                value: setting.value,
                group: setting.group,
            });
        } else if (!isEdit) {
            setForm({ key: "", value: "", group: "GENERAL" });
        }
    }, [setting, isEdit, isFormDrawerOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.key || !form.value || !form.group) return;

        if (isEdit && selectedId) {
            await updateMutation.mutateAsync({ id: selectedId, ...form });
        } else {
            await createMutation.mutateAsync(form);
        }
        closeFormDrawer();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
            <SheetContent side="right">
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner flex-shrink-0">
                            <Settings className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                {isEdit ? "Edit Setting" : "New Setting"}
                            </SheetTitle>
                            <SheetDescription className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                                {isEdit ? "Update configuration parameter details below." : "Add a new configuration parameter to the system."}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {isEdit && isLoadingSetting ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                        </div>
                    ) : (
                        <form id="setting-form" onSubmit={handleSubmit} className="space-y-5">
                            {/* Key */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Setting Key</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. SYSTEM_MAINTENANCE_MODE"
                                    value={form.key}
                                    onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                                    disabled={isEdit}
                                    className="w-full h-12 px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            {/* Group */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Group</label>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {GROUP_OPTIONS.map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, group: g }))}
                                            className={cn(
                                                "h-10 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all duration-200 flex items-center justify-center gap-1.5",
                                                form.group === g
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20"
                                            )}
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full", groupColors[g])} />
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Value */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Value</label>
                                <textarea
                                    required
                                    rows={6}
                                    placeholder="Enter setting value (JSON strings, text, or integers)..."
                                    value={form.value}
                                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                                />
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <SheetFooter className="px-6 pb-6 pt-4 border-t border-gray-100 dark:border-white/5 flex gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={closeFormDrawer}
                        className="flex-1 rounded-2xl h-12 font-black text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 gap-2"
                    >
                        <X size={15} />
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="setting-form"
                        disabled={isPending}
                        className="flex-1 rounded-2xl h-12 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Settings size={15} />
                        )}
                        {isEdit ? "Save Changes" : "Create Parameter"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
