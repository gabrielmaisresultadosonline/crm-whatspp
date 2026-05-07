import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings, Image, Users, Plus, Trash2, Edit, Save, 
  LogOut, Sparkles, Loader2, Eye, EyeOff, Upload, Zap, CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Template {
  id: string;
  image_url: string;
  prompt: string;
  title: string;
  description: string;
  category: string;
  is_active: boolean;
  order_index: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  last_access: string;
}

const InteligenciaFotosAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({
    image_url: "",
    prompt: "",
    title: "",
    description: "",
    category: "",
    is_active: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  
  // API Key settings
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  useEffect(() => {
    const adminAuth = sessionStorage.getItem("inteligencia_fotos_admin");
    if (adminAuth) {
      setIsAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("inteligencia-fotos-auth", {
        body: {
          action: "admin_login",
          email: loginData.email,
          password: loginData.password,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Credenciais inválidas");
      }

      sessionStorage.setItem("inteligencia_fotos_admin", "true");
      setIsAuthenticated(true);
      loadData();
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoginLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load templates
      const { data: templatesData, error: templatesError } = await supabase.functions.invoke(
        "inteligencia-fotos-manage",
        { body: { action: "get_all_templates" } }
      );

      if (!templatesError && templatesData?.templates) {
        setTemplates(templatesData.templates);
      }

      // Load users
      const { data: usersData, error: usersError } = await supabase.functions.invoke(
        "inteligencia-fotos-manage",
        { body: { action: "get_all_users" } }
      );

      if (!usersError && usersData?.users) {
        setUsers(usersData.users);
      }

      // Load API key setting
      const { data: settingsData } = await supabase.functions.invoke(
        "inteligencia-fotos-manage",
        { body: { action: "get_settings" } }
      );

      if (settingsData?.settings) {
        const apiKeySetting = settingsData.settings.find(
          (s: any) => s.setting_key === "google_gemini_api_key"
        );
        if (apiKeySetting?.setting_value) {
          setGeminiApiKey(apiKeySetting.setting_value);
          setApiKeyConfigured(true);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!geminiApiKey.trim()) {
      toast.error("Digite a API Key do Google Gemini");
      return;
    }

    setSavingApiKey(true);
    try {
      const { data, error } = await supabase.functions.invoke("inteligencia-fotos-manage", {
        body: {
          action: "save_setting",
          settingKey: "google_gemini_api_key",
          settingValue: geminiApiKey.trim(),
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Erro ao salvar API key");
      }

      setApiKeyConfigured(true);
      toast.success("API Key salva com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSavingApiKey(false);
    }
  };

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "template");

      const { data, error } = await supabase.functions.invoke("inteligencia-fotos-upload", {
        body: formData,
      });

      if (error || !data?.url) throw new Error("Erro ao fazer upload");

      setTemplateForm((prev) => ({ ...prev, image_url: data.url }));
      toast.success("Imagem enviada!");
    } catch (error) {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadImage(file);
        }
        break;
      }
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.image_url || !templateForm.prompt) {
      toast.error("Imagem e prompt são obrigatórios");
      return;
    }

    setSavingTemplate(true);
    try {
      const { data, error } = await supabase.functions.invoke("inteligencia-fotos-manage", {
        body: {
          action: editingTemplate ? "update_template" : "create_template",
          templateId: editingTemplate?.id,
          template: templateForm,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Erro ao salvar template");
      }

      toast.success(editingTemplate ? "Template atualizado!" : "Template criado!");
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      setTemplateForm({
        image_url: "",
        prompt: "",
        title: "",
        description: "",
        category: "",
        is_active: true,
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;

    try {
      const { error } = await supabase.functions.invoke("inteligencia-fotos-manage", {
        body: { action: "delete_template", templateId },
      });

      if (error) throw error;
      toast.success("Template excluído!");
      loadData();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const openEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateForm({
      image_url: template.image_url,
      prompt: template.prompt,
      title: template.title || "",
      description: template.description || "",
      category: template.category || "",
      is_active: template.is_active,
    });
    setShowTemplateDialog(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("inteligencia_fotos_admin");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Settings className="w-5 h-5" />
              Admin - Inteligência Fotos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold text-white">Admin - Inteligência Fotos</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-purple-200">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="bg-black/20 border border-purple-500/30">
            <TabsTrigger value="templates" className="data-[state=active]:bg-purple-600">
              <Image className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Templates ({templates.length})</h2>
              <Button
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateForm({
                    image_url: "",
                    prompt: "",
                    title: "",
                    description: "",
                    category: "",
                    is_active: true,
                  });
                  setShowTemplateDialog(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="bg-white/10 border-purple-500/30 overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={template.image_url}
                      alt={template.title || "Template"}
                      className="w-full h-full object-cover"
                    />
                    {!template.is_active && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <EyeOff className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-white text-sm font-medium truncate">
                      {template.title || "Sem título"}
                    </p>
                    <p className="text-purple-300 text-xs line-clamp-2">
                      {template.prompt.substring(0, 50)}...
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-purple-200 hover:bg-purple-500/20"
                        onClick={() => openEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-red-400 hover:bg-red-500/20"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <h2 className="text-xl font-semibold text-white mb-6">Usuários ({users.length})</h2>
            
            <div className="bg-white/10 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-black/30">
                  <tr>
                    <th className="text-left text-purple-200 p-4 text-sm">Nome</th>
                    <th className="text-left text-purple-200 p-4 text-sm">E-mail</th>
                    <th className="text-left text-purple-200 p-4 text-sm hidden md:table-cell">Telefone</th>
                    <th className="text-left text-purple-200 p-4 text-sm hidden md:table-cell">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-purple-500/20">
                      <td className="text-white p-4 text-sm">{user.name}</td>
                      <td className="text-purple-200 p-4 text-sm">{user.email}</td>
                      <td className="text-purple-200 p-4 text-sm hidden md:table-cell">
                        {user.phone || "-"}
                      </td>
                      <td className="text-purple-300 p-4 text-sm hidden md:table-cell">
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <h2 className="text-xl font-semibold text-white mb-6">Configurações</h2>
            
            <div className="grid gap-6 max-w-2xl">
              {/* API Key Card */}
              <Card className="bg-white/10 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    API de Geração de Imagens - Google Gemini
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Google Gemini API</p>
                        <p className="text-purple-300 text-sm">gemini-2.0-flash-exp-image-generation</p>
                      </div>
                    </div>
                    {apiKeyConfigured ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Configurado
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Pendente
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white">API Key do Google Gemini</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          placeholder="Cole sua API key aqui..."
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          className="pr-10 bg-black/20 border-purple-500/30 text-white placeholder:text-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        onClick={handleSaveApiKey}
                        disabled={savingApiKey}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {savingApiKey ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <strong>📌 Como obter a API Key:</strong>
                    </p>
                    <ol className="text-blue-300 text-sm mt-2 space-y-1 list-decimal list-inside">
                      <li>Acesse <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Google AI Studio</a></li>
                      <li>Clique em "Create API Key"</li>
                      <li>Copie a chave gerada e cole aqui</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <p className="text-white text-sm font-medium">Capacidades:</p>
                    <ul className="text-purple-300 text-sm space-y-1">
                      <li>• Geração de imagens a partir de texto e referência</li>
                      <li>• Edição de imagens com prompts avançados</li>
                      <li>• Suporte a múltiplos formatos (post, story, feed)</li>
                      <li>• Alta qualidade de saída com Google Gemini</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="bg-white/10 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Image className="w-5 h-5 text-purple-400" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/20 rounded-lg text-center">
                      <p className="text-3xl font-bold text-white">{templates.length}</p>
                      <p className="text-purple-300 text-sm">Templates Ativos</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg text-center">
                      <p className="text-3xl font-bold text-white">{users.length}</p>
                      <p className="text-purple-300 text-sm">Usuários Cadastrados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label>Imagem do Template *</Label>
              {templateForm.image_url ? (
                <div className="mt-2 relative">
                  <img
                    src={templateForm.image_url}
                    alt="Template"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setTemplateForm({ ...templateForm, image_url: "" })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label 
                  className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer block hover:border-purple-500 transition-colors focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20"
                  tabIndex={0}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.currentTarget.querySelector('input')?.click();
                    }
                  }}
                >
                  {uploadingImage ? (
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Clique para enviar ou cole (Ctrl+V)</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            {/* Prompt */}
            <div>
              <Label htmlFor="prompt">Prompt Interno * (usuário não vê)</Label>
              <Textarea
                id="prompt"
                value={templateForm.prompt}
                onChange={(e) => setTemplateForm({ ...templateForm, prompt: e.target.value })}
                placeholder="Descreva como a IA deve gerar a imagem..."
                rows={4}
              />
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                value={templateForm.title}
                onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                placeholder="Nome do template"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Breve descrição"
                rows={2}
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Categoria (opcional)</Label>
              <Input
                id="category"
                value={templateForm.category}
                onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                placeholder="Ex: Profissional, Casual, etc"
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Ativo (visível para usuários)</Label>
              <Switch
                id="is_active"
                checked={templateForm.is_active}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_active: checked })}
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveTemplate}
              disabled={savingTemplate || !templateForm.image_url || !templateForm.prompt}
              className="w-full"
            >
              {savingTemplate ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Template
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InteligenciaFotosAdmin;
