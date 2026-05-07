import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bot } from "lucide-react";

const MROCriativoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      toast.error(`Erro na autenticação: ${error}`);
      navigate("/mrocriativo");
      return;
    }

    if (code) {
      // Aqui seria o processamento do código para trocar pelo token
      console.log("Código recebido:", code);
      toast.success("Autenticação Meta realizada com sucesso!");
      
      // Simulação de delay de processamento
      const timer = setTimeout(() => {
        navigate("/mrocriativo/dashboard"); // Ou a página inicial após login
      }, 2000);
      
      return () => clearTimeout(timer);
    }

    // Se não houver código nem erro, volta para a home
    const timeout = setTimeout(() => navigate("/mrocriativo"), 1000);
    return () => clearTimeout(timeout);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center text-white">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Processando Login...</h1>
        <p className="text-gray-400">Finalizando conexão segura com a Meta</p>
      </div>
    </div>
  );
};

export default MROCriativoCallback;
