import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare, Send, Settings, FileText,
  Mic, MicOff, Search, ArrowLeft, Check, CheckCheck, Wifi, WifiOff,
  QrCode, Loader2, User, RefreshCw, Plus, Zap, BarChart3,
  Image, Paperclip, X, Play, Users, Square, Upload, Video, Smile,
  Info, Instagram, Globe, Phone, Mail, Building2, MapPin
} from 'lucide-react';
import FlowBuilder from '@/components/whatsapp/FlowBuilder';
import CRMPanel from '@/components/whatsapp/CRMPanel';

interface Contact {
  id?: string;
  phone: string;
  name: string;
  profile_pic_url?: string;
  last_message_at?: string;
  unread_count: number;
  tags?: string[];
  crm_status?: string;
  is_hot_lead?: boolean;
  is_group?: boolean;
}

interface Message {
  id: string;
  message_id?: string;
  phone: string;
  contact_name?: string;
  direction: string;
  message_type: string;
  content?: string;
  media_url?: string;
  status?: string;
  is_read: boolean;
  timestamp?: number;
  created_at: string;
  metadata?: { buttons?: { id: string; label: string }[]; title?: string; footer?: string; selectedButtonId?: string; selectedButtonText?: string } | null;
}

interface ZApiSettings {
  instance_id?: string;
  token?: string;
  client_token?: string;
  is_connected?: boolean;
}

interface FlowItem {
  id: string;
  name: string;
  is_active: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const callProxy = async (action: string, data: Record<string, unknown> = {}) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/zapi-proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
    body: JSON.stringify({ action, data }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || 'Erro na integração Z-API');
  return payload;
};

const normalizePhone = (value: string) => {
  const base = value.trim().split('@')[0] || '';
  return base.replace(/\D/g, '') || base;
};

const normalizeBrazilianPhone = (phone: string) => {
  const digits = normalizePhone(phone);
  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.startsWith('9') && rest.length === 9) {
      return `55${ddd}${rest.slice(1)}`;
    }
  }
  return digits;
};

// Filter out Z-API LID identifiers (15+ digit numbers that aren't real phones)
const isLID = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 15;
};

const getContactKey = (phone: string) => normalizeBrazilianPhone(phone);

const EMOJI_LIST = [
  '😀','😂','🤣','😊','😍','🥰','😘','😎','🤩','😇',
  '🙂','😉','😋','🤗','🤔','🤭','😏','😌','😴','🥱',
  '😒','😤','😡','🤬','😈','👿','💀','☠️','😱','😰',
  '😥','😢','😭','😓','🤥','😬','🙄','😷','🤒','🤕',
  '👍','👎','👊','✊','🤛','🤜','🤝','👏','🙌','👐',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️',
  '💯','💢','💥','💫','💦','🔥','⭐','🌟','✨','💰',
  '🎉','🎊','🎁','🏆','🥇','🏅','🎯','📌','📍','🚀',
  '✅','❌','⚠️','🔔','📢','💬','💭','🗯️','👀','🙏',
];

const getTimestamp = (value?: string) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const looksLikeName = (value?: string) => {
  if (!value) return false;
  const clean = value.trim();
  return clean.length > 2 && /\D/.test(clean);
};

const dedupeContacts = (list: Contact[]) => {
  const map = new Map<string, Contact>();

  for (const contact of list) {
    const key = getContactKey(contact.phone);
    if (!key || isLID(key)) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...contact, phone: key });
      continue;
    }

    const existingName = existing.name || '';
    const incomingName = contact.name || '';
    const name =
      looksLikeName(incomingName) && !looksLikeName(existingName)
        ? incomingName
        : existingName || incomingName || key;

    const existingTime = getTimestamp(existing.last_message_at);
    const incomingTime = getTimestamp(contact.last_message_at);

    map.set(key, {
      ...existing,
      ...contact,
      phone: key,
      name,
      unread_count: Math.max(existing.unread_count || 0, contact.unread_count || 0),
      last_message_at: incomingTime > existingTime ? contact.last_message_at : existing.last_message_at,
      profile_pic_url: contact.profile_pic_url || existing.profile_pic_url,
      tags: contact.tags || existing.tags,
      crm_status: contact.crm_status || existing.crm_status,
      is_hot_lead: Boolean(contact.is_hot_lead || existing.is_hot_lead),
    });
  }

  return Array.from(map.values()).sort((a, b) => getTimestamp(b.last_message_at) - getTimestamp(a.last_message_at));
};

type TabType = 'chats' | 'flows' | 'crm';

export default function ApiWhatsAppAccess() {
  const [view, setView] = useState<'settings' | 'main'>('settings');
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [connected, setConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [instanceId, setInstanceId] = useState('');
  const [token, setToken] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [flows, setFlows] = useState<FlowItem[]>([]);
  const [executingFlow, setExecutingFlow] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'audio' | 'video'>('image');
  const [syncingContacts, setSyncingContacts] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pastedFile, setPastedFile] = useState<File | null>(null);
  const [pastedPreview, setPastedPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioPreview, setRecordedAudioPreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loadingContactInfo, setLoadingContactInfo] = useState(false);
  const [activeExecutions, setActiveExecutions] = useState<any[]>([]);
  const [cancellingExec, setCancellingExec] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatPhone = (phone: string) => {
    const p = normalizePhone(phone);
    if (p.length === 13) return `+${p.slice(0, 2)} (${p.slice(2, 4)}) ${p.slice(4, 9)}-${p.slice(9)}`;
    if (p.length === 12) return `+${p.slice(0, 2)} (${p.slice(2, 4)}) ${p.slice(4, 8)}-${p.slice(8)}`;
    return phone;
  };

  const formatTime = (msg: Message) => {
    const date = msg.timestamp ? new Date(msg.timestamp) : new Date(msg.created_at);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const loadContacts = useCallback(async () => {
    try {
      const result = await callProxy('get-db-contacts');
      const rawContacts = Array.isArray(result.contacts) ? result.contacts : [];
      setContacts(dedupeContacts(rawContacts));
    } catch (e) {
      console.error('Error loading contacts:', e);
    }
  }, []);

  const loadFlows = useCallback(async () => {
    try {
      const result = await callProxy('get-flows');
      setFlows(Array.isArray(result.flows) ? result.flows.filter((f: FlowItem) => f.is_active) : []);
    } catch (e) {
      console.error('Error loading flows:', e);
    }
  }, []);

  const syncChats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await callProxy('sync-chats');
      if (Array.isArray(result.contacts)) setContacts(dedupeContacts(result.contacts));
      else await loadContacts();
      if (!silent) toast({ title: `${result.synced || 0} conversas sincronizadas!` });
    } catch {
      if (!silent) toast({ title: 'Erro ao sincronizar conversas', variant: 'destructive' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [loadContacts]);

  const loadMessages = useCallback(async (phone: string, silent = false) => {
    const normalized = normalizePhone(phone);
    if (!normalized) return;
    if (!silent) setMessageLoading(true);
    try {
      await callProxy('sync-messages', { phone: normalized });
      const result = await callProxy('get-db-messages', { phone: normalized });
      setMessages(Array.isArray(result.messages) ? result.messages : []);
      await callProxy('mark-read', { phone: normalized });
      if (!silent) await loadContacts();
    } catch (e) {
      console.error('Error loading messages:', e);
    } finally {
      if (!silent) setMessageLoading(false);
    }
  }, [loadContacts]);

  const checkStatus = useCallback(async () => {
    try {
      const result = await callProxy('get-status');
      setConnected(result?.connected === true);
      if (!result?.connected) {
        const qr = await callProxy('get-qrcode');
        if (qr?.value) setQrCode(qr.value);
      }
    } catch (e) {
      console.error('Status error:', e);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const result = await callProxy('get-settings');
      const settings: ZApiSettings | null = result.settings;
      if (!settings) return;
      setInstanceId(settings.instance_id || '');
      setToken(settings.token || '');
      setClientToken(settings.client_token || '');
      setConnected(settings.is_connected || false);
      if (settings.instance_id && settings.token) {
        setView('main');
        await syncChats(true);
        await checkStatus();
        await loadFlows();
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }, [checkStatus, syncChats, loadFlows]);

  const saveSettings = async () => {
    setLoading(true);
    try {
      await callProxy('save-settings', { instance_id: instanceId, token, client_token: clientToken });
      const webhookUrl = `${SUPABASE_URL}/functions/v1/zapi-webhook`;
      await callProxy('set-webhook', { webhookUrl });
      toast({ title: 'Instância conectada!' });
      setView('main');
      await loadSettings();
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedContact || !messageText.trim()) return;
    setSendingMessage(true);
    try {
      await callProxy('send-text', { phone: normalizePhone(selectedContact.phone), message: messageText });
      setMessageText('');
      await loadMessages(selectedContact.phone, true);
      await loadContacts();
    } catch {
      toast({ title: 'Erro ao enviar mensagem', variant: 'destructive' });
    } finally {
      setSendingMessage(false);
    }
  };

  const sendMedia = async () => {
    if (!selectedContact || !mediaUrl.trim()) return;
    setSendingMessage(true);
    try {
      const phone = normalizePhone(selectedContact.phone);
      if (mediaType === 'image') {
        await callProxy('send-image', { phone, image: mediaUrl, caption: messageText || '' });
      } else {
        await callProxy('send-audio', { phone, audio: mediaUrl });
      }
      setMediaUrl('');
      setMessageText('');
      setShowMediaInput(false);
      await loadMessages(selectedContact.phone, true);
      toast({ title: mediaType === 'image' ? 'Imagem enviada!' : 'Áudio enviado!' });
    } catch {
      toast({ title: 'Erro ao enviar mídia', variant: 'destructive' });
    } finally {
      setSendingMessage(false);
    }
  };

  // Upload file to Supabase storage and return public URL
  const uploadToStorage = async (file: Blob, fileName: string): Promise<string> => {
    const path = `whatsapp/${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage.from('assets').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw new Error('Erro ao fazer upload: ' + error.message);
    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  // Audio recording
  const startRecording = async () => {
    try {
      if (recordedAudioPreview) {
        URL.revokeObjectURL(recordedAudioPreview);
        setRecordedAudioPreview(null);
        setRecordedAudioBlob(null);
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => { stream.getTracks().forEach(t => t.stop()); };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch {
      toast({ title: 'Sem acesso ao microfone', description: 'Permita o acesso ao microfone no navegador', variant: 'destructive' });
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
    
    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = () => {
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        audioChunksRef.current = [];

        if (audioBlob.size < 1000) {
          toast({ title: 'Áudio muito curto', description: 'Grave por mais tempo para enviar.', variant: 'destructive' });
          resolve();
          return;
        }

        if (recordedAudioPreview) URL.revokeObjectURL(recordedAudioPreview);
        const previewUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioPreview(previewUrl);
        toast({ title: 'Áudio pronto', description: 'Ouça antes de enviar ou cancele.' });
        resolve();
      };
      mediaRecorderRef.current!.stop();
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    audioChunksRef.current = [];
  };

  const cancelRecordedAudio = () => {
    if (recordedAudioPreview) URL.revokeObjectURL(recordedAudioPreview);
    setRecordedAudioPreview(null);
    setRecordedAudioBlob(null);
  };

  const sendRecordedAudio = async () => {
    if (!recordedAudioBlob || !selectedContact) return;
    setUploadingMedia(true);
    try {
      const url = await uploadToStorage(recordedAudioBlob, 'audio.ogg');
      await callProxy('send-audio', { phone: normalizePhone(selectedContact.phone), audio: url });
      await loadMessages(selectedContact.phone, true);
      toast({ title: 'Áudio enviado!' });
      cancelRecordedAudio();
    } catch {
      toast({ title: 'Erro ao enviar áudio', variant: 'destructive' });
    } finally {
      setUploadingMedia(false);
    }
  };

  // Ctrl+V paste handler
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setPastedFile(file);
          setPastedPreview(URL.createObjectURL(file));
        }
        return;
      }
    }
  };

  const sendPastedImage = async () => {
    if (!pastedFile || !selectedContact) return;
    setUploadingMedia(true);
    try {
      const ext = pastedFile.type.split('/')[1] || 'png';
      const url = await uploadToStorage(pastedFile, `pasted.${ext}`);
      await callProxy('send-image', { phone: normalizePhone(selectedContact.phone), image: url, caption: messageText || '' });
      setPastedFile(null);
      setPastedPreview(null);
      setMessageText('');
      await loadMessages(selectedContact.phone, true);
      toast({ title: 'Imagem enviada!' });
    } catch { toast({ title: 'Erro ao enviar imagem', variant: 'destructive' }); }
    finally { setUploadingMedia(false); }
  };

  const cancelPaste = () => {
    if (pastedPreview) URL.revokeObjectURL(pastedPreview);
    setPastedFile(null);
    setPastedPreview(null);
  };

  // File input handler (for audio/image/video files)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContact) return;
    setUploadingMedia(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const url = await uploadToStorage(file, `upload.${ext}`);
      const phone = normalizePhone(selectedContact.phone);
      
      if (file.type.startsWith('image/')) {
        await callProxy('send-image', { phone, image: url, caption: '' });
        toast({ title: 'Imagem enviada!' });
      } else if (file.type.startsWith('audio/')) {
        await callProxy('send-audio', { phone, audio: url });
        toast({ title: 'Áudio enviado!' });
      } else if (file.type.startsWith('video/')) {
        await callProxy('send-video', { phone, video: url });
        toast({ title: 'Vídeo enviado!' });
      } else {
        await callProxy('send-document', { phone, document: url, fileName: file.name });
        toast({ title: 'Documento enviado!' });
      }
      await loadMessages(selectedContact.phone, true);
    } catch { toast({ title: 'Erro ao enviar arquivo', variant: 'destructive' }); }
    finally { setUploadingMedia(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const executeFlow = async (flowId: string) => {
    if (!selectedContact) return;
    setExecutingFlow(true);
    try {
      const result = await callProxy('execute-flow', { flowId, phone: normalizePhone(selectedContact.phone) });
      toast({ title: `Fluxo executado! ${result.stepsExecuted || 0} passos enviados` });
      await loadMessages(selectedContact.phone, true);
      await loadActiveExecutions(selectedContact.phone);
    } catch (e) {
      toast({ title: 'Erro ao executar fluxo', description: String(e), variant: 'destructive' });
    } finally {
      setExecutingFlow(false);
    }
  };

  const loadActiveExecutions = useCallback(async (phone?: string) => {
    try {
      const data: Record<string, unknown> = {};
      if (phone) data.phone = normalizePhone(phone);
      const result = await callProxy('get-active-executions', data);
      setActiveExecutions(Array.isArray(result.executions) ? result.executions : []);
    } catch (e) {
      console.error('Error loading active executions:', e);
    }
  }, []);

  const cancelExecution = async (executionId: string) => {
    setCancellingExec(executionId);
    try {
      await callProxy('cancel-execution', { executionId });
      toast({ title: 'Fluxo cancelado! Você assumiu o atendimento.' });
      setActiveExecutions(prev => prev.filter(e => e.id !== executionId));
    } catch {
      toast({ title: 'Erro ao cancelar fluxo', variant: 'destructive' });
    } finally {
      setCancellingExec(null);
    }
  };

  const syncWhatsAppContacts = async () => {
    setSyncingContacts(true);
    try {
      const result = await callProxy('sync-whatsapp-contacts');
      toast({ title: `${result.synced || 0} contatos sincronizados do WhatsApp!` });
      await loadContacts();
    } catch {
      toast({ title: 'Erro ao sincronizar contatos', variant: 'destructive' });
    } finally {
      setSyncingContacts(false);
    }
  };

  const selectContact = async (contact: Contact) => {
    const normalizedContact = {
      ...contact,
      phone: getContactKey(contact.phone) || contact.phone,
    };
    setSelectedContact(normalizedContact);
    setShowMobileChat(true);
    setActiveTab('chats');
    setShowContactInfo(false);
    setContactInfo(null);
    await loadMessages(normalizedContact.phone);
    await loadActiveExecutions(normalizedContact.phone);
  };

  const selectContactByPhone = async (phone: string) => {
    const normalizedPhone = getContactKey(phone);
    const existing = contacts.find(c => getContactKey(c.phone) === normalizedPhone);
    if (existing) {
      await selectContact(existing);
    } else {
      const contact: Contact = { phone: normalizedPhone, name: formatPhone(normalizedPhone), unread_count: 0 };
      await selectContact(contact);
    }
  };

  const fetchContactInfo = async () => {
    if (!selectedContact) return;
    setShowContactInfo(true);
    setLoadingContactInfo(true);
    try {
      // Fetch profile pic if not already available
      const result = await callProxy('get-contact-info', { phone: selectedContact.phone });
      setContactInfo(result);
      // Update profile pic in contact if found
      if (result?.profile_pic && selectedContact) {
        setSelectedContact(prev => prev ? { ...prev, profile_pic_url: result.profile_pic } : prev);
        setContacts(prev => prev.map(c => 
          c.phone === selectedContact.phone ? { ...c, profile_pic_url: result.profile_pic } : c
        ));
      }
    } catch (e) {
      console.error('Error fetching contact info:', e);
    } finally {
      setLoadingContactInfo(false);
    }
  };

  const fetchProfilePic = async (phone: string) => {
    try {
      const result = await callProxy('get-profile-pic', { phone });
      if (result?.url) {
        setContacts(prev => prev.map(c => 
          c.phone === phone ? { ...c, profile_pic_url: result.url } : c
        ));
        if (selectedContact?.phone === phone) {
          setSelectedContact(prev => prev ? { ...prev, profile_pic_url: result.url } : prev);
        }
      }
    } catch (e) {
      console.error('Error fetching profile pic:', e);
    }
  };

  const startNewChat = async () => {
    const phone = normalizePhone(newChatPhone);
    if (!phone || phone.length < 10) {
      toast({ title: 'Número inválido', description: 'Digite com DDI + DDD', variant: 'destructive' });
      return;
    }
    setShowNewChat(false);
    setNewChatPhone('');
    await selectContactByPhone(phone);
  };

  useEffect(() => { loadSettings(); }, [loadSettings]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recordedAudioPreview) URL.revokeObjectURL(recordedAudioPreview);
  }, [recordedAudioPreview]);
  useEffect(() => {
    if (view !== 'main') return;
    const interval = setInterval(() => { loadContacts(); checkStatus(); }, 10000);
    return () => clearInterval(interval);
  }, [view, loadContacts, checkStatus]);
  useEffect(() => {
    if (!selectedContact || view !== 'main' || activeTab !== 'chats') return;
    const interval = setInterval(() => {
      loadMessages(selectedContact.phone, true);
      loadActiveExecutions(selectedContact.phone);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedContact, view, activeTab, loadMessages, loadActiveExecutions]);

  const filteredContacts = dedupeContacts(contacts).filter(c =>
    (c.name || c.phone).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const StatusIcon = ({ status }: { status?: string }) => {
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-white/40" />;
    return <Check className="w-3.5 h-3.5 text-white/40" />;
  };

  // Settings view
  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-[#111b21] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#202c33] rounded-2xl p-8 shadow-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">WhatsApp Pro</h1>
              <p className="text-white/50 text-sm">Configure sua instância Z-API</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm mb-1 block">Instance ID</label>
              <Input value={instanceId} onChange={(e) => setInstanceId(e.target.value)} placeholder="Ex: 3C9E1B2..." className="bg-[#2a3942] border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1 block">Token</label>
              <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Seu token" className="bg-[#2a3942] border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1 block">Client Token (Segurança)</label>
              <Input value={clientToken} onChange={(e) => setClientToken(e.target.value)} placeholder="Token de segurança" className="bg-[#2a3942] border-white/10 text-white placeholder:text-white/30" />
            </div>
            <Button onClick={saveSettings} disabled={!instanceId || !token || loading} className="w-full bg-[#00a884] hover:bg-[#00a884]/80 text-white font-bold h-12">
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Conectar Instância
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="h-screen bg-[#111b21] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-[#202c33] h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold hidden sm:inline">WhatsApp Pro</span>
          <span className={`flex items-center gap-1 text-xs ${connected ? 'text-[#00a884]' : 'text-red-400'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-[#111b21] rounded-lg p-0.5">
          {[
            { key: 'chats' as TabType, icon: MessageSquare, label: 'Chat' },
            { key: 'flows' as TabType, icon: Zap, label: 'Fluxos' },
            { key: 'crm' as TabType, icon: BarChart3, label: 'CRM' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.key ? 'bg-[#00a884] text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={syncWhatsAppContacts} disabled={syncingContacts} className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8" title="Sincronizar contatos salvos">
            <Users className={`w-4 h-4 ${syncingContacts ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowNewChat(true)} className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => syncChats()} className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setView('settings')} className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* QR Code Modal */}
      {!connected && qrCode && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-[#202c33] rounded-2xl p-8 max-w-sm mx-4 text-center">
            <h2 className="text-white text-lg font-bold mb-2">Escaneie o QR Code</h2>
            <p className="text-white/50 text-sm mb-4">Abra o WhatsApp no celular e escaneie</p>
            <img src={qrCode} alt="QR Code" className="mx-auto rounded-lg bg-white p-2 max-w-[250px]" />
            <Button onClick={() => { setQrCode(null); checkStatus(); }} className="mt-4 bg-[#00a884] hover:bg-[#00a884]/80 text-white">
              Já escaneei
            </Button>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-[#202c33] rounded-2xl p-6 max-w-sm mx-4 w-full">
            <h2 className="text-white text-lg font-bold mb-3">Nova conversa</h2>
            <Input value={newChatPhone} onChange={(e) => setNewChatPhone(e.target.value)} placeholder="5511999999999"
              className="bg-[#2a3942] border-white/10 text-white placeholder:text-white/30"
              onKeyDown={(e) => e.key === 'Enter' && startNewChat()}
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={startNewChat} className="flex-1 bg-[#00a884] hover:bg-[#00a884]/80 text-white">Iniciar</Button>
              <Button variant="ghost" onClick={() => setShowNewChat(false)} className="text-white/60">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Flows & CRM tabs render full panel */}
        {activeTab === 'flows' && (
          <div className="flex-1">
            <FlowBuilder callProxy={callProxy} onFlowsChange={loadFlows} />
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="flex-1">
            <CRMPanel callProxy={callProxy} onSelectContact={selectContactByPhone} />
          </div>
        )}

        {/* Chat tab */}
        {activeTab === 'chats' && (
          <>
            {/* Contact List */}
            <div className={`${showMobileChat && selectedContact ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-[#111b21] border-r border-white/5`}>
              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar conversa"
                    className="pl-10 bg-[#202c33] border-0 text-white placeholder:text-white/30 rounded-lg h-9 text-sm"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">Nenhuma conversa</p>
                    <Button onClick={() => syncChats()} variant="ghost" className="mt-2 text-[#00a884] text-sm">
                      <RefreshCw className="w-3 h-3 mr-1" /> Sincronizar
                    </Button>
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <div key={contact.phone} onClick={() => selectContact(contact)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#202c33] transition-colors ${selectedContact?.phone === contact.phone ? 'bg-[#2a3942]' : ''}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#6b7b8d] flex items-center justify-center shrink-0 overflow-hidden relative">
                        {contact.profile_pic_url ? (
                          <img src={contact.profile_pic_url} alt="" className="w-full h-full object-cover" />
                        ) : contact.is_group ? (
                          <Users className="w-6 h-6 text-white/60" />
                        ) : (
                          <User className="w-6 h-6 text-white/60" />
                        )}
                        {contact.is_hot_lead && (
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border border-[#111b21]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-medium truncate">{contact.name || formatPhone(contact.phone)}</span>
                          {contact.last_message_at && (
                            <span className="text-white/30 text-xs ml-2">
                              {new Date(contact.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-white/40 text-xs truncate">{formatPhone(contact.phone)}</span>
                          {contact.crm_status && contact.crm_status !== 'novo' && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-[#00a884]/20 text-[#00a884]">{contact.crm_status}</span>
                          )}
                        </div>
                      </div>
                      {contact.unread_count > 0 && (
                        <span className="bg-[#00a884] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {contact.unread_count}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`${!showMobileChat && selectedContact ? 'hidden md:flex' : 'flex'} flex-col flex-1 ${!selectedContact ? 'hidden md:flex' : ''}`}>
              {!selectedContact ? (
                <div className="flex-1 flex items-center justify-center bg-[#222e35]">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-white/10 mx-auto mb-4" />
                    <h2 className="text-white/60 text-xl font-light">WhatsApp Pro</h2>
                    <p className="text-white/30 text-sm mt-1">Selecione uma conversa para começar</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="bg-[#202c33] px-4 py-2 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="md:hidden text-white/60 hover:text-white h-8 w-8"
                        onClick={() => { setShowMobileChat(false); setSelectedContact(null); setShowContactInfo(false); }}>
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div className="w-10 h-10 rounded-full bg-[#6b7b8d] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                        onClick={fetchContactInfo}>
                        {selectedContact.profile_pic_url ? (
                          <img src={selectedContact.profile_pic_url} alt="" className="w-full h-full object-cover" />
                        ) : selectedContact.is_group ? (
                          <Users className="w-5 h-5 text-white/60" />
                        ) : (
                          <User className="w-5 h-5 text-white/60" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={fetchContactInfo}>
                        <p className="text-white text-sm font-medium truncate">{selectedContact.name || formatPhone(selectedContact.phone)}</p>
                        <p className="text-white/40 text-xs">{formatPhone(selectedContact.phone)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className={`text-white/60 hover:text-white h-8 w-8 ${showContactInfo ? 'text-[#00a884]' : ''}`}
                        onClick={() => showContactInfo ? setShowContactInfo(false) : fetchContactInfo()}>
                        <Info className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-white/60 hover:text-white h-8 w-8" onClick={() => loadMessages(selectedContact.phone)}>
                        <RefreshCw className={`w-4 h-4 ${messageLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>

                    {/* Flow Quick Actions */}
                    {flows.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
                        <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        {flows.map(flow => (
                          <button
                            key={flow.id}
                            onClick={() => executeFlow(flow.id)}
                            disabled={executingFlow}
                            className="flex items-center gap-1 bg-[#2a3942] hover:bg-[#00a884]/20 text-white/60 hover:text-[#00a884] px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border border-white/5 hover:border-[#00a884]/30 shrink-0"
                          >
                            <Play className="w-2.5 h-2.5" />
                            {flow.name}
                          </button>
                        ))}
                        {executingFlow && <Loader2 className="w-3 h-3 text-[#00a884] animate-spin shrink-0" />}
                      </div>
                    )}

                    {/* Active Flow Executions */}
                    {activeExecutions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {activeExecutions.map(exec => (
                          <div key={exec.id} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                            <Zap className="w-3 h-3 text-yellow-400 shrink-0" />
                            <span className="text-yellow-300 text-[11px] font-medium truncate flex-1">
                              🤖 {exec.flow_name} — {exec.status === 'running' ? 'Executando' : 'Pausado (aguardando resposta)'}
                            </span>
                            <button
                              onClick={() => cancelExecution(exec.id)}
                              disabled={cancellingExec === exec.id}
                              className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2 py-0.5 rounded text-[10px] font-medium transition-all shrink-0"
                            >
                              {cancellingExec === exec.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <><Square className="w-2.5 h-2.5" /> Cancelar</>
                              )}
                            </button>
                          </div>
                        ))}
                        <p className="text-white/30 text-[9px] px-1">Cancele para assumir o atendimento manualmente</p>
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 bg-[#0b141a]">
                    <div className="p-4 space-y-1 min-h-full flex flex-col justify-end">
                      {messageLoading && messages.length === 0 && (
                        <div className="text-center py-8">
                          <Loader2 className="w-6 h-6 text-white/30 animate-spin mx-auto" />
                        </div>
                      )}
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-lg px-3 py-1.5 ${
                            msg.direction === 'outgoing'
                              ? 'bg-[#005c4b] text-white rounded-tr-none'
                              : 'bg-[#202c33] text-white rounded-tl-none'
                          }`}>
                            {/* Show sender name in group chats */}
                            {selectedContact?.is_group && msg.direction === 'incoming' && msg.contact_name && (
                              <p className="text-xs font-semibold text-[#00a884] mb-0.5">{msg.contact_name}</p>
                            )}
                            {msg.message_type === 'image' && msg.media_url && (
                              <img src={msg.media_url} alt="Mídia" className="rounded max-w-full mb-1 max-h-64 object-contain" />
                            )}
                            {msg.message_type === 'audio' && msg.media_url && (
                              <div className="flex items-center gap-2 py-1">
                                <Mic className="w-4 h-4 text-white/60" />
                                <audio controls src={msg.media_url} className="max-w-[200px] h-8" />
                              </div>
                            )}
                            {msg.message_type === 'video' && msg.media_url && (
                              <video controls src={msg.media_url} className="rounded max-w-full mb-1 max-h-64" />
                            )}
                            {msg.message_type === 'document' && (
                              <div className="flex items-center gap-2 py-1">
                                <FileText className="w-4 h-4 text-white/60" />
                                <span className="text-sm">{msg.content || 'Documento'}</span>
                              </div>
                            )}
                            {(msg.message_type === 'text' || msg.content) && msg.message_type !== 'document' && (
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                            {/* Button message rendering */}
                            {msg.metadata?.buttons && msg.metadata.buttons.length > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {msg.metadata.buttons.map((btn: { id: string; label: string }, i: number) => (
                                  <div key={i} className="text-center border border-[#00a884]/40 rounded-md py-1.5 px-2">
                                    <span className="text-[#00a884] text-sm font-medium">{btn.label}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Button response rendering */}
                            {msg.metadata?.selectedButtonText && !msg.content && (
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.metadata.selectedButtonText}</p>
                            )}
                            <div className={`flex items-center gap-1 mt-0.5 ${msg.direction === 'outgoing' ? 'justify-end' : ''}`}>
                              <span className="text-[10px] text-white/40">{formatTime(msg)}</span>
                              {msg.direction === 'outgoing' && <StatusIcon status={msg.status} />}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Pasted Image Preview */}
                  {pastedPreview && (
                    <div className="bg-[#1a2730] px-4 py-3 border-t border-white/5">
                      <div className="flex items-start gap-3">
                        <img src={pastedPreview} alt="Preview" className="max-h-40 rounded-lg object-contain border border-white/10" />
                        <div className="flex-1 space-y-2">
                          <p className="text-white/60 text-xs">Imagem colada (Ctrl+V)</p>
                          <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Legenda (opcional)"
                            className="bg-[#2a3942] border-white/10 text-white placeholder:text-white/30 text-sm"
                          />
                          <div className="flex gap-2">
                            <Button onClick={sendPastedImage} disabled={uploadingMedia} className="bg-[#00a884] hover:bg-[#00a884]/80 text-white text-sm h-8">
                              {uploadingMedia ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                              Enviar
                            </Button>
                            <Button onClick={cancelPaste} variant="ghost" className="text-white/40 hover:text-white/60 text-sm h-8">
                              <X className="w-3 h-3 mr-1" /> Cancelar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Media Input (URL mode) */}
                  {showMediaInput && !pastedPreview && (
                    <div className="bg-[#1a2730] px-4 py-3 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {(['image', 'audio', 'video'] as const).map(t => (
                            <button key={t} onClick={() => setMediaType(t)}
                              className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${mediaType === t ? 'bg-[#00a884] text-white' : 'bg-[#2a3942] text-white/40'}`}>
                              {t === 'image' ? <Image className="w-3 h-3" /> : t === 'audio' ? <Mic className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                              {t === 'image' ? 'Imagem' : t === 'audio' ? 'Áudio' : 'Vídeo'}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setShowMediaInput(false)} className="text-white/30 hover:text-white/60">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Cole a URL da mídia aqui..."
                        className="bg-[#2a3942] border-white/10 text-white placeholder:text-white/30 text-sm"
                      />
                      {mediaType === 'image' && (
                        <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Legenda (opcional)"
                          className="bg-[#2a3942] border-white/10 text-white placeholder:text-white/30 text-sm"
                        />
                      )}
                      <Button onClick={sendMedia} disabled={!mediaUrl.trim() || sendingMessage} className="w-full bg-[#00a884] hover:bg-[#00a884]/80 text-white text-sm h-9">
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                        Enviar {mediaType === 'image' ? 'Imagem' : mediaType === 'audio' ? 'Áudio' : 'Vídeo'}
                      </Button>
                    </div>
                  )}

                  {/* Recording UI */}
                  {isRecording && (
                    <div className="bg-[#1a2730] px-4 py-3 flex items-center gap-3 border-t border-white/5 shrink-0">
                      <button onClick={cancelRecording} className="text-red-400 hover:text-red-300 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-white/70 text-sm font-mono">{formatRecordingTime(recordingTime)}</span>
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: `${Math.min(recordingTime * 2, 100)}%` }} />
                        </div>
                      </div>
                      <button onClick={stopRecording}
                        className="bg-[#00a884] hover:bg-[#00a884]/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors">
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Recorded Audio Preview */}
                  {!isRecording && recordedAudioPreview && (
                    <div className="bg-[#1a2730] px-4 py-3 border-t border-white/5 shrink-0">
                      <div className="flex items-start gap-3">
                        <button onClick={cancelRecordedAudio} className="text-red-400 hover:text-red-300 transition-colors mt-1">
                          <X className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                          <p className="text-white/60 text-xs mb-1">Prévia do áudio gravado</p>
                          <audio controls src={recordedAudioPreview} className="w-full h-8" />
                        </div>
                        <Button onClick={sendRecordedAudio} disabled={uploadingMedia}
                          className="bg-[#00a884] hover:bg-[#00a884]/80 text-white h-9 px-3">
                          {uploadingMedia ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                          Enviar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="bg-[#202c33] border-t border-white/5 px-4 py-2 shrink-0">
                      <div className="grid grid-cols-10 gap-1 max-h-[180px] overflow-y-auto">
                        {EMOJI_LIST.map((emoji) => (
                          <button key={emoji} onClick={() => { setMessageText(prev => prev + emoji); setShowEmojiPicker(false); }}
                            className="text-xl hover:bg-white/10 rounded p-1 transition-colors cursor-pointer">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  {!isRecording && !pastedPreview && !recordedAudioPreview && (
                    <div className="bg-[#202c33] px-4 py-3 flex items-end gap-2 border-t border-white/5 shrink-0">
                      {/* Hidden file input */}
                      <input ref={fileInputRef} type="file" accept="image/*,audio/*,video/*" onChange={handleFileSelect} className="hidden" />

                      {/* Emoji button */}
                      <Button variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`text-white/40 hover:text-white h-10 w-10 shrink-0 ${showEmojiPicker ? 'text-[#00a884]' : ''}`}>
                        <Smile className="w-5 h-5" />
                      </Button>
                      
                      {/* Attachment button */}
                      <Button variant="ghost" size="icon" onClick={() => setShowMediaInput(!showMediaInput)}
                        className={`text-white/40 hover:text-white h-10 w-10 shrink-0 ${showMediaInput ? 'text-[#00a884]' : ''}`}>
                        <Paperclip className="w-5 h-5" />
                      </Button>

                      {/* Upload file button */}
                      <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia}
                        className="text-white/40 hover:text-white h-10 w-10 shrink-0">
                        {uploadingMedia ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      </Button>

                      {/* Text area with paste handler */}
                      <div className="flex-1">
                        <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                          onPaste={handlePaste}
                          placeholder="Digite uma mensagem ou cole uma imagem (Ctrl+V)"
                          className="bg-[#2a3942] border-0 text-white placeholder:text-white/30 rounded-lg resize-none min-h-[40px] max-h-[120px] py-2.5 text-sm"
                          rows={1}
                        />
                      </div>

                      {/* Send or Record button */}
                      {messageText.trim() ? (
                        <Button onClick={sendMessage} disabled={sendingMessage}
                          className="bg-[#00a884] hover:bg-[#00a884]/80 text-white rounded-full w-10 h-10 p-0 shrink-0">
                          {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                      ) : (
                        <Button onClick={startRecording} disabled={uploadingMedia}
                          className="bg-[#00a884] hover:bg-[#00a884]/80 text-white rounded-full w-10 h-10 p-0 shrink-0">
                          <Mic className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Contact Info Panel */}
            {showContactInfo && selectedContact && (
              <div className="w-80 bg-[#111b21] border-l border-white/5 flex flex-col shrink-0 overflow-hidden">
                <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3 border-b border-white/5">
                  <Button variant="ghost" size="icon" onClick={() => setShowContactInfo(false)} className="text-white/60 hover:text-white h-8 w-8">
                    <X className="w-5 h-5" />
                  </Button>
                  <span className="text-white font-medium text-sm">Informações do contato</span>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="flex flex-col items-center py-6 px-4">
                    {/* Profile Picture */}
                    <div className="w-28 h-28 rounded-full bg-[#6b7b8d] flex items-center justify-center overflow-hidden mb-4">
                      {(selectedContact.profile_pic_url || contactInfo?.profile_pic) ? (
                        <img src={selectedContact.profile_pic_url || contactInfo?.profile_pic} alt="" className="w-full h-full object-cover" />
                      ) : loadingContactInfo ? (
                        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
                      ) : (
                        <User className="w-12 h-12 text-white/40" />
                      )}
                    </div>
                    
                    {/* Name */}
                    <h3 className="text-white text-lg font-semibold text-center">
                      {selectedContact.name || formatPhone(selectedContact.phone)}
                    </h3>
                    <p className="text-white/40 text-sm mt-1">{formatPhone(selectedContact.phone)}</p>
                    
                    {/* Tags */}
                    {selectedContact.tags && selectedContact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 justify-center">
                        {selectedContact.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884]">{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    {/* CRM Status */}
                    {selectedContact.crm_status && selectedContact.crm_status !== 'novo' && (
                      <div className="mt-3">
                        <span className="text-xs px-3 py-1 rounded-full bg-[#00a884]/20 text-[#00a884] font-medium">{selectedContact.crm_status}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Contact Details */}
                  <div className="border-t border-white/5 px-4 py-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-[#00a884] shrink-0" />
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">Telefone</p>
                        <p className="text-white text-sm">{formatPhone(selectedContact.phone)}</p>
                      </div>
                    </div>
                    
                    {selectedContact.is_hot_lead && (
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-orange-400 shrink-0" />
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Status</p>
                          <p className="text-orange-400 text-sm font-medium">🔥 Lead Quente</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Business Profile Info */}
                  {loadingContactInfo && (
                    <div className="px-4 py-6 text-center">
                      <Loader2 className="w-5 h-5 text-white/30 animate-spin mx-auto mb-2" />
                      <p className="text-white/30 text-xs">Carregando informações...</p>
                    </div>
                  )}
                  
                  {contactInfo?.business_profile && !loadingContactInfo && (
                    <div className="border-t border-white/5 px-4 py-4 space-y-4">
                      <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Perfil Comercial</p>
                      
                      {contactInfo.business_profile.description && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-4 h-4 text-[#00a884] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider">Descrição</p>
                            <p className="text-white text-sm">{contactInfo.business_profile.description}</p>
                          </div>
                        </div>
                      )}
                      
                      {contactInfo.business_profile.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-[#00a884] shrink-0" />
                          <div>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider">Email</p>
                            <a href={`mailto:${contactInfo.business_profile.email}`} className="text-[#00a884] text-sm hover:underline">{contactInfo.business_profile.email}</a>
                          </div>
                        </div>
                      )}
                      
                      {(contactInfo.business_profile.websites || contactInfo.business_profile.website) && (
                        <div className="flex items-start gap-3">
                          <Globe className="w-4 h-4 text-[#00a884] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider">Website / Links</p>
                            {(Array.isArray(contactInfo.business_profile.websites) ? contactInfo.business_profile.websites : [contactInfo.business_profile.website]).filter(Boolean).map((url: string, i: number) => (
                              <a key={i} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" 
                                className="text-[#00a884] text-sm hover:underline block truncate">{url}</a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {contactInfo.business_profile.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-[#00a884] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider">Endereço</p>
                            <p className="text-white text-sm">{contactInfo.business_profile.address}</p>
                          </div>
                        </div>
                      )}
                      
                      {contactInfo.business_profile.category && (
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-[#00a884] shrink-0" />
                          <div>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider">Categoria</p>
                            <p className="text-white text-sm">{contactInfo.business_profile.category}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!loadingContactInfo && !contactInfo?.business_profile && (
                    <div className="border-t border-white/5 px-4 py-6 text-center">
                      <p className="text-white/30 text-xs">Nenhuma informação comercial disponível</p>
                      <p className="text-white/20 text-[10px] mt-1">Apenas contas comerciais possuem informações extras</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
