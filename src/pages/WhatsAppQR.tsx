import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAdminLoggedIn } from '@/lib/adminConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  Settings, 
  Users, 
  Zap, 
  GitBranch, 
  Bot,
  BarChart3,
  RefreshCcw,
  Calendar,
  Webhook,
  QrCode,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  User,
  Plus,
  Trash2,
  Save,
  MoreHorizontal,
  LogOut
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import FlowEditor from "@/components/crm/FlowEditor";
import Broadcaster from "@/components/crm/Broadcaster";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";

const WhatsAppQR = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [contacts, setContacts] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [flows, setFlows] = useState<any[]>([]);
  const [isFlowEditorOpen, setIsFlowEditorOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<any>(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/login');
      return;
    }
    fetchInitialData();
    const interval = setInterval(syncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: contactsData } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('last_interaction', { ascending: false, nullsFirst: false });
      setContacts(contactsData || []);

      const { data: flowsData } = await supabase.from('crm_flows').select('*, crm_flow_steps(*)');
      setFlows(flowsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const syncStatus = async () => {
    const { data: session } = await supabase.from('wpp_bot_session').select('*').eq('id', 'renda_extra').maybeSingle();
    if (session) {
      setStatus(session.status as any);
      setQrCode(session.qr_code);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    try {
      const { error } = await supabase.from('wpp_bot_messages').insert([{
        phone: selectedContact.wa_id.replace(/\D/g, ""),
        message: newMessage,
        status: 'pending',
        is_direct: true
      }]);
      if (error) throw error;
      setNewMessage('');
      toast({ title: "Mensagem enviada para fila!" });
    } catch (e) {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    }
  };

  const renderDashboard = () => (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <h3 className="text-2xl font-bold capitalize">{status}</h3>
              </div>
              <div className={cn("p-2 rounded-lg", status === 'connected' ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600")}>
                <QrCode className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Contatos</p>
                <h3 className="text-2xl font-bold">{contacts.length}</h3>
              </div>
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-2xl border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" /> Conexão WhatsApp
            </CardTitle>
            <CardDescription>Escaneie para conectar sua conta pessoal</CardDescription>
          </CardHeader>
          <CardContent className="p-12 flex flex-col items-center justify-center min-h-[400px]">
            {status === 'connected' ? (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold">WhatsApp Conectado!</h2>
                <p className="text-muted-foreground">Seu sistema está pronto para sincronizar conversas.</p>
                <Button variant="outline" className="rounded-xl border-red-200 text-red-500 hover:bg-red-50">Desconectar</Button>
              </div>
            ) : qrCode ? (
              <div className="text-center space-y-6">
                <div className="p-4 bg-white rounded-3xl shadow-2xl inline-block border-8 border-primary/5">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Escaneie o Código</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">Abra o WhatsApp no seu celular {'>'} Configurações {'>'} Aparelhos Conectados</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <RefreshCcw className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-muted-foreground">Gerando novo QR Code...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <SidebarProvider>
      <div className="h-screen w-full flex overflow-hidden bg-background relative">
        <Sidebar className="border-r shadow-sm">
          <SidebarHeader className="p-4 border-b flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Logo size="sm" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">WhatsApp QR Core</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[
                    { id: 'dashboard', label: 'Conexão', icon: QrCode },
                    { id: 'contacts', label: 'Conversas', icon: MessageSquare },
                    { id: 'broadcast', label: 'Envio em Massa', icon: Zap },
                    { id: 'flows', label: 'Fluxos Automáticos', icon: GitBranch },
                    { id: 'ai-agent', label: 'Agente I.A.', icon: Bot },
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
        </Sidebar>

        <SidebarInset className="flex flex-col min-w-0">
          <header className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-6 w-px bg-border mx-2" />
              <h1 className="font-bold text-lg capitalize">{activeTab.replace('-', ' ')}</h1>
            </div>
            <div className="flex items-center gap-4">
               <Badge variant="outline" className={cn(
                  "gap-1.5 px-3 py-1 border-none",
                  status === 'connected' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                )}>
                  <div className={cn("w-2 h-2 rounded-full", status === 'connected' ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                  {status === 'connected' ? 'Sistema Online' : 'Aguardando QR'}
                </Badge>
            </div>
          </header>

          <main className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full">
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'contacts' && (
                <div className="h-[calc(100vh-64px)] flex animate-in fade-in duration-500">
                  <div className="w-80 border-r bg-card flex flex-col">
                    <div className="p-4 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar conversas..." className="pl-9 bg-muted/50 border-none rounded-xl" />
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      {contacts.map(contact => (
                        <div 
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className={cn(
                            "p-4 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors border-b",
                            selectedContact?.id === contact.id && "bg-primary/5 border-l-4 border-l-primary"
                          )}
                        >
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start mb-0.5">
                              <h4 className="font-bold truncate text-sm">{contact.name || contact.wa_id}</h4>
                              <span className="text-[10px] text-muted-foreground">12:30</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">Clique para ver mensagens...</p>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  <div className="flex-1 flex flex-col bg-muted/5">
                    {selectedContact ? (
                      <>
                        <div className="h-16 border-b bg-card flex items-center justify-between px-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm">{selectedContact.name || selectedContact.wa_id}</h3>
                                <p className="text-[10px] text-green-500 font-medium">Online</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="w-5 h-5" /></Button>
                           </div>
                        </div>
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                           <div className="flex justify-center">
                              <Badge variant="outline" className="bg-muted/20 text-[10px] font-medium py-1 px-4">Histórico Sincronizado</Badge>
                           </div>
                           <p className="text-center text-xs text-muted-foreground p-8">Sincronizando mensagens do celular...</p>
                        </div>
                        <div className="p-4 bg-card border-t flex gap-3 items-center">
                          <Input 
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Digite uma mensagem..." 
                            className="flex-1 bg-muted/50 border-none h-12 rounded-2xl" 
                          />
                          <Button onClick={handleSendMessage} size="icon" className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20">
                            <Send className="w-5 h-5" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-2">
                          <MessageSquare className="w-10 h-10 text-primary/40" />
                        </div>
                        <h3 className="text-xl font-bold">Selecione uma conversa</h3>
                        <p className="text-muted-foreground max-w-xs">Escolha um contato à esquerda para visualizar o histórico de mensagens e responder.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'flows' && (
                <div className="p-8">
                   <div className="flex justify-between items-center mb-8">
                      <div>
                        <h2 className="text-2xl font-bold">Fluxos Automáticos</h2>
                        <p className="text-muted-foreground">Automações baseadas em gatilhos de mensagens recebidas.</p>
                      </div>
                      <Button onClick={() => setIsFlowEditorOpen(true)} className="bg-primary rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" /> Novo Fluxo
                      </Button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {flows.map(flow => (
                        <Card key={flow.id} className="hover:shadow-lg transition-all border-none shadow-sm bg-card group overflow-hidden rounded-2xl">
                          <CardHeader className="p-6">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant={flow.is_active ? 'default' : 'secondary'} className={cn(flow.is_active ? "bg-green-500" : "")}>
                                {flow.is_active ? 'Ativo' : 'Pausado'}
                              </Badge>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingFlow(flow); setIsFlowEditorOpen(true); }} className="h-8 w-8 rounded-lg"><Settings className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </div>
                            <CardTitle className="text-lg font-bold">{flow.name}</CardTitle>
                            <CardDescription className="text-xs">Gatilho: {flow.trigger_type}</CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                   </div>
                </div>
              )}
              {activeTab === 'broadcast' && (
                <Broadcaster 
                  templates={[]} 
                  flows={flows} 
                  contacts={contacts} 
                />
              )}
            </ScrollArea>
          </main>
        </SidebarInset>
      </div>

      {isFlowEditorOpen && (
        <div className="fixed inset-0 z-[200] bg-background">
          <FlowEditor 
            flow={editingFlow} 
            onSave={() => { setIsFlowEditorOpen(false); fetchInitialData(); }}
            onClose={() => setIsFlowEditorOpen(false)}
          />
        </div>
      )}
    </SidebarProvider>
  );
};

export default WhatsAppQR;
