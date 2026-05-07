import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Settings, Link, MessageSquare, Save, Lock, Key, Globe, Database, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminData, saveAdminData, AdminSettings } from "@/lib/adminConfig";

const MROCriativoAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = getAdminData();
    setSettings(data.settings);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "mro@gmail.com" && password === "Ga145523@") {
      setIsAuthenticated(true);
      toast.success("Bem-vindo, Administrador!");
    } else {
      toast.error("Credenciais inválidas");
    }
  };

  const handleSave = () => {
    if (!settings) return;
    const data = getAdminData();
    data.settings = settings;
    saveAdminData(data);
    toast.success("Configurações salvas com sucesso!");
  };

  const updateNestedSetting = (path: string, value: any) => {
    setSettings(prev => {
      if (!prev) return null;
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508] p-4">
        <Card className="w-full max-w-md bg-[#0a0a0f] border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-white flex items-center justify-center gap-2 text-2xl font-black">
              <Shield className="w-6 h-6 text-primary" />
              MRO CRIATIVO ADMIN
            </CardTitle>
            <p className="text-center text-gray-400 text-sm">Acesso restrito ao sistema</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Email de Administrador</Label>
                <Input 
                  type="email" 
                  placeholder="mro@gmail.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="bg-white/5 border-white/10 text-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Senha de Segurança</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="bg-white/5 border-white/10 text-white" 
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12">
                <Lock className="w-4 h-4 mr-2" />
                AUTENTICAR
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-[#050508] p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Painel de Configurações <span className="text-primary">MRO Criativo</span></h1>
            <p className="text-gray-400">Gerencie APIs, URLs e comportamentos do sistema IA.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5" onClick={() => navigate("/mrocriativo")}>
              Ver Site
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              SALVAR TUDO
            </Button>
          </div>
        </header>

        <Tabs defaultValue="apis" className="space-y-6">
          <TabsList className="bg-white/5 border-white/10 p-1 rounded-xl">
            <TabsTrigger value="apis" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Key className="w-4 h-4 mr-2" />Autenticações
            </TabsTrigger>
            <TabsTrigger value="urls" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Link className="w-4 h-4 mr-2" />URLs & Rotas
            </TabsTrigger>
            <TabsTrigger value="fallbacks" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />Comportamento
            </TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Database className="w-4 h-4 mr-2" />Integrações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apis" className="space-y-4">
            <Card className="bg-[#0a0a0f] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Meta App Platform
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Meta Client ID (App ID)</Label>
                    <Input 
                      value={settings.apis.metaClientId || ''} 
                      onChange={(e) => updateNestedSetting('apis.metaClientId', e.target.value)}
                      className="bg-white/5 border-white/10" 
                      placeholder="Ex: 123456789012345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Meta Client Secret</Label>
                    <Input 
                      type="password"
                      value={settings.apis.metaClientSecret || ''} 
                      onChange={(e) => updateNestedSetting('apis.metaClientSecret', e.target.value)}
                      className="bg-white/5 border-white/10"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Access Token (Permanent/System User)</Label>
                  <Input 
                    value={settings.apis.metaAccessToken || ''} 
                    onChange={(e) => updateNestedSetting('apis.metaAccessToken', e.target.value)}
                    className="bg-white/5 border-white/10"
                    placeholder="EAA..."
                  />
                  <p className="text-[10px] text-gray-500">Utilizado para chamadas do lado do servidor sem intervenção do usuário.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card className="bg-[#0a0a0f] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Inteligência Artificial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-400">OpenAI API Key (ChatGPT)</Label>
                  <Input 
                    type="password"
                    value={settings.apis.openai || ''} 
                    onChange={(e) => updateNestedSetting('apis.openai', e.target.value)}
                    className="bg-white/5 border-white/10"
                    placeholder="sk-..."
                  />
                  <p className="text-[10px] text-gray-500">Utilizada para geração de estratégias, legendas e análise de perfil.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="urls" className="space-y-4">
            <Card className="bg-[#0a0a0f] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Configuração de URLs e Rotas
                </CardTitle>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mt-2">
                  <p className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-wider">Passo a Passo para Meta App:</p>
                  <ol className="text-[11px] text-gray-300 space-y-1 list-decimal ml-4">
                    <li>Acesse o <strong>Meta for Developers</strong> e selecione seu App.</li>
                    <li>Vá em <strong>Configurações {" > "} Básico</strong> e adicione o domínio <code>maisresultadosonline.com.br</code>.</li>
                    <li>Em <strong>Login do Facebook {" > "} Configurações</strong>, cole a URL de Callback abaixo em "URIs de redirecionamento do OAuth válidos".</li>
                    <li>Em <strong>Instagram Graph API {" > "} Webhooks</strong>, cole a URL de Webhook abaixo.</li>
                    <li>Utilize o link <strong>oauth.php</strong> para o redirecionamento final da autenticação.</li>
                  </ol>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-400 flex justify-between">
                      <span>OAuth Redirect URI (Callback)</span>
                      <span className="text-[10px] text-primary">Copiar para Meta App</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        value={settings.mroCriativo.urls.authRedirect} 
                        onChange={(e) => updateNestedSetting('mroCriativo.urls.authRedirect', e.target.value)}
                        className="bg-white/5 border-white/10 text-xs" 
                      />
                      <Button size="sm" variant="outline" className="border-white/10" onClick={() => {
                        navigator.clipboard.writeText(settings.mroCriativo.urls.authRedirect);
                        toast.success("Copiado!");
                      }}>Copiar</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 flex justify-between">
                      <span>Webhook URL</span>
                      <span className="text-[10px] text-primary">Copiar para Meta App</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        value={settings.mroCriativo.urls.webhookUrl} 
                        onChange={(e) => updateNestedSetting('mroCriativo.urls.webhookUrl', e.target.value)}
                        className="bg-white/5 border-white/10 text-xs" 
                      />
                      <Button size="sm" variant="outline" className="border-white/10" onClick={() => {
                        navigator.clipboard.writeText(settings.mroCriativo.urls.webhookUrl);
                        toast.success("Copiado!");
                      }}>Copiar</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 flex justify-between">
                      <span>OAuth PHP Redirect</span>
                      <span className="text-[10px] text-primary">Copiar para Meta App</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        value="https://maisresultadosonline.com.br/mrocriativo/oauth.php" 
                        readOnly
                        className="bg-white/5 border-white/10 text-xs" 
                      />
                      <Button size="sm" variant="outline" className="border-white/10" onClick={() => {
                        navigator.clipboard.writeText("https://maisresultadosonline.com.br/mrocriativo/oauth.php");
                        toast.success("Copiado!");
                      }}>Copiar</Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Página de Termos de Uso</Label>
                    <Input 
                      value={settings.mroCriativo.urls.termsUrl} 
                      onChange={(e) => updateNestedSetting('mroCriativo.urls.termsUrl', e.target.value)}
                      className="bg-white/5 border-white/10 text-xs" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Página de Privacidade</Label>
                    <Input 
                      value={settings.mroCriativo.urls.privacyUrl} 
                      onChange={(e) => updateNestedSetting('mroCriativo.urls.privacyUrl', e.target.value)}
                      className="bg-white/5 border-white/10 text-xs" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fallbacks" className="space-y-4">
            <Card className="bg-[#0a0a0f] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Mensagens e Fallbacks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-400">Mensagem Padrão (Sem entendimento)</Label>
                  <Input 
                    value={settings.mroCriativo.fallbacks.defaultMessage} 
                    onChange={(e) => updateNestedSetting('mroCriativo.fallbacks.defaultMessage', e.target.value)}
                    className="bg-white/5 border-white/10" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Mensagem de Erro de Sistema</Label>
                  <Input 
                    value={settings.mroCriativo.fallbacks.errorMessage} 
                    onChange={(e) => updateNestedSetting('mroCriativo.fallbacks.errorMessage', e.target.value)}
                    className="bg-white/5 border-white/10" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Mensagem de Manutenção/Offline</Label>
                  <Input 
                    value={settings.mroCriativo.fallbacks.offlineMessage} 
                    onChange={(e) => updateNestedSetting('mroCriativo.fallbacks.offlineMessage', e.target.value)}
                    className="bg-white/5 border-white/10" 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card className="bg-[#0a0a0f] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Estado das Integrações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="space-y-1">
                    <Label className="text-white font-bold">Sistema Ativo</Label>
                    <p className="text-xs text-gray-500">Habilita/Desabilita o fluxo principal do MRO Criativo.</p>
                  </div>
                  <Switch 
                    checked={settings.mroCriativo.integrations.active}
                    onCheckedChange={(val) => updateNestedSetting('mroCriativo.integrations.active', val)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Plataforma de Conexão</Label>
                  <select 
                    value={settings.mroCriativo.integrations.platform}
                    onChange={(e) => updateNestedSetting('mroCriativo.integrations.platform', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white"
                  >
                    <option value="meta">Meta Official (OAuth)</option>
                    <option value="custom">Custom Proxy</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MROCriativoAdmin;
