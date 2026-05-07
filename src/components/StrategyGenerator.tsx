import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Strategy, InstagramProfile, ProfileAnalysis, StrategyType } from '@/types/instagram';
import { Sparkles, Loader2, Zap, MessageSquare, Calendar, Users, User, Clock, AlertCircle, Check } from 'lucide-react';
import { generateStrategy } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { canGenerateStrategy, getStrategyDaysRemaining } from '@/lib/storage';

interface StrategyGeneratorProps {
  profile: InstagramProfile;
  analysis: ProfileAnalysis;
  onStrategyGenerated: (strategy: Strategy) => void;
  existingStrategies: Strategy[];
  profileId?: string;
}

export const StrategyGenerator = ({ profile, analysis, onStrategyGenerated, existingStrategies, profileId }: StrategyGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<StrategyType>('mro');
  const { toast } = useToast();

  const strategyTypes: { id: StrategyType; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'mro', label: 'Estratégia MRO', icon: <Zap className="w-5 h-5" />, description: 'Interações orgânicas em massa' },
    { id: 'content', label: 'Conteúdo', icon: <Calendar className="w-5 h-5" />, description: 'Calendário de publicações' },
    { id: 'engagement', label: 'Engajamento', icon: <Users className="w-5 h-5" />, description: 'Stories e interação' },
    { id: 'sales', label: 'Vendas', icon: <MessageSquare className="w-5 h-5" />, description: 'Scripts e abordagem' },
    { id: 'bio', label: 'Bio Instagram', icon: <User className="w-5 h-5" />, description: 'Otimização de bio' },
  ];

  // Check availability for each type
  const getTypeAvailability = (type: StrategyType) => {
    const canGenerate = canGenerateStrategy(profileId, type);
    const daysRemaining = getStrategyDaysRemaining(profileId, type);
    return { canGenerate, daysRemaining };
  };

  // Get availability for selected type
  const selectedAvailability = getTypeAvailability(selectedType);
  
  // Check if any type is available
  const anyTypeAvailable = strategyTypes.some(t => canGenerateStrategy(profileId, t.id));

  const handleGenerateStrategy = async () => {
    if (!selectedAvailability.canGenerate) {
      toast({
        title: "Limite atingido para esta estratégia",
        description: `Você poderá gerar nova ${strategyTypes.find(t => t.id === selectedType)?.label} em ${selectedAvailability.daysRemaining} dias`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    toast({
      title: "Gerando estratégia com IA...",
      description: `Criando ${strategyTypes.find(t => t.id === selectedType)?.label}`,
    });

    try {
      const result = await generateStrategy(profile, analysis, selectedType);

      if (result.success && result.strategy) {
        onStrategyGenerated(result.strategy);
        toast({
          title: "Estratégia gerada! 🎯",
          description: result.strategy.title,
        });
      } else {
        toast({
          title: "Erro ao gerar estratégia",
          description: result.error || "Tente novamente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a estratégia",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-card glow-border p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Gerar Nova Estratégia com IA
        </h3>
        
        {/* Selected type availability indicator */}
        {!selectedAvailability.canGenerate && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/20 text-warning border border-warning/30">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{selectedAvailability.daysRemaining} dias para próxima</span>
          </div>
        )}
        
        {selectedAvailability.canGenerate && existingStrategies.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/20 text-success border border-success/30">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Disponível para gerar</span>
          </div>
        )}
      </div>

      {/* Info about per-type limits */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">Limite por tipo de estratégia</p>
            <p className="text-sm text-muted-foreground">
              Você pode gerar <strong>1 estratégia por tipo a cada 30 dias</strong>. 
              Cada tipo tem seu próprio limite independente.
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Type Selection with individual availability */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {strategyTypes.map((type) => {
          const availability = getTypeAvailability(type.id);
          return (
            <button
              type="button"
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-4 rounded-lg border transition-all duration-300 text-left cursor-pointer relative ${
                selectedType === type.id 
                  ? 'border-primary bg-primary/10' 
                  : availability.canGenerate 
                    ? 'border-border hover:border-primary/50'
                    : 'border-border/50 bg-muted/20'
              }`}
            >
              {/* Availability badge */}
              <div className="absolute top-2 right-2">
                {availability.canGenerate ? (
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                ) : (
                  <div className="px-1.5 py-0.5 rounded bg-warning/20 text-warning text-[10px] font-medium">
                    {availability.daysRemaining}d
                  </div>
                )}
              </div>
              
              <div className={`mb-2 ${
                selectedType === type.id 
                  ? 'text-primary' 
                  : availability.canGenerate 
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
              }`}>
                {type.icon}
              </div>
              <p className={`font-semibold text-sm ${!availability.canGenerate && selectedType !== type.id ? 'text-muted-foreground/70' : ''}`}>
                {type.label}
              </p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </button>
          );
        })}
      </div>

      <Button 
        type="button"
        onClick={handleGenerateStrategy} 
        disabled={isGenerating || !selectedAvailability.canGenerate}
        variant="gradient"
        size="lg"
        className="w-full cursor-pointer"
      >
        {isGenerating ? (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando com IA...
            </div>
            <span className="text-xs text-muted-foreground">Média de tempo: 1 a 3 min</span>
          </div>
        ) : !selectedAvailability.canGenerate ? (
          <>
            <Clock className="w-5 h-5" />
            Disponível em {selectedAvailability.daysRemaining} dias
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Gerar Estratégia {strategyTypes.find(t => t.id === selectedType)?.label}
          </>
        )}
      </Button>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        Usando I.A da MRO - Mais Resultados Online para gerar estratégia personalizada para o nicho: {analysis.niche}
      </p>
    </div>
  );
};
