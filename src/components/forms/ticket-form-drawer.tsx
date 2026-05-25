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
import { Loader2, TicketCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import useTicketStore from "@/store/useTicketStore";
import {
    useCreateTicket,
    useUpdateTicket,
    useTicket,
} from "@/services/ticket-service";
import { useTechnicians } from "@/services/technician-service";
import { useCustomers } from "@/services/customer-service";
import { useMills } from "@/services/mill-service";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "ESCALATED"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const priorityColors: Record<string, string> = {
    LOW: "bg-slate-400",
    MEDIUM: "bg-amber-400",
    HIGH: "bg-orange-500",
    URGENT: "bg-rose-500",
};

const statusColors: Record<string, string> = {
    OPEN: "bg-blue-500",
    IN_PROGRESS: "bg-amber-500",
    RESOLVED: "bg-emerald-500",
    ESCALATED: "bg-rose-500",
};

const emptyForm = {
    service_engineer_id: "",
    customer_id: "",
    mill_id: "",
    subject: "",
    description: "",
    status: "OPEN",
    priority: "MEDIUM",
};

export function TicketFormDrawer() {
    const { isFormDrawerOpen, selectedId, closeFormDrawer } = useTicketStore();
    const isEdit = !!selectedId;

    const { data: ticket, isLoading: isLoadingTicket } = useTicket(selectedId);
    const { data: techniciansData, isLoading: isLoadingTechnicians } = useTechnicians({ skip: 0, take: 500 });
    const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ skip: 0, take: 500, status: "ACTIVE" });

    const createMutation = useCreateTicket();
    const updateMutation = useUpdateTicket();

    const [form, setForm] = React.useState(emptyForm);

    const selectedCustomerId = form.customer_id;
    const { data: millsData, isLoading: isLoadingMills } = useMills({
        skip: 0,
        take: 500,
        status: "ACTIVE",
        customer_id: selectedCustomerId || undefined,
    });

    React.useEffect(() => {
        if (isEdit && ticket) {
            setForm({
                service_engineer_id: ticket.service_engineer_id || "",
                customer_id: ticket.customer_id || "",
                mill_id: ticket.mill_id || "",
                subject: ticket.subject,
                description: ticket.description,
                status: ticket.status,
                priority: ticket.priority,
            });
        } else if (!isEdit) {
            setForm(emptyForm);
        }
    }, [ticket, isEdit, isFormDrawerOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.service_engineer_id || !form.customer_id || !form.subject || !form.description) return;

        const payload = {
            ...form,
            mill_id: form.mill_id || null,
        };

        if (isEdit && selectedId) {
            await updateMutation.mutateAsync({ id: selectedId, ...payload });
        } else {
            await createMutation.mutateAsync(payload);
        }
        closeFormDrawer();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const technicians = techniciansData?.technicians || [];
    const customers = customersData?.customers || [];
    const mills = selectedCustomerId ? millsData?.mills || [] : [];

    return (
        <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
            <SheetContent className="flex flex-col h-full sm:max-w-lg bg-white dark:bg-gray-900 border-none shadow-2xl p-0">
                <SheetHeader className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner flex-shrink-0">
                            <TicketCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                {isEdit ? "Edit Ticket" : "New Ticket"}
                            </SheetTitle>
                            <SheetDescription className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                                {isEdit ? "Update the support ticket details below." : "Fill in the details to raise a new support ticket."}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {isEdit && isLoadingTicket ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                        </div>
                    ) : (
                        <form id="ticket-form" onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Service Engineer</label>
                                <select
                                    required
                                    value={form.service_engineer_id}
                                    onChange={(e) => setForm((f) => ({ ...f, service_engineer_id: e.target.value }))}
                                    className="w-full h-12 px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                >
                                    <option value="" disabled>
                                        {isLoadingTechnicians ? "Loading engineers..." : "Select Service Engineer..."}
                                    </option>
                                    {technicians.map((engineer) => (
                                        <option key={engineer.id} value={engineer.id} className="bg-white dark:bg-gray-900">
                                            {engineer.full_name}{engineer.email ? ` (${engineer.email})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Customer</label>
                                <select
                                    required
                                    value={form.customer_id}
                                    onChange={(e) => {
                                        const customerId = e.target.value;
                                        setForm((f) => ({ ...f, customer_id: customerId, mill_id: "" }));
                                    }}
                                    className="w-full h-12 px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                >
                                    <option value="" disabled>
                                        {isLoadingCustomers ? "Loading customers..." : "Select Customer..."}
                                    </option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id} className="bg-white dark:bg-gray-900">
                                            {customer.name}{customer.email ? ` (${customer.email})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedCustomerId && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Mill</label>
                                    <select
                                        value={form.mill_id}
                                        onChange={(e) => setForm((f) => ({ ...f, mill_id: e.target.value }))}
                                        className="w-full h-12 px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                    >
                                        <option value="">
                                            {isLoadingMills ? "Loading mills..." : "Select Mill (Optional)..."}
                                        </option>
                                        {mills.map((mill) => (
                                            <option key={mill.id} value={mill.id} className="bg-white dark:bg-gray-900">
                                                {mill.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Subject</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Brief summary of the issue..."
                                    value={form.subject}
                                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                                    className="w-full h-12 px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Describe the issue in detail..."
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Priority</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {PRIORITY_OPTIONS.map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, priority: p }))}
                                            className={cn(
                                                "h-10 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all duration-200",
                                                form.priority === p
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20"
                                            )}
                                        >
                                            <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", priorityColors[p])} />
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isEdit && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Status</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {STATUS_OPTIONS.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setForm((f) => ({ ...f, status: s }))}
                                                className={cn(
                                                    "h-10 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all duration-200 flex items-center justify-center gap-1.5",
                                                    form.status === s
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20"
                                                )}
                                            >
                                                <span className={cn("w-1.5 h-1.5 rounded-full", statusColors[s])} />
                                                {s.replace("_", " ")}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </div>

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
                        form="ticket-form"
                        disabled={isPending}
                        className="flex-1 rounded-2xl h-12 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <TicketCheck size={15} />
                        )}
                        {isEdit ? "Save Changes" : "Create Ticket"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
