import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Users, Eye, Mail, Settings, LogOut, RefreshCw, 
  CheckCircle, XCircle, Loader2, Calendar, Link2, Search, Trash2, Download, MessageCircle,
  CreditCard, Sparkles, Clock, Mic, Check
} from "lucide-react";
import { trackPurchase } from "@/lib/facebookTracking";
import WppBotPanelV2 from "@/components/admin/WppBotPanelV2";

interface Lead {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  trabalha_atualmente: boolean;
  media_salarial: string;
  tipo_computador: string;
  instagram_username: string | null;
  created_at: string;
  email_confirmacao_enviado: boolean;
  email_lembrete_enviado: boolean;
  audio_listened_percent: number;
  audio_listened_at: string | null;
}

interface Order {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  audio_listened_percent: number;
}

interface AudioEvent {
  id: string;
  email: string;
  percent: number;
  created_at: string;
}

interface EmailLog {
  id: string;
  email_to: string;
  email_type: string;
  subject: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface Analytics {
  total_visits: number;
  total_leads: number;
  today_visits: number;
  today_leads: number;
  total_sales: number;
  today_sales: number;
  total_revenue: number;
  total_audio_listeners: number;
}

const RendaExtAdmin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [audioEvents, setAudioEvents] = useState<AudioEvent[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ 
    total_visits: 0, 
    total_leads: 0, 
    today_visits: 0, 
    today_leads: 0,
    total_sales: 0,
    today_sales: 0,
    total_revenue: 0,
    total_audio_listeners: 0
  });
  
  const [settings, setSettings] = useState({
    whatsapp_group_link: "",
    launch_date: ""
  });
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async (token = adminToken) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("rendaext-admin", {
        body: { action: "getData", adminToken: token }
      });

      if (response.error) throw response.error;

      setLeads(response.data.leads || []);
      setOrders(response.data.orders || []);
      setEmailLogs(response.data.emailLogs || []);
      setAudioEvents(response.data.audioEvents || []);
      
      const ordersData: Order[] = response.data.orders || [];
      const paidOrders = ordersData.filter(o => o.status === "paid");
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayPaidOrders = paidOrders.filter(o => new Date(o.paid_at || "") >= startOfDay);
      
      const audioEventsData: AudioEvent[] = response.data.audioEvents || [];
      const uniqueListeners = new Set(audioEventsData.map(e => e.email)).size;
      
      setAnalytics({
        ...(response.data.analytics || { total_visits: 0, total_leads: 0, today_visits: 0, today_leads: 0 }),
        total_sales: paidOrders.length,
        today_sales: todayPaidOrders.length,
        total_revenue: paidOrders.reduce((acc, curr) => acc + Number(curr.amount), 0),
        total_audio_listeners: uniqueListeners
      });

      setSettings({
        whatsapp_group_link: response.data.settings?.whatsapp_group_link || "",
        launch_date: response.data.settings?.launch_date ? format(new Date(response.data.settings.launch_date), "yyyy-MM-dd'T'HH:mm") : ""
      });
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    const savedToken = localStorage.getItem("rendaext_admin_token");
    if (savedToken) {
      setAdminToken(savedToken);
      setIsLoggedIn(true);
      loadData(savedToken);
    }
  }, [loadData]);

  useEffect(() => {
    if (!isLoggedIn || !adminToken) return;

    const interval = setInterval(() => {
      loadData(adminToken);
    }, 30000); // Auto refresh every 30s

    return () => clearInterval(interval);
  }, [isLoggedIn, adminToken, loadData]);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Real-time listener for analytics
    const analyticsChannel = supabase
      .channel('rendaext-analytics-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rendaext_analytics' },
        (payload) => {
          console.log('New visit detected!', payload);
          setAnalytics(prev => ({
            ...prev,
            total_visits: prev.total_visits + 1,
            today_visits: prev.today_visits + 1
          }));
        }
      )
      .subscribe();

    // Real-time listener for audio events
    const audioChannel = supabase
      .channel('rendaext-audio-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rendaext_audio_events' },
        (payload) => {
          console.log('New audio event detected!', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(analyticsChannel);
      supabase.removeChannel(audioChannel);
    };
  }, [isLoggedIn, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await supabase.functions.invoke("rendaext-admin", {
        body: { action: "login", email: loginData.email, password: loginData.password }
      });

      if (response.error) throw response.error;
      if (!response.data.success || !response.data.adminToken) throw new Error("Credenciais inválidas");

      localStorage.setItem("rendaext_admin_token", response.data.adminToken);
      setAdminToken(response.data.adminToken);
      setIsLoggedIn(true);
      loadData(response.data.adminToken);
      toast({ title: "Login realizado com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("rendaext_admin_token");
    setAdminToken("");
    setIsLoggedIn(false);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("rendaext-admin", {
        body: { 
          action: "updateSettings", 
          adminToken,
          settings: {
            whatsapp_group_link: settings.whatsapp_group_link,
            launch_date: settings.launch_date ? new Date(settings.launch_date).toISOString() : null
          }
        }
      });

      if (response.error) throw response.error;

      toast({ title: "Configurações salvas!" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetAnalytics = async () => {
    if (!confirm("Tem certeza que deseja zerar todas as visitas? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("rendaext-admin", {
        body: { action: "resetAnalytics", adminToken }
      });

      if (response.error) throw response.error;

      toast({ title: "Visitas zeradas com sucesso!" });
      loadData();
    } catch (error: any) {
      toast({ title: "Erro ao zerar visitas", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("rendaext-admin", {
        body: { action: "resendEmail", adminToken, orderId }
      });

      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error || "Erro ao reenviar");

      toast({ title: "Email enviado com sucesso!" });
      loadData();
    } catch (error: any) {
      toast({ title: "Erro ao reenviar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (order: Order) => {
    if (!confirm(`Deseja realmente aprovar o pagamento de ${order.nome_completo}?`)) return;
    
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("rendaext-admin", {
        body: { action: "approveOrder", adminToken, orderId: order.id }
      });

      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error || "Erro ao aprovar");

      // Tracking is now handled automatically by the backend (Conversion API)


      toast({ title: "Pagamento aprovado!", description: "O acesso foi enviado ao cliente e o pixel de conversão foi disparado." });
      loadData();
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.nome_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.whatsapp.includes(searchQuery)
  );


  const filteredOrders = orders.filter(order => 
    order.nome_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.whatsapp.includes(searchQuery) ||
    order.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMediaSalarial = (value: string) => {
    const map: Record<string, string> = {
      "menos_5k": "Menos de R$ 5k",
      "5k_10k": "R$ 5k - 10k",
      "mais_10k": "Mais de R$ 10k"
    };
    return map[value] || value;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Admin Renda Extra</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-300">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Renda Extra</h1>
            <p className="text-gray-400">Gerencie cadastros, emails e configurações</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Estatísticas</h2>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={resetAnalytics} 
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Zerar Visitas
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Mic className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Ouvintes</p>
                <p className="text-xl font-bold text-white">{analytics.total_audio_listeners}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Visitas Total</p>
                <p className="text-xl font-bold text-white">{analytics.total_visits}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Visitas Hoje</p>
                <p className="text-xl font-bold text-white">{analytics.today_visits}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Cadastros Total</p>
                <p className="text-xl font-bold text-white">{analytics.total_leads}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Cadastros Hoje</p>
                <p className="text-xl font-bold text-white">{analytics.today_leads}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Vendas Total</p>
                <p className="text-xl font-bold text-white">{analytics.total_sales}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Vendas Hoje</p>
                <p className="text-xl font-bold text-white">{analytics.today_sales}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Faturamento</p>
                <p className="text-xl font-bold text-white">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(analytics.total_revenue)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="vendas" className="data-[state=active]:bg-gray-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-gray-700">
              <Users className="w-4 h-4 mr-2" />
              Cadastros
            </TabsTrigger>
            <TabsTrigger value="emails" className="data-[state=active]:bg-gray-700">
              <Mail className="w-4 h-4 mr-2" />
              Log de Emails
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="data-[state=active]:bg-gray-700">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="audio" className="data-[state=active]:bg-gray-700">
              <Mic className="w-4 h-4 mr-2" />
              Engajamento Áudio
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Vendas Tab */}
          <TabsContent value="vendas">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="text-white">Vendas ({filteredOrders.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Nome</TableHead>
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">WhatsApp</TableHead>
                        <TableHead className="text-gray-300">Valor</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Data Pedido</TableHead>
                        <TableHead className="text-gray-300">Data Pagamento</TableHead>
                        <TableHead className="text-gray-300 text-right">Ações</TableHead>
                      </TableRow>

                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} className="border-gray-700">
                          <TableCell className="text-white font-medium">{order.nome_completo}</TableCell>
                          <TableCell className="text-gray-300">{order.email}</TableCell>
                          <TableCell className="text-gray-300">{order.whatsapp}</TableCell>
                          <TableCell className="text-gray-300">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.amount)}
                          </TableCell>
                          <TableCell>
                            {order.status === "paid" ? (
                              <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-bold">
                                <CheckCircle className="w-3 h-3" /> PAGO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold">
                                <Clock className="w-3 h-3" /> PENDENTE
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {order.paid_at ? format(new Date(order.paid_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {order.status === "paid" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResendEmail(order.id)}
                                  disabled={loading}
                                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                                >
                                  <Mail className="w-3 h-3 mr-1" />
                                  Reenviar Aula
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveOrder(order)}
                                  disabled={loading}
                                  className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Aprovar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                      ))}
                      {filteredOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            Nenhuma venda encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="text-white">Cadastros ({filteredLeads.length})</CardTitle>
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                      onClick={() => {
                        const emails = filteredLeads.map(l => l.email).join("\n");
                        const blob = new Blob([emails], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `emails-facebook-ads-${format(new Date(), "dd-MM-yyyy")}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: `${filteredLeads.length} emails exportados!`, description: "Arquivo TXT pronto para importar no Facebook Ads" });
                      }}
                      disabled={filteredLeads.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Emails ({filteredLeads.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                      onClick={() => {
                        const csv = "email\n" + filteredLeads.map(l => l.email).join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `emails-facebook-ads-${format(new Date(), "dd-MM-yyyy")}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: `${filteredLeads.length} emails exportados!`, description: "Arquivo CSV pronto para importar no Facebook Ads" });
                      }}
                      disabled={filteredLeads.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Nome</TableHead>
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">WhatsApp</TableHead>
                        <TableHead className="text-gray-300">Trabalha</TableHead>
                        <TableHead className="text-gray-300">Salário</TableHead>
                        <TableHead className="text-gray-300">Computador</TableHead>
                        <TableHead className="text-gray-300">Instagram</TableHead>
                        <TableHead className="text-gray-300">Data</TableHead>
                        <TableHead className="text-gray-300">Email Enviado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id} className="border-gray-700">
                          <TableCell className="text-white font-medium">{lead.nome_completo}</TableCell>
                          <TableCell className="text-gray-300">{lead.email}</TableCell>
                          <TableCell className="text-gray-300">{lead.whatsapp}</TableCell>
                          <TableCell>
                            {lead.trabalha_atualmente ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                          </TableCell>
                          <TableCell className="text-gray-300">{formatMediaSalarial(lead.media_salarial)}</TableCell>
                          <TableCell className="text-gray-300 capitalize">{lead.tipo_computador}</TableCell>
                          <TableCell className="text-gray-300">{lead.instagram_username || "-"}</TableCell>
                          <TableCell className="text-gray-300">
                            {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {lead.email_confirmacao_enviado ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Logs Tab */}
          <TabsContent value="emails">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Log de Emails ({emailLogs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Para</TableHead>
                        <TableHead className="text-gray-300">Tipo</TableHead>
                        <TableHead className="text-gray-300">Assunto</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Erro</TableHead>
                        <TableHead className="text-gray-300">Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailLogs.map((log) => (
                        <TableRow key={log.id} className="border-gray-700">
                          <TableCell className="text-white">{log.email_to}</TableCell>
                          <TableCell className="text-gray-300">{log.email_type}</TableCell>
                          <TableCell className="text-gray-300">{log.subject || "-"}</TableCell>
                          <TableCell>
                            {log.status === "sent" ? (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Enviado</span>
                            ) : (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Erro</span>
                            )}
                          </TableCell>
                          <TableCell className="text-red-400 text-sm">{log.error_message || "-"}</TableCell>
                          <TableCell className="text-gray-300">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Bot Tab */}
          <TabsContent value="whatsapp">
            <WppBotPanelV2 adminToken={adminToken} onUnauthorized={handleLogout} />
          </TabsContent>
          
          <TabsContent value="audio">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Engajamento com o Áudio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">Progresso</TableHead>
                        <TableHead className="text-gray-300">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {audioEvents.map((event) => (
                        <TableRow key={event.id} className="border-gray-700">
                          <TableCell className="text-white">{event.email}</TableCell>
                          <TableCell className="text-white">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-700 rounded-full h-2 max-w-[100px]">
                                <div 
                                  className={`h-2 rounded-full ${event.percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${event.percent}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold">{event.percent}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="groupLink" className="text-gray-300 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Link do Grupo WhatsApp
                  </Label>
                  <Input
                    id="groupLink"
                    value={settings.whatsapp_group_link}
                    onChange={(e) => setSettings({ ...settings, whatsapp_group_link: e.target.value })}
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                    placeholder="https://chat.whatsapp.com/..."
                  />
                  <p className="text-gray-500 text-sm mt-1">Este link será enviado por email e mostrado após o cadastro</p>
                </div>

                <div>
                  <Label htmlFor="launchDate" className="text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data do Lançamento
                  </Label>
                  <Input
                    id="launchDate"
                    type="datetime-local"
                    value={settings.launch_date}
                    onChange={(e) => setSettings({ ...settings, launch_date: e.target.value })}
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-gray-500 text-sm mt-1">No dia do lançamento, um email de lembrete será enviado para todos os cadastrados</p>
                </div>

                <Button onClick={saveSettings} disabled={loading} className="w-full md:w-auto">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RendaExtAdmin;
