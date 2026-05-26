'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCardSkeleton } from "@/components/dashboard/stat-card";
import { ServicesChartSkeleton } from "./services-chart";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[200px] rounded-lg" />
          <Skeleton className="h-4 w-[300px] rounded-lg" />
        </div>
        <Skeleton className="h-12 w-[160px] rounded-xl" />
      </div>

      {/* Top Stats Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Middle Row Skeleton */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-[150px]" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-[80px] rounded-lg" />
              <Skeleton className="h-8 w-[80px] rounded-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-2xl" />
          </CardContent>
        </Card>
        
        <div className="lg:col-span-2">
          <ServicesChartSkeleton />
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-3xl overflow-hidden">
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full rounded-full" />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[60px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
