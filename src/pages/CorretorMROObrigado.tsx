import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, Download, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CorretorMROObrigado: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const nsu = searchParams.get('nsu') || '';
  
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!nsu && !email) {
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-corretor-payment', {
          body: { nsu_order: nsu, email }
        });

        if (error) throw error;

        if (data?.paid || data?.status === 'completed') {
          setVerified(true);
        }
      } catch (err) {
        console.error('Erro ao verificar:', err);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [nsu, email]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          {verifying ? (
            <>
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-white mb-2">Verificando Pagamento...</h1>
              <p className="text-gray-400">Aguarde alguns segundos</p>
            </>
          ) : verified ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-white mb-4">
                Pagamento Confirmado! 🎉
              </h1>
              <p className="text-gray-300 mb-6">
                Seu acesso ao <strong>Corretor MRO</strong> foi liberado com sucesso!
              </p>

              {email && (
                <div className="bg-gray-900 p-4 rounded-lg mb-6">
                  <p className="text-gray-400 text-sm mb-1">Seu e-mail de acesso:</p>
                  <p className="text-blue-400 font-bold text-lg">{email}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 rounded-lg border border-blue-500/30">
                  <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h3 className="text-white font-bold mb-2">Próximos Passos:</h3>
                  <ol className="text-gray-300 text-sm text-left space-y-2">
                    <li>1. Baixe a extensão do Corretor MRO</li>
                    <li>2. Faça login com o e-mail acima</li>
                    <li>3. Comece a corrigir seus textos!</li>
                  </ol>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6"
                  onClick={() => {
                    toast.success('Link da extensão copiado!');
                    // Aqui pode colocar o link real da extensão
                  }}
                >
                  <Download className="w-5 h-5 mr-2" />
                  BAIXAR EXTENSÃO
                </Button>
              </div>

              <p className="text-gray-500 text-sm mt-6">
                Você receberá um e-mail com as instruções de acesso.
              </p>
            </>
          ) : (
            <>
              <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-white mb-4">
                Obrigado pelo seu interesse!
              </h1>
              <p className="text-gray-300 mb-6">
                Se você já realizou o pagamento, aguarde alguns instantes para a confirmação automática.
              </p>
              
              <Button
                onClick={() => window.location.href = '/corretormro'}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                Voltar para a página inicial
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CorretorMROObrigado;
