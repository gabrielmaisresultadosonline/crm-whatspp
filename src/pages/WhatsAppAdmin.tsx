import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Save, LogOut, Plus, Trash2, GripVertical } from "lucide-react";

const ADMIN_SESSION_STORAGE_KEY = "whatsapp_admin_session_token";

interface OptionItem {
  id: string;
  label: string;
  message: string;
  icon_type: string;
  color: string;
  order_index: number;
  is_active: boolean;
}

const ICON_OPTIONS = [
  { value: "sparkles", label: "Estrela" },
  { value: "headset", label: "Suporte" },
  { value: "help", label: "Dúvida" },
];

const WhatsAppAdmin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [settings, setSettings] = useState({
    id: "",
    whatsapp_number: "",
    page_title: "",
    page_subtitle: "",
  });
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    setSessionToken("");
    setAuthenticated(false);
  };

  const fetchAdminData = async (tokenOverride?: string) => {
    const token = tokenOverride || sessionToken || localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || "";
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: response, error } = await supabase.functions.invoke("whatsapp-page", {
      body: { action: "adminData", token },
    });

    if (error || !response?.success) {
      if (response?.error?.includes("Sessão expirada")) {
        clearSession();
      }
      toast.error(response?.error || error?.message || "Erro ao carregar dados");
      setLoading(false);
      return;
    }

    const nextSettings = response.settings || {};
    setSettings({
      id: nextSettings.id || "",
      whatsapp_number: nextSettings.whatsapp_number || "",
      page_title: nextSettings.page_title || "",
      page_subtitle: nextSettings.page_subtitle || "",
    });
    setOptions(Array.isArray(response.options) ? (response.options as OptionItem[]) : []);
    setAuthenticated(true);
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoginLoading(true);

    const { data: response, error } = await supabase.rpc("whatsapp_admin_login", {
      login_email: email,
      login_password: password,
    });

    const result = response as { success?: boolean; token?: string; error?: string } | null;

    if (error || !result?.success || !result.token) {
      toast.error(result?.error || error?.message || "Email ou senha incorretos");
      setLoginLoading(false);
      return;
    }

    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, result.token);
    setSessionToken(result.token);
    setAuthenticated(true);
    toast.success("Login realizado com sucesso!");
    await fetchAdminData(result.token);
    setLoginLoading(false);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setSessionToken(storedToken);
    setAuthenticated(true);
    fetchAdminData(storedToken);
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    const token = sessionToken || localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || "";
    const { data: response, error } = await supabase.functions.invoke("whatsapp-page", {
      body: {
        action: "saveSettings",
        token,
        whatsapp_number: settings.whatsapp_number,
        page_title: settings.page_title,
        page_subtitle: settings.page_subtitle,
      },
    });

    if (error || !response?.success) {
      if (response?.error?.includes("Sessão expirada")) clearSession();
      toast.error(response?.error || error?.message || "Erro ao salvar");
    } else {
      toast.success("Configurações salvas!");
      await fetchAdminData(token);
    }
    setSaving(false);
  };

  const handleSaveOption = async (option: OptionItem) => {
    const token = sessionToken || localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || "";
    const { data: response, error } = await supabase.functions.invoke("whatsapp-page", {
      body: {
        action: "saveOption",
        token,
        id: option.id,
        label: option.label,
        message: option.message,
        icon_type: option.icon_type,
        color: option.color,
        order_index: option.order_index,
        is_active: option.is_active,
      },
    });

    if (error || !response?.success) {
      if (response?.error?.includes("Sessão expirada")) clearSession();
      toast.error(response?.error || error?.message || "Erro ao salvar opção");
    } else {
      toast.success("Opção salva!");
      await fetchAdminData(token);
    }
  };

  const handleAddOption = async () => {
    const token = sessionToken || localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || "";
    const { data: response, error } = await supabase.functions.invoke("whatsapp-page", {
      body: { action: "addOption", token, order_index: options.length },
    });

    if (error || !response?.success) {
      if (response?.error?.includes("Sessão expirada")) clearSession();
      toast.error(response?.error || error?.message || "Erro ao criar opção");
    } else {
      toast.success("Opção criada!");
      await fetchAdminData(token);
    }
  };

  const handleDeleteOption = async (id: string) => {
    const token = sessionToken || localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || "";
    const { data: response, error } = await supabase.functions.invoke("whatsapp-page", {
      body: { action: "deleteOption", token, id },
    });

    if (error || !response?.success) {
      if (response?.error?.includes("Sessão expirada")) clearSession();
      toast.error(response?.error || error?.message || "Erro ao excluir");
    } else {
      toast.success("Opção excluída!");
      await fetchAdminData(token);
    }
  };

  const updateOption = (id: string, field: keyof OptionItem, value: string | number | boolean) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] flex items-center justify-center p-4">
        <div className="bg-[#1e1e2e] rounded-2xl p-8 max-w-sm w-full space-y-6 border border-gray-800">
          <h1 className="text-xl font-bold text-white text-center">Admin WhatsApp</h1>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#2a2a3e] border-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-gray-300">Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#2a2a3e] border-gray-700 text-white" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            </div>
            <Button onClick={handleLogin} disabled={loginLoading} className="w-full bg-green-600 hover:bg-green-700">
              {loginLoading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Admin WhatsApp</h1>
          <Button variant="ghost" size="sm" onClick={clearSession} className="text-gray-400 hover:text-white">
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>

        {/* Settings */}
        <div className="bg-[#1e1e2e] rounded-2xl p-6 space-y-5 border border-gray-800">
          <h2 className="text-white font-semibold text-lg">Configurações Gerais</h2>
          <div>
            <Label className="text-gray-300">Número do WhatsApp (com DDI)</Label>
            <Input value={settings.whatsapp_number} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} className="bg-[#2a2a3e] border-gray-700 text-white" placeholder="5511999999999" />
          </div>
          <div>
            <Label className="text-gray-300">Título da página</Label>
            <Input value={settings.page_title} onChange={(e) => setSettings({ ...settings, page_title: e.target.value })} className="bg-[#2a2a3e] border-gray-700 text-white" />
          </div>
          <div>
            <Label className="text-gray-300">Subtítulo da página</Label>
            <Input value={settings.page_subtitle} onChange={(e) => setSettings({ ...settings, page_subtitle: e.target.value })} className="bg-[#2a2a3e] border-gray-700 text-white" />
          </div>
          <Button onClick={handleSaveSettings} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>

        {/* Options */}
        <div className="bg-[#1e1e2e] rounded-2xl p-6 space-y-5 border border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Opções de Contato</h2>
            <Button onClick={handleAddOption} size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>

          {options.map((option, idx) => (
            <div key={option.id} className="bg-[#2a2a3e] rounded-xl p-4 space-y-3 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-500" />
                  <span className="text-white font-medium text-sm">Opção {idx + 1}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteOption(option.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <Label className="text-gray-400 text-xs">Texto do botão</Label>
                <Input value={option.label} onChange={(e) => updateOption(option.id, "label", e.target.value)} className="bg-[#1e1e2e] border-gray-600 text-white text-sm" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Mensagem enviada no WhatsApp</Label>
                <Input value={option.message} onChange={(e) => updateOption(option.id, "message", e.target.value)} className="bg-[#1e1e2e] border-gray-600 text-white text-sm" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-gray-400 text-xs">Ícone</Label>
                  <select
                    value={option.icon_type}
                    onChange={(e) => updateOption(option.id, "icon_type", e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-600 bg-[#1e1e2e] text-white text-sm px-3"
                  >
                    {ICON_OPTIONS.map((ic) => (
                      <option key={ic.value} value={ic.value}>{ic.label}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <Label className="text-gray-400 text-xs">Cor</Label>
                  <input type="color" value={option.color} onChange={(e) => updateOption(option.id, "color", e.target.value)} className="w-full h-10 rounded-md border border-gray-600 bg-[#1e1e2e] cursor-pointer" />
                </div>
              </div>
              <Button onClick={() => handleSaveOption(option)} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
                <Save className="w-3 h-3 mr-1" /> Salvar Opção
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAdmin;
