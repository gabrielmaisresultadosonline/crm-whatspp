import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircle, Send, Loader2, CheckCircle, 
  HelpCircle, X
} from 'lucide-react';

interface TicketFormProps {
  platform: 'instagram' | 'zapmro';
  username: string;
  email?: string;
  onClose?: () => void;
}

const TicketForm = ({ platform, username, email, onClose }: TicketFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({ 
        title: 'Preencha todos os campos', 
        description: 'Assunto e mensagem são obrigatórios',
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('support-tickets', {
        body: {
          action: 'create',
          platform,
          username,
          email,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority
        }
      });

      if (error) throw error;

      if (data.success) {
        setTicketNumber(data.ticket.ticket_number);
        setSubmitted(true);
        toast({ 
          title: 'Ticket criado com sucesso!', 
          description: `Número: ${data.ticket.ticket_number}` 
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({ 
        title: 'Erro ao criar ticket', 
        description: 'Tente novamente mais tarde',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Ticket Enviado!</h3>
        <p className="text-muted-foreground mb-4">
          Seu ticket foi criado com sucesso. Guardar o número para acompanhamento:
        </p>
        <div className="inline-block bg-secondary px-4 py-2 rounded-lg font-mono text-lg mb-6">
          {ticketNumber}
        </div>
        <p className="text-sm text-muted-foreground">
          Nossa equipe responderá o mais breve possível.
        </p>
        {onClose && (
          <Button onClick={onClose} className="mt-4">
            Fechar
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          platform === 'instagram' 
            ? 'bg-gradient-to-r from-pink-500 to-purple-600' 
            : 'bg-gradient-to-r from-green-500 to-emerald-600'
        }`}>
          {platform === 'instagram' ? (
            <HelpCircle className="w-5 h-5 text-white" />
          ) : (
            <MessageCircle className="w-5 h-5 text-white" />
          )}
        </div>
        <div>
          <h3 className="font-bold">Criar Ticket de Suporte</h3>
          <p className="text-sm text-muted-foreground">
            {platform === 'instagram' ? 'MRO Ferramenta' : 'ZAPMRO'}
          </p>
        </div>
        {onClose && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div>
        <Label htmlFor="subject">Assunto *</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Descreva brevemente o problema"
          maxLength={100}
        />
      </div>

      <div>
        <Label htmlFor="message">Mensagem *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Descreva o problema em detalhes. Quanto mais informações, melhor poderemos ajudar."
          rows={5}
        />
      </div>

      <div>
        <Label htmlFor="priority">Prioridade</Label>
        <select
          id="priority"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          className="w-full mt-1 bg-secondary border border-border rounded-md px-3 py-2"
        >
          <option value="low">Baixa - Dúvida geral</option>
          <option value="normal">Normal - Problema comum</option>
          <option value="high">Alta - Impacta meu uso</option>
          <option value="urgent">Urgente - Não consigo usar</option>
        </select>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>Usuário: @{username}</p>
        {email && <p>Email: {email}</p>}
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className={`w-full ${
          platform === 'instagram'
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Enviar Ticket
          </>
        )}
      </Button>
    </form>
  );
};

export default TicketForm;
