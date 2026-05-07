import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Camera, Download, History, LogOut, Sparkles, Image, Loader2, Save, Trash2 } from "lucide-react";

interface Template {
  id: string;
  image_url: string;
  title: string;
  description: string;
  category: string;
}

interface Generation {
  id: string;
  template_id: string;
  input_image_url: string;
  generated_image_url: string;
  format: string;
  saved: boolean;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const InteligenciaFotosDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"post" | "stories">("post");
  const [generating, setGenerating] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = sessionStorage.getItem("inteligencia_fotos_user");
    if (!userData) {
      window.location.href = "/inteligenciafotos";
      return;
    }
    setUser(JSON.parse(userData));
    loadTemplates();
    loadGenerations(JSON.parse(userData).id);
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const t = window.setInterval(() => {
      setCooldownSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldownSeconds]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("inteligencia_fotos_templates")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGenerations = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("inteligencia-fotos-manage", {
        body: { action: "get_generations", userId },
      });

      if (error) throw error;
      setGenerations(data?.generations || []);
    } catch (error) {
      console.error("Error loading generations:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !uploadedFile || !user) {
      toast.error("Selecione uma foto para continuar");
      return;
    }

    if (cooldownSeconds > 0) {
      toast.error(`Aguarde ${cooldownSeconds}s e tente novamente.`);
      return;
    }

    setGenerating(true);
    setGeneratedImage(null);

    try {
      // Upload user image first
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("userId", user.id);

      const uploadResponse = await supabase.functions.invoke("inteligencia-fotos-upload", {
        body: formData,
      });

      if (uploadResponse.error) throw new Error("Erro ao fazer upload da imagem");

      const inputImageUrl = uploadResponse.data?.url;

      // Generate image
      const { data, error } = await supabase.functions.invoke("inteligencia-fotos-generate", {
        body: {
          templateId: selectedTemplate.id,
          inputImageUrl,
          userId: user.id,
          format,
        },
      });

      if (error) {
        // When the backend returns a non-2xx (e.g. 429), Supabase JS gives a FunctionsHttpError.
        if (error instanceof FunctionsHttpError) {
          const body = await error.context.json().catch(() => null as any);
          const message = body?.error || "Erro ao gerar imagem";
          const retryAfter = typeof body?.retryAfter === "number" ? body.retryAfter : undefined;
          if (retryAfter && retryAfter > 0) setCooldownSeconds(Math.min(300, Math.ceil(retryAfter)));
          throw new Error(message);
        }

        throw new Error(error.message || "Erro ao gerar imagem");
      }

      if (!data?.success) {
        const retryAfter = typeof (data as any)?.retryAfter === "number" ? (data as any).retryAfter : undefined;
        if (retryAfter && retryAfter > 0) setCooldownSeconds(Math.min(300, Math.ceil(retryAfter)));
        throw new Error(data?.error || "Erro ao gerar imagem");
      }

      setGeneratedImage(data.generatedImageUrl);
      setCooldownSeconds(0);
      toast.success("Imagem gerada com sucesso!");
      loadGenerations(user.id);
    } catch (error: any) {
      console.error("Error generating:", error);
      toast.error(error.message || "Erro ao gerar imagem");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGeneration = async (generationId: string) => {
    try {
      const { error } = await supabase.functions.invoke("inteligencia-fotos-manage", {
        body: { action: "save_generation", generationId },
      });

      if (error) throw error;
      toast.success("Imagem salva!");
      if (user) loadGenerations(user.id);
    } catch (error) {
      toast.error("Erro ao salvar");
    }
  };

  const handleDeleteGeneration = async (generationId: string) => {
    try {
      const { error } = await supabase.functions.invoke("inteligencia-fotos-manage", {
        body: { action: "delete_generation", generationId },
      });

      if (error) throw error;
      toast.success("Imagem removida!");
      if (user) loadGenerations(user.id);
    } catch (error) {
      toast.error("Erro ao remover");
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("inteligencia_fotos_user");
    window.location.href = "/inteligenciafotos";
  };

  const openGenerateDialog = (template: Template) => {
    setSelectedTemplate(template);
    setUploadedImage(null);
    setUploadedFile(null);
    setGeneratedImage(null);
    setFormat("post");
    setShowGenerateDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold text-white">Inteligência Fotos</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-purple-200 text-sm hidden md:block">
              Olá, {user?.name?.split(" ")[0]}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-purple-200 hover:text-white hover:bg-purple-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="bg-black/20 border border-purple-500/30">
            <TabsTrigger value="templates" className="data-[state=active]:bg-purple-600">
              <Image className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Templates Gallery */}
          <TabsContent value="templates">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="bg-white/10 border-purple-500/30 overflow-hidden cursor-pointer hover:scale-105 transition-transform group"
                  onClick={() => openGenerateDialog(template)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={template.image_url}
                      alt={template.title || "Template"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Igual
                      </Button>
                    </div>
                  </div>
                  {template.title && (
                    <CardContent className="p-3">
                      <p className="text-white text-sm font-medium truncate">{template.title}</p>
                    </CardContent>
                  )}
                </Card>
              ))}

              {templates.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Image className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                  <p className="text-purple-200">Nenhum template disponível ainda</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generations.map((gen) => (
                <Card key={gen.id} className="bg-white/10 border-purple-500/30 overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={gen.generated_image_url}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                        {gen.format === "post" ? "Post" : "Stories"}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-purple-200 text-xs">
                      {new Date(gen.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-purple-200 hover:bg-purple-500/20"
                        onClick={() => downloadImage(gen.generated_image_url, `inteligencia-${gen.id}.png`)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {!gen.saved && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-purple-200 hover:bg-purple-500/20"
                          onClick={() => handleSaveGeneration(gen.id)}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-red-400 hover:bg-red-500/20"
                        onClick={() => handleDeleteGeneration(gen.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {generations.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <History className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                  <p className="text-purple-200">Nenhuma geração ainda</p>
                  <p className="text-purple-300 text-sm">Escolha um template e gere sua primeira arte!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Gerar Imagem
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Preview */}
            {selectedTemplate && (
              <div className="text-center">
                <img
                  src={selectedTemplate.image_url}
                  alt="Template"
                  className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
                />
                <p className="text-purple-200 text-sm">Template selecionado</p>
              </div>
            )}

            {/* Upload Photo */}
            <div>
              <Label className="text-purple-200 mb-2 block">Sua Foto</Label>
              <div className="border-2 border-dashed border-purple-500/50 rounded-lg p-6 text-center">
                {uploadedImage ? (
                  <div>
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedImage(null);
                        setUploadedFile(null);
                      }}
                      className="text-purple-300"
                    >
                      Trocar foto
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Camera className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                    <p className="text-purple-200 text-sm">Clique para enviar sua foto</p>
                    <p className="text-purple-400 text-xs mt-1">Rosto ou corpo inteiro</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <Label className="text-purple-200 mb-2 block">Formato</Label>
              <RadioGroup
                value={format}
                onValueChange={(v) => setFormat(v as "post" | "stories")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="post" id="post" className="border-purple-400 text-purple-400" />
                  <Label htmlFor="post" className="text-white cursor-pointer">
                     Post (2048x1638)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stories" id="stories" className="border-purple-400 text-purple-400" />
                  <Label htmlFor="stories" className="text-white cursor-pointer">
                    Stories (1080x1920)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Generated Image */}
            {generatedImage && (
              <div className="text-center">
                <Label className="text-purple-200 mb-2 block">Imagem Gerada!</Label>
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="max-w-full max-h-64 object-contain rounded-lg mx-auto mb-2"
                />
                <Button
                  size="sm"
                  onClick={() => downloadImage(generatedImage, `inteligencia-fotos-${Date.now()}.png`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Imagem
                </Button>
              </div>
            )}

            {/* Generate Button */}
            {!generatedImage && (
              <Button
                onClick={handleGenerate}
                disabled={generating || !uploadedImage || cooldownSeconds > 0}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : cooldownSeconds > 0 ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aguarde {cooldownSeconds}s
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Imagem
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InteligenciaFotosDashboard;
