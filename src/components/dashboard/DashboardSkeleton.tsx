import React from 'react';
import { Card, CardContent } from '../ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 w-24 bg-muted rounded mb-4"></div>
              <div className="h-8 w-32 bg-muted rounded mb-2"></div>
              <div className="h-3 w-40 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6 h-[300px]"></CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 h-[250px]"></CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 h-[250px]"></CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 h-[300px]"></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
