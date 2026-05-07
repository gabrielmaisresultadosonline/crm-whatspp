import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Crown, Instagram, Search, LogOut, Loader2, Users, 
  MessageSquare, Target, TrendingUp, FileText, Sparkles, 
  CreditCard, CheckCircle, AlertCircle, Gift, Play, X,
  MessageCircle, Smartphone, Percent, ChevronDown, Wifi,
  ThumbsUp, ThumbsDown, Image as ImageIcon, Clock, Link2, Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trackPageView, trackInitiateCheckout } from '@/lib/facebookTracking';
import logoMro from '@/assets/logo-mro.png';
import StrategyContentFormatter from '@/components/StrategyContentFormatter';

const PROMO33_STORAGE_KEY = 'promo33_user_session';
const PAYMENT_LINK = 'https://checkout.infinitepay.io/paguemro?items=[{"name":"MRO+PROMO33+MENSAL","price":3300,"quantity":1}]';

// Links de pagamento para as ferramentas
const MRO_INSTAGRAM_PAYMENT = 'https://checkout.infinitepay.io/paguemro?items=[{"name":"MRO+INTELIGENTE+ANUAL+DESCONTO","price":30000,"quantity":1}]';
const ZAPMRO_PAYMENT = 'https://checkout.infinitepay.io/paguemro?items=[{"name":"ZAPMRO+ANUAL+DESCONTO","price":30000,"quantity":1}]';

interface Promo33User {
  id: string;
  email: string;
  name: string;
  phone: string;
  instagram_username: string | null;
  instagram_data: any;
  strategies_generated: any[];
  subscription_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
}

export default function Promo33Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Promo33User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [instagramInput, setInstagramInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null);
  const [profileAnalysis, setProfileAnalysis] = useState<{ positives: string[]; negatives: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isResyncingProfile, setIsResyncingProfile] = useState(false);
  const [showExclusiveTools, setShowExclusiveTools] = useState(false);

  useEffect(() => {
    trackPageView('Promo33 Dashboard');
    loadUser();
  }, []);

  // Gerar análise automática quando o perfil for carregado
  useEffect(() => {
    if (user?.instagram_data && !profileAnalysis && !isAnalyzing) {
      generateProfileAnalysis();
    }
  }, [user?.instagram_data]);

  const loadUser = async () => {
    const session = localStorage.getItem(PROMO33_STORAGE_KEY);
    if (!session) {
      navigate('/promo33');
      return;
    }

    const storedUser = JSON.parse(session);
    
    try {
      const { data, error } = await supabase.functions.invoke('promo33-auth', {
        body: { 
          action: 'get_user',
          email: storedUser.email
        }
      });

      if (data?.success && data.user) {
        setUser(data.user);
        localStorage.setItem(PROMO33_STORAGE_KEY, JSON.stringify(data.user));
        
        // Carregar análise salva se existir
        if (data.user.instagram_data?.analysis) {
          setProfileAnalysis(data.user.instagram_data.analysis);
        }
      } else {
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(storedUser);
    }
    
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(PROMO33_STORAGE_KEY);
    navigate('/promo33');
  };

  // Detectar se está em navegador in-app (Instagram, Facebook, etc)
  const isInAppBrowser = (): boolean => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    // Detectar navegadores in-app comuns
    return /FBAN|FBAV|Instagram|Line|KAKAOTALK|Snapchat|Twitter|LinkedInApp/i.test(ua);
  };

  // Abrir link forçando navegador externo
  const openInExternalBrowser = (url: string) => {
    if (isInAppBrowser()) {
      // Para Android, tentar intent://
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isAndroid) {
        // Usar intent:// para forçar Chrome no Android
        const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intentUrl;
        
        // Fallback: se não funcionar após 2 segundos, abrir normalmente
        setTimeout(() => {
          window.location.href = url;
        }, 2000);
      } else if (isIOS) {
        // No iOS, mostrar instrução e copiar link
        const copied = navigator.clipboard?.writeText(url);
        toast.info('Abra no Safari: toque nos 3 pontinhos e escolha "Abrir no navegador" para completar o pagamento com segurança.', {
          duration: 8000
        });
        // Tentar abrir mesmo assim
        setTimeout(() => {
          window.location.href = url;
        }, 1500);
      } else {
        window.location.href = url;
      }
    } else {
      // Navegador normal, abrir em nova aba
      window.open(url, '_blank');
    }
  };

  const handlePayment = () => {
    trackInitiateCheckout('Promo33 Monthly', 33);
    const redirectUrl = `${window.location.origin}/promo33/obrigado?email=${encodeURIComponent(user?.email || '')}`;
    const fullPaymentLink = `${PAYMENT_LINK}&redirect_url=${encodeURIComponent(redirectUrl)}`;
    openInExternalBrowser(fullPaymentLink);
  };

  const handleToolPayment = (tool: 'instagram' | 'whatsapp') => {
    trackInitiateCheckout(tool === 'instagram' ? 'MRO Inteligente Desconto' : 'ZAPMRO Desconto', 300);
    const redirectUrl = 'https://maisresultadosonline.com.br/obrigado';
    const paymentLink = tool === 'instagram' ? MRO_INSTAGRAM_PAYMENT : ZAPMRO_PAYMENT;
    const fullPaymentLink = `${paymentLink}&redirect_url=${encodeURIComponent(redirectUrl)}`;
    openInExternalBrowser(fullPaymentLink);
  };

  const searchInstagram = async () => {
    if (!instagramInput.trim()) {
      toast.error('Digite o @ do Instagram');
      return;
    }

    let username = instagramInput.trim().toLowerCase();
    if (username.startsWith('@')) username = username.slice(1);
    if (username.includes('instagram.com/')) {
      const match = username.match(/instagram\.com\/([^/?]+)/);
      if (match) username = match[1];
    }

    setIsSearching(true);

    try {
      const { data, error } = await supabase.functions.invoke('sync-instagram-profile', {
        body: { username }
      });

      if (error) throw error;

      if (data?.success && data.profile) {
        const { data: updateData, error: updateError } = await supabase.functions.invoke('promo33-auth', {
          body: {
            action: 'update_instagram',
            email: user?.email,
            instagram_username: username,
            instagram_data: data.profile
          }
        });

        if (updateError) throw updateError;

        if (updateData?.success) {
          setUser(updateData.user);
          localStorage.setItem(PROMO33_STORAGE_KEY, JSON.stringify(updateData.user));
          toast.success('Perfil do Instagram adicionado!');
        }
      } else {
        toast.error('Não foi possível encontrar o perfil. Verifique o @ e tente novamente.');
      }
    } catch (error: any) {
      console.error('Instagram search error:', error);
      toast.error('Erro ao buscar perfil. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const resyncInstagramProfile = async () => {
    if (!user?.instagram_username) return;
    
    // Verificar limite de 3 atualizações
    const syncCount = user?.instagram_data?.syncCount || 0;
    if (syncCount >= 3) {
      toast.error('Você já utilizou suas 3 atualizações disponíveis.');
      return;
    }
    
    setIsResyncingProfile(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-instagram-profile', {
        body: { username: user.instagram_username }
      });

      if (error) throw error;

      if (data?.success && data.profile) {
        // Incrementar contador de sync
        const updatedProfile = {
          ...data.profile,
          syncCount: syncCount + 1
        };
        
        const { data: updateData, error: updateError } = await supabase.functions.invoke('promo33-auth', {
          body: {
            action: 'update_instagram',
            email: user?.email,
            instagram_username: user.instagram_username,
            instagram_data: updatedProfile
          }
        });

        if (updateError) throw updateError;

        if (updateData?.success) {
          setUser(updateData.user);
          localStorage.setItem(PROMO33_STORAGE_KEY, JSON.stringify(updateData.user));
          toast.success(`Perfil atualizado! (${syncCount + 1}/2 atualizações usadas)`);
          // Re-gerar análise após resync
          setProfileAnalysis(null);
        }
      } else {
        toast.error('Não foi possível atualizar o perfil. Tente novamente.');
      }
    } catch (error: any) {
      console.error('Resync error:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsResyncingProfile(false);
    }
  };

  const generateProfileAnalysis = async () => {
    if (!user?.instagram_data) return;
    
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('promo33-generate-strategy', {
        body: {
          type: 'analysis',
          email: user.email,
          instagram_username: user.instagram_username,
          instagram_data: user.instagram_data
        }
      });

      if (data?.success && data.analysis) {
        setProfileAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canGenerateStrategy = (type: string): { canGenerate: boolean; daysRemaining: number } => {
    if (!user?.strategies_generated) return { canGenerate: true, daysRemaining: 0 };
    
    const existingStrategy = user.strategies_generated.find((s: any) => s.type === type);
    if (!existingStrategy) return { canGenerate: true, daysRemaining: 0 };
    
    const generatedAt = new Date(existingStrategy.generated_at);
    const now = new Date();
    const daysSinceGeneration = Math.floor((now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 30 - daysSinceGeneration);
    
    return { 
      canGenerate: daysSinceGeneration >= 30, 
      daysRemaining 
    };
  };

  const generateStrategy = async (type: string) => {
    if (!user?.instagram_data || !user?.instagram_username) {
      toast.error('Adicione seu Instagram primeiro');
      return;
    }

    const { canGenerate, daysRemaining } = canGenerateStrategy(type);
    if (!canGenerate) {
      toast.error(`Você já gerou esta estratégia. Aguarde ${daysRemaining} dias para gerar novamente.`);
      return;
    }

    setIsGenerating(true);
    setSelectedStrategy(type);

    try {
      const { data, error } = await supabase.functions.invoke('promo33-generate-strategy', {
        body: {
          type,
          email: user.email,
          instagram_username: user.instagram_username,
          instagram_data: user.instagram_data
        }
      });

      if (error) throw error;

      if (data?.success) {
        setUser(data.user);
        localStorage.setItem(PROMO33_STORAGE_KEY, JSON.stringify(data.user));
        toast.success('Estratégia gerada com sucesso!');
      } else {
        toast.error(data?.message || 'Erro ao gerar estratégia');
      }
    } catch (error: any) {
      console.error('Strategy generation error:', error);
      toast.error('Erro ao gerar estratégia. Tente novamente.');
    } finally {
      setIsGenerating(false);
      setSelectedStrategy(null);
    }
  };

  const isPremium = user?.subscription_status === 'active';
  const daysRemaining = user?.subscription_end 
    ? Math.max(0, Math.ceil((new Date(user.subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Custom animation styles */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.4; filter: brightness(0.5); }
        }
      `}</style>
      {/* Header */}
      <header className="py-3 md:py-4 px-3 md:px-4 border-b border-yellow-500/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <img src={logoMro} alt="MRO" className="h-8 md:h-10 flex-shrink-0" />
          
          <div className="flex items-center gap-1 md:gap-4 flex-wrap justify-end">
            {isPremium && user?.instagram_username && user?.instagram_data && !showExclusiveTools && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExclusiveTools(true)}
                className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 text-xs px-2 py-1 h-auto"
              >
                <Gift className="w-3 h-3" />
                <span className="hidden sm:inline ml-1">Exclusivo</span>
              </Button>
            )}
            {isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-xs px-2 py-1">
                <Crown className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Premium - </span>{daysRemaining}d
              </Badge>
            )}
            
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white px-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-4 md:py-8 px-3 md:px-4">
        {/* Exclusive Tools Dashboard View */}
        {showExclusiveTools && isPremium && user?.instagram_username && user?.instagram_data ? (
          <div className="animate-fade-in">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setShowExclusiveTools(false)}
              className="text-gray-400 hover:text-white mb-4 md:mb-6 text-sm"
            >
              <ChevronDown className="w-4 h-4 mr-2 rotate-90" />
              Voltar
            </Button>

            <div className="text-center mb-6 md:mb-8">
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold px-3 py-1 md:px-4 md:py-2 mb-3 md:mb-4 text-xs md:text-sm">
                <Gift className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                EXCLUSIVO
              </Badge>
              <h1 className="text-xl md:text-3xl font-bold text-white mb-2">
                Ferramentas Premium
              </h1>
              <p className="text-gray-400 text-sm">
                Descontos exclusivos para assinantes
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              {/* MRO Instagram Tool */}
              <Collapsible>
                <CollapsibleTrigger className="w-full">
                  <Card className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 border-pink-500/30 hover:border-pink-500/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-white font-bold">Ferramenta de Instagram</h3>
                          <p className="text-gray-400 text-xs">MRO Inteligente - R$300/anual</p>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="bg-gradient-to-br from-pink-500/10 to-purple-600/10 border-pink-500/30 border-t-0 rounded-t-none">
                    <CardContent className="p-6">
                      <ul className="space-y-2 mb-4">
                        {[
                          'Automação de interações orgânicas',
                          'Estratégias personalizadas por I.A',
                          'Geração de criativos e legendas',
                          'Análise completa do perfil',
                          'Suporte exclusivo'
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                            <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <button 
                        onClick={() => setShowVideoModal('instagram')}
                        className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg mb-4 transition-colors"
                      >
                        <Play className="w-5 h-5" />
                        Ver como funciona
                      </button>

                      <div className="bg-black/30 rounded-lg p-4 text-center mb-4">
                        <p className="text-gray-500 text-sm line-through">De R$397</p>
                        <div className="flex items-center justify-center gap-2">
                          <Percent className="w-5 h-5 text-yellow-500" />
                          <span className="text-3xl font-bold text-yellow-400">R$300</span>
                          <span className="text-gray-400">/anual</span>
                        </div>
                        <p className="text-green-400 text-sm font-semibold">Economia de R$97!</p>
                      </div>

                      <Button 
                        onClick={() => handleToolPayment('instagram')}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        QUERO ESSE DESCONTO
                      </Button>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              {/* ZAPMRO WhatsApp Tool */}
              <Collapsible>
                <CollapsibleTrigger className="w-full">
                  <Card className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-green-500/30 hover:border-green-500/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-white font-bold">Ferramenta de WhatsApp</h3>
                          <p className="text-gray-400 text-xs">ZAPMRO - R$300/anual</p>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30 border-t-0 rounded-t-none">
                    <CardContent className="p-6">
                      <ul className="space-y-2 mb-4">
                        {[
                          'Automação de mensagens em massa',
                          'Extrator de contatos',
                          'Disparador inteligente',
                          'Gestão de grupos',
                          'Suporte exclusivo'
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <button 
                        onClick={() => setShowVideoModal('whatsapp')}
                        className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg mb-4 transition-colors"
                      >
                        <Play className="w-5 h-5" />
                        Ver como funciona
                      </button>

                      <div className="bg-black/30 rounded-lg p-4 text-center mb-4">
                        <p className="text-gray-500 text-sm line-through">De R$397</p>
                        <div className="flex items-center justify-center gap-2">
                          <Percent className="w-5 h-5 text-yellow-500" />
                          <span className="text-3xl font-bold text-yellow-400">R$300</span>
                          <span className="text-gray-400">/anual</span>
                        </div>
                        <p className="text-green-400 text-sm font-semibold">Economia de R$97!</p>
                      </div>

                      <Button 
                        onClick={() => handleToolPayment('whatsapp')}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        QUERO ESSE DESCONTO
                      </Button>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Olá, {user?.name?.split(' ')[0] || 'Usuário'}! 👋
              </h1>
              <p className="text-gray-400">
                {isPremium ? 'Seu acesso premium está ativo' : 'Ative seu premium para começar'}
              </p>
            </div>

            {/* Payment Section (if not premium) */}
            {!isPremium && (
              <Card className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border-yellow-500/30 mb-8">
                <CardContent className="p-6 md:p-8 text-center">
                  <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Ative seu Premium</h2>
                  <p className="text-gray-300 mb-6">
                    Desbloqueie todas as funcionalidades por apenas <strong className="text-yellow-400">R$33/mês</strong>
                  </p>
                  
                  <Button 
                    onClick={handlePayment}
                    size="lg"
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold px-8 py-6 text-lg"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    PAGAR AGORA - R$33
                  </Button>
                  
                  <p className="text-gray-500 text-sm mt-4">
                    Pagamento seguro via InfiniPay
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Premium Content */}
            {isPremium && (
              <>
            {/* Add Instagram Section */}
            {!user?.instagram_username && (
              <Card className="bg-gray-900/50 border-gray-800 mb-8">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    Adicione seu Instagram
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Compartilhe o link ou @ do seu perfil para começarmos a análise
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Input
                      placeholder="@seuperfil ou link"
                      value={instagramInput}
                      onChange={(e) => setInstagramInput(e.target.value)}
                      className="bg-black/50 border-gray-700 text-white flex-1"
                    />
                    <Button 
                      onClick={searchInstagram}
                      disabled={isSearching}
                      className="bg-pink-500 hover:bg-pink-600 w-full sm:w-auto"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                      Buscar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instagram Profile Card - Complete */}
            {user?.instagram_username && user?.instagram_data && (
              <Card className="bg-gray-900/50 border-gray-800 mb-8 overflow-hidden">
                <CardContent className="p-6">
                  {/* Connection Status Indicator + Resync Button */}
                  <div className="flex items-center justify-between mb-4">
                    {(() => {
                      const syncCount = user.instagram_data?.syncCount || 0;
                      const canSync = syncCount < 3;
                      return (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resyncInstagramProfile}
                          disabled={isResyncingProfile || !canSync}
                          className={`text-xs ${canSync ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
                        >
                          {isResyncingProfile ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Search className="w-3 h-3 mr-1" />
                          )}
                          {canSync ? `Atualizar dados (${3 - syncCount} restantes)` : 'Limite atingido'}
                        </Button>
                      );
                    })()}
                    
                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-[pulse-glow_2s_ease-in-out_infinite]" 
                           style={{ 
                             animation: 'pulse-glow 2s ease-in-out infinite',
                             boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)'
                           }} 
                      />
                      <Wifi className="w-4 h-4 text-green-500 animate-[pulse-glow_2s_ease-in-out_infinite]" 
                            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                      />
                      <span className="text-green-400 text-xs font-medium">Conectado ao MRO</span>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {(user.instagram_data.profilePicture || user.instagram_data.profilePicUrl) && 
                     !(user.instagram_data.profilePicture || user.instagram_data.profilePicUrl || '').includes('dicebear') ? (
                      <img 
                        src={user.instagram_data.profilePicture || user.instagram_data.profilePicUrl} 
                        alt={user.instagram_username}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-pink-500 shadow-lg shadow-pink-500/20 flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-pink-500/20 flex items-center justify-center border-4 border-pink-500 shadow-lg shadow-pink-500/20 flex-shrink-0">
                        <span className="text-2xl font-bold text-pink-500">{user.instagram_username?.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg md:text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                        @{user.instagram_username}
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                      </h3>
                      {user.instagram_data.fullName && (
                        <p className="text-gray-400 text-sm">{user.instagram_data.fullName}</p>
                      )}
                      
                      <div className="flex justify-center sm:justify-start gap-4 md:gap-6 mt-3">
                        <div className="text-center">
                          <p className="text-lg md:text-xl font-bold text-white">
                            {user.instagram_data.followers?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-gray-500">Seguidores</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg md:text-xl font-bold text-white">
                            {user.instagram_data.following?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-gray-500">Seguindo</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg md:text-xl font-bold text-white">
                            {(user.instagram_data.postsCount || user.instagram_data.posts?.length || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">Posts</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {user.instagram_data.bio && (
                    <p className="text-gray-300 mt-4 text-sm bg-black/30 p-3 rounded-lg">
                      {user.instagram_data.bio}
                    </p>
                  )}

                  {/* Bio Link */}
                  {(() => {
                    const externalUrl = Array.isArray(user.instagram_data.externalUrl) 
                      ? (Array.isArray(user.instagram_data.externalUrl[0]) ? user.instagram_data.externalUrl[0][0] : user.instagram_data.externalUrl[0])
                      : user.instagram_data.externalUrl;
                    return externalUrl ? (
                      <a 
                        href={externalUrl.startsWith('http') ? externalUrl : `https://${externalUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-2 text-pink-400 hover:text-pink-300 text-sm transition-colors"
                      >
                        <Link2 className="w-4 h-4" />
                        {externalUrl}
                      </a>
                    ) : null;
                  })()}

                  {/* Recent Posts Gallery */}
                  <div className="mt-6">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-pink-500" />
                      Últimas Publicações
                    </h4>
                    {Array.isArray(user.instagram_data.posts) && user.instagram_data.posts.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {user.instagram_data.posts.slice(0, 6).map((post: any, index: number) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                            {(post.thumbnail || post.displayUrl || post.imageUrl) && 
                             !(post.thumbnail || post.displayUrl || post.imageUrl || '').includes('dicebear') ? (
                              <img 
                                src={post.thumbnail || post.displayUrl || post.imageUrl} 
                                alt={`Post ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-110 transition-transform"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">Sem imagem</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                        <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          Sem publicações carregadas
                        </p>
                        {(() => {
                          const syncCount = user.instagram_data?.syncCount || 0;
                          const canSync = syncCount < 3;
                          return canSync ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={resyncInstagramProfile}
                              disabled={isResyncingProfile}
                              className="mt-2 text-pink-400 hover:text-pink-300"
                            >
                              {isResyncingProfile ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Search className="w-4 h-4 mr-2" />
                              )}
                              Carregar publicações ({3 - syncCount} restantes)
                            </Button>
                          ) : (
                            <p className="mt-2 text-gray-600 text-xs">
                              Limite de atualizações atingido
                            </p>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Engagement Stats */}
                  {Array.isArray(user.instagram_data.posts) && user.instagram_data.posts.length > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg p-4 border border-pink-500/20">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-pink-500" />
                        Engajamento dos Últimos {Math.min(user.instagram_data.posts.length, 6)} Posts
                        <span className="text-gray-500 text-xs font-normal">(de {user.instagram_data.postsCount || user.instagram_data.posts.length} totais)</span>
                      </h4>
                      {(() => {
                        const posts = user.instagram_data.posts.slice(0, 6);
                        const totalLikes = posts.reduce((sum: number, p: any) => sum + (p.likes || 0), 0);
                        const totalComments = posts.reduce((sum: number, p: any) => sum + (p.comments || 0), 0);
                        const avgLikes = posts.length > 0 ? Math.round(totalLikes / posts.length) : 0;
                        const avgComments = posts.length > 0 ? Math.round(totalComments / posts.length) : 0;
                        const engagementRate = user.instagram_data.followers > 0 
                          ? ((avgLikes + avgComments) / user.instagram_data.followers * 100).toFixed(2) 
                          : '0';
                        
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="bg-black/30 rounded-lg p-3 text-center">
                              <Heart className="w-4 h-4 text-pink-500 mx-auto mb-1" />
                              <p className="text-lg font-bold text-white">{totalLikes.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">Total Curtidas</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3 text-center">
                              <MessageCircle className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                              <p className="text-lg font-bold text-white">{totalComments.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">Total Comentários</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3 text-center">
                              <Heart className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                              <p className="text-lg font-bold text-white">{avgLikes.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">Média Curtidas</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3 text-center">
                              <MessageCircle className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                              <p className="text-lg font-bold text-white">{avgComments.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">Média Comentários</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3 text-center col-span-2 md:col-span-1">
                              <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                              <p className="text-lg font-bold text-green-400">{engagementRate}%</p>
                              <p className="text-xs text-gray-500">Taxa Engajamento</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Profile Analysis */}
                  <div className="mt-6 border-t border-gray-800 pt-6">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      Análise do Perfil
                      {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />}
                    </h4>
                    
                    {profileAnalysis ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Pontos Positivos */}
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                          <h5 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                            <ThumbsUp className="w-4 h-4" />
                            Pontos Positivos
                          </h5>
                          <ul className="space-y-2">
                            {profileAnalysis.positives.map((point, i) => (
                              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {typeof point === 'string' ? point : JSON.stringify(point)}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Pontos a Melhorar */}
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                          <h5 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                            <ThumbsDown className="w-4 h-4" />
                            Pontos a Melhorar
                          </h5>
                          <ul className="space-y-2">
                            {profileAnalysis.negatives.map((point, i) => (
                              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                {typeof point === 'string' ? point : JSON.stringify(point)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : isAnalyzing ? (
                      <div className="text-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-yellow-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Analisando seu perfil...</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Button 
                          onClick={generateProfileAnalysis}
                          variant="outline"
                          className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar Análise
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strategy Generation - Only after profile loaded */}
            {user?.instagram_username && user?.instagram_data && (
              <div className="mb-6 md:mb-8">
                <h2 className="text-lg md:text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                  Gerar Estratégias
                </h2>
                <p className="text-gray-400 text-xs md:text-sm mb-4">
                  1 estratégia de cada tipo a cada 30 dias
                </p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                  {[
                    { type: 'bio', icon: FileText, title: 'Bio', desc: 'Otimize sua bio' },
                    { type: 'growth', icon: TrendingUp, title: 'Crescimento', desc: 'Crescer organicamente' },
                    { type: 'sales', icon: Target, title: 'Vendas', desc: 'Scripts de vendas' },
                    { type: 'content', icon: MessageSquare, title: 'Criativos', desc: 'Ideias de conteúdo' },
                  ].map((strategy) => {
                    const { canGenerate, daysRemaining: strategyDaysRemaining } = canGenerateStrategy(strategy.type);
                    const hasExisting = user?.strategies_generated?.some((s: any) => s.type === strategy.type);
                    
                    return (
                      <Card 
                        key={strategy.type}
                        className={`bg-gray-900/50 border-gray-800 transition-colors ${
                          canGenerate ? 'hover:border-yellow-500/50 cursor-pointer active:scale-95' : 'opacity-60'
                        }`}
                        onClick={() => canGenerate && !isGenerating && generateStrategy(strategy.type)}
                      >
                        <CardContent className="p-3 md:p-4 text-center">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 ${
                            canGenerate 
                              ? 'bg-gradient-to-br from-yellow-500 to-amber-600' 
                              : 'bg-gray-700'
                          }`}>
                            {isGenerating && selectedStrategy === strategy.type ? (
                              <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-black animate-spin" />
                            ) : (
                              <strategy.icon className={`w-5 h-5 md:w-6 md:h-6 ${canGenerate ? 'text-black' : 'text-gray-400'}`} />
                            )}
                          </div>
                          <h3 className="text-white font-semibold mb-1 text-sm md:text-base">{strategy.title}</h3>
                          <p className="text-gray-500 text-xs hidden md:block">{strategy.desc}</p>
                          
                          {!canGenerate && hasExisting && (
                            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-yellow-500">
                              <Clock className="w-3 h-3" />
                              {strategyDaysRemaining}d
                            </div>
                          )}
                          
                          {hasExisting && (
                            <Badge className="mt-2 bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              OK
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Generated Strategies */}
            {user?.strategies_generated && user.strategies_generated.length > 0 && (
              <div className="mb-6 md:mb-8">
                <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  Suas Estratégias
                </h2>
                
                <Tabs defaultValue={user.strategies_generated[0]?.type} className="w-full">
                  <TabsList className="bg-gray-900/50 border-gray-800 mb-3 md:mb-4 flex-wrap h-auto gap-1 w-full justify-start">
                    {user.strategies_generated.filter((s: any) => s.type !== 'analysis').map((strategy: any, index: number) => (
                      <TabsTrigger 
                        key={index} 
                        value={strategy.type}
                        className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-xs md:text-sm px-2 md:px-3"
                      >
                        {strategy.type === 'bio' && 'Bio'}
                        {strategy.type === 'growth' && 'Crescimento'}
                        {strategy.type === 'sales' && 'Vendas'}
                        {strategy.type === 'content' && 'Criativos'}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {user.strategies_generated.filter((s: any) => s.type !== 'analysis').map((strategy: any, index: number) => (
                    <TabsContent key={index} value={strategy.type}>
                      <Card className="bg-gray-900/50 border-gray-800">
                        <CardContent className="p-3 md:p-6">
                          <StrategyContentFormatter content={strategy.content} />
                          <div className="flex flex-col md:flex-row md:items-center justify-between mt-3 md:mt-4 gap-1">
                            <p className="text-gray-500 text-xs">
                              Gerado: {new Date(strategy.generated_at).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-yellow-500 text-xs">
                              Próxima: {new Date(new Date(strategy.generated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}

            {/* Non-premium message */}
            {!isPremium && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Acesso Bloqueado</h3>
                  <p className="text-gray-400">
                    Ative seu premium para acessar as estratégias personalizadas de IA
                  </p>
                </CardContent>
              </Card>
            )}
              </>
            )}
          </>
        )}
      </main>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl">
            <button
              onClick={() => setShowVideoModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
              {showVideoModal === 'instagram' ? (
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="MRO Inteligente"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="ZAPMRO"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            
            <p className="text-center text-gray-400 mt-4">
              {showVideoModal === 'instagram' ? 'MRO Inteligente - Ferramenta para Instagram' : 'ZAPMRO - Ferramenta para WhatsApp'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
