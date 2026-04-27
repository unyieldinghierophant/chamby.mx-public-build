--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'client',
    'provider'
);


--
-- Name: assign_own_role(public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_own_role(_role public.app_role) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Block admin self-assignment
  IF _role = 'admin' THEN
    RAISE EXCEPTION 'Cannot self-assign admin role';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;


--
-- Name: attach_credits_on_signup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.attach_credits_on_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.user_credits
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL
    AND redeemed_at IS NULL
    AND expires_at > now();
  RETURN NEW;
END;
$$;


--
-- Name: audit_security_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_security_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Log security-sensitive operations on profiles, clients, and documents
  IF TG_TABLE_NAME IN ('profiles', 'clients', 'documents') THEN
    INSERT INTO security_audit_log (
      user_id,
      action,
      table_name, 
      record_id,
      old_data,
      new_data
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: can_view_admin_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_admin_stats() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN is_admin(auth.uid());
END;
$$;


--
-- Name: check_otp_rate_limit(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_otp_rate_limit(phone text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COUNT(*) < 3
  FROM phone_verification_otps
  WHERE phone_number = phone
    AND created_at > now() - interval '1 hour';
$$;


--
-- Name: check_rate_limit(uuid, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_rate_limit(_user_id uuid, _action text, _max_attempts integer DEFAULT 5, _window_minutes integer DEFAULT 60) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (
    SELECT COUNT(*)
    FROM security_audit_log
    WHERE user_id = _user_id 
      AND action = _action
      AND created_at > now() - (_window_minutes || ' minutes')::interval
  ) < _max_attempts;
$$;


--
-- Name: cleanup_expired_otps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_otps() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  DELETE FROM phone_verification_otps
  WHERE expires_at < now()
    OR (verified = true AND created_at < now() - interval '1 day');
$$;


--
-- Name: cleanup_rate_limits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_rate_limits() RETURNS void
    LANGUAGE sql
    AS $$
  DELETE FROM public.rate_limits WHERE updated_at < NOW() - INTERVAL '1 hour';
$$;


--
-- Name: create_job_reminders(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_job_reminders() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  job_record RECORD;
  customer_name TEXT;
BEGIN
  -- Create 24-hour reminders
  FOR job_record IN
    SELECT b.id, b.tasker_id, b.title, b.scheduled_date, p.full_name as customer_name
    FROM bookings b
    JOIN profiles p ON b.customer_id = p.user_id
    WHERE b.status IN ('confirmed', 'pending')
    AND b.scheduled_date > NOW()
    AND b.scheduled_date <= NOW() + INTERVAL '25 hours'
    AND b.scheduled_date >= NOW() + INTERVAL '23 hours'
    AND NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE user_id = b.tasker_id 
      AND type = 'job_reminder_24h'
      AND link LIKE '%' || b.id || '%'
      AND created_at > NOW() - INTERVAL '24 hours'
    )
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      job_record.tasker_id,
      'job_reminder_24h',
      'Trabajo mañana',
      'Tienes ' || job_record.title || ' con ' || job_record.customer_name || ' mañana',
      '/provider-portal/calendar'
    );
  END LOOP;
  
  -- Create 1-hour reminders
  FOR job_record IN
    SELECT b.id, b.tasker_id, b.title, b.scheduled_date, p.full_name as customer_name
    FROM bookings b
    JOIN profiles p ON b.customer_id = p.user_id
    WHERE b.status IN ('confirmed', 'pending')
    AND b.scheduled_date > NOW()
    AND b.scheduled_date <= NOW() + INTERVAL '70 minutes'
    AND b.scheduled_date >= NOW() + INTERVAL '50 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE user_id = b.tasker_id 
      AND type = 'job_reminder_1h'
      AND link LIKE '%' || b.id || '%'
      AND created_at > NOW() - INTERVAL '1 hour'
    )
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      job_record.tasker_id,
      'job_reminder_1h',
      'Trabajo en 1 hora',
      'Tu trabajo con ' || job_record.customer_name || ' comienza pronto',
      '/provider-portal/jobs'
    );
  END LOOP;
END;
$$;


--
-- Name: delete_user_account(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_user_account(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
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


--
-- Name: enforce_verified_has_docs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_verified_has_docs() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  has_ine_front boolean;
  has_ine_back boolean;
  has_selfie boolean;
  has_selfie_with_id boolean;
  has_proof_of_address boolean;
  missing text[];
BEGIN
  -- Only fire when verification_status is being set to 'verified'
  IF NEW.verification_status = 'verified' AND
     (OLD.verification_status IS DISTINCT FROM 'verified') THEN

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('ine_front', 'id_front', 'id_card')
    ) INTO has_ine_front;

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('ine_back', 'id_back')
    ) INTO has_ine_back;

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('selfie', 'face_photo', 'face')
    ) INTO has_selfie;

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('selfie_with_id', 'selfie_with_ine')
    ) INTO has_selfie_with_id;

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('proof_of_address', 'comprobante_domicilio')
    ) INTO has_proof_of_address;

    missing := ARRAY[]::text[];
    IF NOT has_ine_front THEN missing := missing || 'INE Frente'; END IF;
    IF NOT has_ine_back THEN missing := missing || 'INE Reverso'; END IF;
    IF NOT has_selfie THEN missing := missing || 'Selfie'; END IF;
    IF NOT has_selfie_with_id THEN missing := missing || 'Selfie con INE'; END IF;
    IF NOT has_proof_of_address THEN missing := missing || 'Comprobante de Domicilio'; END IF;

    IF array_length(missing, 1) > 0 THEN
      RAISE EXCEPTION 'Cannot verify provider: missing documents — %', array_to_string(missing, ', ');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: ensure_provider_details(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_provider_details() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_provider_id uuid;
BEGIN
  IF NEW.role = 'provider' THEN
    -- Create provider record
    INSERT INTO public.providers (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO new_provider_id;
    
    -- Get provider id if already existed
    IF new_provider_id IS NULL THEN
      SELECT id INTO new_provider_id FROM public.providers WHERE user_id = NEW.user_id;
    END IF;
    
    -- Create provider_details
    INSERT INTO public.provider_details (provider_id, user_id, verification_status)
    VALUES (new_provider_id, NEW.user_id, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_sync_dispute_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_sync_dispute_status() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  affected_job_id uuid;
  has_open boolean;
BEGIN
  affected_job_id := COALESCE(NEW.job_id, OLD.job_id);

  SELECT EXISTS(
    SELECT 1 FROM public.disputes
    WHERE job_id = affected_job_id AND status = 'open'
  ) INTO has_open;

  UPDATE public.jobs
  SET has_open_dispute = has_open,
      updated_at = now()
  WHERE id = affected_job_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: fn_sync_verification_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_sync_verification_status() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.providers
  SET verified = (NEW.verification_status = 'verified'),
      updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;


--
-- Name: fn_sync_visit_fee(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_sync_visit_fee() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.type IN ('visit_fee', 'visit_fee_authorization') THEN
    IF NEW.status = 'succeeded' THEN
      UPDATE public.jobs
      SET visit_fee_paid = true, updated_at = now()
      WHERE id = NEW.job_id;
    ELSIF NEW.status IN ('refunded', 'failed', 'canceled') THEN
      UPDATE public.jobs
      SET visit_fee_paid = false, updated_at = now()
      WHERE id = NEW.job_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: generate_short_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_short_code() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;


--
-- Name: get_admin_dashboard_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_dashboard_stats() RETURNS TABLE(total_jobs bigint, completed_jobs bigint, cancelled_jobs bigint, active_users bigint, active_providers bigint, jobs_today bigint, bookings_today bigint, total_payments numeric)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  -- Only allow admins to access stats
  SELECT 
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(*) FROM jobs)
    ELSE NULL END as total_jobs,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(*) FROM jobs WHERE status = 'completed')
    ELSE NULL END as completed_jobs,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(*) FROM jobs WHERE status = 'cancelled')
    ELSE NULL END as cancelled_jobs,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(DISTINCT user_id) FROM profiles WHERE is_tasker = false)
    ELSE NULL END as active_users,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(DISTINCT user_id) FROM profiles WHERE is_tasker = true AND verification_status = 'verified')
    ELSE NULL END as active_providers,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(*) FROM jobs WHERE DATE(created_at) = CURRENT_DATE)
    ELSE NULL END as jobs_today,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURRENT_DATE)
    ELSE NULL END as bookings_today,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'paid')
    ELSE NULL END as total_payments
  WHERE has_role(auth.uid(), 'admin'::app_role);
$$;


--
-- Name: get_client_id_from_auth(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_id_from_auth() RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT id FROM clients WHERE email = user_email LIMIT 1);
END;
$$;


--
-- Name: get_client_id_from_user_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_id_from_user_id(auth_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id FROM clients WHERE email = (
    SELECT email FROM auth.users WHERE id = auth_user_id
  ) LIMIT 1;
$$;


--
-- Name: get_provider_profile_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_provider_profile_id(auth_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id FROM profiles WHERE user_id = auth_user_id LIMIT 1;
$$;


--
-- Name: get_public_provider_profiles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_public_provider_profiles() RETURNS TABLE(id uuid, full_name text, bio text, skills text[], avatar_url text, hourly_rate numeric, rating numeric, total_reviews integer, verification_status text)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    p.id,
    p.full_name,
    p.bio,
    pp.skills,
    p.avatar_url,
    pp.hourly_rate,
    pp.rating,
    pp.total_reviews,
    pp.verification_status
  FROM profiles p
  JOIN provider_profiles pp ON p.user_id = pp.user_id
  WHERE pp.verified = true 
    AND pp.verification_status = 'verified';
$$;


--
-- Name: get_top_providers(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_top_providers(limit_count integer DEFAULT 10) RETURNS TABLE(user_id uuid, full_name text, rating numeric, total_reviews integer, completed_jobs bigint, total_earnings numeric)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.rating,
    p.total_reviews,
    COUNT(DISTINCT j.id) as completed_jobs,
    COALESCE(SUM(j.rate), 0) as total_earnings
  FROM profiles p
  LEFT JOIN jobs j ON j.provider_id = (SELECT id FROM clients WHERE email = (SELECT email FROM auth.users WHERE id = p.user_id))
  WHERE p.is_tasker = true 
    AND p.verification_status = 'verified'
    AND (j.status = 'completed' OR j.status IS NULL)
  GROUP BY p.user_id, p.full_name, p.rating, p.total_reviews
  ORDER BY completed_jobs DESC, p.rating DESC
  LIMIT limit_count;
$$;


--
-- Name: get_user_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_email() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;


--
-- Name: get_verified_providers(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_verified_providers() RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, skills text[], specialty text, hourly_rate numeric, rating numeric, total_reviews integer, zone_served text, verified boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_provider_id uuid;
BEGIN
  -- Insert into users table (everyone is a user/client)
  INSERT INTO public.users (id, full_name, phone, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email
  );
  
  -- Everyone gets 'client' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client'::app_role);
  
  -- Check if user is provider (from signup metadata)
  IF COALESCE((NEW.raw_user_meta_data ->> 'is_provider')::boolean, false) = true 
     OR COALESCE((NEW.raw_user_meta_data ->> 'is_tasker')::boolean, false) = true THEN
    
    -- Create provider record
    INSERT INTO public.providers (user_id, display_name, business_email, business_phone)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.email,
      NEW.raw_user_meta_data ->> 'phone'
    )
    RETURNING id INTO new_provider_id;
    
    -- Create provider_details for verification
    INSERT INTO public.provider_details (provider_id, user_id, verification_status)
    VALUES (new_provider_id, NEW.id, 'pending');
    
    -- Add provider role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'provider'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: increment_photo_link_clicks(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_photo_link_clicks(_short_code text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  UPDATE photo_short_links
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE short_code = _short_code;
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  )
$$;


--
-- Name: is_provider(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_provider(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.providers
    WHERE user_id = _user_id
  )
$$;


--
-- Name: notify_providers_new_job(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_providers_new_job() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  provider_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  IF NEW.status = 'active' AND NEW.provider_id IS NULL AND (OLD IS NULL OR OLD.status != 'active') THEN
    
    FOR provider_record IN
      SELECT DISTINCT
        p.user_id,
        u.full_name,
        u.phone,
        p.fcm_token,
        p.id as provider_id
      FROM public.providers p
      JOIN public.users u ON u.id = p.user_id
      JOIN public.provider_details pd ON pd.user_id = p.user_id
      WHERE pd.verification_status = 'verified'
    LOOP
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        link,
        data,
        read
      ) VALUES (
        provider_record.user_id,
        'new_job_available',
        'Nuevo trabajo disponible',
        'Hay un nuevo trabajo de ' || NEW.category || ' en ' || COALESCE(NEW.location, 'tu zona'),
        '/provider-portal/available-jobs',
        jsonb_build_object(
          'job_id', NEW.id,
          'category', NEW.category,
          'rate', NEW.rate,
          'location', NEW.location,
          'title', NEW.title,
          'description', NEW.description,
          'provider_id', provider_record.provider_id
        ),
        false
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: notify_reschedule_request(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_reschedule_request() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  provider_id UUID;
  customer_name TEXT;
BEGIN
  -- Get provider and customer info
  SELECT b.tasker_id, p.full_name INTO provider_id, customer_name
  FROM bookings b
  JOIN profiles p ON b.customer_id = p.user_id
  WHERE b.id = NEW.booking_id;
  
  -- Insert notification for provider
  INSERT INTO notifications (user_id, type, title, message, link, created_at)
  VALUES (
    provider_id,
    'reschedule_request',
    'Solicitud de reprogramación',
    customer_name || ' quiere reprogramar tu trabajo',
    '/provider-portal/reschedule/' || NEW.id,
    NOW()
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: prevent_delete_with_active_work(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_delete_with_active_work() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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

    RETURN OLD;
  END;
  $$;


--
-- Name: prevent_message_tampering(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_message_tampering() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'sender_id cannot be changed after insert';
  END IF;
  IF NEW.receiver_id IS DISTINCT FROM OLD.receiver_id THEN
    RAISE EXCEPTION 'receiver_id cannot be changed after insert';
  END IF;
  IF NEW.job_id IS DISTINCT FROM OLD.job_id THEN
    RAISE EXCEPTION 'job_id cannot be changed after insert';
  END IF;
  IF NEW.message_text IS DISTINCT FROM OLD.message_text THEN
    RAISE EXCEPTION 'message_text cannot be changed after insert';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: prevent_provider_id_reassignment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_provider_id_reassignment() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Allow if provider_id was NULL and is being set
  IF OLD.provider_id IS NOT NULL AND NEW.provider_id IS DISTINCT FROM OLD.provider_id THEN
    RAISE EXCEPTION 'provider_id cannot be changed once assigned (current: %, attempted: %)', OLD.provider_id, NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_profile_verification(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_verification() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Update provider_details when document is uploaded
  UPDATE provider_details 
  SET 
    updated_at = now(),
    verification_status = CASE 
      WHEN verification_status = 'none' THEN 'pending'
      ELSE verification_status
    END
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_provider_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_provider_rating() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.providers
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM public.reviews
      WHERE provider_id = NEW.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE provider_id = NEW.provider_id
    ),
    updated_at = now()
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: upsert_rate_limit(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_rate_limit(p_key text, p_window_secs integer, p_limit integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_cutoff TIMESTAMPTZ := v_now - (p_window_secs * INTERVAL '1 second');
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Try to insert a fresh record (first request in window)
  INSERT INTO public.rate_limits (key, count, window_start, updated_at)
  VALUES (p_key, 1, v_now, v_now)
  ON CONFLICT (key) DO UPDATE SET
    -- If the existing window has expired, reset it
    count = CASE
      WHEN rate_limits.window_start < v_window_cutoff THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_window_cutoff THEN v_now
      ELSE rate_limits.window_start
    END,
    updated_at = v_now
  RETURNING count, window_start INTO v_count, v_window_start;

  RETURN jsonb_build_object('count', v_count, 'window_start', v_window_start);
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reason text NOT NULL,
    flagged_by text NOT NULL,
    booking_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    booking_id uuid NOT NULL,
    triggered_by_user_id uuid NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dispute_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispute_evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dispute_id uuid NOT NULL,
    uploaded_by_user_id uuid NOT NULL,
    uploaded_by_role text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disputes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    invoice_id uuid,
    opened_by_user_id uuid NOT NULL,
    opened_by_role text NOT NULL,
    reason_code text NOT NULL,
    reason_text text,
    status text DEFAULT 'open'::text NOT NULL,
    resolution_notes text,
    resolved_by_admin_id uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    opened_by text,
    reason text,
    description text,
    admin_ruling text,
    split_percentage_client integer,
    admin_notes text,
    CONSTRAINT disputes_opened_by_role_check CHECK ((opened_by_role = ANY (ARRAY['client'::text, 'provider'::text]))),
    CONSTRAINT disputes_reason_code_check CHECK ((reason_code = ANY (ARRAY['no_show'::text, 'bad_service'::text, 'pricing_dispute'::text, 'damage'::text, 'other'::text]))),
    CONSTRAINT disputes_status_check CHECK ((status = ANY (ARRAY['open'::text, 'resolved_release'::text, 'resolved_refund'::text, 'resolved_cancelled'::text])))
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid,
    doc_type text,
    file_url text,
    uploaded_at timestamp with time zone DEFAULT now(),
    verification_status text DEFAULT 'pending'::text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    CONSTRAINT documents_verification_status_check CHECK ((verification_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: TABLE documents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.documents IS 'IDs, pictures, criminal records';


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric DEFAULT 0 NOT NULL,
    total numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    user_id uuid NOT NULL,
    subtotal_provider numeric DEFAULT 0 NOT NULL,
    chamby_commission_amount numeric DEFAULT 0 NOT NULL,
    total_customer_amount numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    provider_notes text,
    stripe_payment_intent_id text,
    pdf_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    rejection_reason text,
    vat_rate numeric DEFAULT 0.16 NOT NULL,
    vat_amount numeric DEFAULT 0 NOT NULL,
    revision_number integer DEFAULT 1 NOT NULL,
    parent_invoice_id uuid,
    valid_until timestamp with time zone,
    requires_followup_visit boolean DEFAULT false NOT NULL,
    proposed_visit_window tstzrange,
    notes text,
    provider_payout_amount numeric DEFAULT 0,
    client_surcharge_amount numeric DEFAULT 0,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending_payment'::text, 'paid'::text, 'failed'::text, 'sent'::text, 'accepted'::text, 'rejected'::text, 'ready_to_release'::text, 'released'::text, 'countered'::text, 'expired'::text, 'withdrawn'::text, 'superseded'::text])))
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    provider_id uuid,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    service_type text,
    problem text,
    location text,
    scheduled_at timestamp with time zone,
    time_preference text,
    exact_time text,
    budget text,
    rate numeric NOT NULL,
    final_price numeric,
    amount_booking_fee numeric DEFAULT 250,
    amount_service_total numeric,
    total_amount numeric,
    status text DEFAULT 'pending'::text,
    photos text[],
    photo_count integer DEFAULT 0,
    urgent boolean DEFAULT false,
    duration_hours integer DEFAULT 1,
    visit_fee_paid boolean DEFAULT false,
    provider_visited boolean DEFAULT false,
    reschedule_requested_at timestamp with time zone,
    reschedule_requested_date timestamp with time zone,
    reschedule_response_deadline timestamp with time zone,
    original_scheduled_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    visit_fee_amount integer DEFAULT 429,
    stripe_visit_payment_intent_id text,
    provider_confirmed_visit boolean DEFAULT false,
    client_confirmed_visit boolean DEFAULT false,
    visit_confirmation_deadline timestamp with time zone,
    visit_dispute_status text,
    visit_dispute_reason text,
    assignment_deadline timestamp with time zone,
    completion_status text DEFAULT 'in_progress'::text NOT NULL,
    completion_marked_at timestamp with time zone,
    completion_confirmed_at timestamp with time zone,
    has_open_dispute boolean DEFAULT false NOT NULL,
    dispute_status text,
    followup_scheduled_at timestamp with time zone,
    followup_status text,
    followup_invoice_id uuid,
    cancellation_requested_by text,
    cancellation_requested_at timestamp with time zone,
    cancellation_agreed_by_other_side boolean DEFAULT false,
    reschedule_requested_by text,
    reschedule_proposed_datetime timestamp with time zone,
    reschedule_agreed boolean DEFAULT false,
    job_completed_confirmed boolean,
    late_cancellation_penalty_applied boolean DEFAULT false,
    job_address_lat double precision,
    job_address_lng double precision,
    arrived_lat double precision,
    arrived_lng double precision,
    arrived_at timestamp with time zone,
    geolocation_mismatch boolean DEFAULT false,
    CONSTRAINT jobs_completion_status_check CHECK ((completion_status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'provider_marked_done'::text, 'completed'::text, 'auto_completed'::text]))),
    CONSTRAINT jobs_followup_status_check CHECK (((followup_status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])) OR (followup_status IS NULL))),
    CONSTRAINT valid_job_status CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'searching'::text, 'assigned'::text, 'on_site'::text, 'quoted'::text, 'quote_accepted'::text, 'quote_rejected'::text, 'job_paid'::text, 'in_progress'::text, 'provider_done'::text, 'completed'::text, 'cancelled'::text, 'disputed'::text, 'no_match'::text])))
);


--
-- Name: COLUMN jobs.provider_confirmed_visit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.jobs.provider_confirmed_visit IS 'Provider confirms they completed the visit';


--
-- Name: COLUMN jobs.client_confirmed_visit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.jobs.client_confirmed_visit IS 'Client confirms they are satisfied with the visit';


--
-- Name: COLUMN jobs.visit_confirmation_deadline; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.jobs.visit_confirmation_deadline IS 'Deadline for client to confirm (48h after provider confirmation)';


--
-- Name: COLUMN jobs.visit_dispute_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.jobs.visit_dispute_status IS 'Dispute status: pending_support, resolved_provider, resolved_client';


--
-- Name: COLUMN jobs.visit_dispute_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.jobs.visit_dispute_reason IS 'Reason provided by client for dispute';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    message_text text NOT NULL,
    attachment_url text,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_system_message boolean DEFAULT false NOT NULL,
    system_event_type text
);


--
-- Name: COLUMN messages.is_system_message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.messages.is_system_message IS 'True for auto-generated status change messages';


--
-- Name: COLUMN messages.system_event_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.messages.system_event_type IS 'Event type: accepted, confirmed, en_route, on_site, quoted, in_progress, completed, cancelled';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    link text,
    data jsonb,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: otp_rate_limit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_rate_limit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address text NOT NULL,
    phone_number text,
    action text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    provider_id uuid,
    stripe_payment_intent_id text,
    stripe_checkout_session_id text,
    amount integer NOT NULL,
    currency text DEFAULT 'mxn'::text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    base_amount_cents integer,
    vat_amount_cents integer,
    total_amount_cents integer,
    pricing_version text,
    CONSTRAINT payments_type_check CHECK ((type = ANY (ARRAY['visit_fee'::text, 'job_invoice'::text])))
);


--
-- Name: payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid,
    provider_id uuid NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    stripe_transfer_id text,
    job_id uuid,
    payout_type text DEFAULT 'job_completion'::text,
    CONSTRAINT payouts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text])))
);


--
-- Name: phone_verification_otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_verification_otps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_number text NOT NULL,
    otp_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:05:00'::interval) NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    attempts integer DEFAULT 0 NOT NULL
);


--
-- Name: photo_short_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_short_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    short_code text NOT NULL,
    full_url text NOT NULL,
    clicks integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: provider_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    verification_status text DEFAULT 'pending'::text,
    face_photo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    provider_id uuid,
    id_document_url text,
    background_check_status text DEFAULT 'pending'::text,
    admin_notes text,
    ine_front_url text,
    ine_back_url text,
    selfie_url text,
    selfie_with_id_url text,
    interview_completed boolean DEFAULT false NOT NULL,
    interview_scheduled boolean DEFAULT false NOT NULL
);


--
-- Name: COLUMN provider_details.verification_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_details.verification_status IS 'Verification status: none (no docs), pending (awaiting review), verified (approved), rejected';


--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    business_email text,
    business_phone text,
    avatar_url text,
    skills text[] DEFAULT '{}'::text[],
    specialty text,
    hourly_rate numeric,
    rating numeric DEFAULT 0,
    total_reviews integer DEFAULT 0,
    zone_served text,
    verified boolean DEFAULT false,
    fcm_token text,
    current_latitude numeric,
    current_longitude numeric,
    last_location_update timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    stripe_account_id text,
    onboarding_complete boolean DEFAULT false NOT NULL,
    onboarding_step text DEFAULT 'auth'::text,
    stripe_onboarding_status text DEFAULT 'not_started'::text NOT NULL,
    stripe_charges_enabled boolean DEFAULT false NOT NULL,
    stripe_payouts_enabled boolean DEFAULT false NOT NULL,
    stripe_details_submitted boolean DEFAULT false NOT NULL,
    stripe_requirements_currently_due jsonb DEFAULT '[]'::jsonb NOT NULL,
    stripe_requirements_eventually_due jsonb DEFAULT '[]'::jsonb NOT NULL,
    stripe_disabled_reason text
);


--
-- Name: providers_public; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.providers_public WITH (security_invoker='on') AS
 SELECT id,
    user_id,
    display_name,
    avatar_url,
    skills,
    specialty,
    hourly_rate,
    rating,
    total_reviews,
    zone_served,
    verified,
    created_at
   FROM public.providers;


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    key text NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    window_start timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refund_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refund_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    client_id uuid NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid,
    provider_id uuid NOT NULL,
    client_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tags text[] DEFAULT '{}'::text[],
    reviewer_role text DEFAULT 'client'::text NOT NULL,
    job_id uuid,
    visible_at timestamp with time zone,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: COLUMN reviews.tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reviews.tags IS 'Quick tags like Puntual, Profesional, Limpio, etc.';


--
-- Name: COLUMN reviews.reviewer_role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reviews.reviewer_role IS 'client = client reviewing provider, provider = provider reviewing client';


--
-- Name: COLUMN reviews.visible_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reviews.visible_at IS 'When this review becomes visible to the reviewed party (after both rate or 7 days)';


--
-- Name: saved_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    label text NOT NULL,
    address text NOT NULL,
    latitude numeric,
    longitude numeric,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: security_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: service_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: service_subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_subcategories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid,
    slug text NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    description text
);


--
-- Name: stripe_sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    stripe_account_id text NOT NULL,
    status text NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message_text text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_credits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text NOT NULL,
    phone text,
    amount numeric DEFAULT 150 NOT NULL,
    reason text DEFAULT 'welcome'::text NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    redeemed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    full_name text,
    phone text,
    avatar_url text,
    bio text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email text,
    stripe_customer_id text,
    flag_count integer DEFAULT 0,
    account_status text DEFAULT 'active'::text,
    pending_penalty_balance integer DEFAULT 0
);


--
-- Name: account_flags account_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_flags
    ADD CONSTRAINT account_flags_pkey PRIMARY KEY (id);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: dispute_evidence dispute_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_new_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_new_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otp_rate_limit_log otp_rate_limit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_rate_limit_log
    ADD CONSTRAINT otp_rate_limit_log_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);


--
-- Name: phone_verification_otps phone_verification_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_verification_otps
    ADD CONSTRAINT phone_verification_otps_pkey PRIMARY KEY (id);


--
-- Name: photo_short_links photo_short_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_short_links
    ADD CONSTRAINT photo_short_links_pkey PRIMARY KEY (id);


--
-- Name: photo_short_links photo_short_links_short_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_short_links
    ADD CONSTRAINT photo_short_links_short_code_key UNIQUE (short_code);


--
-- Name: provider_details provider_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_details
    ADD CONSTRAINT provider_details_pkey PRIMARY KEY (id);


--
-- Name: provider_details provider_details_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_details
    ADD CONSTRAINT provider_details_user_id_key UNIQUE (user_id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: providers providers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_user_id_key UNIQUE (user_id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (key);


--
-- Name: refund_requests refund_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_job_reviewer_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_job_reviewer_unique UNIQUE (job_id, reviewer_role);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: saved_locations saved_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_locations
    ADD CONSTRAINT saved_locations_pkey PRIMARY KEY (id);


--
-- Name: security_audit_log security_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_audit_log
    ADD CONSTRAINT security_audit_log_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_slug_key UNIQUE (slug);


--
-- Name: service_subcategories service_subcategories_category_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_subcategories
    ADD CONSTRAINT service_subcategories_category_id_slug_key UNIQUE (category_id, slug);


--
-- Name: service_subcategories service_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_subcategories
    ADD CONSTRAINT service_subcategories_pkey PRIMARY KEY (id);


--
-- Name: stripe_sync_logs stripe_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_sync_logs
    ADD CONSTRAINT stripe_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: user_credits user_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_documents_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_provider_id ON public.documents USING btree (provider_id);


--
-- Name: idx_invoice_items_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);


--
-- Name: idx_invoices_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_job_id ON public.invoices USING btree (job_id);


--
-- Name: idx_invoices_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_provider_id ON public.invoices USING btree (provider_id);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_invoices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_user_id ON public.invoices USING btree (user_id);


--
-- Name: idx_jobs_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_client_id ON public.jobs USING btree (client_id);


--
-- Name: idx_jobs_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_provider_id ON public.jobs USING btree (provider_id);


--
-- Name: idx_jobs_provider_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_provider_status ON public.jobs USING btree (provider_id, status);


--
-- Name: idx_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);


--
-- Name: idx_messages_job; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_job ON public.messages USING btree (job_id);


--
-- Name: idx_messages_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_read ON public.messages USING btree (read);


--
-- Name: idx_messages_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_receiver ON public.messages USING btree (receiver_id);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_notifications_user_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, read);


--
-- Name: idx_otp_rate_limit_ip_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otp_rate_limit_ip_created ON public.otp_rate_limit_log USING btree (ip_address, created_at DESC);


--
-- Name: idx_payments_checkout_session_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_payments_checkout_session_unique ON public.payments USING btree (stripe_checkout_session_id) WHERE (stripe_checkout_session_id IS NOT NULL);


--
-- Name: idx_payments_job_type_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_job_type_status ON public.payments USING btree (job_id, type, status);


--
-- Name: idx_payouts_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_invoice_id ON public.payouts USING btree (invoice_id);


--
-- Name: idx_payouts_job_payout_type_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_payouts_job_payout_type_unique ON public.payouts USING btree (job_id, payout_type);


--
-- Name: idx_payouts_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_provider_id ON public.payouts USING btree (provider_id);


--
-- Name: idx_payouts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_status ON public.payouts USING btree (status);


--
-- Name: idx_phone_verification_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_verification_expires ON public.phone_verification_otps USING btree (expires_at);


--
-- Name: idx_phone_verification_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_verification_phone ON public.phone_verification_otps USING btree (phone_number);


--
-- Name: idx_support_messages_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_messages_provider ON public.support_messages USING btree (provider_id, created_at DESC);


--
-- Name: idx_support_messages_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_messages_unread ON public.support_messages USING btree (provider_id, read) WHERE (read = false);


--
-- Name: idx_user_credits_unique_active_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_credits_unique_active_email ON public.user_credits USING btree (email) WHERE (redeemed_at IS NULL);


--
-- Name: idx_user_credits_unique_active_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_credits_unique_active_phone ON public.user_credits USING btree (phone) WHERE ((redeemed_at IS NULL) AND (phone IS NOT NULL));


--
-- Name: idx_user_credits_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_credits_user_id ON public.user_credits USING btree (user_id) WHERE (redeemed_at IS NULL);


--
-- Name: users attach_credits_after_user_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER attach_credits_after_user_insert AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.attach_credits_on_signup();


--
-- Name: documents audit_documents_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_documents_changes AFTER INSERT OR DELETE OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.audit_security_changes();


--
-- Name: messages enforce_message_immutability; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_message_immutability BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.prevent_message_tampering();


--
-- Name: jobs enforce_provider_id_immutability; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_provider_id_immutability BEFORE UPDATE ON public.jobs FOR EACH ROW WHEN ((old.provider_id IS NOT NULL)) EXECUTE FUNCTION public.prevent_provider_id_reassignment();


--
-- Name: provider_details enforce_verified_docs_check; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_verified_docs_check BEFORE UPDATE ON public.provider_details FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_has_docs();


--
-- Name: jobs notify_providers_on_new_job; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_providers_on_new_job AFTER INSERT OR UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.notify_providers_new_job();


--
-- Name: users prevent_delete_with_active_work; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prevent_delete_with_active_work BEFORE DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_with_active_work();


--
-- Name: disputes sync_dispute_status_to_jobs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_dispute_status_to_jobs AFTER INSERT OR DELETE OR UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.fn_sync_dispute_status();


--
-- Name: provider_details sync_verification_status_to_providers; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_verification_status_to_providers AFTER INSERT OR UPDATE OF verification_status ON public.provider_details FOR EACH ROW EXECUTE FUNCTION public.fn_sync_verification_status();


--
-- Name: payments sync_visit_fee_to_jobs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_visit_fee_to_jobs AFTER INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.fn_sync_visit_fee();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: jobs update_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payments update_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payouts update_payouts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: provider_details update_provider_details_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_provider_details_updated_at BEFORE UPDATE ON public.provider_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: providers update_providers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews update_rating_on_review; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rating_on_review AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_provider_rating();


--
-- Name: reviews update_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: saved_locations update_saved_locations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_saved_locations_updated_at BEFORE UPDATE ON public.saved_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: account_flags account_flags_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_flags
    ADD CONSTRAINT account_flags_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: account_flags account_flags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_flags
    ADD CONSTRAINT account_flags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_notifications admin_notifications_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: dispute_evidence dispute_evidence_dispute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;


--
-- Name: dispute_evidence dispute_evidence_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: disputes disputes_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: disputes disputes_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: documents documents_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_parent_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_parent_invoice_id_fkey FOREIGN KEY (parent_invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_followup_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_followup_invoice_id_fkey FOREIGN KEY (followup_invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_new_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_new_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_new_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_new_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: payments payments_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(user_id) ON DELETE SET NULL;


--
-- Name: payouts payouts_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: payouts payouts_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: payouts payouts_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(user_id) ON DELETE CASCADE;


--
-- Name: provider_details provider_details_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_details
    ADD CONSTRAINT provider_details_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: provider_details provider_details_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_details
    ADD CONSTRAINT provider_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: providers providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refund_requests refund_requests_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: service_subcategories service_subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_subcategories
    ADD CONSTRAINT service_subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_provider_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_provider_fkey FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_sender_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_sender_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_credits user_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: account_flags Admin full access to account_flags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to account_flags" ON public.account_flags USING ((auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid));


--
-- Name: dispute_evidence Admin full access to dispute_evidence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to dispute_evidence" ON public.dispute_evidence USING ((auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid));


--
-- Name: disputes Admin full access to disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to disputes" ON public.disputes USING ((auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid));


--
-- Name: admin_notifications Admin only access to admin_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin only access to admin_notifications" ON public.admin_notifications USING ((auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid));


--
-- Name: payouts Admins can insert payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert payouts" ON public.payouts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: stripe_sync_logs Admins can insert sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert sync logs" ON public.stripe_sync_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_messages Admins can send support messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can send support messages" ON public.support_messages FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (auth.uid() = sender_id)));


--
-- Name: invoices Admins can update all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all invoices" ON public.invoices FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_credits Admins can update credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update credits" ON public.user_credits FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: disputes Admins can update disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update disputes" ON public.disputes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: documents Admins can update document status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update document status" ON public.documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payments Admins can update payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payouts Admins can update payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update payouts" ON public.payouts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_messages Admins can update support messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update support messages" ON public.support_messages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_credits Admins can view all credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all credits" ON public.user_credits FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: disputes Admins can view all disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all disputes" ON public.disputes FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: documents Admins can view all documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all documents" ON public.documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: invoice_items Admins can view all invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all invoice items" ON public.invoice_items FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: invoices Admins can view all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all invoices" ON public.invoices FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payments Admins can view all payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payouts Admins can view all payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all payouts" ON public.payouts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reviews Admins can view all reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all reviews" ON public.reviews FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_messages Admins can view all support messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all support messages" ON public.support_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: stripe_sync_logs Admins can view sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view sync logs" ON public.stripe_sync_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: service_categories Anyone can view categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view categories" ON public.service_categories FOR SELECT USING (true);


--
-- Name: service_subcategories Anyone can view subcategories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view subcategories" ON public.service_subcategories FOR SELECT USING (true);


--
-- Name: invoices Clients can accept or reject sent invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can accept or reject sent invoices" ON public.invoices FOR UPDATE USING (((auth.uid() = user_id) AND (status = 'sent'::text))) WITH CHECK (((auth.uid() = user_id) AND (status = ANY (ARRAY['accepted'::text, 'rejected'::text]))));


--
-- Name: reviews Clients can create reviews for completed jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can create reviews for completed jobs" ON public.reviews FOR INSERT WITH CHECK (((auth.uid() = client_id) AND (reviewer_role = 'client'::text) AND (EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = reviews.job_id) AND (jobs.status = 'completed'::text) AND (jobs.client_id = auth.uid()))))));


--
-- Name: disputes Clients can insert disputes for their jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can insert disputes for their jobs" ON public.disputes FOR INSERT WITH CHECK (((auth.uid() = opened_by_user_id) AND (opened_by_role = 'client'::text) AND (EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = disputes.job_id) AND (jobs.client_id = auth.uid()))))));


--
-- Name: disputes Clients can view disputes for their jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view disputes for their jobs" ON public.disputes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = disputes.job_id) AND (jobs.client_id = auth.uid())))));


--
-- Name: invoices Clients can view their invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their invoices" ON public.invoices FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: payments Clients can view their payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their payments" ON public.payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = payments.job_id) AND (jobs.client_id = auth.uid())))));


--
-- Name: reviews Clients can view their reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their reviews" ON public.reviews FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: phone_verification_otps No direct OTP access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No direct OTP access" ON public.phone_verification_otps USING (false);


--
-- Name: otp_rate_limit_log No direct access to rate limit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No direct access to rate limit logs" ON public.otp_rate_limit_log USING (false);


--
-- Name: invoice_items Providers can create invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create invoice items" ON public.invoice_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.provider_id = auth.uid())))));


--
-- Name: invoices Providers can create invoices for their jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create invoices for their jobs" ON public.invoices FOR INSERT WITH CHECK ((auth.uid() = provider_id));


--
-- Name: reviews Providers can create reviews for completed jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create reviews for completed jobs" ON public.reviews FOR INSERT WITH CHECK (((auth.uid() = provider_id) AND (reviewer_role = 'provider'::text) AND (EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = reviews.job_id) AND (jobs.status = 'completed'::text) AND (jobs.provider_id = auth.uid()))))));


--
-- Name: invoice_items Providers can delete their invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can delete their invoice items" ON public.invoice_items FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.provider_id = auth.uid())))));


--
-- Name: disputes Providers can insert disputes for their jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can insert disputes for their jobs" ON public.disputes FOR INSERT WITH CHECK (((auth.uid() = opened_by_user_id) AND (opened_by_role = 'provider'::text) AND (EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = disputes.job_id) AND (jobs.provider_id = auth.uid()))))));


--
-- Name: support_messages Providers can mark messages read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can mark messages read" ON public.support_messages FOR UPDATE USING ((auth.uid() = provider_id));


--
-- Name: support_messages Providers can send support messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can send support messages" ON public.support_messages FOR INSERT WITH CHECK (((auth.uid() = provider_id) AND (auth.uid() = sender_id) AND public.has_role(auth.uid(), 'provider'::public.app_role)));


--
-- Name: invoice_items Providers can update their invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update their invoice items" ON public.invoice_items FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.provider_id = auth.uid())))));


--
-- Name: invoices Providers can update their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update their own invoices" ON public.invoices FOR UPDATE USING ((auth.uid() = provider_id));


--
-- Name: disputes Providers can view disputes for their jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view disputes for their jobs" ON public.disputes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = disputes.job_id) AND (jobs.provider_id = auth.uid())))));


--
-- Name: invoices Providers can view their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their own invoices" ON public.invoices FOR SELECT USING ((auth.uid() = provider_id));


--
-- Name: payouts Providers can view their own payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their own payouts" ON public.payouts FOR SELECT USING ((auth.uid() = provider_id));


--
-- Name: payments Providers can view their payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their payments" ON public.payments FOR SELECT USING ((auth.uid() = provider_id));


--
-- Name: reviews Providers can view their reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their reviews" ON public.reviews FOR SELECT TO authenticated USING ((provider_id = auth.uid()));


--
-- Name: support_messages Providers can view their support messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their support messages" ON public.support_messages FOR SELECT USING ((auth.uid() = provider_id));


--
-- Name: saved_locations Users can delete their own saved locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own saved locations" ON public.saved_locations FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: disputes Users can insert disputes for their own jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert disputes for their own jobs" ON public.disputes FOR INSERT WITH CHECK (((auth.uid() = opened_by_user_id) AND (auth.uid() IN ( SELECT jobs.client_id
   FROM public.jobs
  WHERE (jobs.id = disputes.job_id)
UNION
 SELECT jobs.provider_id
   FROM public.jobs
  WHERE (jobs.id = disputes.job_id)))));


--
-- Name: documents Users can insert their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own documents" ON public.documents FOR INSERT TO authenticated WITH CHECK ((auth.uid() = provider_id));


--
-- Name: saved_locations Users can insert their own saved locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own saved locations" ON public.saved_locations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: documents Users can update their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own documents" ON public.documents FOR UPDATE TO authenticated USING ((auth.uid() = provider_id)) WITH CHECK ((auth.uid() = provider_id));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: saved_locations Users can update their own saved locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own saved locations" ON public.saved_locations FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: dispute_evidence Users can upload evidence for their disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload evidence for their disputes" ON public.dispute_evidence FOR INSERT WITH CHECK (((auth.uid() = uploaded_by_user_id) AND (auth.uid() IN ( SELECT j.client_id
   FROM (public.jobs j
     JOIN public.disputes d ON ((d.job_id = j.id)))
  WHERE (d.id = dispute_evidence.dispute_id)
UNION
 SELECT j.provider_id
   FROM (public.jobs j
     JOIN public.disputes d ON ((d.job_id = j.id)))
  WHERE (d.id = dispute_evidence.dispute_id)))));


--
-- Name: dispute_evidence Users can view evidence for their disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view evidence for their disputes" ON public.dispute_evidence FOR SELECT USING (((auth.uid() = uploaded_by_user_id) OR (auth.uid() IN ( SELECT j.client_id
   FROM (public.jobs j
     JOIN public.disputes d ON ((d.job_id = j.id)))
  WHERE (d.id = dispute_evidence.dispute_id)
UNION
 SELECT j.provider_id
   FROM (public.jobs j
     JOIN public.disputes d ON ((d.job_id = j.id)))
  WHERE (d.id = dispute_evidence.dispute_id)))));


--
-- Name: invoice_items Users can view invoice items for their invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view invoice items for their invoices" ON public.invoice_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND ((invoices.provider_id = auth.uid()) OR (invoices.user_id = auth.uid()))))));


--
-- Name: security_audit_log Users can view their own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own audit logs" ON public.security_audit_log FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_credits Users can view their own credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own credits" ON public.user_credits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: disputes Users can view their own disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own disputes" ON public.disputes FOR SELECT USING (((auth.uid() = opened_by_user_id) OR (auth.uid() IN ( SELECT jobs.client_id
   FROM public.jobs
  WHERE (jobs.id = disputes.job_id)
UNION
 SELECT jobs.provider_id
   FROM public.jobs
  WHERE (jobs.id = disputes.job_id)))));


--
-- Name: documents Users can view their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own documents" ON public.documents FOR SELECT TO authenticated USING ((auth.uid() = provider_id));


--
-- Name: account_flags Users can view their own flags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own flags" ON public.account_flags FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: saved_locations Users can view their own saved locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own saved locations" ON public.saved_locations FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: account_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.account_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs admins_can_view_all_jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_can_view_all_jobs ON public.jobs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: providers admins_can_view_all_providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_can_view_all_providers ON public.providers FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: users admins_can_view_all_users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_can_view_all_users ON public.users FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: refund_requests admins_select_all_refund_requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_select_all_refund_requests ON public.refund_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: refund_requests admins_update_refund_requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_update_refund_requests ON public.refund_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: photo_short_links authenticated_users_select_photo_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_users_select_photo_links ON public.photo_short_links FOR SELECT TO authenticated USING (true);


--
-- Name: refund_requests clients_insert_own_refund_requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clients_insert_own_refund_requests ON public.refund_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = client_id));


--
-- Name: refund_requests clients_select_own_refund_requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clients_select_own_refund_requests ON public.refund_requests FOR SELECT TO authenticated USING ((auth.uid() = client_id));


--
-- Name: dispute_evidence; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;

--
-- Name: disputes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs jobs_new_insert_client; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jobs_new_insert_client ON public.jobs FOR INSERT TO authenticated WITH CHECK (((auth.uid() = client_id) AND (provider_id IS NULL) AND (status = ANY (ARRAY['draft'::text, 'pending'::text]))));


--
-- Name: jobs jobs_new_select_own_client; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jobs_new_select_own_client ON public.jobs FOR SELECT USING ((auth.uid() = client_id));


--
-- Name: jobs jobs_new_select_own_provider; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jobs_new_select_own_provider ON public.jobs FOR SELECT USING ((auth.uid() = provider_id));


--
-- Name: jobs jobs_new_update_client; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jobs_new_update_client ON public.jobs FOR UPDATE USING ((auth.uid() = client_id)) WITH CHECK ((auth.uid() = client_id));


--
-- Name: jobs jobs_new_update_provider; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY jobs_new_update_provider ON public.jobs FOR UPDATE USING ((auth.uid() = provider_id)) WITH CHECK ((auth.uid() = provider_id));


--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: messages messages_insert_job_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_insert_job_participant ON public.messages FOR INSERT WITH CHECK (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = messages.job_id) AND (((j.provider_id = auth.uid()) AND (messages.receiver_id = j.client_id)) OR ((j.client_id = auth.uid()) AND (messages.receiver_id = j.provider_id))))))));


--
-- Name: messages messages_select_job_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_select_job_participant ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = messages.job_id) AND ((j.provider_id = auth.uid()) OR (j.client_id = auth.uid()))))));


--
-- Name: messages messages_update_receiver_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_update_receiver_only ON public.messages FOR UPDATE USING ((receiver_id = auth.uid()));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: otp_rate_limit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.otp_rate_limit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: payouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

--
-- Name: phone_verification_otps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.phone_verification_otps ENABLE ROW LEVEL SECURITY;

--
-- Name: photo_short_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.photo_short_links ENABLE ROW LEVEL SECURITY;

--
-- Name: photo_short_links photo_short_links_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY photo_short_links_insert_auth ON public.photo_short_links FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: provider_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_details ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_details provider_details_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_details_admin_select ON public.provider_details FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: provider_details provider_details_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_details_admin_update ON public.provider_details FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: provider_details provider_details_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_details_insert_own ON public.provider_details FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = provider_details.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: provider_details provider_details_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_details_select_own ON public.provider_details FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = provider_details.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: provider_details provider_details_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_details_update_own ON public.provider_details FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = provider_details.provider_id) AND (p.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = provider_details.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

--
-- Name: providers providers_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY providers_admin_select ON public.providers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: providers providers_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY providers_admin_update ON public.providers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: jobs providers_can_accept_unassigned_jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY providers_can_accept_unassigned_jobs ON public.jobs FOR UPDATE TO authenticated USING (((provider_id IS NULL) AND (status = ANY (ARRAY['searching'::text, 'pending'::text])) AND public.has_role(auth.uid(), 'provider'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.provider_details
  WHERE ((provider_details.user_id = auth.uid()) AND (provider_details.verification_status = 'verified'::text)))))) WITH CHECK (((provider_id = auth.uid()) AND (status = 'assigned'::text)));


--
-- Name: users providers_can_view_job_client_info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY providers_can_view_job_client_info ON public.users FOR SELECT TO authenticated USING ((id IN ( SELECT jobs.client_id
   FROM public.jobs
  WHERE (jobs.provider_id = auth.uid()))));


--
-- Name: providers providers_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY providers_insert_own ON public.providers FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: refund_requests providers_select_job_refund_requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY providers_select_job_refund_requests ON public.refund_requests FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = refund_requests.job_id) AND (jobs.provider_id = auth.uid())))));


--
-- Name: providers providers_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY providers_select_own ON public.providers FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: providers providers_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY providers_update_own ON public.providers FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: jobs providers_view_available_jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY providers_view_available_jobs ON public.jobs FOR SELECT TO authenticated USING (((status = ANY (ARRAY['pending'::text, 'searching'::text])) AND (provider_id IS NULL) AND public.has_role(auth.uid(), 'provider'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.provider_details
  WHERE ((provider_details.user_id = auth.uid()) AND (provider_details.verification_status = 'verified'::text))))));


--
-- Name: refund_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: security_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: service_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: service_subcategories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;

--
-- Name: stripe_sync_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stripe_sync_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: support_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: user_credits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_insert_own ON public.users FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: users users_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select_own ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: users users_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_own ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- PostgreSQL database dump complete
--


