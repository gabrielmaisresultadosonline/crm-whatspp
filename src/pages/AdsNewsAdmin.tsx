import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Users, 
  CreditCard, 
  LogOut, 
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
  ExternalLink,
  Save,
  RotateCcw,
  Mail,
  Phone,
  Calendar,
  Play,
  Instagram,
  MessageCircle,
  MapPin,
  Briefcase,
  Image,
  FileText
} from "lucide-react";
import AdsNewsDocumentation from "@/components/admin/AdsNewsDocumentation";

interface ClientData {
  niche: string;
  region: string;
  instagram: string;
  whatsapp: string;
  telegram_group: string;
  logo_url: string;
  observations: string;
  sales_page_url: string;
  competitor1_instagram: string;
  competitor2_instagram: string;
  media_urls: string[];
  offer_description: string;
  campaign_active?: boolean;
  campaign_activated_at?: string;
  campaign_end_date?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  subscription_start: string;
  subscription_end: string;
  created_at: string;
  ads_client_data?: ClientData[];
  ads_orders?: {
    id: string;
    amount: number;
    status: string;
    paid_at: string;
    created_at: string;
  }[];
  ads_balance_orders?: {
    id: string;
    amount: number;
    leads_quantity: number;
    status: string;
    paid_at: string;
    created_at: string;
  }[];
}

interface Order {
  id: string;
  email: string;
  name: string;
  amount: number;
  status: string;
  paid_at: string | null;
  expired_at: string | null;
  created_at: string;
  infinitepay_link: string;
  user?: {
    id: string;
    status: string;
    subscription_end: string;
    ads_balance_orders?: {
      id: string;
      amount: number;
      status: string;
      paid_at: string;
    }[];
  };
  clientData?: ClientData;
}

const AdsNewsAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [salesPageUrl, setSalesPageUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastVerification, setLastVerification] = useState<Date | null>(null);

  // Activate ads dialog state
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [activatingOrder, setActivatingOrder] = useState<Order | null>(null);
  const [activateForm, setActivateForm] = useState({
    subscriptionEnd: "",
    salesPageUrl: "",
    sendEmail: true
  });
  const [activating, setActivating] = useState(false);

  // View client data dialog
  const [viewDataDialogOpen, setViewDataDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('ads_admin');
    if (storedAdmin) {
      setIsAdmin(true);
      loadAllData();
    } else {
      setLoading(false);
    }
  }, []);

  // Auto-refresh orders every 4 seconds
  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(() => {
      loadOrders();
      setLastVerification(new Date());
    }, 4000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Erro",
        description: "Preencha email e senha",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ads-auth', {
        body: { 
          action: 'admin-login', 
          email: loginData.email, 
          password: loginData.password 
        }
      });

      if (error) throw error;

      if (data.success) {
        localStorage.setItem('ads_admin', JSON.stringify(data.admin));
        setIsAdmin(true);
        await loadAllData();
        toast({
          title: "Login realizado!",
          description: `Bem-vindo, ${data.admin.name || 'Admin'}`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Credenciais inválidas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ads_admin');
    setIsAdmin(false);
  };

  const loadAllData = async () => {
    await Promise.all([loadUsers(), loadOrders()]);
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ads-auth', {
        body: { action: 'get-all-users' }
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ads-auth', {
        body: { action: 'get-all-orders' }
      });

      if (error) throw error;
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast({ title: "Dados atualizados!" });
  };

  const handleMarkAsPaid = async (orderId: string) => {
    try {
      const { error } = await supabase.functions.invoke('ads-auth', {
        body: { action: 'update-order-status', orderId, status: 'paid' }
      });

      if (error) throw error;
      
      await loadAllData();
      toast({ title: "Pedido marcado como pago!" });
    } catch (error) {
      console.error('Update order error:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar pedido",
        variant: "destructive"
      });
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      toast({ title: "Verificando pagamento..." });
      
      const { data, error } = await supabase.functions.invoke('ads-auth', {
        body: { action: 'verify-payment', orderId }
      });

      if (error) throw error;
      
      if (data.paid) {
        await loadAllData();
        toast({ 
          title: "Pagamento confirmado!", 
          description: "Usuário ativado com sucesso."
        });
      } else {
        toast({ 
          title: "Pagamento não encontrado",
          description: data.message || "O pagamento ainda não foi confirmado.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar pagamento",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsExpired = async (orderId: string) => {
    try {
      const { error } = await supabase.functions.invoke('ads-auth', {
        body: { action: 'update-order-status', orderId, status: 'expired' }
      });

      if (error) throw error;
      
      await loadAllData();
      toast({ title: "Pedido marcado como expirado!" });
    } catch (error) {
      console.error('Update order error:', error);
    }
  };

  const handleExpireUser = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('ads-auth', {
        body: { action: 'expire-user', userId }
      });

      if (error) throw error;
      
      await loadAllData();
      toast({ title: "Usuário marcado como expirado!" });
    } catch (error) {
      console.error('Expire user error:', error);
    }
  };

  const handleResendEmail = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ads-auth', {
        body: { action: 'resend-access-email', userId }
      });

      if (error) throw error;

      if (data.success) {
        toast({ title: "Email reenviado com sucesso!" });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao reenviar email",
        variant: "destructive"
      });
    }
  };

  const handleActivateAds = async () => {
    if (!activatingOrder?.user?.id || !activateForm.subscriptionEnd) {
      toast({
        title: "Erro",
        description: "Preencha a data de expiração",
        variant: "destructive"
      });
      return;
    }

    setActivating(true);
    try {
      // Get balance amount from user's paid balance orders
      const userBalanceOrders = activatingOrder.user?.ads_balance_orders || [];
      const paidBalance = userBalanceOrders.find((o: { status: string }) => o.status === 'paid');
      const balanceAmount = paidBalance?.amount || 0;

      const { error } = await supabase.functions.invoke('ads-auth', {
        body: {
          action: 'activate-ads',
          userId: activatingOrder.user.id,
          subscriptionEnd: activateForm.subscriptionEnd,
          salesPageUrl: activateForm.salesPageUrl,
          sendEmail: activateForm.sendEmail,
          balanceAmount
        }
      });

      if (error) throw error;

      await loadAllData();
      setActivateDialogOpen(false);
      setActivatingOrder(null);
      setActivateForm({ subscriptionEnd: "", salesPageUrl: "", sendEmail: true });
      toast({ title: "Anúncios ativados com sucesso!" });
    } catch (error) {
      console.error('Activate ads error:', error);
      toast({
        title: "Erro",
        description: "Erro ao ativar anúncios",
        variant: "destructive"
      });
    } finally {
      setActivating(false);
    }
  };

  const handleSaveSalesPage = async () => {
    if (!selectedUser || !salesPageUrl) return;

    setSavingUrl(true);
    try {
      const { error } = await supabase.functions.invoke('ads-auth', {
        body: { 
          action: 'save-sales-page', 
          userId: selectedUser.id, 
          salesPageUrl 
        }
      });

      if (error) throw error;
      
      await loadUsers();
      toast({ title: "URL salva com sucesso!" });
    } catch (error) {
      console.error('Save URL error:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar URL",
        variant: "destructive"
      });
    } finally {
      setSavingUrl(false);
    }
  };

  const handleEnableRenewal = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('ads-auth', {
        body: { action: 'enable-renewal', userId }
      });

      if (error) throw error;
      
      await loadUsers();
      toast({ title: "Renovação habilitada!" });
    } catch (error) {
      console.error('Enable renewal error:', error);
    }
  };

  const openActivateDialog = (order: Order) => {
    setActivatingOrder(order);
    // Set default date to 30 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setActivateForm({
      subscriptionEnd: defaultDate.toISOString().split('T')[0],
      salesPageUrl: order.clientData?.sales_page_url || "",
      sendEmail: true
    });
    setActivateDialogOpen(true);
  };

  const openViewDataDialog = (order: Order) => {
    setViewingOrder(order);
    setViewDataDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Pago</Badge>;
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Ativo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'expired':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Expirado</Badge>;
      case 'renewal_pending':
        return <Badge className="bg-orange-500"><RotateCcw className="h-3 w-3 mr-1" /> Renovação</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Separate orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const paidOrders = orders.filter(o => o.status === 'paid');
  const expiredOrders = orders.filter(o => o.status === 'expired');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <img src="/ads-news-full.png" alt="Ads News" className="h-12 mx-auto mb-4" />
            <CardTitle className="text-white">Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Email</Label>
              <Input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="admin@email.com"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Senha</Label>
              <Input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Sua senha"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleLogin}
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/ads-news-full.png" alt="Ads News" className="h-10" />
            {lastVerification && (
              <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900 px-3 py-1.5 rounded-lg">
                <RefreshCw className="h-3 w-3 text-green-400 animate-spin" />
                <span>Última verificação: <span className="text-green-400 font-medium">{lastVerification.toLocaleTimeString('pt-BR')}</span></span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-300">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="orders">
          <TabsList className="bg-gray-800 mb-6">
            <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600">
              <CreditCard className="h-4 w-4 mr-2" />
              Pedidos ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">
              <Users className="h-4 w-4 mr-2" />
              Usuários ({users.length})
            </TabsTrigger>
            <TabsTrigger value="docs" className="data-[state=active]:bg-purple-600">
              <FileText className="h-4 w-4 mr-2" />
              Documentação
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pendentes ({pendingOrders.length})
                </h3>
                <div className="grid gap-4">
                  {pendingOrders.map((order) => (
                    <Card key={order.id} className="bg-gray-800 border-yellow-500/30">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{order.name}</span>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-gray-400 flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {order.email}
                            </p>
                            <p className="text-gray-500 text-sm">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {new Date(order.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-400">
                              R$ {order.amount.toFixed(2)}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleVerifyPayment(order.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Verificar
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleMarkAsPaid(order.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Marcar Pago
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleMarkAsExpired(order.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Expirar
                              </Button>
                            </div>
                            {order.infinitepay_link && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2 border-gray-600"
                                onClick={() => window.open(order.infinitepay_link, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Ver Link
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Paid Orders */}
            {paidOrders.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Pagos ({paidOrders.length})
                </h3>
                <div className="grid gap-4">
                  {paidOrders.map((order) => (
                    <Card key={order.id} className="bg-gray-800 border-green-500/30">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{order.name}</span>
                              {getStatusBadge(order.status)}
                              {order.user?.status === 'active' && (
                                <Badge className="bg-blue-500">
                                  <Play className="h-3 w-3 mr-1" />
                                  Anúncios Ativos
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {order.email}
                            </p>
                            <p className="text-gray-500 text-sm">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Pago em: {order.paid_at ? new Date(order.paid_at).toLocaleString('pt-BR') : '-'}
                            </p>
                            {order.user?.subscription_end && (
                              <p className="text-blue-400 text-sm">
                                Ativo até: {new Date(order.user.subscription_end).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-400">
                              R$ {order.amount.toFixed(2)}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2 justify-end">
                              {order.clientData && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-blue-500 text-blue-400"
                                  onClick={() => openViewDataDialog(order)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Dados
                                </Button>
                              )}
                              {order.user && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => openActivateDialog(order)}
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Ativar Anúncios
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="border-gray-600"
                                    onClick={() => handleResendEmail(order.user!.id)}
                                  >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Reenviar Email
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick view of client data if exists */}
                        {order.clientData && (
                          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {order.clientData.niche && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <Briefcase className="h-3 w-3" />
                                {order.clientData.niche}
                              </div>
                            )}
                            {order.clientData.region && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <MapPin className="h-3 w-3" />
                                {order.clientData.region}
                              </div>
                            )}
                            {order.clientData.whatsapp && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <MessageCircle className="h-3 w-3" />
                                {order.clientData.whatsapp}
                              </div>
                            )}
                            {order.clientData.instagram && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <Instagram className="h-3 w-3" />
                                {order.clientData.instagram}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Expired Orders */}
            {expiredOrders.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Expirados ({expiredOrders.length})
                </h3>
                <div className="grid gap-4">
                  {expiredOrders.map((order) => (
                    <Card key={order.id} className="bg-gray-800 border-red-500/30 opacity-75">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{order.name}</span>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-gray-400 flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {order.email}
                            </p>
                            <p className="text-gray-500 text-sm">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {new Date(order.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-500">
                              R$ {order.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {orders.length === 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center text-gray-400">
                  Nenhum pedido encontrado
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {users.map((user) => (
                <Card 
                  key={user.id} 
                  className={`bg-gray-800 border-gray-700 cursor-pointer transition-colors ${
                    selectedUser?.id === user.id ? 'border-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedUser(user);
                    setSalesPageUrl(user.ads_client_data?.[0]?.sales_page_url || "");
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{user.name}</h3>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        {user.phone && (
                          <p className="text-gray-500 text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(user.status)}
                    </div>

                    {user.ads_client_data?.[0] && (
                      <div className="bg-gray-900 rounded p-3 mb-3 text-sm space-y-1">
                        <p><strong>Nicho:</strong> {user.ads_client_data[0].niche || 'Não informado'}</p>
                        <p><strong>Região:</strong> {user.ads_client_data[0].region || 'Não informada'}</p>
                        <p><strong>WhatsApp:</strong> {user.ads_client_data[0].whatsapp || 'Não informado'}</p>
                        <p><strong>Instagram:</strong> {user.ads_client_data[0].instagram || 'Não informado'}</p>
                        {user.ads_client_data[0].telegram_group && (
                          <p><strong>Telegram:</strong> {user.ads_client_data[0].telegram_group}</p>
                        )}
                        {user.ads_client_data[0].competitor1_instagram && (
                          <p><strong>Concorrente 1:</strong> <a href={user.ads_client_data[0].competitor1_instagram} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver</a></p>
                        )}
                        {user.ads_client_data[0].competitor2_instagram && (
                          <p><strong>Concorrente 2:</strong> <a href={user.ads_client_data[0].competitor2_instagram} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver</a></p>
                        )}
                        {user.ads_client_data[0].offer_description && (
                          <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded">
                            <p className="text-xs text-yellow-400">Descrição da Oferta:</p>
                            <p className="text-yellow-100 text-xs">{user.ads_client_data[0].offer_description.substring(0, 150)}{user.ads_client_data[0].offer_description.length > 150 ? '...' : ''}</p>
                          </div>
                        )}
                        {user.ads_client_data[0].media_urls && user.ads_client_data[0].media_urls.length > 0 && (
                          <p className="text-blue-400"><strong>Mídias:</strong> {user.ads_client_data[0].media_urls.length} arquivos</p>
                        )}
                        {user.ads_client_data[0].observations && (
                          <p className="mt-2"><strong>Obs:</strong> {user.ads_client_data[0].observations}</p>
                        )}
                        {user.ads_client_data[0].logo_url && (
                          <a 
                            href={user.ads_client_data[0].logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline mt-2 inline-block"
                          >
                            Ver Logo
                          </a>
                        )}
                      </div>
                    )}

                    {user.subscription_end && (
                      <p className="text-xs text-gray-500">
                        Expira: {new Date(user.subscription_end).toLocaleDateString('pt-BR')}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                          setSalesPageUrl(user.ads_client_data?.[0]?.sales_page_url || "");
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      {user.status === 'active' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-orange-500 text-orange-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnableRenewal(user.id);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Renovação
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResendEmail(user.id);
                            }}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExpireUser(user.id);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Expirar
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* User Details Panel */}
            {selectedUser && (
              <Card className="bg-gray-800 border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle>Gerenciar: {selectedUser.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300">URL da Página de Vendas</Label>
                    <div className="flex gap-2">
                      <Input
                        value={salesPageUrl}
                        onChange={(e) => setSalesPageUrl(e.target.value)}
                        placeholder="https://sua-pagina.com/cliente"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Button 
                        onClick={handleSaveSalesPage}
                        disabled={savingUrl}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {savingUrl ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Balance Orders */}
                  {selectedUser.ads_balance_orders && selectedUser.ads_balance_orders.length > 0 && (
                    <div>
                      <Label className="text-gray-300 mb-2 block">Pedidos de Saldo</Label>
                      <div className="space-y-2">
                        {selectedUser.ads_balance_orders.map((order) => (
                          <div 
                            key={order.id}
                            className="flex justify-between items-center bg-gray-900 p-3 rounded"
                          >
                            <div>
                              <p className="font-medium">R$ {order.amount.toFixed(2)}</p>
                              <p className="text-sm text-gray-400">{order.leads_quantity} leads</p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs">
            <AdsNewsDocumentation />
          </TabsContent>
        </Tabs>
      </main>

      {/* Activate Ads Dialog */}
      <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Ativar Anúncios para {activatingOrder?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Anúncios ativos até *</Label>
              <Input
                type="date"
                value={activateForm.subscriptionEnd}
                onChange={(e) => setActivateForm({ ...activateForm, subscriptionEnd: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">URL da Página de Vendas</Label>
              <Input
                value={activateForm.salesPageUrl}
                onChange={(e) => setActivateForm({ ...activateForm, salesPageUrl: e.target.value })}
                placeholder="https://sua-pagina.com/cliente"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Enviar email de ativação</Label>
              <Switch
                checked={activateForm.sendEmail}
                onCheckedChange={(checked) => setActivateForm({ ...activateForm, sendEmail: checked })}
              />
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleActivateAds}
              disabled={activating}
            >
              {activating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Ativar Anúncios
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Client Data Dialog */}
      <Dialog open={viewDataDialogOpen} onOpenChange={setViewDataDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dados do Cliente - {viewingOrder?.name}</DialogTitle>
          </DialogHeader>
          {viewingOrder?.clientData && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 text-xs">Nicho</Label>
                  <p className="text-white">{viewingOrder.clientData.niche || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-xs">Região</Label>
                  <p className="text-white">{viewingOrder.clientData.region || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-xs">WhatsApp</Label>
                  <p className="text-white">{viewingOrder.clientData.whatsapp || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-xs">Instagram</Label>
                  <p className="text-white">{viewingOrder.clientData.instagram || '-'}</p>
                </div>
              </div>
              
              {viewingOrder.clientData.telegram_group && (
                <div>
                  <Label className="text-gray-400 text-xs">Grupo Telegram</Label>
                  <p className="text-white break-all">{viewingOrder.clientData.telegram_group}</p>
                </div>
              )}
              
              {/* Competitors */}
              {(viewingOrder.clientData.competitor1_instagram || viewingOrder.clientData.competitor2_instagram) && (
                <div className="border-t border-gray-700 pt-3">
                  <Label className="text-gray-400 text-xs mb-2 block">Concorrentes</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingOrder.clientData.competitor1_instagram && (
                      <a 
                        href={viewingOrder.clientData.competitor1_instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm break-all"
                      >
                        🔗 Concorrente 1
                      </a>
                    )}
                    {viewingOrder.clientData.competitor2_instagram && (
                      <a 
                        href={viewingOrder.clientData.competitor2_instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm break-all"
                      >
                        🔗 Concorrente 2
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {/* Offer Description */}
              {viewingOrder.clientData.offer_description && (
                <div className="border-t border-gray-700 pt-3">
                  <Label className="text-gray-400 text-xs">Descrição da Oferta</Label>
                  <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mt-1">
                    <p className="text-yellow-100 whitespace-pre-wrap">{viewingOrder.clientData.offer_description}</p>
                  </div>
                </div>
              )}
              
              {viewingOrder.clientData.observations && (
                <div>
                  <Label className="text-gray-400 text-xs">Observações</Label>
                  <p className="text-white whitespace-pre-wrap">{viewingOrder.clientData.observations}</p>
                </div>
              )}
              
              {/* Media Files */}
              {viewingOrder.clientData.media_urls && viewingOrder.clientData.media_urls.length > 0 && (
                <div className="border-t border-gray-700 pt-3">
                  <Label className="text-gray-400 text-xs mb-2 block">
                    Mídias Enviadas ({viewingOrder.clientData.media_urls.length} arquivos)
                  </Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {viewingOrder.clientData.media_urls.map((url, idx) => (
                      <a 
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {url.match(/\.(mp4|mov|webm)$/i) ? (
                          <div className="w-full h-16 bg-gray-700 rounded flex items-center justify-center">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        ) : (
                          <img 
                            src={url} 
                            alt={`Mídia ${idx + 1}`} 
                            className="w-full h-16 object-cover rounded"
                          />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {viewingOrder.clientData.logo_url && (
                <div>
                  <Label className="text-gray-400 text-xs">Logo</Label>
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-blue-400" />
                    <a 
                      href={viewingOrder.clientData.logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Ver Logo
                    </a>
                  </div>
                </div>
              )}
              
              {viewingOrder.clientData.sales_page_url && (
                <div>
                  <Label className="text-gray-400 text-xs">Página de Vendas</Label>
                  <a 
                    href={viewingOrder.clientData.sales_page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline break-all"
                  >
                    {viewingOrder.clientData.sales_page_url}
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdsNewsAdmin;