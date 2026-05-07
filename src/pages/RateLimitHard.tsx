import { AlertTriangle, Clock, Shield } from "lucide-react";
import instagramRateLimitImage from "@/assets/instagram-rate-limit.png";

const RateLimitHard = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-3 py-6 sm:p-4">
      <div className="max-w-2xl w-full bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-yellow-500/30 shadow-2xl p-4 sm:p-6 md:p-8">
        {/* Header Icon */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white mb-3 sm:mb-4 px-2">
          Você tomou um limite do Instagram!
        </h1>

        <p className="text-center text-yellow-400 text-base sm:text-lg mb-4 sm:mb-6 px-2">
          Não tem problema! Nossa ferramenta vai aguardar 1 hora e vai tentar novamente automaticamente.
        </p>

        {/* Instagram Rate Limit Screenshot */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-black rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-xl border border-gray-700">
            <img 
              src={instagramRateLimitImage} 
              alt="Mensagem de limite do Instagram" 
              className="max-w-[220px] sm:max-w-[280px] w-full rounded-lg sm:rounded-xl"
            />
          </div>
        </div>

        {/* Main Explanation */}
        <div className="bg-gray-900/50 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-2 sm:mb-4">
            <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 hidden sm:block mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400 sm:hidden" />
                Por que isso acontece?
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Esse erro é <span className="text-yellow-400 font-medium">normal no Instagram</span>. É um limite que o próprio Instagram impõe para normas de seguir, curtir e deixar de seguir. Quando fazemos em grande quantidade, ele se sobrecarrega e precisa que aguardemos 1 hora para tentar novamente.
              </p>
              <p className="text-green-400 text-sm mt-2 font-medium">
                ✓ Isso evita bloqueio e restrição da sua conta!
              </p>
            </div>
          </div>
        </div>

        {/* Two Situations */}
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0" />
            <span>Esse erro aparece em duas situações:</span>
          </h3>
          
          <div className="grid gap-3 sm:gap-4">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 sm:p-4">
              <h4 className="text-orange-400 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">1. Sobrecarga de ações</h4>
              <p className="text-gray-300 text-xs sm:text-sm">
                Se você já fez várias ações (seguir/deixar de seguir), o sistema para e aguarda para não sobrecarregar. Isso é uma proteção automática!
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4">
              <h4 className="text-red-400 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">2. Limite de 7.500 contas seguidas</h4>
              <p className="text-gray-300 text-xs sm:text-sm">
                Se você já está seguindo <span className="text-red-400 font-bold">7.500 contas</span>, o Instagram limita novas ações. Você é obrigado a <span className="text-yellow-400 font-medium">deixar de seguir algumas contas</span> antes de poder seguir novas.
              </p>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
          <h3 className="text-green-400 font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
            <span className="text-lg sm:text-xl">💡</span>
            <span>Dicas importantes para evitar limites:</span>
          </h3>
          <ul className="space-y-2 sm:space-y-3 text-gray-300 text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-400 flex-shrink-0">•</span>
              <span>Use a ferramenta por <span className="text-white font-medium">7 a 8 horas durante o dia</span> ou <span className="text-white font-medium">12 horas durante a madrugada</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 flex-shrink-0">•</span>
              <span>Alterne: <span className="text-white font-medium">1 dia sim, outro não</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 flex-shrink-0">•</span>
              <span>Sempre mantenha um <span className="text-yellow-400 font-medium">descanso na conta</span></span>
            </li>
          </ul>
        </div>

        {/* Encouragement */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xl sm:text-2xl mb-2">🚀</p>
          <p className="text-white font-bold text-base sm:text-lg">Pra cima deles!</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Isso é normal, não se preocupe!</p>
        </div>

        {/* Info Section */}
        <div className="bg-gray-900/50 rounded-xl p-4 sm:p-5 border border-gray-700">
          <h3 className="text-white font-semibold text-center mb-2 sm:mb-4 text-sm sm:text-base">O que fazer agora?</h3>
          <p className="text-gray-300 text-center text-xs sm:text-sm">
            Volte para a ferramenta e aguarde, ou pare o sistema e volte amanhã.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RateLimitHard;
