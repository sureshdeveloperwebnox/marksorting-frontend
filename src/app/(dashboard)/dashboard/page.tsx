'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Factory, 
  ClipboardCheck, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const stats = [
  {
    title: 'Total Users',
    value: '1,234',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
  },
  {
    title: 'Active Mills',
    value: '56',
    change: '+3',
    trend: 'up',
    icon: Factory,
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-900/10',
  },
  {
    title: 'Orders Processed',
    value: '890',
    change: '+18.2%',
    trend: 'up',
    icon: ClipboardCheck,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/10',
  },
  {
    title: 'Pending Issues',
    value: '12',
    change: '-4.3%',
    trend: 'down',
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/10',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            Dashboard <span className="text-primary text-4xl leading-none">.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Welcome back! Here's what's happening with your sorting systems today.
          </p>
        </div>
        <Button className="rounded-xl font-bold px-6 py-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          Generate Report
        </Button>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, idx) => (
          <motion.div key={idx} variants={item}>
            <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon size={80} />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.title}</CardTitle>
                <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={cn(
                    "flex items-center text-xs font-bold px-2 py-0.5 rounded-full",
                    stat.trend === 'up' ? "text-green-600 bg-green-50 dark:bg-green-900/10" : "text-red-600 bg-red-50 dark:bg-red-900/10"
                  )}>
                    {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-[#1a1c1b]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-gray-900 dark:text-white">Recent Activity</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Latest system logs and operations</p>
            </div>
            <Button variant="ghost" className="text-primary font-bold text-sm hover:bg-primary/5">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center transition-colors group-hover:bg-primary/10">
                      <TrendingUp className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        Mill Efficiency Increased
                      </p>
                      <p className="text-sm text-gray-500 font-medium">Surat Textiles Mill #4 • 2 hours ago</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400 border-none px-3 py-1 font-bold">
                    Completed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b]">
          <CardHeader>
            <CardTitle className="text-xl font-black text-gray-900 dark:text-white">Quick Actions</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Frequently used tools</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {['Add User', 'New Order', 'Sync Data', 'Settings'].map((action) => (
              <Button 
                key={action} 
                variant="outline" 
                className="h-24 flex flex-col gap-2 rounded-2xl border-dashed border-2 border-gray-200 dark:border-gray-800 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">+</span>
                </div>
                <span className="font-bold text-sm">{action}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
