import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload, Play, Pause, LogOut, Users, XCircle, BarChart3, RefreshCw } from 'lucide-react';

const DEFAULT_EMAIL = 'mro@gmail.com';
const DEFAULT_PASSWORD = 'Ga145523@';

interface Lead {
  nome: string;
  email: string;
  whatsapp: string;
  is_clt: boolean | null;
  media_salarial: string | null;
  created_at: string;
}

const RendaExtraLigacaoAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'leads'>('settings');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({ no_notebook_count: 0 });
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  const [settings, setSettings] = useState({
    ringtoneUrl: '/ringtone.mp4',
    audio1Url: '/call-audio.mp3',
    audio2Url: '/call-audio.mp3',
    audio3Url: '',
    whatsappNumber: '5511999999999',
    whatsappMessage: 'Olá gostaria de saber mais sobre o sistema inovador!',
    profileUsername: '@iavendemais',
    groupLink: 'https://chat.whatsapp.com/KIDNoL8cBlnFrHlifBqU7X',
  });

  const handleLogin = () => {
    if (loginEmail === DEFAULT_EMAIL && loginPassword === DEFAULT_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error('Email ou senha incorretos');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadSettings();
    loadLeads();
  }, [isAuthenticated]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rendaextraligacao-storage', {
        body: { action: 'load' }
      });
      if (!error && data?.success && data?.data) {
        setSettings(prev => ({ ...prev, ...data.data }));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const { data, error } = await supabase.functions.invoke('rendaextraligacao-storage', {
        body: { action: 'load_leads' }
      });
      if (!error && data?.success) {
        setLeads(data.leads || []);
        setStats(data.stats || { no_notebook_count: 0 });
      }
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('rendaextraligacao-storage', {
        body: { action: 'save', settings }
      });
      if (!error && data?.success) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (err) {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAudio = async (file: File, which: 'ringtoneUrl' | 'audio1Url' | 'audio2Url' | 'audio3Url') => {
    try {
      const ext = file.name.split('.').pop() || 'mp3';
      const fileName = `rendaextraligacao/${which}-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('assets').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(fileName);
      setSettings(prev => ({ ...prev, [which]: urlData.publicUrl }));
      toast.success('Áudio enviado com sucesso!');
    } catch (err) {
      toast.error('Erro ao enviar áudio');
    }
  };

  const togglePreview = (url: string, key: string) => {
    if (playingAudio === key) {
      audioPreviewRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = url;
        audioPreviewRef.current.play();
        setPlayingAudio(key);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ maxWidth: '400px', width: '100%', backgroundColor: '#111', borderRadius: '1rem', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>🔐 Admin RendaExtraLigação</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Faça login para configurar</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Input placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
            <Input type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
            <Button onClick={handleLogin} className="w-full" style={{ backgroundColor: '#4ade80', color: '#000', fontWeight: 700 }}>Entrar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '1rem' }}>
      <audio ref={audioPreviewRef} onEnded={() => setPlayingAudio(null)} />
      
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingTop: '1rem' }}>
          <h1 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700 }}>⚙️ Admin RendaExtraLigação</h1>
          <Button variant="ghost" size="sm" onClick={() => setIsAuthenticated(false)} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              backgroundColor: activeTab === 'settings' ? '#4ade80' : '#1a1a1a',
              color: activeTab === 'settings' ? '#000' : 'rgba(255,255,255,0.5)',
            }}
          >
            ⚙️ Configurações
          </button>
          <button
            onClick={() => { setActiveTab('leads'); loadLeads(); }}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              backgroundColor: activeTab === 'leads' ? '#4ade80' : '#1a1a1a',
              color: activeTab === 'leads' ? '#000' : 'rgba(255,255,255,0.5)',
            }}
          >
            📊 Leads & Estatísticas
          </button>
        </div>

        {activeTab === 'leads' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ backgroundColor: '#111', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid rgba(74,222,128,0.3)', textAlign: 'center' }}>
                <Users className="w-6 h-6 mx-auto mb-0.5" style={{ color: '#4ade80' }} />
                <p style={{ color: '#4ade80', fontSize: '2rem', fontWeight: 900, margin: 0 }}>{leads.length}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: 0 }}>Leads completos</p>
              </div>
              <div style={{ backgroundColor: '#111', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
                <XCircle className="w-6 h-6 mx-auto mb-0.5" style={{ color: '#ef4444' }} />
                <p style={{ color: '#ef4444', fontSize: '2rem', fontWeight: 900, margin: 0 }}>{stats.no_notebook_count}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: 0 }}>Sem notebook</p>
              </div>
            </div>

            {/* Conversion info */}
            <div style={{ backgroundColor: '#111', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
              <BarChart3 className="w-5 h-5 mx-auto mb-0.5" style={{ color: '#facc15' }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: 0 }}>
                Total interações: <strong style={{ color: '#fff' }}>{leads.length + stats.no_notebook_count}</strong> · 
                Conversão: <strong style={{ color: '#4ade80' }}>
                  {(leads.length + stats.no_notebook_count) > 0 
                    ? ((leads.length / (leads.length + stats.no_notebook_count)) * 100).toFixed(1) 
                    : '0'}%
                </strong>
              </p>
            </div>

            {/* Refresh */}
            <Button variant="outline" size="sm" onClick={loadLeads} disabled={isLoadingLeads} style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingLeads ? 'animate-spin' : ''}`} />
              {isLoadingLeads ? 'Carregando...' : 'Atualizar'}
            </Button>

            {/* Leads list */}
            <div style={{ backgroundColor: '#111', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>📋 Leads que completaram o funil</h3>
              {leads.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>Nenhum lead ainda</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[...leads].reverse().map((lead, i) => (
                    <div key={i} style={{ backgroundColor: '#1a1a1a', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>{lead.nome}</p>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')} {new Date(lead.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: '0 0 0.15rem 0' }}>📧 {lead.email}</p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: '0 0 0.15rem 0' }}>📱 {lead.whatsapp}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: lead.is_clt ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.1)', color: lead.is_clt ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
                          {lead.is_clt ? 'CLT' : 'Não CLT'}
                        </span>
                        {lead.media_salarial && (
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: 'rgba(250,204,21,0.15)', color: '#facc15' }}>
                            {lead.media_salarial}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <>
            {isLoading ? (
              <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Carregando...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Ringtone */}
                <div style={{ backgroundColor: '#111', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ color: '#f97316', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>📞 Toque do Celular (Ringtone)</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Som que toca quando o celular está "tocando".</p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <Input value={settings.ringtoneUrl} onChange={e => setSettings(prev => ({ ...prev, ringtoneUrl: e.target.value }))} placeholder="URL do ringtone" style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', flex: 1, fontSize: '0.8rem' }} />
                    <Button size="sm" variant="outline" onClick={() => togglePreview(settings.ringtoneUrl, 'rt')} style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                      {playingAudio === 'rt' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#1a1a2e', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#f97316' }}>
                    <Upload className="w-4 h-4" /> Enviar áudio
                    <input type="file" accept="audio/*,video/mp4" hidden onChange={e => e.target.files?.[0] && handleUploadAudio(e.target.files[0], 'ringtoneUrl')} />
                  </label>
                </div>

                {/* Audio 1 */}
                <div style={{ backgroundColor: '#111', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>🔊 Áudio 1 - Após Atender</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Após terminar, aparece a pergunta do notebook.</p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <Input value={settings.audio1Url} onChange={e => setSettings(prev => ({ ...prev, audio1Url: e.target.value }))} placeholder="URL do áudio 1" style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', flex: 1, fontSize: '0.8rem' }} />
                    <Button size="sm" variant="outline" onClick={() => togglePreview(settings.audio1Url, 'a1')} style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                      {playingAudio === 'a1' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#1a1a2e', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#4ade80' }}>
                    <Upload className="w-4 h-4" /> Enviar áudio
                    <input type="file" accept="audio/*" hidden onChange={e => e.target.files?.[0] && handleUploadAudio(e.target.files[0], 'audio1Url')} />
                  </label>
                </div>

                {/* Audio 2 */}
                <div style={{ backgroundColor: '#111', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ color: '#eab308', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>🔊 Áudio 2 - Após Confirmar Notebook</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Após terminar, aparece a pergunta de CLT.</p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <Input value={settings.audio2Url} onChange={e => setSettings(prev => ({ ...prev, audio2Url: e.target.value }))} placeholder="URL do áudio 2" style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', flex: 1, fontSize: '0.8rem' }} />
                    <Button size="sm" variant="outline" onClick={() => togglePreview(settings.audio2Url, 'a2')} style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                      {playingAudio === 'a2' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#1a1a2e', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#eab308' }}>
                    <Upload className="w-4 h-4" /> Enviar áudio
                    <input type="file" accept="audio/*" hidden onChange={e => e.target.files?.[0] && handleUploadAudio(e.target.files[0], 'audio2Url')} />
                  </label>
                </div>

                {/* Audio 3 */}
                <div style={{ backgroundColor: '#111', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ color: '#8b5cf6', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>🔊 Áudio 3 - Tela do Grupo (opcional)</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Áudio que toca quando aparece o botão do grupo.</p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <Input value={settings.audio3Url} onChange={e => setSettings(prev => ({ ...prev, audio3Url: e.target.value }))} placeholder="URL do áudio 3" style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', flex: 1, fontSize: '0.8rem' }} />
                    <Button size="sm" variant="outline" onClick={() => togglePreview(settings.audio3Url, 'a3')} style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                      {playingAudio === 'a3' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#1a1a2e', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#8b5cf6' }}>
                    <Upload className="w-4 h-4" /> Enviar áudio
                    <input type="file" accept="audio/*" hidden onChange={e => e.target.files?.[0] && handleUploadAudio(e.target.files[0], 'audio3Url')} />
                  </label>
                </div>

                {/* Group & Profile Settings */}
                <div style={{ backgroundColor: '#111', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ color: '#25d366', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>💬 Configurações do Grupo e Perfil</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block' }}>Link do Grupo WhatsApp (Live)</label>
                      <Input value={settings.groupLink} onChange={e => setSettings(prev => ({ ...prev, groupLink: e.target.value }))} placeholder="https://chat.whatsapp.com/..." style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block' }}>Username perfil (para rejeição)</label>
                      <Input value={settings.profileUsername} onChange={e => setSettings(prev => ({ ...prev, profileUsername: e.target.value }))} placeholder="@iavendemais" style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                    </div>
                  </div>
                </div>

                {/* Funnel explanation */}
                <div style={{ backgroundColor: '#111', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid rgba(74,222,128,0.2)' }}>
                  <h3 style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>📋 Passo a passo do funil</h3>
                  <ol style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: 1.8, paddingLeft: '1.25rem', margin: 0 }}>
                    <li>Usuário clica em "Receber chamada" → <strong style={{ color: '#f97316' }}>Ringtone</strong> toca</li>
                    <li>Clica "Aceitar" → <strong style={{ color: '#4ade80' }}>Áudio 1</strong> toca</li>
                    <li>Após áudio 1 → <strong style={{ color: '#facc15' }}>"Tem notebook/computador?"</strong></li>
                    <li>Se <strong style={{ color: '#ef4444' }}>NÃO</strong> → Rejeitado (contabiliza estatística)</li>
                    <li>Se <strong style={{ color: '#22c55e' }}>SIM</strong> → <strong style={{ color: '#eab308' }}>Áudio 2</strong> toca</li>
                    <li>Após áudio 2 → <strong style={{ color: '#3b82f6' }}>"Você é CLT?"</strong> + média salarial</li>
                    <li>Formulário: nome, email, WhatsApp → <strong style={{ color: '#4ade80' }}>Lead registrado!</strong></li>
                    <li><strong style={{ color: '#8b5cf6' }}>Áudio 3</strong> + botão do <strong style={{ color: '#25d366' }}>Grupo da Live</strong></li>
                  </ol>
                </div>

                {/* Save button */}
                <Button onClick={saveSettings} disabled={isSaving} className="w-full" style={{ backgroundColor: '#4ade80', color: '#000', fontWeight: 700, padding: '0.875rem' }}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RendaExtraLigacaoAdmin;
