import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Laptop, Monitor, Zap, TrendingUp, Target, Users, ArrowRight, Star, Shield, Clock, UserPlus, CreditCard, Instagram, Brain, LogIn, Play } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trackPageView, trackLead } from '@/lib/facebookTracking';
import logoMro from '@/assets/logo-mro.png';
import ActiveClientsSection from '@/components/ActiveClientsSection';

const PROMO33_STORAGE_KEY = 'promo33_user_session';

export default function Promo33() {
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    trackPageView('Promo33 Sales');
    
    const session = localStorage.getItem(PROMO33_STORAGE_KEY);
    if (session) {
      const user = JSON.parse(session);
      if (user.subscription_status === 'active') {
        navigate('/promo33/dashboard');
      }
    }
  }, [navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('promo33-auth', {
        body: { 
          action: 'register',
          ...formData
        }
      });

      if (error) throw error;

      if (data.success) {
        localStorage.setItem(PROMO33_STORAGE_KEY, JSON.stringify(data.user));
        trackLead('Promo33 Registration');
        toast.success('Cadastro realizado! Redirecionando...');
        navigate('/promo33/dashboard');
      } else {
        toast.error(data.message || 'Erro ao cadastrar');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Erro ao cadastrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Preencha email e senha');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('promo33-auth', {
        body: { 
          action: 'login',
          email: formData.email,
          password: formData.password
        }
      });

      if (error) throw error;

      if (data.success) {
        localStorage.setItem(PROMO33_STORAGE_KEY, JSON.stringify(data.user));
        toast.success('Login realizado!');
        navigate('/promo33/dashboard');
      } else {
        toast.error(data.message || 'Email ou senha incorretos');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const openLogin = () => {
    setIsLogin(true);
    setShowRegister(true);
    setFormData({ name: '', email: '', phone: '', password: '' });
  };

  const openRegister = () => {
    setIsLogin(false);
    setShowRegister(true);
    setFormData({ name: '', email: '', phone: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <header className="py-4 px-4 border-b border-yellow-500/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img src={logoMro} alt="MRO" className="h-10 md:h-14" />
          
          <Button 
            onClick={openLogin}
            variant="outline"
            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Acessar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full mb-6 text-sm font-medium border border-yellow-500/30">
            <Zap className="w-4 h-4" />
            Oferta Especial por Tempo Limitado
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
              Venda Mais
            </span>
            <br />
            <span className="text-gray-100">Tenha Mais Seguidores</span>
            <br />
            <span className="text-gray-100">Mais Clientes</span>
            <br />
            <span className="text-lg md:text-2xl lg:text-3xl text-yellow-400 mt-2 block font-bold">
              Com a inteligência MRO!
            </span>
          </h1>
          
          {/* YouTube Video with Thumbnail */}
          <div className="w-full max-w-3xl mx-auto mb-8 rounded-xl overflow-hidden shadow-2xl shadow-yellow-500/20 border-2 border-yellow-500/50">
            <div className="relative pb-[56.25%] h-0">
              {!isVideoPlaying ? (
                <div 
                  className="absolute top-0 left-0 w-full h-full bg-gray-900 flex flex-col items-center justify-center cursor-pointer group"
                  onClick={() => setIsVideoPlaying(true)}
                >
                  {/* Play Button */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-yellow-500/50 group-hover:scale-110 transition-transform">
                      <Play className="w-10 h-10 md:w-12 md:h-12 text-black fill-black ml-1" />
                    </div>
                    <span className="text-white text-xl md:text-2xl font-bold tracking-wider">
                      ASSISTA AGORA
                    </span>
                  </div>
                </div>
              ) : (
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/UnC4qpFgucQ?rel=0&autoplay=1"
                  title="Promo33 Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>
          </div>
          
          <p className="text-lg md:text-xl text-gray-400 mb-4">
            Por apenas
          </p>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-gray-600 line-through text-2xl">R$197</span>
            <span className="text-5xl md:text-7xl font-bold text-yellow-400">R$33</span>
            <span className="text-yellow-400 text-xl">/mês</span>
          </div>

          <Button
            onClick={openRegister}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold text-lg md:text-xl px-8 md:px-12 py-6 md:py-8 rounded-full shadow-2xl shadow-yellow-500/30 transform hover:scale-105 transition-all"
          >
            CADASTRAR AGORA MESMO
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          {/* Device Icons */}
          <div className="flex items-center justify-center gap-6 mt-8 text-gray-500">
            <div className="flex flex-col items-center gap-1">
              <Smartphone className="w-6 h-6" />
              <span className="text-xs">Celular</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Laptop className="w-6 h-6" />
              <span className="text-xs">Notebook</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Monitor className="w-6 h-6" />
              <span className="text-xs">Desktop</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-2">Acesse de qualquer dispositivo</p>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 md:py-16 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Como Funciona
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { step: '1', icon: UserPlus, title: 'Faça seu cadastro', desc: 'Crie sua conta em menos de 1 minuto' },
              { step: '2', icon: CreditCard, title: 'Realize o pagamento', desc: 'Apenas R$33 por mês - cancele quando quiser' },
              { step: '3', icon: Instagram, title: 'Adicione seu Instagram', desc: 'Perfil que você precisa crescer' },
              { step: '4', icon: Brain, title: 'Utilize nossa I.A', desc: 'Inteligência focada para o seu crescimento' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 bg-black/50 border border-gray-800 rounded-xl p-5 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-500 font-bold text-sm">PASSO {item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            O que você vai receber
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Target, title: 'Estratégia de Bio', desc: 'Bio otimizada para converter visitantes em seguidores' },
              { icon: TrendingUp, title: 'Estratégia de Crescimento', desc: 'Plano completo para crescer organicamente' },
              { icon: Users, title: 'Script de Vendas', desc: 'Scripts prontos para vender no direct' },
              { icon: Star, title: 'Ideias de Criativos', desc: 'Conteúdo que engaja e converte' },
            ].map((benefit, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-yellow-500/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-black" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-500 text-sm">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Active Clients Section */}
      <section className="py-8 px-4">
        <ActiveClientsSection title="Clientes Ativos" maxClients={15} />
      </section>

      {/* Guarantees */}
      <section className="py-12 md:py-16 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-black/50 border-gray-800">
              <CardContent className="p-6 flex items-start gap-4">
                <Shield className="w-10 h-10 text-yellow-500 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Garantia de 30 Dias</h3>
                  <p className="text-gray-500 text-sm">
                    Se não ter resultados com nossa estratégia, devolvemos seu dinheiro!
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/50 border-gray-800">
              <CardContent className="p-6 flex items-start gap-4">
                <Clock className="w-10 h-10 text-yellow-500 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Acesso Imediato</h3>
                  <p className="text-gray-500 text-sm">
                    Após o pagamento, acesse imediatamente todas as funcionalidades.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            Comece Agora Mesmo
          </h2>
          <p className="text-gray-400 mb-8">
            Junte-se a centenas de empreendedores que já estão crescendo no Instagram
          </p>
          
          <Button 
            onClick={openRegister}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold text-lg px-10 py-6 rounded-full shadow-2xl shadow-yellow-500/30"
          >
            QUERO COMEÇAR POR R$33/MÊS
          </Button>

          <p className="text-gray-600 text-sm mt-4">
            Já tem uma conta?{' '}
            <button 
              onClick={openLogin}
              className="text-yellow-500 hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center text-gray-600 text-sm">
          <p>MRO - Mais Resultados Online</p>
          <p>Gabriel Fernandes da Silva</p>
          <p>CNPJ: 54.840.738/0001-96</p>
          <p className="mt-4">© {new Date().getFullYear()}. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Register/Login Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
          <Card className="w-full max-w-md bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-white text-center text-lg md:text-xl">
                {isLogin ? 'Acessar Conta' : 'Criar Conta'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-3 md:space-y-4">
                {!isLogin && (
                  <div>
                    <label className="text-xs md:text-sm text-gray-400 mb-1 block">Nome Completo *</label>
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-black/50 border-gray-700 text-white focus:border-yellow-500 text-sm"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-xs md:text-sm text-gray-400 mb-1 block">Email *</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-black/50 border-gray-700 text-white focus:border-yellow-500 text-sm"
                    required
                  />
                </div>
                
                {!isLogin && (
                  <div>
                    <label className="text-xs md:text-sm text-gray-400 mb-1 block">WhatsApp</label>
                    <Input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-black/50 border-gray-700 text-white focus:border-yellow-500 text-sm"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-xs md:text-sm text-gray-400 mb-1 block">Senha *</label>
                  <Input
                    type="password"
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-black/50 border-gray-700 text-white focus:border-yellow-500 text-sm"
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold py-5 md:py-6 text-sm md:text-base"
                >
                  {isLoading ? 'Aguarde...' : (isLogin ? 'ENTRAR' : 'CONTINUAR')}
                </Button>

                <div className="text-center text-gray-500 text-xs md:text-sm">
                  {isLogin ? (
                    <>
                      Não tem conta?{' '}
                      <button type="button" onClick={() => setIsLogin(false)} className="text-yellow-500 hover:underline">
                        Criar conta
                      </button>
                    </>
                  ) : (
                    <>
                      Já tem conta?{' '}
                      <button type="button" onClick={() => setIsLogin(true)} className="text-yellow-500 hover:underline">
                        Fazer login
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="w-full text-gray-500 hover:text-white text-xs md:text-sm py-2"
                >
                  Cancelar
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
