import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { getAdminData } from "./lib/adminConfig";
import NotFound from "./pages/NotFound";
import CRM from "./pages/CRM";
import CRMLogin from "./pages/CRMLogin";
import WhatsAppQR from "./pages/WhatsAppQR";


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
      (window as any).fbq('init', pixelId);
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
        <FacebookPixelHandler />
        <Routes>
          <Route path="/" element={<CRM />} />
          <Route path="/login" element={<CRMLogin />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/crm/login" element={<CRMLogin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
