import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, RefreshCw, Shield, Camera } from 'lucide-react';

interface AgeRestrictionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onRetrySync?: () => void;
  onGoToMemberArea?: () => void;
}

export const AgeRestrictionDialog = ({ 
  isOpen, 
  onClose, 
  username,
  onRetrySync,
  onGoToMemberArea
}: AgeRestrictionDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg bg-background border-destructive/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 sm:p-3 rounded-full bg-destructive/20 flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-xl text-foreground leading-tight">
                Perfil com Restrição de Idade
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm truncate">
                @{username}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">
                  Este perfil está configurado como 18+ no Instagram
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  O Instagram não permite acessar dados de perfis com restrição de idade via API.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                ?
              </span>
              Como resolver:
            </h4>
            
            <div className="space-y-2 sm:space-y-3 pl-1 sm:pl-2">
              <div className="flex gap-2 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                  1
                </span>
                <p className="text-xs sm:text-sm text-foreground">
                  Abra o <strong>Instagram</strong> no celular ou navegador
                </p>
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                  2
                </span>
                <p className="text-xs sm:text-sm text-foreground break-words">
                  Vá em <strong>Configurações</strong> → <strong>Conta</strong> → <strong>Conteúdo Sensível</strong>
                </p>
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                  3
                </span>
                <p className="text-xs sm:text-sm text-foreground break-words">
                  Desative a opção <strong>"Conta com restrição de idade"</strong>
                </p>
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                  4
                </span>
                <p className="text-xs sm:text-sm text-foreground">
                  Aguarde alguns minutos e <strong>sincronize novamente</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Alternative: Upload screenshot manually */}
          {onGoToMemberArea && (
            <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-start gap-2 sm:gap-3">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1 min-w-0">
                  <p className="font-medium text-foreground text-sm sm:text-base">
                    Alternativa: Envie um print do perfil
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Você pode ir direto para a área de membros e enviar um <strong>print do perfil</strong>. 
                    Nossa IA vai analisar a imagem e gerar estratégias personalizadas!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
              <strong>Nota:</strong> Perfis públicos sem restrição de idade são sincronizados automaticamente. 
              Se o problema persistir após desativar a restrição, aguarde até 1 hora para as mudanças propagarem.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm">
            Fechar
          </Button>
          {onGoToMemberArea && (
            <Button variant="secondary" onClick={onGoToMemberArea} className="gap-2 w-full sm:w-auto text-sm">
              <Camera className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Seguir com Print Manual</span>
            </Button>
          )}
          {onRetrySync && (
            <Button onClick={onRetrySync} className="gap-2 w-full sm:w-auto text-sm">
              <RefreshCw className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Sincronizar Novamente</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
