import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  CheckCircle2, 
  Instagram, 
  ArrowRight,
  Shield,
  Clock,
  Palette,
  BarChart3,
  Crown,
  LogIn,
  Loader2,
  User,
  Mail,
  Lock,
  AtSign
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

const benefits = [
  {
    icon: TrendingUp,
    title: "Aumente suas Vendas",
    description: "Estratégias comprovadas para converter seguidores em clientes pagantes"
  },
  {
    icon: Users,
    title: "Mais Leads Qualificados",
    description: "Atraia pessoas realmente interessadas no seu produto ou serviço"
  },
  {
    icon: Target,
    title: "Crescimento Orgânico",
    description: "Sem precisar gastar com anúncios - resultados 100% orgânicos"
  },
  {
    icon: Palette,
    title: "Criativos Profissionais",
    description: "6 criativos gerados por IA para seu feed e stories"
  },
  {
    icon: BarChart3,
    title: "Estratégia de 30 Dias",
    description: "Planejamento completo com calendário de conteúdo"
  },
  {
    icon: Instagram,
    title: "Bio Otimizada",
    description: "Sugestões para tornar seu perfil profissional de verdade"
  }
];

const features = [
  "Análise completa do seu perfil",
  "Estratégia personalizada de 30 dias",
  "6 criativos profissionais inclusos",
  "Calendário de postagens",
  "Otimização de bio do Instagram",
  "Suporte via WhatsApp"
];

export default function Vendas() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<'info' | 'register'>('info');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    instagram: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const canceled = searchParams.get('canceled');

  const handleStartRegistration = () => {
    setStep('register');
    
    // Scroll to form after state update
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    
    // Facebook Pixel - Initiate Checkout
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout');
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite seu nome completo",
        variant: "destructive"
      });
      return;
    }

    if (!formData.email.trim() || !validateEmail(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Normalize Instagram username
      let instagramUsername = formData.instagram.trim();
      if (instagramUsername) {
        instagramUsername = instagramUsername
          .replace(/^@/, '')
          .replace(/https?:\/\/(www\.)?instagram\.com\//, '')
          .replace(/\/$/, '')
          .toLowerCase();
      }

      // Use Edge Function to register user (bypasses RLS)
      const { data: response, error: fnError } = await supabase.functions.invoke('register-paid-user', {
        body: {
          email: formData.email.toLowerCase(),
          username: formData.username.trim(),
          password: formData.password,
          instagram_username: instagramUsername || null
        }
      });

      if (fnError) {
        console.error('Registration function error:', fnError);
        toast({
          title: "Erro ao cadastrar",
          description: "Não foi possível criar sua conta. Tente novamente.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (response.error) {
        console.error('Registration error:', response.error);
        toast({
          title: "Erro ao cadastrar",
          description: response.error,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const user = response.user;

      if (response.exists) {
        // User already exists - save session token (no password stored)
        localStorage.setItem('mro_paid_user_session', JSON.stringify({
          id: user.id,
          email: formData.email.toLowerCase(),
          username: formData.username.trim(),
          sessionToken: btoa(`${user.id}:${Date.now()}`),
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        }));
        
        toast({
          title: "Conta já existe",
          description: "Redirecionando para o login..."
        });
        
        navigate('/membro');
        return;
      }

      // New user created

      // Store session token with justRegistered flag for auto-login (no password stored)
      localStorage.setItem('mro_paid_user_session', JSON.stringify({
        id: user.id,
        email: formData.email.toLowerCase(),
        username: formData.username.trim(),
        instagram: instagramUsername,
        sessionToken: btoa(`${user.id}:${Date.now()}`),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        justRegistered: true
      }));
      
      // Facebook Pixel - Lead
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Cadastro I.A MRO',
          value: 0,
          currency: 'BRL'
        });
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Agora faça o pagamento para ativar seu acesso."
      });
      
      // Redirect to member area to complete payment
      navigate('/membro');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Erro ao processar",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openInstagram = () => {
    window.open('https://instagram.com/maisresultadosonline', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Logo size="lg" />
          <Button 
            variant="outline" 
            onClick={() => navigate('/membro')}
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            Acessar / Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <Sparkles className="w-3 h-3 mr-1" />
          Inteligência Artificial para seu Instagram
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-yellow-500 bg-clip-text text-transparent">
          Aumente suas Vendas, Leads e Seguidores
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
          <span className="text-foreground font-semibold">Sem precisar gastar com anúncios.</span> A I.A MRO cria estratégias 
          personalizadas e criativos profissionais para transformar seu Instagram em uma máquina de vendas.
        </p>

        <div className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-primary mb-8">
          <span className="text-muted-foreground text-lg line-through">R$ 197</span>
          <span>R$ 57</span>
          <span className="text-lg font-normal text-muted-foreground">/mês</span>
        </div>

        {canceled && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg max-w-md mx-auto">
            <p className="text-destructive">Pagamento cancelado. Você pode tentar novamente quando quiser.</p>
          </div>
        )}

        <Button 
          size="lg" 
          className="text-lg px-8 py-6 animate-pulse-glow"
          onClick={handleStartRegistration}
        >
          Quero Começar Agora
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* Registration Form - Always visible when step is register */}
      {step === 'register' && (
        <section ref={formRef} className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto glass-card border-primary/30 shadow-lg shadow-primary/10">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Crie sua Conta</CardTitle>
              <CardDescription className="text-base">
                Preencha seus dados para começar a usar a I.A MRO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Seu Nome *
                  </label>
                  <Input
                    placeholder="Digite seu nome completo"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="h-12 bg-background/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Seu Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12 bg-background/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Sua Senha *
                  </label>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12 bg-background/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <AtSign className="w-4 h-4 text-muted-foreground" />
                    Instagram (opcional agora)
                  </label>
                  <Input
                    placeholder="@seuinstagram ou link do perfil"
                    value={formData.instagram}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                    className="h-12 bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Você poderá adicionar após o pagamento
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    variant="gradient"
                    className="w-full text-lg py-6 h-14"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        Cadastrar Agora Mesmo
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Pagamento Seguro
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Acesso Imediato
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Benefits Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          O que a I.A MRO vai fazer pelo seu Instagram
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="glass-card border-primary/20 hover:border-primary/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{benefit.title}</CardTitle>
                <CardDescription className="text-base">{benefit.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-16 bg-primary/5 rounded-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Cadastre-se</h3>
            <p className="text-muted-foreground">Informe seu nome, email e Instagram</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Pague R$57</h3>
            <p className="text-muted-foreground">Via Pix ou cartão - acesso imediato</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Receba sua Estratégia</h3>
            <p className="text-muted-foreground">A I.A analisa seu perfil e gera tudo automaticamente</p>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">O que está incluso</h2>
          
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-4 glass-card rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-lg">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ferramenta MRO Promo */}
      <section className="container mx-auto px-4 py-16">
        <Card className="glass-card border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-primary/10 max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Crown className="w-12 h-12 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl">Quer resultados ainda maiores?</CardTitle>
            <CardDescription className="text-lg">
              Conheça a <span className="text-yellow-500 font-semibold">Ferramenta MRO</span> - 
              Automação completa de engajamento orgânico com 200 interações por dia!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Membros do plano mensal têm acesso a valor promocional exclusivo.
            </p>
            <Button variant="outline" onClick={openInstagram} className="gap-2">
              <Instagram className="w-4 h-4" />
              @maisresultadosonline
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Transforme seu Instagram hoje
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Por apenas R$57/mês, tenha acesso a estratégias profissionais e criativos 
          gerados por inteligência artificial.
        </p>
        
        {step === 'info' && (
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={handleStartRegistration}
          >
            Começar Agora por R$57/mês
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border/50">
        <div className="text-center text-muted-foreground text-sm">
          <p>© 2024 MRO - Mais Resultados Online. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
