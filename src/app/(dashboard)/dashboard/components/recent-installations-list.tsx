'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Settings } from 'lucide-react';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { cn } from '@/lib/utils';

export interface InstallationListItem {
  id: string;
  name: string;
  type: string;
  status: string; // e.g. 'COMPLETED', 'PENDING', 'IN_PROGRESS'
  date?: string;
  color?: string;
}

interface RecentInstallationsListProps {
  data?: InstallationListItem[];
}

export function RecentInstallationsList({ data = [] }: RecentInstallationsListProps) {
  const router = useRouter();

  // Handle click to view all installations
  const handleViewAll = () => {
    router.push('/installation-management/installation-report');
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('complete') || s === 'active' || s === 'approved') {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
    }
    if (s.includes('progress') || s === 'pending') {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    }
    return 'bg-zinc-50 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400';
  };

  return (
    <DashboardCard
      title="Recent Installations"
      action={
        <button
          onClick={handleViewAll}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors select-none cursor-pointer"
        >
          View All <ArrowRight size={14} />
        </button>
      }
      className="h-full flex flex-col justify-between"
    >
      <div className="flex flex-col gap-3.5 mt-2 max-h-[320px] overflow-y-auto pr-1">
        {data.map((item) => {
          const statusText = item.status === 'COMPLETED' ? 'Completed' : item.status === 'IN_PROGRESS' ? 'In Progress' : item.status;
          // Set a default nice formatted date if not provided
          const displayDate = item.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 p-3 rounded-lg border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0">
                  <Settings size={16} className="animate-spin-slow" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate max-w-[180px]">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5 truncate max-w-[180px]">
                    {item.type || 'Standard setup'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full select-none capitalize', getStatusBadgeClass(item.status))}>
                  {statusText}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
                  {displayDate}
                </span>
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <div className="text-center py-8 text-xs text-zinc-400 font-medium">
            No recent installations found.
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
