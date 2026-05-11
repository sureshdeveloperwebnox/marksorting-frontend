'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const data = [
  { name: 'Cotton', value: 374.82, color: '#8b5cf6' },
  { name: 'Silk', value: 241.60, color: '#06b6d4' },
  { name: 'Synthetic', value: 213.42, color: '#f1f5f9' },
];

export function DistributionChart() {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-[32px] border border-gray-100/50 dark:border-white/5 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <PieIcon size={18} className="text-gray-400" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Order Distribution</CardTitle>
        </div>
        <Select defaultValue="monthly">
          <SelectTrigger className="w-[100px] rounded-xl border-gray-200 dark:border-white/10 h-9 font-bold text-xs">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-gray-200 dark:border-white/10">
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {data.map((item) => (
            <div key={item.name}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.name}</span>
              </div>
              <div className="text-lg font-black text-gray-900 dark:text-white">$ {item.value}</div>
            </div>
          ))}
        </div>
        <div className="h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
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
                  padding: '12px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
