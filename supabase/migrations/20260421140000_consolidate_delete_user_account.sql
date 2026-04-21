-- Consolidate account deletion into the existing delete_user_account(uuid)
-- RPC. The earlier two helpers added in 20260421130000 are redundant now —
-- one function with a self-or-admin authorization check covers both paths.
-- Business logic (active-job / open-dispute block, storage purge) lives in
-- the BEFORE DELETE trigger on public.users and fires automatically via
-- the auth.users → public.users cascade.

DROP FUNCTION IF EXISTS public.delete_my_account();
DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);

CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF auth.uid() <> p_user_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to delete this account' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;
