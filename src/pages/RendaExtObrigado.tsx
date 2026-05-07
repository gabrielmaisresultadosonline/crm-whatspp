import { useEffect } from "react";
import { CheckCircle2, Mail, ExternalLink, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMro from "@/assets/logo-mro-white.png";
import { trackFacebookEvent, trackPageView, trackPurchase } from "@/lib/facebookTracking";

const RendaExtObrigado = () => {
  useEffect(() => {
    const email = localStorage.getItem("mro_customer_email") || undefined;
    
    trackPageView("Renda Extra - Obrigado");
    trackPurchase(19.90, "Renda Extra - Aula", email);
    
    // Cleanup email from localStorage after tracking
    if (email) {
      setTimeout(() => localStorage.removeItem("mro_customer_email"), 5000);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] relative overflow-hidden flex flex-col items-center p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="max-w-2xl w-full text-center space-y-8 py-12 md:py-20 relative z-10 animate-fade-in">
        <div className="flex justify-center mb-4">
          <img src={logoMro} alt="MRO" className="h-16 md:h-20" />
        </div>

        <div className="bg-gradient-to-br from-[#1a1f35] to-[#0a0f1a] border border-green-500/20 p-8 md:p-12 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl shadow-green-500/5">
          <div className="relative inline-block mb-6">
            <CheckCircle2 className="w-20 h-20 text-green-400 relative z-10" />
            <div className="absolute inset-0 bg-green-400 blur-2xl opacity-20 animate-pulse" />
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
            Pagamento Aprovado!
          </h1>
          
          <div className="space-y-4 text-gray-300 text-lg mb-8">
            <p className="flex items-center justify-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <span>O acesso foi enviado para o seu <strong>e-mail</strong> cadastrado.</span>
            </p>
            <p className="text-sm text-gray-400 bg-white/5 p-4 rounded-xl border border-white/10">
              Procure pelo assunto: <br />
              <span className="text-yellow-400 font-bold">"✅ Aula Liberada! Parabéns pelo interesse"</span>
            </p>
            <p className="text-sm text-gray-400 italic">
              *Verifique também sua caixa de SPAM ou Promoções.
            </p>
          </div>

          <div className="grid gap-4">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-8 rounded-2xl text-xl flex items-center justify-center gap-3 transition-transform hover:scale-105"
              onClick={() => window.location.href = "/descontoalunosrendaextrass"}
            >
              <ArrowRight className="w-6 h-6" />
              ACESSAR AULA AGORA
            </Button>
            
            <a 
              href="https://maisresultadosonline.com.br/whatsapp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white flex items-center justify-center gap-2 text-sm transition-colors"
            >
              Precisa de ajuda? Fale com o suporte no WhatsApp
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-5 py-2.5 rounded-full backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-xs md:text-sm font-bold uppercase tracking-widest">Seja muito bem-vindo à MRO!</span>
        </div>
      </div>
    </div>
  );
};

export default RendaExtObrigado;
