-- Fix storage policies for image uploads
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;

-- Create proper storage policies for ad-images bucket
CREATE POLICY "Authenticated users can upload to ad-images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'ad-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view ad-images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ad-images');

CREATE POLICY "Users can update their own images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'ad-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'ad-images' AND 
  auth.uid() IS NOT NULL
);

-- Create proper storage policies for cv-files bucket
CREATE POLICY "Authenticated users can upload CV files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cv-files' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their own CV files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'cv-files' AND 
  auth.uid() IS NOT NULL
);

-- Add payment approvals table for tracking payment confirmations
CREATE TABLE public.payment_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_type TEXT NOT NULL, -- 'boost', 'boost_highlight', 'pro_upgrade'
  amount INTEGER NOT NULL,
  payment_phone TEXT NOT NULL,
  ad_id UUID NULL, -- for boost payments
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  payment_confirmed_by_user BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_approvals
ALTER TABLE public.payment_approvals ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_approvals
CREATE POLICY "Users can view their own payment approvals" 
ON public.payment_approvals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment approvals" 
ON public.payment_approvals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment approvals" 
ON public.payment_approvals 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.subscription_plan = 'admin'
  )
);

CREATE POLICY "Admins can update payment approvals" 
ON public.payment_approvals 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.subscription_plan = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_payment_approvals_updated_at
BEFORE UPDATE ON public.payment_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();