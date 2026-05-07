import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Camera, Wand2, Star, CheckCircle, ArrowRight, Users, Zap, Shield, Crown, Image, Layers, TrendingUp, Heart, LogIn, Loader2 } from "lucide-react";
import promptsAreaPreview from "@/assets/prompts-area-preview.png";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const PromptsMRO = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !password || !phone) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password.length < 4) {
      toast.error("A senha deve ter pelo menos 4 caracteres");
      return;
    }
    setIsRegistering(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/prompts-mro-auth?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Erro ao criar conta");
        setIsRegistering(false);
        return;
      }
      sessionStorage.setItem("prompts_mro_user", JSON.stringify(data.user));
      toast.success(`Bem-vindo(a), ${data.user.name}!`);
      navigate("/prompts/dashboard");
    } catch {
      toast.error("Erro ao conectar ao servidor");
    }
    setIsRegistering(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prompts-mro-auth?action=login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        }
      );
      const result = await res.json();
      if (!res.ok || result.error) {
        toast.error(result.error || "Erro ao fazer login");
        return;
      }
      sessionStorage.setItem("prompts_mro_user", JSON.stringify(result.user));
      toast.success(`Bem-vindo(a), ${result.user.name}!`);
      navigate("/prompts/dashboard");
    } catch {
      toast.error("Erro ao conectar ao servidor");
    } finally {
      setIsLogging(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={() => setShowLogin(false)}>
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-1">Entrar na Área</h2>
            <p className="text-gray-400 text-sm mb-6">Acesse seus prompts exclusivos</p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" placeholder="Seu e-mail" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              <input type="password" placeholder="Sua senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              <button type="submit" disabled={isLogging} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-lg disabled:opacity-50">{isLogging ? "Entrando..." : "Entrar"}</button>
            </form>
            <button onClick={() => setShowLogin(false)} className="w-full mt-4 text-gray-500 text-sm hover:text-white transition-colors">Fechar</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#050508]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-lg">PROMPTS <span className="text-purple-400">MRO</span></span>
          </div>
          <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 text-sm font-medium transition-colors">
            <LogIn className="w-4 h-4" />
            Entrar
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 md:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 via-pink-600/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-60 h-60 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-5 py-2.5 mb-8">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-purple-200 font-medium">+1000 Prompts Profissionais</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
            Gere Fotos <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">Incríveis</span> com IA
          </h1>

          {/* Video */}
          <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/20 aspect-video mb-10">
            <iframe
              src="https://www.youtube.com/embed/btICOskVlhY"
              title="Prompts MRO"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          <p className="text-xl md:text-2xl text-gray-300 mb-3 font-medium">
            A maior área de prompts para gerar suas fotos com qualidade profissional.
          </p>
          <p className="text-gray-500 mb-10 max-w-xl mx-auto text-lg">
            Feminino e masculino. 100% atualizados. Cadastre-se e comece a gerar agora.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button onClick={scrollToForm} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-purple-600/30">
              QUERO ACESSAR AGORA
              <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => setShowLogin(true)} className="px-8 py-4 rounded-2xl border border-white/10 hover:border-purple-500/50 font-medium text-gray-300 hover:text-white transition-colors">
              Já tenho conta
            </button>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>+500 usuários</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-700" />
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-pink-400" />
              <span>+1000 prompts</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-700" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>Atualizado diariamente</span>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After showcase */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona?</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Simples: copie o prompt, cole na sua IA preferida e gere fotos profissionais em segundos.</p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Escolha o Prompt", desc: "Navegue pelas categorias e encontre o prompt ideal para o que você precisa.", icon: Layers },
            { step: "02", title: "Copie e Cole", desc: "Copie o prompt pronto e cole no Google Gemini (Nano Banana) que é 100% GRÁTIS, ou em outras IAs como ChatGPT, Midjourney, etc.", icon: Zap },
            { step: "03", title: "Foto Pronta!", desc: "Receba uma foto profissional de alta qualidade pronta para usar.", icon: Camera },
          ].map((item, i) => (
            <div key={i} className="relative bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] rounded-2xl p-8 text-center group hover:border-purple-500/30 transition-all">
              <div className="text-5xl font-black text-purple-500/10 absolute top-4 right-4">{item.step}</div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-purple-500/20 transition-colors">
                <item.icon className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-bold text-xl mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Area Preview */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Veja como é a área por dentro</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">Uma interface moderna com centenas de prompts organizados e prontos para copiar</p>
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/20">
            <img src={promptsAreaPreview} alt="Prévia da área de prompts MRO" className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 bg-gradient-to-b from-purple-900/5 via-transparent to-transparent">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Categorias de Prompts</h2>
          <p className="text-gray-400 text-lg">Prompts organizados para você encontrar exatamente o que precisa</p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "👩", label: "Feminino", count: "400+" },
            { icon: "👨", label: "Masculino", count: "400+" },
            { icon: "📸", label: "Perfil Pro", count: "100+" },
            { icon: "🏢", label: "Corporativo", count: "80+" },
            { icon: "🌅", label: "Cenários", count: "60+" },
            { icon: "🛍️", label: "E-commerce", count: "50+" },
            { icon: "🎨", label: "Artístico", count: "40+" },
            { icon: "✨", label: "Tendências", count: "Novo!" },
          ].map((cat, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center hover:border-purple-500/30 hover:bg-white/[0.05] transition-all cursor-default">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <h3 className="font-bold mb-1">{cat.label}</h3>
              <span className="text-xs text-purple-400 font-medium">{cat.count} prompts</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Camera, title: "Fotos Profissionais", desc: "Prompts otimizados para gerar fotos realistas e de alta qualidade com qualquer IA." },
            { icon: Wand2, title: "Super Fácil de Usar", desc: "Copie e cole direto na IA. Sem configuração, sem complicação. Resultados imediatos." },
            { icon: Star, title: "Sempre Atualizado", desc: "Novos prompts adicionados frequentemente. A área mais completa e atualizada do Brasil." },
            { icon: Shield, title: "Acesso Imediato", desc: "Cadastre-se e acesse instantaneamente todos os prompts. Sem espera, sem aprovação." },
            { icon: Heart, title: "Feminino & Masculino", desc: "Centenas de prompts específicos para fotos femininas e masculinas de alta qualidade." },
            { icon: Layers, title: "+1000 Prompts", desc: "A maior biblioteca de prompts de fotos profissionais do Brasil reunida em um só lugar." },
          ].map((f, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 hover:border-purple-500/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits checklist */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">
            O que você vai receber
          </h2>
          <div className="space-y-3 text-left">
            {[
              "Acesso a +1000 prompts profissionais organizados por categoria",
              "Prompts para fotos femininas de alta qualidade",
              "Prompts para fotos masculinas profissionais",
              "Prompts para fotos de perfil, corporativo e e-commerce",
              "Cenários e fundos criativos exclusivos",
              "Atualizações constantes com novos prompts",
              "Área fácil de usar — copie, cole e gere",
              "Suporte e comunidade exclusiva",
              "Acesso anual a todos os prompts",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl px-5 py-4 hover:border-green-500/20 transition-colors">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-gray-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Form */}
      <section id="cadastro" className="py-24 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-b from-[#111118] to-[#0a0a10] border border-purple-500/20 rounded-3xl p-8 md:p-10 text-center shadow-2xl shadow-purple-900/20">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300 font-medium">Acesso Imediato</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black mb-3">
              Cadastre-se <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Agora</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">Plano Mensal</div>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-3xl font-black text-white">R$47</span>
                  <span className="text-gray-400 text-xs">/mês</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">30 dias de acesso</div>
              </div>
              <div className="bg-gradient-to-b from-purple-500/20 to-pink-500/10 border-2 border-purple-500/40 rounded-2xl p-4 text-center relative">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">MELHOR</div>
                <div className="text-xs text-gray-400 mb-1">Plano Anual</div>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-3xl font-black text-white">R$97</span>
                  <span className="text-gray-400 text-xs">/ano</span>
                </div>
                <div className="text-[10px] text-green-400 mt-1">365 dias • Economia!</div>
              </div>
            </div>

            <p className="text-gray-400 mb-6 text-sm">Crie sua conta grátis e teste os prompts. Desbloqueie o acesso completo escolhendo seu plano.</p>

            <form onSubmit={handleRegister} className="space-y-3 text-left">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Nome completo</label>
                <input type="text" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">E-mail</label>
                <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Senha</label>
                <input type="password" placeholder="Crie uma senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">WhatsApp</label>
                <input type="tel" placeholder="(11) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <button type="submit" disabled={isRegistering} className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-purple-600/25 mt-4 disabled:opacity-50">
                {isRegistering ? <><Loader2 className="w-5 h-5 animate-spin" /> Criando conta...</> : <>QUERO ACESSAR OS PROMPTS <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>

            <p className="text-xs text-gray-600 mt-4">Ao se cadastrar, você concorda com nossos termos de uso.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {[
              { q: "Como funciona o Prompts MRO?", a: "Você se cadastra, acessa a área de membros e encontra centenas de prompts organizados por categoria. Basta copiar o prompt e colar na IA de geração de imagens. Comece grátis com 5 cópias e desbloqueie o acesso completo escolhendo o plano Mensal (R$47/mês) ou Anual (R$97/ano)." },
              { q: "Preciso saber usar IA para gerar fotos?", a: "Não! Os prompts são prontos para copiar e colar. É super fácil e qualquer pessoa consegue usar, mesmo sem experiência com IA." },
              { q: "Os prompts funcionam em qual IA?", a: "Nossos prompts funcionam no Google Gemini (Nano Banana) que é 100% GRÁTIS, e também no ChatGPT (DALL-E), Midjourney, Leonardo AI, Stable Diffusion e outras IAs de geração de imagens." },
              { q: "Os prompts são atualizados?", a: "Sim! Adicionamos novos prompts frequentemente e atualizamos os existentes para garantir resultados cada vez melhores." },
              { q: "Tem prompts femininos e masculinos?", a: "Sim! Temos mais de 400 prompts femininos e 400 masculinos, além de categorias como corporativo, e-commerce, cenários e muito mais." },
              { q: "Quais são os planos disponíveis?", a: "Temos dois planos: Mensal por R$47/mês (30 dias de acesso) e Anual por R$97/ano (365 dias de acesso). Você começa com 5 cópias gratuitas para testar antes de escolher seu plano." },
              { q: "Preciso pagar para usar?", a: "Não! Você pode se cadastrar gratuitamente e testar 5 prompts. Só paga quando quiser acesso ilimitado a todos os +1000 prompts." },
            ].map((item, i) => (
              <details key={i} className="group bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors">
                  <span className="font-medium text-gray-200">{item.q}</span>
                  <span className="text-purple-400 text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-4 text-gray-400 text-sm leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center border-t border-white/5">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="font-bold">PROMPTS MRO</span>
        </div>
        <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Prompts MRO — Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default PromptsMRO;
