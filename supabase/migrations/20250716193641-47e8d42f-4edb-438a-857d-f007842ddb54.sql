-- Fix all functions to use proper search_path for security
-- This prevents potential SQL injection through schema manipulation

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update the check_subscription_expiry function
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS void AS $$
BEGIN
  -- Reset expired pro subscriptions back to free
  UPDATE public.profiles 
  SET subscription_plan = 'free'
  WHERE subscription_plan = 'pro'
  AND EXISTS (
    SELECT 1 FROM public.admin_approvals 
    WHERE admin_approvals.user_id = profiles.user_id
    AND admin_approvals.status = 'approved'
    AND admin_approvals.approval_type = 'subscription_upgrade'
    AND admin_approvals.subscription_expires_at < now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, subscription_plan, trial_ends_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    'pro', 
    NOW() + INTERVAL '30 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update the check_trial_expiry function
CREATE OR REPLACE FUNCTION public.check_trial_expiry()
RETURNS void AS $$
BEGIN
  -- Reset expired pro trial subscriptions back to free
  UPDATE public.profiles 
  SET subscription_plan = 'free', trial_ends_at = NULL
  WHERE subscription_plan = 'pro'
  AND trial_ends_at IS NOT NULL
  AND trial_ends_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update the notify_admin_new_ad function
CREATE OR REPLACE FUNCTION public.notify_admin_new_ad()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    -- Get admin user IDs
    INSERT INTO notifications (user_id, title, message, type, related_id)
    SELECT 
      profiles.user_id,
      'New Ad Pending Approval',
      'New ad "' || NEW.title || '" from ' || NEW.shop_name || ' is waiting for approval.',
      'ad_pending',
      NEW.id
    FROM profiles
    WHERE profiles.subscription_plan = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update the notify_seller_ad_status function
CREATE OR REPLACE FUNCTION public.notify_seller_ad_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Ad Approved'
        ELSE 'Ad Rejected'
      END,
      'Your ad "' || NEW.title || '" has been ' || NEW.status || '.',
      CASE 
        WHEN NEW.status = 'approved' THEN 'ad_approved'
        ELSE 'ad_rejected'
      END,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update the is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND subscription_plan = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;