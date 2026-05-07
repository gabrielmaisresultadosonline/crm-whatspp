import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  Video, 
  BookOpen,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Loader2,
  RefreshCw,
  Copy,
  Upload,
  ChevronDown,
  ChevronUp,
  Image,
  Database,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ShoppingBag,
  Sparkles,
  Mail,
  UserCheck,
  MoreVertical
} from "lucide-react";
import logoMro from "@/assets/logo-mro.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tab = "users" | "modules" | "videos" | "banners" | "upsells" | "backup";

const MetodoSeguidorAdmin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminToken, setAdminToken] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>("users");
  
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modules state
  const [modules, setModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [newModule, setNewModule] = useState({ title: "", description: "", thumbnail_url: "" });
  const [showNewModule, setShowNewModule] = useState(false);
  const [uploadingCover, setUploadingCover] = useState<string | null>(null);
  
  // Videos state
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [newVideo, setNewVideo] = useState({ 
    module_id: "", title: "", description: "", video_url: "", video_type: "youtube", thumbnail_url: "", duration: "",
    show_title: true, show_number: true, show_play_button: true
  });
  const [showNewVideo, setShowNewVideo] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [uploadingVideoThumb, setUploadingVideoThumb] = useState<string | null>(null);
  
  // Banners state
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [newBanner, setNewBanner] = useState({ title: "", description: "", image_url: "", link_url: "", link_text: "" });
  const [showNewBanner, setShowNewBanner] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState<string | null>(null);
  
  // Upsells state
  const [upsells, setUpsells] = useState<any[]>([]);
  const [loadingUpsells, setLoadingUpsells] = useState(false);
  const [editingUpsell, setEditingUpsell] = useState<any>(null);
  const [newUpsell, setNewUpsell] = useState({ 
    module_id: "", title: "", description: "", thumbnail_url: "", button_text: "Saiba Mais", 
    button_url: "", price: "", original_price: "", show_after_days: 2 
  });
  const [showNewUpsell, setShowNewUpsell] = useState(false);
  const [uploadingUpsellThumb, setUploadingUpsellThumb] = useState<string | null>(null);
  
  // Backup state
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  
  // File input refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const newCoverInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const newBannerInputRef = useRef<HTMLInputElement>(null);
  const upsellInputRef = useRef<HTMLInputElement>(null);
  const newUpsellInputRef = useRef<HTMLInputElement>(null);

  // Auto verification interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoggedIn) {
      interval = setInterval(() => verifyPendingOrders(), 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoggedIn, orders]);

  const verifyPendingOrders = async () => {
    const ordersToCheck = orders.filter(
      (o) => o.status === "pending" || (o.status === "paid" && !o.verified_at)
    );
    for (const order of ordersToCheck) {
      try {
        await supabase.functions.invoke("metodo-seguidor-verify-payment", {
          body: { order_id: order.id, nsu_order: order.nsu_order, email: order.email },
        });
      } catch (e) {
        console.error("Error verifying order:", e);
      }
    }
    if (ordersToCheck.length > 0) loadUsers();
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("metodo-seguidor-admin-data", {
        body: { action: "activate-user", user_id: userId },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("metodo_admin_token")}` }
      });
      if (error || !data?.success) throw error || new Error("Failed");
      toast.success("Usuário ativado e email enviado!");
      loadUsers();
    } catch (e) { toast.error("Erro ao ativar usuário"); }
  };

  const handleResendEmail = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("metodo-seguidor-admin-data", {
        body: { action: "resend-email", user_id: userId },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("metodo_admin_token")}` }
      });
      if (error || !data?.success) throw error || new Error("Failed");
      toast.success("Email reenviado com sucesso!");
      loadUsers();
    } catch (e) { toast.error("Erro ao reenviar email"); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário e todos os pedidos relacionados?")) return;
    try {
      const { data, error } = await supabase.functions.invoke("metodo-seguidor-admin-data", {
        body: { action: "delete-user", user_id: userId },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("metodo_admin_token")}` }
      });
      if (error || !data?.success) throw error || new Error("Failed");
      toast.success("Usuário excluído!");
      loadUsers();
    } catch (e) { toast.error("Erro ao excluir usuário"); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("metodo-seguidor-admin-auth", {
        body: { email: email.trim(), password: password.trim() }
      });
      if (error || !data?.success) { toast.error("Credenciais inválidas"); return; }
      
      // Store token securely in sessionStorage
      if (data.token) {
        sessionStorage.setItem("metodo_admin_token", data.token);
        sessionStorage.setItem("metodo_admin_email", data.admin?.email || email);
        setAdminToken(data.token);
      }
      
      setIsLoggedIn(true);
      toast.success("Login realizado!");
    } catch (error) { toast.error("Erro ao fazer login"); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("metodo_admin_token");
    sessionStorage.removeItem("metodo_admin_email");
    setAdminToken(null);
    setIsLoggedIn(false);
  };

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = sessionStorage.getItem("metodo_admin_token");
      if (!savedToken) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("metodo-seguidor-admin-auth", {
          body: { action: "verify-token" },
          headers: { Authorization: `Bearer ${savedToken}` }
        });

        if (error || !data?.success) {
          // Token is invalid or expired
          sessionStorage.removeItem("metodo_admin_token");
          sessionStorage.removeItem("metodo_admin_email");
          setIsLoggedIn(false);
          return;
        }

        setAdminToken(savedToken);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Token verification failed:", error);
        sessionStorage.removeItem("metodo_admin_token");
        sessionStorage.removeItem("metodo_admin_email");
        setIsLoggedIn(false);
      }
    };

    verifyToken();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (activeTab === "users") loadUsers();
    if (activeTab === "modules") loadModules();
    if (activeTab === "videos") { loadModules(); loadVideos(); }
    if (activeTab === "banners") loadBanners();
    if (activeTab === "upsells") { loadModules(); loadUpsells(); }
    if (activeTab === "backup") checkLastBackup();
  }, [activeTab, isLoggedIn]);

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("metodo_admin_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: usersData } = await supabase.functions.invoke("metodo-seguidor-admin-data", { 
        body: { action: "get-users" },
        headers: getAuthHeaders()
      });
      const { data: ordersData } = await supabase.functions.invoke("metodo-seguidor-admin-data", { 
        body: { action: "get-orders" },
        headers: getAuthHeaders()
      });
      if (usersData?.users) setUsers(usersData.users);
      if (ordersData?.orders) setOrders(ordersData.orders);
    } catch (error) { console.error("Error loading users:", error); }
    finally { setLoadingUsers(false); }
  };

  const loadModules = async () => {
    setLoadingModules(true);
    try {
      const { data } = await supabase.from("metodo_seguidor_modules").select("*").order("order_index");
      if (data) setModules(data);
    } catch (error) { console.error("Error loading modules:", error); }
    finally { setLoadingModules(false); }
  };

  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data } = await supabase.from("metodo_seguidor_videos").select("*").order("order_index");
      if (data) setVideos(data);
    } catch (error) { console.error("Error loading videos:", error); }
    finally { setLoadingVideos(false); }
  };

  const loadBanners = async () => {
    setLoadingBanners(true);
    try {
      const { data } = await supabase.from("metodo_seguidor_banners").select("*").order("order_index");
      if (data) setBanners(data);
    } catch (error) { console.error("Error loading banners:", error); }
    finally { setLoadingBanners(false); }
  };

  const loadUpsells = async () => {
    setLoadingUpsells(true);
    try {
      const { data } = await supabase.from("metodo_seguidor_upsells").select("*").order("order_index");
      if (data) setUpsells(data);
    } catch (error) { console.error("Error loading upsells:", error); }
    finally { setLoadingUpsells(false); }
  };

  // Upload functions
  const uploadFile = async (file: File, folder: string, id?: string) => {
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${folder}-${id || "new"}-${Date.now()}.${ext}`;
      const filePath = `${folder}/${fileName}`;
      const { error } = await supabase.storage.from("metodo-seguidor-content").upload(filePath, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data: publicData } = supabase.storage.from("metodo-seguidor-content").getPublicUrl(filePath);
      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Erro ao fazer upload");
      return null;
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, moduleId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(moduleId);
    const url = await uploadFile(file, "covers", moduleId);
    if (url) {
      if (editingModule?.id === moduleId) setEditingModule({ ...editingModule, thumbnail_url: url });
      else {
        await supabase.from("metodo_seguidor_modules").update({ thumbnail_url: url }).eq("id", moduleId);
        toast.success("Capa atualizada!");
        loadModules();
      }
    }
    setUploadingCover(null);
  };

  const handleNewModuleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover("new");
    const url = await uploadFile(file, "covers");
    if (url) setNewModule({ ...newModule, thumbnail_url: url });
    setUploadingCover(null);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, bannerId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(bannerId || "new");
    const url = await uploadFile(file, "banners", bannerId);
    if (url) {
      if (bannerId && editingBanner?.id === bannerId) setEditingBanner({ ...editingBanner, image_url: url });
      else if (!bannerId) setNewBanner({ ...newBanner, image_url: url });
      else {
        await supabase.from("metodo_seguidor_banners").update({ image_url: url }).eq("id", bannerId);
        toast.success("Banner atualizado!");
        loadBanners();
      }
    }
    setUploadingBanner(null);
  };

  const handleUpsellThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>, upsellId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingUpsellThumb(upsellId || "new");
    const url = await uploadFile(file, "upsells", upsellId);
    if (url) {
      if (upsellId && editingUpsell?.id === upsellId) setEditingUpsell({ ...editingUpsell, thumbnail_url: url });
      else if (!upsellId) setNewUpsell({ ...newUpsell, thumbnail_url: url });
    }
    setUploadingUpsellThumb(null);
  };

  // Backup functions
  const checkLastBackup = async () => {
    try {
      const { data } = await supabase.storage.from("metodo-seguidor-backup").list("", { limit: 1, sortBy: { column: "created_at", order: "desc" } });
      if (data && data.length > 0) setLastBackup(data[0].created_at);
    } catch (error) { console.error("Error checking backup:", error); }
  };

  const createBackup = async () => {
    setBackupLoading(true);
    try {
      const { data: modulesData } = await supabase.from("metodo_seguidor_modules").select("*").order("order_index");
      const { data: videosData } = await supabase.from("metodo_seguidor_videos").select("*").order("order_index");
      const { data: bannersData } = await supabase.from("metodo_seguidor_banners").select("*").order("order_index");
      const { data: upsellsData } = await supabase.from("metodo_seguidor_upsells").select("*").order("order_index");
      const { data: usersData } = await supabase.functions.invoke("metodo-seguidor-admin-data", { body: { action: "get-users" } });
      const { data: ordersData } = await supabase.functions.invoke("metodo-seguidor-admin-data", { body: { action: "get-orders" } });

      const backupData = {
        timestamp: new Date().toISOString(),
        modules: modulesData || [],
        videos: videosData || [],
        banners: bannersData || [],
        upsells: upsellsData || [],
        users: usersData?.users || [],
        orders: ordersData?.orders || []
      };

      const fileName = `backup-${new Date().toISOString().split("T")[0]}-${Date.now()}.json`;
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const { error } = await supabase.storage.from("metodo-seguidor-backup").upload(fileName, blob, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      toast.success("Backup criado com sucesso!");
      checkLastBackup();
    } catch (error) { console.error("Error creating backup:", error); toast.error("Erro ao criar backup"); }
    finally { setBackupLoading(false); }
  };

  // CRUD functions
  const createModule = async () => {
    if (!newModule.title) { toast.error("Título é obrigatório"); return; }
    try {
      const { error } = await supabase.from("metodo_seguidor_modules").insert({ ...newModule, order_index: modules.length });
      if (error) throw error;
      toast.success("Módulo criado!");
      setNewModule({ title: "", description: "", thumbnail_url: "" });
      setShowNewModule(false);
      loadModules();
    } catch (error) { toast.error("Erro ao criar módulo"); }
  };

  const updateModule = async (module: any) => {
    try {
      const { error } = await supabase.from("metodo_seguidor_modules").update({ title: module.title, description: module.description, thumbnail_url: module.thumbnail_url }).eq("id", module.id);
      if (error) throw error;
      toast.success("Módulo atualizado!");
      setEditingModule(null);
      loadModules();
    } catch (error) { toast.error("Erro ao atualizar módulo"); }
  };

  const deleteModule = async (id: string) => {
    if (!confirm("Isso excluirá o módulo e todos os vídeos. Continuar?")) return;
    try {
      const { error } = await supabase.from("metodo_seguidor_modules").delete().eq("id", id);
      if (error) throw error;
      toast.success("Módulo excluído!");
      loadModules();
      loadVideos();
    } catch (error) { toast.error("Erro ao excluir módulo"); }
  };

  const createVideo = async () => {
    if (!newVideo.module_id || !newVideo.title || !newVideo.video_url) { toast.error("Módulo, título e URL são obrigatórios"); return; }
    try {
      const moduleVideos = videos.filter(v => v.module_id === newVideo.module_id);
      const { error } = await supabase.from("metodo_seguidor_videos").insert({ ...newVideo, order_index: moduleVideos.length });
      if (error) throw error;
      toast.success("Vídeo criado!");
      setNewVideo({ module_id: "", title: "", description: "", video_url: "", video_type: "youtube", thumbnail_url: "", duration: "", show_title: true, show_number: true, show_play_button: true });
      setShowNewVideo(false);
      loadVideos();
    } catch (error) { toast.error("Erro ao criar vídeo"); }
  };

  const updateVideo = async (video: any) => {
    try {
      const { error } = await supabase.from("metodo_seguidor_videos").update({ title: video.title, description: video.description, video_url: video.video_url, video_type: video.video_type, thumbnail_url: video.thumbnail_url, duration: video.duration, show_title: video.show_title, show_number: video.show_number, show_play_button: video.show_play_button }).eq("id", video.id);
      if (error) throw error;
      toast.success("Vídeo atualizado!");
      setEditingVideo(null);
      loadVideos();
    } catch (error) { toast.error("Erro ao atualizar vídeo"); }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("Excluir este vídeo?")) return;
    try {
      const { error } = await supabase.from("metodo_seguidor_videos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Vídeo excluído!");
      loadVideos();
    } catch (error) { toast.error("Erro ao excluir vídeo"); }
  };

  const createBanner = async () => {
    if (!newBanner.image_url) { toast.error("Imagem é obrigatória"); return; }
    try {
      const { error } = await supabase.from("metodo_seguidor_banners").insert({ ...newBanner, order_index: banners.length });
      if (error) throw error;
      toast.success("Banner criado!");
      setNewBanner({ title: "", description: "", image_url: "", link_url: "", link_text: "" });
      setShowNewBanner(false);
      loadBanners();
    } catch (error) { toast.error("Erro ao criar banner"); }
  };

  const updateBanner = async (banner: any) => {
    try {
      const { error } = await supabase.from("metodo_seguidor_banners").update({ title: banner.title, description: banner.description, image_url: banner.image_url, link_url: banner.link_url, link_text: banner.link_text, is_active: banner.is_active }).eq("id", banner.id);
      if (error) throw error;
      toast.success("Banner atualizado!");
      setEditingBanner(null);
      loadBanners();
    } catch (error) { toast.error("Erro ao atualizar banner"); }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Excluir este banner?")) return;
    try {
      const { error } = await supabase.from("metodo_seguidor_banners").delete().eq("id", id);
      if (error) throw error;
      toast.success("Banner excluído!");
      loadBanners();
    } catch (error) { toast.error("Erro ao excluir banner"); }
  };

  const createUpsell = async () => {
    if (!newUpsell.module_id || !newUpsell.title || !newUpsell.button_url) { toast.error("Módulo, título e URL são obrigatórios"); return; }
    try {
      const moduleUpsells = upsells.filter(u => u.module_id === newUpsell.module_id);
      const { error } = await supabase.from("metodo_seguidor_upsells").insert({ ...newUpsell, order_index: moduleUpsells.length });
      if (error) throw error;
      toast.success("Upsell criado!");
      setNewUpsell({ module_id: "", title: "", description: "", thumbnail_url: "", button_text: "Saiba Mais", button_url: "", price: "", original_price: "", show_after_days: 2 });
      setShowNewUpsell(false);
      loadUpsells();
    } catch (error) { toast.error("Erro ao criar upsell"); }
  };

  const updateUpsell = async (upsell: any) => {
    try {
      const { error } = await supabase.from("metodo_seguidor_upsells").update({ title: upsell.title, description: upsell.description, thumbnail_url: upsell.thumbnail_url, button_text: upsell.button_text, button_url: upsell.button_url, price: upsell.price, original_price: upsell.original_price, show_after_days: upsell.show_after_days, is_active: upsell.is_active }).eq("id", upsell.id);
      if (error) throw error;
      toast.success("Upsell atualizado!");
      setEditingUpsell(null);
      loadUpsells();
    } catch (error) { toast.error("Erro ao atualizar upsell"); }
  };

  const deleteUpsell = async (id: string) => {
    if (!confirm("Excluir este upsell?")) return;
    try {
      const { error } = await supabase.from("metodo_seguidor_upsells").delete().eq("id", id);
      if (error) throw error;
      toast.success("Upsell excluído!");
      loadUpsells();
    } catch (error) { toast.error("Erro ao excluir upsell"); }
  };

  const copyCredentials = (user: any) => {
    const text = `🔐 *Acesso Método de Correção MRO*\n\n👤 Usuário: ${user.username}\n🔑 Senha: ${user.password}\n\n🔗 Link: https://maisresultadosonline.com.br/metodoseguidormembro`;
    navigator.clipboard.writeText(text);
    toast.success("Credenciais copiadas!");
  };

  const filteredOrders = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    paid: orders.filter(o => o.status === "paid").length,
    expired: orders.filter(o => o.status === "expired").length,
    totalRevenue: orders.filter(o => o.status === "paid").reduce((acc, o) => acc + (o.amount || 0), 0)
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logoMro} alt="MRO" className="h-16 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white">Admin - Método Seguidor</h1>
          </div>
          <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-800 border-gray-700 text-white" required />
            <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-800 border-gray-700 text-white" required />
            <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoMro} alt="MRO" className="h-10" />
            <span className="text-gray-400 hidden md:block">Admin Método Seguidor</span>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 bg-black/50 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {[
            { id: "users", label: "Usuários", icon: Users },
            { id: "modules", label: "Módulos", icon: BookOpen },
            { id: "videos", label: "Vídeos", icon: Video },
            { id: "banners", label: "Banners", icon: Layers },
            { id: "upsells", label: "Upsells", icon: ShoppingBag },
            { id: "backup", label: "Backup", icon: Database }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-amber-500 text-amber-400" : "border-transparent text-gray-400 hover:text-white"}`}>
              <tab.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-400 text-sm">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-400 text-sm">Pagos</p>
                <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">Expirados</p>
                <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-amber-400 text-sm">Receita</p>
                <p className="text-2xl font-bold text-amber-400">R$ {stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Button onClick={loadUsers} variant="outline" size="sm" className="border-gray-700">
                <RefreshCw className="w-4 h-4 mr-2" />Atualizar
              </Button>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 text-sm">
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="paid">Pagos</option>
                <option value="expired">Expirados</option>
              </select>
            </div>

            {loadingUsers ? (
              <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" /></div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="text-left p-3 text-gray-400">Email/Produto</th>
                        <th className="text-left p-3 text-gray-400">Instagram</th>
                        <th className="text-left p-3 text-gray-400">Valor</th>
                        <th className="text-left p-3 text-gray-400">Status</th>
                        <th className="text-left p-3 text-gray-400">Verificação</th>
                        <th className="text-left p-3 text-gray-400">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredOrders.map(order => {
                        const user = users.find(u => u.id === order.user_id);
                        const createdAt = new Date(order.created_at);
                        const now = new Date();
                        const fifteenMinutesMs = 15 * 60 * 1000;
                        const timeElapsed = now.getTime() - createdAt.getTime();
                        const timeRemaining = Math.max(0, fifteenMinutesMs - timeElapsed);
                        const minutesRemaining = Math.ceil(timeRemaining / 60000);
                        const isExpiringSoon = order.status === "pending" && minutesRemaining <= 5;
                        const lastCheck = order.updated_at ? new Date(order.updated_at) : null;
                        
                        return (
                          <tr key={order.id} className="hover:bg-gray-800/50">
                            <td className="p-3">
                              <div className="max-w-[200px]">
                                <div className="truncate text-white">{order.email}</div>
                                <div className="text-xs text-gray-500 truncate">MTSEG_{order.email}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              {order.instagram_username ? (
                                <a href={order.instagram_username.startsWith("http") ? order.instagram_username : `https://instagram.com/${order.instagram_username}`} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline truncate block max-w-[200px]">
                                  @{order.instagram_username.includes("instagram.com") ? order.instagram_username.split("/").pop() : order.instagram_username}
                                </a>
                              ) : <span className="text-gray-500">-</span>}
                            </td>
                            <td className="p-3">R$ {(order.amount || 0).toFixed(2)}</td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "paid" ? "bg-green-500/20 text-green-400" : order.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                                  {order.status === "paid" ? "Pago" : order.status === "pending" ? "Pendente" : "Expirado"}
                                </span>
                                {order.status === "pending" && (
                                  <div className={`text-xs ${isExpiringSoon ? "text-red-400" : "text-gray-500"}`}>
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {minutesRemaining > 0 ? `${minutesRemaining} min restantes` : "Expirando..."}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-xs">
                                <div className="text-gray-400">
                                  Criado: {createdAt.toLocaleDateString("pt-BR")} {createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </div>
                                {lastCheck && order.status === "pending" && (
                                  <div className="text-blue-400">
                                    <RefreshCw className="w-3 h-3 inline mr-1" />
                                    Última: {lastCheck.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                  </div>
                                )}
                                {order.paid_at && (
                                  <div className="text-green-400">
                                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                    Pago: {new Date(order.paid_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                                  {user && order.status === "paid" && (
                                    <DropdownMenuItem onClick={() => copyCredentials(user)} className="text-amber-400 cursor-pointer">
                                      <Copy className="w-4 h-4 mr-2" />Copiar Acesso
                                    </DropdownMenuItem>
                                  )}
                                  {user && order.status === "paid" && (
                                    <DropdownMenuItem onClick={() => handleResendEmail(user.id)} className="text-blue-400 cursor-pointer">
                                      <Mail className="w-4 h-4 mr-2" />Reenviar Email
                                    </DropdownMenuItem>
                                  )}
                                  {user && order.status !== "paid" && (
                                    <DropdownMenuItem onClick={() => handleActivateUser(user.id)} className="text-green-400 cursor-pointer">
                                      <UserCheck className="w-4 h-4 mr-2" />Ativar Usuário
                                    </DropdownMenuItem>
                                  )}
                                  {user && (
                                    <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-400 cursor-pointer">
                                      <Trash2 className="w-4 h-4 mr-2" />Excluir Usuário
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredOrders.length === 0 && (<tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum pedido encontrado</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === "modules" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Módulos</h2>
              <Button onClick={() => setShowNewModule(true)} className="bg-amber-500 hover:bg-amber-600 text-black">
                <Plus className="w-5 h-5 mr-2" />Novo Módulo
              </Button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <p className="text-blue-400 text-sm"><Image className="w-4 h-4 inline mr-2" />Capas 1080x1920 (vertical) estilo Netflix</p>
            </div>

            {showNewModule && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
                <h3 className="font-bold mb-4">Criar Módulo</h3>
                <div className="space-y-3">
                  <Input placeholder="Título do módulo" value={newModule.title} onChange={(e) => setNewModule({ ...newModule, title: e.target.value })} className="bg-gray-800 border-gray-700" />
                  <Textarea placeholder="Descrição (opcional)" value={newModule.description} onChange={(e) => setNewModule({ ...newModule, description: e.target.value })} className="bg-gray-800 border-gray-700" />
                  <div className="flex gap-2">
                    <Input placeholder="URL da capa ou upload" value={newModule.thumbnail_url} onChange={(e) => setNewModule({ ...newModule, thumbnail_url: e.target.value })} className="bg-gray-800 border-gray-700 flex-1" />
                    <input ref={newCoverInputRef} type="file" accept="image/*" onChange={handleNewModuleCoverUpload} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => newCoverInputRef.current?.click()} disabled={uploadingCover === "new"} className="border-gray-700">
                      {uploadingCover === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                  {newModule.thumbnail_url && <img src={newModule.thumbnail_url} alt="Preview" className="h-32 w-auto object-cover rounded-lg" />}
                  <div className="flex gap-2">
                    <Button onClick={createModule} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-2" />Salvar</Button>
                    <Button onClick={() => setShowNewModule(false)} variant="ghost"><X className="w-4 h-4 mr-2" />Cancelar</Button>
                  </div>
                </div>
              </div>
            )}

            {loadingModules ? (
              <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" /></div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module, index) => (
                  <div key={module.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="aspect-[9/16] max-h-64 bg-gray-800 relative group">
                      {module.thumbnail_url ? <img src={module.thumbnail_url} alt={module.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-gray-600" /></div>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handleCoverUpload(e, module.id)} className="hidden" />
                        <Button size="sm" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover === module.id} className="bg-amber-500 hover:bg-amber-600 text-black">
                          {uploadingCover === module.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}Upload
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      {editingModule?.id === module.id ? (
                        <div className="space-y-3">
                          <Input value={editingModule.title} onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })} className="bg-gray-800 border-gray-700" />
                          <Textarea value={editingModule.description || ""} onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })} className="bg-gray-800 border-gray-700" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateModule(editingModule)} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-1" />Salvar</Button>
                            <Button size="sm" onClick={() => setEditingModule(null)} variant="ghost">Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-amber-400 text-sm font-medium">Módulo {index + 1}</span>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditingModule(module)}><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteModule(module.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                          <h3 className="font-bold text-lg">{module.title}</h3>
                          {module.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{module.description}</p>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {modules.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">Nenhum módulo criado ainda</div>}
              </div>
            )}
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === "videos" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Vídeos</h2>
              <Button onClick={() => setShowNewVideo(true)} className="bg-amber-500 hover:bg-amber-600 text-black" disabled={modules.length === 0}>
                <Plus className="w-5 h-5 mr-2" />Novo Vídeo
              </Button>
            </div>

            {modules.length === 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-center">
                <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-yellow-400">Crie um módulo primeiro</p>
              </div>
            )}

            {showNewVideo && modules.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
                <h3 className="font-bold mb-4">Adicionar Vídeo</h3>
                <div className="space-y-3">
                  <select value={newVideo.module_id} onChange={(e) => setNewVideo({ ...newVideo, module_id: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2">
                    <option value="">Selecione o módulo</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                  <Input placeholder="Título" value={newVideo.title} onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })} className="bg-gray-800 border-gray-700" />
                  <Textarea placeholder="Descrição" value={newVideo.description} onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })} className="bg-gray-800 border-gray-700" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newVideo.video_type} onChange={(e) => setNewVideo({ ...newVideo, video_type: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg p-2">
                      <option value="youtube">YouTube</option>
                      <option value="upload">Upload</option>
                    </select>
                    <Input placeholder="Duração (10:30)" value={newVideo.duration} onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })} className="bg-gray-800 border-gray-700" />
                  </div>
                  <Input placeholder="URL do vídeo" value={newVideo.video_url} onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })} className="bg-gray-800 border-gray-700" />
                  
                  {/* Thumbnail Upload - Arquivo ou Link */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Capa do vídeo (1080x1920)</label>
                    <div className="flex gap-2">
                      <Input placeholder="URL da capa ou faça upload" value={newVideo.thumbnail_url} onChange={(e) => setNewVideo({ ...newVideo, thumbnail_url: e.target.value })} className="bg-gray-800 border-gray-700 flex-1" />
                      <input type="file" accept="image/*" className="hidden" id="new-video-thumb" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingVideoThumb("new");
                        try {
                          const ext = file.name.split(".").pop();
                          const fileName = `video-thumb-${Date.now()}.${ext}`;
                          const { error } = await supabase.storage.from("metodo-seguidor-content").upload(`video-thumbnails/${fileName}`, file);
                          if (error) throw error;
                          const { data } = supabase.storage.from("metodo-seguidor-content").getPublicUrl(`video-thumbnails/${fileName}`);
                          setNewVideo({ ...newVideo, thumbnail_url: data.publicUrl });
                          toast.success("Capa enviada!");
                        } catch (err) { toast.error("Erro ao enviar capa"); }
                        setUploadingVideoThumb(null);
                      }} />
                      <Button type="button" variant="outline" onClick={() => document.getElementById("new-video-thumb")?.click()} disabled={uploadingVideoThumb === "new"} className="border-gray-700">
                        {uploadingVideoThumb === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </Button>
                    </div>
                    {newVideo.thumbnail_url && <img src={newVideo.thumbnail_url} alt="Preview" className="h-32 w-auto object-cover rounded-lg" />}
                  </div>

                  {/* Display Options */}
                  <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                    <p className="text-sm text-gray-400 font-medium">Opções de exibição na capa:</p>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newVideo.show_title} onChange={(e) => setNewVideo({ ...newVideo, show_title: e.target.checked })} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-500" />
                        <span className="text-sm">Mostrar título</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newVideo.show_number} onChange={(e) => setNewVideo({ ...newVideo, show_number: e.target.checked })} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-500" />
                        <span className="text-sm">Mostrar numeração</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newVideo.show_play_button} onChange={(e) => setNewVideo({ ...newVideo, show_play_button: e.target.checked })} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-500" />
                        <span className="text-sm">Mostrar botão play</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={createVideo} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-2" />Salvar</Button>
                    <Button onClick={() => setShowNewVideo(false)} variant="ghost"><X className="w-4 h-4 mr-2" />Cancelar</Button>
                  </div>
                </div>
              </div>
            )}

            {loadingVideos ? (
              <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" /></div>
            ) : (
              <div className="space-y-4">
                {modules.map(module => {
                  const moduleVideos = videos.filter(v => v.module_id === module.id);
                  const isExpanded = expandedModules.includes(module.id);
                  return (
                    <div key={module.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                      <button onClick={() => setExpandedModules(prev => prev.includes(module.id) ? prev.filter(id => id !== module.id) : [...prev, module.id])} className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-amber-400" />
                          <span className="font-bold">{module.title}</span>
                          <span className="text-gray-500 text-sm">({moduleVideos.length} vídeos)</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-gray-800 p-4 space-y-3">
                          {moduleVideos.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhum vídeo</p>
                          ) : (
                            moduleVideos.map((video, index) => (
                              <div key={video.id} className="bg-gray-800/50 rounded-lg p-3">
                                {editingVideo?.id === video.id ? (
                                  <div className="space-y-3">
                                    <Input value={editingVideo.title} onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })} className="bg-gray-700 border-gray-600" />
                                    <Input value={editingVideo.video_url} onChange={(e) => setEditingVideo({ ...editingVideo, video_url: e.target.value })} className="bg-gray-700 border-gray-600" />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => updateVideo(editingVideo)} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-1" />Salvar</Button>
                                      <Button size="sm" variant="ghost" onClick={() => setEditingVideo(null)}>Cancelar</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className="text-gray-500 text-sm">#{index + 1}</span>
                                      <p className="font-medium">{video.title}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="ghost" onClick={() => setEditingVideo(video)}><Edit className="w-4 h-4" /></Button>
                                      <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteVideo(video.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Banners Tab */}
        {activeTab === "banners" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Banners Slide (1920x1080)</h2>
              <Button onClick={() => setShowNewBanner(true)} className="bg-amber-500 hover:bg-amber-600 text-black">
                <Plus className="w-5 h-5 mr-2" />Novo Banner
              </Button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <p className="text-blue-400 text-sm"><Image className="w-4 h-4 inline mr-2" />Banners 1920x1080 (horizontal) para carrossel automático na área de membros</p>
            </div>

            {showNewBanner && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
                <h3 className="font-bold mb-4">Criar Banner</h3>
                <div className="space-y-3">
                  <Input placeholder="Título (opcional)" value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} className="bg-gray-800 border-gray-700" />
                  <Textarea placeholder="Descrição (opcional)" value={newBanner.description} onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })} className="bg-gray-800 border-gray-700" />
                  <div className="flex gap-2">
                    <Input placeholder="URL da imagem ou upload" value={newBanner.image_url} onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })} className="bg-gray-800 border-gray-700 flex-1" />
                    <input ref={newBannerInputRef} type="file" accept="image/*" onChange={(e) => handleBannerUpload(e)} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => newBannerInputRef.current?.click()} disabled={uploadingBanner === "new"} className="border-gray-700">
                      {uploadingBanner === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                  {newBanner.image_url && <img src={newBanner.image_url} alt="Preview" className="h-32 w-auto object-cover rounded-lg" />}
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="URL do link (opcional)" value={newBanner.link_url} onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })} className="bg-gray-800 border-gray-700" />
                    <Input placeholder="Texto do botão (opcional)" value={newBanner.link_text} onChange={(e) => setNewBanner({ ...newBanner, link_text: e.target.value })} className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createBanner} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-2" />Salvar</Button>
                    <Button onClick={() => setShowNewBanner(false)} variant="ghost"><X className="w-4 h-4 mr-2" />Cancelar</Button>
                  </div>
                </div>
              </div>
            )}

            {loadingBanners ? (
              <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" /></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {banners.map((banner, index) => (
                  <div key={banner.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="aspect-video bg-gray-800 relative group">
                      {banner.image_url ? <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-gray-600" /></div>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <input ref={bannerInputRef} type="file" accept="image/*" onChange={(e) => handleBannerUpload(e, banner.id)} className="hidden" />
                        <Button size="sm" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner === banner.id} className="bg-amber-500 hover:bg-amber-600 text-black">
                          {uploadingBanner === banner.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}Trocar
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      {editingBanner?.id === banner.id ? (
                        <div className="space-y-3">
                          <Input value={editingBanner.title || ""} onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })} className="bg-gray-800 border-gray-700" placeholder="Título" />
                          <Input value={editingBanner.link_url || ""} onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })} className="bg-gray-800 border-gray-700" placeholder="URL do link" />
                          <Input value={editingBanner.link_text || ""} onChange={(e) => setEditingBanner({ ...editingBanner, link_text: e.target.value })} className="bg-gray-800 border-gray-700" placeholder="Texto do botão" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateBanner(editingBanner)} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-1" />Salvar</Button>
                            <Button size="sm" onClick={() => setEditingBanner(null)} variant="ghost">Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-amber-400 text-sm font-medium">Banner {index + 1}</span>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditingBanner(banner)}><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteBanner(banner.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                          {banner.title && <h3 className="font-bold">{banner.title}</h3>}
                          {banner.link_url && <p className="text-sm text-gray-400 truncate">{banner.link_url}</p>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {banners.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">Nenhum banner criado ainda</div>}
              </div>
            )}
          </div>
        )}

        {/* Upsells Tab */}
        {activeTab === "upsells" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Upsells / Order Bumps</h2>
              <Button onClick={() => setShowNewUpsell(true)} className="bg-amber-500 hover:bg-amber-600 text-black" disabled={modules.length === 0}>
                <Plus className="w-5 h-5 mr-2" />Novo Upsell
              </Button>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
              <p className="text-purple-400 text-sm"><Sparkles className="w-4 h-4 inline mr-2" />Upsells aparecem dentro dos módulos após X dias de uso. Configure produtos premium para aumentar suas vendas!</p>
            </div>

            {showNewUpsell && modules.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
                <h3 className="font-bold mb-4">Criar Upsell</h3>
                <div className="space-y-3">
                  <select value={newUpsell.module_id} onChange={(e) => setNewUpsell({ ...newUpsell, module_id: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2">
                    <option value="">Selecione o módulo</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                  <Input placeholder="Título do upsell" value={newUpsell.title} onChange={(e) => setNewUpsell({ ...newUpsell, title: e.target.value })} className="bg-gray-800 border-gray-700" />
                  <Textarea placeholder="Descrição" value={newUpsell.description} onChange={(e) => setNewUpsell({ ...newUpsell, description: e.target.value })} className="bg-gray-800 border-gray-700" />
                  <div className="flex gap-2">
                    <Input placeholder="URL thumbnail" value={newUpsell.thumbnail_url} onChange={(e) => setNewUpsell({ ...newUpsell, thumbnail_url: e.target.value })} className="bg-gray-800 border-gray-700 flex-1" />
                    <input ref={newUpsellInputRef} type="file" accept="image/*" onChange={(e) => handleUpsellThumbUpload(e)} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => newUpsellInputRef.current?.click()} disabled={uploadingUpsellThumb === "new"} className="border-gray-700">
                      {uploadingUpsellThumb === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Texto do botão" value={newUpsell.button_text} onChange={(e) => setNewUpsell({ ...newUpsell, button_text: e.target.value })} className="bg-gray-800 border-gray-700" />
                    <Input placeholder="URL do botão" value={newUpsell.button_url} onChange={(e) => setNewUpsell({ ...newUpsell, button_url: e.target.value })} className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Preço (R$49)" value={newUpsell.price} onChange={(e) => setNewUpsell({ ...newUpsell, price: e.target.value })} className="bg-gray-800 border-gray-700" />
                    <Input placeholder="Preço original" value={newUpsell.original_price} onChange={(e) => setNewUpsell({ ...newUpsell, original_price: e.target.value })} className="bg-gray-800 border-gray-700" />
                    <Input type="number" placeholder="Dias para aparecer" value={newUpsell.show_after_days} onChange={(e) => setNewUpsell({ ...newUpsell, show_after_days: parseInt(e.target.value) || 2 })} className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createUpsell} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-2" />Salvar</Button>
                    <Button onClick={() => setShowNewUpsell(false)} variant="ghost"><X className="w-4 h-4 mr-2" />Cancelar</Button>
                  </div>
                </div>
              </div>
            )}

            {loadingUpsells ? (
              <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" /></div>
            ) : (
              <div className="space-y-4">
                {modules.map(module => {
                  const moduleUpsells = upsells.filter(u => u.module_id === module.id);
                  if (moduleUpsells.length === 0) return null;
                  return (
                    <div key={module.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <h3 className="font-bold text-amber-400 mb-4">{module.title}</h3>
                      <div className="space-y-3">
                        {moduleUpsells.map(upsell => (
                          <div key={upsell.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center gap-4">
                            {upsell.thumbnail_url && <img src={upsell.thumbnail_url} alt={upsell.title} className="w-20 h-20 object-cover rounded-lg" />}
                            <div className="flex-1">
                              <h4 className="font-bold">{upsell.title}</h4>
                              <p className="text-sm text-gray-400">{upsell.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {upsell.original_price && <span className="text-gray-500 line-through text-sm">{upsell.original_price}</span>}
                                {upsell.price && <span className="text-green-400 font-bold">{upsell.price}</span>}
                                <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">Após {upsell.show_after_days} dias</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingUpsell(upsell)}><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteUpsell(upsell.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {upsells.length === 0 && <div className="text-center py-10 text-gray-500">Nenhum upsell criado ainda</div>}
              </div>
            )}
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === "backup" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6">Backup da Área de Membros</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Database className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Criar Backup</h3>
                  <p className="text-gray-400 text-sm">Salva todos os dados em nuvem separada</p>
                </div>
              </div>
              {lastBackup && (
                <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-400"><Clock className="w-4 h-4 inline mr-2" />Último backup: {new Date(lastBackup).toLocaleString("pt-BR")}</p>
                </div>
              )}
              <Button onClick={createBackup} disabled={backupLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-black">
                {backupLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Criando...</> : <><Download className="w-5 h-5 mr-2" />Criar Backup Agora</>}
              </Button>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
              <h4 className="font-bold text-blue-400 mb-2">Inclui:</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li><CheckCircle2 className="w-4 h-4 text-green-400 inline mr-2" />Módulos e vídeos</li>
                <li><CheckCircle2 className="w-4 h-4 text-green-400 inline mr-2" />Banners e upsells</li>
                <li><CheckCircle2 className="w-4 h-4 text-green-400 inline mr-2" />Usuários e pedidos</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetodoSeguidorAdmin;
