import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageCircle, Settings, BarChart3, Plus, Trash2, Send, Bot,
  Heart, AtSign, Zap, RefreshCw, Eye, CheckCircle2, XCircle, Clock,
  Instagram, LogOut, ShieldCheck, ArrowRight, Loader2, Users,
  Sparkles, Lock, MessageSquare, Image, Inbox, BotOff, ArrowDown
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const OAUTH_REDIRECT_URI = "https://ig-mro-boost.lovable.app/mrodirectmais";

function getOAuthRedirectUri() {
  const origin = window.location.origin;
  const normalizedOrigin = origin === "https://www.maisresultadosonline.com.br"
    ? "https://maisresultadosonline.com.br"
    : origin;
  const allowedOrigins = new Set([
    "https://ig-mro-boost.lovable.app",
    "https://maisresultadosonline.com.br",
  ]);
  if (allowedOrigins.has(normalizedOrigin)) {
    return `${normalizedOrigin}/mrodirectmais`;
  }
  return OAUTH_REDIRECT_URI;
}

async function api(action: string, data: Record<string, unknown> = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/mro-direct-api`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ action, ...data }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

const automationSections = [
  {
    type: "comment_reply",
    title: "Respostas a Comentários",
    description: "Quando alguém comentar em um post, responde automaticamente no comentário e envia uma DM personalizada.",
    icon: AtSign,
    color: "from-green-600 to-emerald-600",
    iconBg: "bg-green-500",
    available: true,
  },
  {
    type: "dm_reply",
    title: "Atendimento via Direct",
    description: "Responde automaticamente quem enviar DM. Use I.A com prompt personalizado ou mensagem fixa/funil.",
    icon: MessageCircle,
    color: "from-blue-600 to-indigo-600",
    iconBg: "bg-blue-500",
    available: true,
  },
  {
    type: "story_reply",
    title: "Respostas a Stories",
    description: "Quando alguém responder ou mencionar seus Stories, envia uma resposta automática via DM.",
    icon: Image,
    color: "from-orange-600 to-pink-600",
    iconBg: "bg-orange-500",
    available: true,
  },
  {
    type: "welcome_follower",
    title: "Boas-vindas para Novos Seguidores",
    description: "Envia uma mensagem de boas-vindas personalizada para cada novo seguidor automaticamente.",
    icon: Heart,
    color: "from-pink-600 to-rose-600",
    iconBg: "bg-pink-500",
    available: false,
  },
];

// ─── LOGIN / CONNECT SCREEN ───
const ConnectScreen = ({ onConnected }: { onConnected: (profile: any) => void }) => {
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [oauthError, setOauthError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const stateParam = params.get("state");
    const storedState = sessionStorage.getItem("mro_oauth_state");

    if (code) {
      window.history.replaceState({}, "", window.location.pathname);
      if (stateParam && storedState && stateParam !== storedState) {
        setOauthError("Erro de segurança (state inválido). Tente novamente.");
        setCheckingExisting(false);
        return;
      }
      sessionStorage.removeItem("mro_oauth_state");
      setLoading(true);
      (async () => {
        try {
          const redirectUri = getOAuthRedirectUri();
          const res = await fetch(`${SUPABASE_URL}/functions/v1/mro-direct-oauth`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
            body: JSON.stringify({ action: "exchange-code", code, redirect_uri: redirectUri }),
          }).then(r => r.json());
          if (res.error) throw new Error(res.error);
          toast.success("Instagram conectado com sucesso!");
          onConnected(res.profile);
        } catch (e: any) {
          setOauthError(e.message || "Erro ao conectar com Instagram");
          setCheckingExisting(false);
          setLoading(false);
        }
      })();
      return;
    }

    (async () => {
      try {
        const settingsRes = await api("get-settings");
        if (settingsRes.settings?.page_access_token) {
          const infoRes = await api("get-ig-info");
          if (infoRes.info?.id) {
            onConnected(infoRes.info);
            return;
          }
        }
      } catch { /* No valid token */ }
      setCheckingExisting(false);
    })();
  }, [onConnected]);

  const handleLogin = async () => {
    setLoading(true);
    setOauthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/mro-direct-oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ action: "get-app-id" }),
      }).then(r => r.json());
      if (!res.app_id) throw new Error("App ID não configurado");

      const state = crypto.randomUUID().replace(/-/g, "");
      sessionStorage.setItem("mro_oauth_state", state);
      const redirectUri = getOAuthRedirectUri();
      const scopes = [
        "instagram_business_basic",
        "instagram_business_manage_messages",
        "instagram_business_manage_comments",
      ].join(",");
      const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${res.app_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
      const popup = window.open(authUrl, "_blank", "noopener,noreferrer");
      if (!popup) window.location.href = authUrl;
    } catch (e: any) {
      setOauthError(e.message || "Erro ao iniciar login");
      setLoading(false);
    }
  };

  if (checkingExisting || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{loading ? "Conectando ao Instagram..." : "Verificando conexão..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 mb-5 shadow-2xl shadow-purple-500/30">
            <Instagram className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">MRO Direct+</h1>
          <p className="text-gray-400 mt-2">Automação Inteligente de DMs via Instagram</p>
        </div>

        <Card className="bg-gray-900/80 border-white/10 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Instagram className="h-5 w-5 text-purple-400" /> Conectar Instagram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="text-gray-300 font-medium mb-1">Login seguro com Instagram</p>
                  <p className="text-gray-400 text-xs">Clique para autorizar o acesso ao seu Instagram Business/Creator.</p>
                </div>
              </div>
            </div>
            {oauthError && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-300 text-sm flex items-center gap-2"><XCircle className="h-4 w-4 shrink-0" />{oauthError}</p>
              </div>
            )}
            <Button onClick={handleLogin} disabled={loading} className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-base">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Conectando...</> : <><Instagram className="h-5 w-5 mr-2" />Entrar com Instagram<ArrowRight className="h-4 w-4 ml-2" /></>}
            </Button>
            <p className="text-xs text-gray-500 text-center">Seu perfil precisa ser <strong className="text-gray-400">Business</strong> ou <strong className="text-gray-400">Creator</strong>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─── AUTOMATION SECTION CARD ───
const AutomationSectionCard = ({
  section,
  automations,
  onCreateOpen,
  onToggle,
  onDelete,
}: {
  section: typeof automationSections[0];
  automations: any[];
  onCreateOpen: (type: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  const Icon = section.icon;
  const sectionAutos = automations.filter(a => a.automation_type === section.type);

  return (
    <Card className="bg-gray-900/80 border-white/10 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${section.color}`} />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${section.iconBg}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-base flex items-center gap-2">
                {section.title}
                {!section.available && (
                  <Badge className="bg-amber-600/80 text-[10px] px-2 py-0.5 font-semibold">
                    <Lock className="h-3 w-3 mr-1" /> EM BREVE
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
            </div>
          </div>
          {section.available && (
            <Button size="sm" onClick={() => onCreateOpen(section.type)} className={`bg-gradient-to-r ${section.color} hover:opacity-90 text-white`}>
              <Plus className="h-4 w-4 mr-1" /> Nova
            </Button>
          )}
        </div>
      </CardHeader>

      {section.available && (
        <CardContent className="pt-0">
          {sectionAutos.length === 0 ? (
            <div className="bg-gray-800/50 rounded-lg p-6 text-center border border-dashed border-white/10">
              <Bot className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhuma automação configurada</p>
              <p className="text-xs text-gray-600">Clique em "Nova" para criar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sectionAutos.map((auto) => (
                <div key={auto.id} className="bg-gray-800/60 rounded-lg p-3 flex items-start gap-3 border border-white/5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={auto.is_active ? "default" : "secondary"} className={auto.is_active ? "bg-green-600 text-[10px]" : "text-[10px]"}>
                        {auto.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 text-gray-300 text-[10px]">
                        {auto.response_mode === "ai" ? (
                          <><Sparkles className="h-3 w-3 mr-1 text-yellow-400" /> I.A</>
                        ) : (
                          <><MessageSquare className="h-3 w-3 mr-1" /> Manual</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {auto.response_mode === "ai"
                        ? `Prompt: "${(auto.ai_prompt || "").substring(0, 80)}..."`
                        : `"${auto.reply_message}"`}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                      {auto.trigger_keywords?.length > 0 && <span>Keywords: {auto.trigger_keywords.join(", ")}</span>}
                      {auto.delay_seconds > 0 && <span>Delay: {auto.delay_seconds}s</span>}
                      {auto.target_post_id && <span>Post: ...{auto.target_post_id.slice(-8)}</span>}
                      {auto.comment_reply_text && <span>Resp. comentário: "{auto.comment_reply_text.substring(0, 30)}..."</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Switch checked={auto.is_active} onCheckedChange={(v) => onToggle(auto.id, v)} />
                    <Button size="icon" variant="ghost" onClick={() => onDelete(auto.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}

      {!section.available && (
        <CardContent className="pt-0">
          <div className="bg-amber-900/10 rounded-lg p-5 text-center border border-amber-500/20">
            <Lock className="h-10 w-10 text-amber-500/50 mx-auto mb-3" />
            <p className="text-sm text-amber-300/80 font-medium">Funcionalidade em desenvolvimento</p>
            <p className="text-xs text-gray-500 mt-1">Em breve você poderá enviar DMs automáticas de boas-vindas para cada novo seguidor.</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// ─── CREATE AUTOMATION DIALOG ───
const CreateAutomationDialog = ({
  open,
  onOpenChange,
  autoType,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoType: string;
  onCreated: () => void;
}) => {
  const [responseMode, setResponseMode] = useState("manual");
  const [message, setMessage] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [keywords, setKeywords] = useState("");
  const [postId, setPostId] = useState("");
  const [delay, setDelay] = useState("0");
  const [commentReplyText, setCommentReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  // Posts for selection
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);

  const sectionInfo = automationSections.find(s => s.type === autoType);

  // Load posts when dialog opens for comment_reply type
  useEffect(() => {
    if (open && autoType === "comment_reply" && !postsLoaded) {
      setLoadingPosts(true);
      api("list-posts")
        .then((res) => {
          setPosts(res.posts || []);
          setPostsLoaded(true);
        })
        .catch((e) => {
          console.error("Erro ao carregar posts:", e);
          toast.error("Não foi possível carregar os posts");
        })
        .finally(() => setLoadingPosts(false));
    }
  }, [open, autoType, postsLoaded]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setPostsLoaded(false);
      setPosts([]);
      setPostId("");
    }
  }, [open]);

  const handleCreate = async () => {
    if (responseMode === "manual" && !message.trim()) return toast.error("Mensagem é obrigatória no modo manual");
    if (responseMode === "ai" && !aiPrompt.trim()) return toast.error("Prompt da I.A é obrigatório");
    setSaving(true);
    try {
      await api("create-automation", {
        automation_type: autoType,
        reply_message: responseMode === "manual" ? message : "(via I.A)",
        response_mode: responseMode,
        ai_prompt: responseMode === "ai" ? aiPrompt : null,
        trigger_keywords: keywords ? keywords.split(",").map(k => k.trim()) : [],
        target_post_id: postId || null,
        delay_seconds: parseInt(delay) || 0,
        comment_reply_text: commentReplyText || null,
      });
      toast.success("Automação criada!");
      onOpenChange(false);
      setMessage(""); setAiPrompt(""); setKeywords(""); setPostId(""); setDelay("0"); setCommentReplyText(""); setResponseMode("manual");
      onCreated();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const getPostThumbnail = (post: any) => {
    if (post.media_type === "VIDEO") return post.thumbnail_url || "";
    return post.media_url || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {sectionInfo && <sectionInfo.icon className="h-5 w-5" />}
            Nova Automação — {sectionInfo?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Response Mode */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block font-medium">Modo de Resposta</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setResponseMode("manual")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  responseMode === "manual"
                    ? "border-purple-500 bg-purple-900/30"
                    : "border-white/10 bg-gray-800/50 hover:border-white/20"
                }`}
              >
                <MessageSquare className="h-5 w-5 text-purple-400 mb-1" />
                <p className="text-sm font-semibold text-white">Manual</p>
                <p className="text-xs text-gray-400">Mensagem fixa ou fluxo/funil</p>
              </button>
              <button
                onClick={() => setResponseMode("ai")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  responseMode === "ai"
                    ? "border-yellow-500 bg-yellow-900/20"
                    : "border-white/10 bg-gray-800/50 hover:border-white/20"
                }`}
              >
                <Sparkles className="h-5 w-5 text-yellow-400 mb-1" />
                <p className="text-sm font-semibold text-white">Inteligência Artificial</p>
                <p className="text-xs text-gray-400">Resposta via I.A com prompt</p>
              </button>
            </div>
          </div>

          {responseMode === "manual" ? (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Mensagem de Resposta (DM) *</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Olá! Obrigado por entrar em contato. Temos uma oferta especial para você..."
                className="bg-gray-800 border-white/10 text-white"
                rows={4}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Prompt da I.A *</label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={`Exemplo:\nVocê é a assistente virtual da loja XYZ.\nSeu objetivo é atender os clientes de forma simpática, responder dúvidas sobre os produtos e direcionar para o link de compra.\nProdutos: Camisetas R$49, Calças R$89.\nLink: www.loja.com\nTom: amigável e profissional.`}
                  className="bg-gray-800 border-white/10 text-white"
                  rows={6}
                />
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  A I.A vai usar esse prompt para entender quem ela é, o que oferecer e como responder cada mensagem de forma personalizada.
                </p>
              </div>
            </div>
          )}

          {/* Comment reply text (for comment_reply type) */}
          {autoType === "comment_reply" && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Resposta no Comentário (opcional)</label>
              <Input
                value={commentReplyText}
                onChange={(e) => setCommentReplyText(e.target.value)}
                placeholder="Acabei de te chamar no DM! 😊"
                className="bg-gray-800 border-white/10 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Além de enviar DM, responde direto no comentário com essa mensagem.</p>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Palavras-chave (separadas por vírgula, vazio = todas)</label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="preço, promoção, desconto, quero"
              className="bg-gray-800 border-white/10 text-white"
            />
          </div>

          {/* Post selector for comment_reply */}
          {autoType === "comment_reply" && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block font-medium">Selecione o Post (vazio = todos os posts)</label>
              {loadingPosts ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                  <span className="text-sm text-gray-400 ml-2">Carregando posts...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-dashed border-white/10">
                  <Image className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Nenhum post encontrado ou erro ao carregar.</p>
                  <Input
                    value={postId}
                    onChange={(e) => setPostId(e.target.value)}
                    placeholder="Cole o ID do post manualmente"
                    className="bg-gray-800 border-white/10 text-white mt-2"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* All posts option */}
                  <button
                    onClick={() => setPostId("")}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      postId === ""
                        ? "border-purple-500 bg-purple-900/30"
                        : "border-white/10 bg-gray-800/50 hover:border-white/20"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                      <AtSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Todos os Posts</p>
                      <p className="text-xs text-gray-400">Ativa para qualquer comentário em qualquer post</p>
                    </div>
                    {postId === "" && <CheckCircle2 className="h-5 w-5 text-purple-400 ml-auto shrink-0" />}
                  </button>

                  {/* Posts grid */}
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                    {posts.map((post) => {
                      const thumb = getPostThumbnail(post);
                      const isSelected = postId === post.id;
                      return (
                        <button
                          key={post.id}
                          onClick={() => setPostId(isSelected ? "" : post.id)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square group ${
                            isSelected
                              ? "border-purple-500 ring-2 ring-purple-500/40"
                              : "border-transparent hover:border-white/30"
                          }`}
                        >
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                              <Image className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                          {/* Overlay */}
                          <div className={`absolute inset-0 flex flex-col justify-end p-1.5 transition-opacity ${
                            isSelected ? "bg-purple-900/60" : "bg-black/40 opacity-0 group-hover:opacity-100"
                          }`}>
                            <div className="flex items-center gap-1 text-white text-[10px]">
                              {post.like_count != null && (
                                <span className="flex items-center gap-0.5">
                                  <Heart className="h-2.5 w-2.5" />{post.like_count}
                                </span>
                              )}
                              {post.comments_count != null && (
                                <span className="flex items-center gap-0.5">
                                  <MessageCircle className="h-2.5 w-2.5" />{post.comments_count}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1">
                              <CheckCircle2 className="h-5 w-5 text-purple-400 drop-shadow-lg" />
                            </div>
                          )}
                          {post.media_type === "VIDEO" && (
                            <div className="absolute top-1 left-1">
                              <Badge className="bg-black/60 text-[9px] px-1 py-0">▶ Vídeo</Badge>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {postId && (
                    <p className="text-xs text-purple-300 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3" /> Post selecionado: ...{postId.slice(-12)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Atraso antes de responder (segundos)</label>
            <Input
              type="number"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
              className="bg-gray-800 border-white/10 text-white w-32"
            />
          </div>

          <Button onClick={handleCreate} disabled={saving} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Criar Automação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── CONVERSATIONS TAB (Real-time Inbox) ───
const ConversationsTab = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await api("get-conversations");
      setConversations(res.conversations || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Realtime subscription (best effort)
  useEffect(() => {
    const channel = supabase
      .channel("mro-direct-logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mro_direct_logs" },
        (payload) => {
          const newLog = payload.new as any;
          if (!newLog.sender_id) return;

          setConversations((prev) => {
            const existing = prev.find((c) => c.sender_id === newLog.sender_id);
            if (existing) {
              return prev
                .map((c) => {
                  if (c.sender_id !== newLog.sender_id) return c;
                  const deduped = [newLog, ...c.messages.filter((m: any) => m.id !== newLog.id)];
                  return {
                    ...c,
                    messages: deduped,
                    last_message_at: newLog.created_at,
                  };
                })
                .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
            }

            return [
              {
                sender_id: newLog.sender_id,
                sender_username: newLog.sender_username,
                messages: [newLog],
                last_message_at: newLog.created_at,
                ai_paused: false,
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[MRO Direct+] Realtime indisponível, mantendo atualização automática por polling.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fallback polling para garantir atualização contínua mesmo sem realtime
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadConversations({ silent: true });
    }, 3000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadConversations({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedSender && conversations.length > 0) {
      setSelectedSender(conversations[0].sender_id);
    }
  }, [conversations, selectedSender]);

  // Scroll to bottom when selecting conversation
  useEffect(() => {
    if (selectedSender && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedSender]);

  const toggleAiPause = async (senderId: string, currentPaused: boolean) => {
    try {
      await api("toggle-ai-pause", { sender_id: senderId, paused: !currentPaused });
      setConversations((prev) =>
        prev.map((c) =>
          c.sender_id === senderId ? { ...c, ai_paused: !currentPaused } : c
        )
      );
      toast.success(!currentPaused ? "I.A pausada para esta conversa" : "I.A reativada para esta conversa");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const selectedConv = conversations.find((c) => c.sender_id === selectedSender);
  const sortedMessages = selectedConv
    ? [...selectedConv.messages].sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
      {/* Conversation List */}
      <div className="md:col-span-1">
        <Card className="bg-gray-900/80 border-white/10 h-full flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Inbox className="h-4 w-4 text-purple-400" /> Conversas
                {conversations.length > 0 && (
                  <Badge className="bg-purple-600 text-xs">{conversations.length}</Badge>
                )}
              </CardTitle>
              <Button size="icon" variant="ghost" onClick={() => loadConversations()} className="h-7 w-7 text-gray-400">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhuma conversa ainda</p>
                  <p className="text-xs text-gray-600">Quando alguém enviar DM, aparecerá aqui em tempo real</p>
                </div>
              ) : (
                <div className="space-y-0.5 p-2">
                  {conversations.map((conv) => {
                    const lastMsg = conv.messages[0];
                    const isSelected = selectedSender === conv.sender_id;
                    const hasIncoming = conv.messages.some((m: any) => m.direction === "incoming");
                    return (
                      <button
                        key={conv.sender_id}
                        onClick={() => setSelectedSender(conv.sender_id)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          isSelected
                            ? "bg-purple-900/40 border border-purple-500/40"
                            : "hover:bg-gray-800/60 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {conv.sender_username ? `@${conv.sender_username}` : conv.sender_id.slice(0, 12) + "..."}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(conv.last_message_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {conv.ai_paused && (
                              <Badge className="bg-red-600/60 text-[9px] px-1.5">I.A OFF</Badge>
                            )}
                            {hasIncoming && (
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 truncate pl-10">
                          {lastMsg.direction === "incoming"
                            ? `📩 ${lastMsg.incoming_text || lastMsg.trigger_content || ""}`
                            : `📤 ${lastMsg.message_sent || ""}`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Message Thread */}
      <div className="md:col-span-2">
        <Card className="bg-gray-900/80 border-white/10 h-full flex flex-col">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Selecione uma conversa</p>
                <p className="text-xs text-gray-600 mt-1">As mensagens aparecem em tempo real</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {selectedConv.sender_username ? `@${selectedConv.sender_username}` : selectedConv.sender_id}
                    </p>
                    <p className="text-xs text-gray-400">{selectedConv.messages.length} mensagens</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={selectedConv.ai_paused ? "default" : "outline"}
                    onClick={() => toggleAiPause(selectedConv.sender_id, selectedConv.ai_paused)}
                    className={selectedConv.ai_paused
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "border-white/20 text-gray-300 hover:bg-gray-800"
                    }
                  >
                    {selectedConv.ai_paused ? (
                      <><BotOff className="h-4 w-4 mr-1" /> I.A Pausada</>
                    ) : (
                      <><Bot className="h-4 w-4 mr-1" /> I.A Ativa</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {sortedMessages.map((msg: any) => {
                    const isIncoming = msg.direction === "incoming";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isIncoming
                              ? "bg-gray-800 border border-white/10 rounded-bl-sm"
                              : "bg-gradient-to-r from-purple-600 to-pink-600 rounded-br-sm"
                          }`}
                        >
                          <p className="text-sm text-white whitespace-pre-wrap">
                            {isIncoming
                              ? msg.incoming_text || msg.trigger_content || "(sem texto)"
                              : msg.message_sent || "(automação)"}
                          </p>
                          <div className={`flex items-center gap-1.5 mt-1 ${isIncoming ? "text-gray-500" : "text-purple-200"}`}>
                            <span className="text-[10px]">
                              {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {!isIncoming && (
                              <Badge className={`text-[9px] px-1 py-0 ${
                                msg.status === "sent" ? "bg-green-600/60" : msg.status === "error" ? "bg-red-600/60" : "bg-gray-600/60"
                              }`}>
                                {msg.status === "sent" ? "✓" : msg.status === "error" ? "✗" : msg.status}
                              </Badge>
                            )}
                            {msg.response_mode === "ai" || msg.event_type?.includes("ai") ? (
                              <Sparkles className="h-3 w-3 text-yellow-400" />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───
const DashboardView = ({ profile, onDisconnect }: { profile: any; onDisconnect: () => void }) => {
  const [tab, setTab] = useState("automations");
  const [settings, setSettings] = useState<any>(null);
  const [automations, setAutomations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState("dm_reply");

  const [testRecipient, setTestRecipient] = useState("");
  const [testMessage, setTestMessage] = useState("");

  // Settings form
  const [tokenInput, setTokenInput] = useState("");
  const [igIdInput, setIgIdInput] = useState("");
  const [isActive, setIsActive] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, autoRes, statsRes] = await Promise.all([
        api("get-settings"),
        api("list-automations"),
        api("get-stats"),
      ]);
      setSettings(settingsRes.settings);
      setAutomations(autoRes.automations);
      setStats(statsRes.stats);
      if (settingsRes.settings) {
        setTokenInput(settingsRes.settings.page_access_token || "");
        setIgIdInput(settingsRes.settings.instagram_account_id || "");
        setIsActive(settingsRes.settings.is_active || false);
      }
    } catch (e: any) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadLogs = useCallback(async () => {
    try {
      const res = await api("get-logs");
      setLogs(res.logs);
    } catch (e: any) {
      toast.error(e.message);
    }
  }, []);

  useEffect(() => {
    if (tab !== "logs") return;

    loadLogs();
    const intervalId = window.setInterval(() => {
      loadLogs();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [tab, loadLogs]);

  const saveSettings = async () => {
    try {
      await api("save-settings", {
        instagram_account_id: igIdInput,
        page_access_token: tokenInput,
        is_active: isActive,
      });
      toast.success("Configurações salvas!");
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleAutomation = async (id: string, active: boolean) => {
    try {
      await api("toggle-automation", { id, is_active: active });
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      await api("delete-automation", { id });
      toast.success("Automação removida");
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const sendTest = async () => {
    if (!testRecipient || !testMessage) return toast.error("Preencha todos os campos");
    try {
      await api("send-test-message", { recipient_id: testRecipient, message: testMessage });
      toast.success("Mensagem de teste enviada!");
      loadLogs();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const webhookUrl = `${SUPABASE_URL}/functions/v1/mro-direct-webhook`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/60 via-gray-950 to-pink-900/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">MRO Direct+</h1>
              <p className="text-xs text-gray-400">Automação Inteligente de DMs</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-900/80 rounded-full px-4 py-2 border border-white/10">
              {profile.profile_picture_url ? (
                <img src={profile.profile_picture_url} className="h-8 w-8 rounded-full ring-2 ring-purple-500" alt="" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Instagram className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white leading-tight">@{profile.username || profile.name}</p>
                {profile.followers_count != null && (
                  <p className="text-xs text-gray-400">{profile.followers_count.toLocaleString()} seguidores</p>
                )}
              </div>
              <Badge className="bg-green-600/80 text-xs">Conectado</Badge>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-400" onClick={onDisconnect} title="Desconectar">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-gray-900 border border-white/10 mb-6">
            <TabsTrigger value="automations" className="data-[state=active]:bg-purple-600">
              <Zap className="h-4 w-4 mr-1" /> Automações
            </TabsTrigger>
            <TabsTrigger value="conversations" className="data-[state=active]:bg-purple-600">
              <Inbox className="h-4 w-4 mr-1" /> Conversas
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="h-4 w-4 mr-1" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-purple-600" onClick={loadLogs}>
              <Eye className="h-4 w-4 mr-1" /> Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              <Settings className="h-4 w-4 mr-1" /> Config
            </TabsTrigger>
          </TabsList>

          {/* ── AUTOMATIONS (Main View) ── */}
          <TabsContent value="automations">
            <div className="space-y-6">
              {automationSections.map((section) => (
                <AutomationSectionCard
                  key={section.type}
                  section={section}
                  automations={automations}
                  onCreateOpen={(type) => { setCreateType(type); setCreateDialogOpen(true); }}
                  onToggle={toggleAutomation}
                  onDelete={deleteAutomation}
                />
              ))}
            </div>

            <CreateAutomationDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              autoType={createType}
              onCreated={loadAll}
            />
          </TabsContent>

          {/* ── CONVERSATIONS (Real-time Inbox) ── */}
          <TabsContent value="conversations">
            <ConversationsTab />
          </TabsContent>

          {/* ── DASHBOARD ── */}
          <TabsContent value="dashboard">
            <Card className="bg-gradient-to-r from-purple-900/40 to-pink-900/30 border-purple-500/20 mb-6">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {profile.profile_picture_url ? (
                    <img src={profile.profile_picture_url} className="h-16 w-16 rounded-full ring-3 ring-purple-500/50 shadow-lg" alt="" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <Instagram className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">@{profile.username || profile.name}</h3>
                    <p className="text-sm text-gray-400">ID: {profile.id}</p>
                    {profile.followers_count != null && (
                      <p className="text-sm text-purple-300">{profile.followers_count.toLocaleString()} seguidores</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-600 mb-1">Sistema Ativo</Badge>
                    <p className="text-xs text-gray-400">{stats?.activeAutomations || 0} automações ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: "Mensagens Hoje", value: stats?.todaySent || 0, icon: Send, color: "text-blue-400" },
                { label: "Esta Semana", value: stats?.weekSent || 0, icon: BarChart3, color: "text-purple-400" },
                { label: "Total Enviadas", value: stats?.totalSent || 0, icon: MessageCircle, color: "text-green-400" },
                { label: "Automações Ativas", value: stats?.activeAutomations || 0, icon: Zap, color: "text-yellow-400" },
                { label: "Erros", value: stats?.errors || 0, icon: XCircle, color: "text-red-400" },
              ].map((s, i) => (
                <Card key={i} className="bg-gray-900 border-white/10">
                  <CardContent className="p-4 text-center">
                    <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Send Test */}
            <Card className="bg-gray-900 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-purple-400" /> Enviar Mensagem Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="IGSID do destinatário" value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} className="bg-gray-800 border-white/10 text-white" />
                <Textarea placeholder="Mensagem de teste..." value={testMessage} onChange={(e) => setTestMessage(e.target.value)} className="bg-gray-800 border-white/10 text-white" />
                <Button onClick={sendTest} className="bg-purple-600 hover:bg-purple-700"><Send className="h-4 w-4 mr-2" /> Enviar Teste</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── LOGS ── */}
          <TabsContent value="logs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Histórico de Mensagens</h2>
              <Button size="sm" variant="outline" onClick={loadLogs} className="border-white/20 text-white">
                <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
              </Button>
            </div>
            {logs.length === 0 ? (
              <Card className="bg-gray-900 border-white/10">
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum log ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <Card key={log.id} className="bg-gray-900 border-white/10">
                    <CardContent className="p-3 flex items-center gap-3">
                      {log.status === "sent" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">{log.event_type}</Badge>
                          {log.sender_username && <span className="text-xs text-gray-400">@{log.sender_username}</span>}
                          <span className="text-xs text-gray-500 ml-auto">{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                        </div>
                        <p className="text-sm text-gray-300 truncate mt-1">{log.message_sent}</p>
                        {log.error_message && <p className="text-xs text-red-400 mt-1">{log.error_message}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── SETTINGS ── */}
          <TabsContent value="settings">
            <div className="max-w-2xl space-y-6">
              <Card className="bg-gray-900 border-white/10">
                <CardHeader><CardTitle className="text-white">Configurações da API</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Instagram Account ID (IGSID)</label>
                    <Input value={igIdInput} onChange={(e) => setIgIdInput(e.target.value)} placeholder="Ex: 17841400123456789" className="bg-gray-800 border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Page Access Token</label>
                    <Textarea value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Token de acesso..." className="bg-gray-800 border-white/10 text-white font-mono text-xs" rows={3} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <label className="text-sm text-gray-300">Sistema ativo (receber e responder webhooks)</label>
                  </div>
                  <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700 w-full">Salvar Configurações</Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-white/10">
                <CardHeader><CardTitle className="text-white">Webhook do Instagram</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Callback URL</label>
                    <div className="flex items-center gap-2">
                      <Input value={webhookUrl} readOnly className="bg-gray-800 border-white/10 text-white font-mono text-xs" />
                      <Button size="sm" variant="outline" className="border-white/20 text-white shrink-0" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("URL copiada!"); }}>Copiar</Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Verify Token</label>
                    <div className="flex items-center gap-2">
                      <Input value={settings?.webhook_verify_token || ""} readOnly className="bg-gray-800 border-white/10 text-white font-mono text-xs" />
                      <Button size="sm" variant="outline" className="border-white/20 text-white shrink-0" onClick={() => { navigator.clipboard.writeText(settings?.webhook_verify_token || ""); toast.success("Token copiado!"); }}>Copiar</Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Configure no Facebook Developer → Webhooks → Instagram: <strong>messages</strong>, <strong>comments</strong> e <strong>messaging_optins</strong>.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ───
const MRODirectMais = () => {
  const [profile, setProfile] = useState<any>(null);

  const handleDisconnect = async () => {
    if (!confirm("Deseja desconectar o Instagram?")) return;
    try {
      await api("save-settings", { page_access_token: "", instagram_account_id: "", is_active: false });
      setProfile(null);
      toast.success("Instagram desconectado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!profile) return <ConnectScreen onConnected={setProfile} />;
  return <DashboardView profile={profile} onDisconnect={handleDisconnect} />;
};

export default MRODirectMais;
