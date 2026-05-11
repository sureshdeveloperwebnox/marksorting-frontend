'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-[140px] mb-3" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-[60px] rounded-full" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            </CardContent>
          </Card>
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
        
        <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-[#1a1c1b] rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-8 w-[80px] rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-2xl" />
          </CardContent>
        </Card>
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
