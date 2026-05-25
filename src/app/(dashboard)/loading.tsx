export default function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 animate-pulse">
      <div className="xl:col-span-3 rounded-[24px] border border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-100 dark:border-white/5">
          <div className="space-y-3">
            <div className="h-5 w-48 rounded bg-gray-100 dark:bg-white/10" />
            <div className="h-3 w-72 max-w-full rounded bg-gray-100 dark:bg-white/10" />
          </div>
          <div className="hidden md:flex gap-3">
            <div className="h-11 w-56 rounded-xl bg-gray-100 dark:bg-white/10" />
            <div className="h-11 w-28 rounded-xl bg-gray-100 dark:bg-white/10" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="h-12 rounded-xl bg-gray-50 dark:bg-white/5" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 rounded-xl bg-gray-50 dark:bg-white/5" />
          ))}
        </div>
      </div>
      <div className="xl:col-span-1 flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 rounded-[20px] border border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}
