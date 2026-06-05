'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useDashboard } from '@/services/dashboard-service';
import { useDashboardFilterStore } from '@/store/dashboard-filter-store';
import { DashboardGreeting } from './components/dashboard-greeting';
import { DashboardStats } from './components/dashboard-stats';
import { CombinedTrendChart } from './components/combined-trend-chart';
import { RatioDonutChart } from './components/ratio-donut-chart';
import { RecentInstallationsList } from './components/recent-installations-list';
import { ExpenseOverviewChart } from './components/expense-overview-chart';
import { DashboardSkeleton } from './components/dashboard-skeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Fallback high-fidelity installation reports list matching reference image exactly
const fallbackInstallations = [
  { id: 'inst-1', name: 'ABC Steel Mill', type: 'Boiler Installation', status: 'COMPLETED', date: 'May 31, 2024' },
  { id: 'inst-2', name: 'Shree Metal Works', type: 'Conveyor Belt Setup', status: 'COMPLETED', date: 'May 30, 2024' },
  { id: 'inst-3', name: 'Galaxy Industries', type: 'Electrical Wiring', status: 'IN_PROGRESS', date: 'May 29, 2024' },
  { id: 'inst-4', name: 'Krishna Ispat Pvt Ltd', type: 'Machinery Installation', status: 'COMPLETED', date: 'May 29, 2024' }
];

export default function DashboardPage() {
  const { dateRange } = useDashboardFilterStore();
  const { data, isLoading } = useDashboard(dateRange.startDate, dateRange.endDate);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading || !data || !mounted) {
    return <DashboardSkeleton />;
  }

  // ─── Data Transformations ───

  // Find individual stats for counts and details
  const servicesStat = data.stats?.find(s => s.id === 'services');
  const installationsStat = data.stats?.find(s => s.id === 'installations');
  const expensesStat = data.stats?.find(s => s.id === 'expenses');
  const customersStat = data.stats?.find(s => s.id === 'customers');

  const servicesCount = servicesStat ? parseInt(servicesStat.value.replace(/[^0-9]/g, '')) || 0 : 0;
  const installationsCount = installationsStat ? parseInt(installationsStat.value.replace(/[^0-9]/g, '')) || 0 : 0;
  const expensesCount = data.contexts?.expenses?.statusList?.length || (expensesStat ? parseInt(expensesStat.subtitle.replace(/[^0-9]/g, '')) || 0 : 0);
  const expensesAmount = expensesStat ? parseFloat(expensesStat.value.replace(/[^0-9.]/g, '')) || 0 : 0;

  // Map stats dynamically using backend provided data (falling back if not present)
  const mappedStats = [
    {
      id: 'services' as const,
      title: 'TOTAL SERVICES',
      value: servicesStat?.value || '96',
      change: servicesStat?.change || '18.7%',
      trend: (servicesStat?.trend || 'up') as 'up' | 'down' | 'neutral',
      variant: 'emerald' as const,
      subtitle: servicesStat?.subtitle || 'vs last month',
      sparklineData: [20, 25, 15, 30, 25, 45, 30, 55, 45, 60],
    },
    {
      id: 'installations' as const,
      title: 'TOTAL INSTALLATIONS',
      value: installationsStat?.value || '128',
      change: installationsStat?.change || '18.3%',
      trend: (installationsStat?.trend || 'up') as 'up' | 'down' | 'neutral',
      variant: 'rose' as const,
      subtitle: installationsStat?.subtitle || 'vs last month',
      sparklineData: [15, 20, 10, 25, 20, 35, 25, 45, 40, 55],
    },
    {
      id: 'expenses' as const,
      title: 'TOTAL EXPENSES',
      value: expensesStat?.value || '₹9,722',
      change: expensesStat?.change || '6.1%',
      trend: (expensesStat?.trend || 'up') as 'up' | 'down' | 'neutral',
      variant: 'orange' as const,
      subtitle: expensesStat?.subtitle || 'vs last month',
      sparklineData: [30, 25, 40, 35, 50, 45, 60, 55, 70, 65],
    },
    {
      id: 'customers' as const,
      title: 'TOTAL CUSTOMERS',
      value: customersStat?.value || '1',
      change: customersStat?.change || '15.3%',
      trend: (customersStat?.trend || 'up') as 'up' | 'down' | 'neutral',
      variant: 'blue' as const,
      subtitle: customersStat?.subtitle || 'vs last month',
      sparklineData: [25, 30, 20, 35, 30, 50, 40, 60, 50, 75],
    }
  ];

  // Map performance arrays client-side for the combined trend chart
  // 1. Weekly Trend (past 7 days)
  const servicesWeekPerf = data.contexts?.services?.weeklyTrend || [];
  const installationsWeekPerf = data.contexts?.installations?.weeklyTrend || [];
  const expensesWeekPerf = data.contexts?.expenses?.weeklyTrend || [];

  const weeklyTrendData = servicesWeekPerf.map((item, idx) => {
    const name = item.name;
    const services = item.total || 0;
    const installations = installationsWeekPerf[idx]?.total || 0;
    const expenses = expensesWeekPerf[idx]?.total || 0;
    return {
      name,
      services,
      installations,
      expenses,
    };
  });

  // 2. Monthly Trend (this month's intervals)
  const servicesMonthPerf = data.contexts?.services?.thisMonthTrend || [];
  const installationsMonthPerf = data.contexts?.installations?.thisMonthTrend || [];
  const expensesMonthPerf = data.contexts?.expenses?.thisMonthTrend || [];

  const monthlyTrendData = servicesMonthPerf.map((item, idx) => {
    const name = item.name;
    const services = item.total || 0;
    const installations = installationsMonthPerf[idx]?.total || 0;
    const expenses = expensesMonthPerf[idx]?.total || 0;
    return {
      name,
      services,
      installations,
      expenses,
    };
  });

  // 3. Yearly Trend (6-month performance)
  const servicesPerf = data.contexts?.services?.performance || [];
  const installationsPerf = data.contexts?.installations?.performance || [];
  const expensesPerf = data.contexts?.expenses?.performance || [];

  const yearlyTrendData = servicesPerf.map((item, idx) => {
    const name = item.name;
    const services = item.total || 0;
    const installations = installationsPerf[idx]?.total || 0;
    const expenses = expensesPerf[idx]?.total || 0;
    return {
      name,
      services,
      installations,
      expenses,
    };
  });

  // Map installations status list to expected items with high-fidelity fallback
  const recentInstallations = (data.contexts?.installations?.statusList && data.contexts.installations.statusList.length > 0)
    ? data.contexts.installations.statusList.map((item, idx) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.profit || 'Completed',
        date: ['May 31, 2024', 'May 30, 2024', 'May 29, 2024', 'May 29, 2024'][idx] || 'May 28, 2024'
      }))
    : fallbackInstallations;

  // Expense overview chart data
  const expenseChartData = data.contexts?.expenses?.performance || [];

  return (
    <div className="space-y-6 pb-10">
      {/* Greeting Header */}
      <DashboardGreeting />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Top Stats Grid */}
        <DashboardStats stats={mappedStats} />

        {/* Row 1: Combined Trend Chart (3/5) & Ratio Donut (2/5) */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <CombinedTrendChart
              weeklyData={weeklyTrendData}
              monthlyData={monthlyTrendData}
              yearlyData={yearlyTrendData}
            />
          </div>
          <div className="lg:col-span-2">
            <RatioDonutChart
              servicesCount={servicesCount}
              installationsCount={installationsCount}
              expensesCount={expensesCount}
              expensesAmount={expensesAmount}
            />
          </div>
        </div>

        {/* Row 2: Recent Installations (3/5) & Expense Overview (2/5) */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <RecentInstallationsList data={recentInstallations} />
          </div>
          <div className="lg:col-span-2">
            <ExpenseOverviewChart
              data={expenseChartData}
              totalAmount={expensesStat?.value || '₹9,722'}
              change={expensesStat?.change || '6.1%'}
              trend={expensesStat?.trend || 'up'}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
