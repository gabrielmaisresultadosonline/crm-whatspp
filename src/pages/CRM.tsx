import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAdminLoggedIn, logoutAdmin } from '@/lib/adminConfig';
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
  Search,
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
  ImageIcon,
  FileText,
  StopCircle,
  Clock,
  Play,
  ArrowRight,
  Check,
  AlertCircle,
  FileCheck2,
  ListFilter,
  Zap,
  Eye,
  EyeOff,
  LayoutDashboard,
  Menu,
  ChevronLeft,
  Instagram,
  Facebook,
  Link as LinkIcon,
  UserPlus,
  Download,
  Upload,
  User,
  CalendarClock,
  Calendar,
  MapPin,
  Smile,
  MoreHorizontal,
  Webhook,
  Layers,
  CreditCard,
  Copy,
  Pencil
} from "lucide-react";
import TemplatePreview from "@/components/whatsapp/TemplatePreview";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TemplateBuilder from "@/components/whatsapp/TemplateBuilder";
import FlowEditor from "@/components/crm/FlowEditor";
import { MediaPopup } from "@/components/MediaPopup";
import Broadcaster from "@/components/crm/Broadcaster";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const CRM = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metaSettings, setMetaSettings] = useState<any>({
    meta_access_token: '',
    meta_phone_number_id: '',
    meta_waba_id: '',
    meta_app_id: '',
    meta_app_secret: '',
    openai_api_key: '',
    ai_agent_enabled: false,
    ai_operation_mode: 'chat',
    auto_generate_strategy: false,
    strategy_generation_prompt: 'Analise o histórico acima e gere 3 estratégias personalizadas para converter este cliente. Sugira também 2 perguntas que eliminem as principais dúvidas dele sob o cabeçalho "### Perguntas para Eliminar Dúvidas".',
    ai_system_prompt: 'Você é um assistente de vendas profissional para a empresa Mais Resultados Online. Responda em Português do Brasil.',
    ai_agent_trigger: 'all',
    ai_agent_trigger_keyword: '',
    initial_auto_response_enabled: true,
    initial_response_text: '',
    initial_response_buttons: [],
    shortcut_size: 100,
    tag_size: 100,
    business_hours_enabled: false,
    business_hours_start: '08:00',
    business_hours_end: '18:00',
    business_hours_tz: 'America/Sao_Paulo',
    outside_hours_message: 'Nossos administradores não estão ativos no momento. Seguiremos com o atendimento automatizado e em breve retornaremos com um atendimento humano.'
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
  const [sourceFilter, setSourceFilter] = useState('all');
  const [kanbanView, setKanbanView] = useState(false);
  const [draggedContact, setDraggedContact] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const selectedContactRef = useRef<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [syncingTemplates, setSyncingTemplates] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isPreviewingAudio, setIsPreviewingAudio] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isFlowEditorOpen, setIsFlowEditorOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<any>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'audio' | 'document' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [confirmSend, setConfirmSend] = useState<{
    type: 'template' | 'flow';
    id: string;
    name: string;
    language?: string;
  } | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showFlows, setShowFlows] = useState(true);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [contactToView, setContactToView] = useState<any>(null);
  const [now, setNow] = useState(Date.now());
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleType, setScheduleType] = useState<'message' | 'template' | 'flow'>('message');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [updatingKnowledge, setUpdatingKnowledge] = useState<string | null>(null);
  const [improvingPrompt, setImprovingPrompt] = useState(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isNewWebhookDialogOpen, setIsNewWebhookDialogOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', response_type: 'text' as 'text' | 'template', template_id: '', secret_token: '', is_active: true, default_status: 'new' });

  const [scheduledMessages, setScheduledMessages] = useState<any[]>([]);
  const [allScheduledMessages, setAllScheduledMessages] = useState<any[]>([]);
  const [showAllContacts, setShowAllContacts] = useState(false);

  // States for custom statuses
  const [kanbanStatuses, setKanbanStatuses] = useState<any[]>([]);
  const [isNewStatusDialogOpen, setIsNewStatusDialogOpen] = useState(false);
  const [isEditStatusDialogOpen, setIsEditStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [newStatusData, setNewStatusData] = useState({ label: '', color: 'blue', value: '' });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  useEffect(() => {
    if (selectedContact?.next_execution_time) {
      const next = new Date(selectedContact.next_execution_time).getTime();
      const diff = Math.max(0, Math.floor((next - now) / 1000));
      setCountdown(diff > 0 ? diff : null);
    } else {
      setCountdown(null);
    }
  }, [selectedContact?.next_execution_time, selectedContact?.id, now]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/crm/login');
      return;
    }
    fetchData();

    const messageChannel = supabase
      .channel('crm_global_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new;
          if (selectedContactRef.current && newMessage.contact_id === selectedContactRef.current.id) {
            setChatMessages(prev => {
              if (prev.find(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
        fetchContacts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_contacts' }, (payload) => {
        fetchContacts();
        if (selectedContactRef.current && payload.new && (payload.new as any).id === selectedContactRef.current.id) {
          setSelectedContact((prev: any) => ({ ...prev, ...payload.new }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [navigate]);

  const fetchWebhooks = async () => {
    const { data } = await supabase.from('crm_webhooks').select('*').order('created_at', { ascending: false });
    setWebhooks(data || []);
  };

  const fetchStatuses = async () => {
    const { data } = await supabase.from('crm_statuses').select('*').order('sort_order', { ascending: true });
    setKanbanStatuses(data || []);
  };

  const fetchContacts = async () => {
    const { data: contactsData } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('last_interaction', { ascending: false, nullsFirst: false })
      .limit(10000);
    setContacts(contactsData || []);
  };

  useEffect(() => {
    let filtered = contacts;
    
    // In the "Conversations" tab, only show contacts that actually have an interaction history
    if (activeTab === 'contacts') {
      filtered = filtered.filter(c => c.last_interaction !== null);
    }

    if (statusFilter !== 'all') {
      // Allow searching by name/phone or filtering by status
      filtered = filtered.filter(c => 
        c.status === statusFilter || 
        c.name?.toLowerCase().includes(statusFilter.toLowerCase()) || 
        c.wa_id?.includes(statusFilter)
      );
    }
    setFilteredContacts(filtered);
  }, [statusFilter, contacts, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: settingsData } = await supabase.from('crm_settings').select('*').maybeSingle();
      if (settingsData) setMetaSettings(settingsData);

      const { data: metricsData } = await supabase
        .from('crm_metrics')
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle();
      
      if (metricsData) setMetrics(metricsData);

      const { data: flowsData } = await supabase.from('crm_flows').select('*, crm_flow_steps(*)');
      setFlows(flowsData || []);

      const { data: contactsData } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('last_interaction', { ascending: false, nullsFirst: false })
        .limit(10000);
      setContacts(contactsData || []);

      const { data: templatesData } = await supabase.from('crm_templates').select('*');
      setTemplates(templatesData || []);

      await fetchWebhooks();
      await fetchStatuses();
      await fetchAllScheduledMessages();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { id, created_at, updated_at, webhook_verify_token, ...rest } = metaSettings;
      const { error } = await supabase.from('crm_settings').upsert({
        ...rest,
        id: '00000000-0000-0000-0000-000000000001',
        strategy_generation_prompt: 'Analise o histórico acima e gere 3 estratégias personalizadas para converter este cliente. Sugira também 2 perguntas que eliminem as principais dúvidas dele sob o cabeçalho "### Perguntas para Eliminar Dúvidas". As perguntas devem ser diretas para copiar e colar.',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) throw error;
      toast({ title: "Configurações salvas!" });
      fetchData();
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleImprovePrompt = async () => {
    if (!metaSettings.ai_system_prompt?.trim() || improvingPrompt) {
      toast({ title: "Aviso", description: "Escreva algo no prompt primeiro para que eu possa melhorar." });
      return;
    }
    
    setImprovingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-whatsapp-crm', {
        body: { action: 'improvePrompt', prompt: metaSettings.ai_system_prompt }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao melhorar prompt");

      setMetaSettings(prev => ({ ...prev, ai_system_prompt: data.improvedPrompt }));
      toast({ title: "Prompt melhorado!", description: "A I.A. refinou suas instruções com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao melhorar prompt", description: err.message, variant: "destructive" });
    } finally {
      setImprovingPrompt(false);
    }
  };

  const copyToClipboard = (text: string, label: string = "Texto") => {
    const cleanText = text.replace(/["']/g, '');
    navigator.clipboard.writeText(cleanText);
    toast({
      title: `${label} copiado!`,
      description: "Conteúdo pronto para enviar (sem aspas).",
    });
  };

  const updateContactStatus = async (contactId: string, updates: any) => {
    try {
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, ...updates } : c));
      const { error } = await supabase.from('crm_contacts').update(updates).eq('id', contactId);
      if (error) {
        fetchContacts();
        throw error;
      }
      toast({ title: "Status atualizado!" });
      fetchData();
    } catch (err) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleDragStart = (contact: any) => setDraggedContact(contact);
  const handleDrop = async (status: string) => {
    if (!draggedContact || draggedContact.status === status) return;
    await updateContactStatus(draggedContact.id, { status });
    setDraggedContact(null);
  };

  const fetchMessages = async (contactId: string) => {
    const { data } = await supabase.from('crm_messages').select('*').eq('contact_id', contactId).order('created_at', { ascending: true });
    setChatMessages(data || []);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || sendingMessage) return;
    setSendingMessage(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-whatsapp-crm', {
        body: { action: 'sendMessage', to: selectedContact.wa_id, text: newMessage }
      });
      if (error) throw error;
      if (!data.success) {
        throw new Error(data.error || "Erro ao enviar mensagem pela Meta");
      }
      await fetchMessages(selectedContact.id);
      setNewMessage('');
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateTemplateKnowledge = async (templateId: string, knowledge: string) => {
    setUpdatingKnowledge(templateId);
    try {
      const { error } = await supabase
        .from('crm_templates')
        .update({ knowledge_description: knowledge })
        .eq('id', templateId);
      
      if (error) throw error;
      
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, knowledge_description: knowledge } : t));
      toast({ title: "Conhecimento atualizado!" });
    } catch (err) {
      toast({ title: "Erro ao atualizar conhecimento", variant: "destructive" });
    } finally {
      setUpdatingKnowledge(null);
    }
  };

  
  const handleCreateWebhook = async () => {
    if (!newWebhook.name) return;
    setSaving(true);
    try {
      const token = newWebhook.secret_token || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const webhookData = {
        name: newWebhook.name,
        response_type: newWebhook.response_type,
        template_id: newWebhook.template_id || null,
        secret_token: token,
        is_active: true,
        default_status: newWebhook.default_status || 'new'
      };

      const { data, error } = await supabase.from('crm_webhooks').insert([webhookData]).select();
      
      if (error) {
        throw error;
      }

      toast({ title: "Webhook criado!" });
      fetchWebhooks();
      setIsNewWebhookDialogOpen(false);
      setNewWebhook({ name: '', response_type: 'text', template_id: '', secret_token: '', is_active: true, default_status: 'new' });
    } catch (err: any) {
      toast({ 
        title: "Erro ao criar", 
        description: err.message || "Ocorreu um erro ao salvar no banco de dados.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const { error } = await supabase.from('crm_webhooks').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Webhook excluído!" });
      fetchWebhooks();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
  };

  const toggleWebhookStatus = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('crm_webhooks').update({ is_active: !current }).eq('id', id);
      if (error) throw error;
      fetchWebhooks();
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatusData.label) return;
    setSaving(true);
    try {
      const value = newStatusData.value || newStatusData.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
      const sortOrder = (kanbanStatuses.length + 1) * 10;
      
      const { error } = await supabase.from('crm_statuses').insert([{
        label: newStatusData.label,
        value: value,
        color: newStatusData.color,
        sort_order: sortOrder
      }]);

      if (error) throw error;
      toast({ title: "Etiqueta criada com sucesso!" });
      fetchStatuses();
      setIsNewStatusDialogOpen(false);
      setNewStatusData({ label: '', color: 'blue', value: '' });
    } catch (err: any) {
      toast({ title: "Erro ao criar etiqueta", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingStatus || !editingStatus.label) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('crm_statuses')
        .update({
          label: editingStatus.label,
          color: editingStatus.color
        })
        .eq('id', editingStatus.id);

      if (error) throw error;
      toast({ title: "Etiqueta atualizada com sucesso!" });
      fetchStatuses();
      setIsEditStatusDialogOpen(false);
      setEditingStatus(null);
    } catch (err: any) {
      toast({ title: "Erro ao atualizar etiqueta", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStatus = async (id: string) => {
    try {
      const { error } = await supabase.from('crm_statuses').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Etiqueta removida!" });
      fetchStatuses();
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const mimeType = MediaRecorder.isTypeSupported('audio/ogg; codecs=opus') 
          ? 'audio/ogg; codecs=opus' 
          : 'audio/webm; codecs=opus';
        const audioBlob = new Blob(chunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
        setIsPreviewingAudio(true);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      setAudioChunks(chunks);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast({ title: "Erro ao acessar microfone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelAudioPreview = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setIsPreviewingAudio(false);
  };

  const sendRecordedAudio = async () => {
    if (recordedAudioBlob) {
      await handleSendMedia(recordedAudioBlob, 'audio', true);
      cancelAudioPreview();
    }
  };

  const handleSendMedia = async (file: File | Blob, type: 'audio' | 'video' | 'image' | 'document', isVoice = false) => {
    if (!selectedContact) return;
    setSendingMessage(true);
    try {
      const fileExt = file instanceof File ? file.name.split('.').pop() : (isVoice ? 'ogg' : 'bin');
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `chat-media/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('crm-media')
        .upload(filePath, file, {
          contentType: file.type || (type === 'audio' ? 'audio/ogg; codecs=opus' : undefined)
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('crm-media')
        .getPublicUrl(filePath);

      const params: any = { action: 'sendMessage', to: selectedContact.wa_id };
      if (type === 'audio') {
        params.audioUrl = publicUrl;
        params.isVoice = isVoice;
      } else if (type === 'image') {
        params.imageUrl = publicUrl;
      } else if (type === 'video') {
        params.videoUrl = publicUrl;
      } else if (type === 'document') {
        params.documentUrl = publicUrl;
        params.fileName = file instanceof File ? file.name : 'document';
      }

      const { data, error } = await supabase.functions.invoke('meta-whatsapp-crm', { body: params });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      await fetchMessages(selectedContact.id);
      toast({ title: "Mídia enviada!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar mídia", description: err.message, variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadType) return;
    
    const isVoice = uploadType === 'audio';
    handleSendMedia(file, uploadType, isVoice);
    e.target.value = '';
  };

  const handleTriggerFlow = async (flowId: string) => {
    if (!selectedContact) return;
    
    const flow = flows.find(f => f.id === flowId);
    if (!confirmSend || confirmSend.id !== flowId) {
      setConfirmSend({ type: 'flow', id: flowId, name: flow?.name || 'Fluxo' });
      return;
    }

    setConfirmSend(null);
    setSendingMessage(true);
    try {
      const { error } = await supabase.functions.invoke('meta-whatsapp-crm', {
        body: { action: 'startFlow', contactId: selectedContact.id, waId: selectedContact.wa_id, flowId }
      });
      if (error) throw error;
      toast({ title: "Fluxo Iniciado!" });
      fetchMessages(selectedContact.id);
      fetchContacts();
    } catch (err) {
      toast({ title: "Erro ao iniciar fluxo", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCancelFlow = async (contactId: string) => {
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('crm_contacts')
        .update({
          flow_state: 'idle',
          current_flow_id: null,
          current_step_index: null,
          current_node_id: null,
          next_execution_time: null
        })
        .eq('id', contactId);
        
      if (error) throw error;
      
      await supabase
        .from('crm_scheduled_messages')
        .delete()
        .eq('contact_id', contactId)
        .eq('status', 'pending');

      toast({ title: "Fluxo interrompido com sucesso!" });
      
      if (selectedContact?.id === contactId) {
        setSelectedContact((prev: any) => ({
          ...prev,
          flow_state: 'idle',
          current_flow_id: null,
          current_step_index: null,
          current_node_id: null,
          next_execution_time: null
        }));
      }
      fetchContacts();
    } catch (err: any) {
      toast({ title: "Erro ao interromper fluxo", description: err.message, variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleScheduleMessage = async () => {
    if (!selectedContact || !scheduleDate || !scheduleTime) {
      toast({ title: "Preencha a data e hora", variant: "destructive" });
      return;
    }

    setIsScheduling(true);
    try {
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      
      let messageData: any = { action: '' };
      
      if (scheduleType === 'message') {
        if (!newMessage.trim()) {
          toast({ title: "Digite a mensagem para agendar", variant: "destructive" });
          setIsScheduling(false);
          return;
        }
        messageData = { action: 'sendMessage', text: newMessage };
      } else if (scheduleType === 'template') {
        if (!selectedScheduleId) {
          toast({ title: "Selecione um template", variant: "destructive" });
          setIsScheduling(false);
          return;
        }
        messageData = { action: 'sendTemplate', templateName: selectedScheduleId, languageCode: 'pt_BR' };
      } else if (scheduleType === 'flow') {
        if (!selectedScheduleId) {
          toast({ title: "Selecione um fluxo", variant: "destructive" });
          setIsScheduling(false);
          return;
        }
        messageData = { action: 'startFlow', flowId: selectedScheduleId };
      }

      const { error } = await supabase.from('crm_scheduled_messages').insert({
        contact_id: selectedContact.id,
        scheduled_for: scheduledFor,
        message_data: messageData,
        status: 'pending'
      });

      if (error) throw error;

      toast({ title: "Mensagem agendada com sucesso!" });
      setIsSchedulingOpen(false);
      setNewMessage('');
      setScheduleDate('');
      setScheduleTime('');
      setSelectedScheduleId('');
      fetchScheduledMessages(selectedContact.id);
      fetchAllScheduledMessages();
    } catch (err: any) {
      toast({ title: "Erro ao agendar", description: err.message, variant: "destructive" });
    } finally {
      setIsScheduling(false);
    }
  };

  const syncTemplates = async () => {
    setSyncingTemplates(true);
    try {
      const { error } = await supabase.functions.invoke('meta-whatsapp-crm', { body: { action: 'getTemplates' } });
      if (error) throw error;
      toast({ title: "Templates Sincronizados" });
      fetchData();
    } catch (err) {
      toast({ title: "Erro ao sincronizar", variant: "destructive" });
    } finally {
      setSyncingTemplates(false);
    }
  };

  const handleSendTemplate = async (templateName: string, language: string) => {
    if (!selectedContact) return;
    
    const template = templates.find(t => t.name === templateName);
    
    if (!confirmSend || confirmSend.id !== templateName) {
      setConfirmSend({ type: 'template', id: templateName, name: templateName, language });
      return;
    }

    setConfirmSend(null);
    setSendingMessage(true);
    try {
      const components: any[] = [];
      const bodyComponent = template?.components?.find((c: any) => c.type === 'BODY');
      const headerComponent = template?.components?.find((c: any) => c.type === 'HEADER');
      
      if (headerComponent) {
        if (headerComponent.format === 'IMAGE') {
          const handleOrUrl = headerComponent.example?.header_handle?.[0];
          if (handleOrUrl && handleOrUrl.startsWith('http') && !handleOrUrl.includes('whatsapp.net')) {
            components.push({
              type: "header",
              parameters: [{ type: "image", image: { link: handleOrUrl } }]
            });
          }
        } else if (headerComponent.format === 'TEXT' && headerComponent.text) {
          const headerVariables = headerComponent.text.match(/\{\{\d+\}\}/g);
          if (headerVariables) {
            components.push({
              type: "header",
              parameters: headerVariables.map(() => ({ type: "text", text: "---" }))
            });
          }
        }
      }

      if (bodyComponent?.text) {
        const bodyVariables = bodyComponent.text.match(/\{\{\d+\}\}/g);
        if (bodyVariables) {
          const parameters = bodyVariables.map((_: any, index: number) => {
            if (index === 0 && selectedContact.name) return { type: "text", text: selectedContact.name };
            const exampleData = bodyComponent.example?.body_text?.[0] || [];
            let val = "---";
            if (Array.isArray(exampleData)) {
              if (exampleData.length === 1 && typeof exampleData[0] === 'string' && bodyVariables.length > 1) {
                const splitExamples = exampleData[0].split(' ');
                val = splitExamples[index] || "---";
              } else {
                val = exampleData[index] || "---";
              }
            } else if (typeof exampleData === 'string') {
              const splitExamples = exampleData.split(' ');
              val = splitExamples[index] || "---";
            }
            return { type: "text", text: val };
          });
          components.push({ type: "body", parameters: parameters });
        }
      }

      const { data, error } = await supabase.functions.invoke('meta-whatsapp-crm', {
        body: { 
          action: 'sendTemplate', 
          to: selectedContact.wa_id, 
          templateName, 
          languageCode: language,
          components: components
        }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao enviar template pela Meta");
      toast({ title: "Template enviado!" });
      await fetchMessages(selectedContact.id);
    } catch (err: any) {
      toast({ title: "Erro ao enviar template", description: err.message, variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveTemplate = async (template: any) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-whatsapp-crm', {
        body: { action: 'createTemplate', ...template }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao criar template na Meta");
      toast({ title: "Template enviado para aprovação!" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro ao criar template", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (name: string) => {
    try {
      const { error } = await supabase.functions.invoke('meta-whatsapp-crm', {
        body: { action: 'deleteTemplate', name }
      });
      if (error) throw error;
      toast({ title: "Template excluído" });
      fetchData();
    } catch (err) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleSaveContactMetadata = async (contactId: string, metadata: any) => {
    try {
      const { error } = await supabase.from('crm_contacts').update({ metadata }).eq('id', contactId);
      if (error) throw error;
      toast({ title: "Informações salvas!" });
      fetchContacts();
      if (selectedContact?.id === contactId) {
        setSelectedContact({ ...selectedContact, metadata });
      }
    } catch (err) {
      toast({ title: "Erro ao salvar informações", variant: "destructive" });
    }
  };

  const handleExportContacts = (format: 'csv' | 'vcard' = 'csv') => {
    if (format === 'csv') {
      const data = contacts.map(c => ({
        Nome: c.name || '',
        Telefone: c.wa_id || '',
        Status: c.status || '',
        Bio: c.metadata?.bio || '',
        Instagram: c.metadata?.instagram || '',
        Facebook: c.metadata?.facebook || '',
        Links: c.metadata?.links || ''
      }));
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contatos_crm_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else if (format === 'vcard') {
      const vcards = contacts.map(c => {
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${c.name || c.wa_id}`,
          `TEL;TYPE=CELL:${c.wa_id}`,
          `NOTE:${c.metadata?.bio || ''} | IG: ${c.metadata?.instagram || ''} | FB: ${c.metadata?.facebook || ''}`,
          `URL:${c.metadata?.links || ''}`,
          'END:VCARD'
        ].join('\n');
      }).join('\n');
      
      const blob = new Blob([vcards], { type: 'text/vcard' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contatos_crm_${new Date().toISOString().split('T')[0]}.vcf`;
      a.click();
    }
  };

  const handleImportContacts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const contacts_to_import: any[] = [];

      if (fileName.endsWith('.vcf') || fileName.endsWith('.vcard')) {
        const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const vcardBlocks = normalizedContent.split(/BEGIN:VCARD/i).filter(block => block.trim());
        
        console.log(`vCard blocks found: ${vcardBlocks.length}`);

        for (const block of vcardBlocks) {
          const lines = block.split('\n');
          let currentContact: any = { metadata: {} };
          let foundName = false;
          let foundPhone = false;

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (/^FN[;:]/i.test(trimmedLine)) {
              currentContact.name = trimmedLine.split(':').slice(1).join(':').trim();
              foundName = true;
            } else if (/^N[;:]/i.test(trimmedLine) && !foundName) {
              const nameValue = trimmedLine.split(':').slice(1).join(':').trim();
              const parts = nameValue.split(';');
              currentContact.name = parts.filter(p => p).reverse().join(' ').trim();
              foundName = true;
            } else if (/^TEL[;:]/i.test(trimmedLine)) {
              const phoneValue = trimmedLine.split(':').slice(1).join(':').trim();
              const phone = phoneValue.replace(/\D/g, '');
              if (phone && phone.length >= 8) {
                currentContact.wa_id = phone;
                foundPhone = true;
              }
            } else if (trimmedLine.toUpperCase().startsWith('NOTE:')) {
              currentContact.metadata.bio = trimmedLine.substring(5).trim();
            } else if (trimmedLine.toUpperCase().startsWith('URL:')) {
              currentContact.metadata.links = trimmedLine.substring(4).trim();
            }
          }

          if (foundPhone) {
            if (!currentContact.name) currentContact.name = currentContact.wa_id;
            contacts_to_import.push(currentContact);
          }
        }
      } else {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 1) return;
        
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';
        
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
        const imported = lines.slice(1).map(line => {
          const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = values[i]);
          return obj;
        });

        for (const contact of imported) {
          const phone = (contact.Telefone || contact.wa_id || contact.phone || contact.whatsapp || Object.values(contact)[0])?.toString();
          if (!phone) continue;
          
          const cleanPhone = phone.replace(/\D/g, '');
          if (cleanPhone.length < 8) continue;

          contacts_to_import.push({
            wa_id: cleanPhone,
            name: contact.Nome || contact.name || contact.full_name || cleanPhone,
            status: contact.Status || 'new',
            source_type: 'imported',
            metadata: {
              bio: contact.Bio || contact.bio,
              instagram: contact.Instagram || contact.instagram,
              facebook: contact.Facebook || contact.facebook,
              links: contact.Links || contact.links
            }
          });
        }
      }

      if (contacts_to_import.length === 0) {
        toast({ title: "Nenhum contato válido encontrado no arquivo", variant: "destructive" });
        return;
      }

      const batchSize = 100;
      let successCount = 0;
      
      toast({ title: `Importando ${contacts_to_import.length} contatos...` });

      // Processamento em lotes maiores
      for (let i = 0; i < contacts_to_import.length; i += batchSize) {
        const batch = contacts_to_import.slice(i, i + batchSize).map(contact => ({
          wa_id: contact.wa_id,
          name: contact.name,
          status: contact.status || 'new',
          source_type: 'imported',
          metadata: contact.metadata || {},
          last_interaction: null
        }));

        const { error } = await supabase.from('crm_contacts').upsert(batch, { onConflict: 'wa_id' });
        if (!error) {
          successCount += batch.length;
          // Atualiza a lista periodicamente para feedback visual
          if (successCount % 500 === 0) fetchContacts();
        } else {
          console.error("Batch error:", error);
        }
      }

      toast({ title: `Importação concluída: ${successCount} contatos!` });
      fetchContacts();
    };
    reader.readAsText(file);
  };

  const openContactInfo = (contact: any) => {
    setContactToView(contact);
    setIsContactInfoOpen(true);
  };

  const openChat = (contact: any) => {
    setSelectedContact(contact);
    fetchMessages(contact.id);
    fetchScheduledMessages(contact.id);
  };

  const fetchScheduledMessages = async (contactId: string) => {
    const { data } = await supabase
      .from('crm_scheduled_messages')
      .select('*')
      .eq('contact_id', contactId)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true });
    setScheduledMessages(data || []);
  };

  const fetchAllScheduledMessages = async () => {
    const { data, error } = await supabase
      .from('crm_scheduled_messages')
      .select(`
        *,
        crm_contacts (
          name,
          wa_id
        )
      `)
      .order('scheduled_for', { ascending: true });
    
    if (error) {
      console.error("Error fetching all scheduled messages:", error);
      return;
    }
    setAllScheduledMessages(data || []);
  };

  const handleSaveFlow = async (flow: any) => {
    setSaving(true);
    try {
      const { id, ...flowData } = flow;
      
      if (!flowData.name || flowData.name.trim() === '') {
        throw new Error("O fluxo precisa de um nome.");
      }

      const payload = {
        name: flowData.name,
        trigger_type: flowData.trigger_type || 'manual',
        trigger_keywords: flowData.trigger_keywords || [],
        is_active: flowData.is_active !== false,
        nodes: flowData.nodes || [],
        edges: flowData.edges || [],
        updated_at: new Date().toISOString()
      };

      let result;
      if (id) {
        result = await supabase
          .from('crm_flows')
          .update(payload)
          .eq('id', id);
      } else {
        result = await supabase
          .from('crm_flows')
          .insert([payload])
          .select();
      }

      if (result.error) {
        throw result.error;
      }
      
      toast({ title: "Fluxo salvo com sucesso!" });
      setIsFlowEditorOpen(false);
      setEditingFlow(null);
      fetchData();
    } catch (err: any) {
      toast({ 
        title: "Erro ao salvar fluxo", 
        description: err.message || "Ocorreu um erro inesperado.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateFlow = async (flow: any) => {
    setSaving(true);
    try {
      const { id, created_at, updated_at, ...flowData } = flow;
      
      const nodeMap: Record<string, string> = {};
      const newNodes = (flowData.nodes || []).map((node: any) => {
        const newId = `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        nodeMap[node.id] = newId;
        return { ...node, id: newId };
      });

      const newEdges = (flowData.edges || []).map((edge: any) => ({
        ...edge,
        id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        source: nodeMap[edge.source] || edge.source,
        target: nodeMap[edge.target] || edge.target
      }));

      const newFlow = {
        name: `${flowData.name} (Cópia)`,
        trigger_type: flowData.trigger_type || 'manual',
        trigger_keywords: flowData.trigger_keywords || [],
        is_active: false,
        nodes: newNodes,
        edges: newEdges,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('crm_flows')
        .insert([newFlow])
        .select();

      if (error) {
        throw error;
      }
      
      toast({ title: "Fluxo duplicado com sucesso!" });
      fetchData();
    } catch (err: any) {
      console.error("Erro ao duplicar fluxo:", err);
      toast({ 
        title: "Erro ao duplicar fluxo", 
        description: err.message || "Verifique se há campos obrigatórios faltando ou conflitos.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };



  const getWindowInfo = (lastInteraction: string) => {
    if (!lastInteraction) return null;
    const last = new Date(lastInteraction).getTime();
    const now = new Date().getTime();
    const diffHours = (now - last) / (1000 * 60 * 60);
    const remaining = Math.max(0, 24 - diffHours);
    return {
      label: remaining > 0 ? `${remaining.toFixed(1)}h restantes` : "Janela expirada",
      isExpired: remaining <= 0
    };
  };

  const getStatusColor = (status: string) => {
    const statusObj = kanbanStatuses.find(s => s.value === status);
    if (statusObj) {
      switch (statusObj.color) {
        case 'blue': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'yellow': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'purple': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        case 'green': return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'red': return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'orange': return 'bg-orange-500 text-white border-orange-600 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]';
        case 'indigo': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        case 'pink': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
        default: return 'bg-gray-500/10 text-gray-500';
      }
    }
    
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'responded': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'qualified': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'closed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'lost': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'human': return 'bg-orange-500 text-white border-orange-600 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusObj = kanbanStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status.toUpperCase();
  };

  if (loading && !contacts.length) return <div className="min-h-screen flex items-center justify-center"><RefreshCcw className="animate-spin" /></div>;

  return (
    <SidebarProvider>
      <div className="h-screen w-full flex overflow-hidden bg-background">
        <Sidebar className="border-r shadow-sm">
          <SidebarHeader className="p-4 border-b flex items-center justify-center">
            <Logo size="sm" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Navegação</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                    { id: 'contacts', label: 'Conversas', icon: MessageSquare },
                    { id: 'contact-list', label: 'Contatos', icon: Users },
                    { id: 'broadcast', label: 'Disparador', icon: Zap },
                    { id: 'scheduling', label: 'Agendamentos', icon: Calendar },
                    { id: 'flows', label: 'Fluxos', icon: GitBranch },
                    { id: 'templates', label: 'Templates', icon: FileText },
                    { id: 'ai-agent', label: 'Agente IA', icon: Bot },
                    { id: 'webhooks', label: 'Webhooks (API)', icon: Webhook },
                    { id: 'settings', label: 'Ajustes', icon: Settings },
                  ].map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activeTab === item.id} 
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                          activeTab === item.id ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-primary" : "text-muted-foreground")} />
                        <span className="font-semibold">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { logoutAdmin(); navigate('/crm/login'); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 h-full overflow-hidden">
          <header className="h-16 border-b flex items-center px-6 bg-card/50 backdrop-blur-sm z-10 shrink-0 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border mx-2 hidden md:block" />
              <h1 className="text-xl font-bold tracking-tight capitalize">{activeTab}</h1>
            </div>
            {activeTab === 'contacts' && (
              <div className="flex gap-2">
                <Dialog open={isNewStatusDialogOpen} onOpenChange={setIsNewStatusDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-primary/5 hover:bg-primary/10 border-primary/20">
                      <Plus className="w-4 h-4 mr-2" /> Nova Etiqueta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Criar Nova Etiqueta Kanban</DialogTitle>
                      <DialogDescription>
                        Adicione uma nova etapa ao seu funil de vendas.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="status-label">Nome da Etiqueta (Ex: Orçamento Enviado)</Label>
                        <Input 
                          id="status-label" 
                          placeholder="Digite o nome..." 
                          value={newStatusData.label}
                          onChange={(e) => setNewStatusData({...newStatusData, label: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Cor da Etiqueta</Label>
                        <div className="flex flex-wrap gap-2">
                          {['blue', 'yellow', 'purple', 'green', 'red', 'orange', 'indigo', 'pink'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewStatusData({...newStatusData, color})}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all",
                                newStatusData.color === color ? "border-primary scale-110 shadow-md" : "border-transparent opacity-70 hover:opacity-100",
                                color === 'blue' && 'bg-blue-500',
                                color === 'yellow' && 'bg-yellow-500',
                                color === 'purple' && 'bg-purple-500',
                                color === 'green' && 'bg-green-500',
                                color === 'red' && 'bg-red-500',
                                color === 'orange' && 'bg-orange-500',
                                color === 'indigo' && 'bg-indigo-500',
                                color === 'pink' && 'bg-pink-500'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateStatus} disabled={saving}>
                        {saving ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Etiqueta
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isEditStatusDialogOpen} onOpenChange={setIsEditStatusDialogOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Editar Etiqueta Kanban</DialogTitle>
                      <DialogDescription>
                        Altere as informações da etapa do seu funil.
                      </DialogDescription>
                    </DialogHeader>
                    {editingStatus && (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-status-label">Nome da Etiqueta</Label>
                          <Input 
                            id="edit-status-label" 
                            value={editingStatus.label}
                            onChange={(e) => setEditingStatus({...editingStatus, label: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Cor da Etiqueta</Label>
                          <div className="flex flex-wrap gap-2">
                            {['blue', 'yellow', 'purple', 'green', 'red', 'orange', 'indigo', 'pink'].map(color => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setEditingStatus({...editingStatus, color})}
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 transition-all",
                                  editingStatus.color === color ? "border-primary scale-110 shadow-md" : "border-transparent opacity-70 hover:opacity-100",
                                  color === 'blue' && 'bg-blue-500',
                                  color === 'yellow' && 'bg-yellow-500',
                                  color === 'purple' && 'bg-purple-500',
                                  color === 'green' && 'bg-green-500',
                                  color === 'red' && 'bg-red-500',
                                  color === 'orange' && 'bg-orange-500',
                                  color === 'indigo' && 'bg-indigo-500',
                                  color === 'pink' && 'bg-pink-500'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button onClick={handleUpdateStatus} disabled={saving}>
                        {saving ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Alterações
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={() => setIsImportExportOpen(true)}>
                  <FileUp className="w-4 h-4 mr-2" /> Importar/Exportar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setKanbanView(!kanbanView)}>
                  {kanbanView ? <MessageSquare className="w-4 h-4 mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                  {kanbanView ? 'Lista' : 'Kanban'}
                </Button>
              </div>
            )}
          </header>
          
          <main className="flex-1 overflow-hidden relative flex flex-col">
            {activeTab === 'dashboard' && (
              <ScrollArea className="flex-1 p-8">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">Métricas Gerais</h2>
                    <p className="text-muted-foreground">Visão geral do desempenho da sua operação.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Mensagens Enviadas', value: metrics.sent_count, icon: Send, color: 'blue' },
                      { label: 'Respondidas', value: metrics.responded_count, icon: MessageSquare, color: 'yellow' },
                      { label: 'Contatos Qualificados', value: metrics.qualified_count, icon: CheckCircle2, color: 'purple' },
                      { label: 'Vendas Fechadas', value: metrics.sales_count, icon: DollarSign, color: 'green' },
                    ].map((stat, i) => (
                      <Card key={i} className="relative overflow-hidden group hover:shadow-lg transition-all border-zinc-100 dark:border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardDescription className="font-bold text-xs uppercase tracking-wider">{stat.label}</CardDescription>
                          <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-black">{stat.value}</div>
                          <div className={`mt-2 h-1 w-full bg-${stat.color}-500/10 rounded-full overflow-hidden`}>
                            <div className={`h-full bg-${stat.color}-500 transition-all duration-1000`} style={{ width: '70%' }} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}

            {activeTab === 'contacts' && (
              <div className="flex-1 flex overflow-hidden">
                {kanbanView ? (
                  <div className="flex-1 overflow-x-auto p-4 flex gap-4 bg-muted/5">
                    {(kanbanStatuses.length > 0 ? kanbanStatuses : [
                      { value: 'new', label: 'Novo Lead', color: 'blue' },
                      { value: 'responded', label: 'Em Atendimento', color: 'yellow' },
                      { value: 'qualified', label: 'Qualificado', color: 'purple' },
                      { value: 'human', label: '+ HUMANO', color: 'orange' },
                      { value: 'closed', label: 'Venda Fechada', color: 'green' },
                      { value: 'lost', label: 'Perdido', color: 'red' }
                    ]).map(status => (
                      <div 
                        key={status.value} 
                        className="w-72 shrink-0 flex flex-col bg-card/50 rounded-xl border border-border shadow-sm group/column transition-all hover:shadow-md hover:bg-card" 
                        onDragOver={e => e.preventDefault()} 
                        onDrop={() => handleDrop(status.value)}
                      >
                        <div className={cn(
                          "p-4 border-b font-black uppercase text-[11px] flex justify-between items-center rounded-t-xl",
                          status.value === 'human' || status.color === 'orange' ? "bg-orange-500/10 text-orange-700" : "bg-muted/30"
                        )}>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              status.color === 'blue' && 'bg-blue-500',
                              status.color === 'yellow' && 'bg-yellow-500',
                              status.color === 'purple' && 'bg-purple-500',
                              status.color === 'green' && 'bg-green-500',
                              status.color === 'red' && 'bg-red-500',
                              status.color === 'orange' && 'bg-orange-500',
                              status.color === 'indigo' && 'bg-indigo-500',
                              status.color === 'pink' && 'bg-pink-500'
                            )} />
                            {status.label}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-background/80 shadow-sm border font-black">{contacts.filter(c => c.status === status.value && c.last_interaction !== null).length}</Badge>
                            {kanbanStatuses.some(s => s.id && s.value === status.value) && (
                              <div className="flex items-center gap-1 opacity-0 group-hover/column:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const sObj = kanbanStatuses.find(s => s.value === status.value);
                                    if (sObj) {
                                      setEditingStatus(sObj);
                                      setIsEditStatusDialogOpen(true);
                                    }
                                  }}
                                  className="hover:text-primary p-1"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const sObj = kanbanStatuses.find(s => s.value === status.value);
                                    if (sObj) handleDeleteStatus(sObj.id);
                                  }}
                                  className="hover:text-red-500 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <ScrollArea className="flex-1 p-3">
                          {contacts.filter(c => c.status === status.value && c.last_interaction !== null).map(contact => (
                            <Card 
                              key={contact.id} 
                              draggable 
                              onDragStart={() => handleDragStart(contact)} 
                              className="p-4 mb-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-md border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2" 
                              onClick={() => { openChat(contact); setKanbanView(false); }}
                            >
                              <p className="text-sm font-bold truncate hover:text-primary cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); openContactInfo(contact); }}>{contact.name || contact.wa_id}</p>
                              <div className="flex justify-between items-center mt-3">
                                {contact.last_interaction && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                    <Clock className="w-3 h-3 opacity-50" />
                                    {new Date(contact.last_interaction).toLocaleDateString([], {day: '2-digit', month: '2-digit'})}
                                  </div>
                                )}
                                {contact.total_messages_received > 0 && (
                                  <Badge variant="outline" className="text-[9px] font-bold opacity-70">
                                    <MessageSquare className="w-2 h-2 mr-1" /> {contact.total_messages_received}
                                  </Badge>
                                )}
                              </div>
                            </Card>
                          ))}
                          {contacts.filter(c => c.status === status.value && c.last_interaction !== null).length === 0 && (
                            <div className="h-20 flex items-center justify-center border-2 border-dashed border-muted rounded-xl opacity-40">
                              <p className="text-[10px] font-bold uppercase tracking-widest">Vazio</p>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "w-full md:w-[350px] border-r flex flex-col bg-card/30 backdrop-blur-sm",
                      selectedContact ? 'hidden md:flex' : 'flex'
                    )}>
                      <div className="p-4 border-b flex flex-col gap-3">
                        <div className="relative">
                          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="Buscar contatos..." 
                            className="pl-9 bg-muted/50 border-none h-10"
                            onChange={e => setStatusFilter(e.target.value || 'all')} 
                          />
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="tags" className="border-none">
                            <AccordionTrigger className="py-2 hover:no-underline text-xs font-semibold text-muted-foreground flex gap-2">
                              <ListFilter className="w-3.5 h-3.5" />
                              Filtrar por Etiquetas
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="flex flex-wrap gap-1 pb-1 pt-1">
                                {['all', ...(kanbanStatuses.length > 0 ? kanbanStatuses.map(s => s.value) : ['new', 'responded', 'human', 'qualified', 'closed', 'lost'])].map(s => (
                                  <Badge 
                                    key={s} 
                                    variant={statusFilter === s ? 'default' : 'outline'} 
                                    style={{ height: `${16 * ((metaSettings.tag_size || 100) / 100)}px`, fontSize: `${9 * ((metaSettings.tag_size || 100) / 100)}px` }}
                                    className={cn(
                                      "cursor-pointer capitalize whitespace-nowrap px-2 font-black transition-all",
                                      statusFilter === s ? "shadow-md scale-105" : "hover:bg-muted"
                                    )}
                                    onClick={() => setStatusFilter(s)}
                                  >
                                    {s === 'all' ? '🚀 Todos' : getStatusLabel(s)}
                                  </Badge>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                      <ScrollArea className="flex-1 min-h-0">
                        {filteredContacts.length > 0 ? (
                          filteredContacts.map(contact => (
                            <button 
                              key={contact.id} 
                              onClick={() => openChat(contact)} 
                              className={cn(
                                "w-full p-4 text-left border-b transition-all flex flex-col gap-1 relative",
                                selectedContact?.id === contact.id ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/50 border-l-4 border-l-transparent"
                              )}
                            >
                              <div className="flex justify-between items-start w-full">
                                <p className="font-bold truncate text-sm flex-1 hover:text-primary cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); openContactInfo(contact); }}>{contact.name || contact.wa_id}</p>
                                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                  {contact.last_interaction ? new Date(contact.last_interaction).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                </span>
                              </div>
                                <div className="flex justify-between items-center">
                                  <Badge 
                                    variant="outline" 
                                    style={{ height: `${16 * ((metaSettings.tag_size || 100) / 100)}px`, fontSize: `${9 * ((metaSettings.tag_size || 100) / 100)}px` }}
                                    className={cn("px-2 capitalize font-black shadow-sm", getStatusColor(contact.status))}
                                  >
                                    {getStatusLabel(contact.status)}
                                  </Badge>
                                  {contact.flow_state && contact.flow_state !== 'idle' && (
                                    <div className="flex flex-col items-end gap-1">
                                      <div className="flex items-center gap-1">
                                        <Badge 
                                          variant="secondary" 
                                          style={{ height: `${14 * ((metaSettings.tag_size || 100) / 100)}px`, fontSize: `${8 * ((metaSettings.tag_size || 100) / 100)}px` }}
                                          className={cn(
                                            "px-1 capitalize font-medium",
                                            contact.flow_state === 'error' ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary animate-pulse"
                                          )}
                                        >
                                          {contact.flow_state === 'error' ? 'Erro' : 'Ativo'}
                                        </Badge>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelFlow(contact.id);
                                          }}
                                          className="text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-50"
                                          title="Parar Fluxo"
                                        >
                                          <StopCircle className="h-3 w-3" />
                                        </button>
                                      </div>
                                      {contact.next_execution_time && (
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-primary tabular-nums">
                                          <Clock className="w-2 h-2" />
                                          {(() => {
                                            const next = new Date(contact.next_execution_time).getTime();
                                            const diff = Math.max(0, Math.floor((next - now) / 1000));
                                            return diff > 0 ? `${Math.floor(diff / 60)}m ${diff % 60}s` : 'Próximo...';
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center text-muted-foreground text-sm italic">
                            Nenhum contato encontrado
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                    
                    <div className={cn(
                      "flex-1 flex flex-col min-h-0 relative",
                      !selectedContact ? 'hidden md:flex items-center justify-center bg-muted/5' : 'flex'
                    )}>
                      {selectedContact ? (
                        <>
                          <div className="p-4 border-b flex justify-between items-center bg-card/80 backdrop-blur-md shadow-sm z-10 sticky top-0">
                            <div className="flex items-center gap-4">
                              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedContact(null)}>
                                <ChevronLeft className="h-5 w-5" />
                              </Button>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-base hover:text-primary cursor-pointer transition-colors flex items-center gap-2" onClick={() => openContactInfo(selectedContact)}>
                                    {selectedContact.name || selectedContact.wa_id}
                                    <Badge 
                                      variant="outline" 
                                      style={{ height: `${16 * ((metaSettings.tag_size || 100) / 100)}px`, fontSize: `${10 * ((metaSettings.tag_size || 100) / 100)}px` }}
                                      className="font-normal opacity-60"
                                    >
                                      Info
                                    </Badge>
                                  </p>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8 rounded-full transition-all duration-300",
                                      selectedContact.ai_active ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse" : "text-muted-foreground grayscale"
                                    )}
                                    onClick={async () => {
                                      const newStatus = !selectedContact.ai_active;
                                      await updateContactStatus(selectedContact.id, { ai_active: newStatus });
                                    }}
                                    title={selectedContact.ai_active ? "Desativar IA para este contato" : "Ativar IA para este contato"}
                                  >
                                    <Bot className={cn("w-4 h-4", selectedContact.ai_active && "fill-primary/20")} />
                                  </Button>

                                  {selectedContact.flow_state && selectedContact.flow_state !== 'idle' && (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1">
                                        <Badge 
                                          variant="outline" 
                                          style={{ height: `${14 * ((metaSettings.tag_size || 100) / 100)}px`, fontSize: `${9 * ((metaSettings.tag_size || 100) / 100)}px` }}
                                          className={cn(
                                            "px-1 flex items-center gap-1 font-medium",
                                            selectedContact.flow_state === 'error' ? "bg-red-500/10 text-red-600 border-red-200" : "bg-primary/10 text-primary border-primary/20"
                                          )}
                                        >
                                          <div className={cn("w-1.5 h-1.5 rounded-full", selectedContact.flow_state === 'error' ? "bg-red-500" : "bg-primary animate-ping")} />
                                          {selectedContact.flow_state === 'error' ? 'Erro no Fluxo' : `Fluxo: ${selectedContact.flow_state}`}
                                        </Badge>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-5 w-5 text-red-500 hover:text-red-700 hover:bg-red-50/50" 
                                          onClick={() => handleCancelFlow(selectedContact.id)}
                                          title="Parar Fluxo"
                                        >
                                          <StopCircle className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                      {countdown !== null && countdown > 0 && (
                                        <div className="flex items-center gap-1.5 px-1 py-0.5 bg-primary/5 rounded border border-primary/10 animate-in fade-in zoom-in-95 duration-200">
                                          <Clock className="w-2.5 h-2.5 text-primary animate-pulse" />
                                          <span className="text-[10px] font-bold text-primary tabular-nums">
                                            Aguardando: {Math.floor(countdown / 60)}m {countdown % 60}s
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {selectedContact.last_interaction && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <Clock className={cn("w-3 h-3", getWindowInfo(selectedContact.last_interaction)?.isExpired ? 'text-destructive' : 'text-green-500')} />
                                    <span className={cn("text-[10px] font-medium uppercase tracking-tight", getWindowInfo(selectedContact.last_interaction)?.isExpired ? 'text-destructive' : 'text-green-500')}>
                                      {getWindowInfo(selectedContact.last_interaction)?.label}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="hidden lg:flex h-8 text-[11px]" onClick={() => updateContactStatus(selectedContact.id, { status: 'qualified' })}>Qualificar</Button>
                              <Button size="sm" className="bg-green-600 hidden lg:flex text-white hover:bg-green-700 h-8 text-[11px]" onClick={() => updateContactStatus(selectedContact.id, { status: 'closed' })}>Venda</Button>
                              
                              <Select onValueChange={(val) => updateContactStatus(selectedContact.id, { status: val })}>
                                <SelectTrigger className="w-fit h-8 text-[11px] lg:hidden">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">Novo</SelectItem>
                                  <SelectItem value="responded">Respondido</SelectItem>
                                  <SelectItem value="qualified">Qualificado</SelectItem>
                                  <SelectItem value="closed">Venda</SelectItem>
                                  <SelectItem value="lost">Perdido</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="bg-muted/5 border-b px-2 py-1 flex flex-col gap-1 sticky top-14 z-[5] backdrop-blur-md overflow-hidden transition-all duration-300">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <button 
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="text-[9px] font-black uppercase text-muted-foreground/70 shrink-0 flex items-center gap-1 bg-muted/30 px-1.2 py-0.5 rounded-sm border border-border/20 hover:bg-muted/50 transition-colors group"
                              >
                                <FileText className="w-2.5 h-2.5 text-emerald-500" /> 
                                <span>Modelos</span>
                                {showTemplates ? <Eye className="w-2 h-2 ml-0.5 opacity-40 group-hover:opacity-100" /> : <EyeOff className="w-2 h-2 ml-0.5 opacity-100 text-emerald-500" />}
                              </button>
                              
                              {showTemplates && (
                                <div className="flex flex-wrap gap-1 flex-1 animate-in fade-in slide-in-from-left-2 duration-200">
                                  {templates.slice(0, 10).map(t => (
                                    <Button 
                                      key={t.id} 
                                      variant="outline" 
                                      size="sm" 
                                      style={{ height: `${20 * ((metaSettings.shortcut_size || 100) / 100)}px`, fontSize: `${9 * ((metaSettings.shortcut_size || 100) / 100)}px` }}
                                      className="px-2 rounded-md border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all font-bold whitespace-nowrap shadow-none" 
                                      onClick={() => handleSendTemplate(t.name, t.language || 'pt_BR')} 
                                      disabled={sendingMessage}
                                    >
                                      {t.name}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className={cn(
                              "flex items-center gap-1.5 min-w-0 pt-1 border-t border-border/5",
                              !showFlows && !showTemplates && "pt-0 border-t-0"
                            )}>
                              <button 
                                onClick={() => setShowFlows(!showFlows)}
                                className="text-[9px] font-black uppercase text-muted-foreground/70 shrink-0 flex items-center gap-1 bg-muted/30 px-1.2 py-0.5 rounded-sm border border-border/20 hover:bg-muted/50 transition-colors group"
                              >
                                <Zap className="w-2.5 h-2.5 text-blue-500" /> 
                                <span>Fluxos</span>
                                {showFlows ? <Eye className="w-2 h-2 ml-0.5 opacity-40 group-hover:opacity-100" /> : <EyeOff className="w-2 h-2 ml-0.5 opacity-100 text-blue-500" />}
                              </button>
                              
                              {showFlows && (
                                <div className="flex flex-wrap gap-1 flex-1 animate-in fade-in slide-in-from-left-2 duration-200">
                                  {flows.filter(f => f.is_active).slice(0, 10).map(f => (
                                    <Button 
                                      key={f.id} 
                                      variant="outline" 
                                      size="sm" 
                                      style={{ height: `${20 * ((metaSettings.shortcut_size || 100) / 100)}px`, fontSize: `${9 * ((metaSettings.shortcut_size || 100) / 100)}px` }}
                                      className="px-2 rounded-md border-blue-500/20 bg-blue-500/5 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all font-bold whitespace-nowrap shadow-none" 
                                      onClick={() => handleTriggerFlow(f.id)} 
                                      disabled={sendingMessage}
                                    >
                                      {f.name}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <ScrollArea className="flex-1 bg-[url('https://w0.peakpx.com/wallpaper/580/632/HD-wallpaper-whatsapp-background-dark-pattern.jpg')] bg-repeat">
                            <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
                              {scheduledMessages.length > 0 && (
                                <div className="space-y-2 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                  <div className="flex items-center gap-2 px-1">
                                    <CalendarClock className="w-3 h-3 text-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mensagens Agendadas</span>
                                  </div>
                                  {scheduledMessages.map((msg) => (
                                    <div key={msg.id} className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex justify-between items-center shadow-sm backdrop-blur-sm">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge variant="outline" className="text-[9px] h-4 bg-primary/10 text-primary border-primary/20 font-bold">
                                            {msg.message_data?.action === 'sendMessage' ? 'Mensagem' : 
                                             msg.message_data?.action === 'sendTemplate' ? 'Template' : 'Fluxo'}
                                          </Badge>
                                          <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {new Date(msg.scheduled_for).toLocaleString()}
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate italic">
                                          {msg.message_data?.text || msg.message_data?.templateName || msg.message_data?.flowId || 'Agendamento'}
                                        </p>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={async () => {
                                          if (confirm('Deseja cancelar este agendamento?')) {
                                            await supabase.from('crm_scheduled_messages').delete().eq('id', msg.id);
                                            fetchScheduledMessages(selectedContact.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {chatMessages.map((m, idx) => {
                                const isTemplate = m.message_type === 'template' || m.content?.includes('[Template:');
                                const templateName = m.content?.match(/\[Template: (.*?)\]/)?.[1];
                                let template = isTemplate ? templates.find(t => t.name === templateName) : null;

                                if (isTemplate && !template && m.content) {
                                  template = templates.find(t => {
                                    const bodyComponent = t.components?.find((c: any) => c.type === 'BODY');
                                    const bodyText = bodyComponent?.text;
                                    if (!bodyText) return false;
                                    
                                    const cleanContent = m.content.replace(/\[Template: .*?\]\s*/, '').trim();
                                    const normalizedBody = bodyText.replace(/\{\{\d+\}\}/g, '').trim();
                                    
                                    return cleanContent.includes(normalizedBody.substring(0, 30)) || 
                                           bodyText.includes(cleanContent.substring(0, 30));
                                  });
                                }


                                
                                return (
                                  <div key={m.id || idx} className={cn(
                                    "flex w-full mb-1",
                                    m.direction === 'inbound' ? 'justify-start' : 'justify-end'
                                  )}>
                                    <div className={cn(
                                      "p-3 rounded-2xl max-w-[85%] md:max-w-[70%] shadow-sm relative",
                                      m.direction === 'inbound' 
                                        ? 'bg-card text-card-foreground rounded-tl-none border border-border/50' 
                                        : 'bg-primary text-primary-foreground rounded-tr-none'
                                    )}>
                                      {isTemplate && template ? (
                                        <div className="overflow-hidden rounded-xl bg-white dark:bg-zinc-900 shadow-lg border border-border/50 max-w-[300px]">
                                          {template.components?.find((c: any) => c.type === 'HEADER')?.format !== 'NONE' && (
                                            <div className="aspect-video bg-muted/20 flex items-center justify-center relative overflow-hidden border-b border-border/10">
                                              {(() => {
                                                const header = template.components.find((c: any) => c.type === 'HEADER');
                                                let mediaUrl = m.media_url || header?.example?.header_handle?.[0];
                                                
                                                const isNumericId = mediaUrl && /^\d+$/.test(mediaUrl.toString());
                                                
                                                if (header?.format === 'IMAGE' && mediaUrl && !isNumericId) {
                                                  return <img src={mediaUrl} alt="Header" className="w-full h-full object-cover cursor-pointer" onClick={() => setPreviewMedia({ url: mediaUrl, type: 'image' })} />;
                                                } else if (header?.format === 'VIDEO' && mediaUrl) {
                                                  return (
                                                    <div className="w-full h-full relative cursor-pointer" onClick={() => setPreviewMedia({ url: mediaUrl, type: 'video' })}>
                                                      <video src={mediaUrl} className="w-full h-full object-cover" />
                                                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <Play className="w-10 h-10 text-white" />
                                                      </div>
                                                    </div>
                                                  );
                                                } else if (header?.format === 'TEXT') {
                                                  return <div className="p-3 font-bold text-sm text-foreground w-full">{header.text}</div>;
                                                }
                                                return <div className="text-[10px] text-muted-foreground flex flex-col items-center gap-1"><ImageIcon className="w-5 h-5 opacity-20" /> Sem mídia</div>;
                                              })()}
                                            </div>
                                          )}
                                          <div className="p-3 space-y-2">
                                            <div className="text-[13px] md:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                                              {m.content?.includes('[Template:') 
                                                ? m.content.replace(/\[Template: .*?\]\s*/, '') 
                                                : (template?.components?.find((c: any) => c.type === 'BODY')?.text || m.content)}
                                            </div>

                                            {template.components?.find((c: any) => c.type === 'FOOTER') && (
                                              <div className="text-[10px] opacity-60 uppercase font-medium">
                                                {template.components.find((c: any) => c.type === 'FOOTER').text}
                                              </div>
                                            )}
                                          </div>
                                          {template.components?.find((c: any) => c.type === 'BUTTONS')?.buttons?.map((btn: any, bIdx: number) => (
                                            <div key={bIdx} className="flex items-center justify-center p-2 border-t border-border/30 text-blue-500 text-xs font-bold hover:bg-muted/5 transition-colors cursor-default">
                                              {btn.text}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <>
                                          {m.message_type === 'image' && m.media_url && !/^\d+$/.test(m.media_url.toString()) && (
                                            <div className="mb-2 overflow-hidden rounded-lg border border-border/20 shadow-sm bg-muted/20">
                                              <img 
                                                src={m.media_url} 
                                                alt="Mídia" 
                                                className="max-w-full h-auto cursor-zoom-in transition-transform hover:scale-[1.02] duration-300" 
                                                onClick={() => setPreviewMedia({ url: m.media_url, type: 'image' })} 
                                              />
                                            </div>
                                          )}
                                          {m.message_type === 'sticker' && m.media_url && (
                                            <div className="mb-2 max-w-[150px]">
                                              <img 
                                                src={m.media_url} 
                                                alt="Sticker" 
                                                className="w-full h-auto cursor-zoom-in" 
                                                onClick={() => setPreviewMedia({ url: m.media_url, type: 'image' })}
                                              />
                                            </div>
                                          )}
                                          {m.message_type === 'image' && m.media_url && /^\d+$/.test(m.media_url.toString()) && (
                                            <div className="mb-2 p-4 rounded-lg border border-dashed border-border flex flex-col items-center justify-center bg-muted/5">
                                              <ImageIcon className="w-8 h-8 text-muted-foreground opacity-20 mb-2" />
                                              <span className="text-[10px] text-muted-foreground">ID de Mídia Meta: {m.media_url}</span>
                                            </div>
                                          )}
                                          {m.message_type === 'video' && m.media_url && (
                                            <div 
                                              className="mb-2 overflow-hidden rounded-lg border border-border/20 shadow-sm bg-muted/20 relative group cursor-pointer"
                                              onClick={() => setPreviewMedia({ url: m.media_url, type: 'video' })}
                                            >
                                              <video src={m.media_url} className="max-w-full h-auto rounded-lg shadow-inner" />
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                                <Play className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                                              </div>
                                            </div>
                                          )}
                                          {m.message_type === 'audio' && m.media_url && (
                                            <div className="mb-2 p-1.5 rounded-xl bg-muted/10 border border-border/10">
                                              <audio src={m.media_url} controls className="max-w-full h-9" />
                                            </div>
                                          )}
                                          {m.message_type === 'document' && m.media_url && (
                                            <div 
                                              onClick={() => window.open(m.media_url, '_blank')}
                                              className="mb-2 p-3 rounded-xl bg-muted/20 border border-border/20 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                                            >
                                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-primary" />
                                              </div>
                                              <div className="flex-1 overflow-hidden">
                                                <div className="text-[13px] font-medium truncate">Documento</div>
                                                <div className="text-[10px] opacity-60">Clique para abrir</div>
                                              </div>
                                            </div>
                                          )}
                                          {m.message_type === 'location' && (
                                            <div className="mb-2 p-3 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-2">
                                              <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span className="text-xs font-bold">Localização Recebida</span>
                                              </div>
                                              <div className="text-[10px] opacity-60 truncate">{m.content}</div>
                                              <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                className="w-full text-[10px] h-7"
                                                onClick={() => {
                                                  const lat = m.metadata?.location?.latitude || m.content?.match(/Lat: (.*?),/)?.[1];
                                                  const lng = m.metadata?.location?.longitude || m.content?.match(/Long: (.*?)(\s|$)/)?.[1];
                                                  if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                                                }}
                                              >
                                                Ver no Google Maps
                                              </Button>
                                            </div>
                                          )}
                                          {m.message_type === 'reaction' && (
                                            <div className="absolute -bottom-3 right-0 bg-zinc-800 border border-white/10 rounded-full px-1.5 py-0.5 text-xs shadow-md z-10">
                                              {m.content?.replace('[Reação] ', '')}
                                            </div>
                                          )}
                                          {m.message_type === 'contacts' && (
                                            <div className="mb-2 p-3 rounded-xl bg-muted/20 border border-border/20 flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <UserPlus className="w-5 h-5 text-primary" />
                                              </div>
                                              <div className="flex-1 overflow-hidden">
                                                <div className="text-[13px] font-medium truncate">{m.content?.replace('[Contato] ', '')}</div>
                                                <div className="text-[10px] opacity-60">Contato compartilhado</div>
                                              </div>
                                            </div>
                                          )}
                                          {(m.message_text || m.content) && m.message_type !== 'reaction' && (
                                            <div className="text-sm md:text-[15px] leading-relaxed break-words whitespace-pre-wrap px-0.5">
                                              {m.message_text || m.content}
                                            </div>
                                          )}
                                          {m.message_type === 'unsupported' && (
                                            <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
                                              Mensagem com formato ainda não suportado pela interface. 
                                              {m.metadata && (
                                                <details className="mt-1 cursor-pointer">
                                                  <summary>Ver dados brutos</summary>
                                                  <pre className="mt-1 text-[8px] whitespace-pre-wrap bg-black/20 p-1 rounded">
                                                    {JSON.stringify(m.metadata, null, 2)}
                                                  </pre>
                                                </details>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      )}
                                      <div className={cn(
                                        "text-[9px] mt-1 text-right opacity-60 flex items-center justify-end gap-1",
                                        m.direction === 'inbound' ? 'text-muted-foreground' : 'text-primary-foreground'
                                      )}>
                                        {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        {m.direction === 'outbound' && <Check className="w-3 h-3" />}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div ref={scrollRef} className="h-4" />
                            </div>
                          </ScrollArea>
                          
                          <div className="p-4 bg-card border-t shadow-lg z-10 space-y-3">
                            {selectedContact ? (
                              <>
                                <div className="flex flex-col gap-2 p-3 bg-muted/20 rounded-xl border border-border/50">
                                  {!metaSettings.ai_agent_enabled && (
                                    <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-1">
                                      <AlertCircle className="w-3 h-3 text-yellow-500" />
                                      <span className="text-[9px] font-bold text-yellow-600 uppercase">Atenção: Robô Desativado Geral</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        <Bot className={cn("w-4 h-4", selectedContact.ai_active && metaSettings.ai_agent_enabled ? "text-primary" : "text-muted-foreground")} />
                                        <span className="text-[11px] font-bold">Assistente IA</span>
                                        <Switch 
                                          checked={selectedContact.ai_active}
                                          disabled={!metaSettings.ai_agent_enabled}
                                          onCheckedChange={async (val: boolean) => {
                                            await updateContactStatus(selectedContact.id, { ai_active: val });
                                          }}
                                        />
                                      </div>
                                      <div className="w-px h-4 bg-border" />
                                      <div className="flex items-center gap-2">
                                        <TrendingUp className={cn("w-4 h-4", selectedContact.ai_strategy_active ? "text-indigo-500" : "text-muted-foreground")} />
                                        <span className="text-[11px] font-bold">Estratégias IA</span>
                                        <Switch 
                                          checked={selectedContact.ai_strategy_active}
                                          onCheckedChange={async (val: boolean) => {
                                            await updateContactStatus(selectedContact.id, { ai_strategy_active: val });
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                          <TrendingUp className="w-3 h-3 mr-1" /> Gerar Estratégia
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-purple-600" />
                                            Análise Estratégica de Vendas
                                          </DialogTitle>
                                          <DialogDescription>
                                            A IA analisará todo o histórico com <strong>{selectedContact.name || selectedContact.wa_id}</strong> para gerar gatilhos e estratégias de fechamento.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                          {selectedContact.last_ai_strategy ? (
                                            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 border border-indigo-400/30 rounded-2xl p-6 shadow-xl overflow-hidden relative group text-white">
                                              <div className="relative z-10">
                                                <p className="text-[15px] text-white/95 leading-relaxed whitespace-pre-wrap font-medium">
                                                  {selectedContact.last_ai_strategy}
                                                </p>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed border-muted flex flex-col items-center gap-3">
                                              <TrendingUp className="w-6 h-6" />
                                              <p className="font-bold text-muted-foreground">Nenhuma estratégia gerada</p>
                                            </div>
                                          )}
                                        </div>
                                        <DialogFooter>
                                          <Button 
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={async () => {
                                              setSendingMessage(true);
                                              try {
                                                const { data, error } = await supabase.functions.invoke('generate-strategy', {
                                                  body: { contactId: selectedContact.id }
                                                });
                                                if (error) throw error;
                                                toast({ title: "Estratégia gerada com sucesso!" });
                                                setSelectedContact((prev: any) => ({ ...prev, last_ai_strategy: data.strategy }));
                                              } catch (err: any) {
                                                toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
                                              } finally {
                                                setSendingMessage(false);
                                              }
                                            }}
                                            disabled={sendingMessage}
                                          >
                                            Gerar Estratégia
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                                {isPreviewingAudio && recordedAudioUrl ? (
                                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                                    <audio src={recordedAudioUrl} controls className="h-8 flex-1" />
                                    <div className="flex gap-2">
                                      <Button variant="ghost" size="icon" onClick={cancelAudioPreview} className="text-destructive"><XCircle className="w-5 h-5" /></Button>
                                      <Button size="icon" onClick={sendRecordedAudio} className="bg-green-600 text-white"><Send className="w-5 h-5" /></Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2 max-w-5xl mx-auto w-full">
                                    <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                                      <Button variant="ghost" size="icon" onClick={() => { setUploadType('image'); fileInputRef.current?.click(); }} className="text-muted-foreground"><ImageIcon className="w-5 h-5" /></Button>
                                      <Input 
                                        placeholder="Mensagem..." 
                                        value={newMessage} 
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        className="bg-muted/50 border-none flex-1"
                                      />
                                      <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim() || sendingMessage}>
                                        <Send className="w-4 h-4" />
                                      </Button>
                                      <Button size="icon" variant={isRecording ? 'destructive' : 'ghost'} onClick={isRecording ? stopRecording : startRecording}>
                                        {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                                <MessageSquare className="w-10 h-10 text-primary/30" />
                                <h3 className="text-lg font-bold">Gerenciador de Conversas</h3>
                                <p className="text-muted-foreground text-sm max-w-[280px]">Selecione um contato para começar.</p>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                          <MessageSquare className="w-10 h-10 text-primary/30" />
                          <h3 className="text-lg font-bold">Gerenciador de Conversas</h3>
                          <p className="text-muted-foreground text-sm max-w-[280px]">Selecione um contato para começar.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            {activeTab === 'scheduling' && (
              <ScrollArea className="flex-1 p-8 bg-muted/5">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Agendamentos</h2>
                      <p className="text-muted-foreground text-sm">Visualize e gerencie todas as mensagens agendadas e o histórico de envios.</p>
                    </div>
                    <Button variant="outline" onClick={fetchAllScheduledMessages}>
                      <RefreshCcw className="w-4 h-4 mr-2" /> Atualizar
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <Card className="border-none shadow-md overflow-hidden rounded-2xl">
                      <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-lg">Próximos Agendamentos</CardTitle>
                        <CardDescription>Mensagens aguardando o horário de envio.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground border-b">
                              <tr>
                                <th className="px-6 py-3">Contato</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Conteúdo</th>
                                <th className="px-6 py-3">Agendado Para</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {allScheduledMessages.filter(m => m.status === 'pending').length > 0 ? (
                                allScheduledMessages.filter(m => m.status === 'pending').map((msg) => (
                                  <tr key={msg.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4 font-bold">
                                      {msg.crm_contacts?.name || msg.crm_contacts?.wa_id || 'Desconhecido'}
                                    </td>
                                    <td className="px-6 py-4">
                                      <Badge variant="outline" className="capitalize">
                                        {msg.message_data?.action === 'sendMessage' ? 'Texto' : 
                                         msg.message_data?.action === 'sendTemplate' ? 'Template' : 
                                         msg.message_data?.action === 'startFlow' ? 'Fluxo' : msg.message_data?.action}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate text-muted-foreground">
                                      {msg.message_data?.text || msg.message_data?.templateName || msg.message_data?.flowId || '-'}
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                      {new Date(msg.scheduled_for).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={async () => {
                                          if (confirm('Deseja cancelar este agendamento?')) {
                                            await supabase.from('crm_scheduled_messages').update({ status: 'canceled' }).eq('id', msg.id);
                                            fetchAllScheduledMessages();
                                          }
                                        }}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">
                                    Nenhum agendamento pendente encontrado.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md overflow-hidden rounded-2xl">
                      <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-lg">Histórico de Envios</CardTitle>
                        <CardDescription>Registro de mensagens enviadas ou com erro.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground border-b">
                              <tr>
                                <th className="px-6 py-3">Contato</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Enviado Em</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {allScheduledMessages.filter(m => m.status !== 'pending').length > 0 ? (
                                allScheduledMessages.filter(m => m.status !== 'pending')
                                  .sort((a, b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime())
                                  .slice(0, 20)
                                  .map((msg) => (
                                  <tr key={msg.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4 font-bold">
                                      {msg.crm_contacts?.name || msg.crm_contacts?.wa_id || 'Desconhecido'}
                                    </td>
                                    <td className="px-6 py-4">
                                      <Badge variant="outline" className="capitalize">
                                        {msg.message_data?.action === 'sendMessage' ? 'Texto' : 
                                         msg.message_data?.action === 'sendTemplate' ? 'Template' : 
                                         msg.message_data?.action === 'startFlow' ? 'Fluxo' : msg.message_data?.action}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                      <Badge 
                                        variant={msg.status === 'sent' ? 'default' : 'destructive'}
                                        className={cn(
                                          "capitalize",
                                          msg.status === 'sent' ? "bg-green-500/10 text-green-600 border-green-200" : ""
                                        )}
                                      >
                                        {msg.status === 'sent' ? 'Enviado' : msg.status === 'canceled' ? 'Cancelado' : 'Erro'}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                      {new Date(msg.scheduled_for).toLocaleString('pt-BR')}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground italic">
                                    Nenhum histórico encontrado.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            )}

            {activeTab === 'flows' && (
              <ScrollArea className="flex-1 p-8 bg-muted/5">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Fluxos de Automação</h2>
                      <p className="text-muted-foreground text-sm">Crie gatilhos e sequências automáticas de mensagens inteligentes.</p>
                    </div>
                    <Button onClick={() => { setEditingFlow(null); setIsFlowEditorOpen(true); }} className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" /> Novo Fluxo Visual
                    </Button>
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem value="flows-list" className="border-none">
                      <AccordionTrigger className="bg-card p-6 rounded-2xl border shadow-sm hover:no-underline">
                        <div className="flex flex-col items-start text-left">
                          <h3 className="text-xl font-bold tracking-tight">Lista de Fluxos</h3>
                          <p className="text-muted-foreground text-sm font-normal">Clique para ver e gerenciar seus fluxos de automação.</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                          {flows.length > 0 ? (
                            flows.map((flow) => (
                              <Card key={flow.id} className="group overflow-hidden border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all">
                                <CardHeader className="bg-muted/30 pb-4 border-b">
                                  <div className="flex justify-between items-start mb-2">
                                    <Badge variant={flow.is_active ? "default" : "secondary"} className={cn("text-[10px]", flow.is_active ? "bg-green-500/10 text-green-600 border-green-200" : "")}>
                                      {flow.is_active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-primary hover:bg-primary/10" 
                                        onClick={() => handleDuplicateFlow(flow)}
                                        title="Duplicar Fluxo"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={async () => {
                                        if (confirm('Deseja excluir este fluxo?')) {
                                          await supabase.from('crm_flows').delete().eq('id', flow.id);
                                          fetchData();
                                        }
                                      }}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  <CardTitle className="text-lg truncate">{flow.name}</CardTitle>
                                  <CardDescription className="text-[11px] flex items-center gap-1.5 mt-1 font-medium">
                                    <Zap className="w-3 h-3 text-amber-500" /> Gatilho: <span className="text-foreground">{flow.trigger_type || 'Manual'}</span>
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 bg-card">
                                  <Button variant="outline" size="sm" className="w-full hover:bg-primary hover:text-white transition-colors h-9" onClick={() => { setEditingFlow(flow); setIsFlowEditorOpen(true); }}>
                                    <GitBranch className="w-4 h-4 mr-2" /> Abrir Editor Visual
                                  </Button>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <div className="col-span-full py-20 text-center bg-card rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <GitBranch className="w-8 h-8 text-muted-foreground/50" />
                              </div>
                              <div className="max-w-xs mx-auto">
                                <h3 className="font-bold text-lg">Nenhum fluxo criado</h3>
                                <p className="text-sm text-muted-foreground">Comece criando um novo fluxo visual para automatizar suas mensagens do WhatsApp.</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => setIsFlowEditorOpen(true)}>Criar meu primeiro fluxo</Button>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </ScrollArea>
            )}

            {activeTab === 'ai-agent' && (
              <ScrollArea className="flex-1 p-8 bg-muted/5">
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Bot className="w-6 h-6 text-primary" /> Agente de Inteligência Artificial
                      </h2>
                      <p className="text-muted-foreground text-sm">Configure como a IA deve interagir com seus clientes.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="ai-agent-enabled" className="text-sm font-bold">Ativação Geral</Label>
                      <Switch 
                        id="ai-agent-enabled"
                        checked={metaSettings.ai_agent_enabled}
                        onCheckedChange={(val) => setMetaSettings({...metaSettings, ai_agent_enabled: val})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="rounded-2xl shadow-sm border overflow-hidden flex flex-col">
                      <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-zinc-600" /> Motor da IA
                        </CardTitle>
                        <CardDescription>Conexão e Modo de Operação</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6 flex-1">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold flex items-center gap-2">
                            OpenAI API Key
                          </Label>
                          <Input 
                            type="password"
                            placeholder="sk-..."
                            value={metaSettings.openai_api_key}
                            onChange={(e) => setMetaSettings({...metaSettings, openai_api_key: e.target.value})}
                          />
                          <p className="text-[10px] text-muted-foreground italic">Use uma chave da OpenAI (GPT-4o recomendado).</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" /> Modo de Operação
                          </Label>
                          <Select 
                            value={metaSettings.ai_operation_mode || 'chat'} 
                            onValueChange={(val) => setMetaSettings({...metaSettings, ai_operation_mode: val})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chat">Apenas Conversar (I.A. Ativa)</SelectItem>
                              <SelectItem value="monitor">Apenas Qualificar (Passiva)</SelectItem>
                              <SelectItem value="hybrid">Híbrido (Conversa e Qualifica)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground italic">
                            "Passiva" fará com que a IA não envie mensagens, apenas analise o contato.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm border overflow-hidden flex flex-col">
                      <CardHeader className="bg-amber-50 dark:bg-amber-900/10 border-b">
                        <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-500">
                          <TrendingUp className="w-4 h-4" /> Estratégias e Gatilhos
                        </CardTitle>
                        <CardDescription>Quando e como o agente entra em ação</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6 flex-1">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold flex items-center gap-2">
                            Gatilho de Ativação
                          </Label>
                          <Select 
                            value={metaSettings.ai_agent_trigger || 'all'} 
                            onValueChange={(val) => setMetaSettings({...metaSettings, ai_agent_trigger: val})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Qualquer Mensagem (Sempre Ativo)</SelectItem>
                              <SelectItem value="keyword">Mensagem Específica (Palavra-chave)</SelectItem>
                              <SelectItem value="first_message">Primeira Mensagem do Cliente</SelectItem>
                              <SelectItem value="manual">Ativação Manual apenas</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {metaSettings.ai_agent_trigger === 'keyword' && (
                            <div className="space-y-2 mt-2 animate-in fade-in slide-in-from-top-1">
                              <Input 
                                placeholder="Ex: #aula, oi, quero saber"
                                value={metaSettings.ai_agent_trigger_keyword || ''}
                                onChange={(e) => setMetaSettings({...metaSettings, ai_agent_trigger_keyword: e.target.value})}
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 pt-4 border-t border-amber-100 dark:border-amber-900/20">
                          <div className="flex items-center justify-between p-3 bg-indigo-500/5 rounded-xl border border-indigo-200">
                            <div className="space-y-0.5">
                              <Label className="text-xs font-bold flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> Auto-Estratégia
                              </Label>
                              <p className="text-[10px] text-muted-foreground">Gerar estratégias automáticas.</p>
                            </div>
                            <Switch 
                              checked={metaSettings.auto_generate_strategy}
                              onCheckedChange={(val) => setMetaSettings({...metaSettings, auto_generate_strategy: val})}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold">Prompt de Estratégia</Label>
                            <Textarea 
                              rows={2}
                              className="resize-none text-xs"
                              placeholder="Como a IA deve gerar as estratégias..."
                              value={metaSettings.strategy_generation_prompt}
                              onChange={(e) => setMetaSettings({...metaSettings, strategy_generation_prompt: e.target.value})}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm border overflow-hidden md:col-span-2">
                      <CardHeader className="bg-blue-50 dark:bg-blue-900/10 border-b flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <Clock className="w-4 h-4" /> Gestão de Horário Comercial
                          </CardTitle>
                          <CardDescription>Defina quando o agente deve avisar sobre ausência</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-bold">Ativar Função</Label>
                          <Switch 
                            checked={metaSettings.business_hours_enabled}
                            onCheckedChange={(val) => setMetaSettings({...metaSettings, business_hours_enabled: val})}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Início
                                </Label>
                                <Input 
                                  type="time" 
                                  className="h-10 text-sm"
                                  value={metaSettings.business_hours_start}
                                  onChange={(e) => setMetaSettings({...metaSettings, business_hours_start: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Fim
                                </Label>
                                <Input 
                                  type="time" 
                                  className="h-10 text-sm"
                                  value={metaSettings.business_hours_end}
                                  onChange={(e) => setMetaSettings({...metaSettings, business_hours_end: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Fuso Horário</Label>
                              <Select 
                                value={metaSettings.business_hours_tz} 
                                onValueChange={(val) => setMetaSettings({...metaSettings, business_hours_tz: val})}
                              >
                                <SelectTrigger className="h-10 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                                  <SelectItem value="Europe/Lisbon">Lisboa (GMT+0)</SelectItem>
                                  <SelectItem value="UTC">UTC</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-sm font-bold flex items-center gap-2">
                              Mensagem de Ausência (Fora de Horário)
                            </Label>
                            <Textarea 
                              rows={4}
                              className="resize-none text-sm"
                              placeholder="Nossos administradores não estão ativos no momento..."
                              value={metaSettings.outside_hours_message}
                              onChange={(e) => setMetaSettings({...metaSettings, outside_hours_message: e.target.value})}
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                              Esta mensagem será enviada pela IA caso ela seja acionada fora do horário comercial definido.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm border overflow-hidden md:col-span-2">
                      <CardHeader className="bg-primary/5 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bot className="w-5 h-5 text-primary" /> Instruções do Agente (Cérebro)
                        </CardTitle>
                        <CardDescription>Defina a personalidade e o objetivo do seu robô</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-bold">Prompt do System</Label>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleImprovePrompt}
                              disabled={improvingPrompt}
                              className="h-7 text-[10px] gap-1.5 bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white shadow-md transition-all active:scale-95"
                            >
                              {improvingPrompt ? (
                                <RefreshCcw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                              )}
                              Melhorar Prompt com I.A
                            </Button>
                          </div>
                          <Textarea 
                            rows={10}
                            className="resize-none font-mono text-xs leading-relaxed"
                            placeholder="Ex: Você é um consultor de vendas especializado em..."
                            value={metaSettings.ai_system_prompt}
                            onChange={(e) => setMetaSettings({...metaSettings, ai_system_prompt: e.target.value})}
                          />
                          <p className="text-[10px] text-muted-foreground">Instruções detalhadas de comportamento e conhecimento.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="rounded-2xl shadow-sm border overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-primary" /> Conhecimento dos Templates e Fluxos
                      </CardTitle>
                      <CardDescription>A IA saberá quais botões e caminhos estão disponíveis para enviar automaticamente.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="bg-blue-500/5 border border-blue-200 rounded-xl p-4 flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Eye className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-700">Visão Contextual Ativa</h4>
                          <p className="text-sm text-blue-600/80 leading-relaxed">
                            O agente IA analisa automaticamente todos os seus <strong>Templates</strong> e <strong>Fluxos Visuais</strong> ativos. 
                            Ele entende o propósito de cada botão e pode escolher enviar um template específico se julgar necessário para o atendimento.
                          </p>
                        </div>
                      </div>
                      <div className="mt-8 space-y-4">
                        <h4 className="font-bold text-sm flex items-center gap-2">
                          <Settings className="w-4 h-4" /> Configurar Conhecimento Específico
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {templates.map((template) => (
                            <div key={template.id} className="p-4 rounded-xl border bg-card/50 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs truncate max-w-[150px]">{template.name}</span>
                                <Badge variant="outline" className="text-[9px]">{template.category}</Badge>
                              </div>
                              <Textarea 
                                placeholder="Descreva quando usar e o que os botões deste template fazem..."
                                className="text-[11px] min-h-[80px] bg-muted/20 border-none resize-none"
                                defaultValue={template.knowledge_description || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== (template.knowledge_description || '')) {
                                    handleUpdateTemplateKnowledge(template.id, e.target.value);
                                  }
                                }}
                              />
                              {updatingKnowledge === template.id && (
                                <div className="text-[9px] text-primary animate-pulse flex items-center gap-1">
                                  <RefreshCcw className="w-2 h-2 animate-spin" /> Salvando...
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <Button 
                          onClick={handleSaveSettings} 
                          disabled={saving}
                          className="px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                          <Save className="w-4 h-4 mr-2" /> Salvar Configurações da IA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            )}

            {activeTab === 'broadcast' && (
              <Broadcaster 
                templates={templates} 
                flows={flows} 
                contacts={contacts} 
              />
            )}

            {activeTab === 'templates' && (
              <ScrollArea className="flex-1 p-8 bg-muted/5">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row justify-between md:items-center bg-card p-6 rounded-2xl border shadow-sm gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Templates do WhatsApp</h2>
                      <p className="text-muted-foreground text-sm">Gerencie seus modelos oficiais aprovados pela Meta.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={syncTemplates} disabled={syncingTemplates} className="h-10">
                        <RefreshCcw className={cn("w-4 h-4 mr-2", syncingTemplates && "animate-spin")} />
                        Sincronizar Meta
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="h-10 bg-primary shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> Novo Template</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl h-[90vh] p-0 border-none rounded-3xl overflow-hidden shadow-2xl">
                          <ScrollArea className="h-full">
                            <TemplateBuilder onSave={handleSaveTemplate} isSaving={saving} />
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <Dialog open={!!confirmSend} onOpenChange={(open) => !open && setConfirmSend(null)}>
                    <DialogContent className="rounded-2xl border-none shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                          <Send className="w-5 h-5 text-primary" /> Confirmar Envio
                        </DialogTitle>
                        <DialogDescription className="py-4 text-base leading-relaxed text-foreground/80">
                          Deseja enviar o {confirmSend?.type === 'template' ? 'template' : 'fluxo'} <span className="font-black text-primary underline underline-offset-4">"{confirmSend?.name}"</span> para <span className="font-bold">{selectedContact?.name || selectedContact?.wa_id}</span>?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setConfirmSend(null)} className="rounded-xl h-11 px-6">Cancelar</Button>
                        <Button onClick={() => {
                          if (confirmSend?.type === 'template') {
                            handleSendTemplate(confirmSend.id, confirmSend.language || 'pt_BR');
                          } else if (confirmSend?.type === 'flow') {
                            handleTriggerFlow(confirmSend.id);
                          }
                        }} className="rounded-xl h-11 px-8 bg-primary shadow-lg shadow-primary/20">Sim, enviar agora</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem value="templates-list" className="border-none">
                      <AccordionTrigger className="bg-card p-6 rounded-2xl border shadow-sm hover:no-underline">
                        <div className="flex flex-col items-start text-left">
                          <h3 className="text-xl font-bold tracking-tight">Lista de Templates</h3>
                          <p className="text-muted-foreground text-sm font-normal">Clique para ver e gerenciar seus templates.</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                          {templates.length > 0 ? (
                            templates.map((template) => {
                              const header = template.components?.find((c: any) => c.type === 'HEADER');
                              const body = template.components?.find((c: any) => c.type === 'BODY');
                              const footer = template.components?.find((c: any) => c.type === 'FOOTER');
                              const buttonsComp = template.components?.find((c: any) => c.type === 'BUTTONS');
                              const carouselComp = template.components?.find((c: any) => c.type === 'CAROUSEL');

                              return (
                                <Card key={template.id} className="group overflow-hidden border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all flex flex-col bg-card rounded-2xl">
                                  <CardHeader className="bg-muted/30 pb-4 border-b">
                                    <div className="flex justify-between items-start mb-2">
                                      <Badge variant={
                                        template.status === 'APPROVED' ? 'default' : 
                                        template.status === 'REJECTED' ? 'destructive' : 'secondary'
                                      } className={cn(
                                        "text-[9px] uppercase tracking-wider",
                                        template.status === 'APPROVED' ? "bg-green-500/10 text-green-600 border-green-200" : ""
                                      )}>
                                        {template.status === 'APPROVED' ? <Check className="w-3 h-3 mr-1" /> : 
                                        template.status === 'REJECTED' ? <XCircle className="w-3 h-3 mr-1" /> : 
                                        <Clock className="w-3 h-3 mr-1" />}
                                        {template.status}
                                      </Badge>
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => setPreviewTemplate(template)}>
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => {
                                          if (confirm(`Deseja realmente excluir o template "${template.name}"?`)) {
                                            handleDeleteTemplate(template.name);
                                          }
                                        }}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <CardTitle className="text-base truncate font-bold flex items-center gap-2">
                                  {template.name}
                                  {template.is_carousel && <Layers className="w-3 h-3 text-primary" />}
                                  {template.is_pix && <CreditCard className="w-3 h-3 text-amber-500" />}
                                </CardTitle>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-xl text-primary hover:text-white hover:bg-primary shadow-sm hover:shadow-primary/20 transition-all border border-primary/10 active:scale-95"
                                  title="Copiar texto fácil (sem aspas)"
                                  onClick={() => {
                                    const bodyText = template.components?.find((c: any) => c.type === 'BODY')?.text || '';
                                    copyToClipboard(bodyText, "Texto do Template");
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[9px] font-bold bg-muted/50 border-none">{template.category}</Badge>
                                <Badge variant="outline" className="text-[9px] font-bold bg-muted/50 border-none">{template.language}</Badge>
                                {template.is_pix && (
                                  <Badge variant="outline" className="text-[9px] font-bold bg-amber-500/10 text-amber-600 border-amber-200">PIX</Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 flex flex-col justify-between gap-4">
                              <div className="bg-muted/20 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/50 relative">
                                <div className="absolute top-2 right-2 w-4 h-4 text-muted-foreground/30"><MessageSquare className="w-full h-full" /></div>
                                {header && header.format === 'IMAGE' && header.example?.header_handle?.[0] && (
                                  <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-muted shadow-inner">
                                    <img src={header.example.header_handle[0]} alt="Header" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                {carouselComp && carouselComp.cards && (
                                  <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {carouselComp.cards.map((card: any, cIdx: number) => {
                                      const cardHeader = card.components?.find((c: any) => c.type === 'HEADER');
                                      return (
                                        <div key={cIdx} className="min-w-[120px] aspect-square rounded-lg bg-muted overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                          {cardHeader?.example?.header_handle?.[0] && (
                                            <img src={cardHeader.example.header_handle[0]} className="w-full h-full object-cover" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <div className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 italic line-clamp-4">
                                  "{body?.text}"
                                </div>
                                {template.is_pix && template.pix_code && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full mt-3 h-8 text-[10px] bg-amber-50/50 hover:bg-amber-100 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(template.pix_code);
                                      toast({ title: "PIX Copiado!", description: "Chave PIX copiada para a área de transferência." });
                                    }}
                                  >
                                    <Copy className="w-3 h-3" /> Copiar PIX
                                  </Button>
                                )}
                              </div>
                              {buttonsComp?.buttons && buttonsComp.buttons.length > 0 && (
                                <div className="space-y-1.5">
                                  {buttonsComp.buttons.map((btn: any, idx: number) => (
                                    <div key={idx} className="bg-primary/5 p-2 rounded-lg text-[10px] text-center text-primary font-bold border border-primary/10">
                                      {btn.text}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="mt-4 pt-4 border-t space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                  <Bot className="w-3 h-3" /> Instruções para o Agente IA
                                </Label>
                                <Textarea 
                                  placeholder="Explique quando a IA deve usar este template ou o que os botões fazem..."
                                  className="text-xs min-h-[60px] resize-none bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                                  defaultValue={template.knowledge_description || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (template.knowledge_description || '')) {
                                      handleUpdateTemplateKnowledge(template.id, e.target.value);
                                    }
                                  }}
                                />
                                {updatingKnowledge === template.id && (
                                  <div className="text-[9px] text-primary animate-pulse flex items-center gap-1">
                                    <RefreshCcw className="w-2 h-2 animate-spin" /> Salvando...
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-20 text-center bg-card rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="font-bold text-lg">Sem templates sincronizados</h3>
                        <p className="text-sm text-muted-foreground">Clique em "Sincronizar Meta" para carregar seus templates oficiais.</p>
                        <Button variant="outline" size="sm" onClick={syncTemplates} disabled={syncingTemplates}>Sincronizar agora</Button>
                      </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
                  <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
                    {previewTemplate && (
                      <TemplatePreview 
                        name={previewTemplate.name}
                        headerType={previewTemplate.components?.find((c: any) => c.type === 'HEADER')?.format || 'NONE'}
                        headerText={previewTemplate.components?.find((c: any) => c.type === 'HEADER')?.text}
                        headerUrl={previewTemplate.components?.find((c: any) => c.type === 'HEADER')?.example?.header_handle?.[0]}
                        bodyText={previewTemplate.components?.find((c: any) => c.type === 'BODY')?.text || ''}
                        footerText={previewTemplate.components?.find((c: any) => c.type === 'FOOTER')?.text}
                        buttons={previewTemplate.components?.find((c: any) => c.type === 'BUTTONS')?.buttons || []}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </ScrollArea>
            )}

            {activeTab === 'contact-list' && (
              <ScrollArea className="flex-1 p-8 bg-muted/5">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Lista de Contatos</h2>
                      <p className="text-muted-foreground text-sm">Gerencie todos os seus contatos salvos e importados.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsImportExportOpen(true)}>
                        <FileUp className="w-4 h-4 mr-2" /> Importar/Exportar
                      </Button>
                      <Button onClick={() => { setContactToView({ name: '', wa_id: '', metadata: {} }); setIsContactInfoOpen(true); }} className="bg-primary">
                        <UserPlus className="w-4 h-4 mr-2" /> Novo Contato
                      </Button>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-muted/30 flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="Pesquisar por nome ou número..." 
                          className="pl-9 bg-background"
                          value={statusFilter === 'all' ? '' : statusFilter}
                          onChange={e => setStatusFilter(e.target.value || 'all')}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Filtrar Origem:</span>
                        <div className="flex bg-muted p-1 rounded-lg">
                          <Button 
                            variant={sourceFilter === 'all' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="text-[10px] h-7 px-3"
                            onClick={() => setSourceFilter('all')}
                          >
                            Todos
                          </Button>
                          <Button 
                            variant={sourceFilter === 'system' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="text-[10px] h-7 px-3"
                            onClick={() => setSourceFilter('system')}
                          >
                            Sistema
                          </Button>
                          <Button 
                            variant={sourceFilter === 'imported' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="text-[10px] h-7 px-3"
                            onClick={() => setSourceFilter('imported')}
                          >
                            Importados
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b">
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">WhatsApp</th>
                            <th className="px-6 py-4">Origem</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Última Interação</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(() => {
                            const filtered = contacts.filter(c => {
                              const matchesSearch = statusFilter === 'all' || 
                                c.name?.toLowerCase().includes(statusFilter.toLowerCase()) || 
                                c.wa_id?.includes(statusFilter);
                              const matchesSource = sourceFilter === 'all' || c.source_type === sourceFilter;
                              return matchesSearch && matchesSource;
                            });
                            
                            const totalFiltered = filtered.length;
                            const isSearching = statusFilter !== 'all';
                            const displayContacts = (showAllContacts || isSearching) ? filtered : filtered.slice(0, 10);

                            return (
                              <>
                                {displayContacts.map((contact) => (
                                  <tr key={contact.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                          {contact.name?.charAt(0) || <User className="w-4 h-4" />}
                                        </div>
                                        <span className="font-semibold text-sm">{contact.name || 'Sem nome'}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{contact.wa_id}</td>
                                    <td className="px-6 py-4">
                                      <Badge variant="secondary" className="text-[9px] uppercase font-bold">
                                        {contact.source_type === 'imported' ? 'Importado' : 'Sistema'}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                      <Badge variant="outline" className={cn("capitalize text-[10px]", getStatusColor(contact.status))}>
                                        {contact.status}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] text-muted-foreground">
                                      {contact.last_interaction ? new Date(contact.last_interaction).toLocaleString() : 'Nunca'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { openChat(contact); setActiveTab('contacts'); }}>
                                          <MessageSquare className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openContactInfo(contact)}>
                                          <Settings className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                                          if (confirm('Excluir este contato?')) {
                                            await supabase.from('crm_contacts').delete().eq('id', contact.id);
                                            fetchContacts();
                                          }
                                        }}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                
                                {totalFiltered > 10 && !showAllContacts && !isSearching && (
                                  <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center bg-muted/5">
                                      <div className="flex flex-col items-center gap-3">
                                        <p className="text-sm text-muted-foreground">
                                          Mostrando 10 de <strong>{totalFiltered}</strong> contatos
                                        </p>
                                        <Button 
                                          variant="outline" 
                                          onClick={() => setShowAllContacts(true)}
                                          className="font-bold"
                                        >
                                          <Eye className="w-4 h-4 mr-2" /> Ver Todos os Contatos
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                                
                                {totalFiltered === 0 && (
                                  <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground italic text-sm">
                                      Nenhum contato encontrado. Importe uma lista vCard ou CSV para começar.
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}

            {activeTab === 'settings' && (
              <ScrollArea className="flex-1 p-8 bg-muted/5">
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Configurações</h2>
                    <p className="text-muted-foreground text-sm font-medium">Gerencie as integrações e chaves de API do seu CRM.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-card">
                      <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary"><MessageSquare className="w-5 h-5" /></div>
                          <div>
                            <CardTitle className="text-lg">WhatsApp API</CardTitle>
                            <CardDescription className="text-[11px]">Conecte com a plataforma Business da Meta.</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access Token Permanente</Label>
                          <Input type="password" placeholder="EAA..." className="bg-muted/30 border-none h-11 rounded-xl" value={metaSettings.meta_access_token} onChange={e => setMetaSettings({...metaSettings, meta_access_token: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number ID</Label>
                          <Input placeholder="Ex: 109..." className="bg-muted/30 border-none h-11 rounded-xl" value={metaSettings.meta_phone_number_id} onChange={e => setMetaSettings({...metaSettings, meta_phone_number_id: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Account ID (WABA)</Label>
                          <Input placeholder="Ex: 105..." className="bg-muted/30 border-none h-11 rounded-xl" value={metaSettings.meta_waba_id} onChange={e => setMetaSettings({...metaSettings, meta_waba_id: e.target.value})} />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-card h-fit">
                      <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Bot className="w-5 h-5" /></div>
                          <div>
                            <CardTitle className="text-lg">Configurações de IA</CardTitle>
                            <CardDescription className="text-[11px]">Chave de API e configurações globais.</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OpenAI API Key</Label>
                          <Input type="password" placeholder="sk-..." className="bg-muted/30 border-none h-11 rounded-xl" value={metaSettings.openai_api_key} onChange={e => setMetaSettings({...metaSettings, openai_api_key: e.target.value})} />
                          <p className="text-[10px] text-muted-foreground">A ativação geral do robô deve ser feita na aba <strong>Agente IA</strong>.</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-card">
                      <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Zap className="w-5 h-5" /></div>
                          <div>
                            <CardTitle className="text-lg">Customização da Interface</CardTitle>
                            <CardDescription className="text-[11px]">Ajuste o tamanho dos botões e etiquetas.</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-8">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tamanho dos Atalhos (Modelos/Fluxos)</Label>
                            <Badge variant="secondary" className="text-[10px]">{metaSettings.shortcut_size}%</Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] text-muted-foreground">Menor</span>
                            <input 
                              type="range" 
                              min="70" 
                              max="150" 
                              step="5"
                              value={metaSettings.shortcut_size || 100} 
                              onChange={e => setMetaSettings({...metaSettings, shortcut_size: parseInt(e.target.value)})}
                              className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-[10px] text-muted-foreground">Maior</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" style={{ height: `${20 * ((metaSettings.shortcut_size || 100) / 100)}px`, fontSize: `${9 * ((metaSettings.shortcut_size || 100) / 100)}px` }} className="px-2 rounded-md border-primary/20 bg-primary/5 text-primary pointer-events-none">Exemplo Atalho</Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tamanho das Etiquetas (Status/Filtros)</Label>
                            <Badge variant="secondary" className="text-[10px]">{metaSettings.tag_size}%</Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] text-muted-foreground">Menor</span>
                            <input 
                              type="range" 
                              min="70" 
                              max="150" 
                              step="5"
                              value={metaSettings.tag_size || 100} 
                              onChange={e => setMetaSettings({...metaSettings, tag_size: parseInt(e.target.value)})}
                              className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-[10px] text-muted-foreground">Maior</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" style={{ height: `${14 * ((metaSettings.tag_size || 100) / 100)}px`, fontSize: `${8 * ((metaSettings.tag_size || 100) / 100)}px` }} className="px-1.2 font-bold pointer-events-none">Exemplo Etiqueta</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSettings} disabled={saving} size="lg" className="px-10 h-14 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                      {saving ? <RefreshCcw className="mr-3 h-5 w-5 animate-spin" /> : <Save className="mr-3 h-5 w-5" />}
                      Salvar Configurações
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}

            {activeTab === 'webhooks' && (
              <ScrollArea className="flex-1 p-8 bg-muted/5">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row justify-between md:items-center bg-card p-6 rounded-2xl border shadow-sm gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Webhooks (API Externa)</h2>
                      <p className="text-muted-foreground text-sm">Conecte sites externos para enviar mensagens automáticas.</p>
                    </div>
                    <Button onClick={() => setIsNewWebhookDialogOpen(true)} className="h-10 bg-primary shadow-lg shadow-primary/20">
                      <Plus className="w-4 h-4 mr-2" /> Novo Webhook
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {webhooks.length === 0 ? (
                      <Card className="p-12 text-center border-dashed border-2 bg-muted/20 rounded-2xl">
                        <Webhook className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                        <h3 className="text-lg font-medium">Nenhum webhook criado</h3>
                        <p className="text-sm text-muted-foreground">Crie um webhook para integrar seu site ou sistema externo.</p>
                      </Card>
                    ) : (
                      webhooks.map((webhook) => (
                        <Card key={webhook.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow rounded-2xl">
                          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/10">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Webhook className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-bold">{webhook.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={webhook.is_active ? "default" : "secondary"} className="text-[10px]">
                                    {webhook.is_active ? "Ativo" : "Inativo"}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground font-mono">ID: {webhook.id}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={webhook.is_active} 
                                onCheckedChange={() => toggleWebhookStatus(webhook.id, webhook.is_active)} 
                              />
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                                if(confirm("Deseja excluir este webhook?")) handleDeleteWebhook(webhook.id);
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Configurações de Resposta</h4>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="p-3 bg-muted/30 rounded-xl border">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tipo</Label>
                                    <p className="text-sm font-semibold capitalize">{webhook.response_type === 'text' ? 'Texto' : 'Template'}</p>
                                  </div>
                                  <div className="p-3 bg-muted/30 rounded-xl border">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Etapa Kanban</Label>
                                    <p className="text-sm font-semibold capitalize text-primary">{webhook.default_status || 'Novo'}</p>
                                  </div>
                                  {webhook.response_type === 'template' && (
                                    <div className="p-3 bg-muted/30 rounded-xl border">
                                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Template</Label>
                                      <p className="text-sm font-semibold truncate">{templates.find(t => t.id === webhook.template_id)?.name || 'N/A'}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase text-muted-foreground">URL do Webhook (POST)</Label>
                                  <div className="flex gap-2">
                                    <Input 
                                      readOnly 
                                      value={`https://adljdeekwifwcdcgbpit.supabase.co/functions/v1/crm-webhook`} 
                                      className="font-mono text-[10px] bg-muted/50 rounded-xl"
                                    />
                                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                                      navigator.clipboard.writeText(`https://adljdeekwifwcdcgbpit.supabase.co/functions/v1/crm-webhook`);
                                      toast({ title: "URL copiada!" });
                                    }}>
                                      <Paperclip className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground italic">* Esta URL recebe os dados do seu site para disparar o WhatsApp.</p>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase text-muted-foreground">Token de Autenticação</Label>
                                  <div className="flex gap-2">
                                    <Input 
                                      readOnly 
                                      type="password"
                                      value={webhook.secret_token} 
                                      className="font-mono text-[10px] bg-muted/50 rounded-xl"
                                    />
                                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                                      navigator.clipboard.writeText(webhook.secret_token);
                                      toast({ title: "Token copiado!" });
                                    }}>
                                      <Paperclip className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-zinc-950 rounded-2xl p-6 text-zinc-300 overflow-hidden relative border border-white/5 shadow-2xl">
                                <div className="absolute top-4 right-4 text-zinc-700 font-mono text-[10px] tracking-widest">API DOCS</div>
                                <h4 className="text-primary font-bold text-sm mb-4 flex items-center gap-2">
                                  <Play className="w-3 h-3 fill-current" /> Guia de Integração
                                </h4>
                                <div className="space-y-4 font-mono text-[11px]">
                                  <p className="text-zinc-500">// Exemplo de requisição no seu site</p>
                                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 overflow-x-auto whitespace-pre text-emerald-400">
{`fetch("https://adljdeekwifwcdcgbpit.supabase.co/functions/v1/crm-webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    webhook_id: "${webhook.id}",
    token: "${webhook.secret_token}",
    to: "5511999999999",
    message: "Olá, seu acesso ao produto foi liberado!"
  })
});`}
                                  </div>
                                  <div className="space-y-2 pt-2 border-t border-white/5 text-zinc-400 font-sans">
                                    <p className="italic text-[10px]">
                                      <strong className="text-zinc-200">Parâmetros:</strong><br/>
                                      - <code className="text-primary">to</code>: Número do cliente (DDI+DDD+Número)<br/>
                                      - <code className="text-primary">message</code>: Conteúdo da mensagem (se tipo Texto)<br/>
                                      - <code className="text-primary">variables</code>: [Array] Valores para as variáveis do template (se tipo Template)
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                <Dialog open={isNewWebhookDialogOpen} onOpenChange={setIsNewWebhookDialogOpen}>
                  <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-2xl font-black">
                        <Webhook className="w-6 h-6 text-primary" /> Novo Webhook
                      </DialogTitle>
                      <DialogDescription className="text-base">
                        Crie um ponto de entrada para disparar mensagens do seu site.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label className="font-bold">Nome de Identificação</Label>
                        <Input 
                          placeholder="Ex: Checkout - Produto A" 
                          value={newWebhook.name}
                          onChange={e => setNewWebhook({...newWebhook, name: e.target.value})}
                          className="rounded-2xl h-12"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold">Tipo da Mensagem</Label>
                          <Select 
                            value={newWebhook.response_type} 
                            onValueChange={(val: any) => setNewWebhook({...newWebhook, response_type: val, template_id: val === 'text' ? '' : newWebhook.template_id})}
                          >
                            <SelectTrigger className="rounded-2xl h-12">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl">
                              <SelectItem value="text" className="rounded-xl">Texto Livre</SelectItem>
                              <SelectItem value="template" className="rounded-xl">Template Meta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold">Etapa Kanban</Label>
                          <Select 
                            value={newWebhook.default_status} 
                            onValueChange={(val: any) => setNewWebhook({...newWebhook, default_status: val})}
                          >
                            <SelectTrigger className="rounded-2xl h-12">
                              <SelectValue placeholder="Selecione a etapa" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl">
                              <SelectItem value="new" className="rounded-xl">Novo</SelectItem>
                              <SelectItem value="responded" className="rounded-xl">Respondido</SelectItem>
                              <SelectItem value="qualified" className="rounded-xl">Qualificado</SelectItem>
                              <SelectItem value="human" className="rounded-xl">+ Humano</SelectItem>
                              <SelectItem value="closed" className="rounded-xl">Vendido</SelectItem>
                              <SelectItem value="lost" className="rounded-xl">Perdido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {newWebhook.response_type === 'template' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <Label className="font-bold">Template Vinculado</Label>
                          <Select 
                            value={newWebhook.template_id} 
                            onValueChange={val => setNewWebhook({...newWebhook, template_id: val})}
                          >
                            <SelectTrigger className="rounded-2xl h-12">
                              <SelectValue placeholder="Selecione um template aprovado" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl">
                              {templates.filter(t => t.status === 'APPROVED').map(t => (
                                <SelectItem key={t.id} value={t.id} className="rounded-xl">{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="ghost" onClick={() => setIsNewWebhookDialogOpen(false)} className="rounded-2xl h-12 px-6">Cancelar</Button>
                      <Button onClick={handleCreateWebhook} disabled={saving || !newWebhook.name} className="rounded-2xl h-12 px-8 bg-primary shadow-lg shadow-primary/20 font-bold">
                        {saving ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Salvar Webhook
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </ScrollArea>
            )}
          </main>
        </SidebarInset>
      </div>
      {isFlowEditorOpen && (
        <FlowEditor 
          flow={editingFlow} 
          onSave={handleSaveFlow} 
          onClose={() => { setIsFlowEditorOpen(false); setEditingFlow(null); }} 
        />
      )}
      {previewMedia && (
        <MediaPopup 
          url={previewMedia.url} 
          type={previewMedia.type} 
          onClose={() => setPreviewMedia(null)} 
        />
      )}

      <Dialog open={isContactInfoOpen} onOpenChange={setIsContactInfoOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader className="items-center pb-4 border-b">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">{contactToView?.id ? 'Informações do Contato' : 'Novo Contato'}</DialogTitle>
            <DialogDescription>
              {contactToView?.id 
                ? `Visualize e edite os detalhes de ${contactToView?.name || contactToView?.wa_id}`
                : 'Adicione um novo contato manualmente à sua lista.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Nome</Label>
                <Input 
                  value={contactToView?.name || ''} 
                  onChange={e => setContactToView({...contactToView, name: e.target.value})}
                  placeholder="Nome do contato"
                  className="bg-muted/30 border-none h-10 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">WhatsApp / ID</Label>
                <Input 
                  value={contactToView?.wa_id || ''} 
                  onChange={e => setContactToView({...contactToView, wa_id: e.target.value})}
                  readOnly={!!contactToView?.id}
                  placeholder="Ex: 5511999999999"
                  className={cn(
                    "bg-muted/30 border-none h-10 rounded-xl text-sm",
                    contactToView?.id && "opacity-70 cursor-not-allowed bg-muted/20"
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Biografia / Observações</Label>
              <Textarea 
                value={contactToView?.metadata?.bio || ''} 
                onChange={e => setContactToView({...contactToView, metadata: { ...contactToView?.metadata, bio: e.target.value }})}
                placeholder="Descreva informações importantes..."
                className="bg-muted/30 border-none rounded-xl min-h-[80px] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-2">
                  <Instagram className="w-3 h-3" /> Instagram
                </Label>
                <Input 
                  value={contactToView?.metadata?.instagram || ''} 
                  onChange={e => setContactToView({...contactToView, metadata: { ...contactToView?.metadata, instagram: e.target.value }})}
                  placeholder="@usuario ou link"
                  className="bg-muted/30 border-none h-10 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-2">
                  <Facebook className="w-3 h-3" /> Facebook
                </Label>
                <Input 
                  value={contactToView?.metadata?.facebook || ''} 
                  onChange={e => setContactToView({...contactToView, metadata: { ...contactToView?.metadata, facebook: e.target.value }})}
                  placeholder="link da página"
                  className="bg-muted/30 border-none h-10 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-2">
                  <LinkIcon className="w-3 h-3" /> Outros Links
                </Label>
                <Input 
                  value={contactToView?.metadata?.links || ''} 
                  onChange={e => setContactToView({...contactToView, metadata: { ...contactToView?.metadata, links: e.target.value }})}
                  placeholder="https://site.com"
                  className="bg-muted/30 border-none h-10 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsContactInfoOpen(false)} className="rounded-xl h-12 px-6">Fechar</Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20"
              onClick={async () => {
                const { id, ...rest } = contactToView;
                if (id) {
                  await supabase.from('crm_contacts').update({ 
                    name: contactToView.name,
                    metadata: contactToView.metadata 
                  }).eq('id', id);
                } else {
                  const { error } = await supabase.from('crm_contacts').insert([{
                    name: contactToView.name,
                    wa_id: contactToView.wa_id,
                    metadata: contactToView.metadata,
                    status: 'new',
                    source_type: 'system'
                  }]);
                  if (error) {
                    toast({ title: "Erro ao criar contato", variant: "destructive" });
                    return;
                  }
                }
                toast({ title: id ? "Contato atualizado!" : "Contato criado!" });
                fetchContacts();
                if (selectedContact?.id === contactToView.id) {
                  setSelectedContact({ ...selectedContact, name: contactToView.name, metadata: contactToView.metadata });
                }
                setIsContactInfoOpen(false);
              }}
            >
              <Save className="w-4 h-4 mr-2" /> Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportExportOpen} onOpenChange={setIsImportExportOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileUp className="w-5 h-5 text-primary" /> Gerenciar Contatos
            </DialogTitle>
            <DialogDescription>Exporte sua lista atual ou importe novos contatos via CSV ou vCard.</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-6">
            <div className="p-4 rounded-2xl border-2 border-dashed border-muted bg-muted/5 flex flex-col items-center gap-4 text-center">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Exportar Lista</p>
                <p className="text-[10px] text-muted-foreground">Baixe todos os contatos para backups ou importação.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" size="sm" className="rounded-xl text-[11px]" onClick={() => handleExportContacts('csv')}>
                  <Download className="w-3 h-3 mr-1.5" /> CSV
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl text-[11px]" onClick={() => handleExportContacts('vcard')}>
                  <UserPlus className="w-3 h-3 mr-1.5" /> vCard
                </Button>
              </div>
            </div>

            <div className="p-6 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center gap-4 text-center">
              <div className="p-3 rounded-full bg-primary/20 text-primary">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Importar Lista</p>
                <p className="text-xs text-muted-foreground">Adicione contatos em massa enviando um arquivo CSV ou vCard.</p>
              </div>
              <Label htmlFor="import-file" className="w-full">
                <Button variant="default" className="w-full rounded-xl pointer-events-none">
                  Selecionar Arquivo
                </Button>
              </Label>
              <input 
                id="import-file" 
                type="file" 
                accept=".csv,.vcf,.vcard" 
                className="hidden" 
                onChange={(e) => {
                  handleImportContacts(e);
                  setIsImportExportOpen(false);
                }} 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsImportExportOpen(false)} className="w-full rounded-xl h-11">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSchedulingOpen} onOpenChange={setIsSchedulingOpen}>
        <DialogContent className="rounded-2xl border-none shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" /> Agendar Mensagem
            </DialogTitle>
            <DialogDescription>
              Escolha quando e o que você deseja agendar para este contato.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input 
                  type="date" 
                  value={scheduleDate} 
                  onChange={(e) => setScheduleDate(e.target.value)} 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input 
                  type="time" 
                  value={scheduleTime} 
                  onChange={(e) => setScheduleTime(e.target.value)} 
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Agendamento</Label>
              <Select value={scheduleType} onValueChange={(val: any) => { setScheduleType(val); setSelectedScheduleId(''); }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Mensagem de Texto</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="flow">Fluxo</SelectItem>
                </SelectContent>
              </Select>
            </div>


            {scheduleType === 'message' && (
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea 
                  placeholder="Digite o conteúdo da mensagem..." 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="rounded-xl min-h-[100px]"
                />
              </div>
            )}

            {scheduleType === 'template' && (
              <div className="space-y-2">
                <Label>Selecionar Template</Label>
                <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Escolha um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scheduleType === 'flow' && (
              <div className="space-y-2">
                <Label>Selecionar Fluxo</Label>
                <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Escolha um fluxo" />
                  </SelectTrigger>
                  <SelectContent>
                    {flows.filter(f => f.is_active).map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSchedulingOpen(false)} className="rounded-xl h-11">Cancelar</Button>
            <Button 
              onClick={handleScheduleMessage} 
              disabled={isScheduling}
              className="rounded-xl h-11 bg-primary px-8 shadow-lg shadow-primary/20"
            >
              {isScheduling ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Agendar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default CRM;
