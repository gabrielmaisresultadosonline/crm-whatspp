import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Instagram, MessageCircle, Home, Wand2 } from "lucide-react";

const AreaDeMembros = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* Logo */}
        <Logo size="xl" />

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground text-center">
          Área de Membros 2.0
        </h1>

        {/* Member Area Buttons */}
        <div className="w-full flex flex-col gap-4">
          <Link to="/instagram" className="w-full">
            <Button 
              size="xl" 
              className="w-full gap-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white border-0"
            >
              <Instagram className="h-6 w-6" />
              Ferramenta para Instagram
            </Button>
          </Link>

          <Link to="/zapmro" className="w-full">
            <Button 
              size="xl" 
              className="w-full gap-3 bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="h-6 w-6" />
              Ferramenta para WhatsApp
            </Button>
          </Link>

          <Link to="/prompts" className="w-full">
            <Button 
              size="xl" 
              className="w-full gap-3 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white border-0"
            >
              <Wand2 className="h-6 w-6" />
              Prompts MRO
            </Button>
          </Link>
        </div>

        {/* Footer Links */}
        <div className="flex flex-col items-center gap-4 mt-8">
          <a 
            href="https://maisresultadosonline.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Página Inicial</span>
          </a>

          <a 
            href="https://instagram.com/maisresultadosonline" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Instagram className="h-5 w-5" />
            <span>@maisresultadosonline</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AreaDeMembros;
