import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackPageView, trackPurchase, trackLead } from "@/lib/facebookTracking";
import { useWhatsAppConfig } from "@/hooks/useWhatsAppConfig";

const ObrigadoZapmro = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const { whatsappNumber } = useWhatsAppConfig();
  const { toast } = useToast();

  useEffect(() => {
    trackPageView('Thank You Page - ZAPMRO Purchase Complete');
    trackPurchase(397, 'ZAPMRO Anual');
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

    trackLead('Thank You Page ZAPMRO - WhatsApp Access Request');

    const message = encodeURIComponent(
      `Olá! Acabei de comprar o ZAPMRO!\n\nNome: ${nome.trim()}\nEmail: ${email.trim()}`
    );
    
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-green-950/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Celebration Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative inline-block">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto animate-bounce" />
            <Sparkles className="w-8 h-8 text-emerald-400 absolute -top-2 -right-2 animate-pulse" />
            <Sparkles className="w-6 h-6 text-emerald-400 absolute -bottom-1 -left-2 animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent animate-pulse">
            OBRIGADO!
          </h1>
          
          <div className="space-y-2">
            <p className="text-xl font-semibold text-white">
              Parabéns por fazer parte do ZAPMRO!
            </p>
            <p className="text-gray-400">
              Você acaba de adquirir a ferramenta definitiva para revolucionar seu atendimento no WhatsApp.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-green-500/30 bg-gray-900/80 backdrop-blur-sm shadow-xl shadow-green-500/10">
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-white">
                Para receber seu acesso
              </h2>
              <p className="text-sm text-gray-400">
                Digite seus dados abaixo e clique em "Receber Acesso"
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-gray-300">Nome Completo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu melhor e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Receber Acesso
              </Button>
            </form>

            <p className="text-xs text-center text-gray-500">
              Ao clicar, você será direcionado ao WhatsApp para receber suas credenciais de acesso.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ZAPMRO - Mais Resultados Online
        </p>
      </div>
    </div>
  );
};

export default ObrigadoZapmro;
