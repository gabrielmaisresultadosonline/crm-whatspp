import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AdsNewsObrigado = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'success' | 'pending'>('checking');
  const [user, setUser] = useState<any>(null);
  const [checkCount, setCheckCount] = useState(0);

  const nsuOrder = searchParams.get('nsu') || searchParams.get('order_nsu');
  const emailParam = searchParams.get('email');

  useEffect(() => {
    const checkPayment = async () => {
      // Try to find order by NSU or email
      let query = supabase.from('ads_orders').select('*');
      
      if (nsuOrder) {
        query = query.eq('nsu_order', nsuOrder);
      } else if (emailParam) {
        query = query.ilike('email', emailParam.toLowerCase()).order('created_at', { ascending: false }).limit(1);
      } else {
        // Try to get from localStorage
        const storedEmail = localStorage.getItem('ads_pending_email');
        if (storedEmail) {
          query = query.ilike('email', storedEmail.toLowerCase()).order('created_at', { ascending: false }).limit(1);
        } else {
          setStatus('pending');
          return;
        }
      }

      const { data: order, error } = await query.maybeSingle();

      if (error || !order) {
        console.log('Order not found, retrying...', { nsuOrder, emailParam });
        if (checkCount < 60) { // Try for up to 5 minutes
          setTimeout(() => setCheckCount(c => c + 1), 5000);
        } else {
          setStatus('pending');
        }
        return;
      }

      if (order.status === 'paid') {
        // Get user data for auto-login
        const { data: userData } = await supabase
          .from('ads_users')
          .select('*')
          .ilike('email', order.email)
          .maybeSingle();

        if (userData) {
          setUser(userData);
          // Store login data for auto-login
          localStorage.setItem('ads_user', JSON.stringify(userData));
          localStorage.removeItem('ads_pending_email');
        }
        
        setStatus('success');
        toast.success('Pagamento confirmado!');
      } else {
        // Keep checking
        if (checkCount < 60) {
          setTimeout(() => setCheckCount(c => c + 1), 5000);
        } else {
          setStatus('pending');
        }
      }
    };

    checkPayment();
  }, [checkCount, nsuOrder, emailParam]);

  const handleAccessDashboard = () => {
    if (user) {
      localStorage.setItem('ads_user', JSON.stringify(user));
    }
    navigate('/anuncios/dash');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-slate-800/90 border-blue-500/30 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <img 
            src="/ads-news-full.png" 
            alt="Ads News" 
            className="h-12 mx-auto mb-6"
          />

          {status === 'checking' && (
            <div className="space-y-6">
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                  <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                </div>
                <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-yellow-400 animate-bounce" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Verificando Pagamento...
                </h2>
                <p className="text-blue-300">
                  Aguarde enquanto confirmamos seu pagamento
                </p>
              </div>

              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <p className="text-sm text-blue-200">
                  ⏳ Isso pode levar alguns segundos...
                </p>
                <p className="text-xs text-blue-300 mt-2">
                  Verificação {checkCount + 1}/60
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  🎉 Pagamento Confirmado!
                </h2>
                <p className="text-green-300 text-lg">
                  Seu acesso foi liberado com sucesso!
                </p>
              </div>

              {user && (
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 text-left">
                  <p className="text-sm text-green-200 mb-2">Seus dados de acesso:</p>
                  <p className="text-white"><strong>Email:</strong> {user.email}</p>
                  <p className="text-white"><strong>Senha:</strong> {user.password}</p>
                </div>
              )}

              <Button 
                onClick={handleAccessDashboard}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-8 text-xl font-bold animate-pulse"
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                ACESSAR ÁREA DE MEMBROS
              </Button>

              <p className="text-sm text-green-300 font-medium">
                ✅ Você já está logado - clique acima para entrar
              </p>
            </div>
          )}

          {status === 'pending' && (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertCircle className="w-16 h-16 text-yellow-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Pagamento Pendente
                </h2>
                <p className="text-yellow-300">
                  Ainda não confirmamos seu pagamento
                </p>
              </div>

              <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-sm text-yellow-200">
                  Se você já pagou, aguarde alguns minutos e tente novamente.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setCheckCount(0);
                    setStatus('checking');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Verificar Novamente
                </Button>
                
                <Button 
                  onClick={() => navigate('/anuncios')}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Voltar para Página de Vendas
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdsNewsObrigado;
