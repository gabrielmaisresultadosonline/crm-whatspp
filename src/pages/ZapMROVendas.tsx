import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Check, Shield, Zap, Users, Clock, Send, 
  Gift, Play, ChevronDown, Star, Phone, Bot, AudioLines,
  Calendar, Sparkles, Lock, RefreshCw, ArrowRight, X,
  Loader2, Mail, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trackPageView, trackInitiateCheckout } from '@/lib/facebookTracking';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PLANS = {
  annual: { name: "Anual", price: 397.00, days: 365, description: "Acesso por 1 ano" },
  lifetime: { name: "Vitalício", price: 797.00, days: 999999, description: "Acesso para sempre" },
};

const ZapMROVendas = () => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showBonusVideo, setShowBonusVideo] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  // Checkout modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "lifetime">("annual");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [loading, setLoading] = useState(false);

  // Track PageView on mount
  useEffect(() => {
    trackPageView('Sales Page - ZAPMRO WhatsApp');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Validar username: apenas letras minúsculas
  const validateUsername = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z]/g, "");
    setUsername(cleaned);

    if (value !== cleaned) {
      setUsernameError("Apenas letras minúsculas, sem espaços ou números");
      return;
    } else if (cleaned.length < 4) {
      setUsernameError("Mínimo de 4 caracteres");
      return;
    } else if (cleaned.length > 20) {
      setUsernameError("Máximo de 20 caracteres");
      return;
    }

    setUsernameError("");
  };

  // Criar checkout
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
      const plan = PLANS[selectedPlan];
      
      const { data: checkData, error: checkError } = await supabase.functions.invoke("create-zapmro-checkout", {
        body: { 
          email: email.toLowerCase().trim(),
          username: username.toLowerCase().trim(),
          phone: phone.replace(/\D/g, "").trim(),
          planType: selectedPlan,
          amount: plan.price,
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

      trackInitiateCheckout('ZAPMRO ' + plan.name, plan.price);
      
      // Save email for tracking on thank you page
      localStorage.setItem('mro_customer_email', email.toLowerCase().trim());
      
      window.location.href = checkData.payment_link;

    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const openCheckout = (plan: "annual" | "lifetime") => {
    setSelectedPlan(plan);
    setShowCheckoutModal(true);
  };

  const features = [
    { icon: Bot, title: 'Atendimento Automático', desc: 'Simule mais de 10 atendentes simultaneamente' },
    { icon: AudioLines, title: 'Áudios Personalizados', desc: 'Envie áudios como se fossem gravados na hora' },
    { icon: Send, title: 'Envio em Massa', desc: 'Até 200 contatos por dia sem bloqueio' },
    { icon: Zap, title: 'Respostas Rápidas', desc: 'Botões de resposta instantânea' },
    { icon: Calendar, title: 'Agendamento', desc: 'Programe mensagens para datas específicas' },
    { icon: Users, title: 'Fluxos Automáticos', desc: 'Funis de comunicação inteligentes' },
  ];

  const benefits = [
    { icon: Star, title: 'Custo-Benefício Inigualável', desc: 'Alta performance por um valor que cabe no seu bolso' },
    { icon: Bot, title: 'Automação Inteligente', desc: 'Mensagens em áudio, vídeo ou texto com um clique' },
    { icon: Zap, title: 'Respostas Instantâneas', desc: 'Gatilhos inteligentes que agilizam seu atendimento' },
    { icon: Shield, title: 'Proteção de Dados', desc: 'Não acessamos o conteúdo das suas conversas' },
    { icon: Sparkles, title: 'Simplicidade que Encanta', desc: 'Interface amigável para qualquer pessoa' },
    { icon: RefreshCw, title: 'Evolução Constante', desc: 'Atualizações frequentes e suporte especializado' },
  ];

  const planFeatures = [
    'Licença ativa por 365 dias',
    'Multiusuário: ilimitados números de WhatsApp',
    'Envios ilimitados',
    'Suporte via WhatsApp',
    'Área de Membros VIP',
    'Grupo VIP no WhatsApp',
    'Atualizações incluídas',
    'Garantia de 7 dias',
    'Suporte técnico remoto via AnyDesk',
  ];

  const faqs = [
    {
      q: 'Posso utilizar em quantos números de WhatsApp?',
      a: 'Nossa solução não impõe limites quanto ao número de contas do WhatsApp que podem ser utilizadas. Você pode integrar quantos números desejar à plataforma.'
    },
    {
      q: 'Funciona em dispositivos móveis?',
      a: 'Atualmente, nossa plataforma foi desenvolvida para operar em ambientes desktop, sendo compatível com computadores Windows, macOS e notebooks.'
    },
    {
      q: 'É necessário manter o computador ligado?',
      a: 'Sim, como nossa solução opera através do WhatsApp Web, é essencial manter o computador ativo para que o sistema funcione corretamente.'
    },
    {
      q: 'Qual é a duração do acesso ao sistema?',
      a: 'Oferecemos um plano de assinatura anual. Seu acesso será válido por 365 dias a partir da confirmação do pagamento.'
    },
    {
      q: 'É possível enviar áudios pré-gravados como se fossem em tempo real?',
      a: 'Sim, nossa plataforma possui funcionalidade avançada que permite o envio de áudios pré-gravados com a aparência de mensagens instantâneas.'
    },
    {
      q: 'Existe risco de bloqueio ao realizar envios em massa?',
      a: 'Nossa plataforma incorpora mecanismos inteligentes de distribuição que mantêm os envios dentro dos limites seguros (até 200 contatos por dia).'
    },
  ];

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-lg border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-green-400">ZAPMRO</span>
          </div>
          <Button 
            onClick={scrollToPricing}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
          >
            Garantir Acesso
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">A Ferramenta Definitiva para WhatsApp</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            Sua Nova Era no
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              WhatsApp Começa Aqui
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10">
            ZAPMRO: A ferramenta definitiva para quem quer <strong className="text-white">atender melhor</strong>, 
            <strong className="text-green-400"> vender mais</strong> e 
            <strong className="text-white"> nunca perder uma oportunidade</strong> no WhatsApp.
          </p>

          {/* Video Principal */}
          <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-green-500/20 border-2 border-green-500/30">
            <div className="aspect-video">
              <iframe
                src="https://www.youtube.com/embed/uzzA9i81AH0?rel=0&modestbranding=1"
                title="ZAPMRO Video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={scrollToPricing}
            size="lg"
            className="mt-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg px-10 py-7 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105"
          >
            Quero Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Features Carousel */}
      <section className="py-8 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-500/10 border-y border-green-500/20">
        <div className="overflow-hidden">
          <div className="flex animate-scroll gap-8 whitespace-nowrap">
            {[...features, ...features].map((feature, i) => (
              <div key={i} className="inline-flex items-center gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Recursos <span className="text-green-400">Poderosos</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Tudo que você precisa para revolucionar seu atendimento no WhatsApp
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="bg-gray-900/50 border border-gray-800 hover:border-green-500/50 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ZAPMRO Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Por que a <span className="text-green-400">ZAPMRO</span>?
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              A ZAPMRO vai muito além de uma simples ferramenta - somos seu aliado estratégico para revolucionar a comunicação com seus clientes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <div 
                key={i}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 hover:border-green-500/30 transition-colors"
              >
                <benefit.icon className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-3xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-green-400">BÔNUS EXCLUSIVO</span>
            </div>

            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              WhatsApp Extrator de Contatos
            </h3>

            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Exporta contatos em Vcard</p>
                    <p className="text-gray-400 text-sm">Rápido e prático</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Encontra números não salvos de grupos</p>
                    <p className="text-gray-400 text-sm">Amplie sua base de contatos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Uso ilimitado e vitalício</p>
                    <p className="text-gray-400 text-sm">Sem custos adicionais</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Estratégia para lotar seus grupos</p>
                    <p className="text-gray-400 text-sm">Aumente suas vendas</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                  <Gift className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-green-400">Incluído no seu plano</p>
                  <p className="text-gray-400 text-sm mt-2">Você receberá acesso completo a esta ferramenta</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-8 md:p-12">
            <Shield className="w-16 h-16 text-amber-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">7 Dias de Garantia</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Você tem <strong className="text-white">7 dias de garantia</strong> para cancelar sua compra com total tranquilidade. 
              Experimente sem riscos. Se não gostar, solicite o cancelamento e o reembolso total.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-12 md:py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Timer - Responsivo */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-red-500/10 border border-red-500/30 rounded-2xl sm:rounded-full px-4 sm:px-6 py-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <span className="text-red-400 font-bold text-sm sm:text-base">OFERTA EXPIRA EM:</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 font-mono text-xl sm:text-2xl font-bold">
                <span className="bg-red-500/20 px-2 sm:px-3 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-red-400">:</span>
                <span className="bg-red-500/20 px-2 sm:px-3 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-red-400">:</span>
                <span className="bg-red-500/20 px-2 sm:px-3 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-6 md:mb-10">
            <span className="text-green-400 font-bold text-base md:text-lg">PLANO ÚNICO</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-2">PLANO ANUAL</h2>
          </div>

          {/* Price Card - Responsivo */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-green-500/50 rounded-2xl md:rounded-3xl p-5 sm:p-8 md:p-12 shadow-2xl shadow-green-500/20">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Features - aparece primeiro no mobile */}
              <div className="space-y-3 md:space-y-4 order-2 md:order-1">
                {planFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm md:text-base">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Preço - aparece segundo no mobile */}
              <div className="flex flex-col items-center justify-center text-center order-1 md:order-2">
                <p className="text-gray-500 text-xs sm:text-sm mb-2 md:mb-4">ou R$397 à vista</p>
                
                <div className="mb-1 md:mb-2">
                  <span className="text-lg sm:text-2xl text-gray-400">12x de</span>
                </div>
                <div className="text-5xl sm:text-7xl md:text-8xl font-black text-green-400 mb-1">
                  R$41
                </div>
                <p className="text-base sm:text-xl text-gray-300 font-medium mb-4 md:mb-6">por mês</p>

                <Button 
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-base sm:text-xl py-5 sm:py-8 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105"
                  onClick={() => openCheckout("annual")}
                >
                  GARANTIR MEU ACESSO AGORA
                </Button>

                <p className="text-xs sm:text-sm text-gray-500 mt-3 md:mt-4 flex items-center gap-2">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                  Pagamento 100% seguro
                </p>
              </div>
            </div>

            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-700 text-center">
              <p className="text-green-400 font-medium text-sm md:text-base">
                ⚡ Acesso imediato: após o pagamento, você recebe seu acesso automaticamente no e-mail
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Dúvidas <span className="text-green-400">Frequentes</span>
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i}
                className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-green-400 transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-400">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Pronto para <span className="text-green-400">Revolucionar</span> seu WhatsApp?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Junte-se a milhares de empreendedores que já transformaram seu atendimento
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl px-12 py-8 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105"
            onClick={() => openCheckout("annual")}
          >
            GARANTIR MEU ACESSO AGORA <ArrowRight className="ml-2 w-6 h-6" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-500">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-green-400">ZAPMRO</span>
          </div>
          <p>Mais Resultados Online © 2024. Todos os direitos reservados.</p>
        </div>
      </footer>


      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-lg sm:text-xl">
              <span className="text-green-400">ZAPMRO</span> - Finalizar Compra
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCheckout} className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-gray-400">Plano Selecionado</p>
              <p className="text-xl sm:text-2xl font-bold text-green-400">
                {PLANS[selectedPlan].name} - R$ {PLANS[selectedPlan].price.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">ou 12x de R${(PLANS[selectedPlan].price / 12).toFixed(0)}</p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div>
                <label className="text-xs sm:text-sm text-gray-400 flex items-center gap-2 mb-1">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4" /> Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white h-10 sm:h-11 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-400 flex items-center gap-2 mb-1">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4" /> Celular com DDD
                </label>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white h-10 sm:h-11 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-400 flex items-center gap-2 mb-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" /> Usuário (será sua senha também)
                </label>
                <Input
                  type="text"
                  placeholder="seuusuario"
                  value={username}
                  onChange={(e) => validateUsername(e.target.value)}
                  className={`bg-gray-800 border-gray-700 text-white h-10 sm:h-11 text-sm sm:text-base ${usernameError ? "border-red-500" : ""}`}
                  required
                />
                {usernameError && (
                  <p className="text-red-400 text-xs mt-1">{usernameError}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">Apenas letras minúsculas, sem espaços</p>
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 sm:py-6 text-base sm:text-lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                "PAGAR AGORA"
              )}
            </Button>

            <p className="text-center text-xs text-gray-500">
              Pagamento seguro via InfiniPay
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSS for scroll animation */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ZapMROVendas;
