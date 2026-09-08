'use client';

import React, { useState, useMemo } from 'react';
import { Check, Eye, Filter, Layers, ZapOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RunningChannelRole = 'PRIMARY' | 'SECONDARY' | 'REJECTION_1' | 'REJECTION_2' | 'SPLIT';

export interface ChannelEntry {
  channel: number;
  value: RunningChannelRole;
}

export const CHANNEL_ROLE_THEME: Record<
  RunningChannelRole,
  {
    label: string;
    bgBadge: string;
    textBadge: string;
    borderBadge: string;
    dotColor: string;
    cardBorder: string;
    cardBg: string;
    ringColor: string;
  }
> = {
  PRIMARY: {
    label: 'Primary',
    bgBadge: 'bg-emerald-50 dark:bg-emerald-950/60',
    textBadge: 'text-emerald-700 dark:text-emerald-300',
    borderBadge: 'border-emerald-200 dark:border-emerald-800/80',
    dotColor: 'bg-emerald-500',
    cardBorder: 'border-emerald-400/80 dark:border-emerald-600/80',
    cardBg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    ringColor: 'ring-emerald-500/20',
  },
  SECONDARY: {
    label: 'Secondary',
    bgBadge: 'bg-blue-50 dark:bg-blue-950/60',
    textBadge: 'text-blue-700 dark:text-blue-300',
    borderBadge: 'border-blue-200 dark:border-blue-800/80',
    dotColor: 'bg-blue-500',
    cardBorder: 'border-blue-400/80 dark:border-blue-600/80',
    cardBg: 'bg-blue-50/40 dark:bg-blue-950/20',
    ringColor: 'ring-blue-500/20',
  },
  REJECTION_1: {
    label: 'Rejection 1',
    bgBadge: 'bg-amber-50 dark:bg-amber-950/60',
    textBadge: 'text-amber-700 dark:text-amber-300',
    borderBadge: 'border-amber-200 dark:border-amber-800/80',
    dotColor: 'bg-amber-500',
    cardBorder: 'border-amber-400/80 dark:border-amber-600/80',
    cardBg: 'bg-amber-50/40 dark:bg-amber-950/20',
    ringColor: 'ring-amber-500/20',
  },
  REJECTION_2: {
    label: 'Rejection 2',
    bgBadge: 'bg-rose-50 dark:bg-rose-950/60',
    textBadge: 'text-rose-700 dark:text-rose-300',
    borderBadge: 'border-rose-200 dark:border-rose-800/80',
    dotColor: 'bg-rose-500',
    cardBorder: 'border-rose-400/80 dark:border-rose-600/80',
    cardBg: 'bg-rose-50/40 dark:bg-rose-950/20',
    ringColor: 'ring-rose-500/20',
  },
  SPLIT: {
    label: 'Split',
    bgBadge: 'bg-purple-50 dark:bg-purple-950/60',
    textBadge: 'text-purple-700 dark:text-purple-300',
    borderBadge: 'border-purple-200 dark:border-purple-800/80',
    dotColor: 'bg-purple-500',
    cardBorder: 'border-purple-400/80 dark:border-purple-600/80',
    cardBg: 'bg-purple-50/40 dark:bg-purple-950/20',
    ringColor: 'ring-purple-500/20',
  },
};

const normalizeRole = (val?: string | null): RunningChannelRole => {
  if (!val) return 'PRIMARY';
  const clean = val.trim().toUpperCase().replace(/\s+/g, '_');
  if (clean in CHANNEL_ROLE_THEME) {
    return clean as RunningChannelRole;
  }
  if (clean.includes('SEC')) return 'SECONDARY';
  if (clean.includes('REJ') && clean.includes('2')) return 'REJECTION_2';
  if (clean.includes('REJ')) return 'REJECTION_1';
  if (clean.includes('SPLIT')) return 'SPLIT';
  return 'PRIMARY';
};

export const parseRunningChannels = (
  rawVal?: string | null,
  rawCountOrIndex?: number | null
): ChannelEntry[] => {
  if (!rawVal && !rawCountOrIndex) return [];

  if (rawVal) {
    // 1. JSON parse
    try {
      const parsed = JSON.parse(rawVal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((item) => item && typeof item.channel === 'number')
          .map((item) => ({
            channel: Number(item.channel),
            value: normalizeRole(item.value),
          }))
          .filter((item) => item.channel >= 1 && item.channel <= 12)
          .sort((a, b) => a.channel - b.channel);
      }
    } catch {}

    // 2. Delimited format: "2:PRIMARY, 9:PRIMARY" or "Channel 2 (Primary)"
    if (rawVal.includes(':') || rawVal.includes(',') || rawVal.includes('(')) {
      const entries: ChannelEntry[] = [];
      const parts = rawVal.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const match = trimmed.match(/(?:channel|ch)?\s*(\d+)\s*[:(]\s*([^)]+)\)?/i);
        if (match) {
          const chNum = Number(match[1]);
          if (chNum >= 1 && chNum <= 12) {
            entries.push({
              channel: chNum,
              value: normalizeRole(match[2]),
            });
          }
        } else if (trimmed.includes(':')) {
          const [ch, v] = trimmed.split(':').map((s) => s.trim());
          const chNum = Number(ch);
          if (chNum >= 1 && chNum <= 12) {
            entries.push({
              channel: chNum,
              value: normalizeRole(v),
            });
          }
        }
      }
      if (entries.length > 0) {
        return entries.sort((a, b) => a.channel - b.channel);
      }
    }

    // 3. Single role with channel count
    const singleRole = normalizeRole(rawVal);
    if (singleRole && rawCountOrIndex && rawCountOrIndex >= 1 && rawCountOrIndex <= 12) {
      // If count is e.g. 2, map the first N channels or the specific index
      return Array.from({ length: rawCountOrIndex }, (_, i) => ({
        channel: i + 1,
        value: singleRole,
      }));
    }
  }

  if (rawCountOrIndex && rawCountOrIndex >= 1 && rawCountOrIndex <= 12) {
    return Array.from({ length: rawCountOrIndex }, (_, i) => ({
      channel: i + 1,
      value: 'PRIMARY',
    }));
  }

  return [];
};

interface ChannelConfigurationViewProps {
  combinationCount?: number | null;
  combinationValue?: string | null;
  className?: string;
}

export function ChannelConfigurationView({
  combinationCount,
  combinationValue,
  className,
}: ChannelConfigurationViewProps) {
  const [viewMode, setViewMode] = useState<'all' | 'active'>('all');

  const activeChannels = useMemo(
    () => parseRunningChannels(combinationValue, combinationCount),
    [combinationValue, combinationCount]
  );

  const activeCount = activeChannels.length;

  // Group counts per role
  const roleBreakdown = useMemo(() => {
    const counts: Partial<Record<RunningChannelRole, number>> = {};
    activeChannels.forEach((item) => {
      counts[item.value] = (counts[item.value] || 0) + 1;
    });
    return counts;
  }, [activeChannels]);

  // Channels to display based on viewMode
  const displayedChannels = useMemo(() => {
    if (viewMode === 'active') {
      return activeChannels;
    }
    // All 12 channels
    return Array.from({ length: 12 }, (_, i) => {
      const chNum = i + 1;
      const found = activeChannels.find((c) => c.channel === chNum);
      return {
        channel: chNum,
        value: found ? found.value : null,
        isActive: !!found,
      };
    });
  }, [viewMode, activeChannels]);

  return (
    <div
      className={cn(
        'w-full space-y-4 rounded-2xl border border-gray-200/90 bg-white/90 p-4 sm:p-5 shadow-xs transition-all dark:border-white/10 dark:bg-gray-950/90',
        className
      )}
    >
      {/* Top Header & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5 dark:border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider shadow-xs',
                activeCount > 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80'
                  : 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  activeCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                )}
              />
              {activeCount > 0
                ? `${activeCount} of 12 Channels Active`
                : 'All Channels Inactive (Off)'}
            </span>

            {/* Role distribution tags */}
            {activeCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {(Object.keys(roleBreakdown) as RunningChannelRole[]).map((role) => {
                  const count = roleBreakdown[role];
                  if (!count) return null;
                  const theme = CHANNEL_ROLE_THEME[role];
                  return (
                    <span
                      key={role}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-xs',
                        theme.bgBadge,
                        theme.textBadge,
                        theme.borderBadge
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', theme.dotColor)} />
                      {count} {theme.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Current optical sorting running channel configuration for this machine visit
          </p>
        </div>

        {/* View Switcher: All (1-12) vs Active Only */}
        {activeCount > 0 && (
          <div className="inline-flex items-center self-start sm:self-auto rounded-xl border border-gray-200/90 bg-gray-100/70 p-0.5 text-xs dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                viewMode === 'all'
                  ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              <Layers size={13} />
              All Channels (1–12)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('active')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                viewMode === 'active'
                  ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              <Filter size={13} />
              Active Only ({activeCount})
            </button>
          </div>
        )}
      </div>

      {/* Channels Matrix Grid */}
      {displayedChannels.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {displayedChannels.map((item) => {
            const chNum = item.channel;
            const role = (item as any).value as RunningChannelRole | null;
            const isActive = viewMode === 'active' ? true : (item as any).isActive;
            const theme = role ? CHANNEL_ROLE_THEME[role] : null;

            return (
              <div
                key={chNum}
                className={cn(
                  'relative flex min-h-[76px] flex-col justify-between rounded-xl border p-2.5 transition-all duration-150 select-none',
                  isActive && theme
                    ? cn(
                        'shadow-xs ring-1 ring-black/5 dark:ring-white/5',
                        theme.cardBorder,
                        theme.cardBg,
                        theme.ringColor
                      )
                    : 'border-gray-200/80 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02] opacity-75'
                )}
              >
                {/* Top Row: Status Checkmark & Channel Title */}
                <div className="flex w-full items-center justify-between">
                  <span
                    className={cn(
                      'flex h-4.5 w-4.5 items-center justify-center rounded-md border text-[10px] transition-all',
                      isActive
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                        : 'border-gray-300 bg-gray-100 text-gray-400 dark:border-white/10 dark:bg-white/5'
                    )}
                  >
                    {isActive ? <Check size={12} strokeWidth={3} /> : <ZapOff size={10} />}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-black tracking-tight',
                      isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    Channel {chNum}
                  </span>
                </div>

                {/* Bottom Row: Role Badge or Off indicator */}
                <div className="mt-2 w-full">
                  {isActive && theme ? (
                    <span
                      className={cn(
                        'inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold shadow-xs truncate',
                        theme.bgBadge,
                        theme.textBadge,
                        theme.borderBadge
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', theme.dotColor)} />
                      <span className="truncate">{theme.label}</span>
                    </span>
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-md border border-transparent px-2 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                      Off
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-6 text-center dark:border-white/10">
          <ZapOff className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-1.5" />
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
            No Channels Configured
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            This installation report does not have active sorting channels.
          </p>
        </div>
      )}

      {/* Individual Channel Assignments Quick Chips */}
      {activeChannels.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-white/[0.02]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            <Eye size={12} className="text-primary" />
            Individual Channel Assignments ({activeChannels.length}):
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeChannels.map((item) => {
              const theme = CHANNEL_ROLE_THEME[item.value];
              return (
                <div
                  key={item.channel}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 shadow-xs text-xs font-bold',
                    theme.bgBadge,
                    theme.borderBadge
                  )}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/80 dark:bg-black/30 text-[10px] font-black text-gray-800 dark:text-gray-100">
                    {item.channel}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">Channel {item.channel}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className={cn('font-black', theme.textBadge)}>{theme.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
