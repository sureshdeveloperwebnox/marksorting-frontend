'use client';

import { ActivityLog } from '../types/activity-log.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Eye, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface ActivityLogsTableProps {
  logs: ActivityLog[];
  isLoading: boolean;
  meta?: {
    total: number;
    skip: number;
    take: number;
    has_more: boolean;
  };
  onPageChange: (skip: number) => void;
  onViewDetail: (log: ActivityLog) => void;
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  CREATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  UPDATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  VIEW: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  EXPORT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  APPROVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  REJECT: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
  ASSIGN: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  COMPLETE: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
};

export function ActivityLogsTable({
  logs,
  isLoading,
  meta,
  onPageChange,
  onViewDetail,
}: ActivityLogsTableProps) {
  const currentPage = meta ? Math.floor(meta.skip / meta.take) + 1 : 1;
  const totalPages = meta ? Math.ceil(meta.total / meta.take) : 1;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activity logs found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">
                <div className="flex items-center gap-1">
                  Time
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="w-[150px]">User</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
              <TableHead className="w-[120px]">Entity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium text-xs">
                  {format(new Date(log.created_at), 'MMM d, yyyy')}
                  <br />
                  <span className="text-gray-500">
                    {format(new Date(log.created_at), 'h:mm a')}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{log.user?.full_name || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{log.user?.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.entity_type ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium capitalize">
                        {log.entity_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="text-sm truncate" title={log.description}>
                    {log.description}
                  </p>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetail(log)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {meta.skip + 1} to {Math.min(meta.skip + logs.length, meta.total)} of {meta.total} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, meta.skip - meta.take))}
              disabled={meta.skip === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(meta.skip + meta.take)}
              disabled={!meta.has_more}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
