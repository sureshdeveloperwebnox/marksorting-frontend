'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ListIcon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface MillStatusItem {
  id: string;
  name: string;
  type: string;
  rate: number;
  profit: string;
  icon: string;
  color: string;
}

interface IntegrationListProps {
  title?: string;
  data?: MillStatusItem[];
}

export function IntegrationList({ title = "Active Mills Status", data = [] }: IntegrationListProps) {
  const router = useRouter();

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-[32px] border border-gray-100/50 dark:border-white/5 h-full transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <ListIcon size={20} className="text-gray-400 shrink-0" />
          {title}
        </h3>
        <button 
          onClick={() => router.push('/service-management/service-report')}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 hover:bg-primary hover:text-white dark:bg-white/5 dark:hover:bg-primary text-gray-500 dark:text-gray-400 transition-all duration-300 shadow-sm border border-gray-100 dark:border-white/5"
          title="View all service reports"
        >
          <ArrowRight size={16} />
        </button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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
              {data.map((app) => (
                <TableRow key={app.id} className="group border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <TableCell>
                    <Checkbox className="rounded-md border-gray-200 dark:border-white/10" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm transition-transform group-hover:scale-110 shrink-0", app.color)}>
                        {app.icon}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[180px] block">{app.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400 text-xs font-medium">{app.type}</TableCell>
                  <TableCell className="w-[150px] min-w-[100px]">
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
        </div>
      </CardContent>
    </Card>
  );
}
