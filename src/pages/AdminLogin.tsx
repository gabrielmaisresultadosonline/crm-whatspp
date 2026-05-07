import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { loginAdmin } from '@/lib/adminConfig';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await loginAdmin(email, password);

    if (result.success) {
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao painel administrativo",
      });
      navigate('/admin');
    } else {
      setError(result.error || 'Credenciais inválidas');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card glow-border p-8 max-w-md w-full animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <Logo size="md" />
          <h1 className="text-2xl font-display font-bold mt-4">Acesso Admin</h1>
          <p className="text-muted-foreground text-sm">Painel de Controle Interno</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email de admin"
              className="bg-secondary/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="bg-secondary/50"
              required
            />
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Entrar'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Acesso restrito apenas para administradores autorizados
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
