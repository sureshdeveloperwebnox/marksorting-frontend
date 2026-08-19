'use client';

import * as React from 'react';
import { Check, ChevronDown, Search, X, Tag } from 'lucide-react';
import { useExpenseCategories } from '@/services/expense-category-service';
import { cn } from '@/lib/utils';

interface ExpenseCategoryMultiSelectProps {
    value: string[];
    onChange: (ids: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function ExpenseCategoryMultiSelect({
    value,
    onChange,
    placeholder = 'Select categories...',
    disabled = false,
}: ExpenseCategoryMultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);

    const { data, isLoading } = useExpenseCategories({ skip: 0, take: 500, status: 'ACTIVE' });
    const categories = data?.expenseCategories || [];

    const filtered = categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedCategories = categories.filter((c) => value.includes(c.id));

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    React.useEffect(() => {
        if (open) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [open]);

    const toggle = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    const remove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter((v) => v !== id));
    };

    return (
        <div ref={containerRef} className="relative">
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => !disabled && setOpen((v) => !v)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!disabled) setOpen((v) => !v);
                    }
                }}
                data-filled={selectedCategories.length > 0}
                className={cn(
                    'w-full min-h-[44px] px-3 py-2 text-left rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 flex items-start gap-2 flex-wrap cursor-pointer',
                    selectedCategories.length > 0
                        ? 'bg-white dark:bg-[#18181b] border-2 border-gray-900 dark:border-white shadow-sm'
                        : 'bg-primary/[0.025] dark:bg-primary/[0.05] border-2 border-primary dark:border-primary',
                    disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
            >
                {selectedCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 flex-1">
                        {selectedCategories.map((c) => (
                            <span
                                key={c.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-lg text-xs font-bold border border-primary/20"
                            >
                                {c.name}
                                <button
                                    type="button"
                                    onClick={(e) => remove(c.id, e)}
                                    className="hover:text-rose-500 transition-colors ml-0.5"
                                >
                                    <X size={11} strokeWidth={3} />
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-400 dark:text-gray-600 text-sm font-medium flex-1 py-0.5">
                        {isLoading ? 'Loading categories...' : placeholder}
                    </span>
                )}

                <ChevronDown
                    size={16}
                    className={cn(
                        'text-gray-400 flex-shrink-0 mt-1 transition-transform duration-200',
                        open && 'rotate-180'
                    )}
                />
            </div>

            {open && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl shadow-black/10 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-white/5">
                        <div className="relative">
                            <Search
                                size={13}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search categories..."
                                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-white/5 rounded-lg outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 font-medium"
                            />
                        </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto py-1.5 scrollbar-thin">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                Loading...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-gray-400">
                                <Tag size={20} className="opacity-40" />
                                <span className="text-xs font-semibold">
                                    {search ? 'No categories match your search' : 'No categories available'}
                                </span>
                            </div>
                        ) : (
                            filtered.map((cat) => {
                                const selected = value.includes(cat.id);
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => toggle(cat.id)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150',
                                            'hover:bg-primary/5 dark:hover:bg-primary/10',
                                            selected && 'bg-primary/5 dark:bg-primary/10'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                                selected
                                                    ? 'bg-primary border-primary'
                                                    : 'border-gray-300 dark:border-white/20'
                                            )}
                                        >
                                            {selected && <Check size={10} strokeWidth={3} className="text-white" />}
                                        </div>

                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-primary font-bold text-xs border border-primary/10 flex-shrink-0">
                                            {cat.name.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={cn('text-sm font-semibold truncate', selected ? 'text-primary' : 'text-gray-800 dark:text-gray-200')}>
                                                {cat.name}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {value.length > 0 && (
                        <div className="px-3 py-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-semibold">
                                {value.length} categor{value.length !== 1 ? 'ies' : 'y'} selected
                            </span>
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                className="text-xs text-rose-500 font-bold hover:text-rose-600 transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
