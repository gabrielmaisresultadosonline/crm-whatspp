import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VerifyState = "idle" | "checking" | "paid" | "not_paid" | "error";

export default function PagamentoObrigado() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const stateEmail = (location.state as any)?.email as string | undefined;
  const stateNsu = (location.state as any)?.nsuOrder as string | undefined;

  const order_nsu = searchParams.get("order_nsu") || stateNsu || "";
  const transaction_nsu = searchParams.get("transaction_nsu") || "";
  const slug = searchParams.get("slug") || "";
  const receipt_url = searchParams.get("receipt_url") || "";

  const emailFromItem = useMemo(() => {
    // Se você quiser também passar email no redirect_url no futuro, já fica pronto
    return searchParams.get("email") || stateEmail || "";
  }, [searchParams, stateEmail]);

  const [verifyState, setVerifyState] = useState<VerifyState>("idle");

  useEffect(() => {
    // Se veio do redirect do InfiniPay, teremos order_nsu + transaction_nsu + slug.
    if (!order_nsu || !transaction_nsu || !slug) return;

    let cancelled = false;

    const run = async () => {
      try {
        setVerifyState("checking");

        const { data, error } = await supabase.functions.invoke("check-infinitepay-payment", {
          body: { order_nsu, transaction_nsu, slug },
        });

        if (cancelled) return;

        if (error) {
          console.error("check-infinitepay-payment error", error);
          setVerifyState("error");
          toast.error("Não consegui confirmar o pagamento automaticamente.");
          return;
        }

        if (data?.paid) {
          setVerifyState("paid");
          toast.success("Compra aprovada! Verifique no seu email para acessar a aula.");
        } else {
          setVerifyState("not_paid");
          toast.info("Pagamento ainda não consta como aprovado. Se acabou de pagar, aguarde 1-2 minutos.");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setVerifyState("error");
          toast.error("Erro ao verificar pagamento.");
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [order_nsu, transaction_nsu, slug]);

  const showEmail = Boolean(emailFromItem);
  const showNsu = Boolean(order_nsu);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-800/80 border-zinc-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
            {verifyState === "checking" ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <CheckCircle className="w-10 h-10 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-white">Pagamento Confirmado!</CardTitle>
          <CardDescription className="text-zinc-400">
            {verifyState === "checking"
              ? "Confirmando seu pagamento..."
              : "Seu acesso foi liberado com sucesso"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {showEmail && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-green-400" />
                <p className="text-sm text-zinc-400">Email cadastrado</p>
              </div>
              <p className="text-white font-medium">{emailFromItem}</p>
            </div>
          )}

          {showNsu && (
            <div className="bg-zinc-700/30 rounded-lg p-4">
              <p className="text-sm text-zinc-400 mb-1">Número do pedido (NSU)</p>
              <p className="text-lg font-mono text-green-400">{order_nsu}</p>
            </div>
          )}

          {receipt_url && (
            <a
              href={receipt_url}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-zinc-400 underline underline-offset-4 text-center"
            >
              Ver comprovante
            </a>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-zinc-300">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm">Seu pagamento foi processado com sucesso</p>
            </div>
            <div className="flex items-start gap-3 text-zinc-300">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm">Acesso liberado para o email informado</p>
            </div>
          </div>

          <Button
            onClick={() => navigate("/")}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6"
          >
            Acessar Plataforma
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-xs text-zinc-500 text-center">Guarde o número do pedido para referência futura</p>
        </CardContent>
      </Card>
    </div>
  );
}
