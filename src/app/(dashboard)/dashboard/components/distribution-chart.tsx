'use client';

import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface DistributionChartProps {
  data?: Array<{
    name: string;
    value: number;
    color: string;
    percentage?: number;
  }>;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function DistributionChart({ data = [], change = '+8.4%', trend = 'up' }: DistributionChartProps) {
  // Calculate total expenses
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-[32px] border border-gray-100/50 dark:border-white/5 h-full transition-all duration-300 hover:shadow-md overflow-hidden">
      <CardContent className="p-8 h-full flex flex-col justify-between">
        <div className="grid grid-cols-12 gap-4 items-center h-full">
          {/* Left Column (Info) */}
          <div className="col-span-7 flex flex-col justify-between h-full space-y-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <Wallet size={20} className="text-gray-400 shrink-0" />
                Expense
              </h3>
              
              <div className="text-3xl font-black text-gray-900 dark:text-white mt-3 mb-2 tracking-tight">
                ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  trend === 'down' 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'
                }`}>
                  {trend === 'down' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  {change}
                </span>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">vs last month</span>
              </div>
            </div>

            {/* Horizontal Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-4 pt-2">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-[85px]">
                    {item.name}
                  </span>
                  {item.percentage !== undefined && (
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      {item.percentage}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (Donut Chart) */}
          <div className="col-span-5 relative flex items-center justify-center min-h-[160px]">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px',
                    backgroundColor: '#1e293b',
                    color: '#fff'
                  }} 
                  formatter={(value: any, name: any, props: any) => {
                    const formattedValue = `₹${Number(value).toLocaleString('en-IN')}`;
                    let percentageDisplay = '';
                    if (props.payload && props.payload.percentage !== undefined) {
                      percentageDisplay = ` (${props.payload.percentage}%)`;
                    }
                    return [formattedValue + percentageDisplay, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
