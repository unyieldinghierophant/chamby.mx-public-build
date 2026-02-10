import { useMemo } from 'react';
import { AvailableJob } from './useAvailableJobs';
import { CategoryFilter, RadiusFilter, DateFilter } from '@/components/provider-portal/JobFeedFilters';
import { calculateDistanceKm } from './useProviderLocation';

interface ProviderLocation {
  latitude: number;
  longitude: number;
}

export interface JobWithDistance extends AvailableJob {
  distanceKm: number | null;
}

interface UseFilteredJobsProps {
  jobs: AvailableJob[];
  providerLocation: ProviderLocation | null;
  category: CategoryFilter;
  radius: RadiusFilter;
  dateFilter: DateFilter;
}

export const useFilteredJobs = ({
  jobs,
  providerLocation,
  category,
  radius,
  dateFilter,
}: UseFilteredJobsProps): JobWithDistance[] => {
  return useMemo(() => {
    const now = new Date();

    // Add distance to each job
    let enriched: JobWithDistance[] = jobs.map((job) => {
      let distanceKm: number | null = null;

      if (providerLocation && job.location) {
        // Try to extract coords from location string (if stored as "lat,lng" or similar)
        // For now, we can't calculate without coords - show null
        // If provider has lat/lng in the DB, use those
        distanceKm = null;
      }

      return { ...job, distanceKm };
    });

    // Category filter
    if (category) {
      enriched = enriched.filter((job) =>
        job.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Radius filter (only if we have distances)
    if (radius && providerLocation) {
      enriched = enriched.filter(
        (job) => job.distanceKm === null || job.distanceKm <= radius
      );
    }

    // Date filter
    if (dateFilter) {
      enriched = enriched.filter((job) => {
        if (!job.scheduled_at) return false;
        const scheduled = new Date(job.scheduled_at);
        switch (dateFilter) {
          case 'today': {
            return scheduled.toDateString() === now.toDateString();
          }
          case '3days': {
            const threeDays = new Date(now);
            threeDays.setDate(threeDays.getDate() + 3);
            return scheduled <= threeDays && scheduled >= now;
          }
          case 'week': {
            const oneWeek = new Date(now);
            oneWeek.setDate(oneWeek.getDate() + 7);
            return scheduled <= oneWeek && scheduled >= now;
          }
          default:
            return true;
        }
      });
    }

    // Sort by distance (ascending) if available, otherwise by newest
    enriched.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return enriched;
  }, [jobs, providerLocation, category, radius, dateFilter]);
};
