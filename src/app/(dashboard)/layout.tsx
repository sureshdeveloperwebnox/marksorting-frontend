'use client';

import { Navbar } from '@/components/layouts/navbar';
import { Sidebar } from '@/components/layouts/sidebar';
import { useLayoutStore } from '@/store/layout-store';
import { useState, useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { layoutType } = useLayoutStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-gray-950">
        <div className="h-16 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900" />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 py-6">
          {children}
        </main>
      </div>
    );
  }

  if (layoutType === 'sidebar') {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-gray-950 overflow-hidden md:p-3 md:gap-3">
        {/* Left Sidebar (collapsible) */}
        <Sidebar />

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 md:rounded-[32px] md:border md:border-gray-100/50 md:dark:border-white/5 md:shadow-sm">
          <Navbar isSidebarLayout />
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 py-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-gray-950">
      <Navbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
