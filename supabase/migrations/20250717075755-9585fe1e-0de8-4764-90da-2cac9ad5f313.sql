-- Add database triggers for enhanced notifications

-- Create function to notify when a comment is made on an ad
CREATE OR REPLACE FUNCTION public.notify_comment_added()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the ad owner about new comment
  INSERT INTO notifications (user_id, title, message, type, related_id)
  SELECT 
    ads.user_id,
    'New Comment on Your Ad',
    'Someone commented on your ad "' || ads.title || '"',
    'comment_added',
    NEW.ad_id
  FROM ads
  WHERE ads.id = NEW.ad_id
  AND ads.user_id != NEW.user_id; -- Don't notify if commenting on own ad
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create trigger for comment notifications
CREATE TRIGGER notify_comment_added_trigger
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_comment_added();

-- Update existing ad approval notification function to handle boost/highlight approval
CREATE OR REPLACE FUNCTION public.notify_seller_ad_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' AND (NEW.is_boosted OR NEW.is_highlighted) THEN 'Boosted Ad Approved'
        WHEN NEW.status = 'approved' THEN 'Ad Approved'
        ELSE 'Ad Rejected'
      END,
      CASE 
        WHEN NEW.status = 'approved' AND NEW.is_boosted AND NEW.is_highlighted THEN 'Your boosted and highlighted ad "' || NEW.title || '" is now live!'
        WHEN NEW.status = 'approved' AND NEW.is_boosted THEN 'Your boosted ad "' || NEW.title || '" is now live!'
        WHEN NEW.status = 'approved' AND NEW.is_highlighted THEN 'Your highlighted ad "' || NEW.title || '" is now live!'
        WHEN NEW.status = 'approved' THEN 'Your ad "' || NEW.title || '" has been approved and is now live!'
        ELSE 'Your ad "' || NEW.title || '" has been rejected.'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'ad_approved'
        ELSE 'ad_rejected'
      END,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;