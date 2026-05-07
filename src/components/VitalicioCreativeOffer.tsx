import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, ExternalLink, MessageCircle, Crown } from 'lucide-react';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { getCurrentUser } from '@/lib/userStorage';

interface VitalicioCreativeOfferProps {
  username: string;
  onClose: () => void;
}

export const VitalicioCreativeOffer = ({ username, onClose }: VitalicioCreativeOfferProps) => {
  const { whatsappNumber } = useWhatsAppConfig();
  const [canUnlock, setCanUnlock] = useState(false);
  const [countdown, setCountdown] = useState(8);

  // 8-second countdown for unlock button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanUnlock(true);
    }
  }, [countdown]);

  const handleBuy = () => {
    window.open('https://invoice.infinitepay.io/plans/paguemro/6s8H02IkcJ', '_blank');
  };

  const handleUnlockAccess = () => {
    const message = encodeURIComponent(
      `Olá! Acabei de comprar o plano PRO de criativos!\n\nUsuário: ${username}`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
      <div className="glass-card glow-border p-6 md:p-8 max-w-lg w-full animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Usuário Vitalício
          </h2>
          <p className="text-muted-foreground mt-2">
            Você gerou seu criativo gratuito do mês
          </p>
        </div>

        {/* Offer Box */}
        <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl p-6 border border-primary/30 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary">Oferta Exclusiva</span>
          </div>
          
          <h3 className="text-xl font-bold mb-2">
            3 MESES de Criativos Liberados
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4">
            Tenha acesso ilimitado ao gerador de criativos com I.A por 3 meses completos!
          </p>
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-primary">R$97</span>
            <span className="text-muted-foreground line-through">R$297</span>
          </div>
          
          <p className="text-xs text-success font-medium">
            ✓ Economize R$200 nesta oferta especial
          </p>
        </div>

        {/* What's included */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-success text-xs">✓</span>
            </div>
            <span>Criativos ilimitados por 3 meses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-success text-xs">✓</span>
            </div>
            <span>Criativos das estratégias desbloqueados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-success text-xs">✓</span>
            </div>
            <span>Criativos manuais com prompt personalizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-success text-xs">✓</span>
            </div>
            <span>Suporte prioritário via WhatsApp</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleBuy}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold py-6 text-lg shadow-lg shadow-primary/30"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Comprar Agora - R$97
          </Button>
          
          <Button 
            onClick={handleUnlockAccess}
            disabled={!canUnlock}
            variant="outline"
            className={`w-full py-6 text-lg transition-all duration-300 ${
              canUnlock 
                ? 'border-success text-success hover:bg-success/10' 
                : 'border-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {canUnlock ? (
              <>
                <MessageCircle className="w-5 h-5 mr-2" />
                Fez o pagamento? Liberar Acesso
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Liberar Acesso ({countdown}s)
              </>
            )}
          </Button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};