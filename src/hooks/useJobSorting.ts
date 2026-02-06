import { useMemo } from 'react';
import { AvailableJob } from './useAvailableJobs';
import { SortOption } from '@/components/provider-portal/JobSortingTabs';

interface UseJobSortingProps {
  jobs: AvailableJob[];
  sortOption: SortOption;
  providerSkills?: string[];
}

interface SortedJob extends AvailableJob {
  isMatch: boolean;
}

export const useJobSorting = ({ jobs, sortOption, providerSkills = [] }: UseJobSortingProps): SortedJob[] => {
  return useMemo(() => {
    // Add isMatch property to each job
    const jobsWithMatch = jobs.map(job => ({
      ...job,
      isMatch: providerSkills.some(skill => 
        job.category.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(job.category.toLowerCase()) ||
        (job.service_type && skill.toLowerCase().includes(job.service_type.toLowerCase()))
      )
    }));

    // Sort based on selected option
    const sortedJobs = [...jobsWithMatch];

    switch (sortOption) {
      case 'for-you':
        // Show matches first, then by newest
        return sortedJobs.sort((a, b) => {
          if (a.isMatch && !b.isMatch) return -1;
          if (!a.isMatch && b.isMatch) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      case 'highest-paid':
        return sortedJobs.sort((a, b) => b.rate - a.rate);

      case 'newest':
        return sortedJobs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      case 'closest':
        // For now, just return by newest since we don't have location coords
        // In production, you'd compare distances using provider's current location
        return sortedJobs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      default:
        return sortedJobs;
    }
  }, [jobs, sortOption, providerSkills]);
};
