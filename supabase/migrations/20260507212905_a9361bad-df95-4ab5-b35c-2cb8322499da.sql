ALTER TABLE public.wpp_bot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público às mensagens do robô"
ON public.wpp_bot_messages
FOR ALL
USING (true)
WITH CHECK (true);