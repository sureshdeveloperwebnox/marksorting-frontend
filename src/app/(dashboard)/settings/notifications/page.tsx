'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Send, Users, UserCheck, Globe, Loader2, ChevronDown, X, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useRoles, useUsers } from '@/services/user-service';
import type { User } from '@/services/user-service';

type Target = 'ALL' | 'ROLE' | 'USERS';
type NotificationType = 'BROADCAST' | 'SERVICE_REPORT' | 'INSTALLATION' | 'EXPENSE' | 'TICKET';

const TARGET_OPTIONS: { value: Target; label: string; description: string; icon: any }[] = [
  { value: 'ALL', label: 'Everyone', description: 'Send to all active users', icon: Globe },
  { value: 'ROLE', label: 'By Role', description: 'Target specific roles', icon: Users },
  { value: 'USERS', label: 'Specific Users', description: 'Select users by name', icon: UserCheck },
];

const TYPE_OPTIONS: { value: NotificationType; label: string; color: string }[] = [
  { value: 'BROADCAST', label: 'Broadcast', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'SERVICE_REPORT', label: 'Service Report', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  { value: 'INSTALLATION', label: 'Installation', color: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' },
  { value: 'EXPENSE', label: 'Expense', color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  { value: 'TICKET', label: 'Ticket', color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function NotificationsSettingsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('BROADCAST');
  const [target, setTarget] = useState<Target>('ALL');

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);

  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const availableRoles = rolesData ?? [];

  const { data: usersData, isLoading: usersLoading } = useUsers({
    skip: 0,
    take: 50,
    search: userSearch || undefined,
    status: 'ACTIVE',
  });
  const availableUsers = usersData?.users ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName],
    );
  };

  const removeRole = (roleName: string) => {
    setSelectedRoles((prev) => prev.filter((r) => r !== roleName));
  };

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const removeUser = (id: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    if (target === 'ROLE' && selectedRoles.length === 0) {
      toast.error('Please select at least one role.');
      return;
    }
    if (target === 'USERS' && selectedUsers.length === 0) {
      toast.error('Please select at least one user.');
      return;
    }

    const payload: Record<string, any> = { title, message, type, target };
    if (target === 'ROLE') payload.role_names = selectedRoles;
    if (target === 'USERS') payload.user_ids = selectedUsers.map((u) => u.id);

    setLoading(true);
    try {
      await api.post('/notifications/broadcast', payload);
      toast.success('Notification sent successfully!');
      setTitle('');
      setMessage('');
      setSelectedRoles([]);
      setSelectedUsers([]);
      setUserSearch('');
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
          <div className="space-y-1.5" ref={roleDropdownRef}>
            <Label>Role Name</Label>

            {/* Selected role tags */}
            {selectedRoles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {selectedRoles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => removeRole(r)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Dropdown trigger */}
            <button
              type="button"
              onClick={() => setRoleDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400 hover:border-primary/50 transition-colors"
            >
              <span>
                {selectedRoles.length === 0
                  ? 'Select roles…'
                  : `${selectedRoles.length} role${selectedRoles.length > 1 ? 's' : ''} selected`}
              </span>
              <ChevronDown size={15} className={`transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown list */}
            {roleDropdownOpen && (
              <div className="mt-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-lg overflow-hidden z-10">
                {rolesLoading ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-sm text-gray-400">
                    <Loader2 size={14} className="animate-spin" />
                    Loading roles…
                  </div>
                ) : availableRoles.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-400">No roles found</p>
                ) : (
                  availableRoles.map((role: any) => {
                    const isSelected = selectedRoles.includes(role.name);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                          isSelected
                            ? 'bg-primary/5 dark:bg-primary/10 text-primary'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>{role.name}</span>
                        {isSelected && <Check size={14} className="text-primary" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <p className="text-xs text-gray-400">Select one or more roles to target.</p>
          </div>
        )}

        {target === 'USERS' && (
          <div className="space-y-1.5" ref={userDropdownRef}>
            <Label>Select Users</Label>

            {/* Selected user tags */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                  >
                    <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold shrink-0">
                      {getInitials(u.full_name)}
                    </span>
                    {u.full_name}
                    <button
                      type="button"
                      onClick={() => removeUser(u.id)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Dropdown trigger */}
            <button
              type="button"
              onClick={() => setUserDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400 hover:border-primary/50 transition-colors"
            >
              <span>
                {selectedUsers.length === 0
                  ? 'Select users…'
                  : `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected`}
              </span>
              <ChevronDown size={15} className={`transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown panel with search */}
            {userDropdownOpen && (
              <div className="mt-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-lg overflow-hidden z-10">
                {/* Search box */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-white/10">
                  <Search size={13} className="text-gray-400 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
                  />
                  {userSearch && (
                    <button type="button" onClick={() => setUserSearch('')}>
                      <X size={12} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* User list */}
                <div className="max-h-52 overflow-y-auto">
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-4 gap-2 text-sm text-gray-400">
                      <Loader2 size={14} className="animate-spin" />
                      Loading users…
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">No users found</p>
                  ) : (
                    availableUsers.map((user) => {
                      const isSelected = selectedUsers.some((u) => u.id === user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleUser(user)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                            isSelected
                              ? 'bg-primary/5 dark:bg-primary/10'
                              : 'hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                          }`}>
                            {getInitials(user.full_name)}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className={`block font-medium truncate ${
                              isSelected ? 'text-primary' : 'text-gray-800 dark:text-gray-200'
                            }`}>{user.full_name}</span>
                            <span className="block text-[11px] text-gray-400 truncate">{user.role?.name}</span>
                          </span>
                          {isSelected && <Check size={14} className="text-primary shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400">Select one or more users to target.</p>
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
