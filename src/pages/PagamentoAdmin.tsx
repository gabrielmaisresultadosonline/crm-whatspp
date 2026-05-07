import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Mail,
  CreditCard,
  Timer,
  Loader2,
  Copy,
  Link,
  Package
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/infinitepay-webhook`;
interface PaymentOrder {
  id: string;
  email: string;
  nsu_order: string;
  amount: number;
  status: string;
  infinitepay_link: string | null;
  created_at: string;
  expires_at: string;
  paid_at: string | null;
  verified_at: string | null;
}

export default function PagamentoAdmin() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [lastVerification, setLastVerification] = useState<Date | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("payment_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        toast.error("Erro ao carregar pedidos");
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayments = useCallback(async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-infinitepay-payments");
      
      if (error) {
        console.error("Error verifying payments:", error);
        toast.error("Erro ao verificar pagamentos");
        return;
      }

      setLastVerification(new Date());
      toast.success(`Verificação concluída: ${data?.verified || 0} pagamentos confirmados`);
      
      // Refresh orders after verification
      await fetchOrders();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro na verificação");
    } finally {
      setVerifying(false);
    }
  }, [fetchOrders]);

  const markAsPaid = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("payment_orders")
        .update({ 
          status: "paid", 
          paid_at: new Date().toISOString(),
          verified_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) {
        toast.error("Erro ao marcar como pago");
        return;
      }

      toast.success("Pagamento marcado como pago!");
      fetchOrders();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const markAsExpired = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("payment_orders")
        .update({ status: "expired" })
        .eq("id", orderId);

      if (error) {
        toast.error("Erro ao marcar como expirado");
        return;
      }

      toast.success("Pedido marcado como expirado");
      fetchOrders();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto-verify every 1 minute
    const interval = setInterval(() => {
      verifyPayments();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchOrders, verifyPayments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Pago</Badge>;
      case "expired":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expirado</Badge>;
      case "pending":
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
    }
  };

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === "paid").length,
    pending: orders.filter(o => o.status === "pending").length,
    expired: orders.filter(o => o.status === "expired").length,
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    toast.success("URL do webhook copiada!");
  };

  const getProductName = (email: string) => `MRO_${email}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin - Pagamentos</h1>
            <p className="text-zinc-400">Gerenciamento de pagamentos InfiniPay</p>
          </div>
          
          <div className="flex items-center gap-3">
            {lastVerification && (
              <span className="text-xs text-zinc-500">
                Última verificação: {format(lastVerification, "HH:mm:ss", { locale: ptBR })}
              </span>
            )}
            <Button
              onClick={verifyPayments}
              disabled={verifying}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {verifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Verificar Pagamentos
            </Button>
          </div>
        </div>

        {/* Webhook URL Info */}
        <Card className="bg-zinc-800/50 border-zinc-700 border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Link className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Webhook para InfiniPay</p>
                  <p className="text-xs text-zinc-400 mt-1 break-all font-mono">{WEBHOOK_URL}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Configure esta URL no painel InfiniPay para receber notificações automáticas de pagamento
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyWebhookUrl}
                className="shrink-0"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar URL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-zinc-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-zinc-400">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
                  <p className="text-xs text-zinc-400">Pagos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                  <p className="text-xs text-zinc-400">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
                  <p className="text-xs text-zinc-400">Expirados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Pedidos</CardTitle>
            <CardDescription className="text-zinc-400">
              Verificação automática a cada 1 minuto para pedidos pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">Nenhum pedido encontrado</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-zinc-700/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-green-400 text-sm">{order.nsu_order}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{order.email}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-blue-400">
                        <Package className="w-3 h-3" />
                        <span className="font-mono">{getProductName(order.email)}</span>
                        <span className="text-zinc-500">(nome do produto no InfiniPay)</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span>R$ {order.amount.toFixed(2).replace(".", ",")}</span>
                        <span>•</span>
                        <span>Criado: {format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                        {order.paid_at && (
                          <>
                            <span>•</span>
                            <span className="text-green-400">
                              Pago: {format(new Date(order.paid_at), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </>
                        )}
                      </div>

                      {order.status === "pending" && (
                        <div className="flex items-center gap-2 text-xs text-yellow-500">
                          <Timer className="w-3 h-3" />
                          <span>Expira: {format(new Date(order.expires_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>

                    {order.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => markAsPaid(order.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Marcar Pago
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsExpired(order.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Expirar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
