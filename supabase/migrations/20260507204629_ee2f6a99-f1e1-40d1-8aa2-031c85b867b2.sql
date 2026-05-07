CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Allow everyone to read (for the demo/admin context)
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for admin session" ON public.admin_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert for admin session" ON public.admin_sessions FOR INSERT WITH CHECK (true);
