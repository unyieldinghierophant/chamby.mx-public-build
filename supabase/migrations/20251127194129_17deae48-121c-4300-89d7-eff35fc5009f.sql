-- Create function to delete user account and all related data
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = delete_user_account.user_id;
  
  -- Delete provider details
  DELETE FROM public.provider_details WHERE user_id = delete_user_account.user_id;
  
  -- Delete provider record
  DELETE FROM public.providers WHERE user_id = delete_user_account.user_id;
  
  -- Delete notifications
  DELETE FROM public.notifications WHERE user_id = delete_user_account.user_id;
  
  -- Delete messages
  DELETE FROM public.messages WHERE sender_id = delete_user_account.user_id OR receiver_id = delete_user_account.user_id;
  
  -- Delete reviews
  DELETE FROM public.reviews WHERE client_id = delete_user_account.user_id OR provider_id = delete_user_account.user_id;
  
  -- Delete saved locations
  DELETE FROM public.saved_locations WHERE user_id = delete_user_account.user_id;
  
  -- Delete jobs (as client or provider)
  DELETE FROM public.jobs WHERE client_id = delete_user_account.user_id OR provider_id = delete_user_account.user_id;
  
  -- Delete from users table
  DELETE FROM public.users WHERE id = delete_user_account.user_id;
  
  -- Delete auth user (this will cascade to other tables)
  DELETE FROM auth.users WHERE id = delete_user_account.user_id;
END;
$$;