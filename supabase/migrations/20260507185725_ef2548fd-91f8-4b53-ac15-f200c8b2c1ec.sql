-- Add connection fields to crm_settings
ALTER TABLE public.crm_settings 
ADD COLUMN IF NOT EXISTS connection_type TEXT DEFAULT 'meta',
ADD COLUMN IF NOT EXISTS wpp_web_status TEXT DEFAULT 'disconnected',
ADD COLUMN IF NOT EXISTS wpp_web_qr_code TEXT,
ADD COLUMN IF NOT EXISTS wpp_web_session_id TEXT;

-- Add whatsapp_type to contacts to know if they came via Meta or Wpp-Web
ALTER TABLE public.crm_contacts
ADD COLUMN IF NOT EXISTS whatsapp_type TEXT DEFAULT 'meta';

-- Ensure connection_type is restricted to valid values
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_settings_connection_type_check') THEN
        ALTER TABLE public.crm_settings 
        ADD CONSTRAINT crm_settings_connection_type_check 
        CHECK (connection_type IN ('meta', 'wpp-web'));
    END IF;
END $$;