'use client';

import { useState } from 'react';
import { Bell, Send, Users, UserCheck, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

type Target = 'ALL' | 'ROLE' | 'USERS';
type NotificationType = 'BROADCAST' | 'SERVICE_REPORT' | 'INSTALLATION' | 'EXPENSE' | 'TICKET';

const TARGET_OPTIONS: { value: Target; label: string; description: string; icon: any }[] = [
  { value: 'ALL', label: 'Everyone', description: 'Send to all active users', icon: Globe },
  { value: 'ROLE', label: 'By Role', description: 'Target a specific role', icon: Users },
  { value: 'USERS', label: 'Specific Users', description: 'Comma-separated user IDs', icon: UserCheck },
];

const TYPE_OPTIONS: { value: NotificationType; label: string; color: string }[] = [
  { value: 'BROADCAST', label: 'Broadcast', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'SERVICE_REPORT', label: 'Service Report', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  { value: 'INSTALLATION', label: 'Installation', color: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' },
  { value: 'EXPENSE', label: 'Expense', color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  { value: 'TICKET', label: 'Ticket', color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
];

export default function NotificationsSettingsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('BROADCAST');
  const [target, setTarget] = useState<Target>('ALL');
  const [roleName, setRoleName] = useState('');
  const [userIds, setUserIds] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    if (target === 'ROLE' && !roleName.trim()) {
      toast.error('Please enter a role name.');
      return;
    }
    if (target === 'USERS' && !userIds.trim()) {
      toast.error('Please enter at least one user ID.');
      return;
    }

    const payload: Record<string, any> = { title, message, type, target };
    if (target === 'ROLE') payload.role_name = roleName.trim();
    if (target === 'USERS') payload.user_ids = userIds.split(',').map((s) => s.trim()).filter(Boolean);

    setLoading(true);
    try {
      await api.post('/notifications/broadcast', payload);
      toast.success('Notification sent successfully!');
      setTitle('');
      setMessage('');
      setRoleName('');
      setUserIds('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send notification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bell size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Send Notification</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Broadcast push notifications to users in real-time</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 p-6 space-y-6">

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="notif-title">Title</Label>
          <Input
            id="notif-title"
            placeholder="e.g. System Maintenance Scheduled"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Label htmlFor="notif-message">Message</Label>
          <Textarea
            id="notif-message"
            placeholder="Write your notification message here..."
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>Notification Type</Label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  type === opt.value
                    ? opt.color + ' ring-2 ring-offset-1 ring-primary/30'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target */}
        <div className="space-y-2">
          <Label>Send To</Label>
          <div className="grid grid-cols-3 gap-3">
            {TARGET_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTarget(opt.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    target === opt.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5'
                  }`}
                >
                  <Icon size={18} className={target === opt.value ? 'text-primary' : 'text-gray-400'} />
                  <span className={`text-xs font-semibold ${target === opt.value ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{opt.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional fields */}
        {target === 'ROLE' && (
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              placeholder="e.g. SUPER_ADMIN, Service Engineer"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
            <p className="text-xs text-gray-400">Must match exact role name in the system.</p>
          </div>
        )}

        {target === 'USERS' && (
          <div className="space-y-1.5">
            <Label htmlFor="user-ids">User IDs</Label>
            <Textarea
              id="user-ids"
              placeholder="uuid1, uuid2, uuid3"
              rows={2}
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
            />
            <p className="text-xs text-gray-400">Comma-separated user UUIDs.</p>
          </div>
        )}

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={loading}
          className="w-full gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {loading ? 'Sending…' : 'Send Notification'}
        </Button>
      </div>
    </div>
  );
}
