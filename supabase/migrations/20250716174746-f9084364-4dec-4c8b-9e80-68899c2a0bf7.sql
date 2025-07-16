-- Update asowcade1@gmail.com user to have admin access
UPDATE profiles 
SET subscription_plan = 'admin' 
WHERE email = 'asowcade1@gmail.com';