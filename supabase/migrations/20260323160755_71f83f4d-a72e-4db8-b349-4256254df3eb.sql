CREATE VIEW public.providers_public
WITH (security_invoker = on) AS
  SELECT id, user_id, display_name, avatar_url, skills, specialty,
         hourly_rate, rating, total_reviews, zone_served, verified,
         created_at
  FROM public.providers;