-- Add foreign key constraints to fix relationship issues
ALTER TABLE public.admin_approvals 
ADD CONSTRAINT admin_approvals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.payment_approvals 
ADD CONSTRAINT payment_approvals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;