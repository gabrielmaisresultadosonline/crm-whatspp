import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ArrowLeft, Loader2, MessageCircle, CheckCircle, Mail, Clock, Play, X, ChevronLeft, ChevronRight, Type, ExternalLink, Gift, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logoMro from '@/assets/logo-mro.png';
import { TutorialModule, ModuleContent, ModuleVideo, ModuleText, ModuleButton, ModuleSection, ModuleColor, getYoutubeThumbnail, loadModulesFromCloud, AdminSettings } from '@/lib/adminConfig';
import AnnouncementPopup from '@/components/AnnouncementPopup';

// Color mapping for modules (same as MROFerramenta)
const moduleColorClasses: Record<ModuleColor, { border: string; bg: string; accent: string }> = {
  default: { border: 'border-green-600/30', bg: 'bg-green-800/30', accent: 'bg-green-500' },
  green: { border: 'border-emerald-500/50', bg: 'bg-emerald-900/30', accent: 'bg-emerald-500' },
  blue: { border: 'border-blue-500/50', bg: 'bg-blue-900/30', accent: 'bg-blue-500' },
  purple: { border: 'border-purple-500/50', bg: 'bg-purple-900/30', accent: 'bg-purple-500' },
  orange: { border: 'border-orange-500/50', bg: 'bg-orange-900/30', accent: 'bg-orange-500' },
  pink: { border: 'border-pink-500/50', bg: 'bg-pink-900/30', accent: 'bg-pink-500' },
  red: { border: 'border-red-500/50', bg: 'bg-red-900/30', accent: 'bg-red-500' },
  cyan: { border: 'border-cyan-500/50', bg: 'bg-cyan-900/30', accent: 'bg-cyan-500' },
};

const ZapMRO = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number>(365);
  
  // Email registration state
  const [email, setEmail] = useState('');
  const [isEmailLocked, setIsEmailLocked] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  
  // Modules state
  const [modules, setModules] = useState<TutorialModule[]>([]);
  const [settings, setSettings] = useState<Pick<AdminSettings, 'downloadLink' | 'welcomeVideo'> | null>(null);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ModuleContent | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already authenticated and load user data
  useEffect(() => {
    const checkAuth = async () => {
      const zapAuth = localStorage.getItem('zapmro_authenticated');
      const zapUsername = localStorage.getItem('zapmro_username');
      const zapPassword = localStorage.getItem('zapmro_password');
      
      if (zapAuth === 'true' && zapUsername) {
        setIsAuthenticated(true);
        setUsername(zapUsername);
        if (zapPassword) setPassword(zapPassword);
        
        // Load user data from cloud
        try {
          const { data } = await supabase.functions.invoke('zapmro-user-storage', {
            body: { action: 'load', username: zapUsername }
          });
          
          if (data?.success && data?.data) {
            if (data.data.email) {
              setEmail(data.data.email);
              setIsEmailLocked(data.data.email_locked || false);
            }
            if (data.data.days_remaining) {
              setDaysRemaining(data.data.days_remaining);
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };
    
    checkAuth();
  }, []);

  // Load ZAPMRO modules from cloud
  useEffect(() => {
    const loadZapmroModules = async () => {
      if (!isAuthenticated) return;
      
      setIsLoadingModules(true);
      try {
        console.log('[ZapMRO] Loading ZAPMRO modules from cloud...');
        const cloudData = await loadModulesFromCloud('zapmro');
        
        if (cloudData) {
          setModules(cloudData.modules || []);
          setSettings(cloudData.settings || null);
          console.log(`[ZapMRO] Loaded ${cloudData.modules?.length || 0} modules`);
        }
      } catch (error) {
        console.error('[ZapMRO] Error loading modules:', error);
      } finally {
        setIsLoadingModules(false);
      }
    };
    
    loadZapmroModules();
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha usuário e senha',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://mrozap.squareweb.app/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.authenticated) {
        localStorage.setItem('zapmro_authenticated', 'true');
        localStorage.setItem('zapmro_username', username);
        localStorage.setItem('zapmro_password', password);
        
        const userDays = data.daysRemaining || 365;
        setDaysRemaining(userDays);
        setIsAuthenticated(true);
        
        // Save/update user in database
        try {
          const { data: userData } = await supabase.functions.invoke('zapmro-user-storage', {
            body: { 
              action: 'save', 
              username,
              daysRemaining: userDays
            }
          });
          
          if (userData?.success && userData?.data) {
            if (userData.data.email) {
              setEmail(userData.data.email);
              setIsEmailLocked(userData.data.email_locked || false);
            }
          }
        } catch (error) {
          console.error('Error saving user:', error);
        }
        
        toast({
          title: 'Acesso VIP concedido! 👑',
          description: 'Bem-vindo à área ZAPMRO'
        });
      } else {
        toast({
          title: 'Credenciais inválidas',
          description: data.message || 'Verifique usuário e senha',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!email.trim()) {
      toast({
        title: 'Digite seu e-mail',
        variant: 'destructive'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'E-mail inválido',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingEmail(true);

    try {
      // Save email to database
      const { data: saveResult } = await supabase.functions.invoke('zapmro-user-storage', {
        body: { 
          action: 'save', 
          username,
          email,
          daysRemaining
        }
      });

      if (saveResult?.success) {
        setIsEmailLocked(true);
        
        // Send welcome email
        await supabase.functions.invoke('zapmro-user-storage', {
          body: { 
            action: 'send_welcome_email', 
            username,
            email,
            password,
            daysRemaining
          }
        });
        
        toast({
          title: 'E-mail cadastrado! 📧',
          description: 'Enviamos um e-mail de boas-vindas com seus dados de acesso'
        });
      } else {
        toast({
          title: 'Erro ao salvar',
          description: 'Tente novamente',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error saving email:', error);
      toast({
        title: 'Erro ao salvar e-mail',
        variant: 'destructive'
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zapmro_authenticated');
    localStorage.removeItem('zapmro_username');
    localStorage.removeItem('zapmro_password');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setEmail('');
    setIsEmailLocked(false);
  };

  const formatDays = (days: number) => {
    if (days > 365) return 'Vitalício';
    return `${days} dias`;
  };

  // Helper functions
  const getYoutubeEmbedUrl = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    }
    return url;
  };

  const separateContents = (contents: ModuleContent[]) => {
    const sorted = [...contents].sort((a, b) => a.order - b.order);
    const regularContents = sorted.filter(c => c.type !== 'section');
    const sections = sorted.filter(c => c.type === 'section') as ModuleSection[];
    return { regularContents, sections };
  };

  // Content Section Component for ZAPMRO
  const ZapmroContentSection = ({ 
    contents,
    onContentClick
  }: { 
    contents: ModuleContent[];
    onContentClick: (content: ModuleContent) => void;
  }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const videoContents = contents.filter(c => c.type === 'video' || c.type === 'text');
    const buttonContents = contents.filter(c => c.type === 'button');

    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (container) {
        setCanScrollLeft(container.scrollLeft > 10);
        setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
      }
    };

    useEffect(() => {
      // Reset scroll to start on mount
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
      }
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }, [videoContents.length]);

    const scroll = (direction: 'left' | 'right') => {
      const container = scrollContainerRef.current;
      if (container) {
        const scrollAmount = 180;
        container.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });
        setTimeout(checkScroll, 300);
      }
    };

    if (videoContents.length === 0 && buttonContents.length === 0) return null;

    return (
      <div className="space-y-4 w-full">
        {/* Video/Text Carousel */}
        {videoContents.length > 0 && (
          <div className="relative w-full flex justify-center">
            {/* Navigation Arrows */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>
            )}

            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 transition-colors"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>
            )}

            {/* Carousel Container - Always Centered */}
            <div className="px-10 sm:px-12 md:px-14 w-full max-w-fit">
              <div 
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory mx-auto w-fit max-w-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {videoContents.map((content, idx) => (
                  <div 
                    key={content.id}
                    className="group cursor-pointer flex-shrink-0 snap-start w-[100px] xs:w-[110px] sm:w-[130px] md:w-[150px] lg:w-[160px]"
                    onClick={() => onContentClick(content)}
                  >
                    {content.type === 'video' ? (
                      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-green-900 border-2 border-green-600/30 group-hover:border-green-400 transition-all duration-300 shadow-lg">
                        <img 
                          src={(content as ModuleVideo).videoFileUrl ? 
                            ((content as ModuleVideo).thumbnailUrl || 'https://via.placeholder.com/1080x1920?text=MP4') :
                            ((content as ModuleVideo).thumbnailUrl || getYoutubeThumbnail((content as ModuleVideo).youtubeUrl))
                          }
                          alt={content.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/1080x1920?text=Video';
                          }}
                        />
                        
                        {/* Video source badge */}
                        {(content as ModuleVideo).isFileVideo ? (
                          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 py-0.5 bg-emerald-600 rounded text-[10px] sm:text-xs font-semibold text-white flex items-center gap-0.5 sm:gap-1">
                            <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            MP4
                          </div>
                        ) : (
                          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-6 h-4 sm:w-7 sm:h-5 bg-red-600 rounded flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </div>
                        )}
                        
                        {/* Number badge */}
                        {(content as ModuleVideo).showNumber && (
                          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold shadow-lg">
                            {idx + 1}
                          </div>
                        )}

                        {/* Hover play overlay */}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                            <Play className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center border-2 border-green-600/30 group-hover:border-green-400 transition-all duration-300 shadow-lg">
                        <Type className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-400 group-hover:text-green-300 transition-colors" />
                      </div>
                    )}
                    {((content as any).showTitle !== false) && (
                      <p className="font-medium mt-1.5 sm:mt-2 text-[10px] xs:text-xs sm:text-sm text-center text-white group-hover:text-green-300 transition-colors line-clamp-2 px-0.5 sm:px-1">{content.title}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Buttons - Centered */}
        {buttonContents.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 justify-center items-center pt-4 px-4 w-full">
            {buttonContents.map((content) => (
              <Button
                key={content.id}
                onClick={() => window.open((content as ModuleButton).url, '_blank', 'noopener,noreferrer')}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-white text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2"
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                {content.title}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Authenticated member area
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900">
        {/* Header */}
        <header className="bg-green-900/80 backdrop-blur-sm border-b border-green-700/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-green-800/50 hover:bg-green-700/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-green-300" />
              </button>
              <div className="flex items-center gap-3">
                <img src={logoMro} alt="MRO" className="h-10" />
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-white">ZAPMRO</h1>
                  <p className="text-xs text-green-300">Área de Membros</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-800/50 border border-green-600/30">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300">
                  {formatDays(daysRemaining)}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-800/50 border border-green-600/30">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300">
                  {username}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-green-600/50 text-green-300 hover:bg-green-700/50 hover:text-white"
              >
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Email Registration Section */}
          {!isEmailLocked && (
            <div className="bg-green-800/40 backdrop-blur-sm border border-green-600/30 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Cadastre seu E-mail</h3>
                  <p className="text-green-300/70 mb-4">
                    Cadastre seu e-mail para receber seus dados de acesso e novidades
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-green-900/50 border-green-600/50 text-white placeholder:text-green-400/50 focus:border-green-400"
                    />
                    <Button
                      onClick={handleSaveEmail}
                      disabled={isSavingEmail}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white whitespace-nowrap"
                    >
                      {isSavingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Cadastrar E-mail'
                      )}
                    </Button>
                  </div>
                  <p className="text-green-400/50 text-xs mt-2">
                    Este e-mail será vinculado permanentemente à sua conta
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email locked indicator */}
          {isEmailLocked && email && (
            <div className="bg-green-800/20 border border-green-600/20 rounded-xl p-4 mb-8 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <span className="text-green-300 text-sm">E-mail vinculado: </span>
                <span className="text-white font-medium">{email}</span>
              </div>
            </div>
          )}

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold mb-4">
              <MessageCircle className="w-4 h-4" />
              ZAPMRO
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Bem-vindo à <span className="text-green-400">Área VIP</span>
            </h2>
            <p className="text-green-200/80 text-lg max-w-2xl mx-auto">
              Acesse todas as ferramentas de automação para WhatsApp
            </p>
          </div>

          {/* Download Link */}
          {settings?.downloadLink && (
            <div className="flex justify-center mb-8">
              <Button 
                onClick={() => window.open(settings.downloadLink, '_blank')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2"
              >
                <Download className="w-5 h-5" />
                Download ZAPMRO
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoadingModules && (
            <div className="bg-green-800/30 backdrop-blur-sm border border-green-600/30 rounded-2xl p-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-green-400 mb-4 animate-spin" />
              <p className="text-green-300">Carregando módulos...</p>
            </div>
          )}

          {/* Modules Content */}
          {!isLoadingModules && modules.length === 0 && (
            <div className="bg-green-800/30 backdrop-blur-sm border border-green-600/30 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Conteúdo em breve</h3>
              <p className="text-green-300/70">
                A área de membros ZAPMRO está sendo configurada pelo administrador.
              </p>
            </div>
          )}

          {/* Modules List */}
          {!isLoadingModules && modules.length > 0 && (
            <div className="space-y-8">
              {modules.sort((a, b) => a.order - b.order).map((module) => {
                const colorTheme = moduleColorClasses[module.color || 'default'];
                const isCollapsed = module.collapsedByDefault && !expandedModules.has(module.id);
                
                const toggleExpand = () => {
                  setExpandedModules(prev => {
                    const next = new Set(prev);
                    if (next.has(module.id)) {
                      next.delete(module.id);
                    } else {
                      next.add(module.id);
                    }
                    return next;
                  });
                };

                const { regularContents, sections } = separateContents(module.contents);

                return (
                  <div 
                    key={module.id}
                    className={`backdrop-blur-sm rounded-xl border-2 p-6 ${colorTheme.border} ${colorTheme.bg}`}
                  >
                    {/* Module Header */}
                    <div 
                      className={`flex flex-col items-center gap-3 ${isCollapsed ? '' : 'mb-6'} text-center ${module.collapsedByDefault ? 'cursor-pointer' : ''}`}
                      onClick={module.collapsedByDefault ? toggleExpand : undefined}
                    >
                      {module.collapsedByDefault && module.coverUrl && (
                        <div className="relative w-full max-w-xs mx-auto mb-2">
                          <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-green-900/50 group">
                            <img 
                              src={module.coverUrl} 
                              alt={module.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-xl">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        {module.showNumber && (
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${colorTheme.accent}`}>
                            {module.order}
                          </span>
                        )}
                        <h3 className="text-xl font-bold text-white">{module.title}</h3>
                        {module.isBonus && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black rounded-full text-xs font-semibold flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            BÔNUS
                          </span>
                        )}
                      </div>
                      {module.description && (
                        <p className="text-green-300/70 text-sm max-w-xl">{module.description}</p>
                      )}
                    </div>

                    {/* Module Contents */}
                    {!isCollapsed && (
                      <div className="space-y-4">
                        {/* Regular Contents */}
                        {regularContents.length > 0 && (
                          <ZapmroContentSection 
                            contents={regularContents}
                            onContentClick={(content) => {
                              if (content.type === 'button') {
                                window.open((content as ModuleButton).url, '_blank', 'noopener,noreferrer');
                              } else {
                                setSelectedContent(content);
                              }
                            }}
                          />
                        )}

                        {/* Sections */}
                        {sections.map((section) => (
                          <div key={section.id} className="mt-6 rounded-2xl border border-green-600/20 bg-green-900/30 p-4 md:p-6">
                            {section.showTitle !== false && (
                              <div className="text-center mb-4">
                                <div className="flex items-center justify-center gap-2 md:gap-3">
                                  <h3 className="text-base md:text-lg font-bold text-white">{section.title}</h3>
                                  {section.isBonus && (
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black rounded-full text-xs font-semibold flex items-center gap-1">
                                      <Gift className="w-3 h-3" />
                                      BÔNUS
                                    </span>
                                  )}
                                </div>
                                {section.description && (
                                  <p className="text-xs md:text-sm text-green-300/60 mt-1">{section.description}</p>
                                )}
                              </div>
                            )}
                            <ZapmroContentSection 
                              contents={section.contents || []}
                              onContentClick={(content) => {
                                if (content.type === 'button') {
                                  window.open((content as ModuleButton).url, '_blank', 'noopener,noreferrer');
                                } else {
                                  setSelectedContent(content);
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Announcement Popup */}
        {showAnnouncements && (
          <AnnouncementPopup 
            targetArea="zapmro"
            onComplete={() => setShowAnnouncements(false)} 
          />
        )}

        {/* Content Lightbox */}
        {selectedContent && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedContent(null)}
          >
            <div 
              className="w-full max-w-5xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{selectedContent.title}</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedContent(null)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {selectedContent.type === 'video' ? (
                <>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    {(selectedContent as ModuleVideo).isFileVideo && (selectedContent as ModuleVideo).videoFileUrl ? (
                      <video
                        src={(selectedContent as ModuleVideo).videoFileUrl}
                        title={selectedContent.title}
                        className="w-full h-full"
                        controls
                        autoPlay
                      />
                    ) : (
                      <iframe
                        src={getYoutubeEmbedUrl((selectedContent as ModuleVideo).youtubeUrl)}
                        title={selectedContent.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                  {(selectedContent as ModuleVideo).description && (
                    <p className="text-green-300/70 mt-4">{(selectedContent as ModuleVideo).description}</p>
                  )}
                </>
              ) : (
                <div className="bg-green-900/50 p-6 rounded-lg">
                  <div className="prose prose-invert max-w-none">
                    {(selectedContent as ModuleText).content.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-4 last:mb-0 text-white">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Back button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 p-3 rounded-xl bg-green-800/50 hover:bg-green-700/50 transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5 text-green-300" />
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-green-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gray-900 rounded-xl p-4 mx-auto w-fit mb-4">
              <img src={logoMro} alt="MRO" className="h-16" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold mb-4">
              ZAPMRO
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Acesso VIP 👑</h1>
            <p className="text-gray-500 mt-2">Entre com suas credenciais</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Usuário VIP"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha de Acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  🔓 ACESSAR
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-green-300/60 text-sm z-10">
        Mais Resultados Online © 2024
      </p>
    </div>
  );
};

export default ZapMRO;
