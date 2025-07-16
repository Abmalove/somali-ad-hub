-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all ads" ON public.ads;

-- Create security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND subscription_plan = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Allow admins to view all profiles for approval management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin() OR auth.uid() = user_id);

-- Allow admins to view all ads (including pending ones)
CREATE POLICY "Admins can view all ads" 
ON public.ads 
FOR SELECT 
USING (public.is_admin() OR auth.uid() = user_id OR status = 'approved');