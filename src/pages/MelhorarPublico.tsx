import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Target, Users, TrendingUp, Zap, Heart, UserPlus, Eye, Play, ArrowRight, Shield, Headphones } from "lucide-react";
import logoMetaMro from "@/assets/logo-meta-mro.png";
import publicoAlvoImg from "@/assets/publico-alvo.jpg";
import { trackPageView, trackInitiateCheckout } from "@/lib/facebookTracking";

const MelhorarPublico = () => {
  // Track PageView on page load
  useEffect(() => {
    trackPageView('MelhorarPublico');
  }, []);

  const annualFeatures = [
    "Ferramenta completa para Instagram",
    "Acesso a 4 contas simultâneas fixas",
    "5 testes todo mês para testar em seus clientes/outras contas",
    "Área de membros por 1 ano",
    "Vídeos estratégicos passo a passo",
    "Grupo VIP no WhatsApp",
    "Suporte prioritário"
  ];

  const lifetimeFeatures = [
    "Ferramenta completa para Instagram",
    "Acesso a 6 contas simultâneas fixas",
    "5 testes todo mês para testar em seus clientes/outras contas",
    "Área de membros VITALÍCIA",
    "Vídeos estratégicos passo a passo",
    "Grupo VIP no WhatsApp",
    "Suporte prioritário",
    "Atualizações gratuitas para sempre"
  ];

  const toolFeatures = [
    { icon: Heart, text: "Curtir fotos", color: "text-pink-400" },
    { icon: UserPlus, text: "Seguir contas", color: "text-blue-400" },
    { icon: Eye, text: "Curtir stories", color: "text-purple-400" },
    { icon: Play, text: "Curtir reels", color: "text-red-400" },
    { icon: Users, text: "Deixar de seguir contas", color: "text-orange-400" }
  ];

  const benefits = [
    {
      icon: Target,
      title: "Público Acertivo",
      description: "Indo até as pessoas em massa, acertamos o público e semelhantes na hora de anunciar"
    },
    {
      icon: TrendingUp,
      title: "Leads Mais Baratos",
      description: "Crie público em cima do engajamento orgânico no Meta Ads e pague muito menos por lead"
    },
    {
      icon: Users,
      title: "Leads do Concorrente",
      description: "Alcance o público do seu concorrente de forma orgânica e converta para você"
    },
    {
      icon: Zap,
      title: "Conversão de Verdade",
      description: "Conexão instantânea com algoritmo e aperfeiçoamento de público real"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Logo Meta + MRO */}
          <div className="flex justify-center mb-6">
            <img 
              src={logoMetaMro} 
              alt="Meta + MRO Inteligência" 
              className="h-20 md:h-28 object-contain"
            />
          </div>

          {/* Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
              <span className="text-yellow-400">Não Gaste</span> com anúncios
            </h1>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-300 mb-4">
              Sem antes usar a <span className="text-yellow-400">MRO inteligente</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
              Acerte de uma vez por todas o seu público!
            </p>
          </div>

          {/* YouTube Video */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative aspect-video rounded-2xl overflow-hidden border-4 border-yellow-500/30 shadow-2xl shadow-yellow-500/20">
              <iframe
                src="https://www.youtube.com/embed/EHTtdvtoI_A?rel=0&modestbranding=1"
                title="MRO Inteligente - Melhore seu Público"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>

          {/* Highlight Banner */}
          <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-500/30 to-yellow-500/20 border border-yellow-500/50 rounded-2xl p-6 md:p-8 text-center mb-12">
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
              Além de <span className="text-yellow-400 font-bold">seguidores</span>, <span className="text-yellow-400 font-bold">engajamento</span> e <span className="text-yellow-400 font-bold">público no automático</span>, 
              seus leads vão ficar <span className="text-yellow-400 font-bold">muito mais baratos</span> e <span className="text-yellow-400 font-bold">muito mais acertivos</span> usando a MRO Inteligente!
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-12">
            Por que usar a <span className="text-yellow-400">MRO Inteligente</span>?
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-yellow-500/50 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-xl">
                    <benefit.icon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-gray-400">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Value Proposition */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-2 border-yellow-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-6">
              Essa ferramenta vai trazer resultados ao ponto de quase não precisar investir em anúncios!
            </h3>
            <p className="text-lg text-gray-300 mb-6 max-w-3xl mx-auto">
              Ela mesma vai trazer clientes em potencial para você com <span className="text-yellow-400 font-semibold">engajamento orgânico automático no Instagram</span> - 
              seguidores o tempo todo no automático sem gastar com anúncios.
            </p>
            <p className="text-gray-400 max-w-3xl mx-auto">
              Após o engajamento vir da ferramenta, criamos público em cima do engajamento orgânico e real no Meta Ads, 
              onde vamos acertar o público de verdade!
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4">
            Como a ferramenta <span className="text-yellow-400">funciona</span>?
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            Interação com tempo randomizado - cada interação tem um tempo diferente, nunca é o mesmo. 
            Trabalha de <span className="text-yellow-400 font-semibold">7 a 8 horas por dia</span> no automático!
          </p>

          {/* Tool Features */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {toolFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 text-center hover:border-yellow-500/50 transition-all"
              >
                <feature.icon className={`w-8 h-8 mx-auto mb-2 ${feature.color}`} />
                <p className="text-sm text-gray-300">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl md:text-5xl font-black text-yellow-400 mb-2">200+</div>
              <p className="text-gray-300">Visitas novas por dia</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl md:text-5xl font-black text-yellow-400 mb-2">50-60</div>
              <p className="text-gray-300">Seguidores reais por dia</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl md:text-5xl font-black text-yellow-400 mb-2">7-8h</div>
              <p className="text-gray-300">Trabalhando no automático</p>
            </div>
          </div>
        </div>
      </section>

      {/* Público Alvo Section */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Image */}
            <div className="order-2 md:order-1">
              <img 
                src={publicoAlvoImg} 
                alt="Tá difícil acertar seu público-alvo? Resolva agora mesmo!" 
                className="w-full max-w-md mx-auto rounded-2xl shadow-2xl shadow-yellow-500/20 border-2 border-yellow-500/30"
              />
            </div>

            {/* Content */}
            <div className="order-1 md:order-2 text-center md:text-left">
              <h2 className="text-2xl md:text-4xl font-bold mb-6">
                Agora com a <span className="text-yellow-400">MRO Inteligente</span> você vai{" "}
                <span className="text-yellow-400">acertar o público de verdade!</span>
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                Chega de gastar dinheiro com anúncios que não convertem. 
                Com o engajamento orgânico da MRO, você vai criar uma base sólida de público real e interessado no seu negócio.
              </p>
              <div className="space-y-3">
                {[
                  "Público real e engajado",
                  "Leads qualificados e mais baratos",
                  "Conexão direta com o algoritmo do Meta",
                  "Menos gasto, mais resultado"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 justify-center md:justify-start">
                    <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-8">
            O que a ferramenta <span className="text-yellow-400">traz para você</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              "Seguidores reais",
              "Reações genuínas",
              "Comentários orgânicos",
              "Público do concorrente",
              "Engajamento real",
              "Algoritmo otimizado"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-gray-200">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl max-w-3xl mx-auto">
            <p className="text-lg text-gray-200">
              E no <span className="text-yellow-400 font-bold">Meta Ads</span>, se for rodar anúncio, vai conseguir criar um público em cima do 
              engajamento real e orgânico gerado pela ferramenta - uma <span className="text-yellow-400 font-bold">conexão instantânea com algoritmo</span> e 
              aperfeiçoamento de público!
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full px-4 py-2 mb-4">
              <Headphones className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">Suporte passo a passo via AnyDesk</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold">
              Escolha seu <span className="text-yellow-400">plano</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Plano Anual */}
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-blue-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl">
              <h3 className="text-2xl font-bold mb-2 text-center text-blue-400">Plano Anual</h3>
              <p className="text-gray-400 text-center mb-6 text-sm">Acesso completo por 12 meses</p>

              <div className="text-center mb-6">
                <div className="text-gray-500 line-through text-lg mb-1">De R$597</div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-white">12x</span>
                  <span className="text-4xl sm:text-5xl font-black text-blue-400">R$40</span>
                </div>
                <p className="text-gray-400 mt-2">ou <span className="text-white font-bold">R$397</span> à vista</p>
              </div>

              <div className="space-y-2 mb-6">
                {annualFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl hover:scale-105 transition-transform"
                onClick={() => {
                  trackInitiateCheckout('MelhorarPublico - Plano Anual', 397);
                  window.open('https://checkout.infinitepay.io/paguemro?items=[{"name":"MRO+ANUAL","price":39700,"quantity":1}]&redirect_url=https://maisresultadosonline.com.br/obrigado', '_blank');
                }}
              >
                GARANTIR PLANO ANUAL
              </Button>
            </div>

            {/* Plano Vitalício */}
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-amber-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/30">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black px-4 py-1.5 rounded-full whitespace-nowrap">
                  ⭐ MAIS POPULAR
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-2 text-center text-amber-400 mt-2">Plano Vitalício</h3>
              <p className="text-gray-400 text-center mb-6 text-sm">Acesso completo para sempre</p>

              <div className="text-center mb-6">
                <div className="text-gray-500 line-through text-lg mb-1">De R$997</div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-white">12x</span>
                  <span className="text-4xl sm:text-5xl font-black text-amber-400">R$81</span>
                </div>
                <p className="text-gray-400 mt-2">ou <span className="text-white font-bold">R$797</span> à vista</p>
              </div>

              <div className="space-y-2 mb-6">
                {lifetimeFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold py-4 rounded-xl hover:scale-105 transition-transform"
                onClick={() => {
                  trackInitiateCheckout('MelhorarPublico - Plano Vitalício', 797);
                  window.open('https://checkout.infinitepay.io/paguemro?items=[{"name":"MRO+VITALICIO","price":79700,"quantity":1}]&redirect_url=https://maisresultadosonline.com.br/obrigado', '_blank');
                }}
              >
                GARANTIR PLANO VITALÍCIO
              </Button>
            </div>
          </div>

          {/* Guarantee */}
          <div className="mt-8 flex items-center justify-center gap-3 text-gray-400">
            <Shield className="w-5 h-5 text-green-400" />
            <span>Pagamento 100% seguro via InfiniPay</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p className="font-semibold text-gray-400 mb-2">MRO - Mais Resultados Online</p>
          <p>Gabriel Fernandes da Silva</p>
          <p>CNPJ: 54.840.738/0001-96</p>
          <p className="mt-4">© 2024. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default MelhorarPublico;
