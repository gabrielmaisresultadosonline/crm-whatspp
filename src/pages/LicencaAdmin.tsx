import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, LogOut, BookOpen, Power, Shield } from "lucide-react";

const LicencaAdmin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [showDocs, setShowDocs] = useState(false);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("license-admin", {
        body: { action: "login", email: loginEmail, password: loginPassword },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Erro ao fazer login");
        return;
      }
      setIsLoggedIn(true);
      toast.success("Login realizado!");
      fetchLicenses();
    } catch {
      toast.error("Erro ao conectar");
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("license-admin", {
        body: { action: "list" },
      });
      setLicenses(data?.licenses || []);
    } catch {
      toast.error("Erro ao carregar licenças");
    } finally {
      setLoading(false);
    }
  };

  const createLicense = async () => {
    if (!newEmail || !newPassword) {
      toast.error("Preencha email e senha");
      return;
    }
    setCreating(true);
    try {
      const { data } = await supabase.functions.invoke("license-admin", {
        body: { action: "create", email: newEmail, password: newPassword },
      });
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Licença criada com sucesso!");
      setNewEmail("");
      setNewPassword("");
      fetchLicenses();
    } catch {
      toast.error("Erro ao criar licença");
    } finally {
      setCreating(false);
    }
  };

  const toggleLicense = async (id: string, currentActive: boolean) => {
    try {
      await supabase.functions.invoke("license-admin", {
        body: { action: "toggle", id, is_active: !currentActive },
      });
      toast.success(currentActive ? "Licença desativada" : "Licença ativada");
      fetchLicenses();
    } catch {
      toast.error("Erro ao alterar licença");
    }
  };

  const deleteLicense = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta licença?")) return;
    try {
      await supabase.functions.invoke("license-admin", {
        body: { action: "delete", id },
      });
      toast.success("Licença excluída");
      fetchLicenses();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "adljdeekwifwcdcgbpit";
  const functionUrl = `https://${projectId}.supabase.co/functions/v1/license-admin`;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-blue-600/20 p-3 rounded-full">
              <Key className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Licenças Admin</h1>
          </div>
          <div className="space-y-4">
            <Input
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
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button onClick={handleLogin} disabled={loginLoading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loginLoading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-sm sm:text-base">Gerenciador de Licenças</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDocs(!showDocs)}
            className="text-gray-400 hover:text-white"
          >
            <BookOpen className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Docs</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLoggedIn(false)}
            className="text-gray-400 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Create License */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-400" />
            Criar Nova Licença
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Email do usuário"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Input
              placeholder="Senha do usuário"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Button onClick={createLicense} disabled={creating} className="mt-3 bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            {creating ? "Gerando..." : "Gerar Chave de Licença"}
          </Button>
        </div>

        {/* Licenses List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            Licenças ({licenses.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma licença criada ainda</div>
          ) : (
            <div className="space-y-3">
              {licenses.map((lic) => (
                <div
                  key={lic.id}
                  className={`border rounded-lg p-3 sm:p-4 ${
                    lic.is_active ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          lic.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {lic.is_active ? "ATIVA" : "DESATIVADA"}
                        </span>
                      </div>
                      <div className="font-mono text-lg sm:text-xl font-bold text-blue-400 tracking-wider cursor-pointer" onClick={() => copyToClipboard(lic.license_key)}>
                        {lic.license_key}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        📧 {lic.email}
                      </div>
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        🔑{" "}
                        {showPasswords[lic.id] ? lic.password : "••••••••"}
                        <button onClick={() => setShowPasswords((p) => ({ ...p, [lic.id]: !p[lic.id] }))} className="ml-1">
                          {showPasswords[lic.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="text-xs text-gray-600">
                        Criada: {new Date(lic.created_at).toLocaleString("pt-BR")}
                        {lic.last_validated_at && ` • Último uso: ${new Date(lic.last_validated_at).toLocaleString("pt-BR")}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(lic.license_key)} className="text-gray-400 hover:text-white">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleLicense(lic.id, lic.is_active)} className={lic.is_active ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"}>
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteLicense(lic.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documentation */}
        {showDocs && (
          <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Documentação da API para Extensão
            </h2>

            <div className="space-y-6 text-sm">
              <div>
                <h3 className="text-blue-400 font-bold mb-2">Endpoint</h3>
                <div className="bg-gray-800 rounded-lg p-3 font-mono text-xs break-all cursor-pointer" onClick={() => copyToClipboard(functionUrl)}>
                  POST {functionUrl}
                </div>
              </div>

              <div>
                <h3 className="text-blue-400 font-bold mb-2">Headers</h3>
                <pre className="bg-gray-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">{`{
  "Content-Type": "application/json",
  "apikey": "${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "SUA_ANON_KEY"}"
}`}</pre>
              </div>

              <div>
                <h3 className="text-blue-400 font-bold mb-2">Validar Licença (usar na extensão)</h3>
                <pre className="bg-gray-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">{`// REQUEST
POST ${functionUrl}
{
  "action": "validate",
  "email": "usuario@email.com",
  "password": "senhadousuario",
  "license_key": "B6D5-2ECE-A796-DBD4"
}

// RESPONSE (sucesso)
{
  "valid": true,
  "license": {
    "id": "uuid",
    "email": "usuario@email.com",
    "license_key": "B6D5-2ECE-A796-DBD4",
    "is_active": true,
    "created_at": "2026-02-17T..."
  }
}

// RESPONSE (falha)
{
  "valid": false,
  "error": "Licença inválida ou desativada"
}`}</pre>
              </div>

              <div>
                <h3 className="text-blue-400 font-bold mb-2">Exemplo JavaScript para Extensão</h3>
                <pre className="bg-gray-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">{`async function validateLicense(email, password, licenseKey) {
  const response = await fetch("${functionUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": "SUA_ANON_KEY"
    },
    body: JSON.stringify({
      action: "validate",
      email: email,
      password: password,
      license_key: licenseKey
    })
  });

  const data = await response.json();

  if (data.valid) {
    // Licença válida - liberar extensão
    console.log("Acesso liberado!");
    return true;
  } else {
    // Licença inválida
    console.log("Acesso negado:", data.error);
    return false;
  }
}`}</pre>
              </div>

              <div>
                <h3 className="text-blue-400 font-bold mb-2">Fluxo na Extensão</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-400">
                  <li>Usuário abre a extensão</li>
                  <li>Extensão mostra campos: Email, Senha, Chave de Licença</li>
                  <li>Usuário preenche e clica em "Ativar"</li>
                  <li>Extensão chama o endpoint <code className="text-blue-400">validate</code></li>
                  <li>Se <code className="text-blue-400">valid: true</code> → salvar no <code className="text-blue-400">chrome.storage.local</code> e liberar</li>
                  <li>Se <code className="text-blue-400">valid: false</code> → mostrar erro</li>
                  <li>A cada abertura, revalidar a licença</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicencaAdmin;
