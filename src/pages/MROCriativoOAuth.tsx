import { useEffect } from "react";

const MROCriativoOAuth = () => {
  useEffect(() => {
    // Lógica para processar o código de autenticação do Meta/Instagram
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      console.log("Código OAuth recebido:", code);
      // Aqui você enviaria o código para seu backend ou salvaria no Supabase
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center text-white p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-black text-primary">Autenticação MRO Criativo</h1>
        <p className="text-gray-400">Processando sua conexão com o Instagram...</p>
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
};

export default MROCriativoOAuth;