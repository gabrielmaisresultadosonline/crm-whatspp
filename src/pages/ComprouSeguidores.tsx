import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  X,
  ChevronDown,
  Eye,
  Users,
  TrendingDown,
  Ban,
  RefreshCw,
  Trash2,
  Sparkles,
  Play,
  Mail,
  User,
  Phone,
  Loader2,
  Shield,
  Zap,
  Target,
  Video,
  MessageCircle,
  Clock
} from "lucide-react";
import logoMro from "@/assets/logo-mro.png";

const PRICE = 33.00;
const ORIGINAL_PRICE = 197.00;

const ComprouSeguidores = () => {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [loading, setLoading] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      toast.error("Por favor, insira um celular válido com DDD");
      return;
    }

    if (!username || username.length < 3) {
      toast.error("Usuário deve ter no mínimo 3 caracteres");
      return;
    }

    if (!/^[a-z0-9]+$/.test(username)) {
      toast.error("Usuário deve conter apenas letras minúsculas e números");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("metodo-seguidor-checkout", {
        body: { 
          email: email.toLowerCase().trim(),
          username: username.trim(),
          phone: phone.replace(/\D/g, "").trim(),
          instagramLink: instagramLink.trim(),
          amount: PRICE
        }
      });

      if (error) {
        console.error("Error creating checkout:", error);
        toast.error("Erro ao criar link de pagamento. Tente novamente.");
        return;
      }

      if (!data.success) {
        toast.error(data.error || "Erro ao criar pagamento");
        return;
      }

      window.open(data.payment_link, "_blank");
      setShowCheckoutModal(false);
      toast.success("Checkout criado! Complete o pagamento na nova aba.");
      
      setEmail("");
      setUsername("");
      setPhone("");
      setInstagramLink("");

    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const problems = [
    {
      icon: Eye,
      title: "Stories não alcançam 100 pessoas",
      description: "Com mais de 2k seguidores, seus stories não passam de 100 visualizações em 24 horas"
    },
    {
      icon: TrendingDown,
      title: "Reels não chegam nem a 10%",
      description: "Seus reels não alcançam nem 10% dos seus próprios seguidores"
    },
    {
      icon: Ban,
      title: "Perfil em Shadow Ban",
      description: "O algoritmo está escondendo seu conteúdo de possíveis seguidores"
    },
    {
      icon: Users,
      title: "Seguidores fantasmas",
      description: "Milhares de seguidores que não interagem, não curtem, não comentam"
    }
  ];

  const benefits = [
    {
      icon: RefreshCw,
      title: "Recuperação do Alcance",
      description: "Técnicas comprovadas para recuperar seu alcance orgânico"
    },
    {
      icon: Target,
      title: "Estratégias de Engajamento",
      description: "Como fazer seus seguidores reais voltarem a interagir"
    },
    {
      icon: Trash2,
      title: "Limpeza de Perfil",
      description: "Como identificar e remover seguidores falsos de forma segura"
    },
    {
      icon: Sparkles,
      title: "Reativação do Algoritmo",
      description: "Sinais que você precisa enviar para o Instagram te favorecer novamente"
    },
    {
      icon: Video,
      title: "Vídeos Passo a Passo",
      description: "Método completo em vídeo para você aplicar hoje mesmo"
    },
    {
      icon: MessageCircle,
      title: "Suporte Exclusivo",
      description: "Tire suas dúvidas e receba orientação personalizada"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-red-900/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <img src={logoMro} alt="MRO" className="h-8 sm:h-10 object-contain" />
          <Button 
            onClick={scrollToPricing}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-2"
          >
            Resolver Agora
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-28 pb-10 sm:pb-16 px-3 sm:px-4">
        {/* Dramatic Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          {/* Price Badge - Hero */}
          <div className="inline-flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-green-600/30 to-green-500/20 border border-green-500/50 rounded-full px-3 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-8">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            <span className="text-green-400 font-bold text-xs sm:text-lg">Corrija agora por apenas <span className="text-base sm:text-2xl">R$33</span> - Pagamento único!</span>
          </div>

          {/* Warning Badge */}
          <div className="inline-flex items-center gap-1 sm:gap-2 bg-red-600/20 border border-red-500/50 rounded-full px-3 sm:px-6 py-1.5 sm:py-2 mb-4 sm:mb-8 animate-pulse">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            <span className="text-red-400 font-bold text-[10px] sm:text-sm uppercase tracking-wide">Atenção: Isso pode estar destruindo seu perfil</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight px-2">
            <span className="text-white">COMPROU SEGUIDORES</span>
            <br />
            <span className="text-red-500">PARA O SEU INSTAGRAM?</span>
          </h1>

          <p className="text-base sm:text-xl md:text-2xl text-gray-300 mb-2 sm:mb-4 font-medium px-2">
            Você <span className="text-red-400 font-bold">ESTRAGOU</span> o alcance real do seu perfil.
          </p>

          <p className="text-sm sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-12 max-w-3xl mx-auto px-2">
            O que você achou que iria ajudar, acabou <span className="text-red-400">piorando tudo</span>.
            Agora você tem duas opções...
          </p>

          {/* Scroll Indicator */}
          <div className="animate-bounce">
            <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10 text-red-500/50 mx-auto" />
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-10 sm:py-16 px-3 sm:px-4 bg-gradient-to-b from-black via-red-950/10 to-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-center mb-2 sm:mb-4 px-2">
            <span className="text-red-500">ISSO ESTÁ ACONTECENDO</span> COM VOCÊ?
          </h2>
          <p className="text-sm sm:text-base text-gray-400 text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
            Se você comprou seguidores, provavelmente está enfrentando esses problemas:
          </p>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {problems.map((problem, i) => (
              <div 
                key={i} 
                className="bg-gradient-to-br from-red-950/30 to-black border border-red-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-red-500/50 transition-all group"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600/30 transition-colors">
                    <problem.icon className="w-5 h-5 sm:w-7 sm:h-7 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2">{problem.title}</h3>
                    <p className="text-sm sm:text-base text-gray-400">{problem.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Big Statement */}
          <div className="bg-gradient-to-r from-red-950/50 via-red-900/30 to-red-950/50 border border-red-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center">
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mb-2 sm:mb-4">
              SEU PERFIL ESTÁ EM <span className="text-red-500">SHADOW BAN</span>
            </h3>
            <p className="text-sm sm:text-xl text-gray-300">
              E não tem muita opção agora... <span className="text-red-400 font-bold">ou quase nenhuma.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Two Options Section */}
      <section className="py-10 sm:py-16 px-3 sm:px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-center mb-8 sm:mb-12 px-2">
            VOCÊ TEM <span className="text-amber-400">DUAS OPÇÕES</span> AGORA
          </h2>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            {/* Option 1 - Bad */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-600 text-white px-2 sm:px-4 py-1 text-xs sm:text-sm font-bold rounded-bl-xl">
                PIOR OPÇÃO
              </div>
              
              <div className="pt-4 sm:pt-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-600/20 flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                  <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                </div>
                
                <h3 className="text-lg sm:text-2xl font-bold text-center mb-3 sm:mb-4">
                  EXCLUIR A CONTA E COMEÇAR DO ZERO
                </h3>
                
                <ul className="space-y-2 sm:space-y-3 text-gray-400 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Perder todas as suas publicações</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Perder todo conteúdo que você já criou</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Começar do absoluto zero</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Meses de trabalho jogados fora</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Ter que postar tudo de novo</span>
                  </li>
                </ul>

                <div className="mt-4 sm:mt-8 text-center">
                  <p className="text-gray-500 text-sm sm:text-lg">
                    Com a quantidade de publicações que você já tem feita, <span className="text-red-400 font-bold">não vale a pena criar tudo do zero</span> e ter que publicar tudo de novo, né?
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2 - Good */}
            <div className="bg-gradient-to-b from-green-950/30 to-black border-2 border-green-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 relative overflow-hidden shadow-lg shadow-green-500/10">
              <div className="absolute top-0 right-0 bg-green-600 text-white px-2 sm:px-4 py-1 text-xs sm:text-sm font-bold rounded-bl-xl">
                MELHOR OPÇÃO
              </div>
              
              <div className="pt-4 sm:pt-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-600/20 flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
                
                <h3 className="text-lg sm:text-2xl font-bold text-center mb-3 sm:mb-4">
                  USAR O MÉTODO DE CORREÇÃO MRO
                </h3>
                
                <ul className="space-y-2 sm:space-y-3 text-gray-300 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Manter todas as suas publicações</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Recuperar o alcance orgânico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Remover shadow ban do perfil</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Atrair seguidores reais novamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Método comprovado e passo a passo</span>
                  </li>
                </ul>

                <div className="mt-4 sm:mt-8 text-center">
                  <p className="text-green-400 font-bold text-sm sm:text-lg">
                    Corrija seu perfil sem precisar recomeçar tudo do zero!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-10 sm:py-16 px-3 sm:px-4 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-center mb-2 sm:mb-4 px-2">
            O QUE VOCÊ VAI <span className="text-amber-400">RECEBER</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-400 text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
            Um método completo para corrigir seu perfil sem precisar excluir nada
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {benefits.map((benefit, i) => (
              <div 
                key={i} 
                className="bg-gray-900/50 border border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-6 hover:border-amber-500/50 transition-all group"
              >
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-2 sm:mb-4 group-hover:bg-amber-500/30 transition-colors">
                  <benefit.icon className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-white mb-1 sm:mb-2">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-12 sm:py-20 px-4 bg-gradient-to-b from-black via-amber-950/10 to-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-2 sm:mb-4">
              O QUE VALE MAIS A PENA?
            </h2>
            <p className="text-base sm:text-xl text-gray-400 px-2">
              Investir em corrigir ou perder meses de trabalho criando do zero?
            </p>
          </div>

          <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-amber-500 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-amber-500/10">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />
            
            <div className="relative">
              <div className="text-center mb-6 sm:mb-8">
                <p className="text-gray-400 text-sm sm:text-lg mb-2">Método de Correção MRO</p>
                
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
                  <span className="text-xl sm:text-3xl text-gray-500 line-through">R$ {ORIGINAL_PRICE.toFixed(2).replace(".", ",")}</span>
                  <span className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                    -85% OFF
                  </span>
                </div>

                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-lg sm:text-2xl text-gray-400">R$</span>
                  <span className="text-5xl sm:text-7xl md:text-8xl font-black text-amber-400">{Math.floor(PRICE)}</span>
                  <span className="text-xl sm:text-3xl text-amber-400">,{(PRICE % 1).toFixed(2).split(".")[1]}</span>
                </div>

                <p className="text-sm sm:text-base text-gray-400 mt-2">Pagamento único - Acesso imediato</p>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 max-w-md mx-auto">
                {[
                  "Acesso imediato ao método completo",
                  "Vídeos passo a passo",
                  "Técnicas de recuperação de alcance",
                  "Estratégias anti shadow ban",
                  "Suporte por email"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => setShowCheckoutModal(true)}
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-sm sm:text-base md:text-xl py-5 sm:py-6 md:py-8 rounded-xl shadow-lg shadow-amber-500/30"
              >
                <span className="truncate">QUERO CORRIGIR MEU PERFIL</span>
                <ArrowRight className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
              </Button>

              <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 text-gray-400">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Pagamento 100% seguro via InfiniPay</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Section */}
      <section className="py-8 sm:py-12 px-3 sm:px-4 bg-gradient-to-r from-red-950/50 via-red-900/30 to-red-950/50 border-y border-red-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
            <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white">
              QUANTO MAIS TEMPO VOCÊ DEMORA...
            </h3>
          </div>
          <p className="text-sm sm:text-xl text-gray-300 px-2">
            Pior fica a situação do seu perfil. O algoritmo continua penalizando você <span className="text-red-400 font-bold">todos os dias</span>.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-3 sm:px-4 bg-black border-t border-gray-900">
        <div className="max-w-6xl mx-auto text-center">
          <img src={logoMro} alt="MRO" className="h-8 sm:h-10 mx-auto mb-3 sm:mb-4 object-contain opacity-50" />
          <p className="text-gray-500 text-xs sm:text-sm">
            © {new Date().getFullYear()} MRO - Método de Resultados Online. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto relative animate-in slide-in-from-bottom sm:fade-in sm:zoom-in duration-300">
            <button 
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-4 sm:mb-6 pt-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Complete seu cadastro</h3>
              <p className="text-sm sm:text-base text-gray-400">Preencha seus dados para acessar o método</p>
            </div>

            <form onSubmit={handleCheckout} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1">Usuário (será seu login e senha)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="meuusuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                    className="pl-9 sm:pl-10 bg-gray-800 border-gray-700 text-white text-sm sm:text-base h-10 sm:h-11"
                    required
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Somente letras minúsculas e números, sem caracteres especiais</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 sm:pl-10 bg-gray-800 border-gray-700 text-white text-sm sm:text-base h-10 sm:h-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1">Celular com DDD</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <Input
                    type="tel"
                    placeholder="(51) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9 sm:pl-10 bg-gray-800 border-gray-700 text-white text-sm sm:text-base h-10 sm:h-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1">Link do perfil do Instagram (opcional)</label>
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="https://instagram.com/seuperfil"
                    value={instagramLink}
                    onChange={(e) => setInstagramLink(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Cole o link do seu perfil do Instagram</p>
              </div>

              <div className="pt-2 sm:pt-4">
                <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-400">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-amber-400">R$ {PRICE.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold py-4 sm:py-6 text-base sm:text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      FINALIZAR COMPRA
                      <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprouSeguidores;
