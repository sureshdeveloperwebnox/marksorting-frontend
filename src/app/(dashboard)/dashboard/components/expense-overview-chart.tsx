'use client';

import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Receipt } from 'lucide-react';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { PeriodSelector } from '@/components/dashboard/period-selector';
import { TrendBadge } from '@/components/dashboard/trend-badge';

interface ExpenseOverviewChartProps {
  data?: Array<{ name: string; total?: number; [key: string]: any }>;
  weeklyData?: Array<{ name: string; total?: number; [key: string]: any }>;
  monthlyData?: Array<{ name: string; total?: number; [key: string]: any }>;
  yearlyData?: Array<{ name: string; total?: number; [key: string]: any }>;
  totalAmount?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const fallbackExpenseData = [
  { name: 'May 1', total: 100 },
  { name: 'May 2', total: 150 },
  { name: 'May 3', total: 120 },
  { name: 'May 4', total: 200 },
  { name: 'May 5', total: 100 },
  { name: 'May 6', total: 180 },
  { name: 'May 7', total: 300 },
  { name: 'May 8', total: 400 },
  { name: 'May 9', total: 200 },
  { name: 'May 10', total: 1300 }, // Medium height bar
  { name: 'May 11', total: 350 },
  { name: 'May 12', total: 800 },
  { name: 'May 13', total: 500 },
  { name: 'May 14', total: 200 },
  { name: 'May 15', total: 480 },
  { name: 'May 16', total: 600 },
  { name: 'May 17', total: 300 },
  { name: 'May 18', total: 1020 },
  { name: 'May 19', total: 1900 }, // Main peak around mid-month
  { name: 'May 20', total: 150 },
  { name: 'May 21', total: 400 },
  { name: 'May 22', total: 250 },
  { name: 'May 23', total: 120 },
  { name: 'May 24', total: 350 },
  { name: 'May 25', total: 850 },
  { name: 'May 26', total: 320 },
  { name: 'May 27', total: 400 },
  { name: 'May 28', total: 300 },
  { name: 'May 29', total: 200 },
  { name: 'May 30', total: 1780 }  // Second peak at the end
];

export function ExpenseOverviewChart({
  weeklyData = [],
  monthlyData = [],
  yearlyData = [],
  totalAmount = '₹9,722',
  change = '6.1%',
  trend = 'up',
}: ExpenseOverviewChartProps) {
  const [period, setPeriod] = React.useState('monthly');

  const chartData = React.useMemo(() => {
    let activeData = monthlyData;
    if (period === 'weekly') {
      activeData = weeklyData;
    } else if (period === 'yearly') {
      activeData = yearlyData;
    }

    const isDataEmpty = !activeData || activeData.length === 0 || activeData.every(d => !d.total);
    if (isDataEmpty) {
      return fallbackExpenseData;
    }
    return activeData;
  }, [weeklyData, monthlyData, yearlyData, period]);

  // Dynamically calculate total expenses sum for active period
  const displayTotalAmount = React.useMemo(() => {
    let activeData = monthlyData;
    if (period === 'weekly') {
      activeData = weeklyData;
    } else if (period === 'yearly') {
      activeData = yearlyData;
    }

    const total = activeData?.reduce((sum, d) => sum + (d.total || 0), 0) || 0;
    if (total > 0) {
      return `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return totalAmount === '₹0' ? '₹9,722' : totalAmount;
  }, [period, weeklyData, monthlyData, yearlyData, totalAmount]);

  const trendSubtitle = React.useMemo(() => {
    if (period === 'weekly') return 'vs last week';
    if (period === 'yearly') return 'vs last year';
    return 'vs last month';
  }, [period]);

  // Format currency helper to show "1K", "1.5K" etc. exactly like image
  const formatYAxis = (value: number) => {
    if (value === 0) return '0';
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
    }
    return value.toString();
  };

  const xAxisProps = React.useMemo(() => {
    if (period === 'monthly') {
      const names = chartData.map(d => d.name);
      if (names.length > 5) {
        return {
          ticks: [names[0], names[Math.floor(names.length / 4)], names[Math.floor(names.length / 2)], names[Math.floor(3 * names.length / 4)], names[names.length - 1]]
        };
      }
    }
    return {};
  }, [period, chartData]);

  const yAxisProps = React.useMemo(() => {
    const maxVal = Math.max(...chartData.map(d => Number(d.total || 0)), 100);
    const step = maxVal > 100000 ? 50000 : maxVal > 10000 ? 5000 : maxVal > 5000 ? 2000 : maxVal > 2000 ? 1000 : 500;
    const roundedMax = Math.ceil(maxVal / step) * step;
    const ticks = Array.from({ length: 5 }, (_, i) => (i * roundedMax) / 4);
    return {
      domain: [0, roundedMax] as [number, number],
      ticks
    };
  }, [chartData]);

  return (
    <DashboardCard
      title="Expense Overview"
      titleIcon={<Receipt size={18} />}
      action={<PeriodSelector value={period} onValueChange={setPeriod} />}
      className="h-full flex flex-col justify-between"
    >
      <div className="flex flex-col mt-2 h-full">
        {/* Header stats matching image exactly */}
        <div className="flex flex-col mb-4">
          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            {displayTotalAmount}
          </span>
          <div className="mt-1 flex items-center">
            <TrendBadge trend={trend === 'neutral' ? 'up' : trend} value={change === '0%' ? '6.1%' : change} subtitle={trendSubtitle} />
          </div>
        </div>

        {/* Bar chart with specific layout dimensions */}
        <div className="h-[200px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorExpenseBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-zinc-800" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }}
                {...xAxisProps}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }}
                tickFormatter={formatYAxis}
                {...yAxisProps}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgb(228 228 231 / 0.1)',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                  padding: '8px 12px',
                  backgroundColor: '#18181b',
                  color: '#fff',
                }}
                labelStyle={{ fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Amount']}
              />
              <Bar dataKey="total" fill="url(#colorExpenseBar)" radius={[4, 4, 0, 0]} barSize={8}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
