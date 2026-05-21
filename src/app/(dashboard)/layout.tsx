import { Navbar } from '@/components/layouts/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-gray-950">
      <Navbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
