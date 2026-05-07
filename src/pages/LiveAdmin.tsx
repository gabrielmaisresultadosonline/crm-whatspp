import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Radio, Play, Pause, StopCircle, Plus, BarChart3, Settings, Upload, Eye, Users, Percent, LogOut, Loader2, CheckCircle, AlertCircle, Trash2
} from "lucide-react";

const LiveAdmin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<"lives" | "settings">("lives");
  const [sessions, setSessions] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [realtimeViewers, setRealtimeViewers] = useState<Record<string, { active: number; mobile: number; desktop: number }>>({});
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [transcodingStatus, setTranscodingStatus] = useState<string | null>(null);
  const [transcodingProgress, setTranscodingProgress] = useState(0);

  // New live form
  const [newLive, setNewLive] = useState({
    title: "Fazendo 5k com a MRO",
    video_url: "",
    hls_url: "",
    fake_viewers_min: 14,
    fake_viewers_max: 200,
    whatsapp_group_link: "",
    cta_title: "Fature mais de 5k prestando serviço para as empresas",
    cta_description: "Rode a ferramenta na sua maquina/notebook/pc e cobre mensalmente das empresas por isso. Receba todo o passo a passo de como fechar contratos, de como apresentar esse serviço e como faturar de verdade.",
    cta_button_text: "Acesse o GRUPO para liberar o desconto",
    cta_button_link: "",
  });

  // Settings
  const [defaultWhatsApp, setDefaultWhatsApp] = useState("");
  const [vpsUrl, setVpsUrl] = useState(() => localStorage.getItem("live_vps_url") || "https://video.maisresultadosonline.com.br");

  // Previously uploaded videos
  const [serverVideos, setServerVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [showVideoList, setShowVideoList] = useState(false);

  const getVideoServerUrl = () => {
    // Use configured VPS URL, fallback to same origin
    const stored = vpsUrl || localStorage.getItem("live_vps_url");
    if (stored) return stored.replace(/\/$/, '');
    return window.location.origin;
  };

  const login = async () => {
    setLoggingIn(true);
    try {
      const { data } = await supabase.functions.invoke("live-admin", {
        body: { action: "login", email, password },
      });
      if (data?.success) {
        setAuthenticated(true);
        sessionStorage.setItem("live_admin_auth", "true");
        loadSessions();
        loadSettings();
      } else {
        toast.error("Credenciais inválidas");
      }
    } catch {
      toast.error("Erro ao fazer login");
    } finally {
      setLoggingIn(false);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("live_admin_auth") === "true") {
      setAuthenticated(true);
      loadSessions();
      loadSettings();
    }
  }, []);

  // Poll real-time viewers for active sessions every 5 seconds
  useEffect(() => {
    if (!authenticated) return;
    const activeSessions = sessions.filter(s => s.status === "active");
    if (activeSessions.length === 0) return;

    const pollViewers = async () => {
      for (const s of activeSessions) {
        try {
          const { data } = await supabase.functions.invoke("live-admin", {
            body: { action: "getRealtimeViewers", session_id: s.id },
          });
          if (data?.realtime) {
            setRealtimeViewers(prev => ({ ...prev, [s.id]: data.realtime }));
          }
        } catch {}
      }
    };

    pollViewers();
    const interval = setInterval(pollViewers, 5000);
    return () => clearInterval(interval);
  }, [authenticated, sessions]);

  const loadSessions = async () => {
    const { data } = await supabase.functions.invoke("live-admin", {
      body: { action: "getAllSessions" },
    });
    setSessions(data?.sessions || []);
  };

  const loadSettings = async () => {
    const { data } = await supabase.functions.invoke("live-admin", {
      body: { action: "getSettings" },
    });
    setDefaultWhatsApp(data?.settings?.default_whatsapp_group || "");
  };

  const loadServerVideos = async () => {
    setLoadingVideos(true);
    try {
      const baseUrl = getVideoServerUrl();
      const res = await fetch(`${baseUrl}/api/video/list`);
      const data = await res.json();
      if (data?.success) {
        setServerVideos(data.files || []);
      }
    } catch {
      // Server might not be accessible
      setServerVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  };

  const selectExistingVideo = (video: any) => {
    const baseName = video.name.replace(/\.[^.]+$/, '');
    const hlsUrl = `/videos/hls/${baseName}/master.m3u8`;
    setNewLive((prev) => ({ ...prev, video_url: video.url, hls_url: hlsUrl }));
    setShowVideoList(false);
    toast.success("Vídeo selecionado!");
  };

  const deleteServerVideo = async (videoName: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${videoName}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const baseUrl = getVideoServerUrl();
      const res = await fetch(`${baseUrl}/api/video/${encodeURIComponent(videoName)}`, { method: "DELETE" });
      const data = await res.json();
      if (data?.success) {
        toast.success("Vídeo excluído com sucesso!");
        setServerVideos((prev) => prev.filter((v) => v.name !== videoName));
      } else {
        toast.error("Erro ao excluir vídeo");
      }
    } catch {
      toast.error("Erro ao conectar com o servidor de vídeo");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const createLive = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("live-admin", {
        body: { action: "createLive", ...newLive },
      });
      if (data?.success) {
        toast.success("Live criada com sucesso!");
        setCreating(false);
        loadSessions();
      }
    } catch {
      toast.error("Erro ao criar live");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, action: "pauseLive" | "resumeLive" | "endLive") => {
    await supabase.functions.invoke("live-admin", { body: { action, id } });
    toast.success(action === "pauseLive" ? "Live pausada" : action === "resumeLive" ? "Live retomada" : "Live encerrada");
    loadSessions();
  };

  const loadAnalytics = async (sessionId: string) => {
    setSelectedSessionId(sessionId === selectedSessionId ? null : sessionId);
    if (sessionId === selectedSessionId) {
      setAnalyticsData(null);
      return;
    }
    const { data } = await supabase.functions.invoke("live-admin", {
      body: { action: "getAnalytics", session_id: sessionId },
    });
    setAnalyticsData(data?.analytics || null);
  };

  const saveSettings = async () => {
    await supabase.functions.invoke("live-admin", {
      body: { action: "updateSettings", default_whatsapp_group: defaultWhatsApp },
    });
    toast.success("Configurações salvas!");
  };

  // Upload video to VPS
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, sessionId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 3 * 1024 * 1024 * 1024; // 3GB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande (máx 3GB)");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setTranscodingStatus(null);

    try {
      const baseUrl = getVideoServerUrl();
      const formData = new FormData();
      formData.append("video", file);

      // Use XMLHttpRequest for progress tracking with extended timeout
      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${baseUrl}/api/video/upload`);
        xhr.timeout = 7200000; // 2 hours timeout for large files

        let lastProgressTime = Date.now();
        let lastLoaded = 0;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(pct);
            lastProgressTime = Date.now();
            lastLoaded = e.loaded;
            
            // Log speed for debugging
            const elapsed = (Date.now() - lastProgressTime) / 1000;
            if (pct % 10 === 0) {
              const mbSent = (e.loaded / (1024 * 1024)).toFixed(1);
              const mbTotal = (e.total / (1024 * 1024)).toFixed(1);
              console.log(`[Upload] ${pct}% - ${mbSent}MB / ${mbTotal}MB`);
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Resposta inválida do servidor"));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };

        xhr.ontimeout = () => reject(new Error("Upload expirou por timeout. Tente um arquivo menor ou verifique a conexão."));
        xhr.onerror = () => reject(new Error("Upload falhou - verifique se o video server está rodando no VPS"));
        xhr.send(formData);
      });

      if (result.success) {
        const videoUrl = result.video_url;
        const hlsUrl = result.hls_url;
        const jobId = result.job_id;

        toast.success("Upload concluído! Transcoding HLS iniciado...");

        // Update session or new live form
        if (sessionId) {
          await supabase.functions.invoke("live-admin", {
            body: { action: "updateLive", id: sessionId, video_url: videoUrl, hls_url: hlsUrl },
          });
          loadSessions();
        } else {
          setNewLive((prev) => ({ ...prev, video_url: videoUrl, hls_url: hlsUrl }));
        }

        // Poll transcoding status
        if (jobId) {
          pollTranscodingStatus(jobId);
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      
      // Fallback: try Supabase storage for smaller files
      if (file.size < 50 * 1024 * 1024) {
        toast.info("VPS indisponível. Enviando via armazenamento alternativo...");
        await handleFallbackUpload(file, sessionId);
      } else {
        toast.error(err.message || "Erro no upload. Verifique se o video server está configurado no VPS.");
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Fallback to Supabase storage for small files
  const handleFallbackUpload = async (file: File, sessionId?: string) => {
    const fileName = `live-videos/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("assets").upload(fileName, file, { contentType: file.type, upsert: true });

    if (error) {
      toast.error("Erro no upload: " + error.message);
      return;
    }

    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(fileName);
    const videoUrl = urlData.publicUrl;

    if (sessionId) {
      await supabase.functions.invoke("live-admin", {
        body: { action: "updateLive", id: sessionId, video_url: videoUrl },
      });
      loadSessions();
    } else {
      setNewLive((prev) => ({ ...prev, video_url: videoUrl }));
    }
    toast.success("Vídeo carregado!");
  };

  const pollTranscodingStatus = (jobId: string) => {
    const baseUrl = getVideoServerUrl();
    setTranscodingStatus("processing");

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${baseUrl}/api/video/status/${jobId}`);
        const data = await res.json();

        setTranscodingProgress(data.progress || 0);
        setTranscodingStatus(data.status);

        if (data.status === "completed") {
          clearInterval(interval);
          toast.success("✅ Transcoding HLS concluído! Streaming adaptativo ativado.");
          setTranscodingStatus(null);
        } else if (data.status === "error") {
          clearInterval(interval);
          toast.error("Erro no transcoding HLS. O vídeo direto ainda funciona.");
          setTranscodingStatus(null);
        }
      } catch {
        // VPS may not be accessible from preview
        clearInterval(interval);
        setTranscodingStatus(null);
      }
    }, 5000);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Radio className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">Live Admin</h1>
          </div>
          <div className="space-y-4">
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
            <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-800 border-gray-700 text-white" onKeyDown={(e) => e.key === "Enter" && login()} />
            <Button onClick={login} disabled={loggingIn} className="w-full bg-red-600 hover:bg-red-700">
              {loggingIn ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-red-500" />
          <h1 className="text-xl font-bold">Live Admin</h1>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "lives" ? "default" : "ghost"} size="sm" onClick={() => setTab("lives")}>
            <Radio className="w-4 h-4 mr-1" /> Lives
          </Button>
          <Button variant={tab === "settings" ? "default" : "ghost"} size="sm" onClick={() => setTab("settings")}>
            <Settings className="w-4 h-4 mr-1" /> Config
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { sessionStorage.removeItem("live_admin_auth"); setAuthenticated(false); }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Upload/Transcoding Status Bar */}
        {(uploading || transcodingStatus) && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Enviando vídeo para o servidor... {uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            {transcodingStatus === "processing" && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                  <span>Transcoding HLS (480p → 720p → 1080p)... {transcodingProgress}%</span>
                </div>
                <Progress value={transcodingProgress} className="h-2" />
                <p className="text-xs text-gray-500">O vídeo já pode ser reproduzido enquanto o transcoding processa.</p>
              </div>
            )}
          </div>
        )}

        {tab === "lives" && (
          <>
            {!creating ? (
              <Button onClick={() => setCreating(true)} className="bg-red-600 hover:bg-red-700 gap-2">
                <Plus className="w-5 h-5" /> Criar Nova Live
              </Button>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Nova Live
                </h2>
                <Input placeholder="Título da Live" value={newLive.title} onChange={(e) => setNewLive((p) => ({ ...p, title: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Vídeo da Live (até 3GB - hospedado no servidor)</label>
                  {newLive.video_url ? (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                      <span className="text-green-400 text-sm truncate flex-1">{newLive.video_url}</span>
                      <label className="cursor-pointer text-xs text-blue-400 hover:underline shrink-0">
                        Trocar
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(e)} />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg px-4 py-6 hover:border-red-500 transition text-center justify-center">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <div>
                          <span className="text-gray-300 text-sm block">Clique para enviar um novo vídeo (MP4, até 3GB)</span>
                          <span className="text-gray-500 text-xs">Será hospedado diretamente no seu servidor</span>
                        </div>
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(e)} />
                      </label>

                      <button
                        type="button"
                        onClick={() => { setShowVideoList(!showVideoList); if (!showVideoList) loadServerVideos(); }}
                        className="w-full text-sm text-blue-400 hover:text-blue-300 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition hover:border-blue-500/50"
                      >
                        <Play className="w-4 h-4" />
                        Usar vídeo já enviado anteriormente
                      </button>

                      {showVideoList && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                          {loadingVideos ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
                              <Loader2 className="w-4 h-4 animate-spin" /> Carregando vídeos do servidor...
                            </div>
                          ) : serverVideos.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 text-sm">
                              Nenhum vídeo encontrado no servidor
                            </div>
                          ) : (
                            serverVideos.map((v) => (
                              <div
                                key={v.name}
                                className="w-full px-4 py-3 hover:bg-gray-700/50 border-b border-gray-700/50 last:border-b-0 flex items-center gap-3 transition"
                              >
                                <button
                                  type="button"
                                  onClick={() => selectExistingVideo(v)}
                                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                                >
                                  <Play className="w-4 h-4 text-red-400 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-200 truncate">{v.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(v.size)} • {new Date(v.created).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); deleteServerVideo(v.name); }}
                                  className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition shrink-0"
                                  title="Excluir vídeo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400">Viewers Fictícios Mín</label>
                    <Input type="number" value={newLive.fake_viewers_min} onChange={(e) => setNewLive((p) => ({ ...p, fake_viewers_min: Number(e.target.value) }))} className="bg-gray-800 border-gray-700 text-white" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Viewers Fictícios Máx</label>
                    <Input type="number" value={newLive.fake_viewers_max} onChange={(e) => setNewLive((p) => ({ ...p, fake_viewers_max: Number(e.target.value) }))} className="bg-gray-800 border-gray-700 text-white" />
                  </div>
                </div>

                <Input placeholder="Link do Grupo WhatsApp" value={newLive.whatsapp_group_link} onChange={(e) => setNewLive((p) => ({ ...p, whatsapp_group_link: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
                <Input placeholder="Título do CTA final" value={newLive.cta_title} onChange={(e) => setNewLive((p) => ({ ...p, cta_title: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
                <Textarea placeholder="Descrição do CTA final" value={newLive.cta_description} onChange={(e) => setNewLive((p) => ({ ...p, cta_description: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" rows={3} />
                <Input placeholder="Texto do botão CTA" value={newLive.cta_button_text} onChange={(e) => setNewLive((p) => ({ ...p, cta_button_text: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
                <Input placeholder="Link do botão CTA (grupo desconto)" value={newLive.cta_button_link} onChange={(e) => setNewLive((p) => ({ ...p, cta_button_link: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />

                <div className="flex gap-3">
                  <Button onClick={createLive} disabled={loading} className="bg-red-600 hover:bg-red-700 flex-1">
                    {loading ? "Criando..." : "Criar Live"}
                  </Button>
                  <Button variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {/* Sessions list */}
            <div className="space-y-4">
              {sessions.map((s) => (
                <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.status === "active" ? "bg-green-500 animate-pulse" : s.status === "paused" ? "bg-yellow-500" : "bg-gray-500"}`} />
                        <h3 className="font-bold text-white truncate">{s.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-green-500/20 text-green-400" : s.status === "paused" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}>
                          {s.status === "active" ? "AO VIVO" : s.status === "paused" ? "PAUSADA" : "ENCERRADA"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Criada: {new Date(s.created_at).toLocaleString("pt-BR")}
                        {s.ended_at && ` • Encerrada: ${new Date(s.ended_at).toLocaleString("pt-BR")}`}
                      </p>
                      <p className="text-xs text-gray-500">Viewers fictícios: {s.fake_viewers_min} - {s.fake_viewers_max}</p>
                      {s.status === "active" && realtimeViewers[s.id] && (
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <Eye className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400 font-bold text-sm">{realtimeViewers[s.id].active}</span>
                            <span className="text-green-400/70 text-xs">assistindo agora</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            📱 {realtimeViewers[s.id].mobile} · 💻 {realtimeViewers[s.id].desktop}
                          </span>
                        </div>
                      )}
                      {s.video_url && <p className="text-xs text-blue-400 mt-1 truncate">🎥 {s.video_url}</p>}
                      {s.status === "active" && !realtimeViewers[s.id] && (
                        <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-xs">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Carregando viewers em tempo real...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {s.status === "active" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "pauseLive")} className="gap-1 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">
                            <Pause className="w-3 h-3" /> Pausar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "endLive")} className="gap-1 border-red-500/50 text-red-400 hover:bg-red-500/10">
                            <StopCircle className="w-3 h-3" /> Encerrar
                          </Button>
                        </>
                      )}
                      {s.status === "paused" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "resumeLive")} className="gap-1 border-green-500/50 text-green-400 hover:bg-green-500/10">
                            <Play className="w-3 h-3" /> Retomar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "endLive")} className="gap-1 border-red-500/50 text-red-400 hover:bg-red-500/10">
                            <StopCircle className="w-3 h-3" /> Encerrar
                          </Button>
                        </>
                      )}

                      <label className="cursor-pointer">
                        <Button size="sm" variant="outline" asChild className="gap-1">
                          <span><Upload className="w-3 h-3" /> Vídeo</span>
                        </Button>
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(e, s.id)} />
                      </label>

                      <Button size="sm" variant="outline" onClick={() => loadAnalytics(s.id)} className="gap-1">
                        <BarChart3 className="w-3 h-3" /> Stats
                      </Button>
                    </div>
                  </div>

                  {/* Analytics inline */}
                  {selectedSessionId === s.id && analyticsData && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Estatísticas
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gray-800 rounded-lg p-3 text-center">
                          <Users className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                          <p className="text-2xl font-bold">{analyticsData.total}</p>
                          <p className="text-xs text-gray-400">Total Viewers</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3 text-center">
                          <Eye className="w-5 h-5 mx-auto mb-1 text-green-400" />
                          <p className="text-2xl font-bold text-green-400">{analyticsData.watched100}</p>
                          <p className="text-xs text-gray-400">100% assistido</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3 text-center">
                          <Percent className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                          <p className="text-2xl font-bold text-yellow-400">{analyticsData.watched50}</p>
                          <p className="text-xs text-gray-400">50-95%</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3 text-center">
                          <AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-400" />
                          <p className="text-2xl font-bold text-red-400">{analyticsData.watchedLess50}</p>
                          <p className="text-xs text-gray-400">&lt; 50%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma live criada ainda</p>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "settings" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Settings className="w-5 h-5" /> Configurações
            </h2>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">🌐 URL do VPS (domínio do servidor de vídeo)</label>
              <Input 
                placeholder="https://seu-dominio.com" 
                value={vpsUrl} 
                onChange={(e) => {
                  setVpsUrl(e.target.value);
                  localStorage.setItem("live_vps_url", e.target.value);
                }} 
                className="bg-gray-800 border-gray-700 text-white" 
              />
              <p className="text-xs text-gray-500 mt-1">Ex: https://seudominio.com — necessário para upload de vídeos grandes (até 3GB)</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Link padrão do Grupo WhatsApp</label>
              <Input placeholder="https://chat.whatsapp.com/..." value={defaultWhatsApp} onChange={(e) => setDefaultWhatsApp(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
            </div>
            <Button onClick={saveSettings} className="bg-red-600 hover:bg-red-700">
              Salvar Configurações
            </Button>

            <div className="pt-4 border-t border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">📋 Configuração do Servidor de Vídeo</h3>
              <div className="bg-gray-800 rounded-lg p-4 text-xs text-gray-400 space-y-1 font-mono">
                <p># No VPS Hostinger, execute:</p>
                <p className="text-green-400">cd /var/www/ia-mro</p>
                <p className="text-green-400">chmod +x deploy/setup-video-server.sh</p>
                <p className="text-green-400">sudo ./deploy/setup-video-server.sh seu-dominio.com</p>
                <p className="mt-2"># Isso instala ffmpeg + video server + configura Nginx</p>
                <p># Vídeos serão transcodados em 480p, 720p e 1080p (HLS)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAdmin;
