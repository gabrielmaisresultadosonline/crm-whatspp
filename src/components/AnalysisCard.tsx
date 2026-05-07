import { ProfileAnalysis } from '@/types/instagram';
import { CheckCircle, AlertTriangle, Target, TrendingUp, Gauge } from 'lucide-react';

interface AnalysisCardProps {
  analysis: ProfileAnalysis;
}

export const AnalysisCard = ({ analysis }: AnalysisCardProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Scores */}
      <div className="glass-card glow-border p-4 sm:p-6 animate-slide-up">
        <h3 className="text-base sm:text-xl font-display font-bold mb-4 sm:mb-6 flex items-center gap-2">
          <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          Pontuação do Perfil
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <ScoreCircle score={analysis.profileScore} label="Perfil" color="primary" />
          <ScoreCircle score={analysis.contentScore} label="Conteúdo" color="cyan" />
          <ScoreCircle score={analysis.engagementScore} label="Engajamento" color="green" />
        </div>
      </div>

      {/* SWOT Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Strengths */}
        <div className="glass-card p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-base sm:text-lg font-display font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-primary">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Pontos Fortes
          </h3>
          <ul className="space-y-1.5 sm:space-y-2">
            {analysis.strengths.map((item, i) => (
              <li key={i} className="text-xs sm:text-sm text-foreground/90">{item}</li>
            ))}
            {analysis.strengths.length === 0 && (
              <li className="text-xs sm:text-sm text-muted-foreground">Nenhum ponto forte identificado ainda</li>
            )}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="glass-card p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-base sm:text-lg font-display font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            Pontos de Atenção
          </h3>
          <ul className="space-y-1.5 sm:space-y-2">
            {analysis.weaknesses.map((item, i) => (
              <li key={i} className="text-xs sm:text-sm text-foreground/90">{item}</li>
            ))}
            {analysis.weaknesses.length === 0 && (
              <li className="text-xs sm:text-sm text-muted-foreground">Perfil bem otimizado!</li>
            )}
          </ul>
        </div>
      </div>

      {/* Opportunities */}
      <div className="glass-card glow-border p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-base sm:text-lg font-display font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-mro-cyan" />
          Oportunidades de Crescimento
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {analysis.opportunities.map((item, i) => (
            <div key={i} className="p-2 sm:p-3 rounded-lg bg-secondary/50 text-xs sm:text-sm">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h3 className="text-base sm:text-lg font-display font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Recomendações Personalizadas
        </h3>
        <ul className="space-y-2 sm:space-y-3">
          {analysis.recommendations.map((item, i) => (
            <li key={i} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-xs sm:text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ScoreCircle = ({ score, label, color }: { score: number; label: string; color: string }) => {
  const colorClasses = {
    primary: 'from-primary to-mro-cyan',
    cyan: 'from-mro-cyan to-primary',
    green: 'from-mro-green to-mro-green-light',
  };

  return (
    <div className="text-center">
      <div className="relative w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-1 sm:mb-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-secondary"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="url(#gradient)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${score * 2.51} 251`}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={`${colorClasses[color as keyof typeof colorClasses]}`} style={{ stopColor: 'hsl(var(--primary))' }} />
              <stop offset="100%" className={`${colorClasses[color as keyof typeof colorClasses]}`} style={{ stopColor: 'hsl(var(--mro-cyan))' }} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg sm:text-2xl font-display font-bold">{score}</span>
        </div>
      </div>
      <p className="text-[10px] sm:text-sm text-muted-foreground">{label}</p>
    </div>
  );
};
