import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trackLead } from '@/lib/facebookTracking';
import { 
  Sparkles, 
  Download, 
  Users, 
  Clock, 
  AlertTriangle,
  Loader2,
  Instagram,
  Mail,
  Phone,
  User,
  ExternalLink,
  Rocket,
  ArrowRight,
  Lock,
  Zap,
  CheckCircle2,
  Video,
  MessageCircle,
  Play,
  Monitor,
  Star,
  Check
} from 'lucide-react';
import logoMro from '@/assets/logo-mro-2.png';

interface TrialSettings {
  mro_master_username: string;
  mro_master_password: string;
  welcome_video_url: string | null;
  installation_video_url: string | null;
  usage_video_url: string | null;
  download_link: string | null;
  group_link: string | null;
  trial_duration_hours: number;
  is_active: boolean;
}


const TesteGratis = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<TrialSettings | null>(null);
  const [existingTrial, setExistingTrial] = useState<{ tested_at: string } | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('free_trial_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading settings:', error);
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const normalizeInstagram = (input: string): string => {
    let username = input.trim().toLowerCase();
    const patterns = [
      /instagram\.com\/([^/?#]+)/,
      /^@?([a-zA-Z0-9._]+)$/
    ];

    for (const pattern of patterns) {
      const match = username.match(pattern);
      if (match) {
        username = match[1];
        break;
      }
    }

    username = username.replace(/^@/, '');
    username = username.split('?')[0].split('#')[0];
    return username;
  };

  const formatWhatsapp = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatWhatsapp(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !whatsapp || !instagramUsername) {
      toast.error('Preencha todos os campos!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email inválido!');
      return;
    }

    const normalizedIG = normalizeInstagram(instagramUsername);
    if (!normalizedIG || normalizedIG.length < 3) {
      toast.error('Instagram inválido!');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('free-trial-register', {
        body: {
          fullName,
          email,
          whatsapp: whatsapp.replace(/\D/g, ''),
          instagramUsername: normalizedIG
        }
      });

      if (error) throw new Error(error.message);

      if (!data.success) {
        if (data.alreadyTested) {
          setExistingTrial({ tested_at: data.testedAt });
          toast.error(data.message);
        } else {
          toast.error(data.message || 'Erro ao registrar');
        }
        return;
      }

      // Save user data to localStorage for auto-login
      const userDataForStorage = {
        instagram_username: normalizedIG,
        full_name: fullName,
        email: email,
        generated_username: data.username,
        generated_password: data.password,
        expires_at: data.expiresAt
      };
      localStorage.setItem('testegratis_user', JSON.stringify(userDataForStorage));

      // Track Lead event for Facebook Pixel
      await trackLead('Teste Grátis - Cadastro');

      toast.success('Teste liberado com sucesso! Redirecionando...');
      
      // Redirect to user area
      setTimeout(() => {
        navigate('/testegratis/usuario');
      }, 1000);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Erro ao processar registro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const formatExpirationDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loadingSettings) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (!settings?.is_active) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Teste Indisponível</h2>
            <p className="text-gray-400">O teste grátis está temporariamente desabilitado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already tested screen
  if (existingTrial) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <img src={logoMro} alt="MRO" className="h-12 mx-auto mb-6" />
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Você já testou!</h2>
            <p className="text-gray-400 mb-6">
              Este Instagram já foi utilizado para teste em {formatExpirationDate(existingTrial.tested_at)}.
            </p>
            <a 
              href="https://maisresultadosonline.com.br/instagram-nova"
              className="inline-flex items-center gap-2 bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Ver Planos Disponíveis
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main landing page
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="py-4 px-4 border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <img src={logoMro} alt="MRO" className="h-10 md:h-12" />
          <a href="/testegratis/usuario">
            <Button 
              variant="outline" 
              className="border-purple-500 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
            >
              <Lock className="w-4 h-4 mr-2" />
              Acessar Meu Teste
            </Button>
          </a>
        </div>
      </header>

      {/* Title + Video Section */}
      <section className="px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* TESTE GRÁTIS - Blinking Green */}
          <div className="text-center mb-4">
            <span className="inline-block bg-green-500 text-white text-lg md:text-2xl font-bold px-6 py-2 rounded-full animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.5)]">
              🎁 TESTE GRÁTIS
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-6 leading-tight">
            Não Gaste Com Anúncios,<br />
            <span className="text-yellow-400">Utilize a MRO!</span>
          </h1>
          
          <div className="aspect-video rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
            <iframe
              src="https://www.youtube.com/embed/U-WmszcYekA"
              title="Apresentação MRO"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Strategy Highlight */}
      <section className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900 border border-yellow-500/50 rounded-xl p-6 text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-xs mb-3">
              <Sparkles className="w-3 h-3" />
              EXCLUSIVO
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              TESTE 1 DAS NOSSAS <span className="text-yellow-400">20+ ESTRATÉGIAS!</span>
            </h2>
            <p className="text-gray-400 text-sm">
              Este teste libera apenas <strong className="text-yellow-400">1 estratégia</strong>. 
              Para acesso completo, adquira um plano.
            </p>
          </div>
        </div>
      </section>

      {/* Computer/Notebook Warning */}
      <section className="px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-zinc-900/60 border border-zinc-700 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Monitor className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-white">Precisa de um computador ou notebook para testar</p>
                <p className="text-gray-500 text-xs">A ferramenta funciona no Windows, Mac e Linux</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Button */}
      <section className="px-4 py-6">
        <div className="max-w-lg mx-auto text-center">
          <Button 
            onClick={() => setShowForm(true)}
            size="lg"
            className="relative overflow-hidden bg-emerald-700 hover:bg-emerald-600 text-white text-2xl px-16 py-10 rounded-xl shadow-[0_0_40px_rgba(16,185,129,0.6)] font-bold w-full md:w-auto group border-2 border-emerald-400/50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent animate-shine-fast" />
            <Rocket className="w-7 h-7 mr-3 relative z-10" />
            <span className="relative z-10">Liberar Teste Grátis de 24h</span>
            <ArrowRight className="w-7 h-7 ml-3 relative z-10" />
          </Button>
        </div>
      </section>

      {/* 24h Warning */}
      <section className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-950/80 border-2 border-red-500 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-lg font-bold text-red-400 mb-1">⚠️ ATENÇÃO: Teste de 24 horas!</p>
                <p className="text-gray-300 text-sm">
                  Você tem apenas <strong className="text-yellow-400">24 HORAS</strong> para testar. 
                  Após esse período, <strong className="text-red-400">não poderá testar novamente</strong> com este Instagram.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - O que você vai receber */}
      <section className="px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
            O que você vai receber <span className="text-yellow-400">✅🚀</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* I.A. MRO - SEM COR (bloqueado) */}
            <Card className="bg-zinc-900/50 border-zinc-800 opacity-60">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-500 text-lg">I.A. MRO (NOVA)</h3>
                      <Lock className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-gray-600 text-sm">Personalização completa para o seu nicho</p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {['Cria legendas prontas e otimizadas', 'Gera biografias profissionais', 'Indica melhores horários para postar', 'Recomenda hashtags relevantes'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <Lock className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-600 mt-4 text-center">🔒 Disponível no plano completo</p>
              </CardContent>
            </Card>

            {/* Automação Estratégica MRO - COM COR (liberado) */}
            <Card className="bg-zinc-900 border-2 border-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-yellow-400 text-lg">Automação Estratégica MRO</h3>
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">LIBERADO</span>
                    </div>
                    <p className="text-gray-300 text-sm">Operações diárias para atrair público real</p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-gray-500">
                    <Lock className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span className="text-sm">Curte fotos relevantes</span>
                  </li>
                  <li className="flex items-start gap-2 text-yellow-400 bg-yellow-400/10 p-2 rounded-lg border border-yellow-500">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-green-400" />
                    <span className="text-sm font-bold">Segue perfis estratégicos ✅</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-500">
                    <Lock className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span className="text-sm">Reage aos Stories com ❤️</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-500">
                    <Lock className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span className="text-sm">Interage com até 200 pessoas/dia</span>
                  </li>
                </ul>
                <p className="text-xs text-green-400 mt-4 text-center font-bold">✅ Esta estratégia está liberada no teste!</p>
              </CardContent>
            </Card>

            {/* Área de Membros - SEM COR (bloqueado) */}
            <Card className="bg-zinc-900/50 border-zinc-800 opacity-60">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-500 text-lg">Área de Membros Vitalícia</h3>
                      <Lock className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-gray-600 text-sm">Acesso completo a conteúdos exclusivos</p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {['Vídeos estratégicos passo a passo', 'Como deixar perfil profissional', 'Como agendar postagens', 'Estratégias para bombar do zero'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <Lock className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-600 mt-4 text-center">🔒 Disponível no plano completo</p>
              </CardContent>
            </Card>

            {/* Grupo VIP - SEM COR (bloqueado) */}
            <Card className="bg-zinc-900/50 border-zinc-800 opacity-60">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-500 text-lg">Grupo VIP de Suporte</h3>
                      <Lock className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-gray-600 text-sm">Networking e suporte especializado</p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {['Acesso ao grupo VIP exclusivo', 'Tire dúvidas com especialistas', 'Atualizações em primeira mão'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <Lock className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-600 mt-4 text-center">🔒 Disponível no plano completo</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tutorial & Support Info */}
      <section className="px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Tutorial Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Play className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-400 mb-1">📺 Assista os Vídeos Tutoriais</p>
                <p className="text-gray-400 text-sm">
                  Após liberar seu teste, assista os vídeos para aprender a instalar e utilizar a ferramenta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="px-4 py-12 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-yellow-400 text-black text-sm font-bold px-4 py-1 rounded-full mb-4">
              TESTE ANTES DE COMPRAR
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Depois pode comprar nossos planos
            </h2>
            <p className="text-gray-400 text-lg">
              E tenha acesso completo total a tudo, inclusive nossa <span className="text-yellow-400 font-bold">INTELIGÊNCIA ARTIFICIAL!</span>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Plano Anual */}
            <Card className="bg-zinc-900 border-2 border-zinc-700 hover:border-blue-500 transition-colors">
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold text-blue-400 mb-2">Plano Anual</h3>
                <p className="text-gray-400 text-sm mb-4">Acesso completo por 12 meses</p>
                
                <div className="mb-6">
                  <p className="text-gray-400 text-sm">12x de</p>
                  <p className="text-5xl font-bold text-blue-400">R$41</p>
                  <p className="text-gray-400 text-sm">ou à vista PIX <span className="line-through">R$397</span></p>
                </div>
                
                <ul className="text-left space-y-2 mb-6">
                  {[
                    'Ferramenta completa para Instagram',
                    'Acesso a 4 contas simultâneas fixas',
                    '5 testes todo mês para testar em seus clientes/outras contas',
                    'Área de membros por 1 ano',
                    'Vídeos estratégicos passo a passo',
                    'Grupo VIP no WhatsApp',
                    'Suporte prioritário'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <p className="text-gray-500 text-xs mb-4">• Cadastro Afiliado - Comissão de R$97 Por venda</p>
                
                <a href="https://maisresultadosonline.com.br/instagram-nova" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 text-sm">
                    GARANTIR PLANO ANUAL
                  </Button>
                </a>
              </CardContent>
            </Card>
            
            {/* Plano Vitalício */}
            <Card className="bg-zinc-900 border-2 border-yellow-500 relative shadow-[0_0_30px_rgba(250,204,21,0.2)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-yellow-500 text-black text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> MAIS POPULAR
                </span>
              </div>
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Plano Vitalício</h3>
                <p className="text-gray-400 text-sm mb-4">Acesso completo para sempre</p>
                
                <div className="mb-6">
                  <p className="text-gray-400 text-sm">12x de</p>
                  <p className="text-5xl font-bold text-yellow-400">R$81</p>
                  <p className="text-gray-400 text-sm">ou à vista PIX <span className="line-through">R$797</span></p>
                </div>
                
                <ul className="text-left space-y-2 mb-6">
                  {[
                    'Ferramenta completa para Instagram',
                    'Acesso a 6 contas simultâneas fixas',
                    '5 testes todo mês para testar em seus clientes/outras contas',
                    'Área de membros VITALÍCIA',
                    'Vídeos estratégicos passo a passo',
                    'Grupo VIP no WhatsApp',
                    'Suporte prioritário',
                    'Atualizações gratuitas para sempre'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <p className="text-gray-500 text-xs mb-4">• Cadastro Afiliado - Comissão de R$97 Por venda</p>
                
                <a href="https://maisresultadosonline.com.br/instagram-nova" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 text-sm">
                    GARANTIR PLANO VITALÍCIO
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-8">
        <div className="max-w-lg mx-auto text-center">
          <Button 
            onClick={() => setShowForm(true)}
            size="lg"
            className="relative overflow-hidden bg-emerald-700 hover:bg-emerald-600 text-white text-2xl px-16 py-10 rounded-xl shadow-[0_0_40px_rgba(16,185,129,0.6)] font-bold group border-2 border-emerald-400/50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent animate-shine-fast" />
            <Rocket className="w-7 h-7 mr-3 relative z-10" />
            <span className="relative z-10">Liberar Meu Teste Agora</span>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <img src={logoMro} alt="MRO" className="h-8 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} MRO - Mais Resultados Online
          </p>
        </div>
      </footer>

      {/* Renda Extra Section */}
      <section className="px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl p-6 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
              💰 Sabia que você pode fazer uma renda extra de<br />
              <span className="text-green-400">mais de 5 MIL REAIS</span> com essa ferramenta?
            </h2>
            <p className="text-gray-300 text-center mb-6">
              Sim, além de utilizar para o seu negócio! Assista o vídeo abaixo:
            </p>
            <div className="aspect-video rounded-xl overflow-hidden border border-zinc-700">
              <iframe
                src="https://www.youtube.com/embed/WQwnAHNvSMU"
                title="Renda Extra com MRO"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Support Notice */}
      <section className="px-4 py-6 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-5 text-center">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-400" />
              Precisa de Ajuda?
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Temos suporte <strong className="text-white">Anydesk (acesso remoto)</strong> e{' '}
              <strong className="text-white">Suporte WhatsApp</strong>!
            </p>
            <p className="text-yellow-400 text-sm font-medium">
              ⚠️ O suporte funciona apenas no <strong>plano pago</strong>!
            </p>
            <p className="text-gray-500 text-xs mt-3">
              Para testes grátis, assista os vídeos tutoriais para instalar e utilizar.
            </p>
          </div>
        </div>
      </section>

      {/* Modal/Popup Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white text-center">
              Liberar Teste Grátis
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="fullName" className="flex items-center gap-2 text-gray-300 text-sm">
                <User className="w-4 h-4" /> Nome Completo
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                className="mt-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="flex items-center gap-2 text-gray-300 text-sm">
                <Mail className="w-4 h-4" /> E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="mt-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="whatsapp" className="flex items-center gap-2 text-gray-300 text-sm">
                <Phone className="w-4 h-4" /> WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={handleWhatsappChange}
                placeholder="(00) 00000-0000"
                className="mt-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="instagram" className="flex items-center gap-2 text-gray-300 text-sm">
                <Instagram className="w-4 h-4" /> Instagram (sem @)
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                <Input
                  id="instagram"
                  value={instagramUsername}
                  onChange={(e) => setInstagramUsername(e.target.value.replace('@', '').toLowerCase())}
                  placeholder="seuinstagram"
                  className="pl-8 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 lowercase"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="relative overflow-hidden w-full bg-emerald-700 hover:bg-emerald-600 text-white py-7 text-lg font-bold border-2 border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent animate-shine-fast" />
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin relative z-10" />
                  <span className="relative z-10">Processando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 mr-2 relative z-10" />
                  <span className="relative z-10">Liberar Meu Teste Grátis</span>
                </>
              )}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              ⚠️ Você só pode testar uma vez por Instagram
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TesteGratis;
