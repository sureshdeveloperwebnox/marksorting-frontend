'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DashboardStats } from './components/dashboard-stats';
import { SalesOverview } from './components/sales-overview';
import { SubscriberChart } from './components/subscriber-chart';
import { DistributionChart } from './components/distribution-chart';
import { IntegrationList } from './components/integration-list';
import { DashboardSkeleton } from './components/dashboard-skeleton';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading for performance demonstration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header section with refined typography */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
            Dashboard <span className="text-primary text-4xl leading-none">.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Welcome back! Here's what's happening with your sorting systems today.
          </p>
        </div>
        <Button className="rounded-[18px] font-black px-6 py-6 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2 bg-primary hover:bg-primary/90 text-white">
          <Download size={18} />
          Generate Report
        </Button>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Top Stats Row */}
        <DashboardStats />

        {/* Middle Charts Row */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SalesOverview />
          </div>
          <div className="lg:col-span-2">
            <SubscriberChart />
          </div>
        </div>

        {/* Bottom Row: Distribution and Integrations */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <DistributionChart />
          </div>
          <div className="lg:col-span-3">
            <IntegrationList />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

