import { useState } from "react";
import DraggableAILogos from "@/components/DraggableAILogos";
import { useNavigate } from "react-router-dom";
import metaLogo from "@/assets/meta-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageCircle, 
  Send, 
  Instagram, 
  Facebook, 
  Users, 
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  User,
  Lock,
  Loader2,
  LogIn,
  UserPlus,
  Building2,
  Settings,
  Rocket
} from "lucide-react";

const AdsNews = () => {
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  // Removed unused paymentLink and checkingPayment states - flow now redirects to dashboard

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Erro",
        description: "Preencha email e senha",
        variant: "destructive"
      });
      return;
    }

    setLoginLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ads-auth', {
        body: { 
          action: 'login', 
          email: loginData.email, 
          password: loginData.password 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Login realizado!",
          description: "Redirecionando para o dashboard..."
        });
        navigate(`/anuncios/dash?email=${encodeURIComponent(loginData.email)}&password=${encodeURIComponent(loginData.password)}`);
      } else {
        throw new Error(data?.error || "Email ou senha incorretos");
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Email ou senha incorretos",
        variant: "destructive"
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ads-checkout', {
        body: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          amount: 1, // R$1 for testing (change to 397 for production)
          type: 'initial'
        }
      });

      if (error) throw error;

      if (data.success && data.paymentLink) {
        toast({
          title: "Cadastro realizado!",
          description: "Redirecionando para o dashboard..."
        });
        
        // Redirect to dashboard with payment info - user will see payment overlay there
        localStorage.setItem('ads_pending_payment', JSON.stringify({
          email: formData.email,
          password: formData.password,
          paymentLink: data.paymentLink,
          nsuOrder: data.nsuOrder
        }));
        
        navigate(`/anuncios/dash?email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(formData.password)}&pending=true`);
      } else {
        throw new Error(data.error || "Erro ao criar checkout");
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar cadastro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Payment check logic moved to AdsNewsDash - registration now redirects directly there

  const benefits = [
    "Leads no seu WhatsApp o dia todo",
    "Anúncios para WhatsApp, Telegram e Sites",
    "Todos os posicionamentos: Facebook, Instagram, WhatsApp Status",
    "Criamos os anúncios e criativos para você - tudo incluso",
    "Sem dor de cabeça - apenas passe as informações"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-mro-4.png" 
              alt="MRO" 
              className="h-8 md:h-10"
            />
            <img 
              src="/ads-news-full.png" 
              alt="Ads News" 
              className="h-10 md:h-14"
            />
          </div>
          <Button 
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={() => setShowLogin(true)}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
            Vendendo <span className="text-orange-400">3x mais</span><br />
            com tráfego pago<br />
            <span className="text-orange-300">otimizado por IA</span>
          </h1>
          <p className="text-xl md:text-2xl text-orange-200 font-semibold mb-6">
            Com apenas 1 comando tudo se ativa no automático!<br />
            <span className="text-blue-200">Sem dor de cabeça.</span>
          </p>
          
          <Button
            size="lg" 
            className="bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold px-10 py-6 rounded-lg shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
            onClick={() => {
              const pricingSection = document.getElementById('pricing');
              pricingSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Quero Começar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Meta Partner Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <img 
            src={metaLogo} 
            alt="Meta Business" 
            className="h-16 md:h-20 mx-auto mb-4"
          />
          <p className="text-xl md:text-2xl font-semibold text-gray-800">
            Parceiro Oficial da Meta Business
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-gray-900">
            Como Funciona
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Em apenas 4 passos simples você terá sua campanha ativa
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Passo 1 */}
            <div className="relative">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 h-full">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Crie sua Conta</h3>
                <p className="text-gray-600 text-sm">
                  Cadastre-se e ative sua conta para começar a receber leads qualificados.
                </p>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="h-6 w-6 text-gray-300" />
              </div>
            </div>

            {/* Passo 2 */}
            <div className="relative">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 h-full">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Dados do Negócio</h3>
                <p className="text-gray-600 text-sm">
                  Informe os dados da sua empresa e da sua propaganda para personalizar seus anúncios.
                </p>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="h-6 w-6 text-gray-300" />
              </div>
            </div>

            {/* Passo 3 */}
            <div className="relative">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 h-full">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  3
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Configure seu Saldo</h3>
                <p className="text-gray-600 text-sm">
                  Defina quantas mensagens deseja receber mensalmente e adicione seu saldo de campanha.
                </p>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="h-6 w-6 text-gray-300" />
              </div>
            </div>

            {/* Passo 4 */}
            <div className="relative">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 h-full">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  4
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Rocket className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Anúncios Prontos</h3>
                <p className="text-gray-600 text-sm">
                  Sua página de vendas e anúncios são criados automaticamente. Aguarde os leads no seu WhatsApp!
                </p>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-12 text-center">
            <p className="text-gray-700 text-lg mb-6">
              Pronto para receber leads qualificados no seu WhatsApp?
            </p>
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
              onClick={() => setShowRegister(true)}
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800">
            O que você recebe
          </h2>
          {/* Primeira linha - 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">WhatsApp</h3>
                <p className="text-gray-600">Anúncios diretos para o seu WhatsApp Business ou normal</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Instagram className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">Instagram</h3>
                <p className="text-gray-600">Feed, Stories e Reels patrocinados</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Facebook className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">Facebook</h3>
                <p className="text-gray-600">Feed, Marketplace e Messenger</p>
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha - 2 cards centralizados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">Criativos</h3>
                <p className="text-gray-600">Criamos os anúncios e artes para você - tudo incluso</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">Sem Dor de Cabeça</h3>
                <p className="text-gray-600">Apenas passe as informações e nós fazemos tudo</p>
              </CardContent>
            </Card>
          </div>


          {/* AI Logos Section - Interactive Draggable Design */}
          <div className="mt-8 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 md:p-8 text-white overflow-hidden">
            <h3 className="text-xl md:text-2xl font-bold text-center mb-4">
              🤖 Campanhas criadas pelas maiores IAs do mercado
            </h3>
            <p className="text-lg text-center text-blue-100 mb-4">
              Basta apenas <span className="font-bold text-white">UMA configuração</span> e deixe a IA trabalhar para você!
            </p>
            
            {/* Interactive Draggable AI Logos */}
            <DraggableAILogos />
            
            {/* Explanation Text */}
            <div className="mt-4 text-center max-w-2xl mx-auto">
              <p className="text-blue-100 text-sm md:text-base leading-relaxed">
                A <span className="font-bold text-white">MRO</span> recebe os dados do seu anúncio, 
                <span className="text-orange-300 font-semibold"> gera informações com as melhores IAs do mercado</span>, 
                cria tudo automaticamente e ativa trazendo <span className="font-bold text-white">resultados para você</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Tudo incluso no seu plano
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-orange-400 flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50" id="pricing">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">
            Comece agora mesmo
          </h2>
          <p className="text-gray-600 mb-8">
            Investimento mensal para gerar leads - tudo incluso
          </p>
          
          <Card className="border-2 border-orange-400 shadow-xl max-w-sm mx-auto bg-white">
            <CardContent className="p-8">
              <div className="bg-orange-400 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                🔥 PROMOÇÃO MENSAL
              </div>
              <div className="text-lg text-gray-500 line-through mb-1">
                De R$1.500
              </div>
              <div className="text-2xl font-bold text-gray-700 mb-2">
                POR APENAS
              </div>
              <div className="text-4xl font-bold text-orange-500 mb-2">
                R$<span className="text-5xl">397</span>
              </div>
              <p className="text-gray-600 font-medium">mensal (30 dias)</p>
              <p className="text-xs text-green-600 mt-2 font-semibold">
                Economia de R$1.103 por mês!
              </p>
            </CardContent>
          </Card>

          <Button 
            size="lg" 
            className="mt-8 bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-full shadow-lg animate-pulse hover:animate-none"
            onClick={() => setShowRegister(true)}
          >
            Começar Agora por R$397
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Registration Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Cadastre-se</h3>
                <button 
                  onClick={() => setShowRegister(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2 text-gray-900">
                    <User className="h-4 w-4" />
                    Nome completo *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Seu nome"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 text-gray-900">
                    <Mail className="h-4 w-4" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="flex items-center gap-2 text-gray-900">
                    <Lock className="h-4 w-4" />
                    Senha *
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Crie uma senha"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 text-gray-900">
                    <Phone className="h-4 w-4" />
                    Telefone (opcional)
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Continuar para Pagamento
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Valor para teste: R$1,00 (produção: R$397)
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Acessar Dashboard</h3>
                <button 
                  onClick={() => setShowLogin(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="flex items-center gap-2 text-gray-900">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    value={loginData.email}
                    onChange={handleLoginInputChange}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="login-password" className="flex items-center gap-2 text-gray-900">
                    <Lock className="h-4 w-4" />
                    Senha
                  </Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    value={loginData.password}
                    onChange={handleLoginInputChange}
                    placeholder="Sua senha"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Ainda não tem conta?{' '}
                  <button 
                    type="button"
                    onClick={() => { setShowLogin(false); setShowRegister(true); }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Cadastre-se aqui
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* How Ads News Works Section */}
      <section className="py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-white">
            📢 Como seus anúncios serão criados
          </h2>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-10 text-white space-y-6">
            <p className="text-lg leading-relaxed text-blue-100">
              As campanhas e os anúncios serão feitos diretamente em nossa página <span className="font-bold text-orange-400">Ads News</span> através da sua configuração. 
              Se você precisar de anúncios apenas na sua cidade, o Ads News vai estar lá. Se precisar para o Brasil todo, 
              vamos anunciar para o Brasil todo. E assim por diante!
            </p>
            
            <p className="text-lg leading-relaxed text-blue-100">
              Vamos criar uma <span className="font-bold text-white">página de vendas profissional</span> em nosso site onde vamos anunciar para essa página. 
              Dentro dela, vamos incluir seu número de WhatsApp para direcionar os leads, ou seu site, 
              ou grupos em WhatsApp e Telegram — como você preferir!
            </p>
            
            <p className="text-lg leading-relaxed text-blue-100">
              Vamos anunciar seus <span className="font-bold text-orange-400">produtos</span>, sua <span className="font-bold text-orange-400">empresa</span>, 
              sua <span className="font-bold text-orange-400">loja</span> de maneira fácil e rápida, diretamente por aqui, agora mesmo.
            </p>

            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-6">
              <p className="text-xl font-bold text-center text-white mb-2">
                🎯 Não são leads quaisquer!
              </p>
              <p className="text-lg text-center text-blue-100">
                São <span className="font-bold text-green-400">leads qualificados</span> para gerar <span className="font-bold text-white">vendas e conversões</span> — 
                para que seu investimento conosco faça total sentido!
              </p>
            </div>
            
            <div className="bg-orange-500/20 border border-orange-400/30 rounded-xl p-6 mt-6">
              <p className="text-xl font-bold text-center text-white mb-2">
                💡 Mesmo sem conhecimento nenhum e com baixo investimento...
              </p>
              <p className="text-lg text-center text-blue-100">
                Você vai conseguir estar anunciado na internet assim como seu concorrente faz e grandes marcas que você conhece.
              </p>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-2xl font-bold text-orange-400 mb-4">
                🚀 Faça parte e não perca tempo!
              </p>
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-full shadow-lg"
                onClick={() => setShowRegister(true)}
              >
                Quero Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <img 
              src="/ads-news-logo.png" 
              alt="Ads News" 
              className="h-14 mx-auto mb-6"
            />
            <p className="text-gray-400 text-lg mb-2">
              Ads News - Anúncios para WhatsApp, Facebook e Instagram
            </p>
            <p className="text-gray-500 text-sm">
              Transformando negócios através de tráfego pago inteligente
            </p>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 mb-6">
              <a 
                href="/politica-cancelamento" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Política de Cancelamento
              </a>
              <span className="hidden md:block text-gray-600">|</span>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Política de Privacidade
              </a>
              <span className="hidden md:block text-gray-600">|</span>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Termos de Uso
              </a>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm font-medium">
                Uma criação da MRO - Mais Resultados Online
              </p>
              <p className="text-gray-500 text-xs">
                Mais Resultados Online
              </p>
              <p className="text-gray-500 text-xs">
                Gabriel Fernandes da Silva
              </p>
              <p className="text-gray-500 text-xs">
                CNPJ: 54.840.738/0001-96
              </p>
              <p className="text-gray-600 text-xs mt-4">
                © 2024 Ads News. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdsNews;
