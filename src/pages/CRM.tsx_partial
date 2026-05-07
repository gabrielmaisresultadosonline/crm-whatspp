import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAdminLoggedIn, logoutAdmin } from '@/lib/adminConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  Settings, 
  Users, 
  Send, 
  GitBranch, 
  LogOut, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCcw,
  Bot,
  BarChart3,
  CheckCircle2,
  XCircle,
  Mic,
  DollarSign,
  TrendingUp,
  Filter,
  FileUp,
  Paperclip,
  Video,
  Image as ImageIcon,
  FileText,
  StopCircle,
  Clock,
  Play
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const CRM = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isFlowEditorOpen, setIsFlowEditorOpen] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<any>(null);
  
  const [metaSettings, setMetaSettings] = useState<any>({
    meta_access_token: '',
    meta_phone_number_id: '',
    meta_waba_id: '',
    openai_api_key: '',
    ai_agent_enabled: false,
    ai_agent_trigger: 'first_message',
    initial_auto_response_enabled: true,
    initial_response_text: '',
    initial_response_buttons: []
  });

  const [metrics, setMetrics] = useState<any>({
    sent_count: 0,
    responded_count: 0,
    qualified_count: 0,
    sales_count: 0
  });

  const [flows, setFlows] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [broadcast, setBroadcast] = useState({
    name: '',
    message_text: '',
    status: 'pending'
  });

  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [syncingTemplates, setSyncingTemplates] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/crm/login');
      return;
    }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredContacts(contacts);
    } else {
      setFilteredContacts(contacts.filter(c => c.status === statusFilter));
    }
  }, [statusFilter, contacts]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: settingsData } = await supabase.from('crm_settings').select('*').single();
      if (settingsData) setMetaSettings(settingsData);

      const { data: metricsData } = await supabase.from('crm_metrics').select('*').eq('date', new Date().toISOString().split('T')[0]).single();
      if (metricsData) setMetrics(metricsData);

      const { data: flowsData } = await supabase.from('crm_flows').select('*, crm_flow_steps(*)');
      setFlows(flowsData || []);

      const { data: contactsData } = await supabase.from('crm_contacts').select('*').order('last_interaction', { ascending: false });
      setContacts(contactsData || []);

      const { data: templatesData } = await (supabase as any).from('crm_templates').select('*');
      setTemplates(templatesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        await uploadAndSendMedia(audioBlob, 'audio');
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      toast({ title: "Erro ao acessar microfone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const uploadAndSendMedia = async (file: File | Blob, type: 'audio' | 'image' | 'video' | 'document') => {
    if (!selectedContact) return;
    
    setSendingMessage(true);
    try {
      const fileName = `${Date.now()}-${type}.${type === 'audio' ? 'ogg' : (file as File).name?.split('.').pop() || 'bin'}`;
      const filePath = `chat/${selectedContact.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('crm-media').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('crm-media').getPublicUrl(filePath);

      const payload: any = { action: 'sendMessage', to: selectedContact.wa_id };
      if (type === 'audio') payload.audioUrl = publicUrl;
      else if (type === 'image') payload.imageUrl = publicUrl;
      else if (type === 'video') payload.videoUrl = publicUrl;
      else if (type === 'document') {
        payload.documentUrl = publicUrl;
        payload.fileName = (file as File).name || 'document.pdf';
      }

      const { error: invokeError } = await supabase.functions.invoke('meta-whatsapp-crm', { body: payload });
      if (invokeError) throw invokeError;

      fetchMessages(selectedContact.id);
      toast({ title: "Arquivo enviado!" });
    } catch (err) {
      toast({ title: "Erro ao enviar arquivo", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'document') => {
    const file = event.target.files?.[0];
    if (file) await uploadAndSendMedia(file, type);
    event.target.value = '';
  };

  const saveFlow = async (flow: any) => {
    try {
      const { steps, ...flowData } = flow;
      let flowId = flow.id;
      if (flowId) {
        await supabase.from('crm_flows').update(flowData).eq('id', flowId);
      } else {
        const { data } = await supabase.from('crm_flows').insert(flowData).select().single();
        flowId = data.id;
      }
      await supabase.from('crm_flow_steps').delete().eq('flow_id', flowId);
      if (steps && steps.length > 0) {
        await supabase.from('crm_flow_steps').insert(steps.map((s: any, i: number) => ({ ...s, flow_id: flowId, step_order: i })));
      }
      toast({ title: "Fluxo salvo com sucesso!" });
      fetchData();
      setIsFlowEditorOpen(false);
    } catch (err) {
      toast({ title: "Erro ao salvar fluxo", variant: "destructive" });
    }
  };

  const fetchMessages = async (contactId: string) => {
    const { data } = await supabase.from('crm_messages').select('*').eq('contact_id', contactId).order('created_at', { ascending: true });
    setChatMessages(data || []);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || sendingMessage) return;
    setSendingMessage(true);
    try {
      await supabase.functions.invoke('meta-whatsapp-crm', { body: { action: 'sendMessage', to: selectedContact.wa_id, text: newMessage } });
      await fetchMessages(selectedContact.id);
      setNewMessage('');
    } catch (err) {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/crm/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <h1 className="text-xl font-bold font-display hidden md:block">CRM Mais Resultados</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Sair</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-card border w-full md:w-auto flex md:inline-flex">
            <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-2" /> Dashboard</TabsTrigger>
            <TabsTrigger value="contacts"><Users className="w-4 h-4 mr-2" /> Contatos</TabsTrigger>
            <TabsTrigger value="flows"><GitBranch className="w-4 h-4 mr-2" /> Automação</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" /> Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardHeader><CardTitle>Enviadas</CardTitle><CardTitle className="text-3xl">{metrics.sent_count}</CardTitle></CardHeader></Card>
              <Card><CardHeader><CardTitle>Respondidas</CardTitle><CardTitle className="text-3xl">{metrics.responded_count}</CardTitle></CardHeader></Card>
              <Card><CardHeader><CardTitle>Qualificadas</CardTitle><CardTitle className="text-3xl">{metrics.qualified_count}</CardTitle></CardHeader></Card>
              <Card><CardHeader><CardTitle>Vendas</CardTitle><CardTitle className="text-3xl text-green-500">{metrics.sales_count}</CardTitle></CardHeader></Card>
            </div>
          </TabsContent>

          <TabsContent value="contacts">
            <Card className="glass-card">
              <CardContent className="p-6">
                <ScrollArea className="h-[600px]">
                  {contacts.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-4 border-b">
                      <div>
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">+{contact.wa_id}</p>
                      </div>
                      <Button variant="ghost" onClick={() => { setSelectedContact(contact); fetchMessages(contact.id); }}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flows">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {flows.map(flow => (
                <Card key={flow.id} className="glass-card">
                  <CardHeader><CardTitle>{flow.name}</CardTitle></CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">Editar Fluxo</Button>
                  </CardContent>
                </Card>
              ))}
              <Button onClick={() => setIsFlowEditorOpen(true)} className="h-full min-h-[150px] border-dashed border-2">
                <Plus className="w-6 h-6 mr-2" /> Novo Fluxo
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="glass-card p-6">
              <div className="space-y-4">
                <Label>OpenAI API Key</Label>
                <Input type="password" value={metaSettings.openai_api_key} onChange={e => setMetaSettings({...metaSettings, openai_api_key: e.target.value})} />
                <Button onClick={handleSaveSettings} disabled={saving}>Salvar</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{selectedContact?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`p-2 my-2 rounded ${msg.direction === 'inbound' ? 'bg-secondary' : 'bg-primary text-primary-foreground ml-auto'}`}>
                {msg.content}
              </div>
            ))}
          </ScrollArea>
          <div className="p-4 border-t flex gap-2">
            <Button variant="ghost" size="icon" onClick={isRecording ? stopRecording : startRecording} className={isRecording ? "text-red-500" : ""}>
              {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} />
            <Button onClick={handleSendMessage}><Send className="w-4 h-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRM;
