
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.user_roles WHERE user_roles.user_id = p_user_id;
  DELETE FROM public.provider_details WHERE provider_details.user_id = p_user_id;
  DELETE FROM public.documents WHERE documents.provider_id = p_user_id;
  DELETE FROM public.notifications WHERE notifications.user_id = p_user_id;
  DELETE FROM public.messages WHERE messages.sender_id = p_user_id OR messages.receiver_id = p_user_id;
  DELETE FROM public.reviews WHERE reviews.client_id = p_user_id OR reviews.provider_id = p_user_id;
  DELETE FROM public.saved_locations WHERE saved_locations.user_id = p_user_id;
  DELETE FROM public.support_messages WHERE support_messages.provider_id = p_user_id OR support_messages.sender_id = p_user_id;
  DELETE FROM public.invoice_items WHERE invoice_items.invoice_id IN (
    SELECT invoices.id FROM public.invoices WHERE invoices.provider_id = p_user_id OR invoices.user_id = p_user_id
  );
  DELETE FROM public.invoices WHERE invoices.provider_id = p_user_id OR invoices.user_id = p_user_id;
  DELETE FROM public.disputes WHERE disputes.opened_by_user_id = p_user_id
    OR disputes.job_id IN (SELECT id FROM public.jobs WHERE jobs.client_id = p_user_id OR jobs.provider_id = p_user_id);
  DELETE FROM public.payouts WHERE payouts.provider_id = p_user_id
    OR payouts.job_id IN (SELECT id FROM public.jobs WHERE jobs.client_id = p_user_id OR jobs.provider_id = p_user_id);
  DELETE FROM public.payments WHERE payments.provider_id = p_user_id
    OR payments.job_id IN (SELECT id FROM public.jobs WHERE jobs.client_id = p_user_id OR jobs.provider_id = p_user_id);
  DELETE FROM public.jobs WHERE jobs.client_id = p_user_id OR jobs.provider_id = p_user_id;
  DELETE FROM public.providers WHERE providers.user_id = p_user_id;
  DELETE FROM public.user_credits WHERE user_credits.user_id = p_user_id;
  DELETE FROM public.users WHERE users.id = p_user_id;
  DELETE FROM auth.users WHERE auth.users.id = p_user_id;
END;
$$;
