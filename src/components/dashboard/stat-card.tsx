'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export type StatCardVariant =
  | 'emerald'
  | 'blue'
  | 'rose'
  | 'amber'
  | 'violet'
  | 'cyan'
  | 'orange';

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  variant: StatCardVariant;
  subtitle?: string;
  className?: string;
  /** Animation delay in seconds for staggered entry */
  delay?: number;
  active?: boolean;
  onClick?: () => void;
}

// ─── Variant config ───────────────────────────────────────────────────────────

const variantConfig: Record<
  StatCardVariant,
  {
    gradient: string;
    shadow: string;
    orb: string;
  }
> = {
  emerald: {
    gradient: 'from-emerald-500 via-emerald-400 to-teal-400',
    shadow: 'shadow-emerald-400/40',
    orb: 'bg-emerald-300/30',
  },
  blue: {
    gradient: 'from-blue-500 via-blue-400 to-indigo-400',
    shadow: 'shadow-blue-400/40',
    orb: 'bg-blue-300/30',
  },
  rose: {
    gradient: 'from-rose-500 via-pink-400 to-rose-400',
    shadow: 'shadow-rose-400/40',
    orb: 'bg-rose-300/30',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-400 to-yellow-400',
    shadow: 'shadow-amber-400/40',
    orb: 'bg-amber-300/30',
  },
  violet: {
    gradient: 'from-violet-500 via-purple-400 to-fuchsia-400',
    shadow: 'shadow-violet-400/40',
    orb: 'bg-violet-300/30',
  },
  cyan: {
    gradient: 'from-cyan-500 via-sky-400 to-cyan-400',
    shadow: 'shadow-cyan-400/40',
    orb: 'bg-cyan-300/30',
  },
  orange: {
    gradient: 'from-orange-500 via-amber-400 to-orange-400',
    shadow: 'shadow-orange-400/40',
    orb: 'bg-orange-300/30',
  },
};

// ─── Animation variants ───────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.94 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 320,
      damping: 28,
      delay,
    },
  }),
};

const shimmerVariants = {
  initial: { x: '-120%', skewX: '-12deg' },
  animate: {
    x: '220%',
    skewX: '-12deg',
    transition: {
      duration: 2.4,
      ease: 'linear' as const,
      repeat: Infinity,
      repeatDelay: 3.5,
    },
  },
};

const iconVariants = {
  idle: { rotate: -4 },
  float: {
    rotate: 4,
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: 'easeInOut' as const,
    },
  },
};

const orbVariants = {
  idle: { scale: 1, opacity: 0.5 },
  pulse: {
    scale: [1, 1.15, 1],
    opacity: [0.5, 0.7, 0.5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const StatCard = memo(function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  variant,
  subtitle = 'this month',
  className,
  delay = 0,
  active = false,
  onClick,
}: StatCardProps) {
  const config = variantConfig[variant];

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      custom={delay}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={{ scale: active ? 1.04 : 1.025, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'relative cursor-pointer select-none group isolate transition-all duration-300',
        active ? 'opacity-100 scale-[1.02]' : 'opacity-85 hover:opacity-100',
        className
      )}
    >
      {/* Glowing Backing Halo on Hover / Active */}
      <div
        className={cn(
          'absolute -inset-1.5 rounded-2xl bg-gradient-to-br',
          config.gradient,
          'transition-all duration-500 ease-out -z-10 blur-[16px]',
          active ? 'opacity-50 scale-[1.01]' : 'opacity-0 group-hover:opacity-30 dark:group-hover:opacity-45',
        )}
        aria-hidden
      />

      {/* Interactive Glowing Border Overlay */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl border transition-all duration-500 pointer-events-none z-20',
          active ? 'border-white/40 shadow-[0_0_8px_rgba(255,255,255,0.15)]' : 'border-white/10 opacity-0 group-hover:opacity-100',
        )}
        aria-hidden
      />

      {/* Card surface */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl p-5 border border-white/10 group-hover:border-white/20 transition-all duration-500',
          'bg-gradient-to-br',
          config.gradient,
          active ? 'shadow-[0_20px_35px_rgba(0,0,0,0.22)]' : 'shadow-xl group-hover:shadow-[0_20px_35px_rgba(0,0,0,0.18)]',
          config.shadow,
        )}
      >
        {/* ── Shimmer sweep ── */}
        <motion.div
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
          className="absolute inset-0 w-[38%] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
          aria-hidden
        />

        {/* ── Decorative radial orb (top-right) ── */}
        <motion.div
          variants={orbVariants}
          initial="idle"
          animate="pulse"
          className={cn(
            'absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl pointer-events-none',
            config.orb,
          )}
          aria-hidden
        />

        {/* ── Bottom-left soft orb ── */}
        <div
          className={cn(
            'absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-3xl opacity-30 pointer-events-none',
            config.orb,
          )}
          aria-hidden
        />

        {/* ── Content ── */}
        <div className="relative z-10 flex items-start justify-between gap-3">
          {/* Left: metric text */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="text-[10px] font-black text-white uppercase tracking-[0.12em] mb-2 truncate">
              {title}
            </p>

            {/* Value */}
            <div className="text-[2.2rem] font-black text-white tracking-tight leading-none mb-3">
              {value}
            </div>

            {/* Trend badge + subtitle */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white backdrop-blur-sm group-hover:bg-white/35 transition-colors duration-300">
                <TrendIcon size={10} className="shrink-0" />
                {change}
              </span>
              <span className="text-[10px] text-white/90 font-extrabold capitalize">
                {subtitle}
              </span>
            </div>
          </div>

          {/* Right: Floating icon */}
          <motion.div
            variants={iconVariants}
            initial="idle"
            animate="float"
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 backdrop-blur-sm shrink-0 shadow-inner shadow-white/10 transition-all duration-300"
          >
            <Icon size={22} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Skeleton variant ─────────────────────────────────────────────────────────

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 bg-gray-100 dark:bg-white/5',
        className,
      )}
      aria-busy
      aria-label="Loading stat"
    >
      {/* Shimmer sweep */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-2.5 w-24 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
          <div className="h-8 w-32 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse shrink-0" />
      </div>
    </div>
  );
}
