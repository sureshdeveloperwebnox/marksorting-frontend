import { Sidebar } from '@/components/layouts/sidebar';
import { Navbar } from '@/components/layouts/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-gray-950 p-3 md:p-4 gap-3 md:gap-4">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-w-0 gap-3 md:gap-4">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
