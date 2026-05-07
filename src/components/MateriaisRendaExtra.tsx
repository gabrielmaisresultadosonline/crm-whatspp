import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { ArrowLeft, Download, Play, Upload, Trash2, Edit2, Check, X, Loader2, Lock, Video, Settings } from 'lucide-react';

interface Material {
  id: string;
  title: string;
  video_url: string;
  file_name: string;
  file_size: number;
  order_index: number;
  is_active: boolean;
}

interface Props {
  onBack: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

async function callFunction(action: string, extra: Record<string, unknown> = {}, creds?: { email: string; password: string }) {
  const url = `${SUPABASE_URL}/functions/v1/renda-extra-materiais`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ action, ...creds, ...extra }),
  });
  return res.json();
}

export const MateriaisRendaExtra = ({ onBack }: Props) => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminCreds, setAdminCreds] = useState<{ email: string; password: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadMateriais(); }, []);

  const loadMateriais = async () => {
    setLoading(true);
    const action = isAdmin && adminCreds ? 'admin-list' : 'list';
    const res = await callFunction(action, {}, adminCreds || undefined);
    if (res.success) setMateriais(res.materiais || []);
    setLoading(false);
  };

  const handleLogin = async () => {
    const res = await callFunction('login', {}, { email: loginEmail, password: loginPassword });
    if (res.success) {
      setIsAdmin(true);
      setAdminCreds({ email: loginEmail, password: loginPassword });
      setShowLogin(false);
      toast.success('Acesso admin liberado!');
      // reload with admin list
      const listRes = await callFunction('admin-list', {}, { email: loginEmail, password: loginPassword });
      if (listRes.success) setMateriais(listRes.materiais || []);
    } else {
      toast.error('Credenciais inválidas');
    }
  };

  const uploadVideoFile = async (file: File, title?: string) => {
    const ext = file.name.split('.').pop() || 'mp4';
    const fileName = `materiais/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { error } = await supabase.storage.from('assets').upload(fileName, file, {
      contentType: file.type || 'video/mp4',
      upsert: true,
    });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(fileName);

    await callFunction('save', {
      data: {
        title: title || file.name.replace(/\.[^.]+$/, ''),
        video_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        order_index: materiais.length,
      },
    }, adminCreds!);

    return urlData.publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.name.endsWith('.zip')) {
          setUploadProgress(`Extraindo ZIP: ${file.name}...`);
          const zip = await JSZip.loadAsync(file);
          const videoFiles = Object.entries(zip.files).filter(([name]) =>
            /\.(mp4|webm|mov|avi)$/i.test(name) && !name.startsWith('__MACOSX')
          );

          for (let j = 0; j < videoFiles.length; j++) {
            const [name, zipEntry] = videoFiles[j];
            setUploadProgress(`Enviando ${j + 1}/${videoFiles.length}: ${name.split('/').pop()}`);
            const blob = await zipEntry.async('blob');
            const videoFile = new File([blob], name.split('/').pop() || 'video.mp4', { type: 'video/mp4' });
            await uploadVideoFile(videoFile);
          }
          toast.success(`${videoFiles.length} vídeos extraídos do ZIP!`);
        } else if (/\.(mp4|webm|mov|avi)$/i.test(file.name)) {
          setUploadProgress(`Enviando ${i + 1}/${files.length}: ${file.name}`);
          await uploadVideoFile(file);
          toast.success(`${file.name} enviado!`);
        } else {
          toast.error(`Formato não suportado: ${file.name}`);
        }
      }

      await loadMateriais();
    } catch (err) {
      console.error(err);
      toast.error('Erro no upload: ' + (err instanceof Error ? err.message : 'Erro'));
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover este vídeo?')) return;
    const res = await callFunction('delete', { data: { id } }, adminCreds!);
    if (res.success) {
      toast.success('Vídeo removido');
      setMateriais(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleUpdateTitle = async (id: string) => {
    const res = await callFunction('update', { data: { id, title: editTitle } }, adminCreds!);
    if (res.success) {
      setMateriais(prev => prev.map(m => m.id === id ? { ...m, title: editTitle } : m));
      setEditingId(null);
      toast.success('Título atualizado');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onBack} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
              <ArrowLeft size={16} />
              <span className="ml-1">Voltar</span>
            </Button>
            <h1 className="text-lg font-bold">📹 Materiais para Divulgação</h1>
          </div>
          {!isAdmin ? (
            <Button size="sm" variant="outline" onClick={() => setShowLogin(true)}>
              <Settings size={16} />
              <span className="ml-1 hidden sm:inline">Admin</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.webm,.mov,.avi,.zip"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span className="ml-1">{uploading ? 'Enviando...' : 'Upload MP4/ZIP'}</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setIsAdmin(false); setAdminCreds(null); loadMateriais(); }}>
                <X size={16} />
              </Button>
            </div>
          )}
        </div>
        {uploading && uploadProgress && (
          <div className="max-w-4xl mx-auto px-4 pb-2">
            <div className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1.5 rounded-lg">{uploadProgress}</div>
          </div>
        )}
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Lock size={20} /> Admin</h2>
              <Button size="sm" variant="ghost" onClick={() => setShowLogin(false)}><X size={16} /></Button>
            </div>
            <Input placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            <Input type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <Button className="w-full" onClick={handleLogin}>Entrar</Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} /></div>
        ) : materiais.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Video size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Nenhum material disponível ainda</p>
            {isAdmin && <p className="text-sm mt-2">Use o botão "Upload MP4/ZIP" para adicionar vídeos</p>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {materiais.map(m => (
              <div key={m.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Video preview */}
                <div className="relative aspect-video bg-black">
                  {playingId === m.id ? (
                    <video
                      src={m.video_url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <button
                      onClick={() => setPlayingId(m.id)}
                      className="w-full h-full flex items-center justify-center bg-gray-900 hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play size={32} className="text-white ml-1" />
                      </div>
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  {editingId === m.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        onKeyDown={e => e.key === 'Enter' && handleUpdateTitle(m.id)}
                      />
                      <Button size="sm" className="h-8 w-8 p-0" onClick={() => handleUpdateTitle(m.id)}>
                        <Check size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingId(null)}>
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm leading-tight">{m.title || m.file_name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatSize(m.file_size)}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => { setEditingId(m.id); setEditTitle(m.title); }}>
                            <Edit2 size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                            onClick={() => handleDelete(m.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <a href={m.video_url} download={m.file_name} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Download size={14} />
                      <span className="ml-1">Baixar Vídeo</span>
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
