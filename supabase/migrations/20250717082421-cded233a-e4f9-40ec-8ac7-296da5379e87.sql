-- Allow users to delete their own ads
CREATE POLICY "Users can delete their own ads" 
ON public.ads 
FOR DELETE 
USING (auth.uid() = user_id);