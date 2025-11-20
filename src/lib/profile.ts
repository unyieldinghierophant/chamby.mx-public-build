import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Check if user has a specific role
 */
export const hasRole = async (userId: string, role: 'admin' | 'client' | 'provider'): Promise<boolean> => {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role)
    .single();
  
  return !!data;
}

/**
 * Get the current user's profile
 * This is the canonical way to get profile data
 */
export const getCurrentProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
};

/**
 * Get profile by user_id
 */
export const getProfileByUserId = async (userId: string): Promise<Profile | null> => {
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  return profile;
};
