import { Sidebar } from '@/components/layouts/sidebar';
import { Navbar } from '@/components/layouts/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 p-4 gap-4">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-w-0 gap-4">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
