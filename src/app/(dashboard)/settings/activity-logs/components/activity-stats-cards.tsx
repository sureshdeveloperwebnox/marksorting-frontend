'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ActivityStats } from '../types/activity-log.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, User, BarChart3, LogIn, LogOut, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityStatsCardsProps {
  stats?: ActivityStats;
  isLoading: boolean;
}

/* ─── Stats Card Component ───────────────────────────────────────── */

interface StatsCardProps {
  title: string;
  value: string | number | undefined;
  subtext?: string;
  icon: React.ReactNode;
  iconBg: string;
  gradient: string;
  trend?: string;
  loading?: boolean;
  delay?: number;
}

function StatsCard({ title, value, subtext, icon, iconBg, gradient, trend, loading, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-[20px] p-5 border border-gray-100 dark:border-white/5',
        'bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-300'
      )}
    >
      <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 -translate-y-6 translate-x-6', gradient)} />
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
          {trend && (
            <p className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
              <TrendingUp size={11} />
              {trend}
            </p>
          )}
          {subtext && !trend && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {subtext}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm', iconBg)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────── */

export function ActivityStatsCards({ stats, isLoading }: ActivityStatsCardsProps) {
  // Convert stats values for display
  const totalActivities = stats?.total_activities?.toLocaleString();
  const mostActiveUser = stats?.most_active_user?.full_name ?? '—';
  const mostActiveCount = stats?.most_active_user?.activity_count;
  const mostCommonAction = stats?.most_common_action?.action ?? '—';
  const mostCommonCount = stats?.most_common_action?.count;
  const loginCount = stats?.login_count ?? 0;
  const logoutCount = stats?.logout_count ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Total Activities */}
      <StatsCard
        title="Total Activities"
        value={totalActivities}
        icon={<Activity size={20} className="text-primary" />}
        iconBg="bg-primary/10 dark:bg-primary/15"
        gradient="bg-primary"
        trend="In selected period"
        loading={isLoading}
        delay={0}
      />

      {/* Most Active User */}
      <StatsCard
        title="Most Active User"
        value={mostActiveUser}
        subtext={mostActiveCount ? `${mostActiveCount} activities` : undefined}
        icon={<User size={20} className="text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-emerald-50 dark:bg-emerald-500/15"
        gradient="bg-emerald-500"
        loading={isLoading}
        delay={0.1}
      />

      {/* Most Common Action */}
      <StatsCard
        title="Most Common Action"
        value={mostCommonAction}
        subtext={mostCommonCount ? `${mostCommonCount} times` : undefined}
        icon={<BarChart3 size={20} className="text-violet-600 dark:text-violet-400" />}
        iconBg="bg-violet-50 dark:bg-violet-500/15"
        gradient="bg-violet-500"
        loading={isLoading}
        delay={0.2}
      />

      {/* Session Activity */}
      <StatsCard
        title="Session Activity"
        value={`${loginCount} / ${logoutCount}`}
        subtext="Logins / Logouts"
        icon={
          <div className="flex -space-x-1">
            <LogIn size={16} className="text-emerald-600 dark:text-emerald-400" />
            <LogOut size={16} className="text-gray-400" />
          </div>
        }
        iconBg="bg-amber-50 dark:bg-amber-500/15"
        gradient="bg-amber-500"
        loading={isLoading}
        delay={0.3}
      />

      {/* Quick Stats Gradient Card */}
      {!isLoading && stats && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[20px] p-5 bg-gradient-to-br from-primary to-orange-500 border border-primary/20 shadow-sm shadow-primary/20"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bS0xMiAxMnY2aDZ2LTZoLTZ6bTAtMTJ2Nmg2di02aC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <p className="text-xs font-bold text-white/70 uppercase tracking-[0.12em] mb-2 relative">Activity Insights</p>
          <div className="space-y-1.5 relative">
            {[
              {
                label: 'User engagement',
                value: stats.total_activities > 0 && stats.most_active_user
                  ? `${Math.round((stats.most_active_user.activity_count / stats.total_activities) * 100)}%`
                  : '—',
              },
              {
                label: 'Action diversity',
                value: stats.most_common_action
                  ? `${Math.round((stats.most_common_action.count / stats.total_activities) * 100)}%`
                  : '—',
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">{s.label}</span>
                <span className="text-sm font-black text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {isLoading && (
        <div className="h-32 bg-gray-100 dark:bg-white/5 rounded-[20px] animate-pulse" />
      )}
    </div>
  );
}
