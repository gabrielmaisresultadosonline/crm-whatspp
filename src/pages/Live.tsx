import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Radio, ExternalLink, MessageCircle, MessageSquareOff, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import Hls from "hls.js";

const Live = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fakeViewers, setFakeViewers] = useState(0);
  const [watchPercentage, setWatchPercentage] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [hlsReady, setHlsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const visitorIdRef = useRef(
    localStorage.getItem("live_visitor_id") || `v_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    localStorage.setItem("live_visitor_id", visitorIdRef.current);
  }, []);

  useEffect(() => {
    fetchLive();
  }, []);

  const fetchLive = async () => {
    try {
      const { data } = await supabase.functions.invoke("live-admin", {
        body: { action: "getActiveLive" },
      });
      setSession(data?.session || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Setup HLS or direct video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !session || session.status !== "active") return;

    const videoUrl = session.video_url;
    if (!videoUrl) return;

    const VIDEO_SERVER = "https://video.maisresultadosonline.com.br";
    const hlsUrl = session.hls_url || null;
    const isRelativeUrl = videoUrl.startsWith("/videos/") || videoUrl.startsWith("/hls/");
    const fullVideoUrl = isRelativeUrl ? `${VIDEO_SERVER}${videoUrl}` : videoUrl;
    const fullHlsUrl = hlsUrl ? (hlsUrl.startsWith("/") ? `${VIDEO_SERVER}${hlsUrl}` : hlsUrl) : null;

    if (fullHlsUrl && Hls.isSupported()) {
      const tryHls = async () => {
        try {
          const response = await fetch(fullHlsUrl, { method: "HEAD" });
          if (response.ok) {
            const hls = new Hls({
              startLevel: 0, // Inicia na menor qualidade para conexões lentas
              capLevelToPlayerSize: true,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              enableWorker: true, // Usa Web Worker para não travar a UI
              lowLatencyMode: true,
              backBufferLength: 90,
            });
            hls.loadSource(fullHlsUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setHlsReady(true);
              video.muted = false;
              video.volume = 1;
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.catch((error) => {
                  console.log("Autoplay with sound prevented, trying muted:", error);
                  video.muted = true;
                  video.play().catch(e => console.error("Playback failed:", e));
                });
              }
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) {
                hls.destroy();
                loadDirectVideo(video, fullVideoUrl);
              }
            });
            hlsRef.current = hls;
            return;
          }
        } catch {}
        loadDirectVideo(video, fullVideoUrl);
      };
      tryHls();
    } else if (video.canPlayType("application/vnd.apple.mpegurl") && fullHlsUrl) {
      video.src = fullHlsUrl;
      video.play().catch(() => {});
    } else {
      loadDirectVideo(video, fullVideoUrl);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [session]);

  const loadDirectVideo = (video: HTMLVideoElement, url: string) => {
    video.src = url;
    video.preload = "metadata"; // Carrega apenas o necessário inicialmente
    video.muted = false;
    video.volume = 1;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Direct play with sound prevented, trying muted:", error);
        video.muted = true;
        video.play().catch(e => console.error("Playback failed:", e));
      });
    }
  };

  // Realistic fake viewers - starts low, gradually climbs with organic fluctuations
  useEffect(() => {
    if (!session || session.status !== "active") return;
    const max = session.fake_viewers_max || 200;

    // Start very low (2-5)
    let elapsedSeconds = 0;
    setFakeViewers(3);

    const interval = setInterval(() => {
      elapsedSeconds += 2;

      setFakeViewers((prev) => {
        const minutesElapsed = elapsedSeconds / 60;
        let targetForPhase: number;

        if (minutesElapsed < 1) {
          // 0-1 min: very few (3-8)
          targetForPhase = 3 + Math.floor(minutesElapsed * 5);
        } else if (minutesElapsed < 3) {
          // 1-3 min: slow climb (8-30)
          targetForPhase = 8 + Math.floor((minutesElapsed - 1) * 11);
        } else if (minutesElapsed < 6) {
          // 3-6 min: moderate (30-100)
          targetForPhase = 30 + Math.floor((minutesElapsed - 3) * 23);
        } else if (minutesElapsed < 10) {
          // 6-10 min: approaching max (100-max)
          const progress = (minutesElapsed - 6) / 4;
          targetForPhase = 100 + Math.floor(progress * (max - 100));
        } else {
          // 10+ min: fluctuate around max
          targetForPhase = max;
        }

        targetForPhase = Math.min(targetForPhase, max);

        // Organic randomness
        const r = Math.random();
        let delta: number;

        if (r < 0.1) {
          // Pequena queda ocasional (máximo 1 ou 2 como solicitado)
          delta = -(1 + Math.floor(Math.random() * 2));
        } else if (r < 0.3) {
          // Manter estável (delta 0)
          delta = 0;
        } else if (r < 0.7) {
          // Tendência de subida gradual para o alvo
          const diff = targetForPhase - prev;
          delta = Math.max(0, Math.floor(diff * (0.1 + Math.random() * 0.2)));
          if (delta === 0 && prev < targetForPhase) delta = 1;
        } else {
          // Subida mais rápida
          delta = 1 + Math.floor(Math.random() * 4);
        }

        const next = prev + delta;
        return Math.max(1, Math.min(max + 15, next));
      });
    }, 2000 + Math.floor(Math.random() * 2000));

    return () => clearInterval(interval);
  }, [session]);

  // Track analytics
  const sendAnalytics = useCallback(
    async (percentage: number) => {
      if (!session) return;
      try {
        await supabase.functions.invoke("live-admin", {
          body: {
            action: "trackAnalytics",
            session_id: session.id,
            visitor_id: visitorIdRef.current,
            watch_percentage: Math.round(percentage),
            device_type: /Mobi/.test(navigator.userAgent) ? "mobile" : "desktop",
            user_agent: navigator.userAgent.slice(0, 200),
          },
        });
      } catch (e) {
        console.error(e);
      }
    },
    [session]
  );

  // Video progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !session) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        const pct = (video.currentTime / video.duration) * 100;
        setWatchPercentage(pct);
      }
    };

    const handleEnded = () => {
      setVideoEnded(true);
      setWatchPercentage(100);
      sendAnalytics(100);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    const analyticsInterval = setInterval(() => {
      if (video.duration) {
        const pct = (video.currentTime / video.duration) * 100;
        sendAnalytics(pct);
      }
    }, 10000);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      clearInterval(analyticsInterval);
    };
  }, [session, sendAnalytics]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (videoEnded) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const changeVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = Math.max(0, Math.min(1, video.volume + delta));
    video.volume = newVol;
    setVolume(newVol);
  };

  const toggleFullscreen = () => {
    const container = videoContainerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const handleVideoContainerMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!session || session.status === "paused") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-full p-4 sm:p-6 mb-4 sm:mb-6">
          <Radio className="w-10 h-10 sm:w-16 sm:h-16 text-red-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
          🔴 LIVE ENCERRADA
        </h1>
        <p className="text-gray-400 text-sm sm:text-lg mb-6 sm:mb-8 max-w-md">
          Aguarde no grupo do WhatsApp para ser notificado sobre a próxima live!
        </p>
        {session?.whatsapp_group_link && (
          <a href={session.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
            <Button className="bg-green-600 hover:bg-green-700 text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl gap-2 sm:gap-3">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              Entrar no Grupo do WhatsApp
            </Button>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <div className="bg-red-600 py-2 sm:py-3 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-ping" />
          </div>
          <span className="text-white font-bold text-xs sm:text-sm md:text-base">AO VIVO</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          <span className="text-white font-semibold text-xs sm:text-sm">
            {fakeViewers.toLocaleString()} assistindo
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Video Section */}
          <div className="flex-1 min-w-0">
            <div className="mb-2 sm:mb-3 px-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                {session.title || "Fazendo 5k com a MRO"}
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                {session.description || "Veja abaixo, estamos ao vivo 🔴"}
              </p>
            </div>

            <div
              ref={videoContainerRef}
              className="relative rounded-lg sm:rounded-2xl overflow-hidden bg-black border border-white/10 group shadow-lg"
              onMouseMove={handleVideoContainerMove}
              onTouchStart={handleVideoContainerMove}
              style={{ cursor: showControls ? "default" : "none" }}
            >
              {session.video_url ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full aspect-video bg-black"
                  style={{ objectFit: "contain" }}
                  onClick={togglePlay}
                />
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Aguardando vídeo...</p>
                </div>
              )}

              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded flex items-center gap-1 sm:gap-1.5 pointer-events-none">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>

              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/80 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full flex items-center gap-1 pointer-events-none">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="font-medium">{fakeViewers.toLocaleString()}</span>
              </div>

              {/* Custom controls */}
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
              >
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="text-white hover:text-red-400 transition-colors">
                    {isPlaying ? <Pause className="w-6 h-6 sm:w-7 sm:h-7" /> : <Play className="w-6 h-6 sm:w-7 sm:h-7" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button onClick={() => changeVolume(-0.1)} className="text-white hover:text-red-400 transition-colors">
                    <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <div className="w-12 sm:w-16 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${volume * 100}%` }} />
                  </div>
                  <button onClick={() => changeVolume(0.1)} className="text-white hover:text-red-400 transition-colors">
                    <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button onClick={toggleFullscreen} className="text-white hover:text-red-400 transition-colors ml-1 sm:ml-2">
                    <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              {hlsReady && showControls && (
                <div className="absolute bottom-12 sm:bottom-14 right-2 sm:right-4 bg-black/60 text-white text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded pointer-events-none">
                  HD
                </div>
              )}
            </div>
          </div>

          {/* Chat Disabled Panel */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded-lg sm:rounded-2xl h-48 sm:h-64 lg:h-full lg:min-h-[400px] flex flex-col shadow-lg">
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <MessageSquareOff className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400 font-medium text-xs sm:text-sm">Chat ao vivo</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[10px] sm:text-xs">{fakeViewers.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center">
                <div className="bg-gray-800/50 rounded-full p-3 sm:p-4 mb-3 sm:mb-4">
                  <MessageSquareOff className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">
                  Chat desativado
                </p>
                <p className="text-gray-500 text-[10px] sm:text-xs leading-relaxed max-w-[220px]">
                  Pode tirar suas dúvidas no final da live. Assista até o final para liberar o acesso exclusivo! 🔒
                </p>
              </div>

              <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-800">
                <div className="flex items-center justify-center gap-1.5 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] sm:text-xs">Transmissão ao vivo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA after video ends */}
      {videoEnded && (
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-8 sm:pb-12 animate-fade-in">
          {session.cta_button_link && (
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
                {session.cta_button_text || "Acesse o GRUPO para liberar o desconto"}
              </h2>
              <p className="text-green-300 text-sm sm:text-base mb-4 sm:mb-6">e você faturar 5k! 🚀</p>
              <a href={session.cta_button_link} target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-600 hover:bg-green-700 text-white text-base sm:text-lg px-6 sm:px-10 py-4 sm:py-6 rounded-xl gap-2 sm:gap-3 animate-pulse">
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                  {session.cta_button_text || "Acessar Grupo"}
                </Button>
              </a>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">
              {session.cta_title || "Fature mais de 5k prestando serviço para as empresas"}
            </h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
              {session.cta_description ||
                "Rode a ferramenta na sua maquina/notebook/pc e cobre mensalmente das empresas por isso. Receba todo o passo a passo de como fechar contratos, de como apresentar esse serviço e como faturar de verdade."}
            </p>
            {session.whatsapp_group_link && (
              <a href={session.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 text-sm sm:text-base">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Entrar no Grupo
                </Button>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Live;
