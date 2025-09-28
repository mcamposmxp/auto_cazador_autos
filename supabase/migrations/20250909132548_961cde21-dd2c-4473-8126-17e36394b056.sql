-- Security audit: Check if profesionales table has proper RLS protection
-- Let's verify that anonymous users cannot access the profesionales table

-- First, let's check the current policies structure
SELECT 
  p.policyname,
  p.cmd,
  p.permissive,
  p.qual,
  p.with_check
FROM pg_policies p
WHERE p.tablename = 'profesionales' AND p.schemaname = 'public'
ORDER BY p.cmd, p.policyname;