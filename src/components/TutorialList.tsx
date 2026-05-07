import { Button } from '@/components/ui/button';
import { X, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import { TutorialSection } from '@/hooks/useTutorial';

interface TutorialListProps {
  isOpen: boolean;
  sections: TutorialSection[];
  onClose: () => void;
  onStartInteractive: () => void;
  title?: string;
}

export const TutorialList = ({
  isOpen,
  sections,
  onClose,
  onStartInteractive,
  title = 'Tutorial Completo'
}: TutorialListProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-card rounded-2xl border border-border shadow-2xl animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">{title}</h2>
                <p className="text-sm text-muted-foreground">
                  Aprenda todas as funcionalidades do sistema
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Interactive tutorial button */}
          <Button
            variant="gradient"
            className="w-full mt-4"
            onClick={() => {
              onClose();
              setTimeout(onStartInteractive, 300);
            }}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Iniciar Tutorial Interativo
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div 
                key={section.id}
                className="glass-card p-5 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
              >
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{section.icon}</span>
                  <div>
                    <h3 className="font-display font-bold text-lg">
                      {sectionIndex + 1}. {section.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {section.steps.length} passo{section.steps.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Warning banner if exists */}
                {section.warning && (
                  <div className="mb-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-200">
                    <p className="text-xs">{section.warning}</p>
                  </div>
                )}

                {/* Steps */}
                <div className="space-y-3 ml-2">
                  {section.steps.map((step, stepIndex) => (
                    <div 
                      key={step.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground mb-1">
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer info */}
          <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <h4 className="font-semibold text-sm mb-1">Dica</h4>
                <p className="text-sm text-muted-foreground">
                  Use o <strong>Tutorial Interativo</strong> para ver cada elemento destacado na tela, 
                  ou leia esta lista para entender todas as funcionalidades de uma vez.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
