import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Users, CreditCard, Clock, CheckCircle, XCircle, 
  Loader2, RefreshCw, Trash2, Eye, Calendar, Search, LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logoMro from '@/assets/logo-mro.png';

const ADMIN_EMAIL = 'mro@gmail.com';
const ADMIN_PASSWORD = 'Ga145523@';
const ADMIN_STORAGE_KEY = 'promo33_admin_session';

interface Promo33User {
  id: string;
  email: string;
  name: string;
  phone: string;
  instagram_username: string | null;
  subscription_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
  created_at: string;
}

export default function Promo33Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<Promo33User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    const adminSession = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (adminSession === 'authenticated') {
      setIsAuthenticated(true);
      loadUsers();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'authenticated');
      setIsAuthenticated(true);
      loadUsers();
    } else {
      toast.error('Email ou senha incorretos');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setIsAuthenticated(false);
    setUsers([]);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('promo33-admin', {
        body: { action: 'list_users' }
      });

      if (error) throw error;

      if (data?.success) {
        setUsers(data.users || []);
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('promo33-admin', {
        body: { 
          action: 'update_status',
          user_id: userId,
          status
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Status atualizado');
        loadUsers();
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { data, error } = await supabase.functions.invoke('promo33-admin', {
        body: { 
          action: 'delete_user',
          user_id: userId
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Usuário excluído');
        loadUsers();
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.instagram_username?.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'active') return matchesSearch && user.subscription_status === 'active';
    if (selectedTab === 'pending') return matchesSearch && user.subscription_status === 'pending';
    if (selectedTab === 'expired') return matchesSearch && user.subscription_status === 'expired';
    
    return matchesSearch;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.subscription_status === 'active').length,
    pending: users.filter(u => u.subscription_status === 'pending').length,
    expired: users.filter(u => u.subscription_status === 'expired').length
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <img src={logoMro} alt="MRO" className="h-12 mx-auto mb-4" />
            <CardTitle className="text-white text-center">Admin Promo33</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                <Shield className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="py-3 md:py-4 px-3 md:px-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img src={logoMro} alt="MRO" className="h-8 md:h-10" />
            <Badge className="bg-purple-600 text-xs md:text-sm">Admin</Badge>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoading} className="px-2 md:px-3">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline ml-2">Atualizar</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 px-2 md:px-3">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline ml-2">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 md:py-8 px-3 md:px-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Total</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Ativos</p>
                  <p className="text-xl md:text-2xl font-bold text-green-500">{stats.active}</p>
                </div>
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Pendentes</p>
                  <p className="text-xl md:text-2xl font-bold text-yellow-500">{stats.pending}</p>
                </div>
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Expirados</p>
                  <p className="text-xl md:text-2xl font-bold text-red-500">{stats.expired}</p>
                </div>
                <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white text-sm"
            />
          </div>
        </div>

        {/* Users Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="bg-gray-800 border-gray-700 mb-4 flex-wrap h-auto gap-1 w-full justify-start">
            <TabsTrigger value="all" className="text-xs md:text-sm px-2 md:px-3">Todos ({stats.total})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs md:text-sm px-2 md:px-3">Ativos ({stats.active})</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm px-2 md:px-3">Pendentes ({stats.pending})</TabsTrigger>
            <TabsTrigger value="expired" className="text-xs md:text-sm px-2 md:px-3">Expirados ({stats.expired})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum usuário encontrado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-white font-semibold text-sm md:text-base">{user.name || 'Sem nome'}</h3>
                            <Badge 
                              className={`text-xs ${
                                user.subscription_status === 'active' ? 'bg-green-600' :
                                user.subscription_status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                            >
                              {user.subscription_status === 'active' ? 'Ativo' :
                               user.subscription_status === 'pending' ? 'Pendente' : 'Expirado'}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-400 text-xs md:text-sm break-all">{user.email}</p>
                          {user.phone && <p className="text-gray-500 text-xs md:text-sm">{user.phone}</p>}
                          {user.instagram_username && (
                            <p className="text-pink-400 text-xs md:text-sm">@{user.instagram_username}</p>
                          )}
                          
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Cadastro: {new Date(user.created_at).toLocaleDateString('pt-BR')} às {new Date(user.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {user.subscription_end && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Expira: {new Date(user.subscription_end).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {user.subscription_status !== 'active' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-400 border-green-400 hover:bg-green-400/10 text-xs px-2 py-1 h-auto"
                              onClick={() => updateUserStatus(user.id, 'active')}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativar
                            </Button>
                          )}
                          {user.subscription_status === 'active' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10 text-xs px-2 py-1 h-auto"
                              onClick={() => updateUserStatus(user.id, 'expired')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Desativar
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-400 border-red-400 hover:bg-red-400/10 text-xs px-2 py-1 h-auto"
                            onClick={() => deleteUser(user.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
