-- Set explicit search_path for common utility functions
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Enable RLS and add basic policies for core CRM tables
-- Assuming authenticated users are admins for this project structure
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.crm_settings;
CREATE POLICY "Authenticated users can manage settings" 
ON public.crm_settings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON public.crm_contacts;
CREATE POLICY "Authenticated users can manage contacts" 
ON public.crm_contacts FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage messages" ON public.crm_messages;
CREATE POLICY "Authenticated users can manage messages" 
ON public.crm_messages FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.crm_flows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage flows" ON public.crm_flows;
CREATE POLICY "Authenticated users can manage flows" 
ON public.crm_flows FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.crm_flow_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage flow steps" ON public.crm_flow_steps;
CREATE POLICY "Authenticated users can manage flow steps" 
ON public.crm_flow_steps FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Fix specific function from linter (example)
-- Note: Replace with actual function names from your schema if they differ
-- DO NOT RUN unless functions exist
-- ALTER FUNCTION public.your_function_name() SET search_path = public;
