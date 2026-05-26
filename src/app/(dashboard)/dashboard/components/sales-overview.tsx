'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Filter, ArrowUpDown, MoreHorizontal, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SalesOverviewProps {
  title?: string;
  data?: Array<{
    name: string;
    success: number;
    total: number;
  }>;
  prefix?: string;
}

export function SalesOverview({ title = "Sorting Performance", data = [], prefix = "" }: SalesOverviewProps) {
  const isCurrency = prefix === '₹';
  
  // Calculate total expense amount if currency, otherwise use efficiency
  const totalAmount = data.reduce((acc, curr) => acc + curr.total, 0);
  const displayValue = isCurrency 
    ? `₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : `${data.length > 0 
        ? ((data.reduce((acc, curr) => acc + curr.success, 0) / data.reduce((acc, curr) => acc + curr.total, 0) || 1) * 100).toFixed(1)
        : '94.2'}%`;

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-[32px] border border-gray-100/50 dark:border-white/5 h-full transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-gray-400 shrink-0" />
            {title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{displayValue}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isCurrency 
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
            }`}>
              {isCurrency ? '8.4% ↗' : '2.4% ↗'}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {isCurrency ? 'Monthly disbursements comparison' : '+ 1.2% efficiency increase'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: isCurrency ? 10 : -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isCurrency ? '#f97316' : '#3b82f6'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isCurrency ? '#f97316' : '#3b82f6'} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isCurrency ? '#f59e0b' : '#10b981'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isCurrency ? '#f59e0b' : '#10b981'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-white/5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                tickFormatter={(value) => isCurrency ? `₹${Number(value).toLocaleString('en-IN')}` : value.toString()}
                width={isCurrency ? 70 : 40}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  color: '#fff'
                }} 
                formatter={(value: any, name: any) => {
                  const label = isCurrency 
                    ? (name === 'Total Runs' || name === 'total' || name === 'Total Expenses' ? 'Total Expenses' : 'Approved Expenses')
                    : (name === 'Total Runs' || name === 'total' ? 'Total Runs' : 'Successful Sorts');
                  const formattedValue = isCurrency 
                    ? `₹${Number(value).toLocaleString('en-IN')}` 
                    : value;
                  return [formattedValue, label];
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700 }}
              />
              <Area type="monotone" dataKey="total" name={isCurrency ? "Total Expenses" : "Total Runs"} stroke={isCurrency ? "#f97316" : "#3b82f6"} strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              <Area type="monotone" dataKey="success" name={isCurrency ? "Approved Expenses" : "Successful Sorts"} stroke={isCurrency ? "#f59e0b" : "#10b981"} strokeWidth={3} fillOpacity={1} fill="url(#colorSuccess)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
