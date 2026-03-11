import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ServiceSubcategory {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

// In-memory cache shared across all hook instances
let cachedCategories: ServiceCategory[] | null = null;
let cachedSubcategories: ServiceSubcategory[] | null = null;
let fetchPromise: Promise<void> | null = null;

export function useServiceCatalog() {
  const [categories, setCategories] = useState<ServiceCategory[]>(cachedCategories ?? []);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>(cachedSubcategories ?? []);
  const [loading, setLoading] = useState(!cachedCategories);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    if (cachedCategories && cachedSubcategories) {
      setCategories(cachedCategories);
      setSubcategories(cachedSubcategories);
      setLoading(false);
      return;
    }

    // Deduplicate concurrent fetches
    if (!fetchPromise) {
      fetchPromise = (async () => {
        const [catRes, subRes] = await Promise.all([
          supabase
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order'),
          supabase
            .from('service_subcategories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order'),
        ]);

        if (catRes.error) throw new Error(catRes.error.message);
        if (subRes.error) throw new Error(subRes.error.message);

        cachedCategories = catRes.data as ServiceCategory[];
        cachedSubcategories = subRes.data as ServiceSubcategory[];
      })();
    }

    fetchPromise
      .then(() => {
        if (mounted.current) {
          setCategories(cachedCategories!);
          setSubcategories(cachedSubcategories!);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted.current) {
          setError(err.message);
          setLoading(false);
        }
      })
      .finally(() => {
        fetchPromise = null;
      });

    return () => {
      mounted.current = false;
    };
  }, []);

  return { categories, subcategories, loading, error };
}

/** Get subcategories for a given category slug */
export function getSubcategoriesForCategory(
  categorySlug: string,
  subcategories: ServiceSubcategory[],
  categories: ServiceCategory[]
): ServiceSubcategory[] {
  const cat = categories.find((c) => c.slug === categorySlug);
  if (!cat) return [];
  return subcategories.filter((s) => s.category_id === cat.id);
}

/** Fuzzy-match a search query against the catalog */
export function matchSearchQuery(
  query: string,
  categories: ServiceCategory[],
  subcategories: ServiceSubcategory[]
): { category?: ServiceCategory; subcategory?: ServiceSubcategory } {
  if (!query.trim()) return {};
  const q = query.toLowerCase().trim();

  // Try exact subcategory match first
  const subMatch = subcategories.find(
    (s) => s.name.toLowerCase().includes(q) || s.slug.includes(q)
  );
  if (subMatch) {
    const cat = categories.find((c) => c.id === subMatch.category_id);
    return { category: cat, subcategory: subMatch };
  }

  // Then try category match
  const catMatch = categories.find(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.slug.includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
  );
  if (catMatch) return { category: catMatch };

  return {};
}

/** Invalidate the in-memory cache (e.g. after admin edits) */
export function invalidateServiceCatalogCache() {
  cachedCategories = null;
  cachedSubcategories = null;
}
