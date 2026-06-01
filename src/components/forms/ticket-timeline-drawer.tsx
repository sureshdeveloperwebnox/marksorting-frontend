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
import {
    Loader2,
    Calendar,
    User,
    Clock,
    X,
    FileText,
    History,
    MessageSquare,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useTicketStore from "@/store/useTicketStore";
import { useAuthStore } from "@/store/auth-store";
import {
    useTicket,
    useTicketTimelines,
    useCreateTicketTimeline,
} from "@/services/ticket-service";
import { format, formatDistanceToNow } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";

export function TicketTimelineDrawer() {
    const { isTimelineDrawerOpen, timelineTicketId, closeTimelineDrawer } = useTicketStore();
    const currentUser = useAuthStore((state) => state.user);

    // Fetch ticket details to show context in the header
    const { data: ticket, isLoading: isLoadingTicket } = useTicket(timelineTicketId);
    
    // Fetch timeline entries
    const { data: timelines = [], isLoading: isLoadingTimelines } = useTicketTimelines(timelineTicketId);
    
    // Mutation to add new entry
    const createTimelineMutation = useCreateTicketTimeline(timelineTicketId);

    // Form state
    const [notes, setNotes] = React.useState("");
    const [status, setStatus] = React.useState("");
    const [nextFollowUpDate, setNextFollowUpDate] = React.useState("");
    const [currentTimeString, setCurrentTimeString] = React.useState("");
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync status with ticket when it loads
    React.useEffect(() => {
        if (ticket) {
            setStatus(ticket.status);
        }
    }, [ticket, isTimelineDrawerOpen]);

    // Live clock for the "auto-fetched current date and time am/pm based" field
    React.useEffect(() => {
        if (isTimelineDrawerOpen) {
            // Set initial time
            setCurrentTimeString(format(new Date(), "MMM dd, yyyy, hh:mm a"));

            // Update every minute to keep it fresh
            const interval = setInterval(() => {
                setCurrentTimeString(format(new Date(), "MMM dd, yyyy, hh:mm a"));
            }, 60000);

            return () => clearInterval(interval);
        }
    }, [isTimelineDrawerOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notes.trim()) return;

        const payload: { notes: string; timeline_date: string; status?: string; next_follow_up_date?: string } = {
            notes: notes.trim(),
            timeline_date: new Date().toISOString(),
        };

        if (status) {
            payload.status = status;
        }

        if (nextFollowUpDate) {
            payload.next_follow_up_date = new Date(nextFollowUpDate).toISOString();
        }

        try {
            await createTimelineMutation.mutateAsync(payload);
            setNotes("");
            setNextFollowUpDate("");
        } catch {
            // Handled by service mutation
        }
    };

    return (
        <Sheet open={isTimelineDrawerOpen} onOpenChange={(open) => !open && closeTimelineDrawer()}>
            <SheetContent className="flex flex-col h-full sm:max-w-lg bg-white dark:bg-gray-900 border-none shadow-2xl p-0">
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-orange-500/10 flex items-center justify-center shadow-inner flex-shrink-0">
                            <History className="w-5 h-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                            <SheetTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                Ticket Timeline
                            </SheetTitle>
                            <SheetDescription className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-0.5 truncate">
                                {isLoadingTicket ? "Loading ticket context..." : `${ticket?.ticket_number || "TKT"} — ${ticket?.subject}`}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Timeline Feed Container */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-250 dark:scrollbar-thumb-white/10 bg-gray-50/30 dark:bg-gray-950/10">
                    {isLoadingTimelines || (isLoadingTicket && timelineTicketId) ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching historical feed...</p>
                        </div>
                    ) : timelines.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                            <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-2.5" />
                            <p className="text-sm font-semibold text-gray-750 dark:text-gray-300">No timeline entries yet</p>
                            <p className="text-xs text-gray-450 dark:text-gray-500 mt-1 max-w-[240px]">
                                Add notes below to start documenting ticket updates.
                            </p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-gray-100 dark:border-white/5 pl-6 ml-3 space-y-7">
                            {timelines.map((entry, index) => {
                                const entryDate = new Date(entry.timeline_date);
                                const isLatest = index === 0;

                                return (
                                    <div key={entry.id} className="relative group">
                                        {/* Dot on the timeline */}
                                        <div 
                                            className={cn(
                                                "absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-gray-900 transition-all duration-300",
                                                isLatest 
                                                    ? "border-primary scale-110 shadow-[0_0_8px_rgba(249,115,22,0.4)]" 
                                                    : "border-gray-300 dark:border-white/20 group-hover:border-primary"
                                            )}
                                        />

                                        {/* Entry Card */}
                                        <div className="bg-white dark:bg-gray-800/40 rounded-[18px] border border-gray-100 dark:border-white/5 p-4 shadow-sm hover:shadow-md transition-all duration-300">
                                            {/* Metadata: User & Time */}
                                            <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-gray-50 dark:border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 flex items-center justify-center text-primary flex-shrink-0 border border-orange-500/10">
                                                        <User size={12} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                                                            {entry.user?.full_name || "Unknown User"}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                                                            Staff Representative
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                        {format(entryDate, "hh:mm a")}
                                                    </span>
                                                    <span className="text-[9px] font-medium text-gray-450 dark:text-gray-500">
                                                        {formatDistanceToNow(entryDate, { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Timeline Event Date */}
                                            <div className="flex items-center gap-1 mb-2.5 text-[10px] text-gray-450 dark:text-gray-500 font-bold">
                                                <Clock size={11} className="text-primary/70" />
                                                <span>Filed: {format(entryDate, "PPP hh:mm a")}</span>
                                            </div>

                                            {/* Status Transition Badge (if present) */}
                                            {entry.status && (
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                        Status Transition:
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                                        entry.status === "OPEN" && "bg-blue-500/5 text-blue-500 border-blue-500/20",
                                                        entry.status === "IN_PROGRESS" && "bg-amber-500/5 text-amber-500 border-amber-500/20",
                                                        entry.status === "RESOLVED" && "bg-emerald-500/5 text-emerald-500 border-emerald-500/20",
                                                        entry.status === "ESCALATED" && "bg-rose-500/5 text-rose-500 border-rose-500/20",
                                                    )}>
                                                        {entry.status.replace("_", " ")}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Notes Body */}
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                                {entry.notes}
                                            </p>

                                            {/* Next Follow Up Date (Optional) */}
                                            {entry.next_follow_up_date && (
                                                <div className="mt-3 flex items-center gap-2 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 px-3 py-2 rounded-xl text-amber-600 dark:text-amber-400">
                                                    <Calendar size={13} className="flex-shrink-0" />
                                                    <span className="text-[11px] font-black uppercase tracking-wider">
                                                        Next Follow Up: {format(new Date(entry.next_follow_up_date), "MMM dd, yyyy")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Form to Create Timeline Entry */}
                <form 
                    onSubmit={handleSubmit} 
                    className="px-6 py-5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 space-y-4 flex-shrink-0"
                >
                    {/* Logged User Info (Auto fetched) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary/80 flex items-center gap-1">
                                <User size={10} /> Logged User
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={currentUser?.full_name || "Guest Account"}
                                className="w-full h-10 px-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed select-none"
                            />
                        </div>

                        {/* Current Date & Time (Auto fetched am/pm) */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary/80 flex items-center gap-1">
                                <Clock size={10} /> Auto Filed Date
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={currentTimeString}
                                className="w-full h-10 px-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed select-none"
                            />
                        </div>
                    </div>

                    {/* Notes Textarea */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary/80 flex items-center gap-1">
                            <FileText size={10} /> Timeline Notes
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Add action details, conversation notes, or update logs..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                        />
                    </div>

                    {/* Next Follow Up & Ticket Status Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Ticket Status Selector */}
                        <div className="space-y-1 relative" ref={dropdownRef}>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary/80 flex items-center gap-1">
                                <Clock size={10} /> Ticket Status
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className="w-full h-10 px-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 outline-none flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all select-none"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        status === "OPEN" && "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]",
                                        status === "IN_PROGRESS" && "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
                                        status === "RESOLVED" && "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
                                        status === "ESCALATED" && "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]",
                                    )} />
                                    <span>{status?.replace("_", " ")}</span>
                                </div>
                                <ChevronDown size={14} className={cn("text-gray-400 transition-transform duration-250", isStatusDropdownOpen && "rotate-180")} />
                            </button>

                            {/* Custom Floating Select List */}
                            {isStatusDropdownOpen && (
                                <div className="absolute bottom-full mb-1.5 left-0 w-full bg-white/95 dark:bg-gray-900/95 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-[9999]">
                                    {[
                                        { value: "OPEN", label: "Open", dotColor: "bg-blue-500" },
                                        { value: "IN_PROGRESS", label: "In Progress", dotColor: "bg-amber-500" },
                                        { value: "RESOLVED", label: "Resolved", dotColor: "bg-emerald-500" },
                                        { value: "ESCALATED", label: "Escalated", dotColor: "bg-rose-500" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                setStatus(opt.value);
                                                setIsStatusDropdownOpen(false);
                                            }}
                                            className={cn(
                                                "w-full text-left flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer select-none",
                                                status === opt.value
                                                    ? "bg-primary/10 text-primary font-bold"
                                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full", opt.dotColor)} />
                                            {opt.label.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Next Follow Up Date Selector */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary/80 flex items-center gap-1">
                                <Calendar size={10} /> Next Follow Up Date (Optional)
                            </label>
                            <DatePicker
                                value={nextFollowUpDate}
                                minDate={format(new Date(), "yyyy-MM-dd")}
                                onChange={(val) => setNextFollowUpDate(val)}
                                placeholder="Select date"
                                className="h-10 text-xs font-bold"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeTimelineDrawer}
                            className="flex-1 rounded-xl h-11 text-xs font-bold text-gray-450 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center gap-1"
                        >
                            <X size={13} />
                            Close
                        </Button>
                        <Button
                            type="submit"
                            disabled={createTimelineMutation.isPending || !notes.trim()}
                            className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-lg shadow-primary/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                        >
                            {createTimelineMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                            Save Timeline
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
