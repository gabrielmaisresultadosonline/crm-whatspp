import { UserPlus } from 'lucide-react';

interface CadastrarContaButtonProps {
  onClick?: () => void;
}

export const CadastrarContaButton = ({ onClick }: CadastrarContaButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 active:scale-95 border border-orange-400/50"
    >
      <UserPlus className="w-5 h-5" />
      <span className="hidden sm:inline">Cadastrar Instagram</span>
      <span className="sm:hidden">Cadastrar IG</span>
    </button>
  );
};
