'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SparklineChart } from './sparkline-chart';

export type StatCardVariant = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet' | 'cyan' | 'orange';

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon | React.ComponentType<any>;
  variant: StatCardVariant;
  sparklineData?: number[];
  subtitle?: string;
  className?: string;
  delay?: number;
  href?: string;
  onClick?: () => void;
}

const colorConfig: Record<
  StatCardVariant,
  {
    stroke: string;
    fill: string;
    gradient: string;
    shadow: string;
    trendColor: string;
  }
> = {
  emerald: {
    stroke: '#10b981',
    fill: '#10b981',
    gradient: 'from-emerald-400 to-teal-500',
    shadow: 'shadow-emerald-500/25',
    trendColor: 'text-emerald-500',
  },
  rose: {
    stroke: '#ec4899',
    fill: '#ec4899',
    gradient: 'from-pink-400 to-rose-500',
    shadow: 'shadow-rose-500/25',
    trendColor: 'text-emerald-500',
  },
  orange: {
    stroke: '#f97316',
    fill: '#f97316',
    gradient: 'from-orange-400 to-amber-500',
    shadow: 'shadow-orange-500/25',
    trendColor: 'text-emerald-500',
  },
  blue: {
    stroke: '#3b82f6',
    fill: '#3b82f6',
    gradient: 'from-blue-400 to-indigo-500',
    shadow: 'shadow-blue-500/25',
    trendColor: 'text-emerald-500',
  },
  amber: {
    stroke: '#f59e0b',
    fill: '#f59e0b',
    gradient: 'from-amber-400 to-yellow-500',
    shadow: 'shadow-amber-500/25',
    trendColor: 'text-emerald-500',
  },
  violet: {
    stroke: '#8b5cf6',
    fill: '#8b5cf6',
    gradient: 'from-violet-400 to-fuchsia-500',
    shadow: 'shadow-violet-500/25',
    trendColor: 'text-emerald-500',
  },
  cyan: {
    stroke: '#06b6d4',
    fill: '#06b6d4',
    gradient: 'from-cyan-400 to-sky-500',
    shadow: 'shadow-cyan-500/25',
    trendColor: 'text-emerald-500',
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
      delay,
    },
  }),
};

export const StatCard = memo(function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  variant,
  sparklineData = [30, 40, 35, 50, 49, 60, 70, 91],
  subtitle = 'vs last month',
  className,
  delay = 0,
  href,
  onClick,
}: StatCardProps) {
  const router = useRouter();
  const config = colorConfig[variant] || colorConfig.blue;

  const isClickable = Boolean(href || onClick);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.div
      custom={delay}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={isClickable ? { y: -4, scale: 1.02, boxShadow: '0 16px 36px rgba(0,0,0,0.06)' } : { y: -3, scale: 1.015, boxShadow: '0 12px 30px rgba(0,0,0,0.04)' }}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-zinc-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)] dark:border-zinc-800/80 dark:bg-zinc-950/80 transition-all duration-300 group min-h-[145px] flex flex-col justify-between select-none',
        isClickable && 'cursor-pointer hover:border-primary/40 dark:hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20',
        className
      )}
    >
      {/* Inline styles for the water glow wave keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave-motion {
          0% { transform: translateX(0) translateZ(0) scaleY(1); }
          50% { transform: translateX(-25%) translateZ(0) scaleY(0.85); }
          100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
        }
        .water-glow-wave-1 {
          animation: wave-motion 16s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
        }
        .water-glow-wave-2 {
          animation: wave-motion 10s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
        }
      `}} />

      {/* Decorative Sparkline Background across the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[65px] overflow-hidden pointer-events-none z-10">
        <SparklineChart
          data={sparklineData}
          strokeColor={config.stroke}
          fillColor={config.fill}
          height={65}
        />
      </div>

      {/* Fluid Glowing Water Backdrop */}
      <motion.div
        animate={{
          scale: [1, 1.06, 0.94, 1],
          opacity: [0.15, 0.28, 0.15],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 pointer-events-none z-0 select-none"
        style={{
          background: `radial-gradient(circle at 50% 120%, ${config.stroke}35, transparent 65%)`
        }}
      />

      {/* Moving Water Wave SVG Layers */}
      <div className="absolute bottom-0 left-0 right-0 h-[35px] overflow-hidden pointer-events-none z-0 select-none opacity-20 dark:opacity-15">
        <svg className="water-glow-wave-1 absolute bottom-0 left-0 w-[200%] h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1350,20 1500,60 L1500,120 L0,120 Z" fill={config.stroke} />
        </svg>
        <svg className="water-glow-wave-2 absolute bottom-0 left-0 w-[200%] h-[90%]" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ opacity: 0.6 }}>
          <path d="M0,50 C180,90 300,30 480,50 C660,70 780,30 960,50 C1140,70 1260,30 1440,50 L1440,120 L0,120 Z" fill={config.stroke} />
        </svg>
      </div>

      {/* Subtle Glowing outline on hover */}
      <div
        className={cn(
          'absolute inset-0 rounded-[24px] border border-transparent pointer-events-none z-30 transition-all duration-500',
          'group-hover:border-zinc-200/50 dark:group-hover:border-zinc-700/50'
        )}
        style={{
          boxShadow: `inset 0 0 16px 1px ${config.stroke}05`
        }}
      />

      <div className="relative z-20 flex items-start gap-4">
        {/* Left: Glowing Icon Circle */}
        <div className={cn(
          'flex items-center justify-center w-14 h-14 rounded-full shrink-0 shadow-lg text-white bg-gradient-to-tr transition-transform duration-500 group-hover:scale-105',
          config.gradient,
          config.shadow
        )}>
          <Icon size={24} className="text-white" />
        </div>

        {/* Right: Title & Value */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">
            {title}
          </span>
          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mt-2 leading-none">
            {value}
          </span>
        </div>
      </div>


    </motion.div>
  );
});

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm min-h-[145px] flex flex-col justify-between',
        className
      )}
      aria-busy
      aria-label="Loading stat"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-zinc-100/50 dark:via-zinc-800/10 to-transparent pointer-events-none" />

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-8 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>

    </div>
  );
}
