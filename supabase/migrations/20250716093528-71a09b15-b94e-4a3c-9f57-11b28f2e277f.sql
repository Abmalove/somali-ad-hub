-- Update admin email address
UPDATE public.profiles 
SET email = 'asowcade1@gmail.com'
WHERE email = 'Yusufhunter2000@gmail.com' 
AND subscription_plan = 'admin';

-- If no admin exists with that email, create a new admin profile
-- (This will only insert if the above UPDATE affected 0 rows)
INSERT INTO public.profiles (user_id, email, subscription_plan)
SELECT gen_random_uuid(), 'asowcade1@gmail.com', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE subscription_plan = 'admin'
);

-- Ensure we have the admin email set correctly
UPDATE public.profiles 
SET subscription_plan = 'admin'
WHERE email = 'asowcade1@gmail.com';