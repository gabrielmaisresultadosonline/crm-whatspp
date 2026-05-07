import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Instagram, 
  LogOut, 
  Download, 
  PlayCircle, 
  Clock, 
  AlertTriangle,
  Lock,
  Users,
  Loader2,
  CheckCircle,
  Upload,
  Camera
} from "lucide-react";
import logoMro from '@/assets/logo-mro-2.png';

// Helper to convert YouTube URLs to embed format
const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  // Already an embed URL
  if (url.includes('/embed/')) return url;
  
  // Extract video ID from various YouTube URL formats
  let videoId = '';
  
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) videoId = watchMatch[1];
  
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) videoId = shortMatch[1];
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return url;
};

const TesteGratisUsuario = () => {
  const [instagramUsername, setInstagramUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [needsScreenshot, setNeedsScreenshot] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for stored session
  useEffect(() => {
    const storedUser = localStorage.getItem('testegratis_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      checkUserAccess(parsed.instagram_username, true);
    }
  }, []);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('free_trial_settings')
        .select('*')
        .limit(1)
        .single();
      if (data) setSettings(data);
    };
    loadSettings();
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!userData?.expires_at) return;
    
    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(userData.expires_at);
      const diff = expires.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining("Expirado");
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [userData]);

  const checkUserAccess = async (username: string, silent = false) => {
    const normalizedIG = username.toLowerCase().replace(/^@/, '').trim();
    
    if (!normalizedIG) {
      if (!silent) toast.error("Digite seu nome de Instagram");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First load settings to get master credentials
      const { data: settingsData } = await supabase
        .from('free_trial_settings')
        .select('mro_master_username, mro_master_password')
        .limit(1)
        .single();

      if (!settingsData?.mro_master_username || !settingsData?.mro_master_password) {
        if (!silent) toast.error("Configuração do sistema incompleta");
        setIsLoading(false);
        return;
      }

      // Check in database first
      const { data: registration, error } = await supabase
        .from('free_trial_registrations')
        .select('*')
        .eq('instagram_username', normalizedIG)
        .single();
      
      if (error || !registration) {
        // Try to verify with SquareCloud API using master credentials
        try {
          const response = await fetch('https://dashboardmroinstagramvini-online.squareweb.app/verificar-usuario-instagram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              username: normalizedIG,
              masterUser: settingsData.mro_master_username,
              masterPassword: settingsData.mro_master_password
            })
          });
          
          const result = await response.json();
          
          if (result.success && result.registered) {
            // Instagram exists in SquareCloud but not in our DB - create minimal session
            const minimalData = {
              instagram_username: normalizedIG,
              full_name: normalizedIG,
              generated_username: settingsData.mro_master_username,
              generated_password: settingsData.mro_master_password,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              profile_screenshot_url: null
            };
            
            setUserData(minimalData);
            setIsLoggedIn(true);
            setNeedsScreenshot(true); // Require screenshot
            localStorage.setItem('testegratis_user', JSON.stringify(minimalData));
            
            if (!silent) {
              toast.success("Instagram encontrado! 🎉", {
                description: `Por favor, envie um print do seu perfil para liberar o acesso.`
              });
            }
            return;
          }
        } catch (apiError) {
          console.log("API verification failed", apiError);
        }

        if (!silent) {
          toast.error("Instagram não encontrado", {
            description: "Você ainda não fez o teste grátis. Faça seu cadastro primeiro!"
          });
        }
        localStorage.removeItem('testegratis_user');
        setIsLoading(false);
        return;
      }
      
      // Check if expired
      const now = new Date();
      const expiresAt = new Date(registration.expires_at);
      
      if (now > expiresAt) {
        if (!silent) {
          toast.error("Acesso Expirado! ⏰", {
            description: `Seu teste de 24h expirou em ${expiresAt.toLocaleString('pt-BR')}. Adquira um plano para continuar usando o MRO!`
          });
        }
        localStorage.removeItem('testegratis_user');
        setIsLoading(false);
        return;
      }
      
      // Check if needs screenshot
      if (!registration.profile_screenshot_url) {
        setNeedsScreenshot(true);
      }
      
      // Success - login user
      setUserData(registration);
      setIsLoggedIn(true);
      localStorage.setItem('testegratis_user', JSON.stringify(registration));
      
      if (!silent) {
        toast.success("Bem-vindo(a)! 🎉", {
          description: `Olá ${registration.full_name}! Seu teste está ativo.`
        });
      }
      
    } catch (error) {
      console.error("Error checking access:", error);
      if (!silent) toast.error("Erro ao verificar acesso. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, envie uma imagem!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande! Máximo 5MB.");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshotPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadScreenshot = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !userData) return;

    setUploadingScreenshot(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.instagram_username}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('trial-screenshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('trial-screenshots')
        .getPublicUrl(fileName);

      const screenshotUrl = urlData.publicUrl;

      // Update database
      const { error: updateError } = await supabase
        .from('free_trial_registrations')
        .update({ profile_screenshot_url: screenshotUrl })
        .eq('instagram_username', userData.instagram_username);

      if (updateError) throw updateError;

      // Update local state
      const updatedUserData = { ...userData, profile_screenshot_url: screenshotUrl };
      setUserData(updatedUserData);
      setNeedsScreenshot(false);
      localStorage.setItem('testegratis_user', JSON.stringify(updatedUserData));

      toast.success("Print enviado com sucesso! ✅", {
        description: "Agora você tem acesso às credenciais."
      });

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar print. Tente novamente.");
    } finally {
      setUploadingScreenshot(false);
    }
  };

  // Handle paste from clipboard (Ctrl+V)
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            toast.error("Imagem muito grande! Máximo 5MB.");
            return;
          }

          // Create a DataTransfer to set the file input
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
          }

          // Preview
          const reader = new FileReader();
          reader.onload = (ev) => {
            setScreenshotPreview(ev.target?.result as string);
          };
          reader.readAsDataURL(file);

          toast.success("Imagem colada! ✅");
          e.preventDefault();
          return;
        }
      }
    }
  };

  // Add paste event listener - must be before early returns
  useEffect(() => {
    if (needsScreenshot && !userData?.profile_screenshot_url) {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [needsScreenshot, userData?.profile_screenshot_url]);

  const handleLogin = () => {
    checkUserAccess(instagramUsername);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    setNeedsScreenshot(false);
    setScreenshotPreview(null);
    localStorage.removeItem('testegratis_user');
    setInstagramUsername("");
    toast.info("Você saiu da área de teste");
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-700">
          <CardHeader className="text-center">
            <img src={logoMro} alt="MRO" className="h-12 mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">Área do Teste Grátis</CardTitle>
            <CardDescription className="text-gray-400">
              Acesse com seu Instagram cadastrado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
              <Input
                type="text"
                placeholder="@seu.instagram"
                value={instagramUsername}
                onChange={(e) => setInstagramUsername(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Acessar Minha Área
                </>
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-2">Ainda não fez o teste?</p>
              <a 
                href="/testegratis" 
                className="text-yellow-400 hover:text-yellow-300 font-medium"
              >
                Faça seu cadastro grátis →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Screenshot Upload Screen - shows all content but faded until screenshot is uploaded
  if (needsScreenshot && !userData?.profile_screenshot_url) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <img src={logoMro} alt="MRO" className="h-10" />
              <div>
                <p className="text-white font-medium">{userData?.full_name}</p>
                <p className="text-yellow-400 text-sm">@{userData?.instagram_username}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>

          {/* Welcome Video - Full Color */}
          {settings?.welcome_video_url && (
            <Card className="mb-6 bg-zinc-900 border-yellow-500/50">
              <CardContent className="p-6">
                <h4 className="text-xl text-white font-bold mb-2 text-center">👋 Seja Bem-vindo!</h4>
                <p className="text-yellow-400 text-center mb-4">Assista o vídeo abaixo para começar</p>
                <div className="max-w-lg mx-auto">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
                    <iframe
                      src={getYouTubeEmbedUrl(settings.welcome_video_url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Screenshot Request Card - Highlighted */}
          <Card className="mb-6 bg-zinc-900 border-yellow-500 border-2 shadow-lg shadow-yellow-500/20">
            <CardHeader className="text-center">
              <Camera className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <CardTitle className="text-2xl text-white">📸 Envie um Print do seu Perfil</CardTitle>
              <CardDescription className="text-gray-400">
                Para liberar seu acesso, precisamos de um print do perfil do Instagram que você está utilizando.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <p className="text-white font-medium mb-2">📌 O print deve mostrar:</p>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Seu nome de usuário (@{userData?.instagram_username})</li>
                  <li>• Foto de perfil visível</li>
                  <li>• Número de seguidores/seguindo</li>
                </ul>
              </div>

              {/* File Input with Paste Support */}
              <div 
                className="border-2 border-dashed border-zinc-600 rounded-xl p-8 text-center cursor-pointer hover:border-yellow-500/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {screenshotPreview ? (
                  <div className="space-y-4">
                    <img 
                      src={screenshotPreview} 
                      alt="Preview" 
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-green-400 text-sm">✅ Imagem selecionada! Clique em "Enviar Print"</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Clique aqui para selecionar a imagem</p>
                    <p className="text-yellow-400 text-sm mt-2">ou use Ctrl+V para colar</p>
                    <p className="text-gray-600 text-sm mt-1">PNG, JPG até 5MB</p>
                  </>
                )}
              </div>

              <Button
                onClick={handleUploadScreenshot}
                disabled={!screenshotPreview || uploadingScreenshot}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-6"
              >
                {uploadingScreenshot ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Enviar Print e Liberar Acesso
                  </>
                )}
              </Button>

              <p className="text-gray-500 text-xs text-center">
                ⚠️ Sem o envio do print, não será possível visualizar as credenciais de acesso.
              </p>
            </CardContent>
          </Card>

          {/* Content below - Faded/Greyed out until screenshot is uploaded */}
          <div className="opacity-40 pointer-events-none select-none">
            <div className="relative">
              <div className="absolute inset-0 bg-black/50 z-10 rounded-lg flex items-center justify-center">
                <div className="bg-zinc-800 px-4 py-2 rounded-full border border-zinc-600">
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Envie o print acima para liberar
                  </p>
                </div>
              </div>
              
              {/* Access Data - Locked */}
              <Card className="mb-6 bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-gray-500" />
                    Seus Dados de Acesso
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Usuário</p>
                    <p className="text-gray-500 font-mono text-lg font-bold">••••••••</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Senha</p>
                    <p className="text-gray-500 font-mono text-lg font-bold">••••••••</p>
                  </div>
                </CardContent>
              </Card>

              {/* Download Section - Locked */}
              <Card className="mb-6 bg-zinc-900 border-zinc-700">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-500 mb-4 flex items-center gap-2">
                    <Download className="w-6 h-6 text-gray-600" />
                    Download do Sistema
                  </h3>
                  <Button size="lg" className="w-full bg-gray-700 cursor-not-allowed" disabled>
                    <Download className="w-5 h-5 mr-2" />
                    Baixar MRO para Windows
                  </Button>
                </CardContent>
              </Card>

              {/* Videos Section - Locked */}
              <Card className="mb-6 bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-gray-500 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-gray-600" />
                    Vídeos Tutoriais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <h4 className="text-gray-500 font-medium mb-3">📥 Como Instalar o MRO</h4>
                    <div className="aspect-video bg-zinc-700 rounded-lg flex items-center justify-center">
                      <PlayCircle className="w-16 h-16 text-gray-600" />
                    </div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <h4 className="text-gray-500 font-medium mb-3">🚀 Como Usar o MRO</h4>
                    <div className="aspect-video bg-zinc-700 rounded-lg flex items-center justify-center">
                      <PlayCircle className="w-16 h-16 text-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - User Area
  const isExpired = userData?.expires_at && new Date() > new Date(userData.expires_at);

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={logoMro} alt="MRO" className="h-10" />
            <div>
              <p className="text-white font-medium">{userData?.full_name}</p>
              <p className="text-yellow-400 text-sm">@{userData?.instagram_username}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Timer Card with WhatsApp Group Button */}
        <Card className={`mb-6 ${isExpired ? 'bg-red-500/20 border-red-500/50' : 'bg-green-500/20 border-green-500/50'}`}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <Clock className={`w-6 h-6 ${isExpired ? 'text-red-400' : 'text-green-400'}`} />
              <div>
                <p className={`font-medium ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                  {isExpired ? 'Teste Expirado' : 'Tempo Restante'}
                </p>
                <p className={`text-2xl font-bold ${isExpired ? 'text-red-300' : 'text-green-300'}`}>
                  {timeRemaining}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {settings?.group_link && !isExpired && (
                <a href={settings.group_link} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button className="w-full bg-[#25D366] hover:bg-[#20BA5C] text-white font-bold text-sm sm:text-base px-3 sm:px-4 py-2">
                    <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Grupo WhatsApp</span>
                  </Button>
                </a>
              )}
              {isExpired && (
                <a href="/instagram-nova" className="w-full sm:w-auto">
                  <Button className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm sm:text-base px-3 sm:px-4 py-2">
                    Adquirir Plano
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {isExpired ? (
          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Seu Teste Expirou!</h2>
              <p className="text-gray-400 mb-6">
                Suas 24 horas de teste chegaram ao fim. Para continuar usando o MRO e 
                crescer seu Instagram no automático, adquira um de nossos planos.
              </p>
              <a href="/instagram-nova">
                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold">
                  Ver Planos Disponíveis
                </Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Video 1 - Welcome (Boas-vindas) - ALWAYS FIRST after timer */}
            {settings?.welcome_video_url && (
              <Card className="mb-8 bg-zinc-900 border-yellow-500/50">
                <CardContent className="p-6">
                  <h4 className="text-2xl text-white font-bold mb-2 text-center">👋 Boas-vindas</h4>
                  <p className="text-gray-400 text-center mb-4">Assista este vídeo primeiro!</p>
                  <div className="max-w-lg mx-auto">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
                      <iframe
                        src={getYouTubeEmbedUrl(settings.welcome_video_url)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video 2 - Installation */}
            {settings?.installation_video_url && (
              <Card className="mb-8 bg-zinc-900 border-zinc-700">
                <CardContent className="p-6">
                  <h4 className="text-2xl text-white font-bold mb-2 text-center">📥 Como Instalar o MRO</h4>
                  <p className="text-gray-400 text-center mb-4">Siga o passo a passo para instalar</p>
                  <div className="max-w-lg mx-auto">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
                      <iframe
                        src={getYouTubeEmbedUrl(settings.installation_video_url)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Download Button after Installation Video */}
            <Card className="mb-8 bg-zinc-900 border-yellow-500/50">
              <CardContent className="p-6">
                <h4 className="text-2xl text-white font-bold mb-3 flex items-center justify-center gap-2">
                  <Download className="w-6 h-6 text-yellow-400" />
                  Baixar o Sistema
                </h4>
                <p className="text-gray-300 mb-4 text-center">
                  Baixe o sistema MRO (arquivo ZIP / extensão) para <span className="text-yellow-400 font-semibold">Windows</span>, <span className="text-yellow-400 font-semibold">Mac</span> e <span className="text-yellow-400 font-semibold">Linux</span> e use com suas credenciais.
                </p>
                {settings?.download_link ? (
                  <a href={settings.download_link} target="_blank" rel="noopener noreferrer" className="block">
                    <Button size="lg" className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 h-auto whitespace-normal text-center">
                      <Download className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="text-sm sm:text-base">Baixar MRO para Windows, Mac e Linux</span>
                    </Button>
                  </a>
                ) : (
                  <Button size="lg" className="w-full bg-gray-500 cursor-not-allowed py-4 h-auto whitespace-normal" disabled>
                    Link de download não disponível
                  </Button>
                )}
              </CardContent>
            </Card>
                
            {/* Video 3 - Usage */}
            {settings?.usage_video_url && (
              <Card className="mb-8 bg-zinc-900 border-zinc-700">
                <CardContent className="p-6">
                  <h4 className="text-2xl text-white font-bold mb-2 text-center">🚀 Como Usar o MRO</h4>
                  <p className="text-gray-400 text-center mb-4">Aprenda a utilizar todas as funcionalidades</p>
                  <div className="max-w-lg mx-auto">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
                      <iframe
                        src={getYouTubeEmbedUrl(settings.usage_video_url)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Access Data - After Usage Video */}
            <Card className="mb-8 bg-zinc-900 border-green-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Seus Dados de Acesso
                </CardTitle>
                <p className="text-red-500 text-sm font-medium mt-2">
                  ⚠️ Esse é o acesso que você vai utilizar para acessar a ferramenta no seu Instagram!
                </p>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Usuário</p>
                  <p className="text-yellow-400 font-mono text-lg font-bold">{userData?.generated_username}</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Senha</p>
                  <p className="text-yellow-400 font-mono text-lg font-bold">{userData?.generated_password}</p>
                </div>
              </CardContent>
            </Card>

            {/* Renda Extra Section - Smaller Video */}
            <Card className="mb-6 bg-zinc-900 border-green-500/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white text-center mb-2">
                  💰 Sabia que você pode fazer uma renda extra de<br />
                  <span className="text-green-400">mais de 5 MIL REAIS</span> com essa ferramenta?
                </h3>
                <p className="text-gray-300 text-center text-sm mb-4">
                  Sim, além de utilizar para o seu negócio! Assista o vídeo abaixo:
                </p>
                <div className="max-w-md mx-auto">
                  <div className="aspect-video rounded-lg overflow-hidden border border-zinc-700">
                    <iframe
                      src="https://www.youtube.com/embed/WQwnAHNvSMU"
                      title="Renda Extra com MRO"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Notice */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">
                  💬 Precisa de Ajuda?
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  Temos suporte <strong className="text-white">Anydesk (acesso remoto)</strong> e{' '}
                  <strong className="text-white">Suporte WhatsApp</strong>!
                </p>
                <p className="text-yellow-400 text-sm font-medium">
                  ⚠️ O suporte funciona apenas no <strong>plano pago</strong>!
                </p>
                <p className="text-gray-500 text-xs mt-3">
                  Para testes grátis, assista os vídeos tutoriais para instalar e utilizar.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default TesteGratisUsuario;