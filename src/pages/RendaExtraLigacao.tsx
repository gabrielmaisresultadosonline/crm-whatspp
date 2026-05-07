import { useState, useRef, useEffect } from 'react';
import { Check, X, MessageCircle, ExternalLink, Users, Youtube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackLead } from '@/lib/facebookTracking';
import profileImage from '@/assets/mro-profile-call.jpg';
import fundoChamada from '@/assets/fundo-chamada.jpg';
import gabrielPhoneImage from '@/assets/gabriel-phone.png';
import logoMro from '@/assets/logo-mro.png';

type FunnelState =
  | 'landing'
  | 'ringing'
  | 'connected_audio1'
  | 'question1_notebook'
  | 'rejected_notebook'
  | 'connected_audio2'
  | 'question2_clt'
  | 'question2_salary'
  | 'lead_form'
  | 'final_group';

const RendaExtraLigacao = () => {
  const [state, setState] = useState<FunnelState>('landing');
  const [callDuration, setCallDuration] = useState(0);
  const [isCLT, setIsCLT] = useState<boolean | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState({ nome: '', email: '', whatsapp: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    audio1Url: '/call-audio.mp3',
    audio2Url: '/call-audio.mp3',
    audio3Url: '',
    whatsappNumber: '5511999999999',
    whatsappMessage: 'Olá gostaria de saber mais sobre o sistema inovador!',
    profileUsername: '@iavendemais',
    ringtoneUrl: '/ringtone.mp4',
    groupLink: 'https://chat.whatsapp.com/KIDNoL8cBlnFrHlifBqU7X',
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const audio3Ref = useRef<HTMLAudioElement>(null);
  const ringtoneVideoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('rendaextraligacao-storage', {
          body: { action: 'load' }
        });
        if (!error && data?.success && data?.data) {
          const newSettings = { ...settings, ...data.data };
          setSettings(newSettings);
          // Preload audio1 directly into the ref so it's ready instantly
          if (audioRef.current && newSettings.audio1Url) {
            audioRef.current.src = newSettings.audio1Url;
            audioRef.current.load();
          }
          // Preload audio3
          if (audio3Ref.current && newSettings.audio3Url) {
            audio3Ref.current.src = newSettings.audio3Url;
            audio3Ref.current.load();
          }
        }
      } catch (err) {
        console.error('[RendaExtraLigacao] Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const isDesktop = window.innerWidth > 768;
    if (isDesktop) {
      const originalZoom = (document.body.style as any).zoom || '100%';
      (document.body.style as any).zoom = '125%';
      return () => { (document.body.style as any).zoom = originalZoom; };
    }
  }, []);

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
    // Unlock audio elements on user gesture so they play instantly later
    if (audioRef.current) {
      audioRef.current.play().then(() => { audioRef.current!.pause(); audioRef.current!.currentTime = 0; }).catch(() => {});
    }
    if (audio3Ref.current) {
      audio3Ref.current.play().then(() => { audio3Ref.current!.pause(); audio3Ref.current!.currentTime = 0; }).catch(() => {});
    }
    const silentAudio = new Audio();
    silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    silentAudio.play().catch(() => {});
    if (ringtoneVideoRef.current) {
      ringtoneVideoRef.current.loop = true;
      ringtoneVideoRef.current.volume = 1;
      ringtoneVideoRef.current.muted = false;
      ringtoneVideoRef.current.play().catch(() => {});
    }
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
    if (audioRef.current) {
      // Audio is already preloaded with audio1Url src, just play
      if (audioRef.current.src !== settings.audio1Url && !audioRef.current.src.includes(settings.audio1Url)) {
        audioRef.current.src = settings.audio1Url;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleAudioEnded = () => {
    if (state === 'connected_audio1') {
      stopCallTimer();
      setState('question1_notebook');
    } else if (state === 'connected_audio2') {
      stopCallTimer();
      setState('question2_clt');
    }
  };

  const handleNotebookAnswer = (hasNotebook: boolean) => {
    if (hasNotebook) {
      setState('connected_audio2');
      startCallTimer();
      if (audioRef.current) {
        audioRef.current.src = settings.audio2Url;
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 1;
        audioRef.current.play().catch(() => {});
      }
    } else {
      // Track no-notebook rejection
      supabase.functions.invoke('rendaextraligacao-storage', {
        body: { action: 'track_no_notebook' }
      }).catch(() => {});
      setState('rejected_notebook');
    }
  };

  const handleCLTAnswer = (clt: boolean) => {
    setIsCLT(clt);
    if (clt) {
      setState('question2_salary');
    } else {
      setState('lead_form');
    }
  };

  const handleSelectSalary = (salary: string) => {
    setSelectedSalary(salary);
    setState('lead_form');
  };

  const handleSubmitLead = async () => {
    if (!leadForm.nome.trim() || !leadForm.email.trim() || !leadForm.whatsapp.trim()) return;
    setIsSubmitting(true);

    // Play audio3 IMMEDIATELY in user gesture context (before any await)
    if (settings.audio3Url && audio3Ref.current) {
      audio3Ref.current.src = settings.audio3Url;
      audio3Ref.current.currentTime = 0;
      audio3Ref.current.volume = 1;
      audio3Ref.current.play().catch(() => {});
    }

    setState('final_group');

    try {
      await supabase.functions.invoke('rendaextraligacao-storage', {
        body: {
          action: 'register_lead',
          lead: {
            nome: leadForm.nome,
            email: leadForm.email,
            whatsapp: leadForm.whatsapp,
            is_clt: isCLT,
            media_salarial: selectedSalary,
          }
        }
      });
      trackLead('RendaExtraLigacao Lead');
    } catch (err) {
      console.error('Error submitting lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fullscreenStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', margin: 0, padding: 0, overflow: 'hidden',
  };

  const isConnected = state === 'connected_audio1' || state === 'connected_audio2';

  // Money rain effect
  const moneyEmojis = Array.from({ length: 18 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 6;
    const duration = 4 + Math.random() * 4;
    const size = 1.2 + Math.random() * 1.2;
    const rotate = Math.random() * 360;
    return (
      <span
        key={i}
        style={{
          position: 'fixed',
          top: '-60px',
          left: `${left}%`,
          fontSize: `${size}rem`,
          opacity: 0.14,
          pointerEvents: 'none',
          zIndex: 9999,
          animation: `moneyFall ${duration}s linear ${delay}s infinite`,
          transform: `rotate(${rotate}deg)`,
        }}
      >
        💵
      </span>
    );
  });

  return (
    <>
      <style>{`
        @keyframes moneyFall {
          0% { transform: translateY(-60px) rotate(0deg); opacity: 0.14; }
          10% { opacity: 0.14; }
          90% { opacity: 0.14; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes aprendaPulse {
          0%, 100% { transform: scale(1); text-shadow: 0 0 8px rgba(74,222,128,0.6); }
          50% { transform: scale(1.08); text-shadow: 0 0 20px rgba(74,222,128,0.9), 0 0 40px rgba(74,222,128,0.4); }
        }
      `}</style>
      {state === 'landing' && moneyEmojis}
      <video ref={ringtoneVideoRef} src={settings.ringtoneUrl || '/ringtone.mp4'} preload="auto" playsInline style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
      <audio ref={audioRef} onEnded={handleAudioEnded} preload="auto" playsInline />
      <audio ref={audio3Ref} preload="auto" playsInline />

      {/* Landing */}
      {state === 'landing' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 'max(2rem, env(safe-area-inset-top))', backgroundImage: `url(${fundoChamada})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#000' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1rem', textAlign: 'center' }}>
            <img src={logoMro} alt="MRO" style={{ width: '8rem', height: 'auto', marginBottom: '0.75rem' }} />
            <span style={{ color: '#4ade80', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', animation: 'aprendaPulse 2s ease-in-out infinite', display: 'inline-block', marginBottom: '0.25rem' }}>
              🎓 APRENDA GRÁTIS
            </span>
            <h1 style={{ color: '#facc15', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '0.5rem', maxWidth: '320px', textTransform: 'uppercase', textShadow: '0 2px 10px rgba(250, 204, 21, 0.3)' }}>
              Faça 5k mensal de renda extra com a MRO!
            </h1>
            <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.75rem', maxWidth: '300px' }}>
              Uma ferramenta automática que vai te fazer <span style={{ color: '#4ade80' }}>faturar muito</span> no digital.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.75rem', maxWidth: '300px', fontStyle: 'italic' }}>
              Atenda a ligação abaixo para saber mais sobre nossa oportunidade exclusiva.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.4)', borderRadius: '9999px', padding: '0.5rem 1.25rem', marginBottom: '0.75rem' }}>
              <Youtube size={22} color="#ff0000" />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>LIVE SEXTA-FEIRA!</span>
            </div>
            <img src={gabrielPhoneImage} alt="Gabriel" style={{ width: '10rem', height: 'auto', borderRadius: '1rem', marginBottom: '0.5rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>Gabriel</span> está disponível agora!
            </p>
            <button onClick={handleReceiveCall} style={{ backgroundColor: '#4ade80', color: '#000', fontWeight: 'bold', padding: '0.75rem 1.5rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(74, 222, 128, 0.3)' }}>
              Receber chamada agora
              <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Ringing */}
      {state === 'ringing' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}><svg style={{ width: '1.75rem', height: '1.75rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 12,15 18,9" /></svg></button>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}><svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></button>
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

      {/* Connected State */}
      {isConnected && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', background: 'linear-gradient(to bottom, #3d2c2c, #2a1f1f, #1a1212)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}><svg style={{ width: '1.75rem', height: '1.75rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 12,15 18,9" /></svg></button>
            <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}><svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
            <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', overflow: 'hidden', marginBottom: '0.75rem', border: '2px solid rgba(255,255,255,0.2)' }}>
              <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textAlign: 'center', marginBottom: '0.25rem' }}>Chamada ativa em andamento...</p>
            <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>{formatDuration(callDuration)}</p>
          </div>
          <div style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 3rem))', paddingLeft: '1rem', paddingRight: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4V8z"/><line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round"/></svg>
              </button>
              <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
              </button>
              <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff' }} viewBox="0 0 24 24" fill="currentColor"><path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 11.5V13H9v2.5L5.5 12 9 8.5V11h6V8.5l3.5 3.5-3.5 3.5z"/></svg>
              </button>
              <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff' }} viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              </button>
              <button style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff', transform: 'rotate(135deg)' }} viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question 1 - Notebook */}
      {state === 'question1_notebook' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.5rem', border: '2px solid rgba(255,255,255,0.2)' }}>
              <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
              💻 Você tem notebook, computador de mesa ou um MacBook para poder utilizar a ferramenta?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '2rem' }}>Selecione uma opção abaixo</p>
            <div style={{ width: '100%', backgroundColor: '#1a1a2e', borderRadius: '1rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => handleNotebookAnswer(true)} style={{ width: '100%', padding: '1rem', backgroundColor: '#22c55e', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' }}>
                ✅ Sim, tenho!
              </button>
              <button onClick={() => handleNotebookAnswer(false)} style={{ width: '100%', padding: '1rem', backgroundColor: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}>
                ❌ Não tenho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejected - No Notebook */}
      {state === 'rejected_notebook' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>😔</div>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.4 }}>Que pena!</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Para utilizar nossa ferramenta você precisa ter pelo menos um <span style={{ color: '#facc15', fontWeight: 700 }}>notebook básico</span> para utilização.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '2rem' }}>
              Segue nossa página e acompanha, quando tiver um notebook entre em contato conosco! 🙌
            </p>
            <a href={`https://instagram.com/${settings.profileUsername.replace('@', '').replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              📱 Seguir no Instagram
            </a>
          </div>
        </div>
      )}

      {/* Question 2 - CLT */}
      {state === 'question2_clt' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👔</div>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
              Você é CLT?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '2rem' }}>Trabalha com carteira assinada?</p>
            <div style={{ width: '100%', backgroundColor: '#1a1a2e', borderRadius: '1rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => handleCLTAnswer(true)} style={{ width: '100%', padding: '1rem', backgroundColor: '#22c55e', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' }}>
                ✅ Sim, sou CLT
              </button>
              <button onClick={() => handleCLTAnswer(false)} style={{ width: '100%', padding: '1rem', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}>
                Não, trabalho por conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question 2 - Salary */}
      {state === 'question2_salary' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', textAlign: 'center', width: '100%', maxWidth: '420px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💰</div>
            <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
              Qual sua média salarial?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Selecione a faixa mais próxima</p>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Até R$ 1.500', value: 'ate_1500' },
                { label: 'R$ 1.500 a R$ 3.000', value: '1500_3000' },
                { label: 'R$ 3.000 a R$ 5.000', value: '3000_5000' },
                { label: 'Acima de R$ 5.000', value: 'acima_5000' },
              ].map((option) => (
                <button key={option.value} onClick={() => handleSelectSalary(option.value)}
                  style={{ width: '100%', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.1)'; e.currentTarget.style.borderColor = '#4ade80'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                >
                  <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>{option.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lead Form */}
      {state === 'lead_form' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
            <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
              Quase lá! Preencha seus dados para participar da nossa Live exclusiva
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              Após preencher, você receberá o link do grupo e um email com os detalhes.
            </p>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Nome completo"
                value={leadForm.nome}
                onChange={e => setLeadForm(prev => ({ ...prev, nome: e.target.value }))}
                style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.75rem', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                type="email"
                placeholder="Seu melhor email"
                value={leadForm.email}
                onChange={e => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.75rem', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                type="tel"
                placeholder="WhatsApp (com DDD)"
                value={leadForm.whatsapp}
                onChange={e => setLeadForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.75rem', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                onClick={handleSubmitLead}
                disabled={isSubmitting || !leadForm.nome.trim() || !leadForm.email.trim() || !leadForm.whatsapp.trim()}
                style={{
                  width: '100%', padding: '1rem', backgroundColor: (!leadForm.nome.trim() || !leadForm.email.trim() || !leadForm.whatsapp.trim()) ? '#333' : '#22c55e',
                  color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '0.75rem', border: 'none',
                  cursor: (!leadForm.nome.trim() || !leadForm.email.trim() || !leadForm.whatsapp.trim()) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Enviando...' : '🚀 Liberar acesso ao Grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Group */}
      {state === 'final_group' && (
        <div style={{ ...fullscreenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <span style={{ color: '#4ade80', fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', animation: 'aprendaPulse 2s ease-in-out infinite', display: 'inline-block', marginBottom: '0.5rem' }}>
              🎯 PARTICIPE AGORA DO GRUPO!
            </span>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.3 }}>
              Parabéns! Seu acesso foi liberado!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              Enviamos um email para <span style={{ color: '#4ade80', fontWeight: 700 }}>{leadForm.email}</span> com todos os detalhes.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              Clique no botão abaixo para entrar no grupo exclusivo da Live:
            </p>
            {/* Arrow pointing down */}
            <div style={{ fontSize: '2.5rem', animation: 'arrowBounce 1.2s ease-in-out infinite', marginBottom: '0.75rem' }}>⬇️</div>
            <a href={settings.groupLink} target="_blank" rel="noopener noreferrer"
              onClick={() => trackLead('RendaExtraLigacao Group')}
              style={{ padding: '1rem 2rem', backgroundColor: '#25d366', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 30px rgba(37, 211, 102, 0.4)', animation: 'pulse-green 2s infinite' }}>
              <Users style={{ width: '1.5rem', height: '1.5rem' }} />
              Entrar no Grupo da Live
            </a>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '1.5rem' }}>Verifique também sua caixa de email 📧</p>
            <style>{`
              @keyframes pulse-green {
                0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(37, 211, 102, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 15px 40px rgba(37, 211, 102, 0.6); }
              }
              @keyframes arrowBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(12px); }
              }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
};

export default RendaExtraLigacao;
