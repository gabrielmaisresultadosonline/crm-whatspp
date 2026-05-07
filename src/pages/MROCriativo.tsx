import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Instagram, 
  Zap, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Shield, 
  LayoutDashboard, 
  Calendar, 
  Image as ImageIcon, 
  Bot, 
  MessageSquare,
  Lock,
  ChevronDown,
  Play,
  Rocket,
  MousePointerClick,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trackPageView } from "@/lib/facebookTracking";
import { Logo } from "@/components/Logo";

const MROCriativo = () => {
  const [activeTab, setActiveTab] = useState("analise");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    trackPageView('MRO Criativo - Sales Page');
  }, []);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Conectando ao Facebook OAuth...");
      // Simulação de redirecionamento ou abertura de modal
    }, 1500);
  };

  const tabs = [
    { id: "analise", label: "Análise IA", icon: Target, content: "Leitura completa do seu perfil: biografia, engajamento, estilo visual e nicho." },
    { id: "estrategia", label: "Estratégia", icon: TrendingUp, content: "Geração de 3 pilares estratégicos: Autoridade, Vendas e Viralização." },
    { id: "criativos", label: "Criativos", icon: ImageIcon, content: "Criação automática de artes premium e realistas com IA de última geração." },
    { id: "agendamento", label: "Agendamento", icon: Calendar, content: "Calendário inteligente com postagens automáticas a cada 3 dias." },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-primary/30 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050508]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-bold text-lg tracking-tight hidden sm:block">MRO <span className="text-primary">CRIATIVO</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}>
              Preços
            </Button>
            <Button variant="gradient" size="sm" onClick={() => document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary-foreground">Sistema de IA para Gestão de Instagram</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black mb-6 leading-tight tracking-tight"
          >
            Seu Instagram no <br />
            <span className="text-gradient">Automático com IA</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Análise de perfil, estratégias de conteúdo, geração de criativos premium e agendamento automático. Tudo em um só lugar, sem precisar da sua senha.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button size="xl" variant="gradient" className="w-full sm:w-auto px-8 py-7 text-lg group" onClick={() => document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })}>
              CONECTAR INSTAGRAM
              <Instagram className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
            </Button>
            <Button size="xl" variant="outline" className="w-full sm:w-auto px-8 py-7 text-lg border-white/10 hover:bg-white/5" onClick={() => document.getElementById('funciona')?.scrollIntoView({ behavior: 'smooth' })}>
              VER COMO FUNCIONA
            </Button>
          </motion.div>

          {/* Device Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative mx-auto max-w-4xl"
          >
            <div className="glass-card p-2 rounded-2xl border-white/10 shadow-2xl overflow-hidden">
              <div className="bg-[#0a0a0f] rounded-xl overflow-hidden aspect-video relative">
                {/* Mockup do Dashboard */}
                <div className="absolute inset-0 flex">
                  {/* Sidebar Mockup */}
                  <div className="w-16 md:w-48 bg-black/40 border-r border-white/5 p-4 flex flex-col gap-4">
                    {[LayoutDashboard, Target, ImageIcon, Calendar].map((Icon, i) => (
                      <div key={i} className={`h-10 rounded-lg flex items-center gap-3 px-3 ${i === 0 ? 'bg-primary/20 text-primary' : 'text-gray-500'}`}>
                        <Icon className="w-5 h-5" />
                        <div className="hidden md:block h-2 w-20 bg-current/20 rounded-full" />
                      </div>
                    ))}
                  </div>
                  {/* Content Mockup */}
                  <div className="flex-1 p-6 text-left">
                    <div className="flex justify-between items-center mb-8">
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-white/10 rounded-full" />
                        <div className="h-2 w-48 bg-white/5 rounded-full" />
                      </div>
                      <div className="h-10 w-32 bg-primary rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-card p-4 space-y-4 border-white/5">
                          <div className="aspect-square bg-white/5 rounded-lg animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-3 w-full bg-white/10 rounded-full" />
                            <div className="h-3 w-2/3 bg-white/5 rounded-full" />
                          </div>
                          <div className="h-8 w-full border border-white/10 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Overlays */}
                <div className="absolute bottom-6 right-6 glass-card p-4 border-primary/30 flex items-center gap-3 animate-float">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status do Post</p>
                    <p className="text-sm font-bold">Agendado com Sucesso</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="funciona" className="py-24 px-4 bg-[#0a0a0f]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Gestão Completa com <span className="text-primary">IA</span></h2>
            <p className="text-gray-400">Automatize cada etapa do seu crescimento no Instagram</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Target, title: "Análise IA", desc: "Leitura técnica do perfil para identificar pontos de melhoria na bio e CTA." },
              { icon: Bot, title: "Estratégia", desc: "Planos de conteúdo personalizados baseados em seu nicho e concorrência." },
              { icon: ImageIcon, title: "Criativos", desc: "Geração automática de artes premium com design profissional." },
              { icon: Calendar, title: "Agendamento", iconColor: "text-blue-400", titleColor: "text-white", desc: "Postagens automáticas e calendário de conteúdo inteligente." }
            ].map((f, i) => (
              <div key={i} className="glass-card p-6 group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className={`w-6 h-6 text-primary`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Tabs Section */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl md:text-5xl font-black">O Fluxo da <span className="text-gradient">Sua Vitória</span></h2>
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-6 rounded-2xl transition-all border ${activeTab === tab.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-white/5 border-transparent'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'}`}>
                        <tab.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>{tab.label}</h4>
                        {activeTab === tab.id && <p className="text-sm text-gray-300 mt-2">{tab.content}</p>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="aspect-square glass-card p-4 border-white/10 relative overflow-hidden group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="w-full h-full flex flex-col items-center justify-center text-center p-8"
                  >
                    {activeTab === 'analise' && (
                      <div className="space-y-6">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <Instagram className="w-12 h-12 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold">Lendo Perfil...</h3>
                        <div className="space-y-2 max-w-xs">
                          <div className="h-2 w-full bg-primary/30 rounded-full" />
                          <div className="h-2 w-2/3 bg-white/10 rounded-full mx-auto" />
                          <div className="h-2 w-4/5 bg-white/10 rounded-full mx-auto" />
                        </div>
                      </div>
                    )}
                    {activeTab === 'estrategia' && (
                      <div className="space-y-4 w-full">
                        <h3 className="text-xl font-bold text-primary mb-4">3 Pilares Gerados</h3>
                        <div className="space-y-3">
                          {['Autoridade', 'Engajamento', 'Venda'].map((p) => (
                            <div key={p} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                              <span className="font-medium">{p}</span>
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeTab === 'criativos' && (
                      <div className="grid grid-cols-2 gap-4 w-full h-full">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                              <div className="h-1.5 w-full bg-white/20 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === 'agendamento' && (
                      <div className="p-6 bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-xl w-full max-w-sm">
                        <div className="flex justify-between items-center mb-6">
                          <p className="font-bold">Calendário de Posts</p>
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {Array.from({ length: 31 }).map((_, i) => (
                            <div key={i} className={`aspect-square rounded flex items-center justify-center text-[10px] ${[1, 4, 7, 10, 13].includes(i) ? 'bg-primary text-white' : 'bg-white/5 text-gray-600'}`}>
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Connect Form Section */}
      <section id="login" className="py-24 px-4 bg-gradient-to-b from-black to-[#050508]">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 md:p-12 border-primary/20 shadow-2xl shadow-primary/5 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-6">Comece sua Automação <span className="text-gradient">Hoje</span></h2>
              <p className="text-gray-400 mb-10 max-w-xl mx-auto">Conecte sua conta via OAuth oficial da Meta. Sem senhas, 100% seguro e oficial.</p>
              
              <form onSubmit={handleConnect} className="max-w-md mx-auto space-y-4">
                <Button size="xl" variant="gradient" className="w-full py-8 text-xl font-black shadow-xl shadow-primary/20 group">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Bot className="w-6 h-6 animate-spin" />
                      CONECTANDO...
                    </div>
                  ) : (
                    <>
                      ENTRAR COM FACEBOOK
                      <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                  <Shield className="w-3 h-3" />
                  Conexão segura via Facebook Login API
                </p>
              </form>

              {/* Developer Note */}
              <div className="mt-12 p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-500 flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-400 mb-1">Aviso de Desenvolvedor (Modo MVP)</p>
                  <p>Como estamos em modo de desenvolvimento oficial, novos usuários devem ser adicionados como 'Testers' no Meta App Center para garantir o acesso total.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Plan Section */}
      <section id="precos" className="py-24 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Planos <span className="text-primary">MRO Criativo</span></h2>
          <p className="text-gray-400 mb-16">Escolha o plano ideal para a escala do seu negócio</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mensal */}
            <div className="glass-card p-8 border-white/10 hover:border-primary/20 transition-all text-left">
              <h3 className="text-xl font-bold mb-2">Plano Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black">R$ 197</span>
                <span className="text-gray-500 text-sm">/mês</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Análise completa de 1 perfil",
                  "Geração de 3 estratégias/mês",
                  "30 criativos automáticos/mês",
                  "Agendamento via Meta Suite",
                  "Suporte via Email"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full py-6 border-white/10 hover:bg-white/5">Selecionar Starter</Button>
            </div>

            {/* Premium */}
            <div className="glass-card p-8 border-primary/50 bg-primary/5 text-left relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">Mais Vendido</div>
              <h3 className="text-xl font-bold mb-2 text-primary">Plano Scale</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black">R$ 497</span>
                <span className="text-gray-500 text-sm">/mês</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Análise completa de 5 perfis",
                  "Estratégias ilimitadas",
                  "100 criativos automáticos/mês",
                  "IA de análise de concorrência",
                  "Suporte VIP WhatsApp",
                  "Agendamento automático direto"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="gradient" className="w-full py-6 shadow-xl shadow-primary/20">Selecionar Scale</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-bold">MRO <span className="text-primary">CRIATIVO</span></span>
          </div>
          <p className="text-sm text-gray-500">© 2026 MRO Criativo. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Termos</a>
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MROCriativo;
