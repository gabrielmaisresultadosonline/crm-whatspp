import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, Lock, LogOut, User, Key, Loader2, ChevronRight, ChevronLeft, Clock, Video as VideoIcon, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import logoMro from "@/assets/logo-mro.png";
import { VideoLightbox } from "@/components/VideoLightbox";

interface Video { 
  id: string; 
  title: string; 
  description: string; 
  video_url: string; 
  video_type: string; 
  thumbnail_url: string; 
  duration: string; 
  order_index: number;
  show_title?: boolean;
  show_number?: boolean;
  show_play_button?: boolean;
}
interface Upsell { id: string; module_id: string; title: string; description: string; thumbnail_url: string; button_text: string; button_url: string; price: string; original_price: string; show_after_days: number; }
interface Module { id: string; title: string; description: string; thumbnail_url: string; order_index: number; videos: Video[]; upsells: Upsell[]; }
interface Banner { id: string; title: string; description: string; image_url: string; link_url: string; link_text: string; }

const MetodoSeguidorMembro = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [daysSinceStart, setDaysSinceStart] = useState(0);

  useEffect(() => {
    // Se o cliente voltou do checkout, confirmar pagamento usando os parâmetros do redirect_url
    const params = new URLSearchParams(window.location.search);
    const order_nsu = params.get("order_nsu") || params.get("orderNsu") || undefined;
    const slug = params.get("slug") || params.get("invoice_slug") || params.get("invoiceSlug") || undefined;
    const transaction_nsu = params.get("transaction_nsu") || params.get("transactionNsu") || undefined;

    if (!order_nsu || !slug || !transaction_nsu) return;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("metodo-seguidor-verify-payment", {
          body: { order_nsu, slug, transaction_nsu },
        });

        if (error) throw error;

        if (data?.paid) {
          toast.success("Pagamento confirmado! Seu acesso foi liberado.");
        } else {
          toast("Pagamento ainda processando. Se já pagou, aguarde alguns instantes e atualize a página.");
        }
      } catch (e) {
        console.error("Payment confirmation error:", e);
        toast.error("Não conseguimos confirmar o pagamento automaticamente. Tente atualizar em alguns instantes.");
      } finally {
        // Limpa parâmetros da URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    })();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const savedSession = localStorage.getItem("metodo_seguidor_session");
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          const { data } = await supabase.functions.invoke("metodo-seguidor-auth", { body: { action: "verify", userId: session.id } });
          if (data?.success && data?.user) {
            setUserData(data.user);
            setIsLoggedIn(true);
            if (data.user.subscription_start) {
              const start = new Date(data.user.subscription_start);
              const now = new Date();
              setDaysSinceStart(Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            }
          } else { localStorage.removeItem("metodo_seguidor_session"); }
        } catch (e) { localStorage.removeItem("metodo_seguidor_session"); }
      }
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  useEffect(() => { if (isLoggedIn) { loadModules(); loadBanners(); } }, [isLoggedIn]);

  // Auto-slide banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => setCurrentBanner(prev => (prev + 1) % banners.length), 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const loadModules = async () => {
    setLoadingModules(true);
    try {
      const { data: modulesData } = await supabase.from("metodo_seguidor_modules").select("*").eq("is_active", true).order("order_index");
      const { data: videosData } = await supabase.from("metodo_seguidor_videos").select("*").eq("is_active", true).order("order_index");
      const { data: upsellsData } = await supabase.from("metodo_seguidor_upsells").select("*").eq("is_active", true).order("order_index");
      if (modulesData) {
        const modulesWithVideos = modulesData.map(module => ({
          ...module,
          videos: (videosData || []).filter(v => v.module_id === module.id),
          upsells: (upsellsData || []).filter(u => u.module_id === module.id)
        }));
        setModules(modulesWithVideos);
      }
    } catch (error) { console.error("Error loading modules:", error); toast.error("Erro ao carregar conteúdo"); }
    finally { setLoadingModules(false); }
  };

  const loadBanners = async () => {
    try {
      const { data } = await supabase.from("metodo_seguidor_banners").select("*").eq("is_active", true).order("order_index");
      if (data) setBanners(data);
    } catch (error) { console.error("Error loading banners:", error); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("metodo-seguidor-auth", { body: { action: "login", username: username.trim(), password: password.trim() } });
      if (error || !data?.success) { toast.error(data?.error || "Credenciais inválidas"); return; }
      localStorage.setItem("metodo_seguidor_session", JSON.stringify(data.user));
      setUserData(data.user);
      setIsLoggedIn(true);
      if (data.user.subscription_start) {
        const start = new Date(data.user.subscription_start);
        setDaysSinceStart(Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }
      toast.success("Login realizado com sucesso!");
    } catch (error) { console.error("Login error:", error); toast.error("Erro ao fazer login."); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.removeItem("metodo_seguidor_session"); setIsLoggedIn(false); setUserData(null); setSelectedModule(null); setSelectedVideo(null); };

  if (checkingSession) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-10 h-10 text-amber-400 animate-spin" /></div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logoMro} alt="MRO" className="h-14 sm:h-16 mx-auto mb-6 object-contain" />
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Área de Membros</h1>
            <p className="text-gray-400 text-sm sm:text-base">Método de Correção de Seguidores</p>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 sm:p-8 backdrop-blur-lg">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input type="text" placeholder="Seu usuário" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10 bg-gray-800 border-gray-700 text-white" required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Senha</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-gray-800 border-gray-700 text-white" required />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-5 sm:py-6 text-sm sm:text-base">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Entrando...</> : <><Lock className="w-5 h-5 mr-2" />Entrar</>}
              </Button>
            </form>
          </div>
          <p className="text-center text-gray-500 text-xs sm:text-sm mt-6">Ainda não tem acesso? <a href="/comprouseguidores" className="text-amber-400 hover:underline">Clique aqui</a></p>
        </div>
      </div>
    );
  }

  // Video Lightbox
  if (selectedVideo) {
    return <VideoLightbox video={selectedVideo} onClose={() => setSelectedVideo(null)} />;
  }

  // Module Videos View - Netflix Style Grid
  if (selectedModule) {
    const visibleUpsells = selectedModule.upsells.filter(u => daysSinceStart >= u.show_after_days);
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white">
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
            <button onClick={() => setSelectedModule(null)} className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white text-sm sm:text-base">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
              <span>Módulos</span>
            </button>
            <img src={logoMro} alt="MRO" className="h-7 sm:h-8 object-contain" />
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        <div className="pt-16 sm:pt-20 pb-8 px-2 sm:px-4">
          <div className="max-w-6xl mx-auto">
            {/* Module Header */}
            <div className="mb-6 sm:mb-8 px-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{selectedModule.title}</h1>
              {selectedModule.description && <p className="text-gray-400 text-sm sm:text-base">{selectedModule.description}</p>}
            </div>

            {selectedModule.videos.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800 mx-2">
                <VideoIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum vídeo disponível neste módulo ainda.</p>
              </div>
            ) : (
              /* Netflix Style Video Grid - Vertical Stories */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                {selectedModule.videos.map((video, index) => {
                  const showTitle = video.show_title !== false;
                  const showNumber = video.show_number !== false;
                  const showPlayButton = video.show_play_button !== false;
                  
                  return (
                    <button 
                      key={video.id} 
                      onClick={() => setSelectedVideo(video)} 
                      className="group relative aspect-[9/16] bg-gray-900 rounded-lg sm:rounded-xl overflow-hidden border border-gray-800 hover:border-amber-500/50 hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {/* Thumbnail */}
                      {video.thumbnail_url ? (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <VideoIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      {/* Play Button */}
                      {showPlayButton && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-full flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-lg">
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 text-black ml-0.5" fill="currentColor" />
                        </div>
                      )}

                      {/* Number Badge */}
                      {showNumber && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-6 h-6 sm:w-8 sm:h-8 bg-black/70 rounded-full flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-bold text-white">{index + 1}</span>
                        </div>
                      )}

                      {/* Bottom Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                        {showTitle && (
                          <h3 className="font-medium text-white text-xs sm:text-sm line-clamp-2 mb-1">
                            {video.title}
                          </h3>
                        )}
                        {video.duration && (
                          <div className="flex items-center gap-1 text-gray-300">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] sm:text-xs">{video.duration}</span>
                          </div>
                        )}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Upsells */}
            {visibleUpsells.length > 0 && (
              <div className="mt-8 space-y-4 px-2">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Conteúdo Premium
                </h2>
                {visibleUpsells.map(upsell => (
                  <a key={upsell.id} href={upsell.button_url} target="_blank" rel="noopener noreferrer" 
                     className="block bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/50 rounded-xl p-3 sm:p-4 hover:border-purple-400 transition-all">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {upsell.thumbnail_url && <img src={upsell.thumbnail_url} alt={upsell.title} className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-lg">{upsell.title}</h3>
                        {upsell.description && <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">{upsell.description}</p>}
                        <div className="flex items-center gap-2 mt-1 sm:mt-2">
                          {upsell.original_price && <span className="text-gray-500 line-through text-xs sm:text-sm">{upsell.original_price}</span>}
                          {upsell.price && <span className="text-green-400 font-bold text-sm sm:text-lg">{upsell.price}</span>}
                        </div>
                      </div>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm px-2 sm:px-4 hidden sm:flex">
                        {upsell.button_text}<ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard - Netflix Style Modules
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <img src={logoMro} alt="MRO" className="h-8 sm:h-10 object-contain" />
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-400 text-xs sm:text-sm hidden md:block">Olá, <span className="text-amber-400">{userData?.instagram_username || userData?.email}</span></span>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs sm:text-sm">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="pt-16 sm:pt-20 pb-8">
        {/* Banner Carousel */}
        {banners.length > 0 && (
          <div className="relative mb-6 sm:mb-8">
            <div className="overflow-hidden">
              <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentBanner * 100}%)` }}>
                {banners.map(banner => (
                  <div key={banner.id} className="w-full flex-shrink-0">
                    <div className="relative aspect-[16/9] sm:aspect-[21/9] md:aspect-[3/1] max-h-[300px] sm:max-h-[400px]">
                      <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                      <div className="absolute inset-0 flex items-center">
                        <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full">
                          <div className="max-w-md sm:max-w-lg">
                            {banner.title && <h2 className="text-lg sm:text-2xl md:text-4xl font-bold mb-1 sm:mb-2">{banner.title}</h2>}
                            {banner.description && <p className="text-gray-300 text-xs sm:text-sm md:text-base mb-2 sm:mb-4 line-clamp-2">{banner.description}</p>}
                            {banner.link_url && (
                              <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
                                <Button className="bg-amber-500 hover:bg-amber-600 text-black text-xs sm:text-sm">
                                  {banner.link_text || "Saiba Mais"}<ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {banners.length > 1 && (
              <>
                <button onClick={() => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/80">
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/80">
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setCurrentBanner(i)} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${i === currentBanner ? "bg-amber-500" : "bg-white/30"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          <div className="flex items-center gap-2 mb-4 sm:mb-6 px-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold">Conteúdo do Curso</h2>
          </div>

          {loadingModules ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Carregando módulos...</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum módulo disponível ainda.</p>
            </div>
          ) : (
            /* Netflix Style Module Grid - Vertical Stories */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {modules.map((module, index) => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(module)}
                  className="group relative aspect-[9/16] bg-gray-900 rounded-lg sm:rounded-xl overflow-hidden border border-gray-800 hover:border-amber-500/50 hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {/* Module Thumbnail */}
                  {module.thumbnail_url ? (
                    <img 
                      src={module.thumbnail_url} 
                      alt={module.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/30 to-gray-900">
                      <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500/50" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Module Number */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-6 h-6 sm:w-8 sm:h-8 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-black">{index + 1}</span>
                  </div>

                  {/* Video Count */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/70 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 flex items-center gap-1">
                    <VideoIcon className="w-3 h-3 text-gray-300" />
                    <span className="text-[10px] sm:text-xs text-gray-300">{module.videos.length}</span>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                    <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-2 mb-1">
                      {module.title}
                    </h3>
                    {module.description && (
                      <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">
                        {module.description}
                      </p>
                    )}
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetodoSeguidorMembro;
