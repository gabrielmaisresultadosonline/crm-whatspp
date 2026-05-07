import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Lock, Mail, AlertCircle, ExternalLink, LogOut, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'mro@gmail.com';
const ADMIN_PASSWORD = 'Ga145523@';
const STORAGE_KEY = 'addmin_authenticated';

type AdminLink = {
  title: string;
  path: string;
  description: string;
};

type Category = {
  name: string;
  emoji: string;
  links: AdminLink[];
};

const CATEGORIES: Category[] = [
  {
    name: 'Instagram Nova',
    emoji: '📸',
    links: [
      { title: 'Instagram Nova Admin', path: '/instagram-nova-admin', description: 'Painel principal de gestão de usuários, vendas, remarketing e acessos do Instagram Nova (BR).' },
      { title: 'Instagram Nova Admin - Email', path: '/instagram-nova-admin/email', description: 'Sistema de envio de emails em massa para usuários da plataforma Instagram Nova.' },
      { title: 'Instagram Nova Euro Admin', path: '/instagram-nova-euro-admin', description: 'Painel administrativo da versão internacional (Euro) do Instagram Nova.' },
    ],
  },
  {
    name: 'Pagamentos & Vendas',
    emoji: '💰',
    links: [
      { title: 'Pagamento Admin', path: '/pagamentoadmin', description: 'Gestão de pedidos InfiniPay, NSU e verificação de pagamentos.' },
      { title: 'ZapMRO Vendas Admin', path: '/zapmro/vendas/admin', description: 'Administração de vendas e pedidos do produto ZapMRO.' },
      { title: 'Promo33 Admin', path: '/promo33/admin', description: 'Gestão da promoção de R$33 - usuários, vendas e configurações.' },
    ],
  },
  {
    name: 'Renda Extra',
    emoji: '💵',
    links: [
      { title: 'Renda Extra Admin', path: '/rendaextra/admin', description: 'Painel principal do Renda Extra - leads, emails, analytics e configurações de lançamento.' },
      { title: 'Renda Extra Aula Admin', path: '/rendaextraaula/admin', description: 'Gestão da página de captura da aula gratuita /rendaextraaula.' },
      { title: 'Renda Extra Ligação Admin', path: '/rendaextraligacao/admin', description: 'Configuração do funil de simulação de ligação do Renda Extra.' },
    ],
  },
  {
    name: 'Ferramentas IA',
    emoji: '🤖',
    links: [
      { title: 'Corretor MRO Admin', path: '/corretormro/admin', description: 'Gestão de usuários e configurações do Corretor de Texto IA.' },
      { title: 'Inteligência Fotos Admin', path: '/inteligenciafotos/admin', description: 'Gerenciar templates de geração de fotos com IA (Gemini) e API keys.' },
      { title: 'IAVendeMais Admin', path: '/Iavendemais/admin', description: 'Gestão dos áudios das 4 etapas do funil de simulação de chamada do IAVendeMais.' },
      { title: 'Prompts MRO Admin', path: '/prompts/admin', description: 'Gestão de prompts, vendas e usuários do Prompts MRO (BR).' },
      { title: 'Prompts IN Admin', path: '/promptsin/admin', description: 'Versão internacional (EN) do Prompts MRO - gestão completa.' },
    ],
  },
  {
    name: 'Outras Ferramentas',
    emoji: '🛠️',
    links: [
      { title: 'Admin Geral', path: '/admin', description: 'Painel administrativo principal do sistema MRO.' },
      { title: 'Admin Usuário', path: '/adminusuario', description: 'Criação de contas de clientes via API SquareCloud (Instagram).' },
      { title: 'Teste Grátis Admin', path: '/testegratis/admin', description: 'Gestão dos usuários do trial gratuito de 24h.' },
      { title: 'Metodo Seguidor Admin', path: '/metodoseguidoradmin', description: 'Gestão da plataforma de recuperação de shadow-ban (R$49).' },
      { title: 'Ads News Admin', path: '/anuncios/admin', description: 'Painel administrativo da plataforma Ads News (R$397).' },
      { title: 'WhatsApp Admin', path: '/whatsapp/admin', description: 'Configurações da landing page WhatsApp Hub.' },
      { title: 'API WhatsApp Access', path: '/apiwhatsappacess', description: 'Interface Z-API: chat, CRM e Flow Builder de automações.' },
      { title: 'Live Admin', path: '/live/admin', description: 'Gestão de sessões de live, viewers em tempo real e CTAs.' },
      { title: 'Licença Admin', path: '/licencaadmin', description: 'Geração e gestão de chaves de licença de extensões Chrome.' },
      { title: 'Relatórios', path: '/relatorios', description: 'Geração de relatórios PDF profissionais de Instagram.' },
    ],
  },
];

const Addmin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setAuthenticated(true);
      toast({ title: 'Acesso liberado', description: 'Bem-vindo ao hub administrativo' });
    } else {
      setError('Credenciais inválidas');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Hub Administrativo</h1>
            <p className="text-muted-foreground text-sm mt-1">Acesso restrito</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Senha
              </Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>

            <Button type="submit" className="w-full" size="lg">Entrar</Button>
          </form>
        </Card>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const filtered = CATEGORIES.map((cat) => ({
    ...cat,
    links: cat.links.filter(
      (l) => !q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.path.toLowerCase().includes(q)
    ),
  })).filter((c) => c.links.length > 0);

  const total = CATEGORIES.reduce((acc, c) => acc + c.links.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Hub Administrativo</h1>
            <p className="text-xs text-muted-foreground">{total} páginas administrativas em um só lugar</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar página... (ex: instagram, renda, admin)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nenhuma página encontrada para "{search}"</p>
        )}

        {filtered.map((cat) => (
          <section key={cat.name}>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span>{cat.emoji}</span> {cat.name}
              <span className="text-xs font-normal text-muted-foreground">({cat.links.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.links.map((link) => (
                <Card key={link.path} className="p-4 flex flex-col hover:border-primary/50 transition-colors">
                  <div className="flex-1 mb-3">
                    <h3 className="font-semibold mb-1">{link.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{link.description}</p>
                    <code className="text-[10px] text-muted-foreground/70 break-all">{link.path}</code>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(link.path, '_blank')}
                  >
                    Acessar <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default Addmin;
