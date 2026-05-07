import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { Search, Instagram, Sparkles, Zap, Target, TrendingUp } from 'lucide-react';

interface ProfileSearchProps {
  onSearch: (username: string) => void;
  isLoading: boolean;
}

export const ProfileSearch = ({ onSearch, isLoading }: ProfileSearchProps) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSearch(username.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-mro-green/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-mro-cyan/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-8">
        {/* Logo */}
        <div className="animate-float mb-8">
          <Logo size="xl" className="mx-auto" />
        </div>

        {/* Title */}
        <div className="space-y-4 animate-slide-up">
          <h1 className="text-4xl md:text-6xl font-display font-bold">
            <span className="text-gradient">I.A MRO</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Inteligência Artificial para Crescimento Orgânico
          </p>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-lg max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Analise seu perfil do Instagram, receba estratégias personalizadas e 
          gere criativos de alta conversão com apenas um clique.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="glass-card glow-border p-2 flex gap-2">
            <div className="relative flex-1">
              <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="@seuperfil ou link do Instagram"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-12 h-14 text-lg border-0 bg-transparent focus:ring-0"
              />
            </div>
            <Button 
              type="submit" 
              variant="gradient" 
              size="xl"
              disabled={isLoading || !username.trim()}
              className="min-w-[160px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analisando...
                </div>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analisar
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <FeatureCard 
            icon={<Target className="w-6 h-6" />}
            title="Análise Completa"
            description="Perfil e conteúdo"
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6" />}
            title="Estratégia MRO"
            description="Crescimento orgânico"
          />
          <FeatureCard 
            icon={<Sparkles className="w-6 h-6" />}
            title="IA Generativa"
            description="Criativos prontos"
          />
          <FeatureCard 
            icon={<TrendingUp className="w-6 h-6" />}
            title="Scripts de Venda"
            description="Alta conversão"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="glass-card p-4 text-center group hover:border-primary/50 transition-all duration-300">
    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
      {icon}
    </div>
    <h3 className="font-semibold text-sm">{title}</h3>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);
