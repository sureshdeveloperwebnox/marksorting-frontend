'use client';

import { motion } from 'framer-motion';
import { Users, ClipboardList, Wrench, Receipt } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

const iconMap: Record<string, any> = {
  'Total Customers': Users,
  'Installations Done': ClipboardList,
  'Services Completed': Wrench,
  'Total Expenses': Receipt,
};

interface DashboardStatsProps {
  stats?: Array<{
    id: 'customers' | 'installations' | 'services' | 'expenses';
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    variant: 'emerald' | 'blue' | 'rose' | 'amber' | 'violet' | 'cyan' | 'orange';
    subtitle: string;
  }>;
  activeId?: string;
  onSelect?: (id: 'customers' | 'installations' | 'services' | 'expenses') => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export function DashboardStats({ stats = [], activeId, onSelect }: DashboardStatsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat, idx) => {
        const IconComponent = iconMap[stat.title] || Users;
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
            delay={idx * 0.08}
            active={activeId === stat.id}
            onClick={() => onSelect?.(stat.id)}
          />
        );
      })}
    </motion.div>
  );
}
