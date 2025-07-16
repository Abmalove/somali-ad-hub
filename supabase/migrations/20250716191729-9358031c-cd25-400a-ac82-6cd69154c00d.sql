-- Update payment_approvals RLS policy to use the security definer function
DROP POLICY IF EXISTS "Admins can view all payment approvals" ON public.payment_approvals;

CREATE POLICY "Admins can view all payment approvals" 
ON public.payment_approvals 
FOR SELECT 
USING (public.is_admin() OR auth.uid() = user_id);