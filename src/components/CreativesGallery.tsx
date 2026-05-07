import { useState } from 'react';
import { Creative } from '@/types/instagram';
import { Download, Image as ImageIcon, Clock, AlertCircle, X, Maximize2, Lock, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/userStorage';
import { isLifetimeAccess, canUseCreatives } from '@/types/user';

interface CreativesGalleryProps {
  creatives: Creative[];
  creativesRemaining: number;
  onUpdate?: () => void;
  isVitalicioBlocked?: boolean;
  onShowVitalicioOffer?: () => void;
}

export const CreativesGallery = ({ creatives, creativesRemaining, onUpdate, isVitalicioBlocked, onShowVitalicioOffer }: CreativesGalleryProps) => {
  const { toast } = useToast();
  const [previewCreative, setPreviewCreative] = useState<Creative | null>(null);
  
  // Check if user is lifetime and needs to show special message
  const user = getCurrentUser();
  const isLifetime = user ? isLifetimeAccess(user.daysRemaining) : false;
  const creativesAccess = canUseCreatives(user);
  const showLifetimeBlockedMessage = isLifetime && !creativesAccess.allowed;
  const downloadCreative = async (creative: Creative, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    try {
      // Try to download the image properly
      const response = await fetch(creative.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `criativo-${creative.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download concluído! ✅",
        description: "Criativo salvo na sua pasta de downloads",
      });
    } catch (error) {
      // Fallback: open in new tab
      window.open(creative.imageUrl, '_blank');
      toast({
        title: "Imagem aberta em nova aba",
        description: "Clique com botão direito para salvar",
      });
    }
  };

  const openPreview = (creative: Creative) => {
    setPreviewCreative(creative);
  };

  const closePreview = () => {
    setPreviewCreative(null);
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (expiresAt: string) => {
    const days = getDaysRemaining(expiresAt);
    if (days <= 0) return { text: 'Expirado', color: 'text-destructive', urgent: true };
    if (days <= 7) return { text: `${days}d restantes`, color: 'text-warning', urgent: true };
    return { text: `${days}d restantes`, color: 'text-muted-foreground', urgent: false };
  };

  if (creatives.length === 0) {
    return (
      <div className="glass-card p-8 text-center animate-slide-up">
        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-display font-semibold mb-2">Nenhum criativo ainda</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Gere sua primeira estratégia e depois crie criativos personalizados.
        </p>
        {showLifetimeBlockedMessage ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-500">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Libere acesso full - Fale com admin</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary">
            <span className="text-2xl font-bold">{creativesRemaining}</span>
            <span className="text-sm">criativos disponíveis</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-bold">Seus Criativos</h3>
          {showLifetimeBlockedMessage ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-500 text-sm">
              <Lock className="w-3 h-3" />
              <span>Acesso bloqueado</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary">
              <span className="font-bold">{creativesRemaining}</span>
              <span className="text-sm">restantes</span>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="p-3 rounded-lg bg-secondary/50 border border-border text-sm text-muted-foreground flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Criativos ficam disponíveis por <strong>30 dias</strong> após criação. 
            Você pode baixar <strong>quantas vezes quiser</strong> enquanto disponível.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {creatives.map((creative) => {
            const expStatus = creative.expiresAt 
              ? getExpirationStatus(creative.expiresAt) 
              : { text: 'Sem expiração', color: 'text-muted-foreground', urgent: false };

            return (
              <div 
                key={creative.id} 
                className="glass-card overflow-hidden group relative cursor-pointer"
                onClick={() => openPreview(creative)}
              >
                {/* Status badges */}
                <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-start">
                  
                  <span className={`px-2 py-1 rounded-full bg-background/80 text-xs flex items-center gap-1 backdrop-blur-sm ${expStatus.color}`}>
                    {expStatus.urgent && <AlertCircle className="w-3 h-3" />}
                    <Clock className="w-3 h-3" />
                    {expStatus.text}
                  </span>
                </div>

                {/* Logo overlay - CENTERED at top */}
                {creative.logoUrl && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10">
                    <img 
                      src={creative.logoUrl} 
                      alt="Logo" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                    />
                  </div>
                )}

                <div className="aspect-square relative">
                  <img 
                    src={creative.imageUrl} 
                    alt="Criativo"
                    className="w-full h-full object-cover"
                  />
                  {/* Text Overlay - only if has headline */}
                  {creative.headline && (
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex flex-col items-center justify-end p-4">
                      <p className="text-sm font-semibold text-center mb-2">{creative.headline}</p>
                      {creative.ctaText && (
                        <span 
                          className="px-3 py-1 rounded-full text-xs"
                          style={{ 
                            backgroundColor: creative.colors?.primary || 'hsl(var(--primary))', 
                            color: creative.colors?.text || 'hsl(var(--primary-foreground))' 
                          }}
                        >
                          {creative.ctaText}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(creative);
                      }}
                      className="p-3 rounded-full bg-secondary text-secondary-foreground hover:scale-110 transition-transform"
                      title="Ver em tela cheia"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => downloadCreative(creative, e)}
                      className="p-3 rounded-full bg-primary text-primary-foreground hover:scale-110 transition-transform"
                      title="Baixar criativo"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Date */}
                <div className="p-2 text-xs text-muted-foreground text-center">
                  Criado em {new Date(creative.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {previewCreative && (
        <div 
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div 
            className="relative max-w-2xl w-full max-h-[90vh] animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closePreview}
              className="absolute -top-12 right-0 p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image container */}
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              {/* Logo overlay in preview */}
              {previewCreative.logoUrl && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                  <img 
                    src={previewCreative.logoUrl} 
                    alt="Logo" 
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>
              )}

              <img 
                src={previewCreative.imageUrl} 
                alt="Criativo em tela cheia"
                className="w-full h-auto max-h-[70vh] object-contain"
              />

              {/* Text overlay in preview - only if has headline */}
              {previewCreative.headline && (
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex flex-col items-center justify-end p-8">
                  <p className="text-xl font-bold text-center mb-3">{previewCreative.headline}</p>
                  {previewCreative.ctaText && (
                    <span 
                      className="px-6 py-2 rounded-full text-sm font-semibold"
                      style={{ 
                        backgroundColor: previewCreative.colors?.primary || 'hsl(var(--primary))', 
                        color: previewCreative.colors?.text || 'hsl(var(--primary-foreground))' 
                      }}
                    >
                      {previewCreative.ctaText}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={closePreview}
              >
                Fechar
              </Button>
              <Button
                onClick={(e) => downloadCreative(previewCreative, e)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar Criativo
              </Button>
            </div>

            {/* Info */}
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Criado em {new Date(previewCreative.createdAt).toLocaleDateString('pt-BR')}
              {previewCreative.expiresAt && (
                <span className="ml-2">
                  • Expira em {new Date(previewCreative.expiresAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
