'use client';

import * as React from 'react';
import { Check, ChevronDown, Search, X, Package, Plus, Loader2 } from 'lucide-react';
import { useMaterials, useCreateMaterial } from '@/services/store-service';
import { cn } from '@/lib/utils';

interface MaterialMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MaterialMultiSelect({
  value,
  onChange,
  placeholder = 'Select materials...',
  disabled = false,
}: MaterialMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Fetch active materials
  const { data, isLoading } = useMaterials({ skip: 0, take: 500, status: 'ACTIVE' });
  const materials = data?.materials || [];

  const { mutateAsync: createMaterial, isPending: isCreating } = useCreateMaterial();

  const filtered = materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedMaterials = materials.filter((m) => value.includes(m.id));

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

  const handleAddNewMaterial = async () => {
    if (!search.trim()) return;
    try {
      const newMaterial = await createMaterial({ name: search.trim() });
      onChange([...value, newMaterial.id]);
      setSearch('');
    } catch (error) {
      // toast is shown in useCreateMaterial onSuccess/onError
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        data-filled={selectedMaterials.length > 0}
        className={cn(
          'w-full min-h-[44px] px-3 py-2 text-left cursor-pointer rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 flex items-start gap-2 flex-wrap',
          selectedMaterials.length > 0
            ? 'bg-white dark:bg-[#18181b] border-2 border-gray-900 dark:border-white shadow-sm'
            : 'bg-primary/[0.025] dark:bg-primary/[0.05] border-2 border-primary dark:border-primary',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        {selectedMaterials.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedMaterials.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-lg text-xs font-bold border border-primary/20"
              >
                {m.name}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => remove(m.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      remove(m.id, e as any);
                    }
                  }}
                  className="hover:text-rose-500 transition-colors ml-0.5 cursor-pointer"
                >
                  <X size={11} strokeWidth={3} />
                </span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-600 text-sm font-medium flex-1 py-1">
            {isLoading ? 'Loading materials...' : placeholder}
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

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl shadow-black/10 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-white/5 flex gap-1.5">
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search materials..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-white/5 rounded-lg outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 font-medium"
              />
            </div>
            {search.trim() && (
              <button
                type="button"
                onClick={handleAddNewMaterial}
                disabled={isCreating}
                className="flex items-center gap-1 px-3 py-2 text-xs bg-primary hover:bg-primary/95 text-white rounded-lg font-bold shadow-md shadow-primary/10 disabled:opacity-50 flex-shrink-0"
              >
                {isCreating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Plus size={12} strokeWidth={3} />
                )}
                Add New
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto py-1.5 scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-gray-400">
                <Package size={20} className="opacity-40" />
                <span className="text-xs font-semibold text-center px-4">
                  {search ? 'No materials match' : 'No materials available'}
                </span>
                <p className="text-[10px] text-gray-400 font-medium text-center px-4 max-w-[220px]">
                  {search ? 'Press "Add New" button above to create it' : 'Type in the search box to search or create a new material'}
                </p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={handleAddNewMaterial}
                    disabled={isCreating}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1"
                  >
                    Create new material "{search.trim()}"
                  </button>
                )}
              </div>
            ) : (
              filtered.map((material) => {
                const selected = value.includes(material.id);
                return (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => toggle(material.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150',
                      'hover:bg-primary/5 dark:hover:bg-primary/10',
                      selected && 'bg-primary/5 dark:bg-primary/10'
                    )}
                  >
                    {/* Checkbox */}
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

                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', selected ? 'text-primary' : 'text-gray-800 dark:text-gray-200')}>
                        {material.name}
                      </p>
                      {material.description && (
                        <p className="text-[11px] text-gray-400 truncate">{material.description}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count */}
          {value.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">
                {value.length} material{value.length !== 1 ? 's' : ''} selected
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
