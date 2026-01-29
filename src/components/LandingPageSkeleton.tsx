import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export const LandingPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="fixed top-0 left-0 right-0 bg-background z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Skeleton className="h-12 w-40" />
          <div className="hidden md:flex items-center gap-6">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-8 md:hidden rounded" />
        </div>
      </div>

      {/* Hero Card Skeleton */}
      <div className="pt-24 px-4 md:px-8">
        <div className="w-[96%] md:w-[98%] mx-auto">
          <motion.div 
            className="rounded-[1.5rem] md:rounded-[2.5rem] bg-primary/80 p-6 md:p-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Title skeleton */}
              <div className="space-y-3 text-center">
                <Skeleton className="h-8 md:h-12 w-3/4 mx-auto bg-white/20" />
                <Skeleton className="h-8 md:h-12 w-2/3 mx-auto bg-white/20" />
                <Skeleton className="h-8 md:h-12 w-1/2 mx-auto bg-white/20" />
              </div>

              {/* Search bar skeleton */}
              <div className="max-w-2xl mx-auto mt-8">
                <Skeleton className="h-14 w-full rounded-xl bg-white/20" />
                <Skeleton className="h-12 w-full mt-4 rounded-full bg-white/20" />
              </div>
            </div>
          </motion.div>

          {/* Category tabs skeleton */}
          <div className="mt-6">
            <div className="bg-background rounded-2xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i, duration: 0.4 }}
                    className="flex flex-col items-center gap-3 p-4"
                  >
                    <Skeleton className="w-14 h-14 md:w-24 md:h-24 rounded-lg" />
                    <Skeleton className="h-4 w-20" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
