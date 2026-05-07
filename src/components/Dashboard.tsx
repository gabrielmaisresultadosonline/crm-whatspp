import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MROSession, Strategy, ProfileSession } from '@/types/instagram';
import { ProfileCard } from './ProfileCard';
import { ProfileScreenshotUpload } from './ProfileScreenshotUpload';
import { AnalysisCard } from './AnalysisCard';
import { StrategyGenerator } from './StrategyGenerator';
import { StrategyDisplay } from './StrategyDisplay';
import { CaptionGenerator } from './CaptionGenerator';
import { GrowthTracker } from './GrowthTracker';
import { ProfileSelector } from './ProfileSelector';
import { UserHeader } from './UserHeader';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { TutorialOverlay } from './TutorialOverlay';
import { TutorialList } from './TutorialList';
import { useTutorial, dashboardTutorial, strategyTutorial } from '@/hooks/useTutorial';
import { addStrategy, resetSession, getSession, updateProfile, updateAnalysis, setCloudSyncCallback } from '@/lib/storage';
import { syncSessionToPersistent } from '@/lib/persistentStorage';
import { getCurrentUser, saveUserToCloud } from '@/lib/userStorage';
import { supabase } from '@/integrations/supabase/client';
import { 
  RotateCcw, 
  User, 
  BarChart3, 
  Lightbulb, 
  Type,
  TrendingUp,
  Wrench,
  Lock,
  Camera,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  session: MROSession;
  onSessionUpdate: (session: MROSession) => void;
  onReset: () => void;
  onAddProfile: (username: string) => void;
  onSelectProfile: (profileId: string) => void;
  onRemoveProfile: (profileId: string) => void;
  onNavigateToRegister: () => void;
  onSync?: () => void;
  isLoading?: boolean;
  onLogout?: () => void;
}

type Tab = 'profile' | 'analysis' | 'strategies' | 'legendas' | 'growth';

export const Dashboard = ({ 
  session, 
  onSessionUpdate, 
  onReset,
  onAddProfile,
  onSelectProfile,
  onRemoveProfile,
  onNavigateToRegister,
  onSync,
  isLoading,
  onLogout
}: DashboardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // CRITICAL: Ensure cloud sync callback is set on mount
  useEffect(() => {
    setCloudSyncCallback(saveUserToCloud);
    console.log('📊 [Dashboard] Cloud sync callback configured');
  }, []);

  // Tutorial system
  const tutorial = useTutorial();

  // Get active profile
  const activeProfile = session.profiles.find(p => p.id === session.activeProfileId);

  const getLoggedInUsername = () => getCurrentUser()?.username || 'anonymous';

  const applyAnalyzedProfileData = ({
    analysis,
    updatedProfile,
    profileData,
  }: {
    analysis: any;
    updatedProfile?: ProfileSession['profile'];
    profileData?: Partial<ProfileSession['profile']>;
  }) => {
    const currentSession = getSession();
    const profileIndex = currentSession.profiles.findIndex(p => p.id === activeProfile.id);

    if (profileIndex === -1) return;

    const mergedProfile = updatedProfile || {
      ...currentSession.profiles[profileIndex].profile,
      ...(profileData || {}),
    };

    currentSession.profiles[profileIndex] = {
      ...currentSession.profiles[profileIndex],
      profile: mergedProfile,
      analysis,
      lastUpdated: new Date().toISOString(),
    };
    currentSession.lastUpdated = new Date().toISOString();

    onSessionUpdate({
      ...currentSession,
      profiles: [...currentSession.profiles],
    });
    syncSessionToPersistent(getLoggedInUsername());
  };

  const refreshSession = () => {
    const updatedSession = getSession();
    onSessionUpdate(updatedSession);
    // Sync to server
    syncSessionToPersistent(getLoggedInUsername());
  };

  const hasRealPrintData = activeProfile?.profile.dataSource === 'screenshot' && !activeProfile?.profile.needsScreenshotAnalysis;

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: <User className="w-4 h-4" />, locked: false },
    { id: 'analysis', label: 'Análise', icon: <BarChart3 className="w-4 h-4" />, locked: !hasRealPrintData },
    { id: 'strategies', label: 'Estratégias', icon: <Lightbulb className="w-4 h-4" />, locked: !hasRealPrintData },
    { id: 'legendas', label: 'Gerar Legendas', icon: <Type className="w-4 h-4" />, locked: !hasRealPrintData },
    { id: 'growth', label: 'Crescimento', icon: <TrendingUp className="w-4 h-4" />, locked: !hasRealPrintData },
  ];

  const handleStrategyGenerated = (strategy: Strategy) => {
    addStrategy(strategy);
    refreshSession();
    // Sync immediately after strategy generation
    syncSessionToPersistent(getLoggedInUsername());
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja resetar todas as informações? Esta ação não pode ser desfeita.')) {
      resetSession();
      onReset();
    }
  };

  if (!activeProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          {/* Desktop/Tablet Header */}
          {/* Desktop Header (xl+) */}
          <div className="hidden xl:flex items-center justify-between gap-2 min-w-0">
            {/* Left: Logo + MRO Button */}
            <div className="flex items-center gap-2 shrink-0">
              <Logo size="sm" />
              <Button
                onClick={() => navigate('/mro-ferramenta')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs xl:text-sm px-3 xl:px-5 py-2 h-9 xl:h-10 rounded-full whitespace-nowrap shrink-0"
                data-tutorial="mro-button"
              >
                <Wrench className="w-4 h-4 mr-1 xl:mr-2 shrink-0" />
                INSTALAR E UTILIZAR FERRAMENTA
              </Button>
            </div>

            {/* Center: Profile Selector + Tabs */}
            <div className="flex items-center gap-3">
              {/* Profile Selector */}
              <div data-tutorial="profile-selector">
                <ProfileSelector
                  profiles={session.profiles}
                  activeProfileId={session.activeProfileId}
                  onSelectProfile={onSelectProfile}
                  onAddProfile={onNavigateToRegister}
                  onRemoveProfile={onRemoveProfile}
                  onSync={onSync}
                  isLoading={isLoading}
                />
              </div>

              {/* Tabs Inline */}
              <nav className="flex items-center gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.locked) {
                        import('sonner').then(({ toast }) => {
                          toast.error('Envie um print do perfil primeiro na aba "Perfil"');
                        });
                        return;
                      }
                      setActiveTab(tab.id as Tab);
                    }}
                    data-tutorial={`tab-${tab.id === 'profile' ? 'perfil' : tab.id === 'analysis' ? 'analise' : tab.id === 'strategies' ? 'estrategias' : tab.id === 'creatives' ? 'criativos' : 'crescimento'}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs whitespace-nowrap ${
                      tab.locked
                        ? 'text-muted-foreground/50 cursor-not-allowed opacity-60'
                        : activeTab === tab.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {tab.locked ? <Lock className="w-3 h-3" /> : tab.icon}
                    <span>{tab.label}</span>
                    {tab.id === 'strategies' && activeProfile.strategies.length > 0 && (
                      <span className="ml-1 w-4 h-4 rounded-full bg-primary-foreground/20 text-[10px] flex items-center justify-center">
                        {activeProfile.strategies.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right: Tutorial + User */}
            <div className="flex items-center gap-2" data-tutorial="user-menu">
              {onLogout && <UserHeader onLogout={onLogout} onReanalysisComplete={() => onSessionUpdate(getSession())} tutorial={tutorial} activeTab={activeTab} />}
            </div>
          </div>

          {/* Mobile Header (< md) - 4 linhas */}
          <div className="flex md:hidden flex-col gap-2">
            {/* Linha 1: Logo centralizada sozinha */}
            <div className="flex justify-center">
              <Logo size="sm" />
            </div>

            {/* Linha 2: INSTALAR E UTILIZAR FERRAMENTA centralizado */}
            <div className="flex justify-center">
              <Button
                onClick={() => navigate('/mro-ferramenta')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-sm px-6 py-2 h-10 rounded-full"
                data-tutorial="mro-button"
              >
                <Wrench className="w-4 h-4 mr-2" />
                INSTALAR E UTILIZAR FERRAMENTA
              </Button>
            </div>

            {/* Linha 3: Tutorial + Conta + User */}
            <div className="flex items-center justify-center gap-2" data-tutorial="user-menu">
              <div data-tutorial="profile-selector">
                <ProfileSelector
                  profiles={session.profiles}
                  activeProfileId={session.activeProfileId}
                  onSelectProfile={onSelectProfile}
                  onAddProfile={onNavigateToRegister}
                  onRemoveProfile={onRemoveProfile}
                  onSync={onSync}
                  isLoading={isLoading}
                />
              </div>
              {onLogout && <UserHeader onLogout={onLogout} onReanalysisComplete={() => onSessionUpdate(getSession())} tutorial={tutorial} activeTab={activeTab} />}
            </div>

            {/* Linha 4: Tabs com scroll horizontal */}
            <nav className="flex items-center justify-center gap-1 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.locked) {
                      import('sonner').then(({ toast }) => {
                        toast.error('Envie um print do perfil primeiro');
                      });
                      return;
                    }
                    setActiveTab(tab.id as Tab);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap text-xs ${
                    tab.locked
                      ? 'text-muted-foreground/50 cursor-not-allowed opacity-60'
                      : activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {tab.locked ? <Lock className="w-3 h-3" /> : React.cloneElement(tab.icon as React.ReactElement, { className: 'w-3 h-3' })}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tablet/Small Desktop Header (md-xl) */}
          <div className="hidden md:flex xl:hidden flex-col gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-2 shrink-0">
                <Logo size="sm" />
                <Button
                  onClick={() => navigate('/mro-ferramenta')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs lg:text-sm px-4 lg:px-5 py-2 h-10 rounded-full whitespace-nowrap shrink-0"
                  data-tutorial="mro-button"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  INSTALAR E UTILIZAR FERRAMENTA
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 min-w-0" data-tutorial="user-menu">
                <div data-tutorial="profile-selector" className="min-w-0 max-w-full">
                  <ProfileSelector
                    profiles={session.profiles}
                    activeProfileId={session.activeProfileId}
                    onSelectProfile={onSelectProfile}
                    onAddProfile={onNavigateToRegister}
                    onRemoveProfile={onRemoveProfile}
                    onSync={onSync}
                    isLoading={isLoading}
                  />
                </div>
                {onLogout && (
                  <div className="shrink-0 max-w-full">
                    <UserHeader onLogout={onLogout} onReanalysisComplete={() => onSessionUpdate(getSession())} tutorial={tutorial} activeTab={activeTab} />
                  </div>
                )}
              </div>
            </div>

            <nav className="flex items-center justify-center gap-1 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.locked) {
                      import('sonner').then(({ toast }) => {
                        toast.error('Envie um print do perfil primeiro');
                      });
                      return;
                    }
                    setActiveTab(tab.id as Tab);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap text-xs ${
                    tab.locked
                      ? 'text-muted-foreground/50 cursor-not-allowed opacity-60'
                      : activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {tab.locked ? <Lock className="w-3 h-3" /> : React.cloneElement(tab.icon as React.ReactElement, { className: 'w-3 h-3' })}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Aviso para enviar print - primeira análise */}
            {activeProfile.profile.needsScreenshotAnalysis && !hasRealPrintData && (
              <div className="glass-card glow-border p-4 sm:p-6 border-2 border-primary/50 bg-primary/5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/20 flex-shrink-0">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-display font-bold text-foreground">
                      📸 Envie o print para analisar o seu perfil com nossa Inteligência Artificial
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Nossa <strong>I.A.</strong> vai ler automaticamente todos os dados do perfil (seguidores, seguindo, posts, bio, nicho) e gerar uma análise completa com estratégias personalizadas!
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <ProfileCard 
              profile={activeProfile.profile} 
              screenshotUrl={activeProfile.screenshotUrl}
              onProfileUpdate={(updatedProfile) => {
                updateProfile(updatedProfile);
                refreshSession();
              }}
              onAnalysisComplete={(analysis) => {
                if (analysis) {
                  updateAnalysis(analysis);
                  refreshSession();
                }
              }}
              onAnalysisApplied={({ analysis, updatedProfile }) => {
                applyAnalyzedProfileData({ analysis, updatedProfile });
              }}
              onScreenshotRemoved={() => {
                console.log(`🗑️ Auto-removing mismatched screenshot for @${activeProfile.profile.username}`);
                const session = getSession();
                const profileIndex = session.profiles.findIndex(p => p.id === activeProfile.id);
                if (profileIndex !== -1) {
                  const profileSession = session.profiles[profileIndex];
                  const history = [...(profileSession.screenshotHistory || [])];
                  if (history.length > 0) history.pop();
                  profileSession.screenshotHistory = history;
                  profileSession.screenshotUrl = history.length > 0 ? history[history.length - 1].url : null;
                  const currentCount = profileSession.screenshotUploadCount || 0;
                  if (currentCount > 0) profileSession.screenshotUploadCount = currentCount - 1;
                  if (!profileSession.screenshotUrl) {
                    profileSession.profile.needsScreenshotAnalysis = true;
                    profileSession.profile.dataSource = 'placeholder';
                  }
                  onSessionUpdate(session);
                  syncSessionToPersistent(getLoggedInUsername());
                  refreshSession();
                }
              }}
            />
            
            {/* Profile Screenshot Upload - key força remount quando perfil muda */}
            <ProfileScreenshotUpload
              key={`screenshot-${activeProfile.id}-${activeProfile.profile.username}`}
              username={activeProfile.profile.username}
              squarecloudUsername={getLoggedInUsername()}
              existingScreenshotUrl={activeProfile.screenshotUrl}
              uploadCount={activeProfile.screenshotUploadCount || 0}
              analysisCompleted={hasRealPrintData}
              onScreenshotUploaded={(url) => {
                console.log(`📸 Saving screenshot for @${activeProfile.profile.username} (ID: ${activeProfile.id})`);
                const session = getSession();
                const profileIndex = session.profiles.findIndex(p => p.id === activeProfile.id);
                if (profileIndex !== -1) {
                  const profile = session.profiles[profileIndex];
                  const history = profile.screenshotHistory || [];
                  history.push({ url, uploadedAt: new Date().toISOString() });
                  session.profiles[profileIndex].screenshotUrl = url;
                  session.profiles[profileIndex].screenshotUploadCount = (profile.screenshotUploadCount || 0) + 1;
                  session.profiles[profileIndex].screenshotHistory = history;
                  onSessionUpdate(session);
                  syncSessionToPersistent(getLoggedInUsername());
                }
              }}
              onScreenshotRemoved={() => {
                console.log(`🗑️ Removing invalid screenshot for @${activeProfile.profile.username}`);
                const session = getSession();
                const profileIndex = session.profiles.findIndex(p => p.id === activeProfile.id);
                if (profileIndex !== -1) {
                  const profileSession = session.profiles[profileIndex];
                  const history = [...(profileSession.screenshotHistory || [])];
                  if (history.length > 0) {
                    history.pop();
                  }
                  profileSession.screenshotHistory = history;
                  profileSession.screenshotUrl = history.length > 0 ? history[history.length - 1].url : null;

                  const currentCount = profileSession.screenshotUploadCount || 0;
                  if (currentCount > 0) {
                    profileSession.screenshotUploadCount = currentCount - 1;
                  }

                  if (!profileSession.screenshotUrl) {
                    profileSession.profile.needsScreenshotAnalysis = true;
                    profileSession.profile.dataSource = 'placeholder';
                  }

                  onSessionUpdate(session);
                  syncSessionToPersistent(getLoggedInUsername());
                  refreshSession();
                }
              }}
              onAnalysisComplete={(analysis) => {
                if (analysis) {
                  updateAnalysis(analysis);
                  refreshSession();
                }
              }}
              onAnalysisApplied={({ analysis, profileData }) => {
                applyAnalyzedProfileData({ analysis, profileData });
              }}
              onProfileDataExtracted={(profileData) => {
                // Update profile with real data extracted from screenshot
                console.log(`📊 Updating profile @${activeProfile.profile.username} with extracted data:`, profileData);
                const updatedProfile = { ...activeProfile.profile, ...profileData };
                updateProfile(updatedProfile);
                refreshSession();
              }}
            />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="max-w-3xl mx-auto">
            {hasRealPrintData ? (
              <AnalysisCard analysis={activeProfile.analysis} />
            ) : (
              <div className="glass-card glow-border p-8 text-center">
                <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-display font-bold mb-2">Análise Bloqueada</h3>
                <p className="text-muted-foreground mb-4">
                  Para acessar a análise completa do perfil, você precisa enviar um print real do perfil primeiro.
                </p>
                <Button 
                  onClick={() => setActiveTab('profile')}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Ir para Envio de Print
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'strategies' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {hasRealPrintData ? (
              <>
                <StrategyGenerator 
                  profile={activeProfile.profile}
                  analysis={activeProfile.analysis}
                  onStrategyGenerated={handleStrategyGenerated}
                  existingStrategies={activeProfile.strategies}
                  profileId={activeProfile.id}
                />
                
                {activeProfile.strategies.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-display font-bold">Estratégias Geradas</h3>
                    <StrategiesAccordionList strategies={activeProfile.strategies} />
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card glow-border p-8 text-center">
                <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-display font-bold mb-2">Estratégias Bloqueadas</h3>
                <p className="text-muted-foreground mb-4">
                  Para gerar estratégias personalizadas, você precisa enviar um print do perfil primeiro.
                </p>
                <Button 
                  onClick={() => setActiveTab('profile')}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Ir para Envio de Print
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'legendas' && (
          <div className="max-w-3xl mx-auto">
            {hasRealPrintData ? (
              <CaptionGenerator 
                profileUsername={activeProfile.profile.username}
                niche={activeProfile.analysis?.niche}
              />
            ) : (
              <div className="glass-card glow-border p-8 text-center">
                <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-display font-bold mb-2">Legendas Bloqueadas</h3>
                <p className="text-muted-foreground mb-4">
                  Para gerar legendas personalizadas, você precisa enviar um print do perfil primeiro.
                </p>
                <Button 
                  onClick={() => setActiveTab('profile')}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Ir para Envio de Print
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="max-w-3xl mx-auto">
            {hasRealPrintData ? (
              <GrowthTracker 
                key={`growth-${activeProfile.id}-${activeProfile.profile.username}`}
                profileSession={activeProfile}
                onUpdate={refreshSession}
              />
            ) : (
              <div className="glass-card glow-border p-8 text-center">
                <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-display font-bold mb-2">Crescimento Bloqueado</h3>
                <p className="text-muted-foreground mb-4">
                  Para acompanhar o crescimento do perfil, você precisa enviar um print do perfil primeiro.
                </p>
                <Button 
                  onClick={() => setActiveTab('profile')}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Ir para Envio de Print
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isActive={tutorial.isActive}
        currentStep={tutorial.getCurrentStepData()}
        currentStepNumber={tutorial.getCurrentStepNumber()}
        totalSteps={tutorial.getTotalSteps()}
        onNext={tutorial.nextStep}
        onPrev={tutorial.prevStep}
        onStop={tutorial.stopTutorial}
      />

      {/* Tutorial List Modal */}
      <TutorialList
        isOpen={tutorial.showList}
        sections={tutorial.tutorialData}
        onClose={() => tutorial.setShowList(false)}
        onStartInteractive={() => tutorial.startTutorial(tutorial.tutorialData)}
        title={activeTab === 'strategies' ? 'Como Gerar Estratégias' : 'Tutorial do Dashboard'}
      />
    </div>
  );
};

const StrategiesAccordionList = ({ strategies }: { strategies: Strategy[] }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const typeIcons: Record<string, string> = {
    mro: '⚡', content: '📅', engagement: '💬', sales: '💰', bio: '👤',
  };

  return (
    <div className="space-y-2">
      {strategies.map((strategy) => {
        const isExpanded = expandedId === strategy.id;
        return (
          <div key={strategy.id} className="glass-card overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : strategy.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">{typeIcons[strategy.type] || '⚡'}</span>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-sm truncate">{strategy.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(strategy.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
              <div className="border-t border-border">
                <StrategyDisplay strategy={strategy} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
