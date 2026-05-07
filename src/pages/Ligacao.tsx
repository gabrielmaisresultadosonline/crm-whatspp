import { useState, useRef, useEffect } from 'react';
import { Check, X, Phone, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAdminData } from '@/lib/adminConfig';
import { supabase } from '@/integrations/supabase/client';
import { trackFacebookEvent, trackPageView, trackViewContent, trackInitiateCheckout, trackLead } from '@/lib/facebookTracking';
import profileImage from '@/assets/mro-profile-call.jpg';
import fundoChamada from '@/assets/fundo-chamada.jpg';
import gabrielImage from '@/assets/gabriel-transparente.png';

// Detect device type
const getDeviceType = () => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod|Android/i.test(ua) ? 'mobile' : 'desktop';
};

// Save event to Supabase cloud analytics
const saveToCloudAnalytics = async (eventType: string) => {
  try {
    await supabase.from('call_analytics').insert({
      event_type: eventType,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
      device_type: getDeviceType(),
      source_url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });
    console.log('[CLOUD-ANALYTICS] Event saved:', eventType);
  } catch (err) {
    console.error('[CLOUD-ANALYTICS] Error saving event:', err);
  }
};

// Send event to Meta Conversions API via Edge Function AND save to cloud
const sendConversionEvent = async (eventName: string, customData?: Record<string, any>) => {
  // Save to cloud analytics
  saveToCloudAnalytics(eventName);
  
  // Use unified Facebook tracking
  if (eventName === 'PageView') {
    trackPageView(customData?.content_name);
  } else {
    trackFacebookEvent(eventName, {
      ...customData,
      currency: 'BRL'
    });
  }
};

const Ligacao = () => {
  const [callState, setCallState] = useState<'landing' | 'ringing' | 'connected' | 'ended'>('landing');
  const [callDuration, setCallDuration] = useState(0);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ringtoneVideoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get admin settings for audio and pixel configuration
  const adminSettings = getAdminData().settings;
  const [callPageSettings, setCallPageSettings] = useState(adminSettings.callPageSettings || {
    audioUrl: '/call-audio.mp3',
    ringtoneUrl: '/ringtone.mp4'
  });
  const [callContent, setCallContent] = useState({
    landingTitle: 'Gabriel esta agora disponível para uma chamada, atenda para entender como não Gastar mais com anúncios!',
    landingButtonText: 'Receber chamada agora',
    endedTitle: '🔥 Aproveite agora mesmo!',
    endedMessage: 'Planos a partir de',
    endedPrice: 'R$33 mensal',
    ctaButtonText: 'Acessar o site agora',
    ctaButtonLink: 'https://maisresultadosonline.com.br/mrointeligente',
    profileUsername: '@maisresultadosonline'
  });
  const pixelSettings = adminSettings.pixelSettings;

  // Load call settings from cloud on mount
  useEffect(() => {
    const loadFromCloud = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('modules-storage', {
          body: { action: 'load-call-settings' }
        });
        
        if (!error && data?.success && data?.data) {
          console.log('[Ligacao] Loaded settings from cloud:', data.data);
          if (data.data.callSettings) setCallPageSettings(data.data.callSettings);
          if (data.data.callContent) setCallContent(data.data.callContent);
        }
      } catch (err) {
        console.error('[Ligacao] Error loading from cloud:', err);
      } finally {
        setIsLoadingContent(false);
      }
    };
    loadFromCloud();
  }, []);

  // Track page view on mount - synced with Meta Pixel
  useEffect(() => {
    sendConversionEvent('PageView', { content_name: 'ligacao_page' });
    console.log('[Ligacao] Page loaded - PageView event sent');
  }, []);

  // Force larger zoom on desktop to fill screen better
  useEffect(() => {
    const isDesktop = window.innerWidth > 768;
    if (isDesktop) {
      // Store original zoom
      const originalZoom = (document.body.style as any).zoom || '100%';
      // Force 125% zoom to make content bigger on desktop
      (document.body.style as any).zoom = '125%';
      
      return () => {
        // Restore original zoom on unmount
        (document.body.style as any).zoom = originalZoom;
      };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);
      if (ringtoneVideoRef.current) {
        ringtoneVideoRef.current.pause();
        ringtoneVideoRef.current.currentTime = 0;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      navigator.vibrate?.(0);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // User clicks "Receber chamada" - this is the first user interaction
  // Use it to unlock audio context on iOS
  const handleReceiveCall = () => {
    // Fire Facebook Pixel ViewContent event (client-side) - user engaged with call
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: 'receber_chamada_clicked',
        content_category: 'call_funnel'
      });
      console.log('[Ligacao] FB Pixel ViewContent event fired (client-side)');
    }

    // Send ViewContent event via Conversions API (server-side)
    sendConversionEvent('ViewContent', {
      content_name: 'receber_chamada_clicked',
      content_category: 'call_funnel'
    });

    // Create and play a silent audio to unlock audio context on iOS
    const silentAudio = new Audio();
    silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    silentAudio.play().catch(() => {});
    
    // Play ringtone video (audio only, video invisible) with user gesture
    if (ringtoneVideoRef.current) {
      ringtoneVideoRef.current.loop = true;
      ringtoneVideoRef.current.volume = 1;
      ringtoneVideoRef.current.muted = false;
      ringtoneVideoRef.current.play().catch(() => {});
    }
    
    // Start vibration
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 300, 500, 300, 500]);
      vibrationIntervalRef.current = setInterval(() => {
        navigator.vibrate([500, 300, 500, 300, 500]);
      }, 2500);
    }
    
    // Ringtone started (no separate cloud event, ViewContent already tracked)
    
    setCallState('ringing');
  };

  // User clicks "Accept" - use this interaction to authorize call audio
  const handleAnswer = () => {
    // Fire Facebook Pixel InitiateCheckout event (client-side) - user accepted call
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: 'call_answered',
        content_category: 'call_funnel'
      });
      console.log('[Ligacao] FB Pixel InitiateCheckout event fired (client-side)');
    }

    // Send InitiateCheckout event via Conversions API (server-side)
    sendConversionEvent('InitiateCheckout', {
      content_name: 'call_answered',
      content_category: 'call_funnel'
    });

    // Stop ringtone video
    if (ringtoneVideoRef.current) {
      ringtoneVideoRef.current.pause();
      ringtoneVideoRef.current.currentTime = 0;
    }

    // Stop vibration
    navigator.vibrate?.(0);
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }

    // Change state
    setCallState('connected');

    // Start call duration timer
    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Call answered (InitiateCheckout already tracked above)

    // Play call audio IMMEDIATELY with this user gesture (critical for iOS)
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1;
      // This play() is triggered by user tap, so it should work on iOS
      audioRef.current.play().catch(() => {});
    }
  };

  const handleAudioEnded = () => {
    setCallState('ended');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Track audio completed - user listened to everything
    sendConversionEvent('ViewContent', {
      content_name: 'audio_completed',
      content_category: 'call_funnel'
    });
  };

  const handleAccessSite = (e?: React.MouseEvent) => {
    // Lead event is sent below (already tracked via sendConversionEvent)
    
    // Fire Facebook Pixel Lead event (client-side) - user completed funnel
    if (window.fbq) {
      window.fbq('track', 'Lead', { 
        content_name: 'ligacao_cta_clicked',
        content_category: 'call_funnel'
      });
      console.log('[Ligacao] FB Pixel Lead event fired (client-side)');
    }
    
    // Send Lead event via Conversions API (server-side)
    sendConversionEvent('Lead', {
      content_name: 'ligacao_cta_clicked',
      content_category: 'call_funnel'
    });
    
    // Allow default link behavior (href will handle navigation)
  };

  // Common fullscreen container style
  const fullscreenStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
  };

  // Fallback to default URLs if cloud settings are empty
  const ringtoneUrl = callPageSettings.ringtoneUrl || '/ringtone.mp4';
  const audioUrl = callPageSettings.audioUrl || '/call-audio.mp3';

  return (
    <>
      {/* Hidden video for ringtone - plays audio only */}
      <video 
        ref={ringtoneVideoRef} 
        src="/ringtone.mp4"
        preload="auto"
        playsInline
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
      <audio 
        ref={audioRef} 
        src={audioUrl}
        onEnded={handleAudioEnded}
        preload="auto"
        playsInline
      />

      {/* Landing Page */}
      {callState === 'landing' && (
        <div 
          style={{
            ...fullscreenStyle,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            backgroundImage: `url(${fundoChamada})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#000',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1rem', textAlign: 'center' }}>
            <img 
              src={gabrielImage} 
              alt="Gabriel"
              style={{ width: '12rem', height: 'auto', marginBottom: '-2.5rem' }}
            />

            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.75rem', maxWidth: '300px', fontStyle: 'italic' }}>
              Uma ferramenta automática que vai trazer resultados incríveis para você, faça uma ligação agora com Gabriel. Vamos explicar melhor tudo e ver qual seria a melhor opção para você.
            </p>

            <h1 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 'bold', fontStyle: 'italic', lineHeight: 1.3, marginBottom: '1rem', maxWidth: '280px' }}>
              <span style={{ color: '#facc15' }}>Gabriel</span> {callContent.landingTitle.replace(/^Gabriel\s*/i, '').replace('Gabriel', '')}
            </h1>

            <button
              id="btn-receber-chamada"
              data-fb-event="Lead"
              onClick={handleReceiveCall}
              style={{
                backgroundColor: '#4ade80',
                color: '#000',
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(74, 222, 128, 0.3)',
              }}
            >
              {callContent.landingButtonText}
              <Phone style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>
        </div>
      )}

      {/* Ringing State */}
      {callState === 'ringing' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}>
              <svg style={{ width: '1.75rem', height: '1.75rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
            <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', overflow: 'hidden', marginBottom: '0.75rem', border: '2px solid rgba(255,255,255,0.2)' }}>
              <img src={profileImage} alt="Mais Resultados Online" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span>Áudio de Instagram...</span>
            </div>

            <h1 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>
              @maisresultadosonline
            </h1>
          </div>

          <div style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 3rem))', paddingLeft: '2rem', paddingRight: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '280px', margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button 
                  style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed', border: 'none' }}
                  disabled
                >
                  <X style={{ width: '1.75rem', height: '1.75rem', color: '#fff' }} />
                </button>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Recusar</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  onClick={handleAnswer}
                  style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3)' }}
                >
                  <Check style={{ width: '1.75rem', height: '1.75rem', color: '#fff' }} />
                </button>
                <span style={{ color: '#fff', fontSize: '0.75rem', marginTop: '0.5rem' }}>Aceitar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected State */}
      {callState === 'connected' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', background: 'linear-gradient(to bottom, #3d2c2c, #2a1f1f, #1a1212)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}>
              <svg style={{ width: '1.75rem', height: '1.75rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
            <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', overflow: 'hidden', marginBottom: '0.75rem', border: '2px solid rgba(255,255,255,0.2)' }}>
              <img src={profileImage} alt="Mais Resultados Online" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textAlign: 'center', marginBottom: '0.25rem' }}>
              Chamada ativa em andamento...
            </p>
            <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
              {formatDuration(callDuration)}
            </p>
          </div>

          <div style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 3rem))', paddingLeft: '1rem', paddingRight: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="14" height="12" rx="2"/>
                  <path d="M22 8l-6 4 6 4V8z"/>
                  <line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round"/>
                </svg>
              </button>

              <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                </svg>
              </button>

              <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 11.5V13H9v2.5L5.5 12 9 8.5V11h6V8.5l3.5 3.5-3.5 3.5z"/>
                </svg>
              </button>

              <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff', transform: 'rotate(135deg)' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ended State */}
      {callState === 'ended' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 'max(3rem, env(safe-area-inset-top))', paddingLeft: '1.5rem', paddingRight: '1.5rem', backgroundColor: '#000' }}>
          <div style={{ width: '6rem', height: '6rem', borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem', border: '2px solid #eab308' }}>
            <img src={profileImage} alt="Mais Resultados Online" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, textAlign: 'center', marginBottom: '0.5rem' }}>
            Ligação encerrada!
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Duração: {formatDuration(callDuration)}
          </p>

          <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', width: '100%', maxWidth: '320px' }}>
            <p style={{ color: '#fde047', fontSize: '1rem', fontWeight: 600, textAlign: 'center', marginBottom: '0.5rem' }}>
              {callContent.endedTitle}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', textAlign: 'center' }}>
              {callContent.endedMessage} <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{callContent.endedPrice}</span>
            </p>
          </div>

          <a
            id="btn-acessar-site"
            data-fb-event="ViewContent"
            href={callContent.ctaButtonLink}
            onClick={handleAccessSite}
            style={{
              backgroundColor: '#eab308',
              color: '#000',
              fontWeight: 'bold',
              padding: '1rem 2rem',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(234, 179, 8, 0.3)',
              textDecoration: 'none',
            }}
          >
            {callContent.ctaButtonText}
            <ExternalLink style={{ width: '1.25rem', height: '1.25rem' }} />
          </a>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
            {callContent.profileUsername}
          </p>
        </div>
      )}
    </>
  );
};

export default Ligacao;
