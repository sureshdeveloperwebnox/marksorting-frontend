'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ListIcon, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const integrations = [
  { id: 1, name: 'Surat Textile Mill #4', type: 'High Speed', rate: 40, profit: 'Active', icon: '🏭', color: 'bg-indigo-500' },
  { id: 2, name: 'Ahemdabad Mill #7', type: 'Standard', rate: 80, profit: 'Active', icon: '⚙️', color: 'bg-orange-500' },
  { id: 3, name: 'Mumbai Sorting Hub', type: 'Logistics', rate: 20, profit: 'Standby', icon: '📦', color: 'bg-emerald-500' },
  { id: 4, name: 'Delhi Textile Unit', type: 'Precision', rate: 60, profit: 'Maintenance', icon: '🛠️', color: 'bg-blue-500' },
];

export function IntegrationList() {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-[32px] border border-gray-100/50 dark:border-white/5 h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <ListIcon size={18} className="text-gray-400" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Active Mills Status</CardTitle>
        </div>
        <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          See All <ExternalLink size={12} />
        </button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-50 dark:border-white/5">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Application</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Type</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Rate</TableHead>
              <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrations.map((app) => (
              <TableRow key={app.id} className="group border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                <TableCell>
                  <Checkbox className="rounded-md border-gray-200 dark:border-white/10" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm transition-transform group-hover:scale-110", app.color)}>
                      {app.icon}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{app.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400 text-xs font-medium">{app.type}</TableCell>
                <TableCell className="w-[150px]">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${app.rate}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn("h-full rounded-full", app.color)}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 w-8">{app.rate}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-gray-900 dark:text-white text-sm">{app.profit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
