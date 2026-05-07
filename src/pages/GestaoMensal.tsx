import { useState, useEffect } from "react";
import { 
  Target, 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Users, 
  ShoppingCart, 
  MapPin, 
  Star, 
  Briefcase, 
  BookOpen, 
  Building, 
  Building2,
  Megaphone,
  LineChart,
  Palette,
  Globe,
  MessageSquare,
  Zap,
  PieChart,
  ArrowRight,
  CheckCircle,
  Shield,
  ChevronDown,
  Instagram,
  Calculator,
  Video,
  Image,
  Sparkles,
  X,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import logoMro from "@/assets/logo-mro.png";
import gestaoBg1 from "@/assets/gestao-bg-1.jpg";
import gestaoBg2 from "@/assets/gestao-bg-2.jpg";
import { useWhatsAppConfig } from "@/hooks/useWhatsAppConfig";

const GestaoMensal = () => {
  const { whatsappNumber } = useWhatsAppConfig();
  const [instagram, setInstagram] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [perspectiva, setPerspectiva] = useState("");
  const [investimento, setInvestimento] = useState(500);
  const [showForm, setShowForm] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const custoPorLead = 3.80;
  const leadsEstimados = Math.floor(investimento / custoPorLead);

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleWhatsApp = () => {
    const message = `*NOVO CADASTRO - GESTÃO MENSAL MRO*\n\n*Nome:* ${nome}\n*Email:* ${email}\n*Instagram:* @${instagram}\n*Perspectiva/Expectativa:* ${perspectiva}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const scrollToMethodology = () => {
    document.getElementById("methodology")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  // Formulário em tela cheia
  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white relative overflow-hidden">
        {/* Background com Parallax */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ 
            backgroundImage: `url(${gestaoBg2})`,
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-gray-900/80 to-black" />
        
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <Button
            onClick={() => setShowForm(false)}
            variant="ghost"
            className="absolute top-6 left-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          
          <div className="w-full max-w-lg animate-fade-in">
            <div className="text-center mb-8">
              <img src={logoMro} alt="MRO" className="h-14 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                VAMOS COMEÇAR!
              </h2>
              <p className="text-gray-400">Preencha os dados abaixo para iniciar</p>
            </div>
            
            <div className="bg-gray-900/80 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-8 shadow-2xl shadow-yellow-500/10">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-300 mb-2 font-medium">
                    Seu nome completo *
                  </label>
                  <Input
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 h-14 text-lg focus:border-yellow-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2 font-medium">
                    Seu melhor e-mail *
                  </label>
                  <Input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 h-14 text-lg focus:border-yellow-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2 font-medium">
                    Instagram da empresa *
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="suaempresa"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value.replace("@", ""))}
                      className="pl-12 bg-gray-800/50 border-gray-700 h-14 text-lg focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2 font-medium">
                    O que espera de nós? *
                  </label>
                  <Textarea
                    placeholder="Descreva suas expectativas e objetivos..."
                    value={perspectiva}
                    onChange={(e) => setPerspectiva(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 min-h-[140px] resize-none text-lg focus:border-yellow-500 transition-colors"
                  />
                </div>
                
                <Button
                  onClick={handleWhatsApp}
                  disabled={!nome || !email || !instagram || !perspectiva}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold py-7 text-xl rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/25 transition-all hover:scale-[1.02]"
                >
                  <MessageSquare className="w-6 h-6 mr-3" />
                  Cadastrar e Conversar
                </Button>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  Você será redirecionado para o WhatsApp da MRO
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
              <span>✓ Atendimento rápido</span>
              <span>✓ Sem compromisso</span>
              <span>✓ 100% gratuito</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Hero Section com Parallax */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-16 sm:py-20 overflow-hidden">
        {/* Background Image with Parallax */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${gestaoBg1})`,
            transform: `translateY(${scrollY * 0.5}px) scale(1.2)`,
            opacity: 0.5
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-gray-900/70 to-black" />
        
        <div className="relative z-10 text-center max-w-5xl mx-auto w-full">
          <img src={logoMro} alt="MRO Logo" className="h-12 sm:h-16 md:h-20 mx-auto mb-4 sm:mb-6 animate-fade-in" />
          
          <p className="text-yellow-400 font-semibold tracking-widest text-xs sm:text-sm md:text-base mb-3 sm:mb-4 animate-fade-in px-2">
            MAIS RESULTADOS ONLINE
          </p>
          
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight animate-fade-in px-2">
            Transforme sua empresa em uma{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">
              máquina de aquisição
            </span>{" "}
            e retenção de clientes
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto animate-fade-in px-2">
            com estratégia, dados e otimização contínua.
          </p>
          
          <div className="flex flex-col items-center gap-3 sm:gap-4 animate-fade-in px-2">
            <p className="text-gray-400 text-sm sm:text-base">Entenda melhor como a MRO pode ajudar você</p>
            <Button 
              onClick={scrollToMethodology}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 sm:px-8 py-4 sm:py-6 text-sm sm:text-base md:text-lg rounded-full group shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all max-w-full"
            >
              <span className="whitespace-normal text-center leading-tight">Clique para conhecer nossa metodologia</span>
              <ChevronDown className="ml-2 group-hover:translate-y-1 transition-transform flex-shrink-0" />
            </Button>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400/50" />
        </div>
      </section>

      {/* O que é a MRO */}
      <section className="py-20 px-4 bg-gray-900/50 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ 
            backgroundImage: `url(${gestaoBg2})`,
            transform: `translateY(${(scrollY - 800) * 0.2}px)`
          }}
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-yellow-400 font-semibold tracking-widest text-xs sm:text-sm text-center mb-2">
            O QUE É A MRO?
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 px-2">
            UMA ESTRUTURA DE CRESCIMENTO COMPLETA
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-6 text-gray-300 text-lg leading-relaxed mb-12">
            <p>
              A MRO é uma solução completa de crescimento para empresas que precisam escalar presença digital, vendas, captação de clientes e performance de forma inteligente e previsível.
            </p>
            <p>
              Não somos apenas uma agência de marketing. Somos uma <strong className="text-white">estrutura de crescimento orientada a estratégia, dados e otimização contínua</strong>, preparada para transformar qualquer negócio — de qualquer nicho — em uma máquina estável de aquisição e retenção de clientes.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Target, title: "Estratégia Focada", desc: "Planejamento orientado a resultados" },
              { icon: BarChart3, title: "Dados Reais", desc: "Decisões baseadas em métricas" },
              { icon: TrendingUp, title: "Crescimento", desc: "Escalabilidade sustentável" },
              { icon: Settings, title: "Otimização", desc: "Melhorias contínuas" },
            ].map((item, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:border-yellow-500/50 hover:bg-gray-800/70 transition-all hover:scale-105">
                <item.icon className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metodologia CVO */}
      <section id="methodology" className="py-20 px-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ 
            backgroundImage: `url(${gestaoBg1})`,
            transform: `translateY(${(scrollY - 1600) * 0.15}px)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-gray-900/90" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-yellow-400 font-semibold tracking-widest text-xs sm:text-sm text-center mb-2">
            NOSSA METODOLOGIA
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4 px-2">
            METODOLOGIA CVO
          </h2>
          <p className="text-gray-300 text-center max-w-3xl mx-auto mb-8 sm:mb-12 text-sm sm:text-base px-2">
            Customer Value Optimization — uma metodologia que vai além do tráfego pago tradicional. Em vez de focar só em trazer cliques, trabalhamos todo o funil.
          </p>
          
          <div className="grid md:grid-cols-5 gap-4 mb-12">
            {[
              { step: 1, title: "Atração", desc: "Captamos atenção qualificada do seu público ideal através de estratégias omnichannel." },
              { step: 2, title: "Conversão", desc: "Transformamos visitantes em leads e leads em clientes com páginas e funis otimizados." },
              { step: 3, title: "Relacionamento", desc: "Criamos conexão duradoura através de conteúdo estratégico e automações inteligentes." },
              { step: 4, title: "Monetização", desc: "Maximizamos o valor de cada cliente com ofertas, upsells e estratégias de ticket médio." },
              { step: 5, title: "Retenção", desc: "Fidelizamos clientes para recompras recorrentes e indicações espontâneas." },
            ].map((item, i) => (
              <div key={i} className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-xl p-6 hover:border-yellow-500/50 transition-all hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/10">
                <div className="w-10 h-10 bg-yellow-500 text-black font-bold rounded-full flex items-center justify-center mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-xl font-semibold text-yellow-400">
            Não entregamos só visitas. Entregamos resultado real.
          </p>
        </div>
      </section>

      {/* O que fazemos */}
      <section className="py-12 sm:py-20 px-3 sm:px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-yellow-400 font-semibold tracking-widest text-xs sm:text-sm text-center mb-2">
            O QUE FAZEMOS
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 px-2">
            COMO A MRO FAZ EMPRESAS CRESCEREM
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Globe, title: "Omnichannel Completo", desc: "Gestão integrada de Google, Facebook, Instagram, WhatsApp e site, garantindo presença estratégica em todos os pontos de contato do cliente." },
              { icon: TrendingUp, title: "Crescimento Orgânico Inteligente", desc: "Nosso sistema MRO Inteligente gera atenção orgânica qualificada, atraindo seguidores reais e alinhados ao público da empresa." },
              { icon: Palette, title: "Criação de Conteúdo Estratégico", desc: "Banners, vídeos, carrosséis, criativos de anúncios e materiais de comunicação focados em conversão." },
              { icon: Settings, title: "Otimização de Site e Páginas", desc: "Ajustes, testes A/B e melhorias contínuas para aumentar as taxas de conversão do funil." },
              { icon: MessageSquare, title: "MRO WhatsApp", desc: "Atendimento automatizado e segmentado via WhatsApp: respostas rápidas, captação de leads e organização de fluxos de conversa." },
              { icon: Megaphone, title: "Campanhas Avançadas", desc: "Campanhas de aquisição e remarketing: atingimos quem ainda não te conhece e reaproveitamos quem já demonstrou interesse." },
              { icon: PieChart, title: "Análise Profunda de Dados", desc: "Decisões baseadas em métricas reais, não \"achismo\". Relatórios claros e acionáveis." },
              { icon: ArrowRight, title: "Transformação da Jornada", desc: "Desde o primeiro contato até a recompra, elevamos o valor do cliente ao longo do tempo." },
            ].map((item, i) => (
              <div key={i} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/50 hover:border-yellow-500/30 transition-all hover:scale-105">
                <item.icon className="w-10 h-10 text-yellow-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-gray-300 max-w-3xl mx-auto">
            O foco é simples: <strong className="text-white">aumentar faturamento, reduzir custos de aquisição e melhorar a vida útil de cada cliente dentro do negócio.</strong>
          </p>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-12 sm:py-20 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-yellow-400 font-semibold tracking-widest text-xs sm:text-sm text-center mb-2">
            PARA QUEM É
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4 px-2">
            FUNCIONA EM QUALQUER NICHO
          </h2>
          <p className="text-gray-300 text-center max-w-3xl mx-auto mb-8 sm:mb-12 text-sm sm:text-base px-2">
            Porque nossa estrutura não depende de moda, plataforma ou tendência. Ela é baseada em comportamento humano, dados e otimização contínua.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Briefcase, label: "Empresas de Serviços" },
              { icon: ShoppingCart, label: "E-commerce" },
              { icon: MapPin, label: "Negócios Locais" },
              { icon: Star, label: "Influenciadores" },
              { icon: Users, label: "Profissionais Liberais" },
              { icon: BookOpen, label: "Infoprodutos" },
              { icon: Building, label: "Negócios Físicos ou Digitais" },
              { icon: Building2, label: "Organizações e Instituições" },
            ].map((item, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-yellow-500/50 transition-all hover:scale-105">
                <item.icon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm font-medium">{item.label}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center px-2">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 mb-2">SE EXISTE PÚBLICO, EXISTE ESTRATÉGIA.</p>
            <p className="text-gray-300 text-sm sm:text-base">E a MRO constrói a jornada mais eficiente entre o cliente e a empresa.</p>
          </div>
        </div>
      </section>

      {/* Por que a MRO */}
      <section className="py-12 sm:py-20 px-3 sm:px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-yellow-400 font-semibold tracking-widest text-xs sm:text-sm text-center mb-2">
            POR QUE A MRO?
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4 px-2">
            DIFERENCIAIS REAIS
          </h2>
          <p className="text-gray-400 text-center mb-8 sm:mb-12 text-sm sm:text-base">MRO em ação • Parceiro Estratégico</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: LineChart, title: "Metodologia CVO", desc: "Focada em lucratividade e não em métricas de vaidade." },
              { icon: Zap, title: "Ferramentas Exclusivas", desc: "MRO WhatsApp e MRO Inteligente inclusas na gestão." },
              { icon: CheckCircle, title: "Execução Completa", desc: "Não terceirizamos o núcleo do trabalho." },
              { icon: Target, title: "Foco Total em Resultado", desc: "Decisões movidas por dados, otimizações constantes." },
              { icon: Globe, title: "Omnichannel Real", desc: "Todos os canais funcionando juntos, não isolados." },
              { icon: Palette, title: "Produção de Conteúdo Interna", desc: "Velocidade, consistência e estratégia alinhada." },
            ].map((item, i) => (
              <div key={i} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all hover:scale-105">
                <item.icon className="w-10 h-10 text-yellow-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-gray-300 max-w-4xl mx-auto">
            A MRO é construída para ser <strong className="text-white">parceira estratégica</strong>, não prestadora de serviço genérica. Nosso objetivo é simples: gerar <strong className="text-yellow-400">Mais Resultados Online</strong> com o melhor custo-benefício possível, entregando uma estrutura que dá retorno real.
          </p>
        </div>
      </section>

      {/* Preços e Investimento */}
      <section id="pricing" className="py-20 px-4 relative overflow-hidden">
        {/* Background Image with Parallax */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${gestaoBg2})`,
            transform: `translateY(${(scrollY - 3500) * 0.2}px) scale(1.1)`,
            opacity: 0.4
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-gray-900/85 to-black" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-yellow-400 font-semibold tracking-widest text-xs sm:text-sm text-center mb-2">
            INVESTIMENTO
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 px-2">
            GESTÃO MENSAL MRO
          </h2>
          
          {/* Pricing Card */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-2 border-yellow-500/50 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-yellow-500/10">
              <div className="absolute top-0 right-0 bg-yellow-500 text-black font-bold px-6 py-2 rounded-bl-2xl">
                PROMOÇÃO
              </div>
              
              <div className="text-center mb-8">
                <p className="text-gray-400 line-through text-2xl mb-2">R$ 2.500/mês</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl md:text-6xl font-bold text-yellow-400">R$ 1.500</span>
                  <span className="text-gray-400">/mês</span>
                </div>
              </div>
              
              {/* Criativos Inclusos - Destaque */}
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400">CRIATIVOS INCLUSOS!</h3>
                    <p className="text-gray-300">Não se preocupe com nada</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                    <Video className="w-6 h-6 text-yellow-400" />
                    <span className="text-sm">Anúncios em Vídeo</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                    <Image className="w-6 h-6 text-yellow-400" />
                    <span className="text-sm">Posts e Banners</span>
                  </div>
                </div>
                <p className="text-center text-yellow-400 font-semibold mt-4">
                  Deixe os criativos da campanha com a gente!
                </p>
              </div>
              
              <div className="space-y-3">
                {[
                  "Gestão completa de tráfego pago",
                  "Criativos das campanhas inclusos",
                  "Anúncios em vídeo feitos por nós",
                  "Posts e banners de campanha",
                  "MRO WhatsApp incluso",
                  "MRO Inteligente incluso",
                  "Relatórios mensais detalhados",
                  "Suporte dedicado",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Investimento em Tráfego */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <Calculator className="w-10 h-10 text-yellow-400" />
                <div>
                  <h3 className="text-xl font-bold">Investimento em Tráfego Pago</h3>
                  <p className="text-gray-400">Mínimo recomendado: R$ 500/mês</p>
                </div>
              </div>
              
              <div className="bg-gray-900/50 rounded-xl p-6">
                <label className="block text-sm text-gray-400 mb-3">
                  Simule seu investimento em anúncios:
                </label>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-gray-400">R$</span>
                  <Input
                    type="number"
                    value={investimento}
                    onChange={(e) => setInvestimento(Math.max(0, Number(e.target.value)))}
                    className="bg-gray-800 border-gray-700 text-2xl font-bold text-yellow-400 h-14"
                    min={0}
                  />
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mt-4">
                  <p className="text-gray-400 text-sm mb-2">Com média de R$ 3,80 por lead:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Leads estimados para WhatsApp:</span>
                    <span className="text-3xl font-bold text-yellow-400">{leadsEstimados}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    *Média de custo por lead gerado pela MRO em campanhas de conversação
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-yellow-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-yellow-400">Crescimento Inteligente e Sustentável</h3>
              <p className="text-gray-300 mb-4">
                Fazemos isso unindo estratégia, execução e tecnologia — tudo em um único ecossistema.
              </p>
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Não terceirizamos nada. Vamos providenciar tudo para você sem se preocupar com mais nada.</span>
              </div>
            </div>
          </div>
          
          <p className="text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mt-8 sm:mt-12 px-2">
            <span className="text-yellow-400">MAIS RESULTADOS.</span>{" "}
            <span className="text-gray-400">MENOS COMPLEXIDADE.</span>
          </p>
        </div>
      </section>

      {/* CTA - Botão para abrir formulário */}
      <section className="py-12 sm:py-20 px-3 sm:px-4 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ 
            backgroundImage: `url(${gestaoBg1})`,
            transform: `translateY(${(scrollY - 4500) * 0.15}px)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-black" />
        
        <div className="max-w-xl mx-auto relative z-10 text-center px-2">
          <img src={logoMro} alt="MRO" className="h-10 sm:h-14 mx-auto mb-4 sm:mb-6" />
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
            GOSTARIA DA NOSSA GESTÃO NO SEU NEGÓCIO?
          </h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg mb-6 sm:mb-10">
            Clique no botão abaixo para preencher o formulário
          </p>
          
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold py-5 sm:py-6 md:py-8 px-6 sm:px-8 md:px-12 text-base sm:text-xl md:text-2xl rounded-2xl shadow-2xl shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all hover:scale-105 max-w-full"
          >
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mr-2 sm:mr-3 flex-shrink-0" />
            <span className="whitespace-normal">SIM, GOSTARIA!</span>
          </Button>
          
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-6 mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500">
            <span>Atendimento rápido</span>
            <span className="hidden sm:inline">•</span>
            <span>Sem compromisso</span>
            <span className="hidden sm:inline">•</span>
            <span>100% gratuito</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <img src={logoMro} alt="MRO" className="h-8 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Mais Resultados Online</p>
          <p className="text-gray-500 text-xs mt-2">© 2025 MRO. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default GestaoMensal;
