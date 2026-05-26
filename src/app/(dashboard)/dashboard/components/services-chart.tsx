'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface ServicesChartDataPoint {
  name: string;
  completed: number;
  pending: number; // expressed as positive or negative, we will normalize it to negative for display
  completedPercentage?: number;
  pendingPercentage?: number;
}

interface ServicesChartProps {
  title?: string;
  data?: ServicesChartDataPoint[];
  prefix?: string;
  completedLabel?: string;
  pendingLabel?: string;
}

export const ServicesChart = memo(function ServicesChart({
  title = "Services Volume",
  data = [],
  prefix = "",
  completedLabel = "Completed",
  pendingLabel = "Pending"
}: ServicesChartProps) {

  const isCurrency = prefix === '₹';

  // Normalize pending values to negative for the bidirectional layout
  const chartData = data.map(item => ({
    name: item.name,
    completed: Math.abs(item.completed),
    pending: -Math.abs(item.pending),
  }));

  // Calculate totals and percentages
  const totalCompleted = data.reduce((acc, curr) => acc + Math.abs(curr.completed), 0);
  const totalPending = data.reduce((acc, curr) => acc + Math.abs(curr.pending), 0);
  const totalAll = totalCompleted + totalPending;
  const overallCompletedPct = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;
  const overallPendingPct = totalAll > 0 ? Math.round((totalPending / totalAll) * 100) : 0;

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-[32px] border border-gray-100/50 dark:border-white/5 h-full transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            <Activity size={20} className="text-gray-400 shrink-0" />
            {title}
          </h3>
          <div className="flex items-baseline gap-4 mt-2">
            <div>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {isCurrency ? `₹${totalCompleted.toLocaleString('en-IN')}` : totalCompleted}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1.5">
                {isCurrency ? 'Approved' : completedLabel}
              </span>
              <span className="text-[10px] text-emerald-500 font-bold ml-1">
                ({overallCompletedPct}%)
              </span>
            </div>
            <div className="border-l border-gray-100 dark:border-white/5 h-6" />
            <div>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {isCurrency ? `₹${totalPending.toLocaleString('en-IN')}` : totalPending}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1.5">
                {pendingLabel}
              </span>
              <span className="text-[10px] text-cyan-500 font-bold ml-1">
                ({overallPendingPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold mt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: isCurrency ? '#ea580c' : '#8b5cf6' }} />
            <span className="text-gray-500 dark:text-gray-400">{isCurrency ? 'Approved' : completedLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: isCurrency ? '#f59e0b' : '#06b6d4' }} />
            <span className="text-gray-500 dark:text-gray-400">{pendingLabel}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[280px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              stackOffset="sign"
              margin={{ top: 10, right: 10, left: isCurrency ? 10 : -20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="#f1f5f9" 
                className="dark:stroke-white/5" 
              />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                dy={8}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                tickFormatter={(value) => {
                  const absVal = Math.abs(value);
                  return isCurrency ? `₹${absVal.toLocaleString('en-IN')}` : absVal.toString();
                }}
                width={isCurrency ? 70 : 40}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  color: '#fff'
                }} 
                formatter={(value: any, name: any, props: any) => {
                  const absVal = Math.abs(value);
                  const formattedValue = isCurrency ? `₹${absVal.toLocaleString('en-IN')}` : absVal;
                  const label = isCurrency
                    ? (name === 'completed' ? 'Approved' : pendingLabel)
                    : (name === 'completed' ? completedLabel : pendingLabel);
                  
                  // Add percentage display from backend data
                  let percentageDisplay = '';
                  if (props.payload) {
                    if (name === 'completed' && props.payload.completedPercentage !== undefined) {
                      percentageDisplay = ` (${props.payload.completedPercentage}%)`;
                    } else if (name === 'pending' && props.payload.pendingPercentage !== undefined) {
                      percentageDisplay = ` (${props.payload.pendingPercentage}%)`;
                    }
                  }
                  
                  return [formattedValue + percentageDisplay, label];
                }}
              />
              <Bar 
                dataKey="completed" 
                name="completed"
                fill={isCurrency ? '#ea580c' : '#8b5cf6'} 
                stackId="stack" 
                radius={[6, 6, 6, 6]} 
                barSize={14} 
              />
              <Bar 
                dataKey="pending" 
                name="pending"
                fill={isCurrency ? '#f59e0b' : '#06b6d4'} 
                stackId="stack" 
                radius={[6, 6, 6, 6]} 
                barSize={14} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ServicesChartSkeleton() {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-[32px] border border-gray-100/50 dark:border-white/5 h-full">
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-baseline gap-4 mt-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Mock Bidirectional Bars Skeleton */}
        <div className="h-[280px] w-full flex items-center justify-around px-4 mt-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-center">
              {/* Positive Bar */}
              <Skeleton 
                className="w-3 rounded-full bg-gray-200 dark:bg-white/10" 
                style={{ height: `${[50, 20, 40, 80, 55, 30, 25][i - 1]}px` }} 
              />
              {/* Negative Bar */}
              <Skeleton 
                className="w-3 rounded-full bg-gray-200 dark:bg-white/10" 
                style={{ height: `${[35, 60, 30, 45, 15, 50, 40][i - 1]}px` }} 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
