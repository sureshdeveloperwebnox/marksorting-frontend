'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Filter, ArrowUpDown, MoreHorizontal, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const data = [
  { name: 'Oct', china: 3000, ue: 2500, usa: 4500, canada: 3200, other: 1500 },
  { name: 'Nov', china: 2000, ue: 1800, usa: 3200, canada: 2100, other: 1200 },
  { name: 'Dec', china: 5000, ue: 3500, usa: 6500, canada: 4200, other: 2500 },
];

export function SalesOverview() {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-[32px] border border-gray-100/50 dark:border-white/5 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={18} className="text-gray-400" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Sorting Performance</CardTitle>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">94.2%</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">2.4% ↗</span>
            <span className="text-xs text-gray-400 font-medium">+ 1.2% efficiency increase</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-gray-200 dark:border-white/10 h-9 font-bold text-xs gap-2">
            <Filter size={14} /> Filter
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl border-gray-200 dark:border-white/10 h-9 font-bold text-xs gap-2">
            <ArrowUpDown size={14} /> Sort
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl border-gray-200 dark:border-white/10 h-9 w-9">
            <MoreHorizontal size={14} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorChina" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUSA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }} 
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}
              />
              <Area type="monotone" dataKey="china" name="China" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorChina)" />
              <Area type="monotone" dataKey="usa" name="USA" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUSA)" />
              <Area type="monotone" dataKey="ue" name="UE" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
