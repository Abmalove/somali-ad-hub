-- First drop the existing check constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;

-- Add a new check constraint that includes 'admin'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_plan_check 
CHECK (subscription_plan IN ('free', 'pro', 'admin'));

-- Now update the admin email address
UPDATE public.profiles 
SET email = 'asowcade1@gmail.com', subscription_plan = 'admin'
WHERE email = 'Yusufhunter2000@gmail.com';

-- If no profile exists with the old email, create admin profile for new email
INSERT INTO public.profiles (user_id, email, subscription_plan)
SELECT gen_random_uuid(), 'asowcade1@gmail.com', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = 'asowcade1@gmail.com'
);