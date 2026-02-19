import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const ProviderLandingSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Header */}
    <div className="fixed top-0 left-0 right-0 bg-background z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </div>

    {/* Hero */}
    <div className="pt-24 pb-12 min-h-[70vh] flex flex-col items-center justify-center px-4 bg-muted/30">
      <Skeleton className="h-6 w-56 rounded-full mb-6" />
      <Skeleton className="h-12 md:h-16 w-72 sm:w-96 mb-4" />
      <Skeleton className="h-5 w-64 mb-8" />
      <Skeleton className="h-14 w-52 rounded-xl mb-6" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>

    {/* CTA card */}
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>

    {/* Value Props */}
    <div className="py-20 px-4">
      <div className="text-center mb-12">
        <Skeleton className="h-8 w-64 mx-auto mb-4" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-6 text-center space-y-4">
              <Skeleton className="w-14 h-14 rounded-2xl mx-auto" />
              <Skeleton className="h-5 w-28 mx-auto" />
              <Skeleton className="h-4 w-40 mx-auto" />
              <Skeleton className="h-6 w-32 mx-auto rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);
