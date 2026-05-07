import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, LogOut, Copy, Check, Search, Image, Filter, Lock, CreditCard, Loader2, AlertTriangle, CheckCircle, Play, X, ExternalLink, Scissors, ArrowLeft } from "lucide-react";
import ImageCropEditor from "@/components/ImageCropEditor";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface PromptItem {
  id: string;
  folder_name: string;
  prompt_text: string;
  image_url: string | null;
  category: string | null;
  order_index: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  copies_count: number;
  copies_limit: number;
  is_paid: boolean;
  days_remaining?: number | null;
  subscription_end?: string | null;
}

const PromptsMRODashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHowToGenerate, setShowHowToGenerate] = useState(false);
  // Paywall state
  const [blocked, setBlocked] = useState(false);
  const [copiesCount, setCopiesCount] = useState(0);
  const [copiesLimit, setCopiesLimit] = useState(5);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"prompts" | "editar">("prompts");

  // Check session
  useEffect(() => {
    const saved = sessionStorage.getItem("prompts_mro_user");
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setCopiesCount(parsed.copies_count || 0);
      setCopiesLimit(parsed.copies_limit || 5);
      setIsPaid(parsed.is_paid || false);
      setBlocked(!parsed.is_paid && (parsed.copies_count || 0) >= (parsed.copies_limit || 5));
      if (parsed.days_remaining != null) setDaysRemaining(parsed.days_remaining);
    }
  }, []);

  // Load prompts when user is logged in
  useEffect(() => {
    if (user) {
      loadPrompts();
      refreshUserStatus();
    }
  }, [user?.id]);

  // Auto-check payment every 15 seconds when blocked and payment link exists
  useEffect(() => {
    if (!blocked || !paymentLink || isPaid || !user) return;
    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [blocked, paymentLink, isPaid, user?.id]);

  const callAuth = async (action: string, body: Record<string, unknown>) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/prompts-mro-auth?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const refreshUserStatus = async () => {
    if (!user) return;
    const data = await callAuth("user-status", { user_id: user.id });
    if (data.error) return;
    setCopiesCount(data.copies_count);
    setCopiesLimit(data.copies_limit);
    setIsPaid(data.is_paid);
    setBlocked(data.blocked);
    if (data.days_remaining != null) setDaysRemaining(data.days_remaining);
    const updated = { ...user, copies_count: data.copies_count, copies_limit: data.copies_limit, is_paid: data.is_paid, days_remaining: data.days_remaining, subscription_end: data.subscription_end };
    setUser(updated);
    sessionStorage.setItem("prompts_mro_user", JSON.stringify(updated));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/prompts-mro-auth?action=login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        }
      );
      const result = await res.json();
      if (!res.ok || result.error) {
        toast.error(result.error || "Erro ao fazer login");
        return;
      }
      setUser(result.user);
      setCopiesCount(result.user.copies_count || 0);
      setCopiesLimit(result.user.copies_limit || 5);
      setIsPaid(result.user.is_paid || false);
      setBlocked(!result.user.is_paid && (result.user.copies_count || 0) >= (result.user.copies_limit || 5));
      sessionStorage.setItem("prompts_mro_user", JSON.stringify(result.user));
      toast.success(`Bem-vindo(a), ${result.user.name}!`);
    } catch {
      toast.error("Erro ao conectar ao servidor");
    } finally {
      setIsLogging(false);
    }
  };

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/prompts-mro-auth?action=get-prompts`,
        { headers: { apikey: SUPABASE_KEY } }
      );
      const result = await res.json();
      setPrompts(result.prompts || []);
    } catch {
      toast.error("Erro ao carregar prompts");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    if (!user) return;

    if (blocked && !isPaid) return;

    const sufixoPrompt = "\n\nGere a imagem com o mesmo rosto, mesma fisionomia que estou enviando sem mudar nada, cor do cabelo estilo do cabelo o mesmo da foto não crie nada diferente do rosto o resto e os traços precisam ser os mesmos.. gere a imagem agora.";
    navigator.clipboard.writeText(text + sufixoPrompt);
    setCopiedId(id);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopiedId(null), 2000);

    // Track the copy if not paid
    if (!isPaid) {
      const data = await callAuth("track-copy", { user_id: user.id });
      if (data.success) {
        setCopiesCount(data.copies_count);
        setBlocked(data.blocked);
        const updated = { ...user, copies_count: data.copies_count };
        setUser(updated);
        sessionStorage.setItem("prompts_mro_user", JSON.stringify(updated));
        
        if (data.blocked) {
          toast.error("Limite de cópias gratuitas atingido! Desbloqueie o acesso completo.");
        } else if (data.copies_count >= (data.copies_limit - 2)) {
          toast("⚠️ Você tem apenas " + (data.copies_limit - data.copies_count) + " cópias gratuitas restantes");
        }
      }
    }
  };

  const handleCreatePayment = async (planType: 'monthly' | 'annual') => {
    if (!user) return;
    setCreatingPayment(true);
    try {
      const data = await callAuth("create-payment", { user_id: user.id, plan_type: planType });
      if (data.success && data.payment_link) {
        setPaymentLink(data.payment_link);
        window.open(data.payment_link, "_blank");
      } else {
        toast.error("Erro ao gerar link de pagamento");
      }
    } catch {
      toast.error("Erro ao conectar");
    } finally {
      setCreatingPayment(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!user) return;
    setCheckingPayment(true);
    try {
      const data = await callAuth("check-payment", { user_id: user.id });
      if (data.is_paid) {
        setIsPaid(true);
        setBlocked(false);
        setPaymentLink(null);
        if (data.days_remaining != null) setDaysRemaining(data.days_remaining);
        const updated = { ...user, is_paid: true, days_remaining: data.days_remaining };
        setUser(updated);
        sessionStorage.setItem("prompts_mro_user", JSON.stringify(updated));
        toast.success("🎉 Pagamento confirmado! Acesso liberado por 1 ano!");
      }
    } catch { /* silent */ }
    finally { setCheckingPayment(false); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("prompts_mro_user");
    setUser(null);
    setPrompts([]);
    setBlocked(false);
    setPaymentLink(null);
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.folder_name.toLowerCase().includes(search.toLowerCase()) || p.prompt_text.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || (p.category || "geral") === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "Todos", icon: "🌐" },
    { value: "feminino", label: "Feminino", icon: "👩" },
    { value: "masculino", label: "Masculino", icon: "👨" },
    { value: "geral", label: "Geral", icon: "🎯" },
    { value: "empresarial", label: "Empresarial", icon: "🏢" },
  ];

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-600/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-[#111118] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl shadow-purple-900/10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <span className="font-bold text-xl">PROMPTS <span className="text-purple-400">MRO</span></span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Acesse sua conta</h1>
              <p className="text-gray-400 text-sm">Entre com suas credenciais para acessar os prompts</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">E-mail</label>
                <input type="email" placeholder="seu@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Senha</label>
                <input type="password" placeholder="Sua senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <button type="submit" disabled={isLogging} className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-600/25">
                {isLogging ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <p className="text-xs text-gray-600 mt-6 text-center">
              Não tem conta? <a href="/prompts" className="text-purple-400 hover:underline">Cadastre-se grátis</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PAYWALL OVERLAY
  const renderPaywall = () => {
    if (!blocked || isPaid) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-3 sm:px-4 overflow-y-auto">
        <div className="bg-[#111118] border border-purple-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 max-w-md w-full text-center shadow-2xl shadow-purple-900/30 my-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold mb-2">Limite Atingido!</h2>
          <p className="text-gray-400 mb-4 sm:mb-6 text-xs sm:text-sm">
            Você usou suas <span className="text-white font-bold">{copiesLimit} cópias gratuitas</span>. 
            Para continuar acessando todos os +1000 prompts, desbloqueie o acesso completo.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
              <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Mensal</div>
              <div className="flex items-baseline justify-center gap-0.5 mb-1">
                <span className="text-2xl sm:text-3xl font-black text-white">R$47</span>
                <span className="text-gray-400 text-[10px] sm:text-xs">/mês</span>
              </div>
              <div className="text-[10px] text-gray-500 mb-2">30 dias</div>
              {!paymentLink && (
                <button
                  onClick={() => handleCreatePayment('monthly')}
                  disabled={creatingPayment}
                  className="w-full py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                >
                  {creatingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-3.5 h-3.5" /> Assinar</>}
                </button>
              )}
            </div>
            <div className="bg-gradient-to-b from-purple-500/20 to-pink-500/10 border-2 border-purple-500/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">MELHOR</div>
              <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Anual</div>
              <div className="flex items-baseline justify-center gap-0.5 mb-1">
                <span className="text-2xl sm:text-3xl font-black text-white">R$97</span>
                <span className="text-gray-400 text-[10px] sm:text-xs">/ano</span>
              </div>
              <div className="text-[10px] text-green-400 mb-2">365 dias • Economia!</div>
              {!paymentLink && (
                <button
                  onClick={() => handleCreatePayment('annual')}
                  disabled={creatingPayment}
                  className="w-full py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                >
                  {creatingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-3.5 h-3.5" /> Assinar</>}
                </button>
              )}
            </div>
          </div>

          {paymentLink && (
            <div className="space-y-3">
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 sm:py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-green-600/25"
              >
                <CreditCard className="w-5 h-5" /> PAGAR AGORA
              </a>

              <button
                onClick={checkPaymentStatus}
                disabled={checkingPayment}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-gray-300 hover:text-white hover:border-purple-500/30 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {checkingPayment ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verificando pagamento...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Já paguei — Verificar</>
                )}
              </button>

              <p className="text-xs text-gray-600">Verificação automática a cada 15 segundos</p>
            </div>
          )}

          <button onClick={handleLogout} className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 hover:text-gray-400 transition-colors">
            Sair da conta
          </button>
        </div>
      </div>
    );
  };

  // DASHBOARD
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {renderPaywall()}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#050508]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-lg">PROMPTS <span className="text-purple-400">MRO</span></span>
          </div>
          <div className="flex items-center gap-3">
            {user.id === 'estrutura-guest' && (
              <button
                onClick={() => navigate('/estruturarendaextra')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/25"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar para Início</span>
                <span className="sm:hidden">Voltar</span>
              </button>
            )}
            {!isPaid && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                <AlertTriangle className="w-3 h-3" />
                {copiesCount}/{copiesLimit} cópias
              </div>
            )}
            {isPaid && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                <CheckCircle className="w-3 h-3" />
                {daysRemaining != null ? `${daysRemaining} dias restantes` : 'Acesso Completo'}
              </div>
            )}
            <span className="text-sm text-gray-400 hidden sm:block">Olá, <span className="text-white font-medium">{user.name}</span></span>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-red-500/50 text-sm text-gray-400 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("prompts")}
            className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "prompts"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Prompts
          </button>
          <button
            onClick={() => setActiveTab("editar")}
            className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "editar"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30"
            }`}
          >
            <Scissors className="w-4 h-4" /> Editar
          </button>
        </div>

        {activeTab === "editar" && <ImageCropEditor />}

        {activeTab === "prompts" && (<>
        {/* Welcome */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold">Seus Prompts</h1>
            <button
              onClick={() => setShowHowToGenerate(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-600/25"
            >
              <Play className="w-4 h-4" /> Como gerar?
            </button>
          </div>
          <p className="text-gray-400">Encontre e copie prompts profissionais para gerar suas fotos com IA</p>
        </div>

        {/* How to Generate Modal */}
        {showHowToGenerate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-3 sm:px-4 overflow-y-auto">
            <div className="bg-[#111118] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-2xl w-full shadow-2xl my-4 relative">
              <button
                onClick={() => setShowHowToGenerate(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
                <Play className="w-5 h-5 text-red-400" /> Como gerar suas fotos?
              </h2>
              <p className="text-gray-400 text-sm mb-5">Assista o tutorial e use o Gemini para gerar</p>

              {/* Video */}
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/30 border border-white/10 mb-6">
                <iframe
                  src="https://www.youtube.com/embed/btICOskVlhY"
                  title="Como gerar fotos com IA"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Gemini Button */}
              <a
                href="https://gemini.google.com/app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-600/25"
              >
                <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini" className="w-6 h-6" />
                Abrir Google Gemini
                <ExternalLink className="w-4 h-4" />
              </a>

              <p className="text-xs text-gray-600 text-center mt-3">Copie o prompt acima e cole no Gemini para gerar sua foto</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar prompts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  filterCategory === cat.value
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30"
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        {filterCategory !== "all" && (
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-pink-400" />
              <span>Filtro: {categories.find(c => c.value === filterCategory)?.label}</span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Prompts Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPrompts.map(prompt => (
              <div key={prompt.id} className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all">
                {prompt.image_url && (
                  <div className="aspect-[3/4] overflow-hidden bg-black/20">
                    <img src={prompt.image_url} alt={prompt.folder_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm truncate flex-1">{prompt.folder_name}</h3>
                    {(prompt.category || "geral") === "feminino" && (
                      <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full ml-2">👩</span>
                    )}
                    {(prompt.category || "geral") === "masculino" && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-2">👨</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mb-3 line-clamp-3 leading-relaxed">
                    {prompt.prompt_text.substring(0, 120)}...
                  </p>

                  <button
                    onClick={() => handleCopy(prompt.prompt_text, prompt.id)}
                    disabled={blocked && !isPaid}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      blocked && !isPaid
                        ? "bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed"
                        : copiedId === prompt.id
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-purple-600/20 text-purple-300 border border-purple-500/20 hover:bg-purple-600/30 hover:border-purple-500/40"
                    }`}
                  >
                    {blocked && !isPaid ? (
                      <><Lock className="w-4 h-4" /> Bloqueado</>
                    ) : copiedId === prompt.id ? (
                      <><Check className="w-4 h-4" /> Copiado!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copiar Prompt</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredPrompts.length === 0 && (
          <div className="text-center py-20">
            <Image className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Nenhum prompt encontrado</h3>
            <p className="text-gray-600 text-sm">Tente alterar os filtros ou buscar por outro termo</p>
          </div>
        )}
        </>)}
      </main>
    </div>
  );
};

export default PromptsMRODashboard;