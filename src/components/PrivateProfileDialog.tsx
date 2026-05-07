import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, ExternalLink, RefreshCw, Eye } from 'lucide-react';

interface PrivateProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onRetrySync?: () => void;
}

export const PrivateProfileDialog = ({ 
  isOpen, 
  onClose, 
  username,
  onRetrySync 
}: PrivateProfileDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-background border-primary/30">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/20">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl text-foreground">
                Perfil Privado Detectado
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                @{username}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Dados básicos carregados com sucesso!
                </p>
                <p className="text-sm text-muted-foreground">
                  Como o perfil é privado, não conseguimos rastrear posts, curtidas e engajamento. 
                  Para ter acesso completo aos dados, torne seu perfil público.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">
                ?
              </span>
              Como tornar seu perfil público:
            </h4>
            
            <div className="space-y-3 pl-2">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                  1
                </span>
                <div>
                  <p className="text-sm text-foreground">
                    Abra o <strong>Instagram</strong> no celular
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                  2
                </span>
                <div>
                  <p className="text-sm text-foreground">
                    Vá em <strong>Configurações</strong> → <strong>Privacidade da conta</strong>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                  3
                </span>
                <div>
                  <p className="text-sm text-foreground">
                    Desative a opção <strong>"Conta privada"</strong>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                  4
                </span>
                <div>
                  <p className="text-sm text-foreground">
                    Volte aqui e <strong>sincronize novamente</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Você pode continuar usando a ferramenta com dados básicos. 
              Porém, para estratégias mais precisas baseadas em engajamento, recomendamos tornar o perfil público.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Continuar Assim
          </Button>
          {onRetrySync && (
            <Button onClick={onRetrySync} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Sincronizar Novamente
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
