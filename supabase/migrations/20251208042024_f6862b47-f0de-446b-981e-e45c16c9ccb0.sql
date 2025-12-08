-- Add admin role for asaga2003@gmail.com (user_id: 30c2aa13-4338-44ca-8c74-d60421ed9bfc)
INSERT INTO public.user_roles (user_id, role)
VALUES ('30c2aa13-4338-44ca-8c74-d60421ed9bfc', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Add RLS policy so admins can view ALL jobs
CREATE POLICY "admins_can_view_all_jobs" ON public.jobs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy so admins can view ALL users (for client contact info)
CREATE POLICY "admins_can_view_all_users" ON public.users
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy so admins can view ALL providers
CREATE POLICY "admins_can_view_all_providers" ON public.providers
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));