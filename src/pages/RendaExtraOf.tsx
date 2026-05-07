import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView, trackFacebookEvent } from "@/lib/facebookTracking";
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
  Volume2,
  VolumeX,
  RotateCcw,
  Pause
} from "lucide-react";
import logoMro from "@/assets/logo-mro.png";
import MoneyParticles from "@/components/MoneyParticles";
import rendaExtraMroBanner from "@/assets/renda-extra-mro-banner.jpeg";
import { useWhatsAppConfig } from "@/hooks/useWhatsAppConfig";

const RendaExtraOf = () => {
  const { whatsappNumber } = useWhatsAppConfig();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [isMainVideoPlaying, setIsMainVideoPlaying] = useState(false);
  
  // Popup de desconto encerrado - desativado nesta página
  const [showDiscountEndedPopup, setShowDiscountEndedPopup] = useState(false);
  
  // Mode selection: null = show buttons, 'free' = only video, 'buy' = full page
  const [pageMode, setPageMode] = useState<'free' | 'buy' | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showDelayedCta, setShowDelayedCta] = useState(false);
  
  // YouTube custom player for free mode
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const [ytPlaying, setYtPlaying] = useState(false);
  const [ytMuted, setYtMuted] = useState(false);
  const [ytVolume, setYtVolume] = useState(100);
  const [ytReady, setYtReady] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVideoAreaInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

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

  // Timer de 17 minutos para modo "free" + CTA após 1 minuto
  useEffect(() => {
    if (pageMode !== 'free') return;
    const timer = setTimeout(() => {
      setShowFullContent(true);
    }, 17 * 60 * 1000);
    const ctaTimer = setTimeout(() => {
      setShowDelayedCta(true);
      // Fire AddToCart event when CTA appears
      trackFacebookEvent('AddToCart', {
        content_name: 'MRO Renda Extra - CTA Delayed',
        content_category: 'Renda Extra',
        value: 300,
        currency: 'BRL'
      });
    }, 60 * 1000);
    return () => { clearTimeout(timer); clearTimeout(ctaTimer); };
  }, [pageMode]);

  // YouTube IFrame API for free mode
  useEffect(() => {
    if (pageMode !== 'free') return;
    
    // Load YouTube IFrame API
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const initPlayer = () => {
      if (!ytContainerRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player(ytContainerRef.current, {
        videoId: '5CE8W8bclJY',
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          playsinline: 1,
          vq: 'hd1080',
        },
        events: {
          onReady: (event: any) => {
            event.target.setPlaybackQuality('hd1080');
            setYtReady(true);
          },
          onStateChange: (event: any) => {
            setYtPlaying(event.data === (window as any).YT.PlayerState.PLAYING);
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (ytPlayerRef.current?.destroy) ytPlayerRef.current.destroy();
    };
  }, [pageMode]);

  const ytTogglePlay = useCallback(() => {
    if (!ytPlayerRef.current) return;
    if (ytPlaying) ytPlayerRef.current.pauseVideo();
    else ytPlayerRef.current.playVideo();
  }, [ytPlaying]);

  const ytToggleMute = useCallback(() => {
    if (!ytPlayerRef.current) return;
    if (ytMuted) { ytPlayerRef.current.unMute(); ytPlayerRef.current.setVolume(ytVolume || 100); setYtMuted(false); }
    else { ytPlayerRef.current.mute(); setYtMuted(true); }
  }, [ytMuted, ytVolume]);

  const ytChangeVolume = useCallback((val: number) => {
    if (!ytPlayerRef.current) return;
    setYtVolume(val);
    ytPlayerRef.current.setVolume(val);
    if (val === 0) { ytPlayerRef.current.mute(); setYtMuted(true); }
    else if (ytMuted) { ytPlayerRef.current.unMute(); setYtMuted(false); }
  }, [ytMuted]);

  const ytRestart = useCallback(() => {
    if (!ytPlayerRef.current) return;
    ytPlayerRef.current.seekTo(0, true);
    ytPlayerRef.current.playVideo();
  }, []);

  // Track PageView on mount + auto-enter free mode via URL param
  useEffect(() => {
    trackPageView('Sales Page - Renda Extra Oferta');
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'free') {
      setPageMode('free');
    }
  }, []);

  // Countdown de 7 horas - SEMPRE reinicia quando entra na página (NUNCA expira)
  useEffect(() => {
    const PROMO_DURATION = 7 * 60 * 60 * 1000;
    const promoEndTime = Date.now() + PROMO_DURATION;
    
    const updateCountdown = () => {
      const currentTime = Date.now();
      const diff = promoEndTime - currentTime;
      
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

  const shouldShowSalesContent = pageMode === 'buy' || (pageMode === 'free' && showFullContent);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <MoneyParticles />
      {/* Mode Selection Screen */}
      {pageMode === null && (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-xl w-full text-center">
            <img src={logoMro} alt="MRO" className="h-16 sm:h-20 md:h-28 mx-auto mb-6 sm:mb-8 object-contain" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Renda Extra com a MRO !
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mb-10">
              aprenda grátis e inicie você também.
            </p>
            
            <div className="flex flex-col gap-4 max-w-sm mx-auto">
              <Button
                onClick={() => setPageMode('free')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-base sm:text-lg py-6 rounded-xl shadow-lg shadow-green-500/30"
              >
                <Play className="w-5 h-5 mr-2" />
                Aprenda Grátis
              </Button>
              
              <Button
                onClick={() => window.location.href = '/descontoalunosrendaextra'}
                variant="outline"
                className="w-full border-2 border-green-500/50 text-green-400 hover:bg-green-500/10 font-bold text-sm sm:text-base py-6 rounded-xl"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Já conheço, gostaria de adquirir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page Content - only shown after mode selection */}
      {pageMode !== null && (
        <>
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

      {/* Urgency Banner - only when sales content visible */}
      {shouldShowSalesContent && (
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
      )}

      {/* Hero Section */}
      <section className={`relative ${shouldShowSalesContent ? 'pt-16 sm:pt-20 md:pt-24' : 'pt-8 sm:pt-12 md:pt-16'} pb-10 sm:pb-16 px-3 sm:px-4`}>
        <div className="max-w-5xl mx-auto text-center">
          {/* Special Discount Badge */}
          {shouldShowSalesContent && (
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 animate-bounce">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
            <span className="font-bold text-sm sm:text-lg">DESCONTO ESPECIAL LIBERADO!</span>
          </div>
          )}
          
          <img src={logoMro} alt="MRO" className="h-16 sm:h-20 md:h-28 mx-auto mb-6 sm:mb-8 object-contain" />
          
          {/* Animated Title */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 blur-3xl rounded-full" />
            <h1 className="relative text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black mb-2 sm:mb-3 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent px-2 leading-tight">
              Renda Extra com a MRO !
            </h1>
            <h2 className="relative text-base sm:text-lg md:text-2xl lg:text-3xl font-bold">
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
                aprenda grátis e inicie você também
              </span>
            </h2>
          </div>

          {/* Countdown Timer Large */}
          {shouldShowSalesContent && (
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
          )}

          {/* Main Video - Inline Player */}
          <div className="mt-8 sm:mt-10 max-w-4xl mx-auto">
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-green-500/30">
              <div className="aspect-video">
                {pageMode === 'free' ? (
                  <>
                    <div 
                      className="absolute inset-0 overflow-hidden cursor-pointer" 
                      onMouseMove={handleVideoAreaInteraction}
                      onMouseEnter={handleVideoAreaInteraction}
                      onMouseLeave={() => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); setShowControls(false); }}
                      onClick={() => { handleVideoAreaInteraction(); ytTogglePlay(); }}
                      onTouchStart={handleVideoAreaInteraction}
                    >
                      <div ref={ytContainerRef} className="absolute inset-0 w-full h-full" />
                    </div>
                    {/* Custom Controls Overlay */}
                    {ytReady && (
                      <div 
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 flex items-center gap-3 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        onMouseMove={handleVideoAreaInteraction}
                        onMouseEnter={handleVideoAreaInteraction}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={(e) => { e.stopPropagation(); ytTogglePlay(); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                          {ytPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                        </button>
                        <button onClick={ytToggleMute} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                          {ytMuted || ytVolume === 0 ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={ytMuted ? 0 : ytVolume}
                          onChange={(e) => ytChangeVolume(Number(e.target.value))}
                          className="w-20 sm:w-28 h-1 accent-white bg-white/30 rounded-full cursor-pointer"
                        />
                        <button onClick={ytRestart} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                          <RotateCcw className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <iframe 
                    src="https://www.youtube.com/embed/5CE8W8bclJY?rel=0&modestbranding=1" 
                    title="Video MRO"
                    className="w-full h-full" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                  />
                )}
              </div>
            </div>

            {/* Banner image below video in free mode */}
            {pageMode === 'free' && !showFullContent && (
              <div className="mt-6 sm:mt-8">
                <img 
                  src={rendaExtraMroBanner} 
                  alt="Renda Extra com a MRO - 5 mil mensal em casa em 20 minutos por dia" 
                  className="w-full max-w-2xl mx-auto rounded-xl shadow-lg"
                />
              </div>
            )}

            {/* Delayed CTA for free mode - appears after 1 minute */}
            {pageMode === 'free' && showDelayedCta && !showFullContent && (
              <div className="mt-6 sm:mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-gray-300 text-sm sm:text-base mb-3">
                  🔥 Gostaria de aproveitar o desconto e adquirir a ferramenta?
                </p>
                <Button
                  onClick={() => window.location.href = '/descontoalunosrendaextra'}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-sm sm:text-lg px-6 sm:px-10 py-5 sm:py-6 rounded-full shadow-lg shadow-green-500/30 animate-pulse"
                >
                  ADQUIRIR AGORA <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            )}
          </div>

          {/* CTA Button */}
          {shouldShowSalesContent && (
          <Button 
            onClick={scrollToPricing}
            className="mt-8 sm:mt-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-sm sm:text-lg px-6 sm:px-10 py-5 sm:py-6 rounded-full shadow-lg shadow-green-500/30"
          >
            GARANTIR MEU DESCONTO AGORA <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          )}
        </div>
      </section>

      {shouldShowSalesContent && (
      <>
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
      </>
      )}

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

      {/* WhatsApp Floating Button */}
      {shouldShowSalesContent && (
        <a
          href={`https://wa.me/${whatsappNumber}?text=Ol%C3%A1%20vim%20pelo%20site%20de%20Renda%20Extra%20gostaria%20de%20tirar%20algumas%20d%C3%BAvidas.`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat no WhatsApp"
          className="fixed bottom-6 right-6 z-[70] w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40 transition-transform hover:scale-110 animate-in zoom-in-50 duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
      </>
      )}
    </div>
  );
};

export default RendaExtraOf;
