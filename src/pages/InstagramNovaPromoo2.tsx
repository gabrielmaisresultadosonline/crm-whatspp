import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView } from "@/lib/facebookTracking";
import { toast } from "sonner";
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Clock,
  Play,
  Heart,
  Eye,
  UserPlus,
  Bot,
  MessageCircle,
  Video,
  Users,
  Zap,
  X,
  ChevronDown,
  Star,
  Target,
  Lightbulb,
  Brain,
  RefreshCw,
  Gift,
  Monitor,
  Laptop,
  Mail,
  User,
  CreditCard,
  Loader2,
  Phone,
  Timer,
  AlertTriangle,
  Send,
  Filter,
  TrendingUp,
  BarChart3,
  FileText,
  Rocket,
  Crown,
  Flame,
  MousePointerClick
} from "lucide-react";
import logoMro from "@/assets/logo-mro.png";
import ActiveClientsSection from "@/components/ActiveClientsSection";

const InstagramNovaPromoo2 = () => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [isMainVideoPlaying, setIsMainVideoPlaying] = useState(false);
  
  // Popup de desconto encerrado - desativado nesta página
  const [showDiscountEndedPopup, setShowDiscountEndedPopup] = useState(false);
  
  // Countdown para promoção - 8 horas a partir do primeiro acesso
  const [promoTimeLeft, setPromoTimeLeft] = useState({ hours: 8, minutes: 0, seconds: 0, expired: false });
  const pricingRef = useRef<HTMLDivElement>(null);
  
  // Modal de cadastro
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validar username: apenas letras minúsculas, sem espaços, sem números
  const validateUsername = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z]/g, "");
    setUsername(cleaned);
    
    if (value !== cleaned) {
      setUsernameError("Apenas letras minúsculas, sem espaços ou números");
    } else if (cleaned.length < 4) {
      setUsernameError("Mínimo de 4 caracteres");
    } else if (cleaned.length > 20) {
      setUsernameError("Máximo de 20 caracteres");
    } else {
      setUsernameError("");
    }
  };

  // Criar checkout e abrir pagamento
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

    if (!username || username.length < 4) {
      toast.error("Nome de usuário deve ter no mínimo 4 caracteres");
      return;
    }

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    setLoading(true);

    try {
      // Preço promocional: R$300
      const { data: checkData, error: checkError } = await supabase.functions.invoke("create-mro-checkout", {
        body: { 
          email: email.toLowerCase().trim(),
          username: username.toLowerCase().trim(),
          phone: phone.replace(/\D/g, "").trim(),
          planType: "annual",
          amount: 300,
          checkUserExists: true
        }
      });

      if (checkError) {
        console.error("Error creating checkout:", checkError);
        toast.error("Erro ao criar link de pagamento. Tente novamente.");
        return;
      }

      if (checkData.userExists) {
        toast.error("Este nome de usuário já está em uso. Escolha outro.");
        setUsernameError("Usuário já existe, escolha outro");
        return;
      }

      if (!checkData.success) {
        toast.error(checkData.error || "Erro ao criar pagamento");
        return;
      }

      // Redirecionar diretamente para o checkout (funciona melhor no mobile)
      // Usar location.href ao invés de window.open para evitar bloqueio de popup
      window.location.href = checkData.payment_link;
      
      // Resetar form
      setEmail("");
      setUsername("");
      setPhone("");

    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Track PageView on mount
  useEffect(() => {
    trackPageView('Sales Page - Instagram MRO Promo 2');
  }, []);

  // Countdown de 7 horas - SEMPRE reinicia quando entra na página (NUNCA expira)
  useEffect(() => {
    // Definir tempo de promoção como 7 horas a partir de AGORA (a cada visita)
    const PROMO_DURATION = 7 * 60 * 60 * 1000; // 7 horas em milissegundos
    const promoEndTime = Date.now() + PROMO_DURATION;
    
    const updateCountdown = () => {
      const currentTime = Date.now();
      const diff = promoEndTime - currentTime;
      
      // Nunca expira - se chegar a 0, mostra 0:0:0 mas não marca como expirado
      if (diff <= 0) {
        setPromoTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: false });
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setPromoTimeLeft({ hours, minutes, seconds, expired: false });
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openVideo = (url: string) => {
    setCurrentVideoUrl(url);
    setShowVideoModal(true);
  };

  const iaFeatures = [
    "Cria legendas prontas e otimizadas para seu conteúdo",
    "Gera biografias profissionais para seu Instagram",
    "Entrega os melhores horários para postar no seu nicho",
    "Recomenda hashtags quentes e relevantes"
  ];

  const mroFeatures = [
    { icon: Heart, title: "Curte fotos" },
    { icon: UserPlus, title: "Segue perfis estratégicos" },
    { icon: Users, title: "Segue e deixa de seguir também" },
    { icon: Eye, title: "Reage aos Stories com \"amei\"" },
    { icon: Target, title: "Remove seguidores fakes/comprados" },
    { icon: Zap, title: "Interação com 200 pessoas por dia" }
  ];

  const areaMembroFeatures = [
    "Vídeos estratégicos com passo a passo",
    "Como deixar seu perfil mais atrativo e profissional",
    "Como agendar suas postagens e deixar tudo no automático",
    "Estratégias para bombar seu Instagram mesmo começando do zero"
  ];

  const grupoVipFeatures = [
    "Acesse o grupo VIP",
    "Tire dúvidas",
    "Compartilhe resultados",
    "Receba atualizações em primeira mão"
  ];

  const planFeatures = [
    "Ferramenta completa para Instagram",
    "Acesso a 4 contas simultâneas fixas",
    "5 testes todo mês para testar em seus clientes/outras contas",
    "Área de membros por 1 ano",
    "Vídeos estratégicos passo a passo",
    "Grupo VIP no WhatsApp",
    "Suporte prioritário"
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Popup Desconto Encerrado */}
      {showDiscountEndedPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-red-500 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center relative animate-in zoom-in-95 duration-300">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="bg-red-600 text-white font-bold px-4 py-1.5 rounded-full text-sm">
                ⚠️ AVISO
              </div>
            </div>
            
            <div className="mt-4 mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Desconto Encerrado!
              </h2>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                Aguarde um próximo desconto ou siga para página oficial para adquirir o plano hoje
              </p>
            </div>
            
            <Button 
              onClick={() => window.location.href = '/instagram-nova'}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg py-5 rounded-xl shadow-lg shadow-green-500/30"
            >
              Acessar Página <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <button 
              onClick={() => setShowDiscountEndedPopup(false)}
              className="mt-4 text-gray-400 hover:text-white text-sm underline"
            >
              Continuar na página mesmo assim
            </button>
          </div>
        </div>
      )}

      {/* Urgency Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-red-600 via-orange-500 to-red-600 py-2 px-2">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 sm:gap-3 text-center flex-wrap">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-pulse hidden sm:block" />
          <span className="text-xs sm:text-sm md:text-base font-bold text-white leading-tight">
            🎁 VOCÊ RECEBEU UM DESCONTO ESPECIAL! Aproveite em{" "}
            <span className="bg-black/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-yellow-300 font-mono text-xs sm:text-sm">
              {promoTimeLeft.expired ? "EXPIRADO" : 
                `${String(promoTimeLeft.hours).padStart(2, '0')}:${String(promoTimeLeft.minutes).padStart(2, '0')}:${String(promoTimeLeft.seconds).padStart(2, '0')}`
              }
            </span>
          </span>
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-pulse hidden sm:block" />
        </div>
      </div>

      {/* Header removido conforme solicitação */}

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 md:pt-24 pb-10 sm:pb-16 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Special Discount Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 animate-bounce">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
            <span className="font-bold text-sm sm:text-lg">DESCONTO ESPECIAL LIBERADO!</span>
          </div>
          
          <img src={logoMro} alt="MRO" className="h-16 sm:h-20 md:h-28 mx-auto mb-6 sm:mb-8 object-contain" />
          
          {/* Animated Title */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 blur-3xl rounded-full" />
            <h1 className="relative text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 px-2">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">NÃO GASTE MAIS COM ANÚNCIOS</span>
            </h1>
            <h2 className="relative text-lg sm:text-xl md:text-3xl lg:text-4xl font-black mb-3">
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
                UTILIZE A MRO INTELIGENTE!
              </span>
            </h2>
            <p className="relative mt-3 text-sm md:text-base text-gray-400">
              Instale em seu notebook, macbook ou computador de mesa!
            </p>
          </div>

          {/* V7+ Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/50 rounded-full px-4 sm:px-6 py-2 mt-6">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 animate-pulse" />
            <span className="text-white font-bold text-xs sm:text-sm">NOVA VERSÃO V7+ PLUS — A MAIS COMPLETA</span>
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 animate-pulse" />
          </div>

          {/* Countdown Timer Large */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-4">
            <div className="bg-gradient-to-b from-red-600 to-red-800 rounded-lg sm:rounded-xl p-2 sm:p-4 min-w-[60px] sm:min-w-[80px]">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold font-mono">
                {String(promoTimeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs text-red-200">HORAS</div>
            </div>
            <span className="text-xl sm:text-3xl font-bold text-red-500">:</span>
            <div className="bg-gradient-to-b from-red-600 to-red-800 rounded-lg sm:rounded-xl p-2 sm:p-4 min-w-[60px] sm:min-w-[80px]">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold font-mono">
                {String(promoTimeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs text-red-200">MINUTOS</div>
            </div>
            <span className="text-xl sm:text-3xl font-bold text-red-500">:</span>
            <div className="bg-gradient-to-b from-red-600 to-red-800 rounded-lg sm:rounded-xl p-2 sm:p-4 min-w-[60px] sm:min-w-[80px]">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold font-mono">
                {String(promoTimeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs text-red-200">SEGUNDOS</div>
            </div>
          </div>

          {/* Main Video */}
          <div className="mt-8 sm:mt-10 max-w-4xl mx-auto">
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-green-500/30">
              <div className="aspect-video">
                <iframe 
                  src="https://www.youtube.com/embed/lecSwt54sa0?rel=0&modestbranding=1" 
                  title="Video MRO"
                  className="w-full h-full" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                />
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={scrollToPricing}
            className="mt-8 sm:mt-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-sm sm:text-lg px-6 sm:px-10 py-5 sm:py-6 rounded-full shadow-lg shadow-green-500/30"
          >
            GARANTIR MEU DESCONTO AGORA <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </section>

      {/* Active Clients */}
      <section className="py-8 px-4 bg-gradient-to-b from-gray-950 to-black">
        <ActiveClientsSection title="Clientes Ativos" maxClients={15} />
      </section>

      {/* ====== COMO FUNCIONA NA PRÁTICA ====== */}
      <section className="py-16 sm:py-20 px-3 sm:px-4 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 sm:px-6 py-2 mb-4">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-cyan-400 font-bold text-xs sm:text-sm">COMO FUNCIONA</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-4">
              COMO FUNCIONA <span className="text-cyan-400">NA PRÁTICA</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-lg">A nova lógica está muito mais estratégica e assertiva</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-amber-500/50 to-green-500/50 -translate-x-1/2" />
            {[
              { step: "01", icon: UserPlus, title: "Ative o seguir + curtir em massa", desc: "O sistema começa a interagir com perfis estratégicos automaticamente", color: "cyan" },
              { step: "02", icon: Users, title: "Pessoas interessadas te seguem de volta", desc: "Quem se identifica com seu conteúdo e nicho passa a te seguir", color: "blue" },
              { step: "03", icon: Filter, title: "O sistema identifica o público quente", desc: "Filtros inteligentes separam quem realmente tem interesse", color: "purple" },
              { step: "04", icon: Send, title: "Envie Direct em massa automaticamente", desc: "Mensagens otimizadas são enviadas para leads qualificados", color: "amber" },
              { step: "05", icon: Rocket, title: "Direcione para seu produto ou serviço", desc: "Converta seguidores em clientes reais com estratégia", color: "green" },
            ].map((item, i) => (
              <div key={i} className={`relative flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <div className="bg-gray-900/80 border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-3 mb-2" style={{ justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
                      <span className="text-2xl sm:text-3xl font-black text-gray-700">{item.step}</span>
                    </div>
                    <h4 className="text-base sm:text-xl font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
                <div className="hidden md:flex w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 items-center justify-center z-10 flex-shrink-0">
                  <item.icon className="w-6 h-6 text-gray-300" />
                </div>
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-12 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-green-500/10 border-2 border-amber-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
            <p className="text-2xl sm:text-3xl md:text-4xl font-black mb-4">
              💥 <span className="text-amber-400">RESULTADO</span>
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 font-bold">
              Mais seguidores → Mais conversas → <span className="text-green-400">Mais vendas</span>
            </p>
          </div>
        </div>
      </section>

      {/* ====== O QUE HÁ DE NOVO NA V7+ PLUS ====== */}
      <section className="py-16 sm:py-20 px-3 sm:px-4 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-full px-4 sm:px-6 py-2 mb-4">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span className="text-amber-400 font-bold text-xs sm:text-sm">O QUE HÁ DE NOVO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-4">
              NOVIDADES DA <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">V7+ PLUS</span>
            </h2>
            <p className="text-gray-300 text-sm sm:text-lg md:text-xl max-w-3xl mx-auto mb-2">
              Totalmente otimizada com mais automação, mais inteligência e mais resultados
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-black mt-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              🎁 O que você vai receber no Plano MRO!
            </p>
          </div>

          {/* DM em Massa */}
          <div className="mb-8 sm:mb-10">
            <div className="relative bg-gradient-to-br from-blue-950/60 to-blue-900/30 border-2 border-blue-500/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Send className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <div className="bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full inline-block mb-1">NOVO</div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-blue-300">Automação de Direct (DM) em Massa</h3>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { icon: UserPlus, text: "Envio automático para novos seguidores" },
                    { icon: Users, text: "Envio para seus seguidores atuais" },
                    { icon: Target, text: "Envio para seguidores de qualquer página" },
                    { icon: Bot, text: "Copy otimizada com Corretor de IA exclusivo MRO" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 sm:gap-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 sm:p-4 hover:bg-blue-500/15 transition-colors">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      </div>
                      <span className="text-gray-200 font-medium text-sm sm:text-base">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filtros Inteligentes */}
          <div className="mb-8 sm:mb-10">
            <div className="relative bg-gradient-to-br from-purple-950/60 to-purple-900/30 border-2 border-purple-500/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Filter className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <div className="bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-full inline-block mb-1">NOVO</div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-purple-300">Filtros Inteligentes (Público Quente)</h3>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 sm:p-4">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                    <span className="text-gray-200 text-sm sm:text-base">Segmentação avançada para atingir quem realmente tem interesse</span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 sm:p-4">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                    <span className="text-gray-200 text-sm sm:text-base">Mais precisão = mais respostas e conversões</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Automação Completa de Crescimento */}
          <div className="mb-8 sm:mb-10">
            <div className="relative bg-gradient-to-br from-amber-950/60 to-amber-900/30 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 overflow-hidden">
              <div className="absolute top-0 left-1/2 w-96 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <div className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full inline-block mb-1">PRINCIPAL</div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-amber-300">Automação Completa de Crescimento</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { icon: UserPlus, text: "Seguir em massa", color: "text-green-400" },
                    { icon: Heart, text: "Curtir fotos automaticamente", color: "text-pink-400" },
                    { icon: Flame, text: "Curtir stories", color: "text-orange-400" },
                    { icon: RefreshCw, text: "Deixar de seguir", color: "text-blue-400" },
                  ].map((item, i) => (
                    <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 sm:p-5 text-center hover:scale-105 transition-transform">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color}`} />
                      </div>
                      <span className="text-gray-200 font-bold text-xs sm:text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Captura Avançada de Público */}
          <div className="mb-8 sm:mb-10">
            <div className="relative bg-gradient-to-br from-green-950/60 to-green-900/30 border-2 border-green-500/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 overflow-hidden">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <MousePointerClick className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <div className="bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-full inline-block mb-1">AVANÇADO</div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-green-300">Captura Avançada de Público</h3>
                  </div>
                </div>
                <p className="text-gray-400 mb-4 sm:mb-5 text-sm sm:text-lg">Extraia leads altamente qualificados:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {["Pessoas que curtem posts", "Pessoas que comentam", "Seguidores de qualquer perfil", "Quem o perfil está seguindo"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3 sm:p-4">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-200 text-sm sm:text-base">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 sm:mt-6 bg-green-500/15 border border-green-500/30 rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-green-300 font-bold text-sm sm:text-lg">👉 Você atinge exatamente quem já demonstra interesse.</p>
                </div>
              </div>
            </div>
          </div>

          {/* IA Exclusiva */}
          <div className="mb-8 sm:mb-10">
            <div className="relative bg-gradient-to-br from-pink-950/60 to-pink-900/30 border-2 border-pink-500/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                    <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <div className="bg-pink-500 text-white text-[10px] font-black px-3 py-1 rounded-full inline-block mb-1">IA EXCLUSIVA</div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-pink-300">Inteligência Artificial Exclusiva</h3>
                  </div>
                </div>
                <p className="text-gray-300 mb-4 sm:mb-5 text-sm sm:text-lg">A MRO V7+ vai além da automação:</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { icon: Bot, text: "Análise completa do seu perfil", color: "text-pink-400" },
                    { icon: FileText, text: "Estratégias de conteúdo", color: "text-blue-400" },
                    { icon: BarChart3, text: "Estratégias de engajamento", color: "text-purple-400" },
                    { icon: CreditCard, text: "Estratégias de vendas", color: "text-green-400" },
                    { icon: Sparkles, text: "Otimização da BIO", color: "text-amber-400" },
                    { icon: TrendingUp, text: "Relatórios e acompanhamento", color: "text-cyan-400" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-pink-500/10 border border-pink-500/20 rounded-xl p-3 sm:p-4 hover:bg-pink-500/15 transition-colors">
                      <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color} flex-shrink-0`} />
                      <span className="text-gray-200 font-medium text-sm sm:text-base">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== MAIS RESULTADOS ZERO ANÚNCIOS ====== */}
      <section className="py-12 sm:py-16 px-3 sm:px-4 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-4">
              💰 MAIS RESULTADOS, <span className="text-red-400">ZERO ANÚNCIOS</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-lg">Com a MRO Inteligente V7+ você:</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Rocket, text: "Aumenta seu engajamento", gradient: "from-blue-600 to-cyan-600", glow: "shadow-blue-500/30" },
              { icon: Users, text: "Ganha seguidores qualificados", gradient: "from-purple-600 to-pink-600", glow: "shadow-purple-500/30" },
              { icon: CreditCard, text: "Converte mais clientes", gradient: "from-green-600 to-emerald-600", glow: "shadow-green-500/30" },
              { icon: X, text: "Sem tráfego pago", gradient: "from-red-600 to-orange-600", glow: "shadow-red-500/30" },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl ${item.glow} group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <p className="text-white font-bold text-sm sm:text-lg">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== RESUMO FINAL ====== */}
      <section className="py-12 sm:py-16 px-3 sm:px-4 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-amber-950/50 to-orange-950/50 border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-full px-4 sm:px-6 py-2 mb-4 sm:mb-6">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="text-amber-400 font-bold text-xs sm:text-sm">RESUMO FINAL</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 sm:mb-8">
                A MRO Inteligente V7+ Plus é uma <span className="text-amber-400">máquina de crescimento e vendas</span> no Instagram
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { emoji: "👉", label: "Automática", desc: "Funciona 24/7" },
                  { emoji: "👉", label: "Inteligente", desc: "IA exclusiva" },
                  { emoji: "👉", label: "Escalável", desc: "Sem limites" },
                  { emoji: "👉", label: "Sem limites", desc: "Uso ilimitado" },
                ].map((item, i) => (
                  <div key={i} className="bg-black/40 border border-amber-500/20 rounded-xl p-3 sm:p-4">
                    <span className="text-xl sm:text-2xl">{item.emoji}</span>
                    <p className="text-white font-bold mt-2 text-sm sm:text-base">{item.label}</p>
                    <p className="text-gray-500 text-[10px] sm:text-xs mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 sm:py-20 px-3 sm:px-4 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-green-950/80 to-black border-2 border-green-500/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-14 text-center shadow-2xl shadow-green-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-green-500/10 animate-ping pointer-events-none" style={{animationDuration: '3s'}} />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
              </div>
            </div>
            <span className="text-green-400 font-bold text-[10px] sm:text-xs tracking-[0.3em] uppercase">GARANTIA TOTAL</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mt-3 mb-4 sm:mb-6 leading-tight">
              30 Dias de Resultados <span className="text-green-400">Garantidos</span>
            </h2>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 max-w-2xl mx-auto mb-6 sm:mb-8">
              <p className="text-white text-base sm:text-lg md:text-xl leading-relaxed">
                Se em <strong className="text-green-400">30 dias</strong> não tiver os resultados prometidos, <strong className="text-white">devolvemos o seu dinheiro.</strong>
              </p>
              <p className="text-green-300 font-bold text-sm sm:text-lg mt-2">Nós garantimos resultados. Sem risco para você.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-6 sm:mb-8">
              {[
                { emoji: "🔒", label: "Compra 100% Segura" },
                { emoji: "💰", label: "Reembolso Garantido" },
                { emoji: "✅", label: "Satisfação ou Dinheiro de Volta" }
              ].map((item, i) => (
                <div key={i} className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 justify-center">
                  <span className="text-lg sm:text-xl">{item.emoji}</span>
                  <span className="text-green-300 text-xs sm:text-sm font-semibold">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs sm:text-sm">Garantia válida por 30 dias após a data da compra.</p>
          </div>
        </div>
      </section>

      {/* O que está incluso */}
      <section ref={pricingRef} className="py-10 sm:py-16 px-3 sm:px-4 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-3 sm:mb-4">
            <span className="text-green-400">OFERTA ESPECIAL</span>
          </h2>
          <p className="text-center text-gray-400 mb-8 sm:mb-10 text-base sm:text-lg">Promoção válida apenas por 8 horas</p>
          
          {/* Pricing Card */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-green-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden">
            {/* Badge */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-4 sm:px-6 py-1.5 sm:py-2 rounded-b-xl text-xs sm:text-sm whitespace-nowrap">
                🔥 DESCONTO ESPECIAL
              </div>
            </div>
            
            <div className="text-center mt-6 sm:mt-6 mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Plano Anual Completo</h3>
              
              {/* Price */}
              <div className="mb-2">
                <span className="text-gray-500 line-through text-lg sm:text-2xl">De R$ 397</span>
              </div>
              
              <div className="text-base sm:text-lg text-gray-300 mb-2">por apenas</div>
              
              <div className="text-green-400 mb-1">
                <span className="text-lg sm:text-xl md:text-2xl font-medium">12x de</span>
                <span className="text-5xl sm:text-6xl md:text-7xl font-black ml-2">R$30</span>
              </div>
              
              <p className="text-gray-300 text-lg sm:text-xl mb-3">
                ou <span className="text-white font-bold">R$300 à vista</span>
              </p>
              
              <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-4">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <span className="text-red-400 font-bold text-sm sm:text-base">R$97 REAIS DE DESCONTO!</span>
              </div>
              
              <p className="text-yellow-400 text-xs sm:text-sm font-medium">
                ⏰ Válido apenas nas próximas 8 horas
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {planFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm sm:text-base">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button 
              onClick={() => {
                if (promoTimeLeft.expired) {
                  toast.error("Promoção expirada! Esta oferta não está mais disponível.");
                  return;
                }
                setShowCheckoutModal(true);
              }}
              disabled={promoTimeLeft.expired}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-base sm:text-xl py-5 sm:py-7 rounded-xl shadow-lg shadow-green-500/30 disabled:opacity-50"
            >
              {promoTimeLeft.expired ? "PROMOÇÃO EXPIRADA" : "QUERO GARANTIR AGORA"}
            </Button>
            
            {/* Secure badges */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6 text-xs sm:text-sm text-gray-400 flex-wrap">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Compra Segura</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>PIX ou Cartão</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Garantia */}
      <section className="py-10 sm:py-16 px-3 sm:px-4 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-8">
            <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400 mb-2 sm:mb-3">
                  30 Dias de Resultados Garantidos
                </h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  Nós garantimos engajamento, clientes, público e vendas utilizando nossa ferramenta de modo contínuo. 
                  Se em 30 dias você não estiver completamente satisfeito, devolvemos <strong className="text-white">100% do seu investimento!</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* O QUE VOCÊ VAI RECEBER */}
      <section className="py-10 sm:py-16 px-3 sm:px-4 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-10 sm:mb-16">
            O QUE VOCÊ VAI <span className="text-green-400">RECEBER</span>
          </h2>

          {/* IA Section */}
          <div className="mb-10 sm:mb-16">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
                <span className="font-bold text-xs sm:text-sm">NOVO</span>
              </div>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-bold">
                Inteligência artificial automática
              </h3>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-8">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {iaFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>
              <p className="text-green-400 font-medium mt-4 sm:mt-6 text-center text-sm sm:text-lg">
                Tudo isso personalizado para você, em segundos!
              </p>
            </div>
          </div>

          {/* MRO Principal */}
          <div className="mb-10 sm:mb-16">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-green-500 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
                <span className="font-bold text-black text-xs sm:text-sm">PRINCIPAL</span>
              </div>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-bold">
                FERRAMENTA MRO
              </h3>
            </div>
            
            <div className="bg-gray-900/50 border border-green-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {mroFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 sm:gap-4 bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                    </div>
                    <span className="font-medium text-sm sm:text-base">{feature.title}</span>
                  </div>
                ))}
              </div>
              
              <p className="text-gray-400 mt-6 sm:mt-8 text-center max-w-3xl mx-auto text-sm sm:text-base">
                Tudo isso em alta escala, todos os dias, atraindo um novo público real e interessado em você.
              </p>
              
              <div className="mt-4 sm:mt-6 text-center">
                <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 sm:px-6 py-2 sm:py-3">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  <span className="text-green-400 font-bold text-xs sm:text-sm">Resultados comprovados em até 7 horas de uso!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Area de Membros */}
          <div className="mb-10 sm:mb-16">
            <h3 className="text-lg sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">
              ÁREA DE MEMBROS <span className="text-green-400">VITALÍCIA</span>
            </h3>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-8">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {areaMembroFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 sm:gap-3">
                    <Video className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grupo VIP */}
          <div className="mb-10 sm:mb-16">
            <h3 className="text-lg sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">
              GRUPO VIP DE <span className="text-green-400">SUPORTE E NETWORKING</span>
            </h3>
            
            <div className="bg-gray-900/50 border border-green-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-8">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {grupoVipFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 sm:gap-3">
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-10 sm:py-16 px-3 sm:px-4 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-4 sm:mb-6">
            Não perca essa <span className="text-green-400">oportunidade única!</span>
          </h2>
          
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 animate-pulse" />
            <span className="text-base sm:text-xl font-bold">
              Oferta expira em{" "}
              <span className="text-red-500 font-mono">
                {promoTimeLeft.expired ? "EXPIRADO" : 
                  `${String(promoTimeLeft.hours).padStart(2, '0')}:${String(promoTimeLeft.minutes).padStart(2, '0')}:${String(promoTimeLeft.seconds).padStart(2, '0')}`
                }
              </span>
            </span>
          </div>
          
          <Button 
            onClick={() => {
              if (promoTimeLeft.expired) {
                toast.error("Promoção expirada!");
                return;
              }
              setShowCheckoutModal(true);
            }}
            disabled={promoTimeLeft.expired}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-sm sm:text-xl px-6 sm:px-12 py-5 sm:py-7 rounded-full shadow-lg shadow-green-500/30 disabled:opacity-50"
          >
            {promoTimeLeft.expired ? "PROMOÇÃO EXPIRADA" : "GARANTIR MEU DESCONTO DE R$300"}
          </Button>
        </div>
      </section>

      {/* Video Modal */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <button 
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setShowVideoModal(false)}
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <div className="w-full max-w-5xl aspect-video" onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${currentVideoUrl}?autoplay=1&rel=0`}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-green-500/30 rounded-xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6 relative my-4">
            <button 
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Finalize seu Cadastro</h3>
              <div className="text-2xl sm:text-3xl font-bold text-green-400">
                12x de R$30
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">ou R$300 à vista no PIX</p>
            </div>
            
            <form onSubmit={handleCheckout} className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm text-gray-400 mb-1 block">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                  E-mail
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-gray-800 border-gray-700 text-white text-sm sm:text-base"
                  required
                />
              </div>
              
              <div>
                <label className="text-xs sm:text-sm text-gray-400 mb-1 block">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                  Celular com DDD
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="bg-gray-800 border-gray-700 text-white text-sm sm:text-base"
                  required
                />
              </div>
              
              <div>
                <label className="text-xs sm:text-sm text-gray-400 mb-1 block">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                  Nome de usuário (login)
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => validateUsername(e.target.value)}
                  placeholder="seunome"
                  className={`bg-gray-800 border-gray-700 text-white text-sm sm:text-base ${usernameError ? 'border-red-500' : ''}`}
                  required
                />
                {usernameError && (
                  <p className="text-red-400 text-[10px] sm:text-xs mt-1">{usernameError}</p>
                )}
                <p className="text-gray-500 text-[10px] sm:text-xs mt-1">
                  Apenas letras minúsculas, sem espaços ou números
                </p>
              </div>
              
              <Button
                type="submit"
                disabled={loading || promoTimeLeft.expired}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 sm:py-6 rounded-xl text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    PAGAR AGORA
                  </>
                )}
              </Button>
            </form>
            
            <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Pagamento 100% seguro via InfiniPay</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-3 sm:px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-xs sm:text-sm">
          <p>© 2025 MRO - Mais Resultados Online. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default InstagramNovaPromoo2;