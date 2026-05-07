import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/renda-extra-hero.png";
import logoMro from "@/assets/logo-mro-white.png";
import { Laptop, Monitor, Clock, MapPin, Briefcase, CheckCircle2, Shield, ArrowRight, Loader2, X } from "lucide-react";

const FREE_CLASS_LINK = "https://maisresultadosonline.com.br/descontoalunosrendaextrasss";

const RendaExtra2 = () => {
  const [showForm, setShowForm] = useState(false);

  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    email: "",
    whatsapp: "",
    trabalhaAtualmente: false,
    mediaSalarial: "",
    tipoComputador: "",
    instagramUsername: ""
  });

  const [showNoComputerWarning, setShowNoComputerWarning] = useState(false);
  const [canProceedAfterWarning, setCanProceedAfterWarning] = useState(false);

  const getEffectiveTotalSteps = () => {
    return formData.trabalhaAtualmente ? 7 : 6;
  };

  useEffect(() => {
    trackVisit();
  }, []);

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showForm]);

  const trackVisit = async () => {
    try {
      await supabase.from("renda_extra_v2_analytics").insert({
        event_type: "page_view",
        source_url: window.location.href,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Error tracking visit:", error);
    }
  };

  useEffect(() => {
    if (showNoComputerWarning) {
      setCanProceedAfterWarning(false);
      const timer = setTimeout(() => {
        setCanProceedAfterWarning(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNoComputerWarning]);

  const getActualStep = (step: number) => {
    if (!formData.trabalhaAtualmente && step >= 4) {
      return step + 1;
    }
    return step;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email.trim());
  };

  const [emailError, setEmailError] = useState("");

  const canProceed = () => {
    const actualStep = getActualStep(currentStep);
    switch (actualStep) {
      case 0: return formData.nomeCompleto.trim() !== "";
      case 1: return isValidEmail(formData.email);
      case 2: return formData.whatsapp.trim() !== "";
      case 3: return true;
      case 4: return formData.mediaSalarial !== "";
      case 5: return formData.tipoComputador !== "";
      case 6: return formData.instagramUsername.trim() !== "";
      default: return false;
    }
  };

  const handleNext = () => {
    const actualStep = getActualStep(currentStep);
    if (actualStep === 1 && !isValidEmail(formData.email)) {
      setEmailError("Digite um email válido (ex: seu@email.com)");
      return;
    }
    if (canProceed() && currentStep < getEffectiveTotalSteps() - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComputerSelect = (value: string) => {
    setFormData({ ...formData, tipoComputador: value });
    if (value === "nenhum") {
      setShowNoComputerWarning(true);
    } else {
      setShowNoComputerWarning(false);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleProceedWithoutComputer = () => {
    setShowNoComputerWarning(false);
    setCurrentStep(currentStep + 1);
  };

  const handleSubmit = async () => {
    if (!formData.nomeCompleto || !formData.email || !formData.whatsapp || !formData.mediaSalarial || !formData.tipoComputador || !formData.instagramUsername) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await supabase.functions.invoke("renda-extra-register-v2", {
        body: {
          nome_completo: formData.nomeCompleto,
          email: formData.email,
          whatsapp: formData.whatsapp,
          trabalha_atualmente: formData.trabalhaAtualmente,
          media_salarial: formData.mediaSalarial,
          tipo_computador: formData.tipoComputador,
          instagram_username: formData.instagramUsername
        }
      });

      if (response.error) throw response.error;

      setSubmitted(true);

      toast({
        title: "Cadastro realizado!",
        description: "Você receberá um email com o acesso à aula grátis."
      });

      await supabase.from("renda_extra_v2_analytics").insert({
        event_type: "lead_conversion",
        source_url: window.location.href,
        user_agent: navigator.userAgent,
      });

      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead");
      }

    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-8 animate-fade-in">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-8 rounded-3xl border border-green-500/20 backdrop-blur-xl">
            <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Cadastro Realizado!
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Você receberá um email com o acesso. Acesse agora a aula grátis!
            </p>
            <a 
              href={FREE_CLASS_LINK}
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:scale-105 transition-transform shadow-2xl shadow-green-500/20"
            >
              Acesse agora a aula grátis
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const renderQuizStep = () => {
    const actualStep = getActualStep(currentStep);
    
    if (actualStep === 0) {
      return (
        <div key="nome" className="space-y-4 animate-fade-in">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
            Qual é o seu nome completo?
          </h3>
          <Input
            value={formData.nomeCompleto}
            onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50 text-lg py-6"
            placeholder="Digite seu nome completo"
            autoFocus
          />
        </div>
      );
    }
    
    if (actualStep === 1) {
      return (
        <div key="email" className="space-y-4 animate-fade-in">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
            Qual é o seu melhor email?
          </h3>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (emailError) {
                const val = e.target.value.trim();
                if (isValidEmail(val)) setEmailError("");
              }
            }}
            onBlur={() => {
              const val = formData.email.trim();
              if (val && !isValidEmail(val)) {
                setEmailError("Digite um email válido (ex: seu@email.com)");
              } else {
                setEmailError("");
              }
            }}
            className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50 text-lg py-6 ${emailError ? "border-red-500" : ""}`}
            placeholder="seu@email.com"
            autoFocus
          />
          {emailError && (
            <p className="text-red-400 text-sm text-center animate-fade-in">{emailError}</p>
          )}
        </div>
      );
    }
    
    if (actualStep === 2) {
      return (
        <div key="whatsapp" className="space-y-4 animate-fade-in">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
            Qual é o seu WhatsApp?
          </h3>
          <Input
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50 text-lg py-6"
            placeholder="(00) 00000-0000"
            autoFocus
          />
        </div>
      );
    }
    
    if (actualStep === 3) {
      return (
        <div key="trabalha" className="space-y-4 animate-fade-in">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
            Você trabalha atualmente?
          </h3>
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              onClick={() => {
                setFormData({ ...formData, trabalhaAtualmente: true });
                setCurrentStep(currentStep + 1);
              }}
              className="w-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 text-white font-semibold text-lg py-6 rounded-xl transition-all"
            >
              Sim, trabalho
            </Button>
            <Button
              type="button"
              onClick={() => {
                setFormData({ ...formData, trabalhaAtualmente: false, mediaSalarial: "nao_trabalha" });
                setCurrentStep(currentStep + 1);
              }}
              className="w-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 text-white font-semibold text-lg py-6 rounded-xl transition-all"
            >
              Não, estou buscando oportunidades
            </Button>
          </div>
        </div>
      );
    }
    
    if (actualStep === 4) {
      return (
        <div key="salario" className="space-y-4 animate-fade-in">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
            Qual sua média salarial atual?
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { value: "menos_5k", label: "Menos de R$ 5.000" },
              { value: "5k_10k", label: "Entre R$ 5.000 e R$ 10.000" },
              { value: "mais_10k", label: "Mais de R$ 10.000" }
            ].map((option) => (
              <Button
                key={option.value}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, mediaSalarial: option.value });
                  setCurrentStep(currentStep + 1);
                }}
                className={`w-full border text-white font-semibold text-lg py-6 rounded-xl transition-all ${
                  formData.mediaSalarial === option.value 
                    ? "bg-red-500/30 border-red-500" 
                    : "bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/50"
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      );
    }
    
    if (actualStep === 5) {
      return (
        <div key="computador" className="space-y-4 animate-fade-in">
          {!showNoComputerWarning ? (
            <>
              <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
                Você possui computador?
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { value: "computador", label: "Computador de Mesa", icon: Monitor },
                  { value: "notebook", label: "Notebook", icon: Laptop },
                  { value: "macbook", label: "MacBook", icon: Laptop },
                  { value: "nenhum", label: "Nenhum", icon: X }
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    onClick={() => handleComputerSelect(option.value)}
                    className={`w-full border text-white font-semibold text-lg py-6 rounded-xl transition-all flex items-center justify-center gap-3 ${
                      formData.tipoComputador === option.value 
                        ? "bg-red-500/30 border-red-500" 
                        : "bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/50"
                    }`}
                  >
                    <option.icon className="w-5 h-5" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
                <div className="text-yellow-400 text-5xl mb-4">⚠️</div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                  Atenção!
                </h3>
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                  Você <span className="text-yellow-400 font-bold">vai precisar</span> de um <span className="text-white font-semibold">Notebook</span>, <span className="text-white font-semibold">Computador</span> ou <span className="text-white font-semibold">MacBook</span> para rodar o sistema e fazer o método!
                </p>
                <p className="text-gray-400 text-sm mt-4">
                  Sem um computador, você <span className="text-red-400 font-semibold">não vai conseguir rodar</span> o sistema.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleProceedWithoutComputer}
                disabled={!canProceedAfterWarning}
                className={`w-full font-semibold text-lg py-6 rounded-xl transition-all ${
                  canProceedAfterWarning 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                {canProceedAfterWarning ? "Avançar mesmo assim" : "Aguarde 5 segundos para continuar..."}
              </Button>
            </div>
          )}
        </div>
      );
    }
    
    if (actualStep === 6) {
      return (
        <div key="instagram" className="space-y-4 animate-fade-in">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
            Qual é o seu Instagram?
          </h3>
          <Input
            value={formData.instagramUsername}
            onChange={(e) => setFormData({ ...formData, instagramUsername: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50 text-lg py-6"
            placeholder="@seuperfil"
            autoFocus
          />
        </div>
      );
    }
    
    return null;
  };

  return (
    <>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-gradient-to-br from-[#151a2e] to-[#0d1020] rounded-3xl p-6 md:p-10 border border-white/10 shadow-2xl animate-fade-in">
            <button
              onClick={() => {
                setShowForm(false);
                setCurrentStep(0);
              }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="text-center mb-6">
              <p className="text-yellow-400 font-bold text-lg animate-pulse">
                Preencha para liberar a aula grátis
              </p>
            </div>

            <div className="mb-8">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Pergunta {currentStep + 1} de {getEffectiveTotalSteps()}</span>
                <span>{Math.round(((currentStep + 1) / getEffectiveTotalSteps()) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / getEffectiveTotalSteps()) * 100}%` }}
                />
              </div>
            </div>

            <div className="min-h-[200px] flex flex-col justify-center">
              {renderQuizStep()}
            </div>

            {(() => {
              const actualStep = getActualStep(currentStep);
              const isAutoAdvanceStep = actualStep === 3 || actualStep === 4 || actualStep === 5;
              const isLastStep = currentStep === getEffectiveTotalSteps() - 1;
              
              if (isAutoAdvanceStep) return null;
              
              return (
                <div className="mt-8 flex gap-3">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      onClick={() => {
                        if (!formData.trabalhaAtualmente && actualStep === 5) {
                          setCurrentStep(3);
                        } else {
                          setCurrentStep(currentStep - 1);
                        }
                      }}
                      className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold py-5 rounded-xl"
                    >
                      Voltar
                    </Button>
                  )}
                  {isLastStep ? (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canProceed() || loading}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-5 rounded-xl disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          Acessar Aula Grátis
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-5 rounded-xl disabled:opacity-50"
                    >
                      Próximo
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

    <div className="min-h-screen bg-[#0a0e1a] overflow-x-hidden relative">
      <section className="relative min-h-[90vh] flex flex-col">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-yellow-400/10 via-transparent to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-neutral-700/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 pt-6 px-4 flex justify-center">
          <img src={logoMro} alt="MRO" className="w-20 md:w-24 opacity-90" />
        </div>

        <div className="relative z-10 flex justify-center mt-4">
          <div className="bg-yellow-400/10 border border-yellow-400/30 px-5 py-1.5 rounded-full">
            <span className="text-yellow-300 font-medium text-xs tracking-[0.2em] uppercase">
              Ferramenta Profissional
            </span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
          <div className="mb-4">
            <span className="bg-yellow-400 text-black font-medium text-xs sm:text-sm px-5 py-1.5 rounded-full shadow-lg shadow-yellow-400/30 tracking-wide">
              Aprenda Grátis
            </span>
          </div>

          <div className="w-full max-w-md mx-auto">
            <img 
              src={heroImage} 
              alt="Resultados MRO" 
              className="w-full drop-shadow-2xl"
            />
          </div>
          
          <div className="text-center -mt-12 sm:-mt-16 md:-mt-20 relative z-10">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-none">
              <span className="text-white" style={{ filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.9))' }}>
                Faça 5 a 10
              </span>
              <br />
              <span className="text-yellow-400 uppercase tracking-tight" style={{ textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)' }}>MIL MENSAL</span>
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-neutral-200 mt-2">
              utilizando a ferramenta <span className="text-yellow-400 font-bold">MRO</span>!
            </h2>
          </div>

          <div className="text-center mt-6 max-w-xs sm:max-w-lg mx-auto px-2">
            <p className="text-xs sm:text-base md:text-lg text-neutral-400 leading-relaxed">
              Utilize no seu horário, em <span className="text-yellow-300 font-medium">qualquer lugar do mundo</span>!
              <br />
              Uma verdadeira <span className="text-yellow-300 font-medium">liberdade financeira</span>.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/10 hover:border-yellow-400/40 transition-colors">
              <Clock className="w-4 h-4 text-yellow-300" />
              <span className="text-neutral-300 text-xs sm:text-sm font-medium">Seu Horário</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/10 hover:border-yellow-400/40 transition-colors">
              <MapPin className="w-4 h-4 text-yellow-300" />
              <span className="text-neutral-300 text-xs sm:text-sm font-medium">Qualquer Lugar</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/10 hover:border-yellow-400/40 transition-colors">
              <Briefcase className="w-4 h-4 text-yellow-300" />
              <span className="text-neutral-300 text-xs sm:text-sm font-medium">Renda Extra</span>
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-base sm:text-lg md:text-xl px-8 sm:px-10 py-5 sm:py-6 rounded-2xl shadow-2xl shadow-yellow-400/30 hover:scale-105 transition-all duration-300 group"
            >
              Aprender grátis agora!
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>


      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Aprenda gratuitamente <span className="text-yellow-400">como utilizar</span>
          </h3>
          <p className="text-neutral-400 text-base">
            Faça o cadastro e tenha acesso imediato à aula explicativa da ferramenta.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-lg md:text-xl px-10 py-6 rounded-2xl shadow-2xl shadow-yellow-400/30 hover:scale-105 transition-all duration-300 group mb-8"
          >
            Aprender grátis agora!
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-300 to-white mb-4">
            Acesso Gratuito
          </h2>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-gradient-to-br from-neutral-900 to-black rounded-2xl p-6 md:p-8 border border-yellow-400/20 text-center">
            <Shield className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
            <p className="text-lg md:text-xl font-semibold text-white">
              Isso <span className="text-yellow-300">NÃO É</span> um curso.
            </p>
            <p className="text-neutral-400 mt-2">
              É uma <span className="text-yellow-300 font-semibold">ferramenta profissional</span> automatizada de uso contínuo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2 bg-neutral-800/50 border border-neutral-700/50 px-4 py-2.5 rounded-xl">
              <Laptop className="w-5 h-5 text-neutral-300" />
              <span className="text-neutral-200 text-sm font-medium">Requer Notebook</span>
            </div>
            <span className="text-neutral-500 text-sm">ou</span>
            <div className="flex items-center gap-2 bg-neutral-800/50 border border-neutral-700/50 px-4 py-2.5 rounded-xl">
              <Monitor className="w-5 h-5 text-neutral-300" />
              <span className="text-neutral-200 text-sm font-medium">Computador de Mesa</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-lg md:text-xl px-10 py-6 rounded-2xl shadow-2xl shadow-yellow-400/30 hover:scale-105 transition-all duration-300 group"
          >
            Aprender grátis agora!
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <footer className="py-6 border-t border-white/5 text-center">
        <p className="text-neutral-600 text-xs">
          © 2026 MRO - Mais Resultados Online. Todos os direitos reservados.
        </p>
      </footer>
    </div>
    </>
  );
};

export default RendaExtra2;
