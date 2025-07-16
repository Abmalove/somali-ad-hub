-- Update all existing free users to have 'pro' subscription for first month trial
-- Add a trial_ends_at field to track when trial ends
ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Update all existing free users to have pro trial for 30 days
UPDATE profiles 
SET 
  subscription_plan = 'pro',
  trial_ends_at = NOW() + INTERVAL '30 days'
WHERE subscription_plan = 'free';

-- Create a function to handle new user registration with pro trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
$$;

-- Create a function to automatically downgrade expired trials
CREATE OR REPLACE FUNCTION public.check_trial_expiry()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Reset expired pro trial subscriptions back to free
  UPDATE public.profiles 
  SET subscription_plan = 'free', trial_ends_at = NULL
  WHERE subscription_plan = 'pro'
  AND trial_ends_at IS NOT NULL
  AND trial_ends_at < NOW();
END;
$$;

-- Create notifications table for admin and seller notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'ad_pending', 'ad_approved', 'ad_rejected', 'payment_pending', etc.
  read BOOLEAN DEFAULT FALSE,
  related_id UUID, -- can reference ads, payments, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Add shop_name to payment_approvals for better tracking
-- Join with profiles to get shop_name, or add it directly
ALTER TABLE payment_approvals ADD COLUMN shop_name TEXT;

-- Update existing payment approvals with shop names
UPDATE payment_approvals 
SET shop_name = profiles.shop_name
FROM profiles
WHERE payment_approvals.user_id = profiles.user_id;

-- Create function to notify admin when new ad is pending
CREATE OR REPLACE FUNCTION notify_admin_new_ad()
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
$$ LANGUAGE plpgsql;

-- Create trigger for new ad notifications
CREATE TRIGGER trigger_notify_admin_new_ad
  AFTER INSERT ON ads
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_ad();

-- Create function to notify seller when ad is approved/rejected
CREATE OR REPLACE FUNCTION notify_seller_ad_status()
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
$$ LANGUAGE plpgsql;

-- Create trigger for ad status notifications
CREATE TRIGGER trigger_notify_seller_ad_status
  AFTER UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION notify_seller_ad_status();

-- Enable realtime for notifications
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;