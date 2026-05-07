-- Create a special settings table to track if we should bypass auth for QR generation (temporary)
CREATE TABLE IF NOT EXISTS public.crm_auth_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bypass_token TEXT DEFAULT 'bypass-temp-auth-2024'
);

INSERT INTO public.crm_auth_config (bypass_token) VALUES ('bypass-temp-auth-2024')
ON CONFLICT DO NOTHING;

-- Grant access to everyone for this table since it's just a handshake
ALTER TABLE public.crm_auth_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read auth config" ON public.crm_auth_config FOR SELECT USING (true);
