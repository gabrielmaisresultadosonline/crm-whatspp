import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Lock, LogOut, Search, RefreshCw, CheckCircle, Clock, XCircle,
  Mail, User, Calendar, DollarSign, Copy, Phone, AlertTriangle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ADMIN_EMAIL = "mro@gmail.com";
const ADMIN_PASSWORD = "Ga145523@";
const MEMBER_LINK = "https://maisresultadosonline.com.br/areademembros";
const GROUP_LINK = "https://chat.whatsapp.com/JdEHa4jeLSUKTQFCNp7YXi";

interface ZapmroOrder {
  id: string;
  email: string;
  username: string;
  phone: string | null;
  plan_type: string;
  amount: number;
  status: string;
  nsu_order: string;
  infinitepay_link: string | null;
  api_created: boolean | null;
  email_sent: boolean | null;
  paid_at: string | null;
  completed_at: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function ZapmroVendasAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [orders, setOrders] = useState<ZapmroOrder[]>([]);
  const ordersRef = useRef<ZapmroOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "completed" | "expired">("all");
  
  const autoCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);
  const [lastAutoCheck, setLastAutoCheck] = useState<Date | null>(null);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    completed: true,
    paid: true,
    pending: false,
    expired: false
  });

  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem("zapmro_admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    setTimeout(() => {
      if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        localStorage.setItem("zapmro_admin_auth", "true");
        toast.success("Login realizado com sucesso!");
      } else {
        toast.error("Email ou senha incorretos");
      }
      setLoginLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("zapmro_admin_auth");
    toast.success("Logout realizado");
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("zapmro_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type assertion since we know the table structure
      setOrders((data as unknown as ZapmroOrder[]) || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  // Verificar pagamentos pendentes ativamente (igual ao instagram-nova)
  const checkPendingPayments = async () => {
    try {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const currentOrders = ordersRef.current;
      
      // Filtrar pedidos pendentes criados nos últimos 15 minutos
      const recentPendingOrders = currentOrders.filter(o => {
        if (o.status !== "pending") return false;
        const createdAt = new Date(o.created_at);
        return createdAt >= fifteenMinutesAgo;
      });
      
      if (recentPendingOrders.length === 0) {
        setLastAutoCheck(new Date());
        // Recarregar a cada 30 segundos se não há pedidos recentes
        const timeSinceLastLoad = localStorage.getItem("zapmro_last_load_time");
        if (!timeSinceLastLoad || Date.now() - parseInt(timeSinceLastLoad) > 30000) {
          loadOrders();
          localStorage.setItem("zapmro_last_load_time", Date.now().toString());
        }
        return;
      }

      console.log(`[ZAPMRO-AUTO-CHECK] Verificando ${recentPendingOrders.length} pedidos pendentes (últimos 15min)...`);
      
      for (const order of recentPendingOrders) {
        // Verificar se expirou
        if (order.expired_at) {
          const expiredAt = new Date(order.expired_at);
          if (new Date() > expiredAt) {
            console.log(`[ZAPMRO-AUTO-CHECK] Pedido ${order.nsu_order} expirado`);
            continue;
          }
        }

        // Calcular tempo desde criação
        const createdAt = new Date(order.created_at);
        const minutesSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
        console.log(`[ZAPMRO-AUTO-CHECK] Verificando ${order.nsu_order} (${order.username}) - ${minutesSinceCreation}min desde criação`);

        // Verificar pagamento via API
        try {
          const { data } = await supabase.functions.invoke("check-zapmro-payment", {
            body: { nsu_order: order.nsu_order }
          });

          if (data?.status === "completed" || data?.status === "paid") {
            console.log(`[ZAPMRO-AUTO-CHECK] ✅ Pagamento confirmado para ${order.nsu_order}`);
            toast.success(`Pagamento confirmado: ${order.username}`);
          } else {
            console.log(`[ZAPMRO-AUTO-CHECK] ⏳ Aguardando pagamento: ${order.nsu_order}`);
          }
        } catch (e) {
          console.error(`[ZAPMRO-AUTO-CHECK] Erro ao verificar ${order.nsu_order}:`, e);
        }
      }

      setLastAutoCheck(new Date());
      loadOrders();
    } catch (error) {
      console.error("[ZAPMRO-AUTO-CHECK] Erro na verificação automática:", error);
    }
  };

  // Auto-check every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !autoCheckEnabled) {
      if (autoCheckIntervalRef.current) {
        clearInterval(autoCheckIntervalRef.current);
        autoCheckIntervalRef.current = null;
      }
      return;
    }

    // Executar imediatamente ao ativar
    checkPendingPayments();

    autoCheckIntervalRef.current = setInterval(() => {
      checkPendingPayments();
    }, 30000);

    return () => {
      if (autoCheckIntervalRef.current) {
        clearInterval(autoCheckIntervalRef.current);
      }
    };
  }, [isAuthenticated, autoCheckEnabled]);

  const approveManually = async (order: ZapmroOrder) => {
    if (!confirm(`Aprovar MANUALMENTE o pagamento de ${order.username}?\n\nIsso irá criar o acesso e enviar os emails.`)) {
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("zapmro-payment-webhook", {
        body: { 
          order_id: order.id,
          manual_approve: true
        }
      });

      if (error) {
        toast.error("Erro ao aprovar manualmente");
        return;
      }

      if (data.status === "completed") {
        if (data.api_already_exists) {
          toast.success(`Aprovado! Usuário já existia. Email enviado: ${data.email_sent ? "Sim" : "Não"}`);
        } else {
          toast.success("Aprovação manual realizada! Acesso criado e email enviado.");
        }
      } else {
        toast.warning(data.message || "Aprovação parcial realizada");
      }

      loadOrders();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Erro ao aprovar");
    } finally {
      setLoading(false);
    }
  };

  const resendAccessEmail = async (order: ZapmroOrder) => {
    if (!order.api_created) {
      toast.error("Acesso ainda não foi criado. Crie o acesso primeiro.");
      return;
    }
    
    setResendingEmail(order.id);
    
    try {
      const { data, error } = await supabase.functions.invoke("zapmro-payment-webhook", {
        body: {
          manual_approve: true,
          order_id: order.id,
          resend_email_only: true
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Email reenviado para ${order.email}!`);
        loadOrders();
      } else {
        throw new Error(data?.message || "Erro ao reenviar email");
      }
    } catch (error) {
      console.error("Error resending email:", error);
      toast.error("Erro ao reenviar email");
    } finally {
      setResendingEmail(null);
    }
  };

  const copyAccessToClipboard = (order: ZapmroOrder) => {
    const message = `*Ferramenta ZAPMRO WhatsApp - Acesso VIP!*

---

*✅ Seus dados de acesso:*

*Usuário:* ${order.username}
*Senha:* ${order.username}

---

*🚀🔥 Como Acessar:*

1️⃣ Acesse: ${MEMBER_LINK}
2️⃣ Insira seu usuário e senha
3️⃣ Aproveite a ferramenta!

---

*📱 Grupo VIP WhatsApp:*
${GROUP_LINK}

---

⚠ Não compartilhe seus dados de acesso!`;

    navigator.clipboard.writeText(message);
    toast.success("Dados copiados para área de transferência!");
  };

  const getStatusBadge = (status: string, apiCreated: boolean | null) => {
    if (status === "completed") {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle className="w-3 h-3 mr-1" /> Completo</Badge>;
    }
    if (status === "paid") {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50"><DollarSign className="w-3 h-3 mr-1" /> Pago</Badge>;
    }
    if (status === "expired") {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="w-3 h-3 mr-1" /> Expirado</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.nsu_order.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && order.status === filterStatus;
  });

  const groupedOrders = {
    completed: filteredOrders.filter(o => o.status === "completed"),
    paid: filteredOrders.filter(o => o.status === "paid"),
    pending: filteredOrders.filter(o => o.status === "pending"),
    expired: filteredOrders.filter(o => o.status === "expired"),
  };

  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === "completed").length,
    paid: orders.filter(o => o.status === "paid").length,
    pending: orders.filter(o => o.status === "pending").length,
    totalRevenue: orders.filter(o => o.status === "completed" || o.status === "paid").reduce((acc, o) => acc + Number(o.amount), 0),
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">ZAPMRO Admin</CardTitle>
            <p className="text-gray-400">Área restrita - Gestão de Vendas</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Input
                type="password"
                placeholder="Senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button 
                type="submit" 
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={loginLoading}
              >
                {loginLoading ? <Loader2 className="animate-spin" /> : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderOrderCard = (order: ZapmroOrder) => (
    <Card key={order.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(order.status, order.api_created)}
                <Badge variant="outline" className="text-xs">
                  {order.plan_type === "lifetime" ? "Vitalício" : "Anual"}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="font-mono">{order.username}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs">{order.email}</span>
                </div>
                {order.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs">{order.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">
                    {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-400">
                R$ {Number(order.amount).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {order.status === "completed" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyAccessToClipboard(order)}
                  className="text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" /> Copiar Acesso
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resendAccessEmail(order)}
                  disabled={resendingEmail === order.id}
                  className="text-xs"
                >
                  {resendingEmail === order.id ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Mail className="w-3 h-3 mr-1" />
                  )}
                  Reenviar Email
                </Button>
              </>
            )}
            {(order.status === "pending" || order.status === "paid") && (
              <Button
                size="sm"
                onClick={() => approveManually(order)}
                className="bg-green-600 hover:bg-green-700 text-xs"
              >
                <CheckCircle className="w-3 h-3 mr-1" /> Aprovar Manual
              </Button>
            )}
          </div>

          {order.api_created !== null && (
            <div className="flex gap-2 text-xs">
              <span className={order.api_created ? "text-green-400" : "text-red-400"}>
                API: {order.api_created ? "✓" : "✗"}
              </span>
              <span className={order.email_sent ? "text-green-400" : "text-yellow-400"}>
                Email: {order.email_sent ? "✓" : "✗"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold">Z</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">ZAPMRO Admin</h1>
              <p className="text-xs text-gray-400">Gestão de Vendas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadOrders}
              disabled={loading}
              className="border-gray-700"
            >
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-xs text-green-400/70">Completos</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.paid}</div>
              <div className="text-xs text-blue-400/70">Pagos</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-yellow-400/70">Pendentes</div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">R$ {stats.totalRevenue.toFixed(0)}</div>
              <div className="text-xs text-emerald-400/70">Receita</div>
            </CardContent>
          </Card>
        </div>

        {/* Auto-check indicator */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${autoCheckEnabled ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
            <span className="text-gray-400">
              Auto-verificação: {autoCheckEnabled ? "Ativa (30s)" : "Desativada"}
            </span>
          </div>
          {lastAutoCheck && (
            <span className="text-gray-500 text-xs">
              Última: {format(lastAutoCheck, "HH:mm:ss")}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar por email, usuário ou NSU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "paid", "completed", "expired"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status as typeof filterStatus)}
              className={filterStatus === status ? "bg-green-600" : "border-gray-700"}
            >
              {status === "all" ? "Todos" : 
               status === "pending" ? "Pendentes" : 
               status === "paid" ? "Pagos" : 
               status === "completed" ? "Completos" : "Expirados"}
            </Button>
          ))}
        </div>

        {/* Orders by section */}
        <div className="space-y-4">
          {Object.entries(groupedOrders).map(([section, sectionOrders]) => (
            sectionOrders.length > 0 && (
              <Collapsible 
                key={section}
                open={openSections[section]}
                onOpenChange={(open) => setOpenSections(prev => ({ ...prev, [section]: open }))}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                  <span className="font-medium capitalize">
                    {section === "completed" ? "✅ Completos" :
                     section === "paid" ? "💰 Pagos" :
                     section === "pending" ? "⏳ Pendentes" : "❌ Expirados"} 
                    ({sectionOrders.length})
                  </span>
                  <span className="text-gray-400">
                    {openSections[section] ? "▼" : "▶"}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sectionOrders.map(renderOrderCard)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          ))}
        </div>

        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum pedido encontrado</p>
          </div>
        )}
      </main>
    </div>
  );
}
