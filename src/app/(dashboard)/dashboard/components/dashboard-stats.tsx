'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Factory, ClipboardCheck, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const stats = [
  {
    title: 'Total Users',
    value: '1,234',
    change: '15.8%',
    trend: 'up',
    icon: Users,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    title: 'Active Mills',
    value: '56',
    change: '34.0%',
    trend: 'down',
    icon: Factory,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
  },
  {
    title: 'Orders Processed',
    value: '890',
    change: '24.2%',
    trend: 'up',
    icon: ClipboardCheck,
    color: 'text-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-500/10',
  },
];

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function DashboardStats() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat, idx) => (
        <motion.div key={idx} variants={item}>
          <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-[32px] overflow-hidden group hover:shadow-xl transition-all duration-500 border border-gray-100/50 dark:border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <CardTitle className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-tight">
                  {stat.title}
                </CardTitle>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Info size={16} />
              </button>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
                {stat.value}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "flex items-center text-xs font-bold px-2 py-0.5 rounded-full",
                  stat.trend === 'up' 
                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" 
                    : "text-rose-600 bg-rose-50 dark:bg-rose-500/10"
                )}>
                  {stat.change} {stat.trend === 'up' ? '↗' : '↘'}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  increased
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
