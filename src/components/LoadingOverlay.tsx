import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
  progress?: {
    current: number;
    total: number;
  };
}

export const LoadingOverlay = ({ 
  isVisible, 
  message = "Aguarde por favor...", 
  subMessage = "Buscando dados do Instagram. Isso pode levar até 5 minutos.",
  progress
}: LoadingOverlayProps) => {
  if (!isVisible) return null;

  const progressPercentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8 max-w-md text-center">
        {/* Large animated loader */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-primary/20 animate-pulse" />
          <Loader2 className="w-24 h-24 text-primary animate-spin absolute inset-0" />
        </div>

        {/* Animated dots */}
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Messages */}
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-foreground">
            {message}
          </h2>
          <p className="text-muted-foreground text-sm">
            {subMessage}
          </p>
        </div>

        {/* Progress counter */}
        {progress && progress.total > 0 && (
          <div className="space-y-3 w-full max-w-xs">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-primary font-semibold">
                {progress.current} de {progress.total} conta{progress.total !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {progressPercentage}% concluído
            </p>
          </div>
        )}

        {/* Standard progress indicator when no progress data */}
        {!progress && (
          <div className="w-full max-w-xs bg-secondary rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full animate-pulse"
              style={{ 
                width: '100%',
                animation: 'loading-progress 3s ease-in-out infinite'
              }}
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground/60">
          Não feche esta janela
        </p>
      </div>

      <style>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
