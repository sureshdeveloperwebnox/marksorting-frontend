'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDashboard } from '@/services/dashboard-service';
import { DashboardStats } from './components/dashboard-stats';
import { SalesOverview } from './components/sales-overview';
import { ServicesChart } from './components/services-chart';
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

type MetricType = 'customers' | 'installations' | 'services' | 'expenses';

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const [activeMetric, setActiveMetric] = useState<MetricType>('installations');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading || !data || !mounted) {
    return <DashboardSkeleton />;
  }

  const expensesStat = data.stats?.find(s => s.id === 'expenses');

  // Get active context data (fallback to safe empty structures if not present)
  const activeContext = data.contexts?.[activeMetric] || {
    performance: [],
    production: [],
    comparison: [],
    statusList: []
  };

  // Resolve dynamic headings and prefixes based on selected context
  const getContextMetadata = (metric: MetricType) => {
    switch (metric) {
      case 'customers':
        return {
          performanceTitle: 'Customer Growth & Signup Trends',
          comparisonTitle: 'Customer Status Breakdown',
          listTitle: 'Recent Registered Customers',
          prefix: '',
          totalLabel: 'Total Customers',
          successLabel: 'Active Customers',
          completedLabel: 'Active',
          pendingLabel: 'Inactive'
        };
      case 'installations':
        return {
          performanceTitle: 'Installation Trends & Status',
          comparisonTitle: 'Installations Ratio',
          listTitle: 'Recent Installation Reports',
          prefix: '',
          totalLabel: 'Total Installations',
          successLabel: 'Completed Installations',
          completedLabel: 'Completed',
          pendingLabel: 'Pending'
        };
      case 'services':
        return {
          performanceTitle: 'Service Reports Volume',
          comparisonTitle: 'Services Volume Comparison',
          listTitle: 'Recent Service Actions',
          prefix: '',
          totalLabel: 'Total Service Reports',
          successLabel: 'Completed Service Reports',
          completedLabel: 'Completed',
          pendingLabel: 'Pending'
        };
      case 'expenses':
        return {
          performanceTitle: 'Expense Disbursements Output',
          comparisonTitle: 'Expense Status Comparison',
          listTitle: 'Recent Expense Transactions',
          prefix: '₹',
          totalLabel: 'Total Expenses',
          successLabel: 'Approved Expenses',
          completedLabel: 'Approved',
          pendingLabel: 'Pending'
        };
    }
  };

  const metadata = getContextMetadata(activeMetric);

  return (
    <div className="space-y-8 pb-10">
      {/* Header section with refined typography */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
            Dashboard <span className="text-primary text-4xl leading-none">.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
            Welcome back! Click any card to drill down and analyze active real-time sorting metrics.
          </p>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Top Stats Row (Supports Clicking & Marking) */}
        <DashboardStats 
          stats={data.stats} 
          activeId={activeMetric}
          onSelect={(id) => setActiveMetric(id)}
        />

        {/* Middle Charts Row */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SalesOverview 
              title={metadata.performanceTitle} 
              data={activeContext.performance as Array<{ name: string; success: number; total: number }>} 
              prefix={metadata.prefix}
              totalLabel={metadata.totalLabel}
              successLabel={metadata.successLabel}
            />
          </div>
          <div className="lg:col-span-2">
            <ServicesChart 
              title={metadata.comparisonTitle} 
              data={activeContext.comparison} 
              prefix={metadata.prefix}
              completedLabel={metadata.completedLabel}
              pendingLabel={metadata.pendingLabel}
            />
          </div>
        </div>

        {/* Bottom Row: Distribution and Integrations */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <DistributionChart 
              data={data.expenseRatio} 
              change={expensesStat?.change}
              trend={expensesStat?.trend}
            />
          </div>
          <div className="lg:col-span-3">
            <IntegrationList 
              title={metadata.listTitle} 
              data={activeContext.statusList} 
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
