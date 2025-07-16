-- Allow admins to update ads (for approval/rejection)
CREATE POLICY "Admins can update ads" 
ON public.ads 
FOR UPDATE 
USING (public.is_admin() OR auth.uid() = user_id);