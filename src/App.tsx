import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { getAdminData } from "./lib/adminConfig";
import { trackPageView } from "./lib/facebookTracking";
import ToolSelector from "./pages/ToolSelector";
import Index from "./pages/Index";
import ZapMRO from "./pages/ZapMRO";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import MROFerramenta from "./pages/MROFerramenta";
import MROPagamento from "./pages/MROPagamento";
import MROObrigado from "./pages/MROObrigado";
import Vendas from "./pages/Vendas";
import VendasCompleta from "./pages/VendasCompleta";
import InstagramNovaAdmin from "./pages/InstagramNovaAdmin";
import InstagramNovaAdminEmail from "./pages/InstagramNovaAdminEmail";
import InstagramNovaEuro from "./pages/InstagramNovaEuro";
import InstagramNovaEuroAdmin from "./pages/InstagramNovaEuroAdmin";
import InstagramNovaPromo from "./pages/InstagramNovaPromo";
import InstagramNovaPromoo2 from "./pages/InstagramNovaPromoo2";
import DescontoAlunosRendaExtra from "./pages/DescontoAlunosRendaExtra";
import DescontoAlunosRendaExtras from "./pages/DescontoAlunosRendaExtras";
import DescontoAlunosRendaExtrasss from "./pages/DescontoAlunosRendaExtrasss";
import DescontoAlunosRendaExtrass from "./pages/DescontoAlunosRendaExtrass";
import InstagramPromoMila from "./pages/InstagramPromoMila";
import AffiliatePromoPage from "./pages/AffiliatePromoPage";
import AffiliateResumo from "./pages/AffiliateResumo";
import Membro from "./pages/Membro";
import Ligacao from "./pages/Ligacao";
import Obrigado from "./pages/Obrigado";
import ObrigadoZapmro from "./pages/ObrigadoZapmro";
import ZapMROVendas from "./pages/ZapMROVendas";
import ZapMROVendasProm from "./pages/ZapMROVendasProm";
import ZapmroVendasAdmin from "./pages/ZapmroVendasAdmin";
import Promo33 from "./pages/Promo33";
import Promo33Dashboard from "./pages/Promo33Dashboard";
import Promo33Obrigado from "./pages/Promo33Obrigado";
import Promo33Admin from "./pages/Promo33Admin";
import GestaoMensal from "./pages/GestaoMensal";
import AdminUsuario from "./pages/AdminUsuario";
import MelhorarPublico from "./pages/MelhorarPublico";
import Pagamento from "./pages/Pagamento";
import PagamentoObrigado from "./pages/PagamentoObrigado";
import PagamentoAdmin from "./pages/PagamentoAdmin";
import ComprouSeguidores from "./pages/ComprouSeguidores";
import MetodoSeguidorMembro from "./pages/MetodoSeguidorMembro";
import MetodoSeguidorAdmin from "./pages/MetodoSeguidorAdmin";
import AreaDeMembros from "./pages/AreaDeMembros";
import AdsNews from "./pages/AdsNews";
import AdsNewsDash from "./pages/AdsNewsDash";
import AdsNewsAdmin from "./pages/AdsNewsAdmin";
import AdsNewsObrigado from "./pages/AdsNewsObrigado";
import AdsNewsObrigadoSaldo from "./pages/AdsNewsObrigadoSaldo";
import PoliticaCancelamento from "./pages/PoliticaCancelamento";
import WhatsAppLanding from "./pages/WhatsAppLanding";
import WhatsAppAdmin from "./pages/WhatsAppAdmin";
import BemVindoMembroVip from "./pages/BemVindoMembroVip";
import VendasCompletaPro from "./pages/VendasCompletaPro";
import TesteGratis from "./pages/TesteGratis";
import TesteGratisAdmin from "./pages/TesteGratisAdmin";
import TesteGratisUsuario from "./pages/TesteGratisUsuario";
import RendaExtra from "./pages/RendaExtra";
import RendaExtra2 from "./pages/RendaExtra2";
import RendaExtraAdmin from "./pages/RendaExtraAdmin";
import RendaExt from "./pages/RendaExt";
import RendaExtAdmin from "./pages/RendaExtAdmin";
import RendaExtraOf from "./pages/RendaExtraOf";
import CorretorMRO from "./pages/CorretorMRO";
import CorretorMROAdmin from "./pages/CorretorMROAdmin";
import CorretorMROObrigado from "./pages/CorretorMROObrigado";
import RateLimitHard from "./pages/RateLimitHard";
import InteligenciaFotos from "./pages/InteligenciaFotos";
import InteligenciaFotosDashboard from "./pages/InteligenciaFotosDashboard";
import InteligenciaFotosAdmin from "./pages/InteligenciaFotosAdmin";
import InstagramNovaP from "./pages/InstagramNovaP";
import Live from "./pages/Live";
import LiveAdmin from "./pages/LiveAdmin";
import LicencaAdmin from "./pages/LicencaAdmin";
import PromptsMRO from "./pages/PromptsMRO";
import PromptsMROAdmin from "./pages/PromptsMROAdmin";
import PromptsMRODashboard from "./pages/PromptsMRODashboard";
import PromptsIN from "./pages/PromptsIN";
import PromptsINAdmin from "./pages/PromptsINAdmin";
import PromptsINDashboard from "./pages/PromptsINDashboard";
import PoliticaDePrivacidadeIG from "./pages/PoliticaDePrivacidadeIG";
import MRODirectMais from "./pages/MRODirectMais";
import IAVendeMais from "./pages/IAVendeMais";
import IAVendeMaisAdmin from "./pages/IAVendeMaisAdmin";
import RendaExtraLigacao from "./pages/RendaExtraLigacao";
import RendaExtraLigacaoAdmin from "./pages/RendaExtraLigacaoAdmin";
import Relatorios from "./pages/Relatorios";
import EstruturaRendaExtra from "./pages/EstruturaRendaExtra";
import WhatsAppDireto from "./pages/WhatsAppDireto";
import ApiWhatsAppAccess from "./pages/ApiWhatsAppAccess";
import RendaExtraAula from "./pages/RendaExtraAula";
import RendaExtraAulaAdmin from "./pages/RendaExtraAulaAdmin";
import Addmin from "./pages/Addmin";
import RendaExtObrigado from "./pages/RendaExtObrigado";
import CRM from "./pages/CRM";
import CRMLogin from "./pages/CRMLogin";
import MROCriativo from "./pages/MROCriativo";
import MROCriativoAdmin from "./pages/MROCriativoAdmin";
import MROCriativoTerms from "./pages/MROCriativoTerms";
import MROCriativoPrivacy from "./pages/MROCriativoPrivacy";
import MROCriativoCallback from "./pages/MROCriativoCallback";
import MROCriativoWebhook from "./pages/MROCriativoWebhook";
import MROCriativoOAuth from "./pages/MROCriativoOAuth";



const queryClient = new QueryClient();

// Facebook Pixel Route Tracking component
const FacebookPixelHandler = () => {
  const location = useLocation();

  useEffect(() => {
    const adminData = getAdminData();
    const pixelId = adminData?.settings?.pixelSettings?.pixelId || '569414052132145';
    const isEnabled = adminData?.settings?.pixelSettings?.enabled !== false;

    if (!isEnabled) return;

    if (typeof window !== 'undefined' && (window as any).fbq) {
      // Re-initialize if needed or just track
      // (Meta says calling init twice is fine and helps ensure the ID is correct)
      (window as any).fbq('init', pixelId);
      
      // Track PageView on route change
      // Only track if it's not the first load (to avoid double tracking with index.html)
      // or just rely on this one and remove it from index.html if possible.
      // But actually, trackPageView is already called in many page components' useEffect.
      // So this global handler might cause double tracking if pages also have it.
    }
  }, [location.pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ToolSelector />} />
          <Route path="/instagram" element={<Index />} />
          <Route path="/zapmro" element={<ZapMRO />} />
          <Route path="/zapmro/vendas" element={<ZapMROVendas />} />
          <Route path="/zapmro/vendas/prom" element={<ZapMROVendasProm />} />
          <Route path="/zapmro/vendas/admin" element={<ZapmroVendasAdmin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/mro-ferramenta" element={<MROFerramenta />} />
          <Route path="/mropagamento" element={<MROPagamento />} />
          <Route path="/mroobrigado" element={<MROObrigado />} />
          <Route path="/mro-obrigado" element={<MROObrigado />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/instagram-nova" element={<VendasCompleta />} />
          <Route path="/instagram-nova-admin" element={<InstagramNovaAdmin />} />
          <Route path="/instagram-nova-admin/email" element={<InstagramNovaAdminEmail />} />
          <Route path="/instagram-nova-euro" element={<InstagramNovaEuro />} />
          <Route path="/instagram-nova-euro-admin" element={<InstagramNovaEuroAdmin />} />
          <Route path="/instagram-nova-promo" element={<InstagramNovaPromo />} />
          <Route path="/instagram-nova-promoo2" element={<InstagramNovaPromoo2 />} />
          <Route path="/instagram-nova-p" element={<InstagramNovaP />} />
          <Route path="/instagram-promo-mila" element={<InstagramPromoMila />} />
          <Route path="/promo/:affiliateId" element={<AffiliatePromoPage />} />
          <Route path="/resumo/:affiliateId" element={<AffiliateResumo />} />
          <Route path="/mrointeligente" element={<VendasCompleta />} />
          <Route path="/membro" element={<Membro />} />
          <Route path="/ligacao" element={<Ligacao />} />
          <Route path="/obrigado" element={<Obrigado />} />
          <Route path="/obrigadozapmro" element={<ObrigadoZapmro />} />
          <Route path="/promo33" element={<Promo33 />} />
          <Route path="/promo33/dashboard" element={<Promo33Dashboard />} />
          <Route path="/promo33/obrigado" element={<Promo33Obrigado />} />
          <Route path="/promo33/admin" element={<Promo33Admin />} />
          <Route path="/gestaomensal" element={<GestaoMensal />} />
          <Route path="/adminusuario" element={<AdminUsuario />} />
          <Route path="/melhorarpublico" element={<MelhorarPublico />} />
          <Route path="/pagamento" element={<Pagamento />} />
          <Route path="/pagamentoobrigado" element={<PagamentoObrigado />} />
          <Route path="/pagamentoadmin" element={<PagamentoAdmin />} />
          <Route path="/comprouseguidores" element={<ComprouSeguidores />} />
          <Route path="/metodoseguidormembro" element={<MetodoSeguidorMembro />} />
          <Route path="/metodoseguidoradmin" element={<MetodoSeguidorAdmin />} />
          <Route path="/areademembros" element={<AreaDeMembros />} />
          <Route path="/anuncios" element={<AdsNews />} />
          <Route path="/anuncios/dash" element={<AdsNewsDash />} />
          <Route path="/anuncios/admin" element={<AdsNewsAdmin />} />
          <Route path="/anuncios/obrigado" element={<AdsNewsObrigado />} />
          <Route path="/anuncios/obrigado-saldo" element={<AdsNewsObrigadoSaldo />} />
          <Route path="/politica-de-cancelamento" element={<PoliticaCancelamento />} />
          
          <Route path="/whatsapp" element={<WhatsAppLanding />} />
          <Route path="/whatsapp/admin" element={<WhatsAppAdmin />} />
          <Route path="/seja-bem-vindo-membro-vip" element={<BemVindoMembroVip />} />
          <Route path="/instagram-nova-pro" element={<VendasCompletaPro />} />
          <Route path="/testegratis" element={<TesteGratis />} />
          <Route path="/testegratis/admin" element={<TesteGratisAdmin />} />
          <Route path="/testegratis/usuario" element={<TesteGratisUsuario />} />
          <Route path="/rendaextra" element={<RendaExtra />} />
          <Route path="/rendaextra/admin" element={<RendaExtraAdmin />} />
          <Route path="/rendaextra2" element={<RendaExtra2 />} />
          <Route path="/rendaextra2/admin" element={<RendaExtraAdmin />} />
          <Route path="/rendaext" element={<RendaExt />} />
          <Route path="/rendaext/admin" element={<RendaExtAdmin />} />
          <Route path="/rendaext/obrigado" element={<RendaExtObrigado />} />
          <Route path="/rendaextraof" element={<RendaExtraOf />} />

          <Route path="/corretormro" element={<CorretorMRO />} />
          <Route path="/corretormro/admin" element={<CorretorMROAdmin />} />
          <Route path="/corretormro/obrigado" element={<CorretorMROObrigado />} />
          <Route path="/RateLimitHard" element={<RateLimitHard />} />
          <Route path="/inteligenciafotos" element={<InteligenciaFotos />} />
          <Route path="/inteligenciafotos/dashboard" element={<InteligenciaFotosDashboard />} />
          <Route path="/inteligenciafotos/admin" element={<InteligenciaFotosAdmin />} />
          <Route path="/live" element={<Live />} />
          <Route path="/live/admin" element={<LiveAdmin />} />
          <Route path="/licencaadmin" element={<LicencaAdmin />} />
          <Route path="/prompts" element={<PromptsMRO />} />
          <Route path="/prompts/admin" element={<PromptsMROAdmin />} />
          <Route path="/prompts/dashboard" element={<PromptsMRODashboard />} />
          <Route path="/promptsin" element={<PromptsIN />} />
          <Route path="/promptsin/admin" element={<PromptsINAdmin />} />
          <Route path="/promptsin/dashboard" element={<PromptsINDashboard />} />
          <Route path="/politicasdeprivacidadeig" element={<PoliticaDePrivacidadeIG />} />
          <Route path="/mrodirectmais" element={<MRODirectMais />} />
          <Route path="/Iavendemais" element={<IAVendeMais />} />
          <Route path="/Iavendemais/admin" element={<IAVendeMaisAdmin />} />
          <Route path="/rendaextraligacao" element={<RendaExtraLigacao />} />
          <Route path="/rendaextraligacao/admin" element={<RendaExtraLigacaoAdmin />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/descontoalunosrendaextra" element={<DescontoAlunosRendaExtra />} />
          <Route path="/descontoalunosrendaextras" element={<DescontoAlunosRendaExtras />} />
          <Route path="/descontoalunosrendaextrasss" element={<DescontoAlunosRendaExtrasss />} />
          <Route path="/descontoalunosrendaextrass" element={<DescontoAlunosRendaExtrass />} />
          <Route path="/estruturarendaextra" element={<EstruturaRendaExtra />} />
          <Route path="/whatsappdireto" element={<WhatsAppDireto />} />
          <Route path="/apiwhatsappacess" element={<ApiWhatsAppAccess />} />
          
          <Route path="/rendaextraaula" element={<RendaExtraAula />} />
          <Route path="/rendaextraaula/admin" element={<RendaExtraAulaAdmin />} />
          <Route path="/addmin" element={<Addmin />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/crm/login" element={<CRMLogin />} />
          <Route path="/mrocriativo" element={<MROCriativo />} />
          <Route path="/mrocriativo/admin" element={<MROCriativoAdmin />} />
          <Route path="/mrocriativo/terms.php" element={<MROCriativoTerms />} />
          <Route path="/mrocriativo/privacy.php" element={<MROCriativoPrivacy />} />
          <Route path="/mrocriativo/callback.php" element={<MROCriativoCallback />} />
          <Route path="/mrocriativo/webhook.php" element={<MROCriativoWebhook />} />
          <Route path="/mrocriativo/oauth.php" element={<MROCriativoOAuth />} />

          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
