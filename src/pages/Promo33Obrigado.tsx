import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, PartyPopper, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trackPageView, trackPurchase } from '@/lib/facebookTracking';
import logoMro from '@/assets/logo-mro.png';

const PROMO33_STORAGE_KEY = 'promo33_user_session';

export default function Promo33Obrigado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isActivating, setIsActivating] = useState(true);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const email = searchParams.get('email');
    const session = localStorage.getItem(PROMO33_STORAGE_KEY);
    let userEmail = email;
    if (!userEmail && session) {
      try {
        const user = JSON.parse(session);
        userEmail = user.email;
      } catch (e) {}
    }

    trackPageView('Promo33 Thank You');
    trackPurchase(33, 'Promo33 Monthly', userEmail || undefined);
    
    activateSubscription();
  }, []);

  const activateSubscription = async () => {
    const email = searchParams.get('email');
    const session = localStorage.getItem(PROMO33_STORAGE_KEY);
    
    let userEmail = email;
    if (!userEmail && session) {
      const user = JSON.parse(session);
      userEmail = user.email;
    }

    if (!userEmail) {
      toast.error('Sessão não encontrada. Faça login novamente.');
      setTimeout(() => navigate('/promo33'), 2000);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('promo33-auth', {
        body: {
          action: 'activate_subscription',
          email: userEmail
        }
      });

      if (error) throw error;

      if (data?.success) {
        localStorage.setItem(PROMO33_STORAGE_KEY, JSON.stringify(data.user));
        setActivated(true);
        toast.success('Assinatura ativada com sucesso!');
      } else {
        toast.error(data?.message || 'Erro ao ativar assinatura');
      }
    } catch (error: any) {
      console.error('Activation error:', error);
      toast.error('Erro ao ativar. Entre em contato com o suporte.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900/20 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/80 border-green-500/30 backdrop-blur">
        <CardContent className="p-8 text-center">
          <img src={logoMro} alt="MRO" className="h-12 mx-auto mb-6" />
          
          {isActivating ? (
            <>
              <Loader2 className="w-16 h-16 text-green-500 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Ativando sua conta...</h1>
              <p className="text-gray-400">Aguarde um momento</p>
            </>
          ) : activated ? (
            <>
              <div className="relative">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <PartyPopper className="w-8 h-8 text-yellow-500 absolute top-0 right-1/4 animate-bounce" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">Parabéns! 🎉</h1>
              <p className="text-gray-300 mb-6">
                Sua assinatura Premium foi ativada com sucesso!
              </p>
              
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
                <p className="text-green-400 font-semibold">Acesso liberado por 30 dias</p>
                <p className="text-gray-400 text-sm">Aproveite todas as funcionalidades</p>
              </div>
              
              <Button 
                onClick={() => navigate('/promo33/dashboard')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6"
              >
                ACESSAR DASHBOARD
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <CheckCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Pagamento Recebido!</h1>
              <p className="text-gray-400 mb-6">
                Se sua conta não foi ativada automaticamente, clique no botão abaixo.
              </p>
              
              <Button 
                onClick={() => navigate('/promo33/dashboard')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6"
              >
                IR PARA DASHBOARD
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
