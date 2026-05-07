import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard, Mail, CheckCircle } from "lucide-react";

const AMOUNT = 1.00; // R$ para teste (alterar para 97.00 em produção)

export default function Pagamento() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [nsuOrder, setNsuOrder] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const navigate = useNavigate();

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setLoading(true);

    try {
      // Chamar edge function para criar checkout via API do InfiniPay
      const { data, error } = await supabase.functions.invoke("create-infinitepay-checkout", {
        body: { 
          email: email.toLowerCase().trim(),
          amount: AMOUNT
        }
      });

      if (error) {
        console.error("Error creating checkout:", error);
        toast.error("Erro ao criar link de pagamento. Tente novamente.");
        return;
      }

      if (!data.success) {
        toast.error(data.error || "Erro ao criar pagamento");
        return;
      }

      setNsuOrder(data.nsu_order);
      setPaymentLink(data.payment_link);
      setPaymentCreated(true);
      
      if (data.fallback) {
        toast.success("Link de pagamento gerado! Clique para pagar.");
      } else {
        toast.success("Checkout criado com sucesso! Clique para pagar.");
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = () => {
    toast.info("Compra em processamento! Verifique seu email após o pagamento para acessar a aula.", {
      duration: 8000,
    });
    window.open(paymentLink, "_blank");
  };

  const handleCheckPayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_orders")
        .select("status, paid_at")
        .eq("nsu_order", nsuOrder)
        .single();

      if (error) {
        toast.error("Erro ao verificar pagamento");
        return;
      }

      if (data.status === "paid") {
        toast.success("Compra aprovada! Verifique no seu email para acessar a aula.");
        navigate("/pagamentoobrigado", { state: { email, nsuOrder } });
      } else {
        toast.info("Pagamento ainda não confirmado. Aguarde alguns instantes.");
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      toast.error("Erro ao verificar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-800/80 border-zinc-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Pagamento MRO
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {!paymentCreated 
              ? "Insira seu email para gerar o link de pagamento"
              : "Link de pagamento gerado! Clique para pagar"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!paymentCreated ? (
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Seu Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500"
                  required
                />
              </div>

              <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                <p className="text-sm text-zinc-400">Valor do pagamento</p>
                <p className="text-3xl font-bold text-green-400">
                  R$ {AMOUNT.toFixed(2).replace(".", ",")}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Gerar Link de Pagamento"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-sm text-zinc-400 mb-1">NSU do Pedido</p>
                <p className="text-lg font-mono text-green-400">{nsuOrder}</p>
              </div>

              <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                <p className="text-sm text-zinc-400">Email cadastrado</p>
                <p className="text-white font-medium">{email}</p>
              </div>

              <Button
                onClick={handleOpenPayment}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Pagar com InfiniPay
              </Button>

              <Button
                onClick={handleCheckPayment}
                variant="outline"
                className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Já paguei - Verificar pagamento
                  </>
                )}
              </Button>

              <p className="text-xs text-zinc-500 text-center">
                O pagamento será verificado automaticamente via webhook.
                <br />
                Válido por 30 minutos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
