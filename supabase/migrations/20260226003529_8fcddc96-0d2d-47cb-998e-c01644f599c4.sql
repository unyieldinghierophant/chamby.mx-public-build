
CREATE OR REPLACE FUNCTION public.get_verified_providers()
 RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, skills text[], specialty text, hourly_rate numeric, rating numeric, total_reviews integer, zone_served text, verified boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.skills,
    p.specialty,
    p.hourly_rate,
    p.rating,
    p.total_reviews,
    p.zone_served,
    p.verified
  FROM providers p
  JOIN provider_details pd ON pd.user_id = p.user_id
  WHERE pd.verification_status = 'verified';
$function$;
