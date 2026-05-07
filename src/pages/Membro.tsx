import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Instagram, 
  ArrowRight,
  MessageCircle,
  Crown,
  CheckCircle2,
  Clock,
  Palette,
  BarChart3,
  Search,
  Loader2,
  AlertCircle,
  BookOpen,
  Play,
  LogIn,
  LogOut,
  CreditCard,
  Zap,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppConfig } from "@/hooks/useWhatsAppConfig";
import { toast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { StrategyDisplay } from "@/components/StrategyDisplay";
import { CreativeGenerator } from "@/components/CreativeGenerator";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { setAuthToken, clearAuthData } from "@/lib/persistentStorage";

interface PaidMemberUser {
  id: string;
  username: string;
  email: string;
  password: string;
  instagram_username?: string;
  subscription_status: 'active' | 'pending' | 'expired';
  subscription_end?: string;
  strategies_generated: number;
  creatives_used: number;
  created_at: string;
}

const PAID_MEMBERS_KEY = 'mro_paid_members';
const CURRENT_MEMBER_KEY = 'mro_current_member';
const SESSION_KEY = 'mro_paid_user_session';

interface SessionData {
  id: string;
  email: string;
  username: string;
  sessionToken: string;
  expiresAt: number;
  justRegistered?: boolean;
  instagram?: string;
}

const getSession = (): SessionData | null => {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  
  const session = JSON.parse(stored);
  // Check if session is expired
  if (session.expiresAt && session.expiresAt < Date.now()) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return session;
};

const saveSession = (session: SessionData | null) => {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

const getPaidMembers = (): PaidMemberUser[] => {
  const stored = localStorage.getItem(PAID_MEMBERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const savePaidMembers = (members: PaidMemberUser[]) => {
  localStorage.setItem(PAID_MEMBERS_KEY, JSON.stringify(members));
};

const getCurrentMember = (): PaidMemberUser | null => {
  const stored = localStorage.getItem(CURRENT_MEMBER_KEY);
  return stored ? JSON.parse(stored) : null;
};

const saveCurrentMember = (member: PaidMemberUser | null) => {
  if (member) {
    // Store member data WITHOUT password
    const { password, ...memberWithoutPassword } = member;
    localStorage.setItem(CURRENT_MEMBER_KEY, JSON.stringify(memberWithoutPassword));
  } else {
    localStorage.removeItem(CURRENT_MEMBER_KEY);
  }
};

export default function Membro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { whatsappNumber } = useWhatsAppConfig();
  const [user, setUser] = useState<PaidMemberUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [instagramInput, setInstagramInput] = useState('');
  const [isAddingInstagram, setIsAddingInstagram] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');
  const [strategy, setStrategy] = useState<any>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [showPromo, setShowPromo] = useState(false);
  

  const success = searchParams.get('success');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    checkUserStatus();
  }, []);

  // Check subscription after successful payment
  useEffect(() => {
    if (success === 'true' && sessionId && user) {
      verifyPayment();
    }
  }, [success, sessionId, user]);

  // Auto-login from registration (using session, not password)
  useEffect(() => {
    const session = getSession();
    if (session && !user && session.justRegistered) {
      // Clear the flag and auto-login
      const updatedSession = { ...session, justRegistered: false };
      saveSession(updatedSession);
      
      // Create member from session and set as logged in
      const member: PaidMemberUser = {
        id: session.id,
        username: session.username,
        email: session.email,
        password: '', // No password stored
        instagram_username: session.instagram || undefined,
        subscription_status: 'pending',
        strategies_generated: 0,
        creatives_used: 0,
        created_at: new Date().toISOString()
      };
      setUser(member);
      saveCurrentMember(member);
      setIsLoading(false);
    }
    
    // Clean up old credentials storage
    localStorage.removeItem('mro_paid_user_credentials');
  }, []);

  useEffect(() => {
    if (user && user.subscription_status === 'active') {
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation >= 24) {
        setShowPromo(true);
      }
    }
  }, [user]);

  const verifyPayment = async () => {
    if (!user || !sessionId) return;
    
    setLoadingMessage('Verificando pagamento...');
    setLoadingSubMessage('Confirmando sua assinatura');
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: { 
          email: user.email,
          session_id: sessionId
        }
      });

      if (error) throw error;

      if (data.subscribed) {
        // Update local user state
        const updatedUser = {
          ...user,
          subscription_status: 'active' as const,
          subscription_end: data.subscription_end
        };
        setUser(updatedUser);
        saveCurrentMember(updatedUser);

        // Facebook Pixel - Purchase
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'Purchase', {
            value: 57.00,
            currency: 'BRL',
            content_name: 'Plano Mensal I.A MRO Premium'
          });
        }

        toast({
          title: "Pagamento confirmado!",
          description: "Sua assinatura foi ativada. Agora adicione seu Instagram!"
        });

        // Clear URL params
        navigate('/membro', { replace: true });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Verificando pagamento",
        description: "Aguarde alguns segundos e atualize a página"
      });
    } finally {
      setLoadingMessage('');
      setLoadingSubMessage('');
    }
  };

  const handleStartPayment = () => {
    if (!user) return;
    
    // Kiwify checkout link with email pre-filled
    const kiwifyUrl = `https://pay.kiwify.com.br/k2JBcgI?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.username)}`;
    window.location.href = kiwifyUrl;
  };

  const checkUserStatus = async () => {
    setIsLoading(true);

    try {
      // Check if user is already logged in
      const currentMember = getCurrentMember();
      if (currentMember) {
        setUser(currentMember);
        
        // ALWAYS check subscription status from database to catch webhook updates
        try {
          const { data: response, error } = await supabase.functions.invoke('login-paid-user', {
            body: {
              email: currentMember.email.toLowerCase(),
              password: currentMember.password || ''
            }
          });

          if (!error && response?.user) {
            const dbUser = response.user;
            // Update local state with DB data
            const updatedMember: PaidMemberUser = {
              ...currentMember,
              subscription_status: dbUser.subscription_status as 'active' | 'pending' | 'expired',
              subscription_end: dbUser.subscription_end || undefined,
              strategies_generated: dbUser.strategies_generated || 0,
              creatives_used: dbUser.creatives_used || 0
            };
            
            // If status changed from pending to active, show success message
            if (currentMember.subscription_status === 'pending' && dbUser.subscription_status === 'active') {
              toast({
                title: "Pagamento confirmado! 🎉",
                description: "Sua assinatura foi ativada. Agora adicione seu Instagram!"
              });
              
              // Facebook Pixel - Purchase
              if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'Purchase', {
                  value: 57.00,
                  currency: 'BRL',
                  content_name: 'Plano Mensal I.A MRO Premium'
                });
              }
            }
            
            setUser(updatedMember);
            saveCurrentMember(updatedMember);
          }
        } catch (dbError) {
          console.error('Error checking DB status:', dbError);
        }
        
        // Load saved strategy if exists
        const savedStrategy = localStorage.getItem(`mro_strategy_${currentMember.id}`);
        if (savedStrategy) {
          setStrategy(JSON.parse(savedStrategy));
        }
        
        const savedProfile = localStorage.getItem(`mro_profile_${currentMember.id}`);
        if (savedProfile) {
          setProfileData(JSON.parse(savedProfile));
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activatePendingUser = (userData: any) => {
    // Facebook Pixel - Purchase
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        value: 57.00,
        currency: 'BRL',
        content_name: 'Plano Mensal I.A MRO Premium'
      });
    }

    const newMember: PaidMemberUser = {
      id: `member_${Date.now()}`,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      instagram_username: userData.instagram || undefined,
      subscription_status: 'active',
      subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      strategies_generated: 0,
      creatives_used: 0,
      created_at: new Date().toISOString()
    };

    const members = getPaidMembers();
    // Check if user already exists
    const existingIndex = members.findIndex(m => m.email === userData.email);
    if (existingIndex >= 0) {
      // Renew subscription
      members[existingIndex] = {
        ...members[existingIndex],
        subscription_status: 'active',
        subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      savePaidMembers(members);
      setUser(members[existingIndex]);
      saveCurrentMember(members[existingIndex]);
    } else {
      members.push(newMember);
      savePaidMembers(members);
      setUser(newMember);
      saveCurrentMember(newMember);
    }

    toast({
      title: "Pagamento confirmado!",
      description: "Bem-vindo ao I.A MRO. Agora adicione seu Instagram para começar."
    });

    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha",
        variant: "destructive"
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      // Use Edge Function for login (bypasses RLS)
      const { data: response, error: fnError } = await supabase.functions.invoke('login-paid-user', {
        body: {
          email: loginForm.email.toLowerCase(),
          password: loginForm.password
        }
      });

      if (fnError) {
        console.error('Login function error:', fnError);
        toast({
          title: "Erro ao fazer login",
          description: "Tente novamente",
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return;
      }

      if (response.notFound) {
        toast({
          title: "Usuário não encontrado",
          description: "Email não cadastrado. Crie uma conta primeiro.",
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return;
      }

      if (response.wrongPassword) {
        toast({
          title: "Senha incorreta",
          description: "Verifique sua senha e tente novamente",
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return;
      }

      if (response.error) {
        toast({
          title: "Erro ao fazer login",
          description: response.error,
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return;
      }

      const dbUser = response.user;

      // Store auth token for secure API calls
      if (response.auth_token) {
        setAuthToken(response.auth_token, dbUser.email);
      }

      // Create member object from DB data
      let member: PaidMemberUser = {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        password: loginForm.password,
        instagram_username: dbUser.instagram_username || undefined,
        subscription_status: (dbUser.subscription_status as 'active' | 'pending' | 'expired') || 'pending',
        subscription_end: dbUser.subscription_end || undefined,
        strategies_generated: dbUser.strategies_generated || 0,
        creatives_used: dbUser.creatives_used || 0,
        created_at: dbUser.created_at
      };

      // Check if subscription is still active
      if (member.subscription_end && new Date(member.subscription_end) < new Date()) {
        member.subscription_status = 'expired';
      }

      setUser(member);
      saveCurrentMember(member);

      // Save session token (not password) for future logins
      saveSession({
        id: member.id,
        email: member.email.toLowerCase(),
        username: member.username,
        sessionToken: response.auth_token || btoa(`${member.id}:${Date.now()}`),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Load saved data
      const savedStrategy = localStorage.getItem(`mro_strategy_${member.id}`);
      if (savedStrategy) {
        setStrategy(JSON.parse(savedStrategy));
      }
      
      const savedProfile = localStorage.getItem(`mro_profile_${member.id}`);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }

      toast({
        title: "Login realizado!",
        description: `Bem-vindo de volta, ${member.username}`
      });

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro ao fazer login",
        description: "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    // IMPORTANT: Don't clear saved data on logout - only clear current session
    // Data persists in mro_strategy_${member.id} and mro_profile_${member.id}
    saveCurrentMember(null);
    saveSession(null);
    clearAuthData(); // Clear auth token on logout
    setUser(null);
    setStrategy(null);
    setProfileData(null);
    toast({
      title: "Logout realizado",
      description: "Seus dados foram salvos. Até logo!"
    });
  };

  const updateMember = async (updates: Partial<PaidMemberUser>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    saveCurrentMember(updatedUser);
    
    // Update in localStorage (legacy)
    const members = getPaidMembers();
    const updatedMembers = members.map(m => m.id === user.id ? updatedUser : m);
    savePaidMembers(updatedMembers);

    // Update in Supabase database
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.instagram_username !== undefined) dbUpdates.instagram_username = updates.instagram_username;
      if (updates.strategies_generated !== undefined) dbUpdates.strategies_generated = updates.strategies_generated;
      if (updates.creatives_used !== undefined) dbUpdates.creatives_used = updates.creatives_used;
      if (updates.subscription_status !== undefined) dbUpdates.subscription_status = updates.subscription_status;
      
      if (Object.keys(dbUpdates).length > 0) {
        await supabase
          .from('paid_users')
          .update(dbUpdates)
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating user in database:', error);
    }
  };

  const normalizeInstagram = (input: string): string => {
    let normalized = input.trim().toLowerCase();
    if (normalized.startsWith('@')) {
      normalized = normalized.substring(1);
    }
    if (normalized.includes('instagram.com/')) {
      const match = normalized.match(/instagram\.com\/([^/?]+)/);
      if (match) {
        normalized = match[1];
      }
    }
    return normalized;
  };

  const handleAddInstagram = async () => {
    if (!instagramInput.trim()) {
      toast({
        title: "Instagram obrigatório",
        description: "Digite seu @ do Instagram",
        variant: "destructive"
      });
      return;
    }

    if (!user) return;

    setIsAddingInstagram(true);
    setLoadingMessage(`Buscando @${normalizeInstagram(instagramInput)}...`);
    setLoadingSubMessage('Buscando dados do Instagram. Isso pode levar até 5 minutos.');

    try {
      const normalized = normalizeInstagram(instagramInput);

      // Fetch Instagram profile data
      const { data: profileResponse, error: profileError } = await supabase.functions.invoke('fetch-instagram', {
        body: { username: normalized }
      });

      if (profileError || !profileResponse.success) {
        throw new Error(profileResponse?.error || 'Perfil não encontrado');
      }

      setProfileData(profileResponse.profile);
      localStorage.setItem(`mro_profile_${user.id}`, JSON.stringify(profileResponse.profile));

      updateMember({ instagram_username: normalized });

      toast({
        title: "Instagram adicionado!",
        description: "Agora vamos gerar sua estratégia personalizada"
      });

      // Auto-generate strategy
      await generateStrategy(normalized, profileResponse.profile);

    } catch (error: any) {
      console.error('Error adding Instagram:', error);
      toast({
        title: "Erro ao buscar perfil",
        description: error.message || "Verifique o @ e tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsAddingInstagram(false);
    }
  };

  const generateStrategy = async (instagram: string, profile: any) => {
    if (!user) return;

    setIsGeneratingStrategy(true);
    setLoadingMessage('Gerando estratégia personalizada...');
    setLoadingSubMessage('Analisando perfil com I.A. Isso pode levar até 5 minutos.');

    try {
      // First analyze the profile
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-profile', {
        body: { profile }
      });

      if (analysisError) throw analysisError;

      // Then generate strategy
      const { data: strategyData, error: strategyError } = await supabase.functions.invoke('generate-strategy', {
        body: {
          profile,
          analysis: analysisData.analysis,
          strategyType: 'complete'
        }
      });

      if (strategyError) throw strategyError;

      setStrategy(strategyData.strategy);
      localStorage.setItem(`mro_strategy_${user.id}`, JSON.stringify(strategyData.strategy));

      updateMember({ strategies_generated: (user.strategies_generated || 0) + 1 });

      toast({
        title: "Estratégia gerada!",
        description: "Sua estratégia personalizada de 30 dias está pronta"
      });

    } catch (error: any) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Erro ao gerar estratégia",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=Olá! Sou membro do plano mensal e tenho interesse na Ferramenta MRO com valor promocional.`, '_blank');
  };

  // Show loading overlay for add/sync operations
  const showLoadingOverlay = isAddingInstagram || isGeneratingStrategy || Boolean(success === 'true' && sessionId);

  if (isLoading) {
    return (
      <>
        <LoadingOverlay isVisible={showLoadingOverlay} message={loadingMessage} subMessage={loadingSubMessage} />
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </>
    );
  }

  // Login form if not authenticated
  if (!user) {
    return (
      <>
        <LoadingOverlay isVisible={showLoadingOverlay} message={loadingMessage} subMessage={loadingSubMessage} />
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          <header className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Logo size="lg" />
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/vendas')}
                  className="gap-2"
                >
                  Criar Conta
                </Button>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-12 flex items-center justify-center">
            <Card className="w-full max-w-md glass-card border-primary/30">
              <CardHeader className="text-center">
                <LogIn className="w-12 h-12 text-primary mx-auto mb-2" />
                <CardTitle className="text-2xl">Área do Membro</CardTitle>
                <CardDescription>
                  Entre com seu email e senha para acessar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Senha</label>
                    <Input
                      type="password"
                      placeholder="Sua senha"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Ainda não tem conta?{' '}
                    <button 
                      onClick={() => navigate('/vendas')}
                      className="text-primary hover:underline font-medium"
                    >
                      Criar agora por R$57/mês
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Check if subscription is pending (not paid yet)
  if (user.subscription_status === 'pending') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          <header className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Logo size="lg" />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </header>

          <div className="container mx-auto px-4 py-12 flex items-center justify-center">
            <Card className="w-full max-w-lg glass-card border-primary/30">
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Olá, {user.username}! 👋</CardTitle>
                <CardDescription className="text-base">
                  Para usar a I.A MRO, complete seu pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-primary/10 rounded-xl border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Plano Mensal</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-muted-foreground text-lg line-through">R$ 197</span>
                    <span className="text-4xl font-bold text-primary">R$ 57</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Análise completa do seu perfil</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Estratégia personalizada de 30 dias</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>6 criativos profissionais com I.A</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Calendário de postagens</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Otimização de bio do Instagram</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-14 text-lg"
                  variant="gradient"
                  onClick={handleStartPayment}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Pagar R$57 e Ativar Acesso
                </Button>

                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Pagamento Seguro
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    Pix ou Cartão
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Check if subscription expired
  if (user.subscription_status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="max-w-md mx-4 glass-card">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Assinatura Expirada</CardTitle>
            <CardDescription>
              Sua assinatura expirou em {new Date(user.subscription_end!).toLocaleDateString('pt-BR')}.
              Renove para continuar acessando.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button 
              className="w-full"
              variant="gradient"
              onClick={handleStartPayment}
            >
              Renovar por R$57/mês
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasInstagram = !!user.instagram_username;
  const canGenerateStrategy = (user.strategies_generated || 0) < 1;
  const creativesRemaining = 6 - (user.creatives_used || 0);

  return (
    <>
      <LoadingOverlay isVisible={showLoadingOverlay} message={loadingMessage} subMessage={loadingSubMessage} />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Membro Ativo
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Olá, {user.username}! 👋
          </h1>
          <p className="text-muted-foreground">
            {hasInstagram 
              ? `Gerenciando @${user.instagram_username}`
              : 'Adicione seu Instagram para começar'
            }
          </p>
        </div>

        {/* Promo Banner */}
        {showPromo && (
          <Card className="glass-card border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-primary/10 mb-8">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
                <Crown className="w-10 h-10 text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-lg">Quer resultados 10x maiores?</h3>
                  <p className="text-muted-foreground">
                    Conheça a Ferramenta MRO - Valor promocional exclusivo para membros!
                  </p>
                </div>
              </div>
              <Button onClick={openWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700">
                <MessageCircle className="w-4 h-4" />
                Falar com Administrador
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Instagram */}
        {!hasInstagram && (
          <Card className="glass-card border-primary/30 max-w-lg mx-auto mb-8">
            <CardHeader className="text-center">
              <Instagram className="w-12 h-12 text-pink-500 mx-auto mb-2" />
              <CardTitle>Adicione seu Instagram</CardTitle>
              <CardDescription>
                Digite o @ do Instagram que você quer analisar e receber estratégias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="@seuinstagram ou link do perfil"
                  value={instagramInput}
                  onChange={(e) => setInstagramInput(e.target.value)}
                  disabled={isAddingInstagram}
                />
                <Button 
                  onClick={handleAddInstagram}
                  disabled={isAddingInstagram}
                >
                  {isAddingInstagram ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                ⚠️ Após adicionar, não será possível remover ou trocar o perfil
              </p>
            </CardContent>
          </Card>
        )}

        {/* Generating Strategy */}
        {hasInstagram && isGeneratingStrategy && (
          <Card className="glass-card max-w-lg mx-auto mb-8">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Gerando sua Estratégia...</h3>
              <p className="text-muted-foreground">
                A I.A MRO está analisando seu perfil e criando uma estratégia personalizada de 30 dias
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {hasInstagram && !isGeneratingStrategy && (
          <Tabs defaultValue="strategy" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="strategy" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Estratégia
              </TabsTrigger>
              <TabsTrigger value="creatives" className="gap-2">
                <Palette className="w-4 h-4" />
                Criativos ({creativesRemaining})
              </TabsTrigger>
              <TabsTrigger value="tutorial" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Tutorial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="strategy">
              {strategy ? (
                <StrategyDisplay 
                  strategy={strategy} 
                />
              ) : (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhuma estratégia gerada</h3>
                    <p className="text-muted-foreground mb-4">
                      {canGenerateStrategy 
                        ? "Clique no botão abaixo para gerar sua estratégia"
                        : "Você já usou sua estratégia deste mês"
                      }
                    </p>
                    {canGenerateStrategy && profileData && (
                      <Button onClick={() => generateStrategy(user.instagram_username!, profileData)}>
                        Gerar Estratégia
                        <Sparkles className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="creatives">
              {strategy && profileData ? (
                <CreativeGenerator 
                  profile={profileData}
                  strategy={strategy}
                  niche={profileData.businessType || 'geral'}
                  creativesRemaining={creativesRemaining}
                  onCreativeGenerated={(creative, credits) => {
                    updateMember({ creatives_used: (user.creatives_used || 0) + credits });
                  }}
                  onClose={() => {}}
                />
              ) : (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Gere sua estratégia primeiro</h3>
                    <p className="text-muted-foreground">
                      Você precisa ter uma estratégia ativa para gerar criativos
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tutorial">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    Como usar o I.A MRO
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 bg-primary/5 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold">Estratégia de 30 Dias</h4>
                        <p className="text-muted-foreground text-sm">
                          Sua estratégia inclui um calendário completo de postagens, hashtags otimizadas e dicas de bio. 
                          Siga o calendário diariamente para melhores resultados.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-primary/5 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold">Gere Criativos</h4>
                        <p className="text-muted-foreground text-sm">
                          Você tem 6 criativos inclusos. Use-os para posts no feed ou stories. 
                          Cada criativo gerado consome 1 crédito (manual consome 2).
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-primary/5 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold">Agende suas Postagens</h4>
                        <p className="text-muted-foreground text-sm">
                          Use o Meta Business Suite para agendar seus posts. 
                          Assim você mantém a consistência mesmo nos dias ocupados.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <Crown className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-yellow-600">Ferramenta MRO</h4>
                        <p className="text-muted-foreground text-sm">
                          Para resultados ainda maiores, a Ferramenta MRO automatiza 200 interações 
                          orgânicas por dia. Fale com o administrador para liberar acesso com valor promocional.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 gap-2"
                          onClick={openWhatsApp}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Consultar Valor
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{user.strategies_generated || 0}/1</p>
              <p className="text-sm text-muted-foreground">Estratégias Geradas</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <Palette className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{creativesRemaining}/6</p>
              <p className="text-sm text-muted-foreground">Criativos Disponíveis</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {user.subscription_end 
                  ? new Date(user.subscription_end).toLocaleDateString('pt-BR')
                  : '-'
                }
              </p>
              <p className="text-sm text-muted-foreground">Válido até</p>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
