import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackFacebookEvent, trackInitiateCheckout, trackPageView, trackPurchase } from "@/lib/facebookTracking";
import logoMro from "@/assets/logo-mro-white.png";
import {
  CheckCircle2,
  Shield,
  ArrowRight,
  Loader2,
  X,
  Mail,
  User,
  Phone,
  CreditCard,
  Sparkles,
  Zap,
  Target,
  Clock,
  Mic,
} from "lucide-react";

const RendaExt = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [nsuOrder, setNsuOrder] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    email: "",
    whatsapp: "",
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio("/audio_renda.ogg"));
  const trackedPercents = useRef(new Set<number>());

  useEffect(() => {
    const handleTimeUpdate = () => {
      if (!audio.duration) return;
      const progress = (audio.currentTime / audio.duration) * 100;
      
      const milestone = [25, 50, 75, 100].find(m => progress >= m && !trackedPercents.current.has(m));
      if (milestone) {
        trackedPercents.current.add(milestone);
        trackAudioEvent(milestone);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", () => setIsPlaying(false));
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, [audio]);

  const trackAudioEvent = async (percent: number) => {
    try {
      const email = formData.email || "anonymous";
      
      // Track in events table
      await supabase.from("rendaext_audio_events").insert({
        email: email,
        percent: percent
      });

      // Update lead record if email is present
      if (email !== "anonymous") {
        await supabase
          .from("rendaext_leads")
          .update({ 
            audio_listened_percent: percent,
            audio_listened_at: new Date().toISOString()
          })
          .eq("email", email.toLowerCase().trim());
      }
      
      // Track on Facebook
      trackFacebookEvent("AudioEngagement", {
        content_name: "Renda Extra Audio",
        content_category: `Listen ${percent}%`,
        value: percent
      });
    } catch (err) {
      console.error("Error tracking audio event:", err);
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    supabase.from("rendaext_analytics").insert({
      event_type: "page_view",
      source_url: window.location.href,
      user_agent: navigator.userAgent,
    }).then(() => {});
    
    // Track PageView on FB - accurate real tracking
    trackPageView("Renda Extra");
  }, []);

  // Auto-verify if returning from InfiniPay redirect (?paid=1&nsu=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nsu = params.get("nsu");
    if (params.get("paid") === "1" && nsu) {
      setNsuOrder(nsu);
      setPaymentCreated(true);
      void verifyPayment(nsu, true);
    }
  }, []);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomeCompleto.trim()) {
      toast.error("Informe seu nome completo");
      return;
    }
    if (!isValidEmail(formData.email)) {
      toast.error("Email inválido");
      return;
    }
    if (formData.whatsapp.replace(/\D/g, "").length < 10) {
      toast.error("WhatsApp inválido");
      return;
    }

    setLoading(true);
    try {
      // Track InitiateCheckout on Facebook
      trackInitiateCheckout("Renda Extra - Aula", 19.90);
      
      // Save email for the thank you page tracking
      localStorage.setItem("mro_customer_email", formData.email.toLowerCase().trim());


      const { data, error } = await supabase.functions.invoke("rendaext-checkout", {
        body: {
          nome_completo: formData.nomeCompleto.trim(),
          email: formData.email.toLowerCase().trim(),
          whatsapp: formData.whatsapp.replace(/\D/g, "").trim(),
        },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "Erro ao gerar pagamento");
        return;
      }
      setNsuOrder(data.nsu_order);
      setPaymentLink(data.payment_link);
      setPaymentCreated(true);
      // Open payment in new tab
      window.open(data.payment_link, "_blank");
      toast.success("Link de pagamento gerado! Após pagar, clique em 'Já paguei'.");
    } catch (err) {
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (nsu?: string, silent = false) => {
    const orderNsu = nsu || nsuOrder;
    if (!orderNsu) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("rendaext-verify-payment", {
        body: { nsu_order: orderNsu },
      });
      if (error || !data?.success) {
        if (!silent) toast.error("Erro ao verificar pagamento");
        return;
      }
      if (data.paid) {
        toast.success("Pagamento confirmado! Redirecionando...");
        window.location.href = "/rendaext/obrigado";
      } else if (!silent) {

        toast.info("Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente.");
      }
    } catch (_e) {
      if (!silent) toast.error("Erro ao verificar");
    } finally {
      setVerifying(false);
    }
  };

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] relative overflow-hidden flex items-center justify-center p-4">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="max-w-lg w-full text-center space-y-6 relative z-10 animate-fade-in">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-8 md:p-12 rounded-[2.5rem] border border-green-500/20 backdrop-blur-2xl shadow-2xl shadow-green-500/5">
            <div className="relative inline-block mb-6">
              <CheckCircle2 className="w-20 h-20 text-green-400 relative z-10" />
              <div className="absolute inset-0 bg-green-400 blur-2xl opacity-20 animate-pulse" />
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
              Pagamento Confirmado!
            </h1>
            <p className="text-gray-300 text-lg mb-2 font-medium">
              Enviamos o <strong>passo a passo</strong> completo no seu email:
            </p>
            <p className="text-green-400 font-mono font-bold text-lg mb-6 break-all bg-green-400/10 py-2 px-4 rounded-xl border border-green-400/20">
              {formData.email}
            </p>
            <p className="text-gray-400 text-sm">
              Verifique também sua caixa de SPAM/Promoções. Aplique HOJE mesmo!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-5%] w-[50%] h-[50%] bg-yellow-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] bg-orange-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 relative z-10">
        {/* Header/Logo */}
        <div className="flex justify-center mb-12 animate-fade-down">
          <div className="relative group">
            <div className="absolute -inset-4 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
            <img src={logoMro} alt="MRO" className="h-14 md:h-20 relative z-10 transition-transform duration-500 group-hover:scale-105" />
          </div>
        </div>

        <div className="text-center space-y-8 mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 px-5 py-2.5 rounded-full backdrop-blur-md animate-fade-in">
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-yellow-400 text-xs md:text-sm font-display font-bold uppercase tracking-widest">Oferta Exclusiva - Renda Extra</span>
          </div>

          {/* Hero section was moved below */}

          <h1 className="text-4xl md:text-7xl font-display font-black leading-[1.1] tracking-tighter animate-fade-up">
            FATURE MAIS DE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-[length:200%_auto] animate-shimmer drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
              5 MIL REAIS
            </span> <br />
            COM A MRO!
          </h1>

          <div className="relative max-w-xl mx-auto animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/50 to-orange-500/50 rounded-2xl blur opacity-25" />
            <div className="relative bg-[#1a0b0b] border border-red-500/30 p-5 rounded-2xl backdrop-blur-xl">
              <p className="text-red-400 font-display font-black text-xl uppercase tracking-wider mb-1 flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" /> NÃO É CURSO É FERRAMENTA!
              </p>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                Esqueça aulas teóricas. É uma ferramenta <strong>automática</strong> desenhada para gerar faturamento real superior a 5 mil reais mensais.
              </p>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "200ms" }}>
            <p className="text-lg md:text-2xl text-gray-300 leading-relaxed">
              <span className="text-white font-semibold block mb-2">Desbloqueie o método validado por mais de 1700 empreendedores!</span>
            </p>

            <div className="flex flex-col items-center gap-2">
              <p className="text-gray-400 text-sm uppercase tracking-[0.2em] font-medium">Investimento Único</p>
              <div className="flex items-baseline gap-2">
                <span className="text-gray-400 text-xl">R$</span>
                <span className="text-5xl md:text-7xl font-display font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.2)]">19,90</span>
              </div>
            </div>
          </div>

          {/* Audio/Image Section */}
          <div className="relative max-w-lg mx-auto mt-20 mb-20 md:mb-24 group cursor-pointer animate-fade-up" onClick={toggleAudio}>
            <div className="absolute -inset-4 bg-red-600/20 rounded-[2.5rem] blur-2xl group-hover:bg-red-600/30 transition-colors" />
            <div className="relative flex flex-col items-center">
              <img 
                src="https://maisresultadosonline.com.br/assets/renda-extra-hero-DfDrjZ5D.png" 
                alt="Renda Extra" 
                className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Overlapping Button and Waveform - Now in flow to prevent overlap issues */}
              <div className="-mt-12 md:-mt-16 flex flex-col items-center gap-4 md:gap-6 z-20 relative">
                {/* Standalone Audio Waveform (Transparent background) */}
                <div className="flex items-end justify-center gap-1 md:gap-1.5 h-12 md:h-16 px-4">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 md:w-1.5 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                      style={{
                        height: isPlaying ? '100%' : '15%',
                        animation: isPlaying 
                          ? `waveform 0.5s ease-in-out infinite alternate ${i * 0.07}s` 
                          : 'none',
                        opacity: 0.7 + (Math.random() * 0.3)
                      }}
                    />
                  ))}
                </div>

                <Button className="bg-red-600 hover:bg-red-700 text-white font-display font-black px-8 py-6 md:px-12 md:py-10 text-xl md:text-4xl rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.8)] flex items-center gap-3 md:gap-4 transition-all hover:scale-110 active:scale-95 border-2 border-white/20 backdrop-blur-md">
                  <Mic className={`w-8 h-8 md:w-12 md:h-12 ${isPlaying ? 'animate-pulse text-yellow-400' : ''}`} />
                  <span>OUÇA AGORA..</span>
                </Button>
              </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes waveform {
                0% { height: 20%; transform: scaleY(1); }
                100% { height: 100%; transform: scaleY(1.3); }
              }
            `}} />
          </div>

          {/* Badges Section */}
          <div className="flex flex-wrap justify-center gap-4 text-xs md:text-sm animate-fade-up mt-12 md:mt-16 relative z-10" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 pl-2 pr-4 py-2 rounded-full hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="font-medium">Acesso imediato</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 pl-2 pr-4 py-2 rounded-full hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-medium">Via Email</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 pl-2 pr-4 py-2 rounded-full hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-400" />
              </div>
              <span className="font-medium">Pagamento Seguro</span>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16 animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="group bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-md hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target className="w-7 h-7 text-yellow-400" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">Método Validado</h3>
            <p className="text-gray-400 leading-relaxed">Mais de 1.700 pessoas já estão utilizando a ferramenta MRO para transformar seus resultados.</p>
          </div>
          <div className="group bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-md hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">100% Automático</h3>
            <p className="text-gray-400 leading-relaxed">Instalação simplificada. A ferramenta trabalha por você enquanto você foca no que importa.</p>
          </div>
        </div>

        {/* CTA Card */}
        <div className="relative animate-fade-up" style={{ animationDelay: "500ms" }}>
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-[2.5rem] blur opacity-20" />
          <div className="relative bg-gradient-to-br from-[#1a1f35] to-[#0a0f1a] border border-white/10 rounded-[2.5rem] p-10 md:p-16 text-center shadow-3xl overflow-hidden">
            {/* Inner background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-yellow-500/5 blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
              <p className="text-gray-400 text-sm uppercase tracking-[0.3em] font-bold mb-6">Comece agora por apenas</p>
              
              <div className="flex items-center justify-center gap-3 mb-10">
                <span className="text-gray-500 text-3xl font-medium">R$</span>
                <span className="text-7xl md:text-9xl font-display font-black text-white tracking-tighter">
                  19,<span className="text-yellow-400">90</span>
                </span>
              </div>

              <Button
                onClick={() => {
                  setShowForm(true);
                  trackInitiateCheckout("Renda Extra - Aula", 19.90);
                }}
                className="group relative w-full md:w-auto bg-green-600 hover:bg-yellow-400 text-white hover:text-black font-display font-black text-xl md:text-2xl px-12 py-8 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  LIBERAR MEU ACESSO
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine-fast pointer-events-none" />
              </Button>

              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 text-gray-500">
                  <div className="h-[1px] w-8 bg-white/10" />
                  <span className="text-xs uppercase tracking-widest font-bold">Pagamento Seguro</span>
                  <div className="h-[1px] w-8 bg-white/10" />
                </div>
                <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                  <Clock className="w-5 h-5 text-white" />
                  <Shield className="w-5 h-5 text-white" />
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-[#0d121f] rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
            <button
              onClick={() => {
                setShowForm(false);
                setPaymentCreated(false);
                setNsuOrder("");
                setPaymentLink("");
              }}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {!paymentCreated ? (
              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="text-center mb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[1.25rem] flex items-center justify-center mb-4 rotate-3 shadow-lg shadow-yellow-500/20">
                    <CreditCard className="w-8 h-8 text-black" />
                  </div>
                  <h2 className="text-3xl font-display font-black text-white">Cadastro</h2>
                  <p className="text-gray-400 text-sm mt-1">Preencha os dados para liberação</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                      <User className="w-3 h-3" /> Nome completo
                    </label>
                    <Input
                      value={formData.nomeCompleto}
                      onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-14 rounded-xl focus:border-yellow-500/50 transition-all px-5"
                      placeholder="Seu nome aqui"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email de Acesso
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-14 rounded-xl focus:border-yellow-500/50 transition-all px-5"
                      placeholder="seu@melhoremail.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                      <Phone className="w-3 h-3" /> WhatsApp
                    </label>
                    <Input
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-14 rounded-xl focus:border-yellow-500/50 transition-all px-5"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>

                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Valor total</div>
                    <div className="text-gray-400 text-sm">Acesso Vitalício</div>
                  </div>
                  <div className="text-3xl font-display font-black text-yellow-400">R$ 19,90</div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-display font-black py-8 rounded-xl text-lg shadow-xl shadow-yellow-500/10 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      PROCESSANDO...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      GERAR PAGAMENTO
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-gray-600 text-center uppercase tracking-tighter">
                  🔒 Conexão criptografada e segura via SSL
                </p>
              </form>
            ) : (
              <div className="space-y-8 py-4">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-3xl font-display font-black text-white">Quase lá!</h2>
                  <p className="text-gray-400 text-sm mt-2">Conclua o pagamento na aba aberta</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Código do Pedido</div>
                  <div className="font-mono text-yellow-400 text-sm break-all bg-black/30 p-3 rounded-lg border border-white/5">
                    {nsuOrder}
                  </div>
                </div>

                <div className="space-y-3">
                  {paymentLink && (
                    <Button
                      onClick={() => window.open(paymentLink, "_blank")}
                      className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-display font-black py-6 rounded-xl transition-all"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      ABRIR PAGAMENTO
                    </Button>
                  )}

                  <Button
                    onClick={() => verifyPayment()}
                    disabled={verifying}
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/5 py-6 rounded-xl font-bold"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        VERIFICANDO...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        JÁ PAGUEI, VERIFICAR
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/5">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                    Acesso automático após aprovação
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RendaExt;
