-- Backfill missing public.users rows for existing auth users
INSERT INTO public.users (id, full_name, phone, email)
SELECT 
  au.id,
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'phone',
  au.email
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;