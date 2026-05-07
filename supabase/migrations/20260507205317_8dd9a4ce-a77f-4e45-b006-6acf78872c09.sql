-- Tabela para comandos do bot que o navegador pode escrever sem auth complexa
CREATE TABLE IF NOT EXISTS public.wpp_bot_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS e permitir acesso total (temporário para pareamento)
ALTER TABLE public.wpp_bot_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público para comandos bot" ON public.wpp_bot_commands FOR ALL USING (true) WITH CHECK (true);

-- Garantir que a tabela de sessões também seja pública para o QR Code
ALTER TABLE public.wpp_bot_session ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to sessions" ON public.wpp_bot_session;
CREATE POLICY "Public access to sessions" ON public.wpp_bot_session FOR ALL USING (true) WITH CHECK (true);
