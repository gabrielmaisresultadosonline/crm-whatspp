import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, Users, Bell, Plus, Trash2, Edit, Eye, EyeOff, 
  RefreshCw, LogOut, Check, X, Calendar, Mail, Key, Image, Video, FileText,
  ShoppingCart, CreditCard, Clock, CheckCircle, XCircle
} from 'lucide-react';
import CorretorAPIDocumentation from '@/components/admin/CorretorAPIDocumentation';

interface CorretorUser {
  id: string;
  email: string;
  name: string | null;
  status: string;
  days_remaining: number;
  corrections_count: number;
  subscription_start: string | null;
  subscription_end: string | null;
  last_access: string | null;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  is_blocking: boolean;
  display_duration: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  views?: number;
}

interface CorretorOrder {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  amount: number;
  nsu_order: string;
  status: string;
  infinitepay_link: string | null;
  expired_at: string | null;
  paid_at: string | null;
  access_created: boolean;
  email_sent: boolean;
  created_at: string;
}

const CorretorMROAdmin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Settings
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Users
  const [users, setUsers] = useState<CorretorUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserDays, setNewUserDays] = useState(30);
  const [editingUser, setEditingUser] = useState<CorretorUser | null>(null);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    image_url: '',
    video_url: '',
    is_blocking: false,
    display_duration: 0
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementViews, setAnnouncementViews] = useState<Record<string, { user_email: string; viewed_at: string }[]>>({});

  // Orders
  const [orders, setOrders] = useState<CorretorOrder[]>([]);
  const [orderSearch, setOrderSearch] = useState('');

  // Verificar autenticação
  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data: settings } = await supabase
        .from('corretor_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['admin_email', 'admin_password']);

      const adminEmail = settings?.find(s => s.setting_key === 'admin_email')?.setting_value;
      const adminPassword = settings?.find(s => s.setting_key === 'admin_password')?.setting_value;

      if (email === adminEmail && password === adminPassword) {
        setIsAuthenticated(true);
        loadData();
        toast.success('Login realizado com sucesso!');
      } else {
        toast.error('Credenciais inválidas');
      }
    } catch (err) {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    await Promise.all([loadSettings(), loadUsers(), loadAnnouncements(), loadOrders()]);
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from('corretor_settings')
      .select('*');

    if (data) {
      const apiKey = data.find(s => s.setting_key === 'openai_api_key')?.setting_value || '';
      setOpenaiApiKey(apiKey);
    }
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('corretor_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setUsers(data);
  };

  const loadAnnouncements = async () => {
    const { data: announceData } = await supabase
      .from('corretor_announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (announceData) {
      setAnnouncements(announceData);
      
      // Load views for each announcement
      const viewsMap: Record<string, { user_email: string; viewed_at: string }[]> = {};
      for (const ann of announceData) {
        const { data: views } = await supabase
          .from('corretor_announcement_views')
          .select('*, corretor_users(email)')
          .eq('announcement_id', ann.id);
        
        if (views) {
          viewsMap[ann.id] = views.map((v: any) => ({
            user_email: v.corretor_users?.email || 'Desconhecido',
            viewed_at: v.viewed_at
          }));
        }
      }
      setAnnouncementViews(viewsMap);
    }
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from('corretor_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setOrders(data as CorretorOrder[]);
  };

  const markOrderPaid = async (orderId: string) => {
    await supabase
      .from('corretor_orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', orderId);
    
    // Trigger webhook para criar acesso
    const order = orders.find(o => o.id === orderId);
    if (order) {
      await supabase.functions.invoke('corretor-webhook', {
        body: { order_nsu: order.nsu_order, paid: true }
      });
    }
    
    toast.success('Pedido marcado como pago!');
    loadOrders();
  };

  const filteredOrders = orders.filter(o => 
    o.email.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.nsu_order.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await supabase
        .from('corretor_settings')
        .update({ setting_value: openaiApiKey })
        .eq('setting_key', 'openai_api_key');

      toast.success('Configurações salvas!');
    } catch (err) {
      toast.error('Erro ao salvar');
    } finally {
      setSavingSettings(false);
    }
  };

  const addUser = async () => {
    if (!newUserEmail) {
      toast.error('E-mail é obrigatório');
      return;
    }

    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + newUserDays);

    const { error } = await supabase
      .from('corretor_users')
      .insert({
        email: newUserEmail,
        name: newUserName || null,
        days_remaining: newUserDays,
        status: 'active',
        subscription_start: new Date().toISOString(),
        subscription_end: subscriptionEnd.toISOString()
      });

    if (error) {
      toast.error('Erro ao adicionar usuário');
      return;
    }

    toast.success('Usuário adicionado!');
    setShowAddUser(false);
    setNewUserEmail('');
    setNewUserName('');
    setNewUserDays(30);
    loadUsers();
  };

  const updateUser = async (user: CorretorUser) => {
    const { error } = await supabase
      .from('corretor_users')
      .update({
        email: user.email,
        name: user.name,
        days_remaining: user.days_remaining,
        status: user.status
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Erro ao atualizar');
      return;
    }

    toast.success('Usuário atualizado!');
    setEditingUser(null);
    loadUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    await supabase.from('corretor_users').delete().eq('id', id);
    toast.success('Usuário excluído');
    loadUsers();
  };

  const toggleUserStatus = async (user: CorretorUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await supabase
      .from('corretor_users')
      .update({ status: newStatus })
      .eq('id', user.id);
    
    toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}`);
    loadUsers();
  };

  const addAnnouncement = async () => {
    if (!announcementForm.title) {
      toast.error('Título é obrigatório');
      return;
    }

    const { error } = await supabase
      .from('corretor_announcements')
      .insert({
        title: announcementForm.title,
        content: announcementForm.content || null,
        image_url: announcementForm.image_url || null,
        video_url: announcementForm.video_url || null,
        is_blocking: announcementForm.is_blocking,
        display_duration: announcementForm.display_duration,
        is_active: true
      });

    if (error) {
      toast.error('Erro ao criar aviso');
      return;
    }

    toast.success('Aviso criado!');
    setShowAddAnnouncement(false);
    setAnnouncementForm({ title: '', content: '', image_url: '', video_url: '', is_blocking: false, display_duration: 0 });
    loadAnnouncements();
  };

  const updateAnnouncement = async () => {
    if (!editingAnnouncement) return;

    const { error } = await supabase
      .from('corretor_announcements')
      .update({
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        image_url: editingAnnouncement.image_url,
        video_url: editingAnnouncement.video_url,
        is_blocking: editingAnnouncement.is_blocking,
        display_duration: editingAnnouncement.display_duration,
        is_active: editingAnnouncement.is_active
      })
      .eq('id', editingAnnouncement.id);

    if (error) {
      toast.error('Erro ao atualizar');
      return;
    }

    toast.success('Aviso atualizado!');
    setEditingAnnouncement(null);
    loadAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;

    await supabase.from('corretor_announcements').delete().eq('id', id);
    toast.success('Aviso excluído');
    loadAnnouncements();
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Admin - Corretor MRO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Admin - Corretor MRO
          </h1>
          <Button variant="ghost" onClick={() => setIsAuthenticated(false)} className="text-gray-400">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="orders">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Key className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Bell className="w-4 h-4 mr-2" />
              Avisos
            </TabsTrigger>
            <TabsTrigger value="docs">
              <FileText className="w-4 h-4 mr-2" />
              Documentação API
            </TabsTrigger>
          </TabsList>

          {/* PEDIDOS */}
          <TabsContent value="orders">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-gray-400 text-sm">Total Pedidos</p>
                  <p className="text-2xl font-bold text-white">{orders.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-gray-400 text-sm">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-400">{orders.filter(o => o.status === 'pending').length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-gray-400 text-sm">Pagos</p>
                  <p className="text-2xl font-bold text-green-400">{orders.filter(o => o.status === 'paid' || o.status === 'completed').length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-gray-400 text-sm">Faturamento</p>
                  <p className="text-2xl font-bold text-blue-400">
                    R$ {orders.filter(o => o.status === 'paid' || o.status === 'completed').reduce((sum, o) => sum + Number(o.amount), 0).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pedidos ({orders.length})
                </CardTitle>
                <Button onClick={loadOrders} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Buscar por e-mail ou NSU..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mb-4"
                />

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between bg-gray-900 p-3 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{order.email}</span>
                          <Badge variant={
                            order.status === 'completed' ? 'default' : 
                            order.status === 'paid' ? 'default' : 
                            order.status === 'expired' ? 'destructive' : 'secondary'
                          } className={order.status === 'completed' || order.status === 'paid' ? 'bg-green-600' : ''}>
                            {order.status === 'completed' ? 'Completo' : 
                             order.status === 'paid' ? 'Pago' : 
                             order.status === 'expired' ? 'Expirado' : 'Pendente'}
                          </Badge>
                          {order.access_created && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                        {order.name && <p className="text-gray-400 text-sm">{order.name}</p>}
                        <div className="flex items-center gap-3 text-gray-500 text-xs mt-1">
                          <span className="text-blue-400 font-mono">{order.nsu_order}</span>
                          <span>R$ {Number(order.amount).toFixed(2)}</span>
                          <span>{new Date(order.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && (
                          <Button size="sm" onClick={() => markOrderPaid(order.id)} className="bg-green-600 hover:bg-green-700">
                            <Check className="w-4 h-4 mr-1" /> Pago
                          </Button>
                        )}
                        {order.infinitepay_link && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(order.infinitepay_link!, '_blank')}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredOrders.length === 0 && (
                    <p className="text-gray-500 text-center py-8">Nenhum pedido encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONFIGURAÇÕES */}
          <TabsContent value="settings">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Configurações da API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">API Key do OpenAI (ChatGPT)</Label>
                  <Input
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Esta API será usada pela extensão para corrigir textos
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h4 className="text-white font-medium mb-2">Endpoints para a Extensão:</h4>
                  <div className="bg-gray-900 p-3 rounded text-sm font-mono text-gray-300 space-y-2">
                    <p>
                      <span className="text-blue-400">POST</span>{' '}
                      <span className="text-green-400">/functions/v1/corretor-api</span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      Actions: verify_user, get_api_key, get_announcements, mark_viewed
                    </p>
                  </div>
                </div>

                <Button onClick={saveSettings} disabled={savingSettings} className="bg-blue-600 hover:bg-blue-700">
                  {savingSettings ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USUÁRIOS */}
          <TabsContent value="users">
            {/* Stats summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-gray-400 text-sm">Total Usuários</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-gray-400 text-sm">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-green-400">{users.filter(u => u.status === 'active').length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-gray-400 text-sm">Total Correções</p>
                  <p className="text-2xl font-bold text-blue-400">{users.reduce((sum, u) => sum + (u.corrections_count || 0), 0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-gray-400 text-sm">Média por Usuário</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {users.length > 0 ? Math.round(users.reduce((sum, u) => sum + (u.corrections_count || 0), 0) / users.length) : 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Usuários ({users.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={loadUsers} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Adicionar Usuário</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="E-mail *"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <Input
                          placeholder="Nome (opcional)"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <div>
                          <Label className="text-gray-300">Dias de acesso</Label>
                          <Input
                            type="number"
                            value={newUserDays}
                            onChange={(e) => setNewUserDays(Number(e.target.value))}
                            className="bg-gray-700 border-gray-600 text-white mt-1"
                          />
                        </div>
                        <Button onClick={addUser} className="w-full bg-green-600 hover:bg-green-700">
                          Adicionar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Buscar por e-mail ou nome..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mb-4"
                />

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between bg-gray-900 p-3 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{user.email}</span>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {user.name && <p className="text-gray-400 text-sm">{user.name}</p>}
                        <div className="flex items-center gap-3 text-gray-500 text-xs">
                          <span className="text-blue-400 font-medium">{user.corrections_count || 0} correções</span>
                          <span>{user.days_remaining} dias restantes</span>
                          {user.last_access && <span>Último acesso: {new Date(user.last_access).toLocaleString('pt-BR')}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => toggleUserStatus(user)}
                        >
                          {user.status === 'active' ? <X className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-green-400" />}
                        </Button>
                        <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => setEditingUser(user)}>
                              <Edit className="w-4 h-4 text-blue-400" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-800 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">Editar Usuário</DialogTitle>
                            </DialogHeader>
                            {editingUser && (
                              <div className="space-y-4">
                                <Input
                                  placeholder="E-mail"
                                  value={editingUser.email}
                                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                  className="bg-gray-700 border-gray-600 text-white"
                                />
                                <Input
                                  placeholder="Nome"
                                  value={editingUser.name || ''}
                                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                  className="bg-gray-700 border-gray-600 text-white"
                                />
                                <div>
                                  <Label className="text-gray-300">Dias restantes</Label>
                                  <Input
                                    type="number"
                                    value={editingUser.days_remaining}
                                    onChange={(e) => setEditingUser({...editingUser, days_remaining: Number(e.target.value)})}
                                    className="bg-gray-700 border-gray-600 text-white mt-1"
                                  />
                                </div>
                                <Button onClick={() => updateUser(editingUser)} className="w-full bg-blue-600 hover:bg-blue-700">
                                  Salvar
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="ghost" onClick={() => deleteUser(user.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AVISOS */}
          <TabsContent value="announcements">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Avisos/Popups ({announcements.length})
                </CardTitle>
                <Dialog open={showAddAnnouncement} onOpenChange={setShowAddAnnouncement}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Aviso
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700 max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-white">Criar Aviso</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                      <Input
                        placeholder="Título *"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Textarea
                        placeholder="Conteúdo (texto)"
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={4}
                      />
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="URL da imagem (opcional)"
                          value={announcementForm.image_url}
                          onChange={(e) => setAnnouncementForm({...announcementForm, image_url: e.target.value})}
                          className="bg-gray-700 border-gray-600 text-white flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="URL do vídeo YouTube (opcional)"
                          value={announcementForm.video_url}
                          onChange={(e) => setAnnouncementForm({...announcementForm, video_url: e.target.value})}
                          className="bg-gray-700 border-gray-600 text-white flex-1"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={announcementForm.is_blocking}
                            onCheckedChange={(checked) => setAnnouncementForm({...announcementForm, is_blocking: checked})}
                          />
                          <Label className="text-gray-300">Bloquear navegação até ler</Label>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-300">Tempo mínimo para fechar (segundos)</Label>
                        <Input
                          type="number"
                          value={announcementForm.display_duration}
                          onChange={(e) => setAnnouncementForm({...announcementForm, display_duration: Number(e.target.value)})}
                          className="bg-gray-700 border-gray-600 text-white mt-1"
                          placeholder="0 = sem tempo mínimo"
                        />
                      </div>
                      <Button onClick={addAnnouncement} className="w-full bg-green-600 hover:bg-green-700">
                        Criar Aviso
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{ann.title}</span>
                            <Badge variant={ann.is_active ? 'default' : 'secondary'}>
                              {ann.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {ann.is_blocking && (
                              <Badge variant="destructive">Bloqueante</Badge>
                            )}
                          </div>
                          {ann.content && (
                            <p className="text-gray-400 text-sm line-clamp-2">{ann.content}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {ann.image_url && <span className="flex items-center gap-1"><Image className="w-3 h-3" /> Imagem</span>}
                            {ann.video_url && <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Vídeo</span>}
                            {ann.display_duration > 0 && <span>{ann.display_duration}s mínimo</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4 text-gray-400" />
                                <span className="ml-1 text-xs">{announcementViews[ann.id]?.length || 0}</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-800 border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="text-white">Visualizações: {ann.title}</DialogTitle>
                              </DialogHeader>
                              <div className="max-h-[400px] overflow-y-auto space-y-2">
                                {announcementViews[ann.id]?.length > 0 ? (
                                  announcementViews[ann.id].map((view, i) => (
                                    <div key={i} className="bg-gray-900 p-2 rounded flex justify-between">
                                      <span className="text-gray-300">{view.user_email}</span>
                                      <span className="text-gray-500 text-sm">
                                        {new Date(view.viewed_at).toLocaleString('pt-BR')}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-500 text-center py-4">Nenhuma visualização</p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={editingAnnouncement?.id === ann.id} onOpenChange={(open) => !open && setEditingAnnouncement(null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => setEditingAnnouncement(ann)}>
                                <Edit className="w-4 h-4 text-blue-400" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-800 border-gray-700 max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="text-white">Editar Aviso</DialogTitle>
                              </DialogHeader>
                              {editingAnnouncement && (
                                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                                  <Input
                                    placeholder="Título"
                                    value={editingAnnouncement.title}
                                    onChange={(e) => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})}
                                    className="bg-gray-700 border-gray-600 text-white"
                                  />
                                  <Textarea
                                    placeholder="Conteúdo"
                                    value={editingAnnouncement.content || ''}
                                    onChange={(e) => setEditingAnnouncement({...editingAnnouncement, content: e.target.value})}
                                    className="bg-gray-700 border-gray-600 text-white"
                                    rows={4}
                                  />
                                  <Input
                                    placeholder="URL da imagem"
                                    value={editingAnnouncement.image_url || ''}
                                    onChange={(e) => setEditingAnnouncement({...editingAnnouncement, image_url: e.target.value})}
                                    className="bg-gray-700 border-gray-600 text-white"
                                  />
                                  <Input
                                    placeholder="URL do vídeo"
                                    value={editingAnnouncement.video_url || ''}
                                    onChange={(e) => setEditingAnnouncement({...editingAnnouncement, video_url: e.target.value})}
                                    className="bg-gray-700 border-gray-600 text-white"
                                  />
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={editingAnnouncement.is_active}
                                        onCheckedChange={(checked) => setEditingAnnouncement({...editingAnnouncement, is_active: checked})}
                                      />
                                      <Label className="text-gray-300">Ativo</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={editingAnnouncement.is_blocking}
                                        onCheckedChange={(checked) => setEditingAnnouncement({...editingAnnouncement, is_blocking: checked})}
                                      />
                                      <Label className="text-gray-300">Bloqueante</Label>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-gray-300">Tempo mínimo (segundos)</Label>
                                    <Input
                                      type="number"
                                      value={editingAnnouncement.display_duration}
                                      onChange={(e) => setEditingAnnouncement({...editingAnnouncement, display_duration: Number(e.target.value)})}
                                      className="bg-gray-700 border-gray-600 text-white mt-1"
                                    />
                                  </div>
                                  <Button onClick={updateAnnouncement} className="w-full bg-blue-600 hover:bg-blue-700">
                                    Salvar
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="ghost" onClick={() => deleteAnnouncement(ann.id)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {announcements.length === 0 && (
                    <p className="text-gray-500 text-center py-8">Nenhum aviso criado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTAÇÃO API */}
          <TabsContent value="docs">
            <CorretorAPIDocumentation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CorretorMROAdmin;
