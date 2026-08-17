'use client';

import { motion } from 'framer-motion';
import { ClipboardList, Wrench, Receipt, CreditCard, Users, RotateCcw, Store, Package } from 'lucide-react';
import { StatCard, StatCardVariant } from '@/components/dashboard/stat-card';

const iconMap: Record<string, any> = {
  'TOTAL SERVICES': Wrench,
  'TOTAL INSTALLATIONS': ClipboardList,
  'TOTAL EXPENSES': Receipt,
  'TOTAL REVENUE': CreditCard,
  'TOTAL CUSTOMERS': Users,
  'STORE RETURNS': RotateCcw,
  'STORE RETURN': RotateCcw,
  'TOTAL STORE RETURNS': RotateCcw,
  'STORE MANAGEMENT': Store,
};

interface DashboardStatsProps {
  stats?: Array<{
    id: 'customers' | 'installations' | 'services' | 'expenses' | 'revenue' | 'stores' | string;
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    variant: StatCardVariant;
    subtitle: string;
    sparklineData?: number[];
    href?: string;
  }>;
  // Kept for backward compatibility to avoid type errors during refactoring
  activeId?: string;
  onSelect?: (id: any) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export function DashboardStats({ stats = [] }: DashboardStatsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6"
    >
      {stats.map((stat, idx) => {
        const IconComponent = iconMap[stat.title] || Users;
        const sparkData = stat.sparklineData || [30, 40, 35, 50, 49, 60, 70, 91];

        return (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            variant={stat.variant}
            subtitle={stat.subtitle}
            icon={IconComponent}
            sparklineData={sparkData}
            delay={idx * 0.08}
            href={stat.href}
          />
        );
      })}
    </motion.div>
  );
}
