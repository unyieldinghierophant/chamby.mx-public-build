import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  sort_order: number;
  is_active: boolean;
}

interface ServiceCatalogState {
  categories: ServiceCategory[];
  subcategories: ServiceSubcategory[];
  isLoading: boolean;
  error: string | null;
}

// In-memory cache shared across hook instances
let cachedCategories: ServiceCategory[] | null = null;
let cachedSubcategories: ServiceSubcategory[] | null = null;
let fetchPromise: Promise<void> | null = null;

async function fetchCatalog() {
  const [catRes, subRes] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id, slug, name, description, icon, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("service_subcategories")
      .select("id, category_id, slug, name, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (catRes.error) throw catRes.error;
  if (subRes.error) throw subRes.error;

  cachedCategories = catRes.data as ServiceCategory[];
  cachedSubcategories = subRes.data as ServiceSubcategory[];
}

/**
 * Hook to fetch the full service catalog (categories + subcategories).
 * Data is cached in memory after the first fetch.
 */
export function useServiceCatalog(): ServiceCatalogState {
  const [state, setState] = useState<ServiceCatalogState>({
    categories: cachedCategories ?? [],
    subcategories: cachedSubcategories ?? [],
    isLoading: !cachedCategories,
    error: null,
  });

  useEffect(() => {
    if (cachedCategories && cachedSubcategories) {
      setState({
        categories: cachedCategories,
        subcategories: cachedSubcategories,
        isLoading: false,
        error: null,
      });
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchCatalog().finally(() => {
        fetchPromise = null;
      });
    }

    fetchPromise
      .then(() => {
        setState({
          categories: cachedCategories ?? [],
          subcategories: cachedSubcategories ?? [],
          isLoading: false,
          error: null,
        });
      })
      .catch((err) => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err.message ?? "Error loading catalog",
        }));
      });
  }, []);

  return state;
}

/** Get a single category by its slug from the cached data. */
export function getCategoryBySlug(slug: string): ServiceCategory | undefined {
  return cachedCategories?.find((c) => c.slug === slug);
}

/** Get all subcategories for a given category ID from the cached data. */
export function getSubcategoriesForCategory(
  categoryId: string
): ServiceSubcategory[] {
  return (cachedSubcategories ?? []).filter(
    (s) => s.category_id === categoryId
  );
}
