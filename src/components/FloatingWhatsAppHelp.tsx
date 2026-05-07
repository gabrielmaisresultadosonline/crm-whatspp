import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { openWhatsAppChat } from "@/lib/whatsapp";

interface Props {
  /** Element id to scroll to when the user picks "No". Defaults to top of page. */
  scrollTargetId?: string;
  /** Message sent to WhatsApp when user confirms. */
  message?: string;
}

const DEFAULT_MESSAGE =
  "Estou no site, gostaria de tirar umas dúvidas sobre a ferramenta.";

const FloatingWhatsAppHelp = ({
  scrollTargetId,
  message = DEFAULT_MESSAGE,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_whatsapp_public_config");
        if (cancelled || error || !data) return;
        const cfg = data as { whatsapp_number?: string };
        if (cfg.whatsapp_number) setPhone(cfg.whatsapp_number);
      } catch {
        /* silently ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleYes = () => {
    setOpen(false);
    if (phone) openWhatsAppChat(phone, message);
  };

  const handleNo = () => {
    setOpen(false);
    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <button
        type="button"
        aria-label="Falar no WhatsApp"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/40 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 md:h-16 md:w-16"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-30" />
        <svg
          viewBox="0 0 32 32"
          className="relative h-7 w-7 text-white md:h-8 md:w-8"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19.11 17.27c-.27-.13-1.59-.78-1.83-.87-.25-.09-.43-.13-.61.13-.18.27-.7.87-.86 1.05-.16.18-.32.2-.59.07-.27-.13-1.13-.42-2.16-1.34-.8-.71-1.34-1.59-1.49-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.4-.48.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.07-.13-.61-1.46-.83-2-.22-.53-.45-.46-.61-.47l-.52-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.99 2.66 1.13 2.84.13.18 1.94 2.97 4.7 4.05.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.59-.65 1.81-1.27.22-.62.22-1.16.16-1.27-.07-.11-.25-.18-.52-.31zM16.04 4C9.4 4 4 9.4 4 16.04c0 2.12.55 4.18 1.6 6L4 28l6.13-1.6a12 12 0 0 0 5.91 1.51h.01c6.64 0 12.04-5.4 12.04-12.04S22.68 4 16.04 4zm0 21.95h-.01a9.93 9.93 0 0 1-5.06-1.39l-.36-.21-3.64.95.97-3.55-.24-.37a9.94 9.94 0 0 1-1.52-5.34c0-5.49 4.47-9.96 9.96-9.96s9.96 4.47 9.96 9.96-4.47 9.96-9.96 9.96z" />
        </svg>
      </button>

      {/* Confirmation Popup */}
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gradient-to-b from-gray-900 to-black p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/20">
                <svg viewBox="0 0 32 32" className="h-6 w-6 text-[#25D366]" fill="currentColor" aria-hidden="true">
                  <path d="M19.11 17.27c-.27-.13-1.59-.78-1.83-.87-.25-.09-.43-.13-.61.13-.18.27-.7.87-.86 1.05-.16.18-.32.2-.59.07-.27-.13-1.13-.42-2.16-1.34-.8-.71-1.34-1.59-1.49-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.4-.48.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.07-.13-.61-1.46-.83-2-.22-.53-.45-.46-.61-.47l-.52-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.99 2.66 1.13 2.84.13.18 1.94 2.97 4.7 4.05.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.59-.65 1.81-1.27.22-.62.22-1.16.16-1.27-.07-.11-.25-.18-.52-.31zM16.04 4C9.4 4 4 9.4 4 16.04c0 2.12.55 4.18 1.6 6L4 28l6.13-1.6a12 12 0 0 0 5.91 1.51h.01c6.64 0 12.04-5.4 12.04-12.04S22.68 4 16.04 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Antes de continuar</h3>
            </div>
            <p className="mb-6 text-sm text-gray-300">
              Você já assistiu o vídeo de explicação no site? Ele responde a maioria das dúvidas em poucos minutos.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleYes}
                className="flex-1 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#20bd5a]"
              >
                Sim, falar no WhatsApp
              </button>
              <button
                type="button"
                onClick={handleNo}
                className="flex-1 rounded-lg border border-gray-600 bg-transparent px-4 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/5"
              >
                Não, ver o vídeo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingWhatsAppHelp;
