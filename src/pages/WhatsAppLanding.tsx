import { useState, useEffect } from "react";
import { MessageCircle, Sparkles, Headset, HelpCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView, trackLead } from "@/lib/facebookTracking";
import { openWhatsAppChat } from "@/lib/whatsapp";
import logoMroWhite from "@/assets/logo-mro-white.png";

const ICON_MAP: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  headset: Headset,
  help: HelpCircle,
};

interface OptionItem {
  id: string;
  label: string;
  message: string;
  icon_type: string;
  color: string;
  order_index: number;
}

const WhatsAppLanding = () => {
  const [settings, setSettings] = useState({
    whatsapp_number: "",
    page_title: "Gabriel está disponível agora para te ajudar",
    page_subtitle: "Sobre o que gostaria de falar clique no botão abaixo.",
    button_text: "FALAR NO WHATSAPP",
    whatsapp_message: "Olá, vim pelo site, gostaria de saber sobre o sistema inovador!",
  });
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    trackPageView("WhatsApp Landing");
    const load = async () => {
      const { data, error } = await supabase.rpc("get_whatsapp_public_config");

      if (!error && data) {
        const config = data as {
          whatsapp_number?: string;
          page_title?: string;
          page_subtitle?: string;
          button_text?: string;
          whatsapp_message?: string;
          options?: OptionItem[];
        };

        setSettings({
          whatsapp_number: config.whatsapp_number ?? "",
          page_title: config.page_title ?? "Gabriel está disponível agora para te ajudar",
          page_subtitle: config.page_subtitle ?? "Sobre o que gostaria de falar clique no botão abaixo.",
          button_text: config.button_text ?? "FALAR NO WHATSAPP",
          whatsapp_message: config.whatsapp_message ?? "Olá, vim pelo site, gostaria de saber sobre o sistema inovador!",
        });
        setOptions(Array.isArray(config.options) ? config.options : []);
        setLoadError(false);
      } else {
        console.error("[WhatsAppLanding] failed to load config", error, data);
        setLoadError(true);
      }

      setLoading(false);
    };
    load();
  }, []);

  const openWhatsApp = (message: string) => {
    setShowOptions(false);
    openWhatsAppChat(settings.whatsapp_number, message);
  };

  const handleOptionClick = (option: OptionItem) => {
    trackLead(`WhatsApp Landing - ${option.label}`);
    openWhatsApp(option.message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] flex flex-col items-center px-4 py-6 sm:py-10">
      {/* Logo MRO branca no topo */}
      <div className="w-full flex justify-center mb-8 sm:mb-12">
        <img src={logoMroWhite} alt="MRO Logo" className="h-10 sm:h-14 object-contain" />
      </div>

      <div className="max-w-md w-full text-center space-y-6 sm:space-y-8 flex-1 flex flex-col justify-center">
        {/* Online indicator */}
        <div className="flex items-center justify-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-green-400 text-sm font-medium">Online agora</span>
        </div>

        {/* Photo */}
        <div className="flex justify-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-green-500 overflow-hidden shadow-[0_0_30px_rgba(37,211,102,0.3)]">
            <img src="/gabriel-photo.webp" alt="Gabriel" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
            {settings.page_title}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">{settings.page_subtitle}</p>
        </div>

        {/* Single CTA Button */}
          <button
          onClick={() => {
            if (options.length > 0) {
              setShowOptions(true);
              return;
            }

            trackLead("WhatsApp Landing - Contato Direto");
            openWhatsApp(settings.whatsapp_message);
          }}
          className="w-full py-5 px-6 rounded-2xl font-bold text-lg sm:text-xl text-white flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,211,102,0.4)]"
          style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
        >
          <MessageCircle className="w-7 h-7 flex-shrink-0" />
          {settings.button_text || "FALAR NO WHATSAPP"}
        </button>

        <p className="text-gray-500 text-xs">Você será redirecionado para o WhatsApp</p>

        {loadError && (
          <p className="text-xs text-destructive">
            Não foi possível carregar as opções agora. O botão principal ainda abre o WhatsApp direto.
          </p>
        )}
      </div>

      {/* Options Popup */}
      {showOptions && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowOptions(false)}>
          <div
            className="bg-[#1a1a2e] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border-t sm:border border-gray-700 p-6 space-y-5 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Sobre o que deseja falar?</h2>
              <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {options.length === 0 && (
                <button
                  onClick={() => {
                    trackLead("WhatsApp Landing - Contato Direto");
                    openWhatsApp(settings.whatsapp_message);
                  }}
                  className="w-full py-4 px-5 rounded-2xl font-semibold text-sm sm:text-base text-white flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] active:scale-95 text-left border border-white/10 hover:border-white/20"
                  style={{ background: "linear-gradient(135deg, rgba(37,211,102,0.25) 0%, rgba(18,140,126,0.18) 100%)" }}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500">
                    <MessageCircle className="w-5 h-5 text-black" />
                  </div>
                  <span className="flex-1">Abrir atendimento direto</span>
                  <MessageCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                </button>
              )}
              {options.map((option) => {
                const Icon = ICON_MAP[option.icon_type] || MessageCircle;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option)}
                    className="w-full py-4 px-5 rounded-2xl font-semibold text-sm sm:text-base text-white flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] active:scale-95 text-left border border-white/10 hover:border-white/20"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)" }}
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: option.color }}>
                      <Icon className="w-5 h-5 text-black" />
                    </div>
                    <span className="flex-1">{option.label}</span>
                    <MessageCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppLanding;
