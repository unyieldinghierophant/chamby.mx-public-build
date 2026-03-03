
DROP FUNCTION IF EXISTS public.delete_user_account(uuid);

CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_roles.user_id = p_user_id;
  
  -- Delete provider details
  DELETE FROM public.provider_details WHERE provider_details.user_id = p_user_id;
  
  -- Delete documents
  DELETE FROM public.documents WHERE documents.provider_id = p_user_id;
  
  -- Delete provider record
  DELETE FROM public.providers WHERE providers.user_id = p_user_id;
  
  -- Delete notifications
  DELETE FROM public.notifications WHERE notifications.user_id = p_user_id;
  
  -- Delete messages
  DELETE FROM public.messages WHERE messages.sender_id = p_user_id OR messages.receiver_id = p_user_id;
  
  -- Delete reviews
  DELETE FROM public.reviews WHERE reviews.client_id = p_user_id OR reviews.provider_id = p_user_id;
  
  -- Delete saved locations
  DELETE FROM public.saved_locations WHERE saved_locations.user_id = p_user_id;
  
  -- Delete support messages
  DELETE FROM public.support_messages WHERE support_messages.provider_id = p_user_id OR support_messages.sender_id = p_user_id;
  
  -- Delete invoices and invoice items for jobs owned by this user
  DELETE FROM public.invoice_items WHERE invoice_items.invoice_id IN (
    SELECT invoices.id FROM public.invoices WHERE invoices.provider_id = p_user_id OR invoices.user_id = p_user_id
  );
  DELETE FROM public.invoices WHERE invoices.provider_id = p_user_id OR invoices.user_id = p_user_id;
  
  -- Delete payments
  DELETE FROM public.payments WHERE payments.provider_id = p_user_id;
  
  -- Delete payouts
  DELETE FROM public.payouts WHERE payouts.provider_id = p_user_id;
  
  -- Delete disputes for user's jobs
  DELETE FROM public.disputes WHERE disputes.opened_by_user_id = p_user_id;
  
  -- Delete user credits
  DELETE FROM public.user_credits WHERE user_credits.user_id = p_user_id;
  
  -- Delete jobs (as client or provider)
  DELETE FROM public.jobs WHERE jobs.client_id = p_user_id OR jobs.provider_id = p_user_id;
  
  -- Delete from users table
  DELETE FROM public.users WHERE users.id = p_user_id;
  
  -- Delete auth user
  DELETE FROM auth.users WHERE auth.users.id = p_user_id;
END;
$function$;
