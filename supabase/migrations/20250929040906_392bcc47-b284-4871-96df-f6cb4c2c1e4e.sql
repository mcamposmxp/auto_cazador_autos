-- Add debug_mode column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN debug_mode boolean DEFAULT false;

-- Create index for better performance
CREATE INDEX idx_profiles_debug_mode ON public.profiles(debug_mode);

-- Update RLS policies are already in place for profiles table