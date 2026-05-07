import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Lock, 
  LogOut, 
  Search, 
  RefreshCw, 
  Mail,
  User,
  Send,
  CheckCircle2,
  Clock,
  Users,
  Filter,
  AlertTriangle,
  History,
  XCircle,
  Trash2,
  Phone,
  Download
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

const ADMIN_EMAIL = "mro@gmail.com";
const ADMIN_PASSWORD = "Ga145523@";

interface UserEmail {
  id: string;
  email: string;
  name: string | null;
  source: "mro_orders" | "created_accesses";
  created_at: string;
}

interface ContactInfo {
  id: string;
  username: string;
  phone: string;
  email: string;
  planType: string;
  source: "mro_orders" | "created_accesses";
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string;
  status: string;
  error_message: string | null;
  sent_at: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "update",
    name: "Aviso de Atualização",
    subject: "🚀 Nova Atualização Disponível - MRO Instagram",
    body: `Olá!

Temos novidades importantes para você!

Acabamos de lançar uma nova atualização da ferramenta MRO Instagram com melhorias significativas:

✅ Maior velocidade de processamento
✅ Novas funcionalidades
✅ Correções de bugs

Acesse sua conta e aproveite todas as melhorias!

Qualquer dúvida, estamos à disposição.

Abraços,
Equipe MRO`
  },
  {
    id: "support",
    name: "Mudança de Suporte",
    subject: "📞 Novo Número de Suporte - MRO - Mais Resultados Online",
    body: `Olá!

Informamos que nosso número de suporte foi atualizado.

O número anterior será desativado em breve, então salve nosso novo contato!

Clique no botão abaixo para falar conosco no WhatsApp:

[BOTAO_WHATSAPP]

Estamos à disposição para ajudá-lo.

Abraços,
Equipe MRO`
  },
  {
    id: "custom",
    name: "Mensagem Personalizada",
    subject: "",
    body: ""
  }
];

export default function InstagramNovaAdminEmail() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [users, setUsers] = useState<UserEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "mro_orders" | "created_accesses">("all");
  
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>("update");
  const [emailSubject, setEmailSubject] = useState(DEFAULT_TEMPLATES[0].subject);
  const [emailBody, setEmailBody] = useState(DEFAULT_TEMPLATES[0].body);
  
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0, current: "" });
  const [sendLogs, setSendLogs] = useState<string[]>([]);
  
  // Min/Max delay em segundos
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(15);
  
  // Histórico de emails enviados
  const [emailHistory, setEmailHistory] = useState<EmailLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  // Contatos
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [mainTab, setMainTab] = useState("broadcast");

  useEffect(() => {
    const auth = localStorage.getItem("mro_admin_email_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
      loadEmailHistory();
      loadContacts();
    }
  }, [isAuthenticated]);

  // Realtime subscription para histórico de emails
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('broadcast-email-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broadcast_email_logs'
        },
        (payload) => {
          const newLog = payload.new as EmailLog;
          setEmailHistory(prev => [newLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const loadEmailHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("broadcast_email_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setEmailHistory(data || []);
    } catch (error) {
      console.error("Error loading email history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const clearEmailHistory = async () => {
    if (!confirm("Tem certeza que deseja limpar todo o histórico?")) return;
    
    try {
      const { error } = await supabase
        .from("broadcast_email_logs")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;
      setEmailHistory([]);
      toast.success("Histórico limpo!");
    } catch (error) {
      console.error("Error clearing history:", error);
      toast.error("Erro ao limpar histórico");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    await new Promise(r => setTimeout(r, 500));
    
    if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("mro_admin_email_auth", "true");
      toast.success("Login realizado com sucesso!");
    } else {
      toast.error("Email ou senha incorretos");
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("mro_admin_email_auth");
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Carregar usuários de mro_orders (pagos/completados)
      const { data: mroOrders, error: mroError } = await supabase
        .from("mro_orders")
        .select("id, email, username, created_at")
        .in("status", ["paid", "completed"]);
      
      if (mroError) throw mroError;
      
      // Carregar usuários de created_accesses
      const { data: createdAccesses, error: accessError } = await supabase
        .from("created_accesses")
        .select("id, customer_email, customer_name, created_at");
      
      if (accessError) throw accessError;
      
      // Combinar e remover duplicatas por email
      const emailMap = new Map<string, UserEmail>();
      
      // Helper: limpa prefixos como "mila:", "anderson:" etc dos emails
      const cleanEmail = (rawEmail: string): string => {
        const cleaned = rawEmail.includes(':') ? rawEmail.split(':').pop()!.trim() : rawEmail;
        return cleaned;
      };

      mroOrders?.forEach(order => {
        const email = cleanEmail(order.email).toLowerCase();
        if (!emailMap.has(email)) {
          emailMap.set(email, {
            id: order.id,
            email: cleanEmail(order.email),
            name: order.username,
            source: "mro_orders",
            created_at: order.created_at
          });
        }
      });
      
      createdAccesses?.forEach(access => {
        const email = cleanEmail(access.customer_email).toLowerCase();
        if (!emailMap.has(email)) {
          emailMap.set(email, {
            id: access.id,
            email: cleanEmail(access.customer_email),
            name: access.customer_name,
            source: "created_accesses",
            created_at: access.created_at
          });
        }
      });
      
      const allUsers = Array.from(emailMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setUsers(allUsers);
      toast.success(`${allUsers.length} usuários carregados`);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.body);
    }
  };

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const { data: mroOrders, error: mroError } = await supabase
        .from("mro_orders")
        .select("id, username, phone, email, plan_type, created_at")
        .in("status", ["paid", "completed"])
        .not("phone", "is", null);
      
      if (mroError) throw mroError;

      const { data: createdAccesses, error: accessError } = await supabase
        .from("created_accesses")
        .select("id, username, customer_email, customer_name, access_type, created_at");
      
      if (accessError) throw accessError;

      const allContacts: ContactInfo[] = [];
      const seen = new Set<string>();

      mroOrders?.forEach(order => {
        if (order.phone && order.phone.trim()) {
          const key = order.phone.replace(/\D/g, '');
          if (!seen.has(key)) {
            seen.add(key);
            allContacts.push({
              id: order.id,
              username: order.username,
              phone: order.phone,
              email: order.email,
              planType: order.plan_type === "lifetime" ? "VITALICIO" : order.plan_type === "annual" ? "ANUAL" : "MENSAL",
              source: "mro_orders",
              created_at: order.created_at
            });
          }
        }
      });

      // created_accesses doesn't have phone, but we include them for reference
      // They won't have phone numbers

      allContacts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setContacts(allContacts);
      toast.success(`${allContacts.length} contatos com telefone carregados`);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Erro ao carregar contatos");
    } finally {
      setLoadingContacts(false);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const term = contactSearch.toLowerCase();
    return c.username.toLowerCase().includes(term) || 
           c.phone.includes(term) || 
           c.email.toLowerCase().includes(term);
  });

  const generateVCard = (contactsList: ContactInfo[]) => {
    const vcards = contactsList.map(c => {
      const fullName = `CLIENTE ${c.username} (${c.planType})`;
      const phone = c.phone.replace(/\D/g, '');
      const phoneFormatted = phone.startsWith('55') ? `+${phone}` : `+55${phone}`;
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${fullName}`,
        `N:${c.username};CLIENTE;;;`,
        `TEL;TYPE=CELL:${phoneFormatted}`,
        `EMAIL:${c.email}`,
        `ORG:MRO - ${c.planType}`,
        'END:VCARD'
      ].join('\r\n');
    }).join('\r\n');

    const blob = new Blob([vcards], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contatos-mro-${format(new Date(), 'yyyy-MM-dd')}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${contactsList.length} contatos exportados em vCard!`);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === "all" || user.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === filteredUsers.length);
  };

  const getRandomDelay = () => {
    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  };

  const sleep = (seconds: number) => new Promise(r => setTimeout(r, seconds * 1000));

  const sendEmails = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Selecione pelo menos um usuário");
      return;
    }
    
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Preencha o assunto e corpo do email");
      return;
    }
    
    setSending(true);
    setSendLogs([]);
    
    // Buscar TODOS os emails já enviados com o mesmo assunto para não repetir
    // Paginar para garantir que pega mais de 1000 registros
    let allAlreadySent: { recipient_email: string }[] = [];
    let pageFrom = 0;
    const pageSize = 1000;
    while (true) {
      const { data: batch } = await supabase
        .from("broadcast_email_logs")
        .select("recipient_email")
        .eq("subject", emailSubject)
        .eq("status", "sent")
        .range(pageFrom, pageFrom + pageSize - 1);
      if (!batch || batch.length === 0) break;
      allAlreadySent = [...allAlreadySent, ...batch];
      if (batch.length < pageSize) break;
      pageFrom += pageSize;
    }
    
    const alreadySentSet = new Set(
      allAlreadySent.map(r => r.recipient_email.toLowerCase())
    );
    
    const usersToSend = filteredUsers
      .filter(u => selectedUsers.has(u.id))
      .filter(u => {
        if (alreadySentSet.has(u.email.toLowerCase())) {
          setSendLogs(prev => [...prev, `⏭️ ${u.email} - Já enviado anteriormente, pulando...`]);
          return false;
        }
        return true;
      });
    
    if (usersToSend.length === 0) {
      toast.info("Todos os selecionados já receberam este email. Nenhum envio necessário.");
      setSending(false);
      return;
    }
    
    const skipped = filteredUsers.filter(u => selectedUsers.has(u.id)).length - usersToSend.length;
    if (skipped > 0) {
      setSendLogs(prev => [...prev, `ℹ️ ${skipped} já receberam este email. Enviando para ${usersToSend.length} restantes...`]);
    }
    
    setSendProgress({ sent: 0, total: usersToSend.length, current: "" });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < usersToSend.length; i++) {
      const user = usersToSend[i];
      setSendProgress({ sent: i, total: usersToSend.length, current: user.email });
      
      try {
        const { error } = await supabase.functions.invoke("broadcast-email", {
          body: {
            to: user.email,
            subject: emailSubject,
            body: emailBody,
            userName: user.name || undefined
          }
        });
        
        if (error) throw error;
        
        await supabase.from("broadcast_email_logs").insert({
          recipient_email: user.email,
          recipient_name: user.name,
          subject: emailSubject,
          body: emailBody,
          status: "sent"
        });
        
        successCount++;
        setSendLogs(prev => [...prev, `✅ ${user.email} - Enviado com sucesso`]);
      } catch (error) {
        console.error(`Error sending to ${user.email}:`, error);
        
        await supabase.from("broadcast_email_logs").insert({
          recipient_email: user.email,
          recipient_name: user.name,
          subject: emailSubject,
          body: emailBody,
          status: "error",
          error_message: error instanceof Error ? error.message : "Erro desconhecido"
        });
        
        errorCount++;
        setSendLogs(prev => [...prev, `❌ ${user.email} - Erro ao enviar`]);
      }
      
      if (i < usersToSend.length - 1) {
        const delay = getRandomDelay();
        setSendLogs(prev => [...prev, `⏳ Aguardando ${delay}s antes do próximo...`]);
        await sleep(delay);
      }
    }
    
    setSendProgress({ sent: usersToSend.length, total: usersToSend.length, current: "" });
    setSending(false);
    
    if (errorCount === 0) {
      toast.success(`${successCount} enviados! ${skipped > 0 ? `(${skipped} já tinham recebido)` : ''}`);
    } else {
      toast.warning(`${successCount} enviados, ${errorCount} com erro`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/80 border-gray-700 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">Broadcast Email</CardTitle>
            <p className="text-gray-400">Acesso restrito</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Senha"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={loginLoading}
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Mail className="w-6 h-6 text-purple-400" />
              Broadcast Email
            </h1>
            <p className="text-gray-400 text-sm">Envie avisos para seus clientes</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="mb-6">
          <TabsList className="grid grid-cols-2 bg-gray-700/50 w-full max-w-md">
            <TabsTrigger value="broadcast" className="data-[state=active]:bg-purple-500 text-white">
              <Mail className="w-4 h-4 mr-2" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="contatos" className="data-[state=active]:bg-purple-500 text-white">
              <Phone className="w-4 h-4 mr-2" />
              Contatos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="broadcast">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de usuários */}
          <Card className="bg-gray-800/80 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Usuários ({filteredUsers.length})
                {selectedUsers.size > 0 && (
                  <Badge className="bg-purple-500/20 text-purple-300 ml-2">
                    {selectedUsers.size} selecionados
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por email ou nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
                  className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                >
                  <option value="all">Todas as fontes</option>
                  <option value="mro_orders">Instagram Nova</option>
                  <option value="created_accesses">Admin Usuário</option>
                </select>
              </div>

              {/* Select All */}
              <div className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-lg">
                <Checkbox
                  id="selectAll"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="selectAll" className="text-sm text-gray-300 cursor-pointer">
                  Selecionar todos ({filteredUsers.length})
                </label>
              </div>

              {/* Lista */}
              <ScrollArea className="h-[400px] pr-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum usuário encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          selectedUsers.has(user.id) 
                            ? "bg-purple-500/20 border border-purple-500/30" 
                            : "bg-gray-700/30 hover:bg-gray-700/50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm truncate">{user.email}</p>
                            <Badge 
                              variant="outline" 
                              className={user.source === "mro_orders" 
                                ? "border-blue-500/50 text-blue-400 text-xs" 
                                : "border-green-500/50 text-green-400 text-xs"
                              }
                            >
                              {user.source === "mro_orders" ? "MRO" : "Admin"}
                            </Badge>
                          </div>
                          {user.name && (
                            <p className="text-gray-400 text-xs">{user.name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Composição do email */}
          <Card className="bg-gray-800/80 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-green-400" />
                Compor Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Templates */}
              <div className="space-y-2">
                <Label className="text-gray-300">Template</Label>
                <Tabs value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <TabsList className="grid grid-cols-3 bg-gray-700/50">
                    {DEFAULT_TEMPLATES.map(template => (
                      <TabsTrigger 
                        key={template.id} 
                        value={template.id}
                        className="data-[state=active]:bg-purple-500"
                      >
                        {template.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Assunto */}
              <div className="space-y-2">
                <Label className="text-gray-300">Assunto</Label>
                <Input
                  placeholder="Assunto do email"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white"
                />
              </div>

              {/* Corpo */}
              <div className="space-y-2">
                <Label className="text-gray-300">Mensagem</Label>
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white min-h-[200px]"
                />
              </div>

              {/* Configuração de delay */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Delay mínimo (s)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={minDelay}
                    onChange={(e) => setMinDelay(Number(e.target.value))}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Delay máximo (s)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={maxDelay}
                    onChange={(e) => setMaxDelay(Number(e.target.value))}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400">
                <Clock className="w-3 h-3 inline mr-1" />
                Delay aleatório entre {minDelay}s e {maxDelay}s entre cada envio
              </p>

              {/* Botão enviar */}
              <Button
                onClick={sendEmails}
                disabled={sending || selectedUsers.size === 0}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Enviando {sendProgress.sent}/{sendProgress.total}...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar para {selectedUsers.size} usuário(s)
                  </>
                )}
              </Button>

              {/* Progress/Logs */}
              {sendLogs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Log de envio</Label>
                  <ScrollArea className="h-[150px] bg-gray-900/50 rounded-lg p-3">
                    <div className="space-y-1 font-mono text-xs">
                      {sendLogs.map((log, i) => (
                        <p key={i} className={
                          log.startsWith("✅") ? "text-green-400" :
                          log.startsWith("❌") ? "text-red-400" :
                          "text-yellow-400"
                        }>
                          {log}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Histórico de emails enviados */}
        <Card className="mt-6 bg-gray-800/80 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-orange-400" />
                Histórico de Envios ({emailHistory.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEmailHistory}
                  disabled={loadingHistory}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingHistory ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearEmailHistory}
                  className="border-red-600 text-red-400 hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]" ref={historyRef}>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                </div>
              ) : emailHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum email enviado ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailHistory.map(log => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border ${
                        log.status === "sent" 
                          ? "bg-green-900/20 border-green-700/50" 
                          : "bg-red-900/20 border-red-700/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {log.status === "sent" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                            <span className="text-white font-medium truncate">{log.recipient_email}</span>
                            {log.recipient_name && (
                              <span className="text-gray-400 text-sm">({log.recipient_name})</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-1">
                            <strong>Assunto:</strong> {log.subject}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {log.body.substring(0, 150)}...
                          </p>
                          {log.error_message && (
                            <p className="text-xs text-red-400 mt-1">
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              {log.error_message}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge 
                            className={log.status === "sent" 
                              ? "bg-green-500/20 text-green-300" 
                              : "bg-red-500/20 text-red-300"
                            }
                          >
                            {log.status === "sent" ? "Enviado" : "Erro"}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(log.sent_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="contatos">
            <Card className="bg-gray-800/80 border-gray-700">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-400" />
                    Contatos com Telefone ({filteredContacts.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadContacts}
                      disabled={loadingContacts}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loadingContacts ? "animate-spin" : ""}`} />
                      Atualizar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => generateVCard(filteredContacts)}
                      disabled={filteredContacts.length === 0}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar vCard ({filteredContacts.length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, telefone ou email..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="bg-gray-700/30 rounded-lg p-3 text-sm text-gray-300">
                  <p>📱 Os contatos serão salvos como: <strong className="text-white">CLIENTE nomeUsuario (ANUAL)</strong></p>
                  <p className="text-xs text-gray-400 mt-1">Importe o arquivo .vcf no Gmail/Google Contatos para organizar seus clientes.</p>
                </div>

                <ScrollArea className="h-[500px]">
                  {loadingContacts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-green-400" />
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum contato com telefone encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredContacts.map(contact => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm">
                              CLIENTE {contact.username}
                            </p>
                            <p className="text-gray-400 text-xs flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </p>
                            <p className="text-gray-500 text-xs">{contact.email}</p>
                          </div>
                          <Badge className={
                            contact.planType === "VITALICIO" 
                              ? "bg-yellow-500/20 text-yellow-300"
                              : contact.planType === "ANUAL"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-gray-500/20 text-gray-300"
                          }>
                            {contact.planType}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
