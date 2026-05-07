import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Wallet, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AdsNewsObrigadoSaldo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'success' | 'pending'>('checking');
  const [balanceOrder, setBalanceOrder] = useState<any>(null);
  const [checkCount, setCheckCount] = useState(0);

  const nsuOrder = searchParams.get('nsu') || searchParams.get('order_nsu');

  useEffect(() => {
    const checkPayment = async () => {
      // Get user from localStorage
      const storedUser = localStorage.getItem('ads_user');
      if (!storedUser) {
        toast.error('Usuário não encontrado');
        navigate('/anuncios');
        return;
      }

      const user = JSON.parse(storedUser);

      // Find balance order
      let query = supabase.from('ads_balance_orders').select('*');
      
      if (nsuOrder) {
        query = query.eq('nsu_order', nsuOrder);
      } else {
        query = query.eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
      }

      const { data: order, error } = await query.maybeSingle();

      if (error || !order) {
        console.log('Balance order not found, retrying...', { nsuOrder });
        if (checkCount < 60) {
          setTimeout(() => setCheckCount(c => c + 1), 5000);
        } else {
          setStatus('pending');
        }
        return;
      }

      setBalanceOrder(order);

      if (order.status === 'paid') {
        setStatus('success');
        toast.success('Saldo adicionado com sucesso!');
      } else {
        if (checkCount < 60) {
          setTimeout(() => setCheckCount(c => c + 1), 5000);
        } else {
          setStatus('pending');
        }
      }
    };

    checkPayment();
  }, [checkCount, nsuOrder, navigate]);

  const handleAccessDashboard = () => {
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
                <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                  <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                </div>
                <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-yellow-400 animate-bounce" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Processando Saldo...
                </h2>
                <p className="text-emerald-300">
                  Aguarde enquanto adicionamos seu saldo
                </p>
              </div>

              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                <p className="text-sm text-emerald-200">
                  ⏳ Verificando pagamento...
                </p>
                <p className="text-xs text-emerald-300 mt-2">
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
                  💰 Saldo Adicionado!
                </h2>
                <p className="text-green-300 text-lg">
                  Seu saldo foi creditado com sucesso!
                </p>
              </div>

              {balanceOrder && (
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-400">
                    <Wallet className="w-8 h-8" />
                    <span>+R$ {balanceOrder.amount.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-green-200 mt-2">
                    ~{balanceOrder.leads_quantity} leads estimados
                  </p>
                </div>
              )}

              <Button 
                onClick={handleAccessDashboard}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg font-bold"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Voltar para Dashboard
              </Button>

              <p className="text-xs text-blue-300">
                Seu saldo já está disponível para campanhas
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
                  Ainda não confirmamos seu pagamento do saldo
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
                  onClick={handleAccessDashboard}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Voltar para Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdsNewsObrigadoSaldo;
