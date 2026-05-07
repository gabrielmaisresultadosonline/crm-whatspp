import { useState, useRef, useEffect } from 'react';
import { Check, X, MessageCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackLead } from '@/lib/facebookTracking';
import profileImage from '@/assets/mro-profile-call.jpg';
import fundoChamada from '@/assets/fundo-chamada.jpg';
import gabrielPhoneImage from '@/assets/gabriel-phone.png';
import logoMro from '@/assets/logo-mro.png';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';

type FunnelState =
  | 'landing'
  | 'ringing'
  | 'connected_audio1'
  | 'question1'
  | 'confirm_yes'
  | 'rejected'
  | 'connected_audio2'
  | 'pricing'
  | 'final_whatsapp';

const IAVendeMais = () => {
  const { whatsappNumber } = useWhatsAppConfig();
  const [state, setState] = useState<FunnelState>('landing');
  const [callDuration, setCallDuration] = useState(0);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    audio1Url: '/call-audio.mp3',
    audio2Url: '/call-audio.mp3',
    audio3Url: '',
    whatsappNumber: '5511999999999',
    whatsappMessage: 'Olá gostaria de saber mais sobre o sistema inovador!',
    profileUsername: '@iavendemais',
    ringtoneUrl: '/ringtone.mp4',
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const audio3Ref = useRef<HTMLAudioElement>(null);
  const ringtoneVideoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from cloud and preload audio
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('iavendemais-storage', {
          body: { action: 'load' }
        });
        if (!error && data?.success && data?.data) {
          const newSettings = { ...settings, ...data.data };
          setSettings(newSettings);
          // Preload all audio files
          [newSettings.audio1Url, newSettings.audio2Url, newSettings.audio3Url, newSettings.ringtoneUrl].forEach(url => {
            if (url) {
              const a = new Audio();
              a.preload = 'auto';
              a.src = url;
            }
          });
        }
      } catch (err) {
        console.error('[IAVendeMais] Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Force larger zoom on desktop
  useEffect(() => {
    const isDesktop = window.innerWidth > 768;
    if (isDesktop) {
      const originalZoom = (document.body.style as any).zoom || '100%';
      (document.body.style as any).zoom = '125%';
      return () => { (document.body.style as any).zoom = originalZoom; };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);
      if (ringtoneVideoRef.current) { ringtoneVideoRef.current.pause(); ringtoneVideoRef.current.currentTime = 0; }
      if (audioRef.current) { audioRef.current.pause(); }
      navigator.vibrate?.(0);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReceiveCall = () => {
    // Unlock audio on iOS
    const silentAudio = new Audio();
    silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    silentAudio.play().catch(() => {});

    // Play ringtone
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

    setState('ringing');
  };

  const stopRingtone = () => {
    if (ringtoneVideoRef.current) { ringtoneVideoRef.current.pause(); ringtoneVideoRef.current.currentTime = 0; }
    navigator.vibrate?.(0);
    if (vibrationIntervalRef.current) { clearInterval(vibrationIntervalRef.current); vibrationIntervalRef.current = null; }
  };

  const startCallTimer = () => {
    setCallDuration(0);
    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const handleAnswerCall = () => {
    stopRingtone();
    setState('connected_audio1');
    startCallTimer();

    // Play audio 1
    if (audioRef.current) {
      audioRef.current.src = settings.audio1Url;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleAudioEnded = () => {
    if (state === 'connected_audio1') {
      stopCallTimer();
      setState('question1');
    } else if (state === 'connected_audio2') {
      stopCallTimer();
      setState('pricing');
    }
  };

  const handleAnswer = (answer: 'sim' | 'nao') => {
    if (state === 'question1') {
      if (answer === 'sim') setState('confirm_yes');
      else setState('rejected');
    } else if (state === 'confirm_yes') {
      if (answer === 'sim') {
        setState('connected_audio2');
        startCallTimer();
        if (audioRef.current) {
          audioRef.current.src = settings.audio2Url;
          audioRef.current.currentTime = 0;
          audioRef.current.volume = 1;
          audioRef.current.play().catch(() => {});
        }
      } else {
        setState('rejected');
      }
    }
  };

  const handleSelectPrice = (price: string) => {
    setSelectedPrice(price);
    setState('final_whatsapp');
    // Play audio 3 immediately when WhatsApp screen appears
    if (settings.audio3Url && audio3Ref.current) {
      audio3Ref.current.src = settings.audio3Url;
      audio3Ref.current.currentTime = 0;
      audio3Ref.current.volume = 1;
      audio3Ref.current.play().catch(() => {});
    }
  };

  const whatsappUrl = `https://wa.me/${whatsappNumber || settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage)}`;

  const fullscreenStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', margin: 0, padding: 0, overflow: 'hidden',
  };

  const isConnected = state === 'connected_audio1' || state === 'connected_audio2';

  return (
    <>
      {/* Hidden ringtone video */}
      <video
        ref={ringtoneVideoRef}
        src={settings.ringtoneUrl || '/ringtone.mp4'}
        preload="auto"
        playsInline
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        preload="auto"
        playsInline
      />
      <audio
        ref={audio3Ref}
        preload="auto"
        playsInline
      />

      {/* Landing Page - same as /ligacao */}
      {state === 'landing' && (
        <div
          style={{
            ...fullscreenStyle,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            backgroundImage: `url(${fundoChamada})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#000',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1rem', textAlign: 'center' }}>
            <img src={logoMro} alt="MRO" style={{ width: '8rem', height: 'auto', marginBottom: '0.75rem' }} />

            <h1 style={{ color: '#facc15', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '0.5rem', maxWidth: '320px', textTransform: 'uppercase', textShadow: '0 2px 10px rgba(250, 204, 21, 0.3)' }}>
              Ferramenta com IA para Instagram
            </h1>
            <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.75rem', maxWidth: '300px' }}>
              Mais Vendas, Mais Clientes, Mais Seguidores, Mais Público Real em até <span style={{ color: '#4ade80' }}>24h</span>.
            </p>

            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.75rem', maxWidth: '300px', fontStyle: 'italic' }}>
              Uma ferramenta automática que vai trazer resultados incríveis para você, faça uma ligação agora com Gabriel. Vamos explicar melhor tudo e ver qual seria a melhor opção para você.
            </p>

            <img src={gabrielPhoneImage} alt="Gabriel" style={{ width: '10rem', height: 'auto', borderRadius: '1rem', marginBottom: '0.5rem' }} />

            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>Gabriel</span> está disponível agora!
            </p>
            <button
              onClick={handleReceiveCall}
              style={{
                backgroundColor: '#4ade80', color: '#000', fontWeight: 'bold', padding: '0.75rem 1.5rem',
                borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem',
                border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(74, 222, 128, 0.3)',
              }}
            >
              Receber chamada agora
              <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Ringing State - same as /ligacao */}
      {state === 'ringing' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}>
              <svg style={{ width: '1.75rem', height: '1.75rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 12,15 18,9" /></svg>
            </button>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
            <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', overflow: 'hidden', marginBottom: '0.75rem', border: '2px solid rgba(255,255,255,0.2)' }}>
              <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span>Áudio de Instagram...</span>
            </div>
            <h1 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>Atender Gabriel MRO</h1>
          </div>
          <div style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 3rem))', paddingLeft: '2rem', paddingRight: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '280px', margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed', border: 'none' }} disabled>
                  <X style={{ width: '1.75rem', height: '1.75rem', color: '#fff' }} />
                </button>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Recusar</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button onClick={handleAnswerCall} style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3)' }}>
                  <Check style={{ width: '1.75rem', height: '1.75rem', color: '#fff' }} />
                </button>
                <span style={{ color: '#fff', fontSize: '0.75rem', marginTop: '0.5rem' }}>Aceitar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected State (Audio 1 or Audio 2) - same as /ligacao */}
      {isConnected && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', background: 'linear-gradient(to bottom, #3d2c2c, #2a1f1f, #1a1212)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}>
              <svg style={{ width: '1.75rem', height: '1.75rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 12,15 18,9" /></svg>
            </button>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
            <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', overflow: 'hidden', marginBottom: '0.75rem', border: '2px solid rgba(255,255,255,0.2)' }}>
              <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textAlign: 'center', marginBottom: '0.25rem' }}>
              Chamada ativa em andamento...
            </p>
            <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>{formatDuration(callDuration)}</p>
          </div>
          <div style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 3rem))', paddingLeft: '1rem', paddingRight: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4V8z"/><line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round"/>
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

      {/* Question 1 */}
      {state === 'question1' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.5rem', border: '2px solid rgba(255,255,255,0.2)' }}>
              <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
              Você tem empresa? Vende algum produto? Ou presta algum serviço?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '2rem' }}>Selecione uma opção abaixo</p>
            <div style={{ width: '100%', backgroundColor: '#1a1a2e', borderRadius: '1rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => handleAnswer('sim')} style={{ width: '100%', padding: '1rem', backgroundColor: '#22c55e', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' }}>
                ✅ Sim
              </button>
              <button onClick={() => handleAnswer('nao')} style={{ width: '100%', padding: '1rem', backgroundColor: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}>
                ❌ Não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Yes */}
      {state === 'confirm_yes' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤔</div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
              Confirma: você presta algum serviço, vende algum produto ou tem empresa?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '2rem' }}>Precisamos confirmar para continuar</p>
            <div style={{ width: '100%', backgroundColor: '#1a1a2e', borderRadius: '1rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => handleAnswer('sim')} style={{ width: '100%', padding: '1rem', backgroundColor: '#22c55e', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' }}>
                ✅ Sim, confirmo!
              </button>
              <button onClick={() => handleAnswer('nao')} style={{ width: '100%', padding: '1rem', backgroundColor: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}>
                ❌ Não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejected */}
      {state === 'rejected' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>😔</div>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.4 }}>Poxa, que pena!</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Se não presta nenhum serviço, não tem empresa e não tem um produto, infelizmente não vamos poder te atender no momento.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '2rem' }}>
              Mas pode seguir nossa página e acompanhar nosso conteúdo. Futuramente estaremos aqui para te ajudar! 🙌
            </p>
            <a href={`https://instagram.com/${settings.profileUsername.replace('@', '').replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              📱 Seguir no Instagram
            </a>
          </div>
        </div>
      )}

      {/* Pricing */}
      {state === 'pricing' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', textAlign: 'center', width: '100%', maxWidth: '420px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💰</div>
            <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
              Para você vender mais, ter mais clientes, mais engajamento, mais público real e trazendo retorno...
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              Quanto você acha que vale ter uma ferramenta que vai fazer tudo isso no automático?
            </p>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'R$ 1.000 anual', sub: '(R$83/mês)', value: '1000' },
                { label: 'R$ 12.000 anual', sub: '(R$1.000/mês)', value: '12000' },
                { label: 'R$ 5.000 anual', sub: '(R$416/mês)', value: '5000' },
              ].map((option) => (
                <button key={option.value} onClick={() => handleSelectPrice(option.value)}
                  style={{ width: '100%', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.1)'; e.currentTarget.style.borderColor = '#4ade80'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{option.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0 }}>{option.sub}</p>
                  </div>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'transparent' }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final WhatsApp */}
      {state === 'final_whatsapp' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.3 }}>
              Temos uma opção muito melhor para você!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '2rem' }}>
              Se você precisa de <span style={{ color: '#4ade80', fontWeight: 700 }}>resultados reais</span> investindo muito pouco, clique no WhatsApp abaixo.
            </p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => trackLead('IAVendeMais WhatsApp')}
              style={{ padding: '1rem 2rem', backgroundColor: '#25d366', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 30px rgba(37, 211, 102, 0.4)', animation: 'pulse-green 2s infinite' }}>
              <MessageCircle style={{ width: '1.5rem', height: '1.5rem' }} />
              Falar no WhatsApp
            </a>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '1.5rem' }}>{settings.profileUsername}</p>
            <style>{`
              @keyframes pulse-green {
                0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(37, 211, 102, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 15px 40px rgba(37, 211, 102, 0.6); }
              }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
};

export default IAVendeMais;
