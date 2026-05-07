import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Save, 
  LogOut, 
  Loader2,
  Instagram,
  MessageCircle,
  Send,
  Upload,
  MapPin,
  Briefcase,
  Calculator,
  CreditCard,
  CheckCircle,
  Clock,
  ExternalLink,
  Lock,
  ArrowRight,
  Image,
  X,
  Users,
  ChevronDown,
  ChevronUp,
  Pencil,
  AlertCircle
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  subscription_start: string;
  subscription_end: string;
}

interface ClientData {
  id?: string;
  niche: string;
  region: string;
  instagram: string;
  whatsapp: string;
  telegram_group: string;
  logo_url: string;
  observations: string;
  sales_page_url?: string;
  competitor1_instagram?: string;
  competitor2_instagram?: string;
  media_urls?: string[];
  offer_description?: string;
  edit_count?: number;
  campaign_active?: boolean;
  campaign_activated_at?: string;
  campaign_end_date?: string;
}

interface BalanceOrder {
  id: string;
  amount: number;
  leads_quantity: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  infinitepay_link?: string;
  nsu_order?: string;
}

interface PendingPayment {
  email: string;
  password: string;
  paymentLink: string;
  nsuOrder: string;
}

const AdsNewsDash = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [clientData, setClientData] = useState<ClientData>({
    niche: "",
    region: "",
    instagram: "",
    whatsapp: "",
    telegram_group: "",
    logo_url: "",
    observations: "",
    competitor1_instagram: "",
    competitor2_instagram: "",
    media_urls: [],
    offer_description: ""
  });
  const [balanceOrders, setBalanceOrders] = useState<BalanceOrder[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isDataFormCollapsed, setIsDataFormCollapsed] = useState(true);
  
  // Payment overlay state
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600);
  
  // Balance calculator
  const [leadsQuantity, setLeadsQuantity] = useState(53);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balancePaymentLink, setBalancePaymentLink] = useState("");

  // Calculate cost based on leads (R$3.80 - R$4.70 per lead, using R$4 average)
  // Minimum Meta daily spend: R$7/day = R$210 for 30 days
  // Maximum balance limit: R$700 (contact admin for more)
  const costPerLead = 4;
  const minDailySpend = 7; // Meta minimum
  const minMonthlySpend = minDailySpend * 30; // R$210
  const maxBalanceLimit = 700; // Maximum R$700 limit
  const minLeads = Math.ceil(minMonthlySpend / costPerLead); // ~53 leads
  const maxLeads = Math.floor(maxBalanceLimit / costPerLead); // ~175 leads
  const rawCalculatedAmount = Math.max(minMonthlySpend, leadsQuantity * costPerLead);
  const calculatedAmount = Math.min(rawCalculatedAmount, maxBalanceLimit);
  const isOverLimit = rawCalculatedAmount > maxBalanceLimit;
  const dailyBudgetCalculated = calculatedAmount / 30;

  useEffect(() => {
    // Check if coming from registration with pending payment
    const isPending = searchParams.get('pending') === 'true';
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    
    // Check for pending payment data in localStorage
    const storedPending = localStorage.getItem('ads_pending_payment');
    
    if (isPending && storedPending) {
      const pendingData: PendingPayment = JSON.parse(storedPending);
      setPendingPayment(pendingData);
      setShowPaymentOverlay(true);
      startPaymentCheck(pendingData.email, pendingData.nsuOrder, pendingData.password);
      // Still load user data in background - allow pending users
      if (email && password) {
        loadUserData(email, password, true, true);
      }
    } else if (email && password) {
      handleLogin(email, password);
    } else {
      // Check if user is stored in localStorage
      const storedUser = localStorage.getItem('ads_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        loadUserData(userData.email, userData.password);
      } else {
        setShowLogin(true);
        setLoading(false);
      }
    }
  }, [searchParams]);

  // Auto-check pending balance orders every 5 seconds
  useEffect(() => {
    if (!user) return;

    // Get pending balance orders within 5 minutes
    const pendingOrders = balanceOrders.filter(order => {
      if (order.status !== 'pending') return false;
      const createdAt = new Date(order.created_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return createdAt > fiveMinutesAgo;
    });

    if (pendingOrders.length === 0) return;

    const checkBalancePayments = async () => {
      for (const order of pendingOrders) {
        if (!order.nsu_order) continue;
        
        try {
          const { data } = await supabase.functions.invoke('ads-check-payment', {
            body: { order_nsu: order.nsu_order, email: user.email, type: 'balance' }
          });

          if (data?.paid) {
            // Payment confirmed! Reload user data
            const storedUser = localStorage.getItem('ads_user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              loadUserData(userData.email, userData.password);
            }
            toast({
              title: "Pagamento de saldo confirmado!",
              description: "Seu saldo para anúncios foi adicionado."
            });
            break;
          } else if (data?.expired || data?.deleted) {
            // Order expired, reload to remove from list
            const storedUser = localStorage.getItem('ads_user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              loadUserData(userData.email, userData.password);
            }
          }
        } catch (error) {
          console.error('Error checking balance payment:', error);
        }
      }
    };

    // Check immediately
    checkBalancePayments();

    // Then check every 5 seconds
    const interval = setInterval(checkBalancePayments, 5000);

    return () => clearInterval(interval);
  }, [user, balanceOrders]);

  const startPaymentCheck = (email: string, orderNsu: string, password: string) => {
    setCheckingPayment(true);
    setTimeRemaining(600);
    
    const startTime = Date.now();
    const maxDuration = 10 * 60 * 1000; // 10 minutes
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((maxDuration - elapsed) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
    
    // Payment check every 4 seconds
    const checkInterval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('ads-check-payment', {
          body: { order_nsu: orderNsu, email }
        });

        if (data?.paid) {
          clearInterval(checkInterval);
          clearInterval(countdownInterval);
          setCheckingPayment(false);
          setShowPaymentOverlay(false);
          localStorage.removeItem('ads_pending_payment');
          localStorage.setItem('ads_user', JSON.stringify({ email, password }));
          toast({
            title: "Pagamento confirmado!",
            description: "Acesso liberado! Preencha seus dados."
          });
          // Reload user data
          loadUserData(email, password);
        }
      } catch (error) {
        console.error('Check payment error:', error);
      }
    }, 4000);

    // Stop checking after 10 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      clearInterval(countdownInterval);
      setCheckingPayment(false);
    }, maxDuration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadUserData = async (email: string, password: string, skipOverlayCheck = false, allowPending = false) => {
    try {
      const { data, error } = await supabase.functions.invoke('ads-auth', {
        body: { action: 'login', email, password, allowPending }
      });

      if (error) throw error;

      if (data.success) {
        setUser(data.user);
        if (data.clientData) {
          setClientData({
            id: data.clientData.id || data.user.id,
            niche: data.clientData.niche || "",
            region: data.clientData.region || "",
            instagram: data.clientData.instagram || "",
            whatsapp: data.clientData.whatsapp || "",
            telegram_group: data.clientData.telegram_group || "",
            logo_url: data.clientData.logo_url || "",
            observations: data.clientData.observations || "",
            sales_page_url: data.clientData.sales_page_url || "",
            competitor1_instagram: data.clientData.competitor1_instagram || "",
            competitor2_instagram: data.clientData.competitor2_instagram || "",
            media_urls: data.clientData.media_urls || [],
            offer_description: data.clientData.offer_description || "",
            edit_count: data.clientData.edit_count || 0,
            campaign_active: data.clientData.campaign_active || false,
            campaign_activated_at: data.clientData.campaign_activated_at || "",
            campaign_end_date: data.clientData.campaign_end_date || ""
          });
        }
        setBalanceOrders(data.balanceOrders || []);
        
        // Check if user is pending and needs to pay
        if (!skipOverlayCheck && data.user.status === 'pending') {
          // Check for stored pending payment
          const storedPending = localStorage.getItem('ads_pending_payment');
          if (storedPending) {
            const pendingData: PendingPayment = JSON.parse(storedPending);
            setPendingPayment(pendingData);
            setShowPaymentOverlay(true);
            startPaymentCheck(email, pendingData.nsuOrder, password);
          }
        } else {
          // Clear any stored pending payment data if user is active
          localStorage.removeItem('ads_pending_payment');
        }
        
        localStorage.setItem('ads_user', JSON.stringify({ email, password }));
        setShowLogin(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao fazer login",
        variant: "destructive"
      });
      setShowLogin(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email?: string, password?: string) => {
    const emailToUse = email || loginData.email;
    const passwordToUse = password || loginData.password;
    
    if (!emailToUse || !passwordToUse) {
      toast({
        title: "Erro",
        description: "Preencha email e senha",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    await loadUserData(emailToUse, passwordToUse);
  };

  const handleLogout = () => {
    localStorage.removeItem('ads_user');
    setUser(null);
    setShowLogin(true);
  };

  const handleSaveData = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('ads-auth', {
        body: {
          action: 'save-client-data',
          userId: user.id,
          niche: clientData.niche,
          region: clientData.region,
          instagram: clientData.instagram,
          whatsapp: clientData.whatsapp,
          telegramGroup: clientData.telegram_group,
          logoUrl: clientData.logo_url,
          observations: clientData.observations,
          competitor1Instagram: clientData.competitor1_instagram,
          competitor2Instagram: clientData.competitor2_instagram,
          mediaUrls: clientData.media_urls,
          offerDescription: clientData.offer_description
        }
      });

      if (error) throw error;

      // Mark that data has an ID now (saved) and increment edit count locally
      if (!clientData.id) {
        setClientData(prev => ({ ...prev, id: user.id, edit_count: 1 }));
      } else {
        setClientData(prev => ({ ...prev, edit_count: (prev.edit_count || 0) + 1 }));
      }
      
      // Collapse the form after successful save
      setIsDataFormCollapsed(true);

      const newEditCount = (clientData.edit_count || 0) + 1;
      const remaining = Math.max(0, 2 - newEditCount);
      
      toast({
        title: "Dados salvos!",
        description: remaining > 0 
          ? `Suas informações foram salvas com sucesso. Você ainda pode editar ${remaining} vez${remaining !== 1 ? 'es' : ''} antes da campanha iniciar.`
          : "Suas informações foram salvas. Limite de edições atingido."
      });
    } catch (error: unknown) {
      console.error('Save error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar dados",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Apenas arquivos PNG, JPG ou PDF são permitidos",
        variant: "destructive"
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-logo.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-data')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('user-data')
        .getPublicUrl(filePath);

      setClientData({ ...clientData, logo_url: urlData.publicUrl });
      toast({
        title: "Logo enviada!",
        description: "Sua logomarca foi enviada com sucesso"
      });
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar logo",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const currentMediaCount = clientData.media_urls?.length || 0;
    const maxFiles = 10;
    const remainingSlots = maxFiles - currentMediaCount;

    if (files.length > remainingSlots) {
      toast({
        title: "Limite excedido",
        description: `Você pode enviar no máximo ${remainingSlots} arquivo(s) (máximo total: ${maxFiles})`,
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];
    const maxSize = 90 * 1024 * 1024; // 90MB

    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo não permitido",
          description: `${file.name}: Apenas imagens (PNG, JPG, GIF, WebP) e vídeos (MP4, MOV, WebM) são permitidos`,
          variant: "destructive"
        });
        return;
      }
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name}: Tamanho máximo é 90MB`,
          variant: "destructive"
        });
        return;
      }
    }

    setUploadingMedia(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${user.id}-media-${timestamp}.${fileExt}`;
        const filePath = `ads-media/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);
      }

      setClientData({ 
        ...clientData, 
        media_urls: [...(clientData.media_urls || []), ...newUrls] 
      });
      
      toast({
        title: "Mídia(s) enviada(s)!",
        description: `${newUrls.length} arquivo(s) enviado(s) com sucesso`
      });
    } catch (error: unknown) {
      console.error('Media upload error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar mídia",
        variant: "destructive"
      });
    } finally {
      setUploadingMedia(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (urlToRemove: string) => {
    setClientData({
      ...clientData,
      media_urls: (clientData.media_urls || []).filter(url => url !== urlToRemove)
    });
  };

  const handleAddBalance = async () => {
    if (!user || leadsQuantity < 1) return;

    // Check if amount exceeds limit
    if (isOverLimit) {
      toast({
        title: "Limite de saldo excedido",
        description: "O valor máximo permitido é R$700. Para investir mais, entre em contato com o administrador.",
        variant: "destructive"
      });
      return;
    }

    setBalanceLoading(true);
    try {
      // TESTING: Using R$2 for testing payment flow
      const testAmount = 2;
      
      const { data, error } = await supabase.functions.invoke('ads-balance-checkout', {
        body: {
          userId: user.id,
          email: user.email,
          amount: testAmount, // Using R$2 for testing
          leadsQuantity
        }
      });

      if (error) throw error;

      if (data.success && data.paymentLink) {
        setBalancePaymentLink(data.paymentLink);
        toast({
          title: "Link de pagamento gerado!",
          description: "Clique para adicionar saldo"
        });
      }
    } catch (error: unknown) {
      console.error('Balance checkout error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar pagamento",
        variant: "destructive"
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  const hasPaidBalance = balanceOrders.some(order => order.status === 'paid');
  const hasDataFilled = clientData.id && clientData.niche && clientData.whatsapp;
  
  // Calculate if there's an active campaign (paid within last 30 days)
  const activeCampaign = balanceOrders.find(order => {
    if (order.status !== 'paid' || !order.paid_at) return false;
    const paidDate = new Date(order.paid_at);
    const endDate = new Date(paidDate);
    endDate.setDate(endDate.getDate() + 30);
    return new Date() < endDate;
  });
  
  const campaignEndDate = activeCampaign ? (() => {
    const paidDate = new Date(activeCampaign.paid_at!);
    const endDate = new Date(paidDate);
    endDate.setDate(endDate.getDate() + 30);
    return endDate;
  })() : null;
  
  const daysRemaining = campaignEndDate ? Math.ceil((campaignEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  // Check if user can edit business data
  // Can edit if: edit_count < 2 AND no paid balance, OR campaign ended (30 days passed)
  const editCount = clientData.edit_count || 0;
  const canEditData = (editCount < 2 && !hasPaidBalance) || (!activeCampaign && hasPaidBalance);
  const editsRemaining = Math.max(0, 2 - editCount);
  
  // Daily budget calculation (use the pre-calculated value)
  const dailyBudget = dailyBudgetCalculated;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/ads-news-full.png" alt="Ads News" className="h-12 mx-auto mb-4" />
            <CardTitle>Acesse sua conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Sua senha"
              />
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => handleLogin()}
            >
              Entrar
            </Button>
            <p className="text-center text-sm text-gray-500">
              Não tem conta? <a href="/anuncios" className="text-blue-600 hover:underline">Cadastre-se aqui</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Payment Overlay - Blocking until payment confirmed */}
      {showPaymentOverlay && pendingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blurred background */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Payment card */}
          <Card className="relative z-10 w-full max-w-md bg-white shadow-2xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-10 w-10 text-orange-600" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Monte sua campanha!
                </h3>
                <p className="text-gray-600">
                  Para liberar o acesso à sua dashboard e montar sua campanha com seus dados, faça o pagamento de:
                </p>
              </div>
              
              <div className="text-4xl font-bold text-orange-600">
                R$ 397
              </div>
              
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6"
                onClick={() => window.open(pendingPayment.paymentLink, '_blank')}
              >
                Pagar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              {checkingPayment && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Verificando pagamento...</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Tempo restante: <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Ao identificar o pagamento, sua dashboard será liberada automaticamente
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src="/ads-news-full.png" alt="Ads News" className="h-10" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              {user?.name}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-2">Bem-vindo, {user?.name}!</h1>
            <p className="text-blue-100">
              {hasPaidBalance 
                ? "Suas campanhas estão sendo preparadas!"
                : "Preencha seus dados abaixo para começarmos a criar seus anúncios"
              }
            </p>
            <div className="mt-3 space-y-1">
              {user?.subscription_end && (
                <p className="text-sm text-blue-200">
                  Assinatura válida até: {new Date(user.subscription_end).toLocaleDateString('pt-BR')}
                </p>
              )}
              {hasPaidBalance && (() => {
                // Find the most recent paid balance order
                const paidBalanceOrder = balanceOrders.find(o => o.status === 'paid' && o.paid_at);
                if (paidBalanceOrder?.paid_at) {
                  const campaignEndDate = new Date(paidBalanceOrder.paid_at);
                  campaignEndDate.setDate(campaignEndDate.getDate() + 30);
                  return (
                    <>
                      <p className="text-sm text-green-300">
                        Saldo adicionado: R$ {paidBalanceOrder.amount.toFixed(2)} para campanhas até: {campaignEndDate.toLocaleDateString('pt-BR')} (30 dias)
                      </p>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps - Show when balance is paid */}
        {hasPaidBalance && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
                Status da sua campanha
              </h3>
              
              {/* Progress Steps */}
              <div className="space-y-4">
                {/* Step 1 - Subscription */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-green-200">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Assinatura Ativa</h4>
                    <p className="text-sm text-gray-600">Pagamento inicial reconhecido</p>
                  </div>
                  <span className="text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full">
                    APROVADO ✓
                  </span>
                </div>

                {/* Step 2 - Business Data */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-green-200">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Dados do Negócio</h4>
                    <p className="text-sm text-gray-600">Informações salvas na nuvem</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full">
                      APROVADO ✓
                    </span>
                    {canEditData && (
                      <button
                        onClick={() => setIsDataFormCollapsed(false)}
                        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                        title={`Editar dados (${editsRemaining} edição${editsRemaining !== 1 ? 's' : ''} restante${editsRemaining !== 1 ? 's' : ''})`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {!canEditData && activeCampaign && (
                      <button
                        disabled
                        className="p-2 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed"
                        title={`Edição bloqueada durante campanha ativa (${daysRemaining} dias restantes)`}
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3 - Balance Payment */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-green-200">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Saldo para Anúncios</h4>
                    <p className="text-sm text-gray-600">Pagamento reconhecido e confirmado</p>
                  </div>
                  <span className="text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full">
                    APROVADO ✓
                  </span>
                </div>

                {/* Step 4 - Campaign Status */}
                {clientData.campaign_active || clientData.sales_page_url ? (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-green-200">
                    <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">
                        {clientData.campaign_active ? 'Campanhas Ativas' : 'Página de Vendas Criada'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {clientData.campaign_active ? 'Seus anúncios estão rodando!' : 'Sua página de vendas está pronta!'}
                      </p>
                    </div>
                    <span className="text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full">
                      APROVADO ✓
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm border-2 border-blue-400">
                    <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-800">Criando suas Campanhas</h4>
                      <p className="text-sm text-blue-600">Estamos montando seus anúncios agora!</p>
                    </div>
                    <span className="text-blue-600 font-bold text-sm bg-blue-100 px-3 py-1 rounded-full animate-pulse">
                      EM PROGRESSO...
                    </span>
                  </div>
                )}
              </div>

              {/* Final Message - Only show if campaign NOT active AND no sales page */}
              {!clientData.campaign_active && !clientData.sales_page_url && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-300 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Send className="h-5 w-5 text-green-600" />
                    <span className="font-bold text-green-800">Aguarde!</span>
                  </div>
                  <p className="text-green-700">
                    Estamos criando suas campanhas a partir de agora. Você receberá uma notificação aqui e no seu email quando estiver pronto!
                  </p>
                </div>
              )}

              {/* Campaign Active - Show sales page prominently */}
              {clientData.campaign_active && clientData.sales_page_url && (
                <div className="mt-8 p-8 bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500 rounded-2xl text-white text-center shadow-2xl border-4 border-yellow-400">
                  {/* Main highlight - Page Ready */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <span className="text-4xl font-black uppercase tracking-wide drop-shadow-lg">
                      🎉 SUA PÁGINA ESTÁ PRONTA!
                    </span>
                  </div>
                  
                  {/* Sales page link */}
                  <div className="bg-white/25 rounded-xl p-5 mb-6 backdrop-blur-sm">
                    <p className="text-sm text-green-100 mb-2">Sua página de vendas:</p>
                    <a 
                      href={clientData.sales_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-bold text-xl hover:underline flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-6 w-6" />
                      {clientData.sales_page_url}
                    </a>
                  </div>

                  {/* Leads capture status with BIG spinning loader */}
                  <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 rounded-2xl p-8 mb-6 text-gray-900 shadow-xl animate-pulse">
                    <div className="flex flex-col items-center gap-4">
                      {/* Big spinning icon */}
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl border-4 border-white">
                          <Loader2 className="h-16 w-16 animate-spin text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                          ATIVADO
                        </div>
                      </div>
                      
                      {/* Text */}
                      <div className="text-center">
                        <p className="text-3xl font-black uppercase tracking-wide mb-2">
                          ESTAMOS CAPTANDO LEADS PARA VOCÊ!
                        </p>
                        <p className="text-lg font-semibold">
                          Conforme os seus dados e suas configurações
                        </p>
                      </div>
                      
                      {/* WhatsApp message */}
                      <div className="bg-white/50 rounded-xl px-6 py-3 mt-2">
                        <p className="text-xl font-bold flex items-center gap-2">
                          <MessageCircle className="h-6 w-6" />
                          Aguarde no seu WhatsApp!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Campaign dates */}
                  {clientData.campaign_end_date && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-sm text-green-100">Campanha ativa até:</p>
                        <p className="font-bold text-2xl">{new Date(clientData.campaign_end_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      {activeCampaign && (
                        <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                          <p className="text-sm text-green-100">Saldo investido:</p>
                          <p className="font-bold text-2xl">R$ {activeCampaign.amount.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Report info message */}
                  <div className="p-4 bg-white/15 rounded-xl border-2 border-white/30 backdrop-blur-sm">
                    <p className="text-lg text-white font-semibold">
                      📊 <strong>Aguarde Relatório em 30 dias</strong>
                    </p>
                    <p className="text-sm text-green-100 mt-1">
                      Acompanhe no seu email e aqui na sua área de membros
                    </p>
                  </div>
                </div>
              )}

              {/* Sales page link when campaign NOT active but URL exists - show big spinning loader too */}
              {!clientData.campaign_active && clientData.sales_page_url && (
                <div className="mt-8 p-8 bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500 rounded-2xl text-white text-center shadow-2xl border-4 border-yellow-400">
                  {/* Main highlight - Page Ready */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <span className="text-4xl font-black uppercase tracking-wide drop-shadow-lg">
                      🎉 SUA PÁGINA ESTÁ PRONTA!
                    </span>
                  </div>
                  
                  {/* Sales page link */}
                  <div className="bg-white/25 rounded-xl p-5 mb-6 backdrop-blur-sm">
                    <p className="text-sm text-green-100 mb-2">Sua página de vendas:</p>
                    <a 
                      href={clientData.sales_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-bold text-xl hover:underline flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-6 w-6" />
                      {clientData.sales_page_url}
                    </a>
                  </div>

                  {/* Leads capture status with BIG spinning loader */}
                  <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 rounded-2xl p-8 mb-6 text-gray-900 shadow-xl animate-pulse">
                    <div className="flex flex-col items-center gap-4">
                      {/* Big spinning icon */}
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl border-4 border-white">
                          <Loader2 className="h-16 w-16 animate-spin text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                          ATIVADO
                        </div>
                      </div>
                      
                      {/* Text */}
                      <div className="text-center">
                        <p className="text-3xl font-black uppercase tracking-wide mb-2">
                          ESTAMOS CAPTANDO LEADS PARA VOCÊ!
                        </p>
                        <p className="text-lg font-semibold">
                          Conforme os seus dados e suas configurações
                        </p>
                      </div>
                      
                      {/* WhatsApp message */}
                      <div className="bg-white/50 rounded-xl px-6 py-3 mt-2">
                        <p className="text-xl font-bold flex items-center gap-2">
                          <MessageCircle className="h-6 w-6" />
                          Aguarde no seu WhatsApp!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Report info message */}
                  <div className="p-4 bg-white/15 rounded-xl border-2 border-white/30 backdrop-blur-sm">
                    <p className="text-lg text-white font-semibold">
                      📊 <strong>Aguarde Relatório em 30 dias</strong>
                    </p>
                    <p className="text-sm text-green-100 mt-1">
                      Acompanhe no seu email e aqui na sua área de membros
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Client Data Form - Only show if balance is NOT paid OR if user clicked edit button */}
        {(!hasPaidBalance || !isDataFormCollapsed) && canEditData && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader 
            className={`cursor-pointer transition-colors ${hasDataFilled ? 'hover:bg-slate-800' : ''}`}
            onClick={() => hasDataFilled && setIsDataFormCollapsed(!isDataFormCollapsed)}
          >
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-400" />
                Dados do seu negócio
                {hasDataFilled && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full ml-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Salvo
                  </span>
                )}
              </div>
              {hasDataFilled && (
                isDataFormCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                )
              )}
            </CardTitle>
            {hasDataFilled && isDataFormCollapsed && (
              <p className="text-sm text-slate-400 mt-1">
                Clique para editar seus dados
              </p>
            )}
          </CardHeader>
          {(!hasDataFilled || !isDataFormCollapsed) && (
          <CardContent className="space-y-4 bg-slate-900">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 text-white">
                  <Briefcase className="h-4 w-4 text-blue-400" />
                  Nicho de atuação *
                </Label>
                <Input
                  value={clientData.niche}
                  onChange={(e) => setClientData({ ...clientData, niche: e.target.value })}
                  placeholder="Ex: Restaurante, Loja de roupas, Imobiliária..."
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-white">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  Região de atuação
                </Label>
                <Input
                  value={clientData.region}
                  onChange={(e) => setClientData({ ...clientData, region: e.target.value })}
                  placeholder="Ex: São Paulo - SP ou Brasil todo"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-white">
                  <Instagram className="h-4 w-4 text-pink-400" />
                  Instagram
                </Label>
                <Input
                  value={clientData.instagram}
                  onChange={(e) => setClientData({ ...clientData, instagram: e.target.value })}
                  placeholder="@seuinstagram"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-white">
                  <MessageCircle className="h-4 w-4 text-green-400" />
                  WhatsApp para os leads *
                </Label>
                <Input
                  value={clientData.whatsapp}
                  onChange={(e) => setClientData({ ...clientData, whatsapp: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-white">
                  <Send className="h-4 w-4 text-blue-400" />
                  Link do grupo Telegram (opcional)
                </Label>
                <Input
                  value={clientData.telegram_group}
                  onChange={(e) => setClientData({ ...clientData, telegram_group: e.target.value })}
                  placeholder="https://t.me/seugrupo"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-white">
                  <Upload className="h-4 w-4 text-blue-400" />
                  Logomarca (PNG, JPG ou PDF)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="bg-slate-800 border-slate-600 text-white file:bg-slate-700 file:text-white file:border-0"
                  />
                  {uploadingLogo && <Loader2 className="h-5 w-5 animate-spin text-blue-400" />}
                </div>
                {clientData.logo_url && (
                  <p className="text-xs text-green-400 mt-1">✓ Logo enviada</p>
                )}
              </div>
            </div>

            {/* Competitors Section */}
            <div className="border-t border-slate-700 pt-4 mt-4">
              <h4 className="font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                Concorrentes (para referência)
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 text-white">
                    <Instagram className="h-4 w-4 text-pink-400" />
                    Concorrente 1 - Link do Instagram
                  </Label>
                  <Input
                    value={clientData.competitor1_instagram || ""}
                    onChange={(e) => setClientData({ ...clientData, competitor1_instagram: e.target.value })}
                    placeholder="https://instagram.com/concorrente1"
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2 text-white">
                    <Instagram className="h-4 w-4 text-pink-400" />
                    Concorrente 2 - Link do Instagram
                  </Label>
                  <Input
                    value={clientData.competitor2_instagram || ""}
                    onChange={(e) => setClientData({ ...clientData, competitor2_instagram: e.target.value })}
                    placeholder="https://instagram.com/concorrente2"
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="border-t border-slate-700 pt-4 mt-4">
              <h4 className="font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Image className="h-4 w-4 text-blue-400" />
                Mídias da sua empresa (até 10 arquivos, máx. 90MB cada)
              </h4>
              <p className="text-sm text-slate-400 mb-3">
                Envie fotos, vídeos ou imagens que já tem da sua empresa para usarmos nas campanhas
              </p>
              
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                    onChange={handleMediaUpload}
                    disabled={uploadingMedia || (clientData.media_urls?.length || 0) >= 10}
                    multiple
                    className="flex-1 bg-slate-800 border-slate-600 text-white file:bg-slate-700 file:text-white file:border-0"
                  />
                  {uploadingMedia && <Loader2 className="h-5 w-5 animate-spin text-blue-400" />}
                </div>
                
                <p className="text-xs text-slate-400">
                  {clientData.media_urls?.length || 0}/10 arquivos enviados
                </p>

                {/* Media Preview Grid */}
                {clientData.media_urls && clientData.media_urls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                    {clientData.media_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        {url.match(/\.(mp4|mov|webm)$/i) ? (
                          <video 
                            src={url} 
                            className="w-full h-24 object-cover rounded-lg bg-slate-700"
                          />
                        ) : (
                          <img 
                            src={url} 
                            alt={`Mídia ${index + 1}`} 
                            className="w-full h-24 object-cover rounded-lg bg-slate-700"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(url)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Offer Description - Highlighted Yellow */}
            <div className="border-t border-slate-700 pt-4 mt-4">
              <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-4">
                <Label className="text-amber-300 font-medium text-base">
                  ✨ Descreva com suas palavras o que você está oferecendo nesse anúncio
                </Label>
                <p className="text-sm text-amber-400/80 mb-3">
                  Explique de forma clara e atrativa o que seu cliente vai receber
                </p>
                <Textarea
                  value={clientData.offer_description || ""}
                  onChange={(e) => setClientData({ ...clientData, offer_description: e.target.value })}
                  placeholder="Ex: Curso completo de confeitaria com 50 receitas exclusivas, acesso vitalício e certificado incluso..."
                  rows={4}
                  className="bg-slate-800 border-amber-600/50 focus:border-amber-400 focus:ring-amber-400 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Observações (informações adicionais sobre o negócio)</Label>
              <Textarea
                value={clientData.observations}
                onChange={(e) => setClientData({ ...clientData, observations: e.target.value })}
                placeholder="Descreva seu negócio, produtos, diferenciais..."
                rows={4}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <Button 
              onClick={handleSaveData} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Dados
                </>
              )}
            </Button>
          </CardContent>
          )}
        </Card>
        )}

        {/* Balance Calculator - Only show after data is filled and balance NOT paid */}
        {hasDataFilled && !hasPaidBalance && (
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Calculator className="h-5 w-5" />
                Adicionar Saldo para Anúncios Meta (Facebook/Instagram)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Explanation Section */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">📢 Importante entender:</h4>
                <div className="space-y-2 text-sm text-amber-900">
                  <p>
                    <strong>O valor pago anteriormente (R$397)</strong> foi para a <strong>Ads News - desenvolvida pela MRO</strong>, 
                    para nós desenvolvermos, configurarmos e gerenciarmos suas campanhas de anúncios!
                  </p>
                  <p>
                    <strong>Agora, o saldo abaixo</strong> é o valor que vai <strong>diretamente para o Meta (Facebook/Instagram)</strong>. 
                    Cada lead que chegar no seu WhatsApp ou site tem um custo cobrado pelo Facebook, e esse valor é apenas para isso.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Média por lead:</strong> R$3,80 a R$4,70
                </p>
                <p className="text-sm text-blue-600">
                  Calcule quantas pessoas deseja receber no seu WhatsApp por mês
                </p>
              </div>

              {/* Active Campaign Banner */}
              {activeCampaign && (
                <div className="bg-green-100 border border-green-300 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Campanha Ativa!</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white p-3 rounded">
                      <p className="text-gray-500">Saldo investido</p>
                      <p className="font-bold text-green-700">R$ {activeCampaign.amount.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-gray-500">Gasto diário</p>
                      <p className="font-bold text-blue-600">R$ {(activeCampaign.amount / 30).toFixed(2)}/dia</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-gray-500">Dias restantes</p>
                      <p className="font-bold text-orange-600">{daysRemaining} dias</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-700 mt-3">
                    Campanha finaliza em: {campaignEndDate?.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {!activeCampaign && (
                <>
                  <div className="space-y-4">
                    <div className={`bg-gradient-to-r ${isOverLimit ? 'from-red-600/20 to-orange-600/20 border-red-500' : 'from-blue-600/20 to-green-600/20 border-blue-500'} border-2 rounded-xl p-4`}>
                      <Label className={`text-lg font-bold ${isOverLimit ? 'text-red-600' : 'text-blue-600'} flex items-center gap-2 mb-3`}>
                        <Users className="h-5 w-5" />
                        Quantidade de leads desejados por mês
                      </Label>
                      <Input
                        type="number"
                        min={minLeads}
                        max={maxLeads}
                        value={leadsQuantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || minLeads;
                          setLeadsQuantity(Math.max(minLeads, value));
                        }}
                        className={`text-2xl font-bold text-center h-14 bg-white border-2 ${isOverLimit ? 'border-red-400 focus:border-red-600 text-red-700' : 'border-blue-400 focus:border-blue-600 text-blue-700'}`}
                      />
                      <div className="flex flex-col gap-1 mt-2">
                        <p className="text-xs text-orange-600 font-medium">
                          Mínimo: {minLeads} leads (R${minMonthlySpend}) - Gasto mínimo Meta: R${minDailySpend}/dia
                        </p>
                        <p className="text-xs text-red-600 font-medium">
                          Máximo: {maxLeads} leads (R${maxBalanceLimit}) - Para mais, contate o admin
                        </p>
                      </div>
                    </div>

                    {/* Over Limit Warning */}
                    {isOverLimit && (
                      <div className="bg-red-100 border border-red-300 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold text-red-800">⚠️ Limite de saldo atingido!</h4>
                        </div>
                        <p className="text-sm text-red-700">
                          O valor máximo permitido é <strong>R$700</strong>. Se você deseja investir mais do que isso, 
                          entre em contato com o administrador para liberação especial.
                        </p>
                        <a 
                          href="https://wa.me/5511999999999?text=Olá! Gostaria de solicitar liberação para investir mais de R$700 em saldo no Ads News."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Contatar Administrador
                        </a>
                      </div>
                    )}

                    {/* Calculation Summary */}
                    <div className="bg-gray-100 p-4 rounded-lg space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="text-gray-600">Valor total (30 dias):</span>
                        <span className={`text-2xl font-bold ${isOverLimit ? 'text-red-600' : 'text-blue-600'}`}>
                          R$ {calculatedAmount.toFixed(2)}
                          {isOverLimit && <span className="text-sm ml-2">(limitado)</span>}
                        </span>
                      </div>
                      <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded">
                          <p className="text-xs text-gray-500">Gasto diário</p>
                          <p className="font-bold text-green-600">R$ {dailyBudget.toFixed(2)}/dia</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="text-xs text-gray-500">Leads estimados</p>
                          <p className={`font-bold ${isOverLimit ? 'text-red-600' : 'text-blue-600'}`}>
                            ~{isOverLimit ? maxLeads : leadsQuantity} leads/mês
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        O saldo será diluído ao longo de 30 dias de campanha
                      </p>
                    </div>

                    {!balancePaymentLink ? (
                      <Button 
                        onClick={handleAddBalance}
                        disabled={balanceLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-base py-6"
                      >
                        {balanceLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Gerando pagamento...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Adicionar Saldo - R$ 2.00 (TESTE)
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Button 
                          onClick={() => window.open(balancePaymentLink, '_blank')}
                          className="w-full bg-green-600 hover:bg-green-700 text-base py-6"
                        >
                          <ExternalLink className="mr-2 h-5 w-5" />
                          Pagar Saldo - R$ 2.00 (TESTE)
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setBalancePaymentLink("")}
                          className="w-full"
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Balance History - Only show pending orders within 5 minutes */}
        {(() => {
          // Filter only pending orders created within the last 5 minutes
          const pendingOrders = balanceOrders.filter(order => {
            if (order.status !== 'pending') return false;
            const createdAt = new Date(order.created_at);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return createdAt > fiveMinutesAgo;
          });

          if (pendingOrders.length === 0 || hasPaidBalance) return null;

          return (
            <Card className="border-yellow-300 bg-yellow-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Clock className="h-5 w-5" />
                  Aguardando Pagamento de Saldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingOrders.map((order) => {
                    const orderDate = new Date(order.created_at);
                    const expiresAt = new Date(orderDate.getTime() + 5 * 60 * 1000);
                    const dailyBudget = order.amount / 30;
                    const paymentLink = order.infinitepay_link;
                    
                    return (
                      <div 
                        key={order.id}
                        className="p-4 rounded-lg border bg-white border-yellow-300"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-yellow-700 font-semibold">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Verificando pagamento...
                            </span>
                            <span className="text-xs text-gray-500">
                              Expira às {expiresAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">Valor</p>
                              <p className="font-bold text-gray-800">R$ {order.amount.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Leads estimados</p>
                              <p className="font-bold text-gray-800">~{order.leads_quantity}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Gasto/dia</p>
                              <p className="font-bold text-blue-600">R$ {dailyBudget.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Duração</p>
                              <p className="font-bold text-gray-800">30 dias</p>
                            </div>
                          </div>
                          
                          {paymentLink && (
                            <Button 
                              onClick={() => window.open(paymentLink, '_blank')}
                              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Pagar Agora
                            </Button>
                          )}
                          
                          <p className="text-xs text-gray-500 text-center">
                            Criado: {orderDate.toLocaleDateString('pt-BR')} às {orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <p className="text-xs text-yellow-700 mt-4 text-center">
                  ⚠️ Se o pagamento não for reconhecido em 5 minutos, gere um novo link de pagamento acima.
                </p>
              </CardContent>
            </Card>
          );
        })()}
      </main>
    </div>
  );
};

export default AdsNewsDash;
