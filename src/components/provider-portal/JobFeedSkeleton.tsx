import { Skeleton } from "@/components/ui/skeleton";

interface JobFeedSkeletonProps {
  count?: number;
}

export const JobFeedSkeleton = ({ count = 3 }: JobFeedSkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-card rounded-2xl overflow-hidden border border-border"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Image skeleton */}
          <Skeleton className="aspect-[16/10] w-full" />
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            
            <Skeleton className="h-4 w-full" />
            
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
