import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, HelpCircle } from 'lucide-react';
import { TutorialStep } from '@/hooks/useTutorial';

interface TutorialOverlayProps {
  isActive: boolean;
  currentStep: TutorialStep | null;
  currentStepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
}

export const TutorialOverlay = ({
  isActive,
  currentStep,
  currentStepNumber,
  totalSteps,
  onNext,
  onPrev,
  onStop
}: TutorialOverlayProps) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const target = document.querySelector(currentStep.targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        
        // Calculate tooltip position
        const padding = 16;
        const tooltipWidth = 320;
        const tooltipHeight = 150;
        
        let top = 0;
        let left = 0;
        
        switch (currentStep.position || 'bottom') {
          case 'top':
            top = rect.top - tooltipHeight - padding;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'bottom':
            top = rect.bottom + padding;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - padding;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + padding;
            break;
        }
        
        // Keep tooltip within viewport
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
        top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
        
        setTooltipStyle({
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          width: `${tooltipWidth}px`,
          zIndex: 10002
        });
        
        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Retry after a short delay if element not found
        setTimeout(findTarget, 100);
      }
    };

    findTarget();
    
    // Update on resize
    window.addEventListener('resize', findTarget);
    return () => window.removeEventListener('resize', findTarget);
  }, [isActive, currentStep]);

  if (!isActive || !currentStep) return null;

  return (
    <>
      {/* Dark overlay - NO blur, just dark background */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 z-[9999] pointer-events-auto"
        style={{
          background: 'rgba(0, 0, 0, 0.8)'
        }}
        onClick={onStop}
      />

      {/* Highlight cutout - creates a "hole" effect around the target */}
      {targetRect && (
        <>
          {/* Visible element highlight with glow */}
          <div
            className="fixed z-[10000] pointer-events-none rounded-xl"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              border: '3px solid hsl(var(--primary))',
              boxShadow: '0 0 30px 10px hsla(var(--primary), 0.4), inset 0 0 0 2000px rgba(0,0,0,0)',
              animation: 'tutorial-pulse 2s ease-in-out infinite'
            }}
          />
          {/* Clear area behind target (remove dark overlay from target area) */}
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              borderRadius: '12px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)'
            }}
          />
        </>
      )}

      {/* Tooltip - completely separate from overlay, no blur effect */}
      <div
        className="fixed z-[10003] pointer-events-auto animate-fade-in"
        style={tooltipStyle}
      >
        <div className="bg-card p-4 rounded-xl shadow-2xl border-2 border-primary/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                Passo {currentStepNumber} de {totalSteps}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onStop}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <h4 className="font-display font-bold text-lg mb-2 text-primary">
            {currentStep.title}
          </h4>
          <p className="text-sm text-foreground/90 leading-relaxed mb-4">
            {currentStep.description}
          </p>

          {/* Progress bar */}
          <div className="w-full h-1 bg-secondary rounded-full mb-4 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={currentStepNumber === 1}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            
            {currentStepNumber < totalSteps ? (
              <Button
                variant="gradient"
                size="sm"
                onClick={onNext}
                className="flex-1"
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="sm"
                onClick={onStop}
                className="flex-1"
              >
                Concluir ✓
              </Button>
            )}
          </div>

          {/* Skip button */}
          <button
            onClick={onStop}
            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular tutorial
          </button>
        </div>

        {/* Arrow indicator */}
        <div 
          className="absolute w-4 h-4 bg-card border-2 border-primary/50 rotate-45 -z-10"
          style={{
            top: currentStep.position === 'bottom' ? '-10px' : 'auto',
            bottom: currentStep.position === 'top' ? '-10px' : 'auto',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)'
          }}
        />
      </div>

      <style>{`
        @keyframes tutorial-pulse {
          0%, 100% { 
            box-shadow: 0 0 20px 5px hsla(var(--primary), 0.3);
          }
          50% { 
            box-shadow: 0 0 40px 15px hsla(var(--primary), 0.5);
          }
        }
      `}</style>
    </>
  );
};
