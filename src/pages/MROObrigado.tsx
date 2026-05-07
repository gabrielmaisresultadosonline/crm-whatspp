import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackPageView, trackPurchase, trackLead } from "@/lib/facebookTracking";
import { useWhatsAppConfig } from "@/hooks/useWhatsAppConfig";

const MROObrigado = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const { whatsappNumber } = useWhatsAppConfig();
  const { toast } = useToast();

  useEffect(() => {
    trackPageView('Thank You Page - MRO Purchase Complete');
    trackPurchase(397, 'MRO I.A + Automação');
    
    toast({
      title: "Compra aprovada!",
      description: "Verifique no seu email para acessar a aula.",
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !email.trim()) {
      toast({
        title: "Preencha todos os campos",
        description: "Nome e email são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Track Lead event when user submits form to WhatsApp
    trackLead('Thank You Page - WhatsApp Access Request');

    const message = encodeURIComponent(
      `Olá! Acabei de comprar o MRO I.A + Automação!\n\nNome: ${nome.trim()}\nEmail: ${email.trim()}`
    );
    
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Celebration Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative inline-block">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto animate-bounce" />
            <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -bottom-1 -left-2 animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent animate-pulse">
            OBRIGADO!
          </h1>
          
          <div className="space-y-2">
            <p className="text-xl font-semibold text-foreground">
              Parabéns por fazer parte do MRO!
            </p>
            <p className="text-muted-foreground">
              Você acaba de adquirir um sistema que vai transformar seus resultados no Instagram com Inteligência Artificial + Automação.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                Para receber seu acesso
              </h2>
              <p className="text-sm text-muted-foreground">
                Digite seus dados abaixo e clique em "Receber Acesso"
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu melhor e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Receber Acesso
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              Ao clicar, você será direcionado ao WhatsApp para receber suas credenciais de acesso.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MRO - Mais Resultados Online
        </p>
      </div>
    </div>
  );
};

export default MROObrigado;
