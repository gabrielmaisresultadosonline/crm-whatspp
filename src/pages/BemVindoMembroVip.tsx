import { Button } from "@/components/ui/button";
import { ExternalLink, Play } from "lucide-react";

const BemVindoMembroVip = () => {
  const videoId = "5THSI_BIBnU";

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
            <Play className="w-4 h-4" />
            Membro VIP
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white">
            Seja bem vindo ao{" "}
            <span className="text-emerald-400">Instalador Windows MRO</span>!
          </h1>
          <p className="text-zinc-400 text-lg">
            Assista o vídeo abaixo para começar
          </p>
        </div>

        {/* Video Container */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10 border border-zinc-700/50">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            title="Instalador Windows MRO"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>

        {/* CTA Button */}
        <div className="text-center space-y-4">
          <p className="text-zinc-400">
            Após assistir o vídeo, acesse sua área de membros:
          </p>
          <Button
            asChild
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
          >
            <a
              href="https://maisresultadosonline.com.br/instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Área de Membros Principal
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BemVindoMembroVip;
