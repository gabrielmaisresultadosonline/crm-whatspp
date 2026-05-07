import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, Trash2, Eye, EyeOff, Users, Layers, LogOut, RefreshCw, Search, AlertTriangle, Filter, ShoppingCart, CheckCircle, Clock, XCircle, Copy, Loader2, Pencil, Save, X, Image, Mail, Send } from "lucide-react";
import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface PromptItem {
  id: string;
  folder_name: string;
  prompt_text: string;
  image_url: string | null;
  is_active: boolean;
  order_index: number;
  category: string;
  created_at: string;
}

interface PromptUser {
  id: string;
  name: string;
  email: string;
  status: string;
  last_access: string | null;
  created_at: string;
}

interface PromptOrder {
  id: string;
  email: string;
  amount: number;
  status: string;
  nsu_order: string;
  infinitepay_link: string | null;
  paid_at: string | null;
  expired_at: string | null;
  user_id: string | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
    is_paid: boolean;
    subscription_end: string | null;
  } | null;
}

const CATEGORIES = [
  { value: 'feminino', label: '👩 Feminino', color: 'pink' },
  { value: 'masculino', label: '👨 Masculino', color: 'blue' },
  { value: 'geral', label: '🌐 Geral', color: 'purple' },
  { value: 'empresarial', label: '🏢 Empresarial', color: 'amber' },
];

const callAdmin = async (action: string, body?: any) => {
  const isFormData = body instanceof FormData;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/prompts-mro-admin?action=${action}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

const PromptsMROAdmin = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"prompts" | "users" | "vendas">("prompts");
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [users, setUsers] = useState<PromptUser[]>([]);
  const [orders, setOrders] = useState<PromptOrder[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadCategory, setUploadCategory] = useState("feminino");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [lastVerification, setLastVerification] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editFolderName, setEditFolderName] = useState("");
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const editImageRef = useRef<HTMLInputElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Individual prompt creation
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [newPromptCategory, setNewPromptCategory] = useState("empresarial");
  const [newPromptImage, setNewPromptImage] = useState<File | null>(null);
  const [newPromptImagePreview, setNewPromptImagePreview] = useState<string | null>(null);
  const [creatingPrompt, setCreatingPrompt] = useState(false);
  const newPromptImageRef = useRef<HTMLInputElement>(null);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    const data = await callAdmin('get-prompts');
    if (data.prompts) setPrompts(data.prompts);
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    const data = await callAdmin('get-users');
    if (data.users) setUsers(data.users);
  }, []);

  const loadOrders = useCallback(async () => {
    const data = await callAdmin('get-orders');
    if (data.orders) setOrders(data.orders);
  }, []);

  // Auto-verify pending orders every 8 seconds
  useEffect(() => {
    if (!isAuth || tab !== "vendas") {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      return;
    }

    const verifyPending = async () => {
      const pendingOrders = orders.filter(o => o.status === "pending");
      for (const order of pendingOrders) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/check-prompts-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
            body: JSON.stringify({ nsu_order: order.nsu_order }),
          });
        } catch {}
      }
      if (pendingOrders.length > 0) {
        setLastVerification(new Date().toLocaleTimeString("pt-BR"));
        loadOrders();
      }
    };

    checkIntervalRef.current = setInterval(verifyPending, 8000);
    return () => { if (checkIntervalRef.current) clearInterval(checkIntervalRef.current); };
  }, [isAuth, tab, orders, loadOrders]);

  useEffect(() => {
    if (isAuth) {
      loadPrompts();
      loadUsers();
      loadOrders();
    }
  }, [isAuth, loadPrompts, loadUsers, loadOrders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await callAdmin('login', { email, password });
    if (data.success) {
      setIsAuth(true);
      toast.success("Login realizado!");
    } else {
      toast.error("Credenciais inválidas");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      toast.error("Envie apenas arquivos .zip");
      return;
    }

    setUploading(true);
    setUploadPercent(0);
    setUploadProgress("Lendo arquivo ZIP...");

    try {
      // Step 1: Read and extract ZIP client-side
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      setUploadProgress("Analisando pastas...");

      // Detect root wrapper folder
      const allPaths = Object.keys(zip.files);
      const topLevel = new Set<string>();
      for (const path of allPaths) {
        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 1) topLevel.add(parts[0]);
      }
      let rootPrefix = '';
      if (topLevel.size === 1) {
        rootPrefix = [...topLevel][0] + '/';
      }

      // Group files by folder
      const folders: Record<string, { image?: { name: string; data: Uint8Array; ext: string }; text?: string }> = {};

      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        let cleanPath = path;
        if (rootPrefix && cleanPath.startsWith(rootPrefix)) {
          cleanPath = cleanPath.slice(rootPrefix.length);
        }
        const parts = cleanPath.split('/').filter(Boolean);
        if (parts.length < 2) continue;

        const folderName = parts[0];
        const fileName = parts[parts.length - 1].toLowerCase();
        if (!folders[folderName]) folders[folderName] = {};

        if (fileName.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
          const data = await zipEntry.async('uint8array');
          const ext = fileName.split('.').pop()!;
          folders[folderName].image = { name: fileName, data, ext };
        } else if (fileName.endsWith('.txt')) {
          const rawData = await zipEntry.async('uint8array');
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(rawData);
          folders[folderName].text = text.trim();
        } else if (fileName.endsWith('.pdf')) {
          try {
            const pdfData = await zipEntry.async('uint8array');
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const pageText = content.items.map((item: any) => item.str).join(' ');
              fullText += pageText + '\n';
            }
            const cleanText = fullText.trim();
            folders[folderName].text = cleanText.length > 5 ? cleanText : `Prompt: ${folderName}`;
          } catch (pdfErr) {
            console.warn(`Erro ao ler PDF de ${folderName}:`, pdfErr);
            folders[folderName].text = `Prompt: ${folderName}`;
          }
        } else if (fileName.endsWith('.docx')) {
          try {
            const docxData = await zipEntry.async('uint8array');
            const docxZip = await JSZip.loadAsync(docxData);
            const xmlContent = await docxZip.file('word/document.xml')?.async('string');
            if (xmlContent) {
              // Strip XML tags to get plain text
              const text = xmlContent
                .replace(/<\/w:p>/g, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .trim();
              folders[folderName].text = text.length > 5 ? text : `Prompt: ${folderName}`;
            }
          } catch (docxErr) {
            console.warn(`Erro ao ler DOCX de ${folderName}:`, docxErr);
            folders[folderName].text = `Prompt: ${folderName}`;
          }
        } else if (fileName.endsWith('.xml')) {
          try {
            const rawData = await zipEntry.async('uint8array');
            const decoder = new TextDecoder('utf-8');
            const xmlText = decoder.decode(rawData);
            // Strip XML tags to get plain text content
            const text = xmlText
              .replace(/<[^>]+>/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/\s+/g, ' ')
              .trim();
            folders[folderName].text = text.length > 5 ? text : `Prompt: ${folderName}`;
          } catch (xmlErr) {
            console.warn(`Erro ao ler XML de ${folderName}:`, xmlErr);
            folders[folderName].text = `Prompt: ${folderName}`;
          }
        }
      }

      const entries = Object.entries(folders).filter(([, c]) => c.text || c.image);
      const total = entries.length;

      if (total === 0) {
        toast.error("Nenhum prompt encontrado no ZIP");
        setUploading(false);
        setUploadProgress("");
        setUploadPercent(0);
        e.target.value = "";
        return;
      }

      // Step 2: Upload each prompt individually
      let processed = 0;
      let errors = 0;

      for (const [folderName, content] of entries) {
        processed++;
        const percent = Math.round((processed / total) * 100);
        setUploadPercent(percent);
        setUploadProgress(`Processando ${processed} de ${total} prompts...`);

        try {
          let imageUrl: string | null = null;

          // Upload image to storage via edge function
          if (content.image) {
            const imgFormData = new FormData();
            const blob = new Blob([new Uint8Array(content.image.data)], { 
              type: `image/${content.image.ext === 'jpg' ? 'jpeg' : content.image.ext}` 
            });
            imgFormData.append('file', blob, `${folderName}.${content.image.ext}`);
            imgFormData.append('folder', folderName);

            const imgRes = await fetch(`${SUPABASE_URL}/functions/v1/prompts-mro-admin?action=upload-image`, {
              method: 'POST',
              headers: { 'apikey': SUPABASE_KEY },
              body: imgFormData,
            });
            const imgData = await imgRes.json();
            if (imgData.url) imageUrl = imgData.url;
          }

          // Insert prompt record
          await callAdmin('insert-prompt', {
            folder_name: folderName,
            prompt_text: content.text || `Prompt: ${folderName}`,
            image_url: imageUrl,
            category: uploadCategory,
          });
        } catch {
          errors++;
        }
      }

      setUploadPercent(100);
      setUploadProgress('Concluído!');
      toast.success(`${processed - errors} prompts (${uploadCategory}) processados de ${total} pastas!${errors > 0 ? ` ${errors} erros.` : ''}`);
      loadPrompts();
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar arquivo ZIP");
    }

    setTimeout(() => {
      setUploading(false);
      setUploadProgress("");
      setUploadPercent(0);
    }, 1500);
    e.target.value = "";
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm("Deletar este prompt?")) return;
    await callAdmin('delete-prompt', { id });
    setPrompts(prev => prev.filter(p => p.id !== id));
    toast.success("Prompt deletado");
  };

  const handleDeleteAll = async () => {
    if (!confirm("ATENÇÃO: Deletar TODOS os prompts? Esta ação não pode ser desfeita!")) return;
    await callAdmin('delete-all-prompts');
    setPrompts([]);
    toast.success("Todos os prompts deletados");
  };

  const handleDeleteByCategory = async (category: string) => {
    const label = category === 'masculino' ? '👨 Masculino' : '👩 Feminino';
    if (!confirm(`ATENÇÃO: Deletar TODOS os prompts da categoria ${label}? Esta ação não pode ser desfeita!`)) return;
    await callAdmin('delete-prompts-by-category', { category });
    setPrompts(prev => prev.filter(p => p.category !== category));
    toast.success(`Prompts ${label} deletados`);
  };

  const handleTogglePrompt = async (id: string, currentActive: boolean) => {
    await callAdmin('toggle-prompt', { id, is_active: !currentActive });
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentActive } : p));
  };

  const handleToggleUser = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await callAdmin('toggle-user', { id, status: newStatus });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}`);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Deletar este usuário?")) return;
    await callAdmin('delete-user', { id });
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success("Usuário deletado");
  };

  const handleGrantPlan = async (userId: string, planType: 'mensal' | 'anual') => {
    const label = planType === 'mensal' ? 'PRO Mensal (30 dias)' : 'PRO Anual (365 dias)';
    if (!confirm(`Liberar plano ${label} para este usuário?`)) return;
    try {
      const data = await callAdmin('grant-plan', { user_id: userId, plan_type: planType });
      if (data.success) {
        toast.success(`Plano ${label} liberado com sucesso!`);
        loadUsers();
      } else {
        toast.error(data.error || 'Erro ao liberar plano');
      }
    } catch {
      toast.error('Erro ao liberar plano');
    }
  };

  const startEditing = (prompt: PromptItem) => {
    setEditingId(prompt.id);
    setEditText(prompt.prompt_text);
    setEditCategory(prompt.category);
    setEditFolderName(prompt.folder_name);
    setEditImagePreview(null);
    setEditImageFile(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
    setEditCategory("");
    setEditFolderName("");
    setEditImagePreview(null);
    setEditImageFile(null);
  };

  const handleEditImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          setEditImageFile(file);
          setEditImagePreview(URL.createObjectURL(file));
        }
        break;
      }
    }
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    try {
      // Save text/category/folder_name
      await callAdmin('update-prompt', {
        id,
        prompt_text: editText,
        category: editCategory,
        folder_name: editFolderName,
      });

      // Save image if changed
      if (editImageFile) {
        const formData = new FormData();
        formData.append('file', editImageFile);
        formData.append('id', id);
        const imgRes = await fetch(`${SUPABASE_URL}/functions/v1/prompts-mro-admin?action=update-prompt-image`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY },
          body: formData,
        });
        const imgData = await imgRes.json();
        if (imgData.url) {
          setPrompts(prev => prev.map(p => p.id === id ? { ...p, image_url: imgData.url } : p));
        }
      }

      setPrompts(prev => prev.map(p => p.id === id ? {
        ...p,
        prompt_text: editText,
        category: editCategory,
        folder_name: editFolderName,
      } : p));

      cancelEditing();
      toast.success("Prompt atualizado!");
    } catch (err) {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  const handleCreateIndividualPrompt = async () => {
    if (!newPromptName.trim() || !newPromptText.trim()) {
      toast.error("Preencha o nome e o texto do prompt");
      return;
    }
    setCreatingPrompt(true);
    try {
      let imageUrl: string | null = null;
      if (newPromptImage) {
        const formData = new FormData();
        formData.append('file', newPromptImage, `${newPromptName}.${newPromptImage.name.split('.').pop()}`);
        formData.append('folder', newPromptName);
        const imgRes = await fetch(`${SUPABASE_URL}/functions/v1/prompts-mro-admin?action=upload-image`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY },
          body: formData,
        });
        const imgData = await imgRes.json();
        if (imgData.url) imageUrl = imgData.url;
      }
      await callAdmin('insert-prompt', {
        folder_name: newPromptName.trim(),
        prompt_text: newPromptText.trim(),
        image_url: imageUrl,
        category: newPromptCategory,
      });
      toast.success("Prompt criado com sucesso!");
      setNewPromptName("");
      setNewPromptText("");
      setNewPromptImage(null);
      setNewPromptImagePreview(null);
      loadPrompts();
    } catch {
      toast.error("Erro ao criar prompt");
    }
    setCreatingPrompt(false);
  };
  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.folder_name.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt_text.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = {
    all: prompts.length,
    feminino: prompts.filter(p => p.category === 'feminino').length,
    masculino: prompts.filter(p => p.category === 'masculino').length,
    geral: prompts.filter(p => p.category === 'geral').length,
    empresarial: prompts.filter(p => p.category === 'empresarial').length,
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'feminino': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-400">👩 Feminino</span>;
      case 'masculino': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">👨 Masculino</span>;
      case 'empresarial': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">🏢 Empresarial</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400">🌐 Geral</span>;
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-4">
        <div className="bg-[#111118] border border-white/10 rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-1">Prompts MRO Admin</h1>
          <p className="text-gray-500 text-sm mb-6">Acesse o painel administrativo</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
            <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-lg">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <header className="bg-[#0a0a10] border-b border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Prompts MRO <span className="text-purple-400">Admin</span></h1>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 rounded-lg p-1 flex-wrap">
              <button onClick={() => setTab("prompts")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'prompts' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Layers className="w-4 h-4 inline mr-1" /> Prompts ({prompts.length})
              </button>
              <button onClick={() => setTab("users")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'users' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Users className="w-4 h-4 inline mr-1" /> Usuários ({users.length})
              </button>
              <button onClick={() => setTab("vendas")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'vendas' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <ShoppingCart className="w-4 h-4 inline mr-1" /> Vendas ({orders.length})
              </button>
            </div>
            <button onClick={() => setIsAuth(false)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === "prompts" && (
          <div>
            {/* Upload area */}
            <div className="bg-[#111118] border border-dashed border-purple-500/30 rounded-2xl p-8 text-center mb-6">
              <Upload className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-1">Enviar arquivo ZIP com prompts</h2>
              <p className="text-gray-500 text-sm mb-4">Cada pasta dentro do ZIP será um prompt (imagem + arquivo .txt ou .pdf)</p>
              
              {/* Category selector */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-sm text-gray-400"><Filter className="w-4 h-4 inline mr-1" />Categoria do ZIP:</span>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setUploadCategory(cat.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      uploadCategory === cat.value
                        ? cat.value === 'feminino' ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                        : cat.value === 'masculino' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <label className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold cursor-pointer transition-all ${uploading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'}`}>
                <Upload className="w-5 h-5" />
                {uploading ? uploadProgress : `Enviar ZIP (${CATEGORIES.find(c => c.value === uploadCategory)?.label})`}
                <input type="file" accept=".zip" onChange={handleUploadZip} disabled={uploading} className="hidden" />
              </label>

              {/* Progress bar */}
              {uploading && (
                <div className="mt-5 w-full max-w-md mx-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{uploadProgress}</span>
                    <span className="text-purple-400 font-bold">{uploadPercent}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-300 ease-out"
                      style={{
                        width: `${uploadPercent}%`,
                        background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
                      }}
                    />
                  </div>
                </div>
              )}
              {prompts.length > 0 && (
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button onClick={() => loadPrompts()} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" /> Atualizar
                  </button>
                  <button onClick={() => handleDeleteByCategory('masculino')} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Deletar 👨 Masculino
                  </button>
                  <button onClick={() => handleDeleteByCategory('feminino')} className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Deletar 👩 Feminino
                  </button>
                  <button onClick={handleDeleteAll} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Deletar Todos
                  </button>
                </div>
              )}
            </div>

            {/* Individual prompt creation */}
            <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-400" /> Adicionar Prompt Individual
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Nome do Prompt</label>
                    <input
                      type="text"
                      value={newPromptName}
                      onChange={e => setNewPromptName(e.target.value)}
                      placeholder="Ex: Empresário no escritório"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Texto do Prompt</label>
                    <textarea
                      value={newPromptText}
                      onChange={e => setNewPromptText(e.target.value)}
                      placeholder="Cole aqui o texto completo do prompt..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Categoria</label>
                    <div className="flex gap-2 flex-wrap">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => setNewPromptCategory(cat.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            newPromptCategory === cat.value
                              ? cat.value === 'feminino' ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                              : cat.value === 'masculino' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                              : cat.value === 'empresarial' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm text-gray-400 mb-1 block">Imagem (opcional)</label>
                  <div
                    onClick={() => newPromptImageRef.current?.click()}
                    className="aspect-square max-h-64 rounded-xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-purple-500/30 transition-colors overflow-hidden"
                  >
                    {newPromptImagePreview ? (
                      <img src={newPromptImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-xs">Clique para enviar imagem</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={newPromptImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewPromptImage(file);
                        setNewPromptImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {newPromptImagePreview && (
                    <button onClick={() => { setNewPromptImage(null); setNewPromptImagePreview(null); }} className="text-xs text-red-400 hover:text-red-300">
                      Remover imagem
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={handleCreateIndividualPrompt}
                disabled={creatingPrompt || !newPromptName.trim() || !newPromptText.trim()}
                className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingPrompt ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar Prompt</>}
              </button>
            </div>

            {/* Category filter tabs */}
            {prompts.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filterCategory === 'all' ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
                >
                  Todos ({categoryCounts.all})
                </button>
                <button
                  onClick={() => setFilterCategory('feminino')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filterCategory === 'feminino' ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
                >
                  👩 Feminino ({categoryCounts.feminino})
                </button>
                <button
                  onClick={() => setFilterCategory('masculino')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filterCategory === 'masculino' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
                >
                  👨 Masculino ({categoryCounts.masculino})
                </button>
                <button
                  onClick={() => setFilterCategory('geral')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filterCategory === 'geral' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
                >
                  🌐 Geral ({categoryCounts.geral})
                </button>
                <button
                  onClick={() => setFilterCategory('empresarial')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filterCategory === 'empresarial' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
                >
                  🏢 Empresarial ({categoryCounts.empresarial})
                </button>
              </div>
            )}

            {/* Search */}
            {prompts.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type="text" placeholder="Buscar prompts..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              </div>
            )}

            {/* Prompts grid */}
            {loading ? (
              <div className="text-center py-20 text-gray-500">Carregando...</div>
            ) : filteredPrompts.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                {prompts.length === 0 ? "Nenhum prompt cadastrado. Envie um ZIP para começar." : "Nenhum resultado encontrado."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrompts.map(prompt => {
                  const isEditing = editingId === prompt.id;
                  return (
                  <div key={prompt.id} className={`bg-[#111118] border rounded-xl overflow-hidden transition-colors ${isEditing ? 'border-purple-500/50 ring-1 ring-purple-500/20' : prompt.is_active ? 'border-white/10' : 'border-red-500/20 opacity-60'}`}>
                    {/* Image area */}
                    {isEditing ? (
                      <div
                        className="aspect-square bg-black/50 flex items-center justify-center overflow-hidden relative cursor-pointer group"
                        onPaste={handleEditImagePaste}
                        onClick={() => editImageRef.current?.click()}
                        tabIndex={0}
                      >
                        <img
                          src={editImagePreview || prompt.image_url || ''}
                          alt={prompt.folder_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Image className="w-8 h-8 text-white mb-2" />
                          <span className="text-white text-xs font-medium">Clique ou Ctrl+V para trocar</span>
                        </div>
                        {editImagePreview && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Nova imagem</div>
                        )}
                        <input ref={editImageRef} type="file" accept="image/*" onChange={handleEditImageSelect} className="hidden" />
                      </div>
                    ) : prompt.image_url ? (
                      <div className="aspect-square bg-black/50 flex items-center justify-center overflow-hidden">
                        <img src={prompt.image_url} alt={prompt.folder_name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : null}

                    <div className="p-4">
                      {isEditing ? (
                        <>
                          {/* Edit folder name */}
                          <input
                            type="text"
                            value={editFolderName}
                            onChange={e => setEditFolderName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm mb-2 focus:outline-none focus:border-purple-500"
                            placeholder="Nome da pasta"
                          />
                          {/* Edit category */}
                          <div className="flex gap-1 mb-2">
                            {CATEGORIES.map(cat => (
                              <button
                                key={cat.value}
                                onClick={() => setEditCategory(cat.value)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                                  editCategory === cat.value
                                    ? cat.value === 'feminino' ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                                    : cat.value === 'masculino' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                    : 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                    : 'bg-white/5 border-white/10 text-gray-500'
                                }`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>
                          {/* Edit prompt text */}
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs mb-3 focus:outline-none focus:border-purple-500 resize-y"
                            placeholder="Texto do prompt..."
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveEdit(prompt.id)}
                              disabled={saving}
                              className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              Salvar
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-2 rounded-lg text-xs flex items-center gap-1 bg-white/5 text-gray-400 hover:bg-white/10"
                            >
                              <X className="w-3 h-3" /> Cancelar
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-sm text-purple-300 flex-1">{prompt.folder_name}</h3>
                            {getCategoryBadge(prompt.category)}
                          </div>
                          <p className="text-gray-400 text-xs line-clamp-4 mb-3 whitespace-pre-wrap">{prompt.prompt_text.substring(0, 300)}{prompt.prompt_text.length > 300 ? '...' : ''}</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEditing(prompt)} className="p-2 rounded-lg text-xs flex items-center gap-1 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
                              <Pencil className="w-3 h-3" /> Editar
                            </button>
                            <button onClick={() => handleTogglePrompt(prompt.id, prompt.is_active)} className={`p-2 rounded-lg text-xs flex items-center gap-1 ${prompt.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {prompt.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              {prompt.is_active ? 'Ativo' : 'Inativo'}
                            </button>
                            <button onClick={() => handleDeletePrompt(prompt.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "users" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Usuários Cadastrados ({users.length})</h2>
              <button onClick={loadUsers} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Atualizar
              </button>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Nenhum usuário cadastrado ainda.</div>
            ) : (
              <div className="bg-[#111118] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-left text-gray-400">
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">E-mail</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Cadastro</th>
                        <th className="px-4 py-3">Último Acesso</th>
                        <th className="px-4 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-medium">{user.name}</td>
                          <td className="px-4 py-3 text-gray-400">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {user.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3 text-gray-500">{user.last_access ? new Date(user.last_access).toLocaleDateString('pt-BR') : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                onClick={() => handleGrantPlan(user.id, 'mensal')}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 whitespace-nowrap"
                                title="Liberar PRO Mensal (30 dias)"
                              >
                                30d
                              </button>
                              <button
                                onClick={() => handleGrantPlan(user.id, 'anual')}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-green-500/10 text-green-400 hover:bg-green-500/20 whitespace-nowrap"
                                title="Liberar PRO Anual (365 dias)"
                              >
                                365d
                              </button>
                              <button onClick={() => handleToggleUser(user.id, user.status)} className={`p-1.5 rounded-lg ${user.status === 'active' ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>
                                {user.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "vendas" && (
          <div>
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold">Vendas / Pedidos ({orders.length})</h2>
              <div className="flex items-center gap-3">
                {lastVerification && (
                  <span className="text-xs text-gray-500">Última verificação: {lastVerification}</span>
                )}
                <button onClick={loadOrders} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" /> Atualizar
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total", count: orders.length, color: "text-white" },
                { label: "Pendentes", count: orders.filter(o => o.status === "pending").length, color: "text-yellow-400" },
                { label: "Pagos", count: orders.filter(o => o.status === "paid" || o.status === "completed").length, color: "text-green-400" },
                { label: "Expirados", count: orders.filter(o => o.status === "expired").length, color: "text-red-400" },
              ].map((s, i) => (
                <div key={i} className="bg-[#111118] border border-white/10 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Nenhum pedido ainda.</div>
            ) : (
              <div className="bg-[#111118] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-left text-gray-400">
                        <th className="px-4 py-3">E-mail</th>
                        <th className="px-4 py-3">Usuário</th>
                        <th className="px-4 py-3">Valor</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">NSU</th>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Pago em</th>
                        <th className="px-4 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => {
                        const isPending = order.status === "pending";
                        const isPaid = order.status === "paid";
                        const isExpired = order.status === "expired";
                        const timeLeft = isPending && order.expired_at
                          ? Math.max(0, Math.round((new Date(order.expired_at).getTime() - Date.now()) / 60000))
                          : 0;
                        const userName = order.user?.name || '—';
                        const userIsPaid = order.user?.is_paid || false;

                        return (
                          <tr key={order.id} className={`border-b border-white/5 hover:bg-white/[0.02] ${isExpired ? 'opacity-50' : ''}`}>
                            <td className="px-4 py-3 text-gray-300">{order.email}</td>
                            <td className="px-4 py-3 font-medium">
                              {userName}
                              {userIsPaid && <span className="ml-1 text-xs text-green-400">PRO</span>}
                            </td>
                            <td className="px-4 py-3 text-green-400 font-bold">R${order.amount}</td>
                            <td className="px-4 py-3">
                              {isPaid && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 flex items-center gap-1 w-fit">
                                  <CheckCircle className="w-3 h-3" /> Pago
                                </span>
                              )}
                              {isPending && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 flex items-center gap-1 w-fit">
                                  <Clock className="w-3 h-3" /> Pendente {timeLeft > 0 ? `(${timeLeft}min)` : ''}
                                </span>
                              )}
                              {isExpired && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3" /> Expirado
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">{order.nsu_order}</td>
                            <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 text-gray-500">{order.paid_at ? new Date(order.paid_at).toLocaleString('pt-BR') : '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {isPending && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Marcar como PAGO manualmente?")) return;
                                      await callAdmin('mark-order-paid', { id: order.id });
                                      toast.success("Pedido marcado como pago e acesso liberado");
                                      loadOrders();
                                    }}
                                    className="px-2 py-1 rounded-lg text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                  >
                                    ✓ Pagar
                                  </button>
                                )}
                                {isPaid && order.user_id && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await callAdmin('resend-email', { user_id: order.user_id });
                                        toast.success("E-mail reenviado!");
                                      } catch (e) {
                                        toast.error("Erro ao reenviar");
                                      }
                                    }}
                                    className="px-2 py-1 rounded-lg text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center gap-1"
                                  >
                                    <Mail className="w-3 h-3" /> Reenviar
                                  </button>
                                )}
                                <button
                                  onClick={async () => {
                                    if (!confirm("Deletar este pedido?")) return;
                                    await callAdmin('delete-order', { id: order.id });
                                    setOrders(prev => prev.filter(o => o.id !== order.id));
                                    toast.success("Pedido deletado");
                                  }}
                                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptsMROAdmin;
