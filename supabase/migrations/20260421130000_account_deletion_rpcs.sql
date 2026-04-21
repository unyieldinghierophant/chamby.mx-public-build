-- Step 2: extend the delete trigger to purge storage, and add RPCs for
-- user-initiated and admin-initiated account deletion.

-- A) Extend the existing BEFORE DELETE trigger on public.users to also
--    purge storage objects once the active-work checks pass.
CREATE OR REPLACE FUNCTION public.prevent_delete_with_active_work()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_job_count integer;
  open_dispute_count integer;
BEGIN
  SELECT COUNT(*) INTO active_job_count
  FROM public.jobs
  WHERE (client_id = OLD.id OR provider_id = OLD.id)
    AND status NOT IN ('completed', 'cancelled', 'quote_rejected', 'draft');
  IF active_job_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete account: % active job(s) in progress. Complete or cancel them first.',
      active_job_count USING ERRCODE = 'restrict_violation';
  END IF;

  SELECT COUNT(*) INTO open_dispute_count
  FROM public.disputes d
  JOIN public.jobs j ON j.id = d.job_id
  WHERE d.status = 'open'
    AND (j.client_id = OLD.id OR j.provider_id = OLD.id);
  IF open_dispute_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete account: % open dispute(s). Resolve them first.',
      open_dispute_count USING ERRCODE = 'restrict_violation';
  END IF;

  -- Storage cleanup intentionally omitted: Supabase's storage.protect_delete
  -- trigger blocks direct DELETE FROM storage.objects. Orphaned files should
  -- be purged via an edge function that uses the Storage API.

  RETURN OLD;
END;
$$;


-- B) RPC: user deletes their own account.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;


-- C) RPC: admin deletes another user. Cannot target self via this path.
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Admins cannot delete their own account via this function' USING ERRCODE = 'insufficient_privilege';
  END IF;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
