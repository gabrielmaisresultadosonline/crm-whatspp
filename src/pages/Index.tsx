import { useState, useEffect } from 'react';
import { LoginPage } from '@/components/LoginPage';
import { ProfileRegistration } from '@/components/ProfileRegistration';
import { Dashboard } from '@/components/Dashboard';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AgeRestrictionDialog } from '@/components/AgeRestrictionDialog';
import { PrivateProfileDialog } from '@/components/PrivateProfileDialog';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import { CadastrarContaButton } from '@/components/CadastrarContaButton';
import { MROSession, ProfileSession, InstagramProfile, ProfileAnalysis } from '@/types/instagram';
import {
  getSession, 
  saveSession, 
  hasExistingSession, 
  createEmptySession,
  addProfile,
  setActiveProfile,
  removeProfile,
  getActiveProfile,
  cleanExpiredCreatives,
  cleanExpiredStrategies,
  setCloudSyncCallback
} from '@/lib/storage';
import { 
  isAuthenticated, 
  getRegisteredIGs,
  isIGRegistered,
  addRegisteredIG,
  getCurrentUser,
  logoutUser,
  saveUserToCloud
} from '@/lib/userStorage';
import { verifyRegisteredIGs } from '@/lib/squareApi';
// API imports removed - profile data now comes from screenshot analysis
import { useToast } from '@/hooks/use-toast';
import { 
  loadPersistedDataOnLogin, 
  syncSessionToPersistent,
  hasPersistedProfileData,
  getPersistedProfile,
  persistProfileData,
  syncPersistentToSession
} from '@/lib/persistentStorage';
import { supabase } from '@/integrations/supabase/client';


const Index = () => {
  const [session, setSession] = useState<MROSession>(createEmptySession());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | undefined>(undefined);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasRegisteredProfiles, setHasRegisteredProfiles] = useState(false);
  const [ageRestrictionProfile, setAgeRestrictionProfile] = useState<string | null>(null);
  const [privateProfile, setPrivateProfile] = useState<string | null>(null);
  const [pendingSyncInstagrams, setPendingSyncInstagrams] = useState<string[]>([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const { toast } = useToast();

  // Get current logged in username
  const getLoggedInUsername = (): string => {
    const user = getCurrentUser();
    return user?.username || 'anonymous';
  };

  // Set up cloud sync callback on mount (critical for strategies/creatives persistence)
  useEffect(() => {
    setCloudSyncCallback(saveUserToCloud);
  }, []);

  // Check auth status on mount and load persisted data
  useEffect(() => {
    const initializeFromCloudData = async () => {
      try {
        const authenticated = isAuthenticated();
        setIsLoggedIn(authenticated);
        
        if (authenticated) {
          const registeredIGs = getRegisteredIGs();
          setHasRegisteredProfiles(registeredIGs.length > 0);
          
          // Just check the existing session - data should already be loaded
          const existingSession = getSession();
          
          console.log(`🔐 Auth check: ${registeredIGs.length} IGs registrados, ${existingSession.profiles.length} perfis na sessão`);
          
          // Clean expired data
          cleanExpiredCreatives();
          cleanExpiredStrategies();
          
          setSession(existingSession);
          
          if (existingSession.profiles.length > 0) {
            setShowDashboard(true);
            // Show announcements when user is already logged in and has profiles
            setShowAnnouncements(true);
            
            // FORCED UPDATE: Every time the user enters, sync with SquareCloud
            console.log("🔄 Entrou logado, forçando sincronização com SquareCloud...");
            const user = getCurrentUser();
            const squareResult = await verifyRegisteredIGs(user?.username || '');
            if (squareResult.success && squareResult.instagrams && squareResult.instagrams.length > 0) {
              handleSyncComplete(squareResult.instagrams);
            }
          }
        }
      } catch (error) {
        console.error('[Index] Error in auth check:', error);
        setIsLoggedIn(false);
      }
    };
    
    initializeFromCloudData();
  }, []);

  const handleLoginSuccess = async () => {
    setIsLoggedIn(true);
    
    try {
      // CRITICAL: Get authoritative list of IGs from SquareCloud
      const user = getCurrentUser();
      const squareResult = await verifyRegisteredIGs(user?.username || '');
      const squareIGs = squareResult.success && squareResult.instagrams ? squareResult.instagrams : [];
      const squareIGsSet = new Set(squareIGs.map(ig => ig.toLowerCase()));

      const registeredIGs = getRegisteredIGs();
      setHasRegisteredProfiles(squareIGs.length > 0 || registeredIGs.length > 0);
      
      // IMPORTANT: LoginPage already called initializeFromCloud + reconciliation
      const existingSession = getSession();
      
      console.log(`🔐 Login completo: ${existingSession.profiles.length} perfis na sessão, ${squareIGs.length} IGs no SquareCloud`);
      
      if (existingSession.profiles.length > 0) {
        setSession(existingSession);
        setShowDashboard(true);
        console.log(`☁️ Perfis já carregados da nuvem - mostrando dashboard direto`);
      } else if (squareIGs.length > 0) {
        // No cloud data but has registered profiles in SquareCloud - AUTO SYNC
        console.log(`🔄 Nenhum dado na nuvem, sincronizando ${squareIGs.length} perfis do SquareCloud...`);
        setIsLoading(true);
        setLoadingMessage('Sincronizando perfis...');
        setLoadingSubMessage(`Carregando ${squareIGs.length} perfis. Isso pode levar alguns minutos.`);
        
        await handleSyncComplete(squareIGs);
      } else {
        // No profiles at all - show registration screen
        setSession(existingSession);
      }
    } catch (error) {
      console.error('[Index] Error in handleLoginSuccess:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
    setShowDashboard(false);
    setHasRegisteredProfiles(false);
    setSession(createEmptySession());
  };

  const handleProfileRegistered = async (profile: InstagramProfile, analysis: ProfileAnalysis) => {
    const loggedInUsername = getLoggedInUsername();
    
    // Add profile to session
    addProfile(profile, analysis);
    
    // PERSIST DATA PERMANENTLY TO SERVER
    await persistProfileData(loggedInUsername, profile.username, profile, analysis);
    
    // Get updated session
    const updatedSession = getSession();
    setSession(updatedSession);
    setShowDashboard(true);
    setHasRegisteredProfiles(true);

    // Sync to server
    await syncSessionToPersistent(loggedInUsername);

    toast({
      title: "Perfil cadastrado! ✨",
      description: `@${profile.username} cadastrado. Agora envie o print para gerar a análise real.`,
    });
  };

  const handleSyncComplete = async (instagrams: string[]) => {
    setIsLoading(true);
    setLoadingMessage('Vinculando perfis...');
    setLoadingSubMessage(`Total: ${instagrams.length} conta${instagrams.length !== 1 ? 's' : ''}`);
    setSyncProgress({ current: 0, total: instagrams.length });
    
    const user = getCurrentUser();
    const loggedInUsername = getLoggedInUsername();
    let processedCount = 0;
    let restoredPrintCount = 0;
    
    for (const ig of instagrams) {
      processedCount++;
      setSyncProgress({ current: processedCount, total: instagrams.length });
      setLoadingMessage(`Vinculando @${ig}...`);
      setLoadingSubMessage(`${processedCount} de ${instagrams.length} conta${instagrams.length !== 1 ? 's' : ''}`);
      
      const normalizedIg = ig.toLowerCase();
      
      // Check if already in session
      const existingProfile = session.profiles.find(
        p => p.profile.username.toLowerCase() === normalizedIg
      );
      
      if (existingProfile) {
        console.log(`⏭️ @${ig} já está na sessão`);
        continue;
      }
      
      // Reuse only profiles that were already extracted from a real screenshot
      const persistedData = getPersistedProfile(normalizedIg);
      const hasScreenshotDerivedData = persistedData && persistedData.profile.dataSource === 'screenshot';
      
      if (hasScreenshotDerivedData) {
        console.log(`📦 Usando dados reais do print salvos para @${ig}`);
        addProfile(persistedData.profile, persistedData.analysis);
        restoredPrintCount++;
        continue;
      }
      
      // Create placeholder profile - user will upload screenshot for real data
      const placeholderProfile: InstagramProfile = {
        username: normalizedIg,
        fullName: '',
        bio: '',
        profilePicUrl: '',
        followers: 0,
        following: 0,
        posts: 0,
        externalUrl: '',
        isBusinessAccount: false,
        category: '',
        engagement: 0,
        avgLikes: 0,
        avgComments: 0,
        recentPosts: [],
        needsScreenshotAnalysis: true,
        dataSource: 'placeholder',
      };
      
      const placeholderAnalysis: ProfileAnalysis = {
        strengths: ['📸 Perfil cadastrado - envie um print para análise completa'],
        weaknesses: ['⏳ Aguardando print do perfil para análise'],
        opportunities: ['🎯 Envie um print do perfil para desbloquear análise, estratégias e crescimento'],
        niche: 'Aguardando análise',
        audienceType: 'Aguardando análise',
        contentScore: 0,
        engagementScore: 0,
        profileScore: 0,
        recommendations: ['Envie um print do perfil na aba "Perfil" para análise completa com I.A.']
      };
      
      addProfile(placeholderProfile, placeholderAnalysis);
      await persistProfileData(loggedInUsername, normalizedIg, placeholderProfile, placeholderAnalysis);
      
      if (user?.email && !isIGRegistered(normalizedIg)) {
        addRegisteredIG(normalizedIg, user.email, true);
      }
    }

    const updatedSession = getSession();
    setSession(updatedSession);
    
    // Sync all to server
    await syncSessionToPersistent(loggedInUsername);
    
    if (updatedSession.profiles.length > 0) {
      setShowDashboard(true);
      setHasRegisteredProfiles(true);
    }
    
    setIsLoading(false);
    setSyncProgress(undefined);
    
    toast({
      title: 'Perfis vinculados!',
      description: `${processedCount} perfil(is) vinculado(s). Envie prints para análise.`
    });
  };

  const handleManualSync = async () => {
    setIsLoading(true);
    setLoadingMessage('Buscando contas no servidor...');
    try {
      const user = getCurrentUser();
      const squareResult = await verifyRegisteredIGs(user?.username || '');
      
      if (squareResult.success && squareResult.instagrams && squareResult.instagrams.length > 0) {
        await handleSyncComplete(squareResult.instagrams);
        toast({
          title: "Sincronização concluída",
          description: `${squareResult.instagrams.length} contas encontradas.`,
        });
      } else {
        setIsLoading(false);
        toast({
          title: "Nenhuma conta nova",
          description: "Não foram encontradas novas contas vinculadas ao seu usuário.",
        });
      }
    } catch (error) {
      console.error('[Index] Error in handleManualSync:', error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Erro na sincronização",
        description: "Não foi possível conectar ao servidor SquareCloud.",
      });
    }
  };

  const handleAddNewProfile = async (username: string) => {
    // Just navigate to registration - profiles are analyzed via screenshot now
    toast({
      title: 'Cadastre o perfil',
      description: 'Use a tela de cadastro para adicionar novos perfis',
    });
  };

  const handleSelectProfile = (profileId: string) => {
    setActiveProfile(profileId);
    const updatedSession = getSession();
    setSession(updatedSession);
  };

  const handleRemoveProfile = (profileId: string) => {
    removeProfile(profileId);
    const updatedSession = getSession();
    setSession(updatedSession);
    
    if (updatedSession.profiles.length === 0) {
      setShowDashboard(false);
    }
  };

  const handleSessionUpdate = async (updatedSession: MROSession) => {
    setSession(updatedSession);
    saveSession(updatedSession);
    
    // Sync to server on every update
    const loggedInUsername = getLoggedInUsername();
    await syncSessionToPersistent(loggedInUsername);
  };

  const handleReset = () => {
    setSession(createEmptySession());
    setShowDashboard(false);
    toast({
      title: "Sessão resetada",
      description: "Todas as informações foram apagadas.",
    });
  };

  const handleNavigateToRegister = () => {
    setShowDashboard(false);
  };

  // Navega para área de membros SEM sincronizar automaticamente
  const handleEnterMemberArea = () => {
    const updatedSession = getSession();
    setSession(updatedSession);
    
    if (updatedSession.profiles.length > 0) {
      setShowDashboard(true);
      setHasRegisteredProfiles(true);
    } else {
      // Se não tem perfis na sessão, apenas mostra o dashboard vazio
      setShowDashboard(true);
      setHasRegisteredProfiles(true);
    }
  };

  const handleRetrySync = () => {
    setAgeRestrictionProfile(null);
    setPrivateProfile(null);
    if (pendingSyncInstagrams.length > 0) {
      handleSyncComplete(pendingSyncInstagrams);
    }
  };

  // Handler para ir direto para área de membros com perfil placeholder (restrição de idade)
  const handleGoToMemberAreaWithPlaceholder = () => {
    if (!ageRestrictionProfile) return;
    
    const loggedInUsername = getLoggedInUsername();
    const username = ageRestrictionProfile.toLowerCase().replace('@', '');
    
    // Criar perfil placeholder para upload de screenshot
    const placeholderProfile: InstagramProfile = {
      username: username,
      fullName: '',
      bio: '',
      profilePicUrl: '',
      followers: 0,
      following: 0,
      posts: 0,
      externalUrl: '',
      isBusinessAccount: false,
      category: '',
      engagement: 0,
      avgLikes: 0,
      avgComments: 0,
      recentPosts: [],
      needsScreenshotAnalysis: true,
      dataSource: 'placeholder'
    };
    
    const placeholderAnalysis: ProfileAnalysis = {
      strengths: ['📸 Envie um print do perfil para análise completa'],
      weaknesses: ['⚠️ Dados não disponíveis via API (restrição de idade)'],
      opportunities: ['🎯 Após enviar o print, nossa IA vai analisar seu perfil'],
      niche: 'A ser identificado',
      audienceType: 'A ser identificado',
      contentScore: 0,
      engagementScore: 0,
      profileScore: 0,
      recommendations: ['Envie um print do seu perfil do Instagram para análise completa']
    };
    
    // Adiciona o perfil placeholder
    addProfile(placeholderProfile, placeholderAnalysis);
    
    // Registra o IG se tiver email
    const user = getCurrentUser();
    if (user?.email && !isIGRegistered(username)) {
      addRegisteredIG(username, user.email, true);
    }
    
    const updatedSession = getSession();
    setSession(updatedSession);
    setShowDashboard(true);
    setHasRegisteredProfiles(true);
    setAgeRestrictionProfile(null);
    
    toast({
      title: "Perfil adicionado! 📸",
      description: `@${username} foi adicionado. Envie um print do perfil para análise completa.`,
    });
  };

  const ageRestrictionDialogElement = (
    <AgeRestrictionDialog
      isOpen={!!ageRestrictionProfile}
      onClose={() => setAgeRestrictionProfile(null)}
      username={ageRestrictionProfile || ''}
      onRetrySync={handleRetrySync}
      onGoToMemberArea={handleGoToMemberAreaWithPlaceholder}
    />
  );

  const privateProfileDialogElement = (
    <PrivateProfileDialog
      isOpen={!!privateProfile}
      onClose={() => setPrivateProfile(null)}
      username={privateProfile || ''}
      onRetrySync={handleRetrySync}
    />
  );

  // Not logged in - show login page
  if (!isLoggedIn) {
    return (
      <>
        <LoadingOverlay isVisible={isLoading} message={loadingMessage} subMessage={loadingSubMessage} />
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        {ageRestrictionDialogElement}
        {privateProfileDialogElement}
      </>
    );
  }

  // Logged in but no registered profiles - show registration
  if (!hasRegisteredProfiles || !showDashboard) {
    return (
      <>
        <LoadingOverlay isVisible={isLoading} message={loadingMessage} subMessage={loadingSubMessage} progress={syncProgress} />
        <ProfileRegistration 
          onProfileRegistered={handleProfileRegistered}
          onSyncComplete={handleSyncComplete}
          onEnterMemberArea={handleEnterMemberArea}
          onLogout={handleLogout}
        />
        {ageRestrictionDialogElement}
        {privateProfileDialogElement}
      </>
    );
  }

  // Show dashboard
  // Get active profile to check if screenshot exists
  const activeProfile = session.profiles.find(p => p.id === session.activeProfileId);
  const hasScreenshot = !!activeProfile?.screenshotUrl;

  if (showDashboard && session.profiles.length > 0) {
    return (
      <>
        <LoadingOverlay isVisible={isLoading} message={loadingMessage} subMessage={loadingSubMessage} progress={syncProgress} />
        {/* Avisos só aparecem APÓS o upload do print do perfil */}
        {showAnnouncements && hasScreenshot && (
          <AnnouncementPopup targetArea="instagram" onComplete={() => setShowAnnouncements(false)} />
        )}
        <Dashboard
          session={session} 
          onSessionUpdate={handleSessionUpdate}
          onReset={handleReset}
          onAddProfile={handleAddNewProfile}
          onSelectProfile={handleSelectProfile}
          onRemoveProfile={handleRemoveProfile}
          onNavigateToRegister={handleNavigateToRegister}
          onSync={handleManualSync}
          isLoading={isLoading}
          onLogout={handleLogout}
        />
        {ageRestrictionDialogElement}
        {privateProfileDialogElement}
        <CadastrarContaButton onClick={handleNavigateToRegister} />
      </>
    );
  }

  // Fallback to registration
  return (
    <>
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} subMessage={loadingSubMessage} progress={syncProgress} />
      <ProfileRegistration 
        onProfileRegistered={handleProfileRegistered}
        onSyncComplete={handleSyncComplete}
        onEnterMemberArea={handleEnterMemberArea}
        onLogout={handleLogout}
      />
      {ageRestrictionDialogElement}
      {privateProfileDialogElement}
    </>
  );
};

export default Index;
