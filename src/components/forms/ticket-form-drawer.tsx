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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TicketCheck, X, PlusCircle, Cpu, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import useTicketStore from "@/store/useTicketStore";
import {
    useCreateTicket,
    useUpdateTicket,
    useTicket,
} from "@/services/ticket-service";
import { useTechnicians } from "@/services/technician-service";
import { useCustomers, useCreateCustomer } from "@/services/customer-service";
import { useMills, useCreateMill } from "@/services/mill-service";
import { useMasterMills, useCreateMasterMill } from "@/services/master-mill-service";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { StateSearchSelect } from "@/components/ui/state-search-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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

    // Mutations for quick inline registration
    const { mutateAsync: createCustomer } = useCreateCustomer();
    const { mutateAsync: createMill } = useCreateMill();
    const { mutateAsync: createMasterMill } = useCreateMasterMill();

    const [form, setForm] = React.useState(emptyForm);

    const selectedCustomerId = form.customer_id;
    const { data: millsData, isLoading: isLoadingMills } = useMills({
        skip: 0,
        take: 500,
        status: "ACTIVE",
        customer_id: selectedCustomerId || undefined,
    });

    // Dialog State Variables for Customer & Mill
    const [isQuickCreateOpen, setIsQuickCreateOpen] = React.useState(false);
    const [quickCustomerName, setQuickCustomerName] = React.useState('');
    const [quickMillName, setQuickMillName] = React.useState('');
    const [quickPhone, setQuickPhone] = React.useState('');
    const [quickAddress, setQuickAddress] = React.useState('');
    const [quickPlace, setQuickPlace] = React.useState('');
    const [quickState, setQuickState] = React.useState('');
    const [quickRefNo, setQuickRefNo] = React.useState('');
    const [existingCustomerId, setExistingCustomerId] = React.useState<string | null>(null);
    const [isQuickRegistering, setIsQuickRegistering] = React.useState(false);

    // Dialog State Variables for Master Mill (Machine Installation)
    const [isQuickMasterMillOpen, setIsQuickMasterMillOpen] = React.useState(false);
    const [quickInvoiceNo, setQuickInvoiceNo] = React.useState('');
    const [quickInvoiceDate, setQuickInvoiceDate] = React.useState('');
    const [quickMasterMillRefNo, setQuickMasterMillRefNo] = React.useState('');
    const [quickMcModel, setQuickMcModel] = React.useState('');
    const [quickFrameNo, setQuickFrameNo] = React.useState('');
    const [quickInstallationDate, setQuickInstallationDate] = React.useState('');
    const [quickWarrantyYears, setQuickWarrantyYears] = React.useState(1);
    const [quickWarrantyMonths, setQuickWarrantyMonths] = React.useState(12);
    const [quickWarrantyType, setQuickWarrantyType] = React.useState('Non Warranty');
    const [isQuickMasterMillRegistering, setIsQuickMasterMillRegistering] = React.useState(false);

    // Search Machine by Ref No / Frame No states
    const [machineSearchQuery, setMachineSearchQuery] = React.useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('');

    // Controlled machine selection state
    const [selectedMachineId, setSelectedMachineId] = React.useState<string>('');

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(machineSearchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [machineSearchQuery]);

    // Query master mills matching search term (global search, not mill_id restricted)
    const trimmedSearchQuery = debouncedSearchQuery.trim();
    const { data: searchMasterMillsData, isLoading: searchMasterMillsLoading } = useMasterMills(
        {
            search: trimmedSearchQuery || undefined,
            skip: 0,
            take: 10,
        },
        { enabled: trimmedSearchQuery.length >= 2 }
    );
    const searchedMasterMills = searchMasterMillsData?.masterMills || [];

    // Fetch master mills for the selected mill
    const { data: masterMillsData, isLoading: masterMillsLoading } = useMasterMills(
        {
            mill_id: form.mill_id || undefined,
            skip: 0,
            take: 100,
            status: 'ACTIVE',
        },
        { enabled: !!form.mill_id }
    );
    const masterMills = masterMillsData?.masterMills || [];

    // Similar existing customers based on quickCustomerName
    const similarCustomers = React.useMemo(() => {
        if (!quickCustomerName || quickCustomerName.trim().length < 2) return [];
        const search = quickCustomerName.toLowerCase().trim();
        return customersData?.customers.filter(
            (c) => c.name.toLowerCase().includes(search) && c.id !== existingCustomerId
        ).slice(0, 5) || [];
    }, [quickCustomerName, customersData?.customers, existingCustomerId]);

    // Synchronize selectedMachineId when mill changes
    React.useEffect(() => {
        if (!form.mill_id || !selectedMachineId) return;
        const match = masterMills.find((m) => m.id === selectedMachineId);
        if (!match || match.mill_id !== form.mill_id) {
            setSelectedMachineId('');
        }
    }, [form.mill_id, masterMills, selectedMachineId]);

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
            setSelectedMachineId('');
            setMachineSearchQuery('');
        } else if (!isEdit) {
            setForm(emptyForm);
            setSelectedMachineId('');
            setMachineSearchQuery('');
        }
    }, [ticket, isEdit, isFormDrawerOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.service_engineer_id) {
            toast.error("Please select a Service Engineer");
            return;
        }
        if (!form.customer_id) {
            toast.error("Please select a Customer");
            return;
        }
        if (!form.subject.trim()) {
            toast.error("Please enter a Subject");
            return;
        }
        if (!form.description.trim()) {
            toast.error("Please enter a Description");
            return;
        }

        const payload = {
            ...form,
            mill_id: form.mill_id || null,
        };

        try {
            if (isEdit && selectedId) {
                await updateMutation.mutateAsync({ id: selectedId, ...payload });
                toast.success("Ticket updated successfully!");
            } else {
                await createMutation.mutateAsync(payload);
                toast.success("Ticket created successfully!");
            }
            closeFormDrawer();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save ticket");
        }
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

                            {/* Search Machine by Ref No / Frame No / Customer / Mill directly */}
                            <div className="space-y-1.5 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Cpu size={14} className="text-primary/70" />
                                    Search Machine to Prefill (REF NO / Frame No / Customer / Mill)
                                </Label>
                                <Input
                                    value={machineSearchQuery}
                                    onChange={(e) => setMachineSearchQuery(e.target.value)}
                                    placeholder="Type REF NO, Frame No, Customer or Mill to search..."
                                    className="h-11 bg-white dark:bg-gray-905 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                                />
                                
                                {/* Search Results List */}
                                {machineSearchQuery.trim().length >= 2 && (
                                    <div className="mt-2 bg-white dark:bg-gray-955 rounded-xl border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5 max-h-48 overflow-y-auto shadow-lg z-20 relative">
                                        {searchMasterMillsLoading ? (
                                            <div className="p-3 text-xs text-gray-400 font-bold flex items-center gap-2">
                                                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                                Searching...
                                            </div>
                                        ) : searchedMasterMills.length > 0 ? (
                                            searchedMasterMills.map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (m.mill_id) {
                                                            const millCustomerId = m.mill?.customer_id;
                                                            if (millCustomerId) {
                                                                setForm((f) => ({ ...f, customer_id: millCustomerId || "", mill_id: m.mill_id || "" }));
                                                            } else {
                                                                const localMill = mills.find(millItem => millItem.id === m.mill_id);
                                                                if (localMill?.customer_id) {
                                                                    setForm((f) => ({ ...f, customer_id: localMill.customer_id || "", mill_id: m.mill_id || "" }));
                                                                } else {
                                                                    setForm((f) => ({ ...f, mill_id: m.mill_id || "" }));
                                                                }
                                                            }
                                                        }
                                                        setSelectedMachineId(m.id);
                                                        setMachineSearchQuery('');
                                                        toast.success('Machine details prefilled! Verify and adjust as needed.');
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-xs flex flex-col gap-1 cursor-pointer group"
                                                >
                                                    <div className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                                                        {m.mill?.customer?.name ? `${m.mill.customer.name} — ` : ''}{m.mill?.name || 'Unknown Mill'}
                                                    </div>
                                                    <div className="text-gray-400 font-medium">
                                                        {[
                                                            (m.ref_no || m.mill?.ref_no) ? `Ref: ${m.ref_no || m.mill?.ref_no}` : null,
                                                            m.frame_no ? `Frame: ${m.frame_no}` : null,
                                                            m.mc_model ? `Model: ${m.mc_model}` : null,
                                                            (m.place || m.mill?.place) ? `Place: ${m.place || m.mill?.place}` : null,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' | ')}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-xs text-gray-400 font-bold flex flex-col gap-2">
                                                <span>No matching machines found</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setQuickCustomerName('');
                                                        setQuickMillName('');
                                                        setQuickPhone('');
                                                        setQuickAddress('');
                                                        setQuickPlace('');
                                                        setQuickState('');
                                                        setQuickRefNo(machineSearchQuery);
                                                        setExistingCustomerId(null);
                                                        setIsQuickCreateOpen(true);
                                                        setMachineSearchQuery('');
                                                    }}
                                                    className="w-fit text-left text-primary hover:underline flex items-center gap-1 cursor-pointer font-black border-none bg-transparent p-0"
                                                >
                                                    <PlusCircle size={12} />
                                                    Quick Register Customer & Mill
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Customer</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuickCustomerName('');
                                            setQuickMillName('');
                                            setQuickPhone('');
                                            setQuickAddress('');
                                            setQuickPlace('');
                                            setQuickState('');
                                            setQuickRefNo('');
                                            setExistingCustomerId(null);
                                            setIsQuickCreateOpen(true);
                                        }}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent p-0"
                                    >
                                        <PlusCircle size={12} />
                                        Quick Register
                                    </button>
                                </div>
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
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase tracking-widest text-primary/70">Mill</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuickCustomerName(customers.find(c => c.id === selectedCustomerId)?.name || '');
                                                setExistingCustomerId(selectedCustomerId);
                                                setQuickMillName('');
                                                setQuickPhone('');
                                                setQuickAddress('');
                                                setQuickPlace('');
                                                setQuickState('');
                                                setQuickRefNo('');
                                                setIsQuickCreateOpen(true);
                                            }}
                                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent p-0"
                                        >
                                            <PlusCircle size={12} />
                                            Quick Add Mill
                                        </button>
                                    </div>
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

                            {form.mill_id && (
                                <div className="space-y-1.5 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
                                            <Cpu size={14} className="text-primary/70" />
                                            Select Machine (REF NO / Frame No)
                                        </Label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuickInvoiceNo('');
                                                setQuickInvoiceDate('');
                                                setQuickMasterMillRefNo('');
                                                setQuickMcModel('');
                                                setQuickFrameNo('');
                                                setQuickInstallationDate('');
                                                setQuickWarrantyYears(1);
                                                setQuickWarrantyMonths(12);
                                                setQuickWarrantyType('Non Warranty');
                                                setIsQuickMasterMillOpen(true);
                                            }}
                                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent p-0"
                                        >
                                            <PlusCircle size={12} />
                                            Add Machine
                                        </button>
                                    </div>
                                    {masterMillsLoading ? (
                                        <div className="h-11 bg-gray-50/50 dark:bg-white/5 rounded-xl animate-pulse" />
                                    ) : (
                                        <select
                                            value={selectedMachineId || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedMachineId(val || '');
                                                const m = masterMills.find((rec) => rec.id === val);
                                                if (m) {
                                                    toast.success(`Machine selected: ${m.ref_no || m.frame_no}`);
                                                }
                                            }}
                                            className="w-full h-12 px-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                                        >
                                            <option value="">Select a machine record...</option>
                                            {masterMills.map((m, idx) => {
                                                const displayRef = m.ref_no || m.mill?.ref_no;
                                                const parts = [
                                                    displayRef ? `Ref: ${displayRef}` : null,
                                                    m.frame_no ? `Frame: ${m.frame_no}` : null,
                                                    m.mc_model ? `Model: ${m.mc_model}` : null,
                                                ].filter(Boolean);
                                                const label =
                                                    parts.join(' | ') ||
                                                    (m.invoice_no ? `Invoice: ${m.invoice_no}` : null) ||
                                                    (m.mill?.name ? `${m.mill.name} — Record ${idx + 1}` : null) ||
                                                    `Machine Record ${idx + 1}`;
                                                return (
                                                    <option key={m.id} value={m.id} className="bg-white dark:bg-gray-900">
                                                        {label}
                                                    </option>
                                                );
                                            })}
                                            {masterMills.length === 0 && (
                                                <option disabled className="text-gray-400">
                                                    No master mill records found for this mill
                                                </option>
                                            )}
                                        </select>
                                    )}
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

                {/* Quick Register Customer & Mill Dialog */}
                <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
                  <DialogContent className="sm:max-w-[480px] bg-white dark:bg-gray-955 rounded-2xl border border-gray-100 dark:border-white/5">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-black text-gray-800 dark:text-gray-200">
                        {existingCustomerId ? 'Register Mill' : 'Register Customer & Mill'}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-gray-400">
                        {existingCustomerId 
                          ? 'Create a new mill under the current customer.' 
                          : 'Create a new customer and link a new mill with basic details.'}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 my-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
                      {/* Customer Name (disabled if existing) */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Customer Name *
                        </Label>
                        <Input
                          value={quickCustomerName}
                          onChange={(e) => setQuickCustomerName(e.target.value)}
                          disabled={!!existingCustomerId}
                          placeholder="e.g. Seva Mandir"
                          className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                        />
                        
                        {/* Duplicate warnings/suggestions */}
                        {!existingCustomerId && similarCustomers.length > 0 && (
                          <div className="mt-1.5 p-2 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
                            <p className="text-[10px] text-amber-500 font-bold">Similar existing customers found:</p>
                            <div className="flex flex-wrap gap-1">
                              {similarCustomers.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setExistingCustomerId(c.id);
                                    setQuickCustomerName(c.name);
                                  }}
                                  className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer"
                                >
                                  Use: {c.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Mill Name */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Mill Name *
                        </Label>
                        <Input
                          value={quickMillName}
                          onChange={(e) => setQuickMillName(e.target.value)}
                          placeholder="e.g. Seva Mandir Mill 1"
                          className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                        />
                      </div>

                      {/* Ref No */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Ref No / Code
                        </Label>
                        <Input
                          value={quickRefNo}
                          onChange={(e) => setQuickRefNo(e.target.value)}
                          placeholder="e.g. P-0005"
                          className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                        />
                      </div>

                      {/* Address */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Full Address
                        </Label>
                        <Input
                          value={quickAddress}
                          onChange={(e) => setQuickAddress(e.target.value)}
                          placeholder="e.g. 123 Main Street"
                          className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                        />
                      </div>

                      {/* Place */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Place / City
                        </Label>
                        <Input
                          value={quickPlace}
                          onChange={(e) => setQuickPlace(e.target.value)}
                          placeholder="e.g. Coimbatore"
                          className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                        />
                      </div>

                      {/* State Select */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          State
                        </Label>
                        <StateSearchSelect
                          value={quickState}
                          onChange={setQuickState}
                          placeholder="Select state..."
                          openDirection="up"
                          className="h-10 text-sm font-bold border-none"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          WhatsApp Phone Number
                        </Label>
                        <PhoneInput
                          value={quickPhone}
                          onChange={setQuickPhone}
                          placeholder="Enter phone number"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <DialogFooter className="border-t border-gray-100 dark:border-white/5 pt-3 gap-2 flex-col sm:flex-row">
                      {existingCustomerId && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setExistingCustomerId(null);
                            setQuickCustomerName('');
                          }}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          Change Customer
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsQuickCreateOpen(false)}
                        className="rounded-xl h-10 font-bold"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        disabled={isQuickRegistering || !quickMillName.trim() || (!existingCustomerId && !quickCustomerName.trim())}
                        onClick={async () => {
                          setIsQuickRegistering(true);
                          try {
                            let customerId = existingCustomerId;

                            // Create customer if not exists
                            if (!customerId) {
                              const exactMatch = customersData?.customers.find(
                                (c) => c.name.toLowerCase().trim() === quickCustomerName.toLowerCase().trim()
                              );
                              if (exactMatch) {
                                customerId = exactMatch.id;
                              } else {
                                const newCust = await createCustomer({
                                  name: quickCustomerName.trim(),
                                  phone: quickPhone || undefined,
                                  address: quickAddress || undefined,
                                  status: 'ACTIVE',
                                });
                                customerId = newCust.id;
                              }
                            }

                            // Check if mill already exists under this customer
                            const existingMills = mills.filter(m => m.customer_id === customerId);
                            const exactMillMatch = existingMills.find(
                              (m) => m.name.toLowerCase().trim() === quickMillName.toLowerCase().trim()
                            );

                            let millId = exactMillMatch?.id;

                            if (!millId) {
                              const newMill = await createMill({
                                name: quickMillName.trim(),
                                ref_no: quickRefNo.trim() || undefined,
                                customer_id: customerId,
                                phone: quickPhone || undefined,
                                address: quickAddress || undefined,
                                place: quickPlace || undefined,
                                city: quickPlace || undefined,
                                status: 'ACTIVE',
                              });
                              millId = newMill.id;
                            } else {
                              toast.info('Mill already exists, linking to it.');
                            }

                            // Create Master Mill (Machine Installation Record) if quickRefNo is provided
                            let createdMasterMillId = '';
                            if (quickRefNo.trim()) {
                              try {
                                const newMasterMill = await createMasterMill({
                                  invoice_no: 'QR-' + quickRefNo.trim(),
                                  ref_no: quickRefNo.trim(),
                                  frame_no: quickRefNo.trim(),
                                  mill_id: millId,
                                  place: quickPlace || undefined,
                                  state: quickState || undefined,
                                  phone_no: quickPhone || undefined,
                                  status: 'ACTIVE',
                                  type: 'Installation',
                                  installation_date: new Date().toISOString(),
                                });
                                createdMasterMillId = newMasterMill.id;
                              } catch (masterMillErr) {
                                console.error('Failed to auto-create master mill record:', masterMillErr);
                              }
                            }

                            // Update form selections
                            setForm((f) => ({
                                ...f,
                                customer_id: customerId || '',
                                mill_id: millId || ''
                            }));

                            if (createdMasterMillId) {
                              setSelectedMachineId(createdMasterMillId);
                            }
                            
                            toast.success('Customer, Mill, and Machine linked successfully!');
                            setIsQuickCreateOpen(false);
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Failed to register Customer & Mill');
                          } finally {
                            setIsQuickRegistering(false);
                          }
                        }}
                        className="rounded-xl h-10 bg-primary hover:bg-primary/90 text-white font-bold"
                      >
                        {isQuickRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Quick Register Machine (Master Mill Record) Dialog */}
                <Dialog open={isQuickMasterMillOpen} onOpenChange={setIsQuickMasterMillOpen}>
                  <DialogContent className="sm:max-w-[480px] bg-white dark:bg-gray-955 rounded-2xl border border-gray-100 dark:border-white/5">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-black text-gray-800 dark:text-gray-200">
                        Register Machine (Master Mill Record)
                      </DialogTitle>
                      <DialogDescription className="text-xs text-gray-400">
                        Add a new machine installation/service record for the selected mill: 
                        <strong> {mills.find(m => m.id === form.mill_id)?.name}</strong>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 my-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
                      {/* Invoice No */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Invoice No *
                        </Label>
                        <Input
                          value={quickInvoiceNo}
                          onChange={(e) => setQuickInvoiceNo(e.target.value)}
                          placeholder="e.g. INV-0036"
                          className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                        />
                      </div>

                      {/* Invoice Date */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Invoice Date
                        </Label>
                        <DatePicker
                          value={quickInvoiceDate}
                          onChange={setQuickInvoiceDate}
                          placeholder="Select invoice date"
                        />
                      </div>

                      {/* Ref No */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Ref No / Code
                        </Label>
                        <Input
                          value={quickMasterMillRefNo}
                          onChange={(e) => setQuickMasterMillRefNo(e.target.value)}
                          placeholder="e.g. P-0005"
                          className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                        />
                      </div>

                      {/* MC Model */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Machine Model
                        </Label>
                        <Input
                          value={quickMcModel}
                          onChange={(e) => setQuickMcModel(e.target.value)}
                          placeholder="e.g. RX-40"
                          className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                        />
                      </div>

                      {/* Frame No */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Frame / W No *
                        </Label>
                        <Input
                          value={quickFrameNo}
                          onChange={(e) => setQuickFrameNo(e.target.value)}
                          placeholder="e.g. Frame 12345"
                          className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                        />
                      </div>

                      {/* Installation Date */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                          Installation Date
                        </Label>
                        <DatePicker
                          value={quickInstallationDate}
                          onChange={setQuickInstallationDate}
                          placeholder="Select installation date"
                        />
                      </div>

                      {/* Warranty type */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">Years</Label>
                          <Input
                            type="number"
                            value={quickWarrantyYears}
                            onChange={(e) => setQuickWarrantyYears(Number(e.target.value))}
                            className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">Months</Label>
                          <Input
                            type="number"
                            value={quickWarrantyMonths}
                            onChange={(e) => setQuickWarrantyMonths(Number(e.target.value))}
                            className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">Warranty</Label>
                          <Select
                            value={quickWarrantyType}
                            onValueChange={(val) => setQuickWarrantyType(val || 'Non Warranty')}
                          >
                            <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                              <SelectItem value="Non Warranty" className="font-bold py-2 text-xs">Non Warranty</SelectItem>
                              <SelectItem value="Under Warranty" className="font-bold py-2 text-xs">Under Warranty</SelectItem>
                              <SelectItem value="Expired" className="font-bold py-2 text-xs">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="border-t border-gray-100 dark:border-white/5 pt-3 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsQuickMasterMillOpen(false)}
                        className="rounded-xl h-10 font-bold"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        disabled={isQuickMasterMillRegistering || !quickInvoiceNo.trim() || !quickFrameNo.trim()}
                        onClick={async () => {
                          setIsQuickMasterMillRegistering(true);
                          try {
                            // Duplicate check
                            const duplicate = masterMills.find(
                              (m) => m.frame_no?.toLowerCase().trim() === quickFrameNo.toLowerCase().trim()
                            );
                            if (duplicate) {
                              toast.error(`A machine with Frame No "${quickFrameNo}" is already registered.`);
                              setIsQuickMasterMillRegistering(false);
                              return;
                            }

                            const selectedMill = mills.find((m) => m.id === form.mill_id);

                            const newRecord = await createMasterMill({
                              type: 'Installation',
                              invoice_no: quickInvoiceNo.trim(),
                              invoice_date: quickInvoiceDate || undefined,
                              ref_no: quickMasterMillRefNo.trim() || undefined,
                              mill_id: form.mill_id,
                              mc_model: quickMcModel.trim() || undefined,
                              frame_no: quickFrameNo.trim(),
                              address: selectedMill?.address || undefined,
                              place: selectedMill?.place || undefined,
                              phone_no: selectedMill?.phone || undefined,
                              warranty_years: quickWarrantyYears,
                              warranty_months: quickWarrantyMonths,
                              all_warranty: quickWarrantyType,
                              installation_date: quickInstallationDate || undefined,
                              status: 'ACTIVE',
                            });

                            // Automatically select
                            setSelectedMachineId(newRecord.id);

                            toast.success('Machine record created and selected successfully!');
                            setIsQuickMasterMillOpen(false);
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Failed to create machine record');
                          } finally {
                            setIsQuickMasterMillRegistering(false);
                          }
                        }}
                        className="rounded-xl h-10 bg-primary hover:bg-primary/90 text-white font-bold"
                      >
                        {isQuickMasterMillRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Select'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            </SheetContent>
        </Sheet>
    );
}
