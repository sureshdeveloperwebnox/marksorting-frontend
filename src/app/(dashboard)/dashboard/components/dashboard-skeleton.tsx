'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCardSkeleton } from "@/components/dashboard/stat-card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[240px] rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-4 w-[320px] rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <Skeleton className="h-8 w-[180px] rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Top Stats Grid Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Row 1: Combined Trend Chart (3/5) & Ratio Donut (2/5) */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-5 w-[200px] rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <Skeleton className="h-8 w-[100px] rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <Skeleton className="h-[300px] w-full rounded-lg bg-zinc-200/50 dark:bg-zinc-800/30" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-5 w-[160px] rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <Skeleton className="h-8 w-[100px] rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center h-[200px]">
              <div className="md:col-span-6 flex justify-center">
                <Skeleton className="h-[140px] w-[140px] rounded-full bg-zinc-200/50 dark:bg-zinc-800/30" />
              </div>
              <div className="md:col-span-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      <Skeleton className="h-3 w-[70px] rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                    <Skeleton className="h-3 w-[30px] rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Recent Installations (3/5) & Expense Overview (2/5) */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
            <Skeleton className="h-5 w-[150px] rounded bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-4 w-[60px] rounded bg-zinc-200 dark:bg-zinc-800" />
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/10">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-[120px] rounded bg-zinc-200 dark:bg-zinc-800" />
                      <Skeleton className="h-2.5 w-[80px] rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-[70px] rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <Skeleton className="h-3 w-[60px] rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-5 w-[130px] rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <Skeleton className="h-8 w-[100px] rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-7 w-[100px] rounded bg-zinc-200 dark:bg-zinc-800" />
                <Skeleton className="h-4 w-[60px] rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <Skeleton className="h-[150px] w-full rounded bg-zinc-200/50 dark:bg-zinc-800/30" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
