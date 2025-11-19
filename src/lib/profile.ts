import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_tasker: boolean;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current user's profile
 * This is the canonical way to get profile data
 */
export const getCurrentProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return profile;
};

/**
 * Get profile by user_id
 */
export const getProfileByUserId = async (userId: string): Promise<Profile | null> => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return profile;
};
