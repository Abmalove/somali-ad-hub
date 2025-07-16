-- Create triggers for the notification functions if they don't exist

-- Trigger for new ad notifications
DROP TRIGGER IF EXISTS notify_admin_new_ad_trigger ON public.ads;
CREATE TRIGGER notify_admin_new_ad_trigger
  AFTER INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_ad();

-- Trigger for ad status change notifications
DROP TRIGGER IF EXISTS notify_seller_ad_status_trigger ON public.ads;
CREATE TRIGGER notify_seller_ad_status_trigger
  AFTER UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_ad_status();

-- Trigger for updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on ads
DROP TRIGGER IF EXISTS update_ads_updated_at ON public.ads;
CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on admin_approvals
DROP TRIGGER IF EXISTS update_admin_approvals_updated_at ON public.admin_approvals;
CREATE TRIGGER update_admin_approvals_updated_at
  BEFORE UPDATE ON public.admin_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on payment_approvals
DROP TRIGGER IF EXISTS update_payment_approvals_updated_at ON public.payment_approvals;
CREATE TRIGGER update_payment_approvals_updated_at
  BEFORE UPDATE ON public.payment_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();