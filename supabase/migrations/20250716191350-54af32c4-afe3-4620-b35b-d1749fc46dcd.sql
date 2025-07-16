-- Allow admins to view all profiles for approval management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.subscription_plan = 'admin'
  )
);

-- Allow admins to view all ads (including pending ones)
CREATE POLICY "Admins can view all ads" 
ON public.ads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.subscription_plan = 'admin'
  )
);