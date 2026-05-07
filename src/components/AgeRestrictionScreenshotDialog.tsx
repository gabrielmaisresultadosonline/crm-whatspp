import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Camera, Check, Clipboard, Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { readInstagramScreenshot, restoreStoredScreenshot } from '@/lib/instagramScreenshot';

interface AgeRestrictionScreenshotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  squarecloudUsername: string;
  onDataExtracted: (data: {
    followers: number;
    following: number;
    posts: number;
    bio?: string;
    fullName?: string;
    screenshotUrl: string;
    analysis: any;
  }) => void;
}

export const AgeRestrictionScreenshotDialog = ({
  isOpen,
  onClose,
  username,
  squarecloudUsername,
  onDataExtracted
}: AgeRestrictionScreenshotDialogProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle paste event for Ctrl+V
  useEffect(() => {
    if (!isOpen) return;
    
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    toast.success('Imagem selecionada! Clique em "Enviar e Analisar"');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Selecione uma imagem primeiro');
      return;
    }

    setIsUploading(true);

    try {
      const ocrResult = await readInstagramScreenshot(selectedFile);

      if (ocrResult.detectedUsername && ocrResult.detectedUsername !== username.toLowerCase()) {
        toast.error(`O print enviado é do perfil @${ocrResult.detectedUsername}, mas a conta cadastrada é @${username}. Envie um print real do perfil correto.`);
        setIsUploading(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-profile-screenshot', {
          body: {
            username,
            squarecloud_username: squarecloudUsername,
            image_base64: base64.split(',')[1],
            content_type: selectedFile.type
          }
        });

        if (uploadError) throw uploadError;

        if (!uploadData?.url) {
          throw new Error('Falha no upload');
        }

        setIsUploading(false);
        setIsAnalyzing(true);
        toast.success('Print enviado! Analisando dados...');

        // Analyze screenshot to extract profile data
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-profile-screenshot', {
          body: {
            screenshot_url: uploadData.url,
            username,
            ocr_text: ocrResult.text,
          }
        });

        if (analysisError) throw analysisError;

        if (analysisData?.success === false) {
          await restoreStoredScreenshot({ username, squarecloudUsername, screenshotUrl: null });
          throw new Error(
            analysisData?.message ||
              (analysisData?.error === 'username_mismatch'
                ? `O print enviado não corresponde ao perfil @${username}.`
                : 'Não foi possível extrair dados do print')
          );
        }
        
        if (analysisData?.extracted_data || analysisData?.analysis) {
          const extracted = analysisData.extracted_data || {};
          
          onDataExtracted({
            followers: extracted.followers || 0,
            following: extracted.following || 0,
            posts: extracted.posts_count || 0,
            bio: extracted.bio || '',
            fullName: extracted.full_name || username,
            screenshotUrl: uploadData.url,
            analysis: analysisData.analysis
          });
          
          toast.success('Dados extraídos com sucesso!');
          onClose();
        } else {
          throw new Error('Não foi possível extrair dados do print');
        }
      };
      reader.readAsDataURL(selectedFile);

    } catch (error) {
      console.error('Upload/Analysis error:', error);
      toast.error('Erro ao processar print. Tente novamente.');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-background">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-orange-500/20">
              <Camera className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <DialogTitle className="text-xl text-foreground">
                Perfil com Restrição de Idade
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                @{username} - Envie um print para continuar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Este perfil não pode ser sincronizado automaticamente
                </p>
                <p className="text-sm text-muted-foreground">
                  Envie um print do seu perfil do Instagram e nossa I.A. vai extrair os dados automaticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {previewUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img 
                src={previewUrl} 
                alt="Print do perfil" 
                className="w-full max-h-[300px] object-contain bg-muted"
              />
              {!isUploading && !isAnalyzing && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div 
                tabIndex={0}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                onClick={(e) => {
                  e.currentTarget.focus();
                  toast.info('Área selecionada! Use Ctrl+V para colar a imagem');
                }}
              >
                <Clipboard className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-1">
                  Clique aqui e use <span className="text-primary font-medium">Ctrl+V</span> para colar
                </p>
                <p className="text-xs text-muted-foreground">
                  ou selecione um arquivo abaixo
                </p>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Imagem
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Action Button */}
          {previewUrl && (
            <Button 
              onClick={handleUploadAndAnalyze}
              disabled={isUploading || isAnalyzing}
              className="w-full bg-primary"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando com I.A...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Enviar e Analisar
                </>
              )}
            </Button>
          )}

          {/* Instructions */}
          <div className="bg-secondary/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">📸 Como tirar o print:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Abra seu perfil no Instagram</li>
              <li>Certifique-se que mostra seguidores, seguindo e posts</li>
              <li>Tire um print da tela inteira</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
