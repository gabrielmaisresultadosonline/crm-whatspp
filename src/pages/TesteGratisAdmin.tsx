import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Users, 
  Save, 
  Loader2, 
  RefreshCw,
  Eye,
  EyeOff,
  Link,
  Video,
  Download,
  Clock,
  Trash2,
  Instagram,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Play,
  Upload,
  Image,
  X
} from 'lucide-react';

interface TrialSettings {
  id: string;
  mro_master_username: string;
  mro_master_password: string;
  welcome_video_url: string | null;
  installation_video_url: string | null;
  usage_video_url: string | null;
  welcome_video_thumbnail: string | null;
  installation_video_thumbnail: string | null;
  usage_video_thumbnail: string | null;
  download_link: string | null;
  group_link: string | null;
  trial_duration_hours: number;
  is_active: boolean;
}

interface Registration {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  instagram_username: string;
  generated_username: string;
  generated_password: string;
  mro_master_user: string;
  registered_at: string;
  expires_at: string;
  email_sent: boolean;
  instagram_removed: boolean;
  instagram_removed_at: string | null;
  expiration_email_sent: boolean;
  profile_screenshot_url: string | null;
}

const TesteGratisAdmin = () => {
  const [settings, setSettings] = useState<TrialSettings | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [runningExpCheck, setRunningExpCheck] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState<string | null>(null);
  
  // Refs for file inputs
  const welcomeThumbRef = useRef<HTMLInputElement>(null);
  const installThumbRef = useRef<HTMLInputElement>(null);
  const usageThumbRef = useRef<HTMLInputElement>(null);

  // Handle thumbnail upload (file or paste)
  const handleThumbnailUpload = async (file: File, field: 'welcome_video_thumbnail' | 'installation_video_thumbnail' | 'usage_video_thumbnail') => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, envie uma imagem!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande! Máximo 5MB.');
      return;
    }

    setUploadingThumbnail(field);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `thumb-${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('trial-screenshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('trial-screenshots')
        .getPublicUrl(fileName);

      setSettings(s => s ? { ...s, [field]: urlData.publicUrl } : null);
      toast.success('Thumbnail enviada com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar thumbnail');
    } finally {
      setUploadingThumbnail(null);
    }
  };

  // Handle paste for thumbnails
  const handlePaste = (e: React.ClipboardEvent, field: 'welcome_video_thumbnail' | 'installation_video_thumbnail' | 'usage_video_thumbnail') => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleThumbnailUpload(file, field);
          return;
        }
      }
    }
  };

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'welcome_video_thumbnail' | 'installation_video_thumbnail' | 'usage_video_thumbnail') => {
    const file = e.target.files?.[0];
    if (file) {
      handleThumbnailUpload(file, field);
    }
  };

  // Clear thumbnail
  const clearThumbnail = (field: 'welcome_video_thumbnail' | 'installation_video_thumbnail' | 'usage_video_thumbnail') => {
    setSettings(s => s ? { ...s, [field]: null } : null);
  };

  const handleAdminLogin = async () => {
    if (!adminEmail || !adminPassword) {
      toast.error('Preencha email e senha!');
      return;
    }

    setLoginLoading(true);
    try {
      // Check credentials via edge function using metodo_seguidor_admins table
      const { data, error } = await supabase.functions.invoke('metodo-seguidor-admin-auth', {
        body: { email: adminEmail, password: adminPassword }
      });

      if (error) throw error;

      if (data.success) {
        setIsAuthenticated(true);
        loadData();
      } else {
        toast.error('Email ou senha incorretos!');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao verificar credenciais');
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('free_trial_settings')
        .select('*')
        .limit(1)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Settings error:', settingsError);
      } else if (settingsData) {
        setSettings(settingsData);
      }

      // Load registrations
      const { data: regsData, error: regsError } = await supabase
        .from('free_trial_registrations')
        .select('*')
        .order('registered_at', { ascending: false });

      if (regsError) {
        console.error('Registrations error:', regsError);
      } else {
        setRegistrations(regsData || []);
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('free_trial_settings')
        .update({
          mro_master_username: settings.mro_master_username,
          mro_master_password: settings.mro_master_password,
          welcome_video_url: settings.welcome_video_url,
          installation_video_url: settings.installation_video_url,
          usage_video_url: settings.usage_video_url,
          welcome_video_thumbnail: settings.welcome_video_thumbnail,
          installation_video_thumbnail: settings.installation_video_thumbnail,
          usage_video_thumbnail: settings.usage_video_thumbnail,
          download_link: settings.download_link,
          group_link: settings.group_link,
          trial_duration_hours: settings.trial_duration_hours,
          is_active: settings.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const runExpirationCheck = async () => {
    setRunningExpCheck(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-expirations');
      
      if (error) throw error;

      toast.success(`Verificação concluída! ${data.processed} expirados processados.`);
      loadData(); // Reload registrations
    } catch (error) {
      console.error('Expiration check error:', error);
      toast.error('Erro ao verificar expirações');
    } finally {
      setRunningExpCheck(false);
    }
  };

  const deleteRegistration = async (id: string, instagram: string) => {
    if (!confirm(`Excluir registro do @${instagram}?`)) return;

    try {
      const { error } = await supabase
        .from('free_trial_registrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Registro excluído!');
      setRegistrations(registrations.filter(r => r.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao excluir');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const getStatus = (reg: Registration) => {
    if (reg.instagram_removed) {
      return { label: 'Expirado', variant: 'destructive' as const };
    }
    const now = new Date();
    const expires = new Date(reg.expires_at);
    if (now > expires) {
      return { label: 'Pendente Remoção', variant: 'outline' as const };
    }
    return { label: 'Ativo', variant: 'default' as const };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Admin - Teste Grátis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@email.com"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
              </div>
              <div>
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Digite a senha"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
              </div>
              <Button className="w-full" onClick={handleAdminLogin} disabled={loginLoading}>
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Entrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin - Teste Grátis</h1>
          <p className="text-gray-400">Gerencie configurações e registros de teste grátis</p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Registros ({registrations.length})
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-yellow-400" />
                  Configurações do Teste Grátis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <Label className="text-white text-lg">Teste Grátis Ativo</Label>
                    <p className="text-gray-400 text-sm">Habilita/desabilita novos cadastros</p>
                  </div>
                  <Switch
                    checked={settings?.is_active || false}
                    onCheckedChange={(checked) => setSettings(s => s ? { ...s, is_active: checked } : null)}
                  />
                </div>

                {/* MRO Master User */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Usuário MRO Master</Label>
                    <Input
                      value={settings?.mro_master_username || ''}
                      onChange={(e) => setSettings(s => s ? { ...s, mro_master_username: e.target.value } : null)}
                      placeholder="username_mro"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <p className="text-gray-500 text-xs mt-1">Usuário que será usado para cadastrar os Instagrams de teste</p>
                  </div>
                  <div>
                    <Label className="text-white">Senha MRO Master</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={settings?.mro_master_password || ''}
                        onChange={(e) => setSettings(s => s ? { ...s, mro_master_password: e.target.value } : null)}
                        placeholder="senha_mro"
                        className="bg-gray-700 border-gray-600 text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <Label className="text-white flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duração do Teste (horas)
                  </Label>
                  <Input
                    type="number"
                    value={settings?.trial_duration_hours || 24}
                    onChange={(e) => setSettings(s => s ? { ...s, trial_duration_hours: parseInt(e.target.value) || 24 } : null)}
                    min={1}
                    max={168}
                    className="bg-gray-700 border-gray-600 text-white max-w-32"
                  />
                </div>

                {/* Videos */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-400" />
                    URLs dos Vídeos (cole qualquer URL do YouTube)
                  </h3>
                  <p className="text-gray-400 text-sm">Pode usar youtube.com/watch?v=... ou youtu.be/... - será convertido automaticamente</p>
                  
                  <div className="space-y-6">
                    {/* Video 1 - Welcome */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <Label className="text-white text-lg mb-3 block">1. Boas-vindas</Label>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-300 text-sm">URL do Vídeo</Label>
                          <Input
                            value={settings?.welcome_video_url || ''}
                            onChange={(e) => setSettings(s => s ? { ...s, welcome_video_url: e.target.value } : null)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Thumbnail/Capa
                          </Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              value={settings?.welcome_video_thumbnail || ''}
                              onChange={(e) => setSettings(s => s ? { ...s, welcome_video_thumbnail: e.target.value } : null)}
                              onPaste={(e) => handlePaste(e, 'welcome_video_thumbnail')}
                              placeholder="Cole URL, Ctrl+V imagem ou faça upload"
                              className="bg-gray-700 border-gray-600 text-white flex-1"
                            />
                            <input
                              ref={welcomeThumbRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileSelect(e, 'welcome_video_thumbnail')}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => welcomeThumbRef.current?.click()}
                              disabled={uploadingThumbnail === 'welcome_video_thumbnail'}
                              className="border-gray-600"
                            >
                              {uploadingThumbnail === 'welcome_video_thumbnail' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </Button>
                            {settings?.welcome_video_thumbnail && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => clearThumbnail('welcome_video_thumbnail')}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {settings?.welcome_video_thumbnail && (
                            <img 
                              src={settings.welcome_video_thumbnail} 
                              alt="Thumbnail preview" 
                              className="mt-2 h-20 rounded border border-gray-600"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Video 2 - Installation */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <Label className="text-white text-lg mb-3 block">2. Instalação</Label>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-300 text-sm">URL do Vídeo</Label>
                          <Input
                            value={settings?.installation_video_url || ''}
                            onChange={(e) => setSettings(s => s ? { ...s, installation_video_url: e.target.value } : null)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Thumbnail/Capa
                          </Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              value={settings?.installation_video_thumbnail || ''}
                              onChange={(e) => setSettings(s => s ? { ...s, installation_video_thumbnail: e.target.value } : null)}
                              onPaste={(e) => handlePaste(e, 'installation_video_thumbnail')}
                              placeholder="Cole URL, Ctrl+V imagem ou faça upload"
                              className="bg-gray-700 border-gray-600 text-white flex-1"
                            />
                            <input
                              ref={installThumbRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileSelect(e, 'installation_video_thumbnail')}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => installThumbRef.current?.click()}
                              disabled={uploadingThumbnail === 'installation_video_thumbnail'}
                              className="border-gray-600"
                            >
                              {uploadingThumbnail === 'installation_video_thumbnail' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </Button>
                            {settings?.installation_video_thumbnail && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => clearThumbnail('installation_video_thumbnail')}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {settings?.installation_video_thumbnail && (
                            <img 
                              src={settings.installation_video_thumbnail} 
                              alt="Thumbnail preview" 
                              className="mt-2 h-20 rounded border border-gray-600"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Video 3 - Usage */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <Label className="text-white text-lg mb-3 block">3. Utilização</Label>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-300 text-sm">URL do Vídeo</Label>
                          <Input
                            value={settings?.usage_video_url || ''}
                            onChange={(e) => setSettings(s => s ? { ...s, usage_video_url: e.target.value } : null)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Thumbnail/Capa
                          </Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              value={settings?.usage_video_thumbnail || ''}
                              onChange={(e) => setSettings(s => s ? { ...s, usage_video_thumbnail: e.target.value } : null)}
                              onPaste={(e) => handlePaste(e, 'usage_video_thumbnail')}
                              placeholder="Cole URL, Ctrl+V imagem ou faça upload"
                              className="bg-gray-700 border-gray-600 text-white flex-1"
                            />
                            <input
                              ref={usageThumbRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileSelect(e, 'usage_video_thumbnail')}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => usageThumbRef.current?.click()}
                              disabled={uploadingThumbnail === 'usage_video_thumbnail'}
                              className="border-gray-600"
                            >
                              {uploadingThumbnail === 'usage_video_thumbnail' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </Button>
                            {settings?.usage_video_thumbnail && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => clearThumbnail('usage_video_thumbnail')}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {settings?.usage_video_thumbnail && (
                            <img 
                              src={settings.usage_video_thumbnail} 
                              alt="Thumbnail preview" 
                              className="mt-2 h-20 rounded border border-gray-600"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Link de Download
                    </Label>
                    <Input
                      value={settings?.download_link || ''}
                      onChange={(e) => setSettings(s => s ? { ...s, download_link: e.target.value } : null)}
                      placeholder="https://..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Link do Grupo (WhatsApp/Telegram)
                    </Label>
                    <Input
                      value={settings?.group_link || ''}
                      onChange={(e) => setSettings(s => s ? { ...s, group_link: e.target.value } : null)}
                      placeholder="https://..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-400" />
                  Registros de Teste
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadData}
                    className="text-white border-gray-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={runExpirationCheck}
                    disabled={runningExpCheck}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {runningExpCheck ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Verificar Expirações
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhum registro encontrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-400">Print</TableHead>
                          <TableHead className="text-gray-400">Nome</TableHead>
                          <TableHead className="text-gray-400">Email</TableHead>
                          <TableHead className="text-gray-400">WhatsApp</TableHead>
                          <TableHead className="text-gray-400">Instagram</TableHead>
                          <TableHead className="text-gray-400">Registrado</TableHead>
                          <TableHead className="text-gray-400">Expira</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((reg) => {
                          const status = getStatus(reg);
                          return (
                            <TableRow key={reg.id} className="border-gray-700">
                              <TableCell>
                                {reg.profile_screenshot_url ? (
                                  <a 
                                    href={reg.profile_screenshot_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img 
                                      src={reg.profile_screenshot_url} 
                                      alt={`Print @${reg.instagram_username}`}
                                      className="w-12 h-12 rounded object-cover border border-gray-600 hover:border-yellow-500 transition-colors cursor-pointer"
                                    />
                                  </a>
                                ) : (
                                  <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-gray-500" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-white font-medium">{reg.full_name}</TableCell>
                              <TableCell className="text-gray-300">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {reg.email}
                                  {reg.email_sent && <CheckCircle className="w-3 h-3 text-green-400" />}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-300">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {reg.whatsapp}
                                </div>
                              </TableCell>
                              <TableCell className="text-pink-400">
                                <div className="flex items-center gap-1">
                                  <Instagram className="w-3 h-3" />
                                  @{reg.instagram_username}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-300 text-sm">
                                {formatDate(reg.registered_at)}
                              </TableCell>
                              <TableCell className="text-gray-300 text-sm">
                                {formatDate(reg.expires_at)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status.variant}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteRegistration(reg.id, reg.instagram_username)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TesteGratisAdmin;
