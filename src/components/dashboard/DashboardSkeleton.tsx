import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32 hidden sm:block" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-none shadow-sm bg-card/50">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Top Indicators */}
        {[...Array(4)].map((_, i) => (
          <Card key={`top-${i}`} className="h-32 border-none shadow-sm bg-card/50">
            <CardContent className="p-6">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        ))}

        {/* Middle Bento Section */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <Card className="h-[350px] border-none shadow-sm bg-card/50">
            <CardContent className="p-6">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="h-[350px] border-none shadow-sm bg-card/50">
            <CardContent className="p-6">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Third Row */}
        <div className="col-span-1">
          <Card className="h-[300px] border-none shadow-sm bg-card/50">
            <CardContent className="p-6">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <Card className="h-[300px] border-none shadow-sm bg-card/50">
            <CardContent className="p-6">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="h-[300px] border-none shadow-sm bg-card/50">
            <CardContent className="p-6">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
