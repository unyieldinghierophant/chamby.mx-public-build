import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

// Stats Card Skeleton
export const StatCardSkeleton = ({ className, style }: SkeletonProps) => (
  <Card className={cn("animate-fade-in", className)} style={style}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
);

// Stats Grid Skeleton
export const StatsGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <StatCardSkeleton key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }} />
    ))}
  </div>
);

// Quick Action Card Skeleton
export const QuickActionCardSkeleton = ({ className, style }: SkeletonProps) => (
  <Card className={cn("animate-fade-in", className)} style={style}>
    <CardHeader className="pb-3">
      <Skeleton className="w-12 h-12 rounded-xl mb-3" />
      <Skeleton className="h-5 w-28 mb-2" />
      <Skeleton className="h-4 w-36" />
    </CardHeader>
  </Card>
);

// Quick Actions Grid Skeleton
export const QuickActionsGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <QuickActionCardSkeleton key={i} style={{ animationDelay: `${i * 100}ms` }} />
    ))}
  </div>
);

// Job Card Skeleton
export const JobCardSkeleton = ({ className, style }: SkeletonProps) => (
  <Card className={cn("animate-fade-in bg-gradient-card shadow-raised border-0", className)} style={style}>
    <CardContent className="p-4">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-5 w-16" />
            <div className="flex space-x-2">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Job List Skeleton
export const JobListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <JobCardSkeleton key={i} style={{ animationDelay: `${i * 150}ms` }} />
    ))}
  </div>
);

// Upcoming Job Row Skeleton
export const UpcomingJobSkeleton = ({ className, style }: SkeletonProps) => (
  <div className={cn("flex items-start gap-4 p-4 border rounded-lg animate-fade-in", className)} style={style}>
    <Skeleton className="h-5 w-5 mt-1 rounded" />
    <div className="flex-1 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  </div>
);

// Upcoming Jobs List Skeleton
export const UpcomingJobsListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <UpcomingJobSkeleton key={i} style={{ animationDelay: `${i * 100}ms` }} />
    ))}
  </div>
);

// Profile Card Skeleton
export const ProfileCardSkeleton = ({ className, style }: SkeletonProps) => (
  <Card className={cn("animate-fade-in bg-gradient-card shadow-raised border-0", className)} style={style}>
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Menu Section Skeleton
export const MenuSectionSkeleton = ({ itemCount = 3 }: { itemCount?: number }) => (
  <div className="animate-fade-in">
    <Skeleton className="h-4 w-20 mb-3 ml-2" />
    <Card className="bg-gradient-card shadow-raised border-0">
      <CardContent className="p-0">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-white/10 last:border-b-0">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// Category Card Skeleton
export const CategoryCardSkeleton = ({ className, style }: SkeletonProps) => (
  <Card className={cn("animate-fade-in bg-gradient-card border-white/20 h-full", className)} style={style}>
    <CardHeader className="pb-6 flex flex-col items-center text-center">
      <Skeleton className="w-24 h-24 rounded-lg mb-4" />
      <Skeleton className="h-6 w-28 mb-2" />
      <Skeleton className="h-4 w-40" />
    </CardHeader>
  </Card>
);

// Category Grid Skeleton
export const CategoryGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CategoryCardSkeleton key={i} style={{ animationDelay: `${i * 100}ms` }} />
    ))}
  </div>
);

// Provider Dashboard Skeleton
export const ProviderDashboardSkeleton = () => (
  <div className="container mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-48" />
    </div>

    {/* Stats Grid */}
    <StatsGridSkeleton />

    {/* Verification Card */}
    <Card className="border-yellow-500/20 animate-fade-in" style={{ animationDelay: '200ms' }}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-44" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-10 w-44 rounded-md" />
      </CardContent>
    </Card>

    {/* Upcoming Jobs */}
    <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </CardHeader>
      <CardContent>
        <UpcomingJobsListSkeleton count={3} />
      </CardContent>
    </Card>

    {/* Quick Actions */}
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i} className="animate-fade-in" style={{ animationDelay: `${400 + i * 100}ms` }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Home Page Skeleton
export const HomePageSkeleton = () => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-20 animate-fade-in">
    <div className="max-w-4xl mx-auto text-center space-y-12">
      {/* Welcome Heading */}
      <div className="space-y-4">
        <Skeleton className="h-12 sm:h-16 w-80 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      {/* Quick Actions */}
      <QuickActionsGridSkeleton />

      {/* Trust Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-6">
        <Skeleton className="h-12 w-48 rounded-full" />
        <Skeleton className="h-12 w-44 rounded-full" />
      </div>
    </div>
  </div>
);

// Full Page Loading Skeleton
export const FullPageSkeleton = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
      </div>
      <Skeleton className="h-4 w-24 mx-auto" />
    </div>
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <div className="flex items-center gap-4 p-4 border-b animate-fade-in">
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} className="h-4 flex-1" />
    ))}
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="flex items-center gap-4 p-4 bg-muted/50 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRowSkeleton key={i} columns={columns} />
    ))}
  </div>
);

// Image Skeleton
export const ImageSkeleton = ({ className }: { className?: string }) => (
  <Skeleton className={cn("animate-pulse bg-muted", className)} />
);

// Avatar Skeleton
export const AvatarSkeleton = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };
  return <Skeleton className={cn("rounded-full", sizes[size])} />;
};

// Text Block Skeleton
export const TextBlockSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2 animate-fade-in">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className="h-4" 
        style={{ width: i === lines - 1 ? '60%' : '100%' }} 
      />
    ))}
  </div>
);

// Button Skeleton
export const ButtonSkeleton = ({ className }: { className?: string }) => (
  <Skeleton className={cn("h-10 w-24 rounded-md", className)} />
);
