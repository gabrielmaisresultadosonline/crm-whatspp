import { useState, useEffect } from "react";
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
  CheckCircle, XCircle, Loader2, Calendar, Link2, Search, Trash2, Download, MessageCircle
} from "lucide-react";
import WppBotPanel from "@/components/admin/WppBotPanel";

interface Lead {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  trabalha_atualmente: boolean | string;
  media_salarial: string;
  tipo_computador: string;
  instagram_username: string | null;
  created_at: string;
  email_confirmacao_enviado: boolean;
  email_lembrete_enviado: boolean;
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
}

const RendaExtraAdmin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ total_visits: 0, total_leads: 0, today_visits: 0, today_leads: 0 });
  
  const [settings, setSettings] = useState({
    whatsapp_group_link: "",
    launch_date: ""
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("renda_extra_v2_admin_token");
    if (savedToken) {
      setAdminToken(savedToken);
      setIsLoggedIn(true);
      loadData(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await supabase.functions.invoke("renda-extra-v2-admin", {
        body: { action: "login", email: loginData.email, password: loginData.password }
      });

      if (response.error) throw response.error;
      if (!response.data.success || !response.data.adminToken) throw new Error("Credenciais inválidas");

      localStorage.setItem("renda_extra_v2_admin_token", response.data.adminToken);
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
    localStorage.removeItem("renda_extra_v2_admin_token");
    setAdminToken("");
    setIsLoggedIn(false);
  };

  const loadData = async (token = adminToken) => {
    if (!token) {
      handleLogout();
      return;
    }
    
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("renda-extra-v2-admin", {
        body: { action: "getData", adminToken: token }
      });

      if (response.error) {
        // Handle 401 Unauthorized from the function
        if (response.error.status === 401) {
          handleLogout();
          toast({ 
            title: "Sessão expirada", 
            description: "Por favor, faça login novamente.", 
            variant: "destructive" 
          });
          return;
        }
        throw response.error;
      }
      
      if (response.data?.success === false) {
        if (response.data.error?.includes("Sessão expirada")) {
          handleLogout();
        }
        throw new Error(response.data.error || "Falha ao carregar dados");
      }

      const data = response.data;
      setLeads(data.leads || []);
      setEmailLogs(data.emailLogs || []);
      setAnalytics(data.analytics || { total_visits: 0, total_leads: 0, today_visits: 0, today_leads: 0 });
      
      if (data.settings) {
        let formattedLaunchDate = "";
        if (data.settings.launch_date) {
          const date = new Date(data.settings.launch_date);
          if (!isNaN(date.getTime())) {
            formattedLaunchDate = format(date, "yyyy-MM-dd'T'HH:mm");
          }
        }
        setSettings({
          whatsapp_group_link: data.settings.whatsapp_group_link || "",
          launch_date: formattedLaunchDate
        });
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      
      // Also check for 401 in the caught error
      if (error.status === 401 || error.message?.includes("401")) {
        handleLogout();
      }

      toast({ 
        title: "Erro ao carregar dados", 
        description: error.message || "Verifique sua conexão ou tente novamente.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("renda-extra-v2-admin", {
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
      const response = await supabase.functions.invoke("renda-extra-v2-admin", {
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

  const filteredLeads = leads.filter(lead => 
    lead.nome_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.whatsapp.includes(searchQuery)
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Eye className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Visitas</p>
                <p className="text-2xl font-bold text-white">{analytics.total_visits}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Cadastros</p>
                <p className="text-2xl font-bold text-white">{analytics.total_leads}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Visitas Hoje</p>
                <p className="text-2xl font-bold text-white">{analytics.today_visits}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Users className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Cadastros Hoje</p>
                <p className="text-2xl font-bold text-white">{analytics.today_leads}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList className="bg-gray-800">
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
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

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
                            {lead.trabalha_atualmente === true || lead.trabalha_atualmente === "true" ? (
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
            <WppBotPanel adminToken={adminToken} onUnauthorized={handleLogout} />
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

export default RendaExtraAdmin;
