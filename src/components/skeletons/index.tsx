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
  <Card className={cn("animate-fade-in", className)} style={style}>
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
  <Card className={cn("animate-fade-in", className)} style={style}>
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
    <Card>
      <CardContent className="p-0">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
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
  <Card className={cn("animate-fade-in h-full", className)} style={style}>
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
  <div className="min-h-screen bg-muted/30 animate-fade-in">
    {/* Welcome bar */}
    <div className="bg-background border-b border-border/50">
      <div className="px-4 py-3 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
    {/* Availability circle */}
    <div className="flex justify-center mt-4">
      <Skeleton className="w-24 h-24 rounded-full" />
    </div>
    <Skeleton className="h-3 w-40 mx-auto mt-2" />
    {/* Job cards */}
    <div className="px-4 mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-6 w-full rounded-lg" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
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
      <div className="space-y-4">
        <Skeleton className="h-12 sm:h-16 w-80 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>
      <div className="max-w-xl mx-auto">
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
      <QuickActionsGridSkeleton />
      <div className="flex flex-wrap items-center justify-center gap-6">
        <Skeleton className="h-12 w-48 rounded-full" />
        <Skeleton className="h-12 w-44 rounded-full" />
      </div>
    </div>
  </div>
);

// ─── NEW SKELETONS ───

// Full Page Loading Skeleton (redesigned — header + content blocks)
export const FullPageSkeleton = () => (
  <div className="min-h-screen bg-background animate-fade-in">
    {/* Header bar */}
    <div className="h-16 border-b border-border/50 flex items-center px-4 md:px-8 justify-between">
      <Skeleton className="h-10 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-20 rounded-md hidden md:block" />
        <Skeleton className="h-8 w-20 rounded-md hidden md:block" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
    {/* Hero area */}
    <div className="flex flex-col items-center justify-center py-20 px-4 space-y-6">
      <Skeleton className="h-12 w-72 sm:w-96" />
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-14 w-full max-w-xl rounded-xl" />
    </div>
    {/* Content cards */}
    <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Provider Portal Skeleton (sidebar + top bar + content)
export const ProviderPortalSkeleton = () => (
  <div className="min-h-screen flex w-full bg-background animate-fade-in">
    {/* Sidebar (desktop only) */}
    <div className="hidden md:flex flex-col w-64 border-r border-border/50 p-4 space-y-4">
      <Skeleton className="h-10 w-32 mb-4" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
    {/* Main content */}
    <div className="flex-1 flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-border/50 flex items-center px-4 justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      {/* Page content placeholder */}
      <div className="p-4 lg:p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <JobListSkeleton count={3} />
      </div>
    </div>
  </div>
);

// Provider Jobs Skeleton (tabs + job cards)
export const ProviderJobsSkeleton = () => (
  <div className="container mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
    <div className="space-y-2">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-64" />
    </div>
    {/* Tabs */}
    <div className="flex gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-md" />
      ))}
    </div>
    {/* Job cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-44" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Job Timeline Skeleton
export const JobTimelineSkeleton = () => (
  <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-4xl animate-fade-in">
    {/* Back + title */}
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    {/* Status timeline */}
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
              {i < 4 && <Skeleton className="h-0.5 flex-1 mx-2" />}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
    {/* Detail cards */}
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    ))}
    {/* Action buttons */}
    <div className="flex gap-3">
      <Skeleton className="h-10 flex-1 rounded-md" />
      <Skeleton className="h-10 flex-1 rounded-md" />
    </div>
  </div>
);

// Generic Page Skeleton (header + avatar + settings rows)
export const GenericPageSkeleton = () => (
  <div className="min-h-screen bg-background animate-fade-in">
    {/* Header bar */}
    <div className="h-16 border-b border-border/50 flex items-center px-4 justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    {/* Content */}
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Profile card */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      {/* Settings rows */}
      <Card>
        <CardContent className="p-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </CardContent>
      </Card>
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
