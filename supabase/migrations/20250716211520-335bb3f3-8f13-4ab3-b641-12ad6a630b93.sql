-- Fix the is_admin function to properly check for admin status
DROP FUNCTION IF EXISTS public.is_admin();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND subscription_plan = 'admin'
  );
$$;

-- Also fix the RLS policies to use simpler checks
DROP POLICY IF EXISTS "Admins can view all payment approvals" ON public.payment_approvals;
DROP POLICY IF EXISTS "Admins can update payment approvals" ON public.payment_approvals;
DROP POLICY IF EXISTS "Admins can view all approval requests" ON public.admin_approvals;
DROP POLICY IF EXISTS "Admins can update approval requests" ON public.admin_approvals;

-- Recreate the policies with direct profile checks to avoid recursion
CREATE POLICY "Admins can view all payment approvals" 
ON public.payment_approvals 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND subscription_plan = 'admin'
  ) OR auth.uid() = user_id
);

CREATE POLICY "Admins can update payment approvals" 
ON public.payment_approvals 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND subscription_plan = 'admin'
  )
);

CREATE POLICY "Admins can view all approval requests" 
ON public.admin_approvals 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND subscription_plan = 'admin'
  ) OR auth.uid() = user_id
);

CREATE POLICY "Admins can update approval requests" 
ON public.admin_approvals 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND subscription_plan = 'admin'
  )
);