'use client';

import { ActivityLog } from '../types/activity-log.types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { X, User, Clock, Monitor, Tag } from 'lucide-react';

interface ActivityLogDetailDrawerProps {
  log: ActivityLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  CREATE: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  VIEW: 'bg-purple-100 text-purple-800',
  EXPORT: 'bg-indigo-100 text-indigo-800',
  APPROVE: 'bg-emerald-100 text-emerald-800',
  REJECT: 'bg-rose-100 text-rose-800',
  ASSIGN: 'bg-cyan-100 text-cyan-800',
  COMPLETE: 'bg-teal-100 text-teal-800',
};

const actionLabels: Record<string, string> = {
  LOGIN: 'Logged In',
  LOGOUT: 'Logged Out',
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  VIEW: 'Viewed',
  EXPORT: 'Exported',
  APPROVE: 'Approved',
  REJECT: 'Rejected',
  ASSIGN: 'Assigned',
  COMPLETE: 'Completed',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-sm text-gray-900 dark:text-gray-100 text-right">{value}</span>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 p-4 space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export function ActivityLogDetailDrawer({
  log,
  open,
  onOpenChange,
}: ActivityLogDetailDrawerProps) {
  if (!log) return null;

  const actionLabel = actionLabels[log.action] || log.action;
  const entityLabel = log.entity_type
    ? log.entity_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={`${actionColors[log.action] || 'bg-gray-100 text-gray-800'} text-xs font-semibold px-2.5 py-1`}
            >
              {actionLabel}
            </Badge>
            {entityLabel && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{entityLabel}</span>
            )}
          </div>
          <SheetTitle className="text-base font-semibold text-gray-900 dark:text-white mt-2">
            Activity Log Details
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* What happened */}
          <div className="rounded-lg border border-blue-100 dark:border-blue-950/30 bg-blue-50 dark:bg-blue-950/10 p-4">
            <p className="text-sm text-gray-800 dark:text-blue-200 leading-relaxed">{log.description}</p>
          </div>

          {/* Who */}
          <Section icon={<User className="w-4 h-4" />} title="Performed By">
            <InfoRow label="Name" value={<span className="font-medium">{log.user?.full_name || 'Unknown'}</span>} />
            <InfoRow label="Email" value={log.user?.email || '—'} />
          </Section>

          {/* When */}
          <Section icon={<Clock className="w-4 h-4" />} title="When">
            <InfoRow
              label="Date & Time"
              value={format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm:ss a")}
            />
          </Section>

          {/* What entity */}
          {entityLabel && (
            <Section icon={<Tag className="w-4 h-4" />} title="Related To">
              <InfoRow label="Module" value={entityLabel} />
            </Section>
          )}

          {/* Where from */}
          {(log.device_name || log.ip_address) && (
            <Section icon={<Monitor className="w-4 h-4" />} title="Access Details">
              {log.device_name && (
                <InfoRow label="Device" value={log.device_name} />
              )}
              {log.ip_address && (
                <InfoRow
                  label="IP Address"
                  value={
                    log.ip_address === '127.0.0.1' || log.ip_address === '::1'
                      ? 'Local (same machine)'
                      : log.ip_address
                  }
                />
              )}
            </Section>
          )}

        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
