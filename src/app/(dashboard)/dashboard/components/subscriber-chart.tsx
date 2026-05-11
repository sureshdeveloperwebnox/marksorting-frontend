'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const data = [
  { name: 'Sun', value: 1200 },
  { name: 'Mon', value: 2100 },
  { name: 'Tue', value: 3874 },
  { name: 'Wed', value: 2400 },
  { name: 'Thu', value: 1900 },
  { name: 'Fri', value: 2800 },
  { name: 'Sat', value: 3100 },
];

export function SubscriberChart() {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-[32px] border border-gray-100/50 dark:border-white/5 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Activity size={18} className="text-gray-400" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Mill Production</CardTitle>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">12,473</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-emerald-500">4.3% ↗</span>
            <span className="text-xs text-gray-400 font-medium">+ 520 units processed</span>
          </div>
        </div>
        <Select defaultValue="weekly">
          <SelectTrigger className="w-[100px] rounded-xl border-gray-200 dark:border-white/10 h-9 font-bold text-xs">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-gray-200 dark:border-white/10">
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }} 
              />
              <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === 'Tue' ? 'url(#colorBarActive)' : '#f1f5f9'} 
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="colorBarActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={1}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
