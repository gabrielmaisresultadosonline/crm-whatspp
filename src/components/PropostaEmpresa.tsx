import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, FileText, Upload, Download, Loader2, X, Eye, Sparkles, Target, Users, Zap, CheckCircle2, ShieldCheck, Palette, Package, ZoomIn, Maximize2, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface PropostaEmpresaProps {
  onBack: () => void;
}

interface PropostaData {
  minhaEmpresa: string;
  empresaDestino: string;
  valorServico: string;
  incluirValor: boolean;
  incluirCriativos: boolean;
  quantidadeCriativos: string;
  incluirConfiguracao: boolean;
  corPrincipal: string;
  corSecundaria: string;
  logoUrl: string | null;
  fontSizeBase: number;
  periodoGarantia: string;
}

const defaultData: PropostaData = {
  minhaEmpresa: '',
  empresaDestino: '',
  valorServico: '497,00',
  incluirValor: true,
  incluirCriativos: false,
  quantidadeCriativos: '12',
  incluirConfiguracao: false,
  corPrincipal: '#00d4aa',
  corSecundaria: '#0f0f1a',
  logoUrl: null,
  fontSizeBase: 16,
  periodoGarantia: '7',
};

export const PropostaEmpresa: React.FC<PropostaEmpresaProps> = ({ onBack }) => {
  const [data, setData] = useState<PropostaData>(defaultData);
  const [generating, setGenerating] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasPage2Ref = useRef<HTMLCanvasElement>(null);
  const canvasPage3Ref = useRef<HTMLCanvasElement>(null);
  const canvasPage4Ref = useRef<HTMLCanvasElement>(null);
  const canvasPage5Ref = useRef<HTMLCanvasElement>(null);

  const update = (field: keyof PropostaData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const drawInstagramIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = size / 10;
    const radius = size / 4;
    ctx.beginPath();
    ctx.roundRect(x - size / 2, y - size / 2, size, size, radius);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, size / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size / 4, y - size / 4, size / 12, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawCanvasIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x - 1, y + 2);
    ctx.lineTo(x + 3, y - 2);
    ctx.stroke();
  };

  const drawDecorativeElements = (ctx: CanvasRenderingContext2D, W: number, H: number, color: string) => {
    ctx.save();
    
    // Background Grid
    ctx.globalAlpha = 0.03;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, H);
      ctx.stroke();
    }
    for (let i = 0; i < H; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(W, i);
      ctx.stroke();
    }

    // Top Right: Result Graph (Lines)
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W - 180, 100);
    ctx.lineTo(W - 140, 80);
    ctx.lineTo(W - 110, 90);
    ctx.lineTo(W - 60, 40);
    ctx.stroke();
    
    // Points on graph
    [ [W - 180, 100], [W - 140, 80], [W - 110, 90], [W - 60, 40] ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Bottom Left: Growth Bar Chart
    ctx.globalAlpha = 0.12;
    const bars = [30, 50, 40, 70, 60, 90];
    bars.forEach((h, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(40 + (i * 25), H - 150, 15, -h);
    });

    // Middle/Floating: People Flow Icons (Simplified Silhouettes)
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 4; i++) {
      const x = W - 100 - (i * 40);
      const y = H - 200 + (i * 20);
      // Head
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.beginPath();
      ctx.moveTo(x - 10, y + 15);
      ctx.quadraticCurveTo(x, y + 5, x + 10, y + 15);
      ctx.lineTo(x + 10, y + 25);
      ctx.lineTo(x - 10, y + 25);
      ctx.closePath();
      ctx.fill();
    }

    // Modern Geometric Accents
    ctx.globalAlpha = 0.05;
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 50, 100, 100);
    ctx.beginPath();
    ctx.arc(W - 50, H - 50, 80, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  };

  const renderPreview = async () => {
    if (!canvasRef.current || !canvasPage2Ref.current || !canvasPage3Ref.current || !canvasPage4Ref.current) return;

    const renderPage = async (canvas: HTMLCanvasElement, pageNum: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = 600;
      const H = 848;
      canvas.width = W;
      canvas.height = H;

      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeightMultiplier = 1.3, center = false) => {
        const words = text.split(' ');
        let line = '';
        const lines = [];
        
        for(let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          let metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
          } else { line = testLine; }
        }
        lines.push(line.trim());

        const actualLineHeight = data.fontSizeBase * lineHeightMultiplier;
        lines.forEach((l, i) => {
          let drawX = center ? W/2 : x;
          ctx.textAlign = center ? 'center' : 'left';
          ctx.fillText(l, drawX, y + (i * actualLineHeight));
        });
        
        return y + (lines.length * actualLineHeight);
      };

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      
      drawDecorativeElements(ctx, W, H, data.corPrincipal);


      const headerGrad = ctx.createLinearGradient(0, 0, 0, pageNum === 1 ? 300 : 80);
      headerGrad.addColorStop(0, data.corPrincipal);
      headerGrad.addColorStop(1, data.corSecundaria);

      if (pageNum === 1) {
        ctx.fillStyle = headerGrad;
        ctx.fillRect(0, 0, W, 300);

        if (logoPreview) {
          try {
            const img = new Image();
            img.src = logoPreview;
            await new Promise((resolve) => { img.onload = resolve; });
            const ratio = img.width / img.height;
            const h = 80;
            const w = h * ratio;
            ctx.drawImage(img, (W-w)/2, 350, w, h);
          } catch (e) {}
        } else {
          drawInstagramIcon(ctx, W/2, 380, 60, data.corPrincipal);
        }

        ctx.fillStyle = data.corPrincipal;
        ctx.font = `bold ${data.fontSizeBase * 2.2}px Arial`;
        let curY = wrapText('PROPOSTA ESTRATÉGICA', W/2, 500, W - 100, 1.2, true);

        ctx.beginPath();
        ctx.strokeStyle = data.corPrincipal;
        ctx.lineWidth = 3;
        ctx.moveTo(W/2 - 60, curY + 10);
        ctx.lineTo(W/2 + 60, curY + 10);
        ctx.stroke();

        ctx.fillStyle = '#1a1a1a';
        ctx.font = `bold ${data.fontSizeBase * 1.3}px Arial`;
        curY = wrapText(`EXCLUSIVA PARA: ${data.empresaDestino.toUpperCase() || 'SUA EMPRESA'}`, W/2, curY + 25, W - 60, 1.3, true);

        ctx.fillStyle = '#666666';
        ctx.font = `${data.fontSizeBase * 0.9}px Arial`;
        wrapText('FOCO EM VENDAS, ENGAJAMENTO E CRESCIMENTO ORGÂNICO', W/2, curY + 10, W - 80, 1.2, true);

        const footerGrad = ctx.createLinearGradient(0, H-100, 0, H);
        footerGrad.addColorStop(0, data.corPrincipal);
        footerGrad.addColorStop(1, data.corSecundaria);
        ctx.fillStyle = footerGrad;
        ctx.fillRect(0, H-100, W, 100);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${data.fontSizeBase * 1.2}px Arial`;
        ctx.fillText(data.minhaEmpresa.toUpperCase() || 'MINHA MARCA', W/2, H-40);

      } else {
        ctx.fillStyle = headerGrad;
        ctx.fillRect(0, 0, W, 80);
        ctx.textAlign = 'left';

        if (pageNum === 2) {
          ctx.fillStyle = data.corPrincipal;
          ctx.font = `bold ${data.fontSizeBase * 1.8}px Arial`;
          wrapText('A GRANDE OPORTUNIDADE', 50, 150, 500);
          
          ctx.fillStyle = '#1a1a1a';
          ctx.font = `bold ${data.fontSizeBase * 1.2}px Arial`;
          wrapText('A Importância de uma Presença Digital Dominante', 50, 190, 500);

          ctx.fillStyle = '#444444';
          ctx.font = `${data.fontSizeBase * 1.1}px Arial`;
          let y = wrapText("Hoje, estar no Instagram não é uma opção, é a vitrine principal do seu negócio. Não ter um perfil profissional, ativo e com alcance constante significa perder clientes para o concorrente a cada minuto.", 50, 225, 500);

          ctx.fillStyle = data.corPrincipal;
          ctx.font = `bold ${data.fontSizeBase * 1.4}px Arial`;
          y = wrapText('POR QUE NOSSA ESTRATÉGIA É 10X MAIS ASSERTIVA?', 50, y + 20, 500);
          y += 25;

          ctx.fillStyle = '#444444';
          ctx.font = `${data.fontSizeBase * 1.1}px Arial`;
          y = wrapText("Diferente de anúncios que 'tentam' adivinhar quem é seu público, nós vamos direto na fonte: o público dos seus concorrentes. Através de nossa metodologia, buscamos um público extremamente nichado e qualificado que já consome o que você vende. Nossa prospecção humana agrega valor real à sua marca.", 50, y, 500);
          
          drawInstagramIcon(ctx, 520, 720, 80, data.corPrincipal + '33');
        }

        if (pageNum === 3) {
          ctx.fillStyle = data.corPrincipal;
          ctx.font = `bold ${data.fontSizeBase * 1.8}px Arial`;
          wrapText('NOSSO MÉTODO DE ESCALA', 50, 150, 500);
          
          ctx.fillStyle = '#1a1a1a';
          ctx.font = `bold ${data.fontSizeBase * 1.2}px Arial`;
          wrapText('Fases da Estratégia de Crescimento', 50, 190, 500);

          let y = 230;
          const fases = [
            { t: '1. Atração Qualificada', d: 'Busca ativa no público de concorrentes e perfis similares ao seu nicho.' },
            { t: '2. Engajamento Real', d: 'Interações manuais que despertam a curiosidade e o desejo de conhecer sua marca.' },
            { t: '3. Conversão & Retenção', d: 'Transformamos seguidores em clientes através de uma vitrine otimizada.' }
          ];

          fases.forEach((f) => {
            drawCanvasIcon(ctx, 60, y + 5, data.corPrincipal);
            ctx.fillStyle = '#1a1a1a';
            ctx.font = `bold ${data.fontSizeBase * 1.1}px Arial`;
            ctx.fillText(f.t, 80, y + 10);
            y += 25;
            ctx.fillStyle = '#666666';
            ctx.font = `${data.fontSizeBase * 1}px Arial`;
            y = wrapText(f.d, 80, y, 450);
            y += 20;
          });
        }

        if (pageNum === 5 && (data.incluirCriativos || data.incluirConfiguracao)) {
          ctx.fillStyle = data.corPrincipal;
          ctx.font = `bold ${data.fontSizeBase * 1.8}px Arial`;
          wrapText('CRIATIVOS & OTIMIZAÇÃO', 50, 150, 500);
          
          ctx.fillStyle = '#1a1a1a';
          ctx.font = `bold ${data.fontSizeBase * 1.2}px Arial`;
          wrapText('Turbinando seus Resultados Visuais', 50, 190, 500);

          let y = 230;
          if (data.incluirConfiguracao) {
            ctx.fillStyle = '#1a1a1a';
            ctx.font = `bold ${data.fontSizeBase * 1.1}px Arial`;
            y = wrapText('CONFIGURAÇÃO E OTIMIZAÇÃO', 50, y, 500);
            y += 10;
            ctx.fillStyle = '#666666';
            ctx.font = `${data.fontSizeBase * 1}px Arial`;
            y = wrapText('Analisamos sua Bio, destaques e link para garantir que cada novo visitante entenda sua oferta em segundos.', 50, y, 500);
            y += 40;
          }

          if (data.incluirCriativos) {
            ctx.fillStyle = '#1a1a1a';
            ctx.font = `bold ${data.fontSizeBase * 1.1}px Arial`;
            y = wrapText(`${data.quantidadeCriativos} CRIATIVOS ESTRATÉGICOS`, 50, y, 500);
            y += 10;
            ctx.fillStyle = '#666666';
            ctx.font = `${data.fontSizeBase * 1}px Arial`;
            y = wrapText('Produzimos artes focadas em conversão (vendas) para que seu feed se torne uma máquina de vendas automática.', 50, y, 500);
          }
        }

        if (pageNum === 4) {
          ctx.fillStyle = data.corPrincipal;
          ctx.font = `bold ${data.fontSizeBase * 1.8}px Arial`;
          wrapText('INVESTIMENTO & GARANTIA', 50, 150, 500);
          
          let y = 200;
          if (data.incluirConfiguracao || data.incluirCriativos) {
            ctx.fillStyle = '#f8f9fa';
            ctx.beginPath();
            ctx.roundRect(50, y, 500, 140, 15);
            ctx.fill();
            ctx.strokeStyle = '#e9ecef';
            ctx.stroke();

            ctx.fillStyle = '#1a1a1a';
            ctx.font = `bold ${data.fontSizeBase * 1.2}px Arial`;
            const wrapTextShort = (text: string, x: number, y: number, maxWidth: number) => {
              return wrapText(text, x, y, maxWidth, 1.3, false);
            };

            wrapTextShort('EXTRAS INCLUSOS NA PROPOSTA:', 70, y + 40, 460);
            
            y += 65;
            if (data.incluirConfiguracao) {
              ctx.fillStyle = '#444444';
              ctx.font = `${data.fontSizeBase * 1}px Arial`;
              y = wrapTextShort('• Configuração Profissional de Redes & Otimização de Perfil', 70, y, 460);
              y += 5;
            }
            if (data.incluirCriativos) {
              ctx.fillStyle = '#444444';
              ctx.font = `${data.fontSizeBase * 1}px Arial`;
              y = wrapTextShort(`• Criação de ${data.quantidadeCriativos} Criativos Estratégicos Mensais`, 70, y, 460);
              y += 5;
            }
            y += 30;
          }

          if (data.incluirValor) {
            ctx.fillStyle = data.corPrincipal;
            // Medir o texto para box dinâmico
            const investText = `INVESTIMENTO: R$ ${data.valorServico}`;
            const subText = "VALOR MENSAL PARA 30 DIAS DE RESULTADOS";
            
            ctx.font = `bold ${data.fontSizeBase * 1.8}px Arial`;
            const investLines = [];
            const words = investText.split(' ');
            let line = '';
            for(let n = 0; n < words.length; n++) {
              let testLine = line + words[n] + ' ';
              if (ctx.measureText(testLine).width > 440 && n > 0) {
                investLines.push(line.trim());
                line = words[n] + ' ';
              } else { line = testLine; }
            }
            investLines.push(line.trim());
            
            ctx.font = `bold ${data.fontSizeBase * 1.25}px Arial`;
            const subLines = [];
            const wordsSub = subText.split(' ');
            line = '';
            for(let n = 0; n < wordsSub.length; n++) {
              let testLine = line + wordsSub[n] + ' ';
              if (ctx.measureText(testLine).width > 440 && n > 0) {
                subLines.push(line.trim());
                line = wordsSub[n] + ' ';
              } else { line = testLine; }
            }
            subLines.push(line.trim());

            const boxHeight = (investLines.length * data.fontSizeBase * 2.2) + (subLines.length * data.fontSizeBase * 1.5) + 40;
            
            ctx.beginPath();
            ctx.roundRect(50, y, 500, boxHeight, 15);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            let innerY = y + 45;
            ctx.font = `bold ${data.fontSizeBase * 1.8}px Arial`;
            investLines.forEach((l, i) => {
              ctx.fillText(l, 80, innerY + (i * data.fontSizeBase * 2));
            });
            
            innerY += (investLines.length * data.fontSizeBase * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.font = `bold ${data.fontSizeBase * 1.25}px Arial`;
            subLines.forEach((l, i) => {
              ctx.fillText(l, 80, innerY + (i * data.fontSizeBase * 1.4));
            });
            
            y += boxHeight + 30;
          } else {
            y += 50;
          }

          ctx.fillStyle = '#1a1a1a';
          ctx.font = `bold ${data.fontSizeBase * 1.4}px Arial`;
          y = wrapText(`GARANTIA INCONDICIONAL DE ${data.periodoGarantia} DIAS`, 50, y, 500);
          y += 10;
          ctx.fillStyle = '#666666';
          ctx.font = `${data.fontSizeBase * 1.1}px Arial`;
          y = wrapText(`Experimente nossa metodologia por ${data.periodoGarantia} dias. Se você não sentir que estamos atraindo o público certo e gerando valor, devolvemos seu dinheiro.`, 50, y, 500);
        }
      }
    };

    if (canvasRef.current) await renderPage(canvasRef.current, 1);
    if (canvasPage2Ref.current) await renderPage(canvasPage2Ref.current, 2);
    if (canvasPage3Ref.current) await renderPage(canvasPage3Ref.current, 3);
    
    // Se incluir extras, renderizamos eles antes do investimento na prévia
    if (data.incluirCriativos || data.incluirConfiguracao) {
      if (canvasPage5Ref.current) await renderPage(canvasPage5Ref.current, 5);
      if (canvasPage4Ref.current) await renderPage(canvasPage4Ref.current, 4);
    } else {
      if (canvasPage4Ref.current) await renderPage(canvasPage4Ref.current, 4);
    }
  };

  useEffect(() => {
    const timer = setTimeout(renderPreview, 100);
    return () => clearTimeout(timer);
  }, [data, logoPreview]);


  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setData(prev => ({ ...prev, logoUrl: result }));
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setData(prev => ({ ...prev, logoUrl: null }));
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const generatePDF = async () => {
    if (!data.minhaEmpresa || !data.empresaDestino) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      
      const rgb = hexToRgb(data.corPrincipal);
      const secondaryRgb = hexToRgb(data.corSecundaria);

      const mixWithWhite = (val: number, opacity: number) => Math.floor(val * opacity + 255 * (1 - opacity));

      const drawPDFInstagramIcon = (x: number, y: number, size: number, r: number, g: number, b: number) => {
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(size / 10);
        const radius = size / 4;
        doc.roundedRect(x - size / 2, y - size / 2, size, size, radius, radius, 'S');
        doc.circle(x, y, size / 4, 'S');
        doc.setFillColor(r, g, b);
        doc.circle(x + size / 4, y - size / 4, size / 12, 'F');
      };

      const drawPDFDecorativeElements = (pageWidth: number, pageHeight: number) => {
        const opacity = 0.2; // Reduzi opacidade para ser mais sutil
        const r = mixWithWhite(rgb.r, opacity);
        const g = mixWithWhite(rgb.g, opacity);
        const b = mixWithWhite(rgb.b, opacity);
        
        doc.setDrawColor(r, g, b);
        doc.setFillColor(r, g, b);
        doc.setLineWidth(0.1);

        // Background Grid - subtle
        doc.setDrawColor(r, g, b, 0.2);
        for (let i = 0; i < pageWidth; i += 20) {
          doc.line(i, 0, i, pageHeight);
        }
        for (let i = 0; i < pageHeight; i += 20) {
          doc.line(0, i, pageWidth, i);
        }

        // Top Right: Result Graph (Lines) - Fixed position to avoid headers
        doc.setLineWidth(0.4);
        const gx = pageWidth - 50;
        const gy = 55; // Lowered to avoid header gradient
        doc.line(gx, gy, gx + 8, gy - 6);
        doc.line(gx + 8, gy - 6, gx + 16, gy - 2);
        doc.line(gx + 16, gy - 2, gx + 28, gy - 12);
        
        doc.circle(gx, gy, 0.8, 'F');
        doc.circle(gx + 8, gy - 6, 0.8, 'F');
        doc.circle(gx + 16, gy - 2, 0.8, 'F');
        doc.circle(gx + 28, gy - 12, 0.8, 'F');

        // Bottom Left: Growth Bar Chart - More side-aligned
        const barX = 10;
        const barY = pageHeight - 45;
        const bars = [8, 12, 10, 20, 15, 25];
        bars.forEach((h, i) => {
          doc.rect(barX + (i * 6), barY, 4, -h, 'F');
        });

        // People Icons (Silhouettes) - Strategic placement
        const pSize = 3;
        for (let i = 0; i < 3; i++) {
          const px = pageWidth - 35 - (i * 12);
          const py = pageHeight - 65;
          // Head
          doc.circle(px, py, 1.5, 'F');
          // Body
          doc.setLineWidth(0.8);
          doc.line(px - 2.5, py + 4, px + 2.5, py + 4);
          doc.line(px - 2.5, py + 4, px - 2.5, py + 8);
          doc.line(px + 2.5, py + 4, px + 2.5, py + 8);
          doc.line(px - 2.5, py + 8, px + 2.5, py + 8);
        }

        // Small Instagram Icon Decoration (Bottom Right corner area)
        drawPDFInstagramIcon(pageWidth - 20, pageHeight - 45, 10, r, g, b);
      };


      const drawGradientRect = (x: number, y: number, w: number, h: number) => {

        for (let i = 0; i < h; i += 0.5) {
          const ratio = i / h;
          const r = Math.floor(rgb.r * (1 - ratio) + secondaryRgb.r * ratio);
          const g = Math.floor(rgb.g * (1 - ratio) + secondaryRgb.g * ratio);
          const b = Math.floor(rgb.b * (1 - ratio) + secondaryRgb.b * ratio);
          doc.setFillColor(r, g, b);
          doc.rect(x, y + i, w, 0.6, 'F');
        }
      };

      const drawIcon = (x: number, y: number) => {
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.circle(x, y, 3, 'F');
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.4);
        doc.line(x-1.5, y, x-0.5, y+1);
        doc.line(x-0.5, y+1, x+1.5, y-1);
      };

      drawGradientRect(0, 0, pageWidth, 90);
      drawPDFDecorativeElements(pageWidth, pageHeight);
      doc.setDrawColor(255, 255, 255, 0.1);

      for(let i=0; i<pageWidth; i+=10) doc.line(i, 0, i+20, 90);

      let yPos = 110;
      if (data.logoUrl) {
        try {
          const img = new Image();
          img.src = data.logoUrl;
          await new Promise((resolve) => { img.onload = resolve; });
          const ratio = img.width / img.height;
          const logoH = 35;
          const logoW = logoH * ratio;
          doc.addImage(data.logoUrl, 'PNG', (pageWidth - logoW) / 2, yPos, logoW, logoH);
          yPos += logoH + 25;
        } catch (e) {
          drawPDFInstagramIcon(pageWidth / 2, yPos + 15, 20, rgb.r, rgb.g, rgb.b);
          yPos += 45;
        }
      } else {
        drawPDFInstagramIcon(pageWidth / 2, yPos + 15, 20, rgb.r, rgb.g, rgb.b);
        yPos += 45;
      }


      // Page 1 Decorative Graphics around Title
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 30, yPos - 10, pageWidth / 2 + 30, yPos - 10);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(data.fontSizeBase * 2.2);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text('PROPOSTA ESTRATÉGICA', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
      
      // Floating Vector Icon (Result Chart) near title
      const iconX = pageWidth - 35;
      const iconY = yPos - 25; // Subi o ícone para não sobrepor o texto da empresa
      doc.setDrawColor(rgb.r, rgb.g, rgb.b, 0.4);
      doc.setLineWidth(0.6);
      doc.line(iconX, iconY, iconX + 4, iconY - 4);
      doc.line(iconX + 4, iconY - 4, iconX + 8, iconY - 1);
      doc.line(iconX + 8, iconY - 1, iconX + 12, iconY - 8);
      doc.circle(iconX + 12, iconY - 8, 0.8, 'F');

      doc.setFontSize(data.fontSizeBase * 1.5);
      doc.setTextColor(30, 30, 30);
      const destText = `EXCLUSIVA PARA: ${data.empresaDestino.toUpperCase()}`;
      const destLines = doc.splitTextToSize(destText, contentWidth);
      doc.text(destLines, pageWidth / 2, yPos, { align: 'center' });
      yPos += (destLines.length * 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(data.fontSizeBase * 0.9);
      doc.setTextColor(100, 100, 100);
      const subTitleText = 'FOCO EM VENDAS, ENGAJAMENTO E CRESCIMENTO ORGÂNICO';
      const subTitleLines = doc.splitTextToSize(subTitleText, contentWidth);
      doc.text(subTitleLines, pageWidth / 2, yPos, { align: 'center' });

      drawGradientRect(0, pageHeight - 35, pageWidth, 35);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(data.fontSizeBase * 1.2);
      doc.text(data.minhaEmpresa.toUpperCase(), pageWidth / 2, pageHeight - 15, { align: 'center' });

      doc.addPage();
      drawPDFDecorativeElements(pageWidth, pageHeight);
      drawGradientRect(0, 0, pageWidth, 25);

      yPos = 45;
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.setFontSize(data.fontSizeBase * 1.8);
      doc.setFont('helvetica', 'bold');
      const title1Text = 'A GRANDE OPORTUNIDADE';
      const title1Lines = doc.splitTextToSize(title1Text, contentWidth - 20);
      doc.text(title1Lines, margin, yPos);
      
      // Icon for Page 2
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.setLineWidth(0.5);
      doc.rect(margin + 5, yPos + 2, 10, 10);
      doc.line(margin + 5, yPos + 12, margin + 15, yPos + 2); // Trend up line in a box

      yPos += (title1Lines.length * 10) + 5;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(data.fontSizeBase * 1.2);
      doc.setTextColor(30, 30, 30);
      const subTitle1Text = 'A Importância de uma Presença Digital Dominante';
      const subTitle1Lines = doc.splitTextToSize(subTitle1Text, contentWidth);
      doc.text(subTitle1Lines, margin, yPos);
      yPos += (subTitle1Lines.length * 8) + 2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(data.fontSizeBase * 1);
      doc.setTextColor(60, 60, 60);
      const probText = "Hoje, estar no Instagram não é uma opção, é a vitrine principal do seu negócio. Não ter um perfil profissional, ativo e com alcance constante significa perder clientes para o concorrente a cada minuto. Nossa proposta é entregar o serviço de mais vendas, mais engajamento e autoridade, agregando valor real ao seu posicionamento digital.";
      const probLines = doc.splitTextToSize(probText, contentWidth);
      doc.text(probLines, margin, yPos);
      yPos += probLines.length * 7 + 15;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      const assertText = 'ESTRATÉGIA 10X MAIS ASSERTIVA';
      const assertLines = doc.splitTextToSize(assertText, contentWidth);
      doc.text(assertLines, margin, yPos);
      yPos += (assertLines.length * 8) + 2;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const solText = "Diferente de anúncios que 'tentam' adivinhar quem é seu público, nós vamos direto na fonte: o público dos seus concorrentes. Através de nossa metodologia, buscamos um público extremamente nichado e qualificado que já consome o que você vende, capturando a atenção de forma ética e agregando valor à sua marca.";
      const solLines = doc.splitTextToSize(solText, contentWidth);
      doc.text(solLines, margin, yPos);

      doc.addPage();
      drawPDFDecorativeElements(pageWidth, pageHeight);
      drawGradientRect(0, 0, pageWidth, 25);

      yPos = 45;
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.setFontSize(data.fontSizeBase * 1.8);
      doc.setFont('helvetica', 'bold');
      doc.text('METODOLOGIA NA PRÁTICA', margin, yPos);
      yPos += 20;

      const steps = [
        { t: "1. MONITORAMENTO DEDICADO (10H/DIA)", d: "Nossa equipe passa mais de 10 horas por dia focada no seu perfil, realizando prospecção direta e humana. Não é automação barata, é trabalho estratégico dedicado." },
        { t: "2. CONEXÕES REAIS E INTERAÇÃO EM MASSA", d: "Buscamos o público dos seus concorrentes e interagimos de forma orgânica, criando conexões reais que se transformam em seguidores qualificados e clientes." },
        { t: "3. PROSPECÇÃO DIRETA E CONVERSÃO", d: "Após a interação, enviamos mensagens com sua promoção, desconto ou link de checkout para quem realmente tem interesse no seu nicho." }
      ];

      steps.forEach(step => {
        drawIcon(margin + 3, yPos - 1);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(data.fontSizeBase * 1);
        doc.setTextColor(30, 30, 30);
        const tLines = doc.splitTextToSize(step.t, contentWidth - 15);
        doc.text(tLines, margin + 10, yPos);
        yPos += (tLines.length * 6) + 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(data.fontSizeBase * 0.95);
        doc.setTextColor(70, 70, 70);
        const dLines = doc.splitTextToSize(step.d, contentWidth - 15);
        doc.text(dLines, margin + 10, yPos);
        yPos += dLines.length * 6 + 12;
      });

      doc.setFillColor(rgb.r, rgb.g, rgb.b, 0.05);
      doc.rect(margin, yPos, contentWidth, 30, 'F');
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(data.fontSizeBase * 0.9);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text("ESTRUTURA FOCO EM PÚBLICO 3X MAIS ASSERTIVO E NICHADO.", margin + 5, yPos + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(data.fontSizeBase * 0.8);
      doc.text("Resultados consistentes respeitando as políticas do Instagram.", margin + 5, yPos + 20);

      if (data.incluirConfiguracao || data.incluirCriativos) {
        doc.addPage();
        drawPDFDecorativeElements(pageWidth, pageHeight);
        drawGradientRect(0, 0, pageWidth, 25);

        yPos = 45;
        doc.setTextColor(rgb.r, rgb.g, rgb.b);
        doc.setFontSize(data.fontSizeBase * 1.8);
        doc.setFont('helvetica', 'bold');
        doc.text('CRIATIVOS & OTIMIZAÇÃO', margin, yPos);
        yPos += 15;
        
        doc.setFontSize(data.fontSizeBase * 1.2);
        doc.setTextColor(30, 30, 30);
        doc.text('Design Estratégico & Autoridade Visual', margin, yPos);
        yPos += 15;

        if (data.incluirCriativos) {
          drawIcon(margin + 3, yPos - 1);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(data.fontSizeBase * 1);
          const tText = `Pack de ${data.quantidadeCriativos} Criativos de Alta Conversão`;
          const tLines = doc.splitTextToSize(tText, contentWidth - 15);
          doc.text(tLines, margin + 10, yPos);
          yPos += (tLines.length * 6) + 2;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(data.fontSizeBase * 0.95);
          doc.setTextColor(70, 70, 70);
          const cLines = doc.splitTextToSize("Desenvolvemos artes e vídeos focados em chamar a atenção do público frio e converter em seguidores/leads. Design moderno e profissional que gera confiança imediata.", contentWidth - 15);
          doc.text(cLines, margin + 10, yPos);
          yPos += cLines.length * 6 + 12;
        }

        if (data.incluirConfiguracao) {
          drawIcon(margin + 3, yPos - 1);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(data.fontSizeBase * 1);
          doc.setTextColor(30, 30, 30);
          const bTitle = 'Otimização de Bio e Perfil (SEO Instagram)';
          const btLines = doc.splitTextToSize(bTitle, contentWidth - 15);
          doc.text(btLines, margin + 10, yPos);
          yPos += (btLines.length * 6) + 2;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(data.fontSizeBase * 0.95);
          doc.setTextColor(70, 70, 70);
          const bLines = doc.splitTextToSize("Ajustamos sua bio, foto de perfil e destaques para que seu Instagram se torne uma máquina de vendas. Aplicamos técnicas de SEO para você ser encontrado mais facilmente.", contentWidth - 15);
          doc.text(bLines, margin + 10, yPos);
          yPos += bLines.length * 6 + 12;
        }

        doc.setFillColor(rgb.r, rgb.g, rgb.b, 0.05);
        doc.rect(margin, yPos, contentWidth, 30, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(data.fontSizeBase * 0.9);
        doc.setTextColor(rgb.r, rgb.g, rgb.b);
        doc.text("POR QUE ESSA ETAPA É CRUCIAL?", margin + 5, yPos + 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(data.fontSizeBase * 0.8);
        doc.text("Garantimos que a primeira impressão do seu cliente seja de uma empresa líder de mercado.", margin + 5, yPos + 20);
        yPos += 45;
      }

      doc.addPage();
      drawPDFDecorativeElements(pageWidth, pageHeight);
      drawGradientRect(0, 0, pageWidth, 25);

      yPos = 45;
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.setFontSize(data.fontSizeBase * 1.8);
      doc.setFont('helvetica', 'bold');
      doc.text('SOLUÇÃO E INVESTIMENTO', margin, yPos);
      yPos += 20;

      if (data.incluirConfiguracao || data.incluirCriativos) {
        doc.setFillColor(248, 249, 250);
        
        let extraY = yPos + 10;
        const extras = [];
        if (data.incluirConfiguracao) extras.push('• Otimização e Configuração de Redes Sociais');
        if (data.incluirCriativos) extras.push(`• Criação de ${data.quantidadeCriativos} Criativos Estratégicos Mensais`);
        
        let extrasTotalHeight = 15;
        const processedExtras = extras.map(e => {
          const lines = doc.splitTextToSize(e, contentWidth - 20);
          extrasTotalHeight += (lines.length * 6);
          return lines;
        });

        doc.roundedRect(margin, yPos, contentWidth, extrasTotalHeight + 10, 3, 3, 'F');
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(data.fontSizeBase * 1.1);
        doc.text('EXTRAS INCLUSOS NA PROPOSTA:', margin + 5, yPos + 10);
        
        doc.setFontSize(data.fontSizeBase * 0.9);
        let currentExtraY = yPos + 18;
        processedExtras.forEach(lines => {
          doc.text(lines, margin + 10, currentExtraY);
          currentExtraY += (lines.length * 6);
        });
        
        yPos += extrasTotalHeight + 20;
      }

      if (data.incluirValor) {
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        const investText = `INVESTIMENTO: R$ ${data.valorServico}`;
        const investLines = doc.splitTextToSize(investText, contentWidth - 20);
        const subText = "VALOR MENSAL PARA 30 DIAS DE RESULTADOS";
        const subLines = doc.splitTextToSize(subText, contentWidth - 20);
        
        const boxHeight = (investLines.length * 8) + (subLines.length * 6) + 15;
        doc.roundedRect(margin, yPos, contentWidth, boxHeight, 5, 5, 'F');
        doc.setTextColor(255, 255, 255);
        
        doc.setFontSize(data.fontSizeBase * 1.5);
        doc.setFont('helvetica', 'bold');
        doc.text(investLines, margin + 10, yPos + 12);
        
        const subLineY = yPos + 12 + (investLines.length * 8);
        doc.setFontSize(data.fontSizeBase * 1);
        doc.text(subLines, margin + 10, subLineY);
        yPos += boxHeight + 20;
      } else {
        yPos += 20;
      }

      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.setFontSize(data.fontSizeBase * 1.4);
      const garTitle = `GARANTIA INCONDICIONAL DE ${data.periodoGarantia} DIAS`;
      const garTitleLines = doc.splitTextToSize(garTitle, contentWidth);
      doc.text(garTitleLines, margin, yPos);
      yPos += (garTitleLines.length * 8) + 4;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(data.fontSizeBase * 1);
      doc.setTextColor(60, 60, 60);
      const garText = `Acreditamos tanto em nossa metodologia que oferecemos ${data.periodoGarantia} dias de garantia. Se não sentir o potencial de escala na primeira semana, devolvemos seu investimento integralmente.`;
      const garLines = doc.splitTextToSize(garText, contentWidth);
      doc.text(garLines, margin, yPos);
      yPos += (garLines.length * 7) + 20;


      doc.setFont('helvetica', 'bold');
      doc.setFontSize(data.fontSizeBase * 1.6);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text("VAMOS COMEÇAR?", pageWidth / 2, yPos, { align: 'center' });

      const fileName = `Proposta_${data.empresaDestino.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      toast.success('Proposta gerada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <header className="sticky top-0 z-40 bg-[#050508]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="font-bold">Gerador Premium</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="space-y-6">
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Palette className="text-emerald-400" /> Identidade Visual</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <input type="color" value={data.corPrincipal} onChange={e => update('corPrincipal', e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent" />
                    <Input value={data.corPrincipal} onChange={e => update('corPrincipal', e.target.value)} className="bg-white/5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor de Fundo (Degradê)</Label>
                  <div className="flex gap-2">
                    <input type="color" value={data.corSecundaria} onChange={e => update('corSecundaria', e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent" />
                    <Input value={data.corSecundaria} onChange={e => update('corSecundaria', e.target.value)} className="bg-white/5" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sua Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative group">
                      <img src={logoPreview} className="h-16 w-16 object-contain rounded bg-white/5" alt="Logo" />
                      <button onClick={removeLogo} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X size={12} /></button>
                    </div>
                  ) : (
                    <button onClick={() => logoInputRef.current?.click()} className="h-16 w-16 rounded border-2 border-dashed border-white/10 flex items-center justify-center hover:border-emerald-500/40 transition-colors">
                      <Upload size={20} className="text-gray-500" />
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <p className="text-xs text-gray-500 italic">PNG ou JPG recomendado.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Type size={16}/> Tamanho da Fonte Base</Label>
                <input type="range" min="12" max="24" step="1" value={data.fontSizeBase} onChange={e => update('fontSizeBase', parseInt(e.target.value))} className="w-full accent-emerald-500" />
                <div className="flex justify-between text-[10px] text-gray-500"><span>Pequeno</span><span>Padrão (16)</span><span>Grande</span></div>
              </div>
            </section>

            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Target className="text-blue-400" /> Dados do Projeto</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sua Empresa / Marca</Label>
                  <Input value={data.minhaEmpresa} onChange={e => update('minhaEmpresa', e.target.value)} placeholder="Ex: Agência Resultados" className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Label>Empresa do Cliente (Destino)</Label>
                  <Input value={data.empresaDestino} onChange={e => update('empresaDestino', e.target.value)} placeholder="Ex: Loja do João" className="bg-white/5" />
                </div>
              </div>
            </section>

            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Package className="text-purple-400" /> Oferta & Valor</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="space-y-0.5">
                    <Label>Exibir Valor no PDF</Label>
                  </div>
                  <Switch checked={data.incluirValor} onCheckedChange={v => update('incluirValor', v)} />
                </div>

                {data.incluirValor && (
                  <div className="space-y-2">
                    <Label>Valor do Serviço (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                      <Input value={data.valorServico} onChange={e => update('valorServico', e.target.value)} placeholder="497,00" className="bg-white/5 pl-10" />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="space-y-0.5">
                    <Label>Entrega de Conteúdo (Criativos)</Label>
                  </div>
                  <Switch checked={data.incluirCriativos} onCheckedChange={v => update('incluirCriativos', v)} />
                </div>

                {data.incluirCriativos && (
                  <div className="space-y-2">
                    <Label>Qtd. de Criativos (mensal)</Label>
                    <Input value={data.quantidadeCriativos} onChange={e => update('quantidadeCriativos', e.target.value)} placeholder="12" className="bg-white/5" />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="space-y-0.5">
                    <Label>Configuração de Redes</Label>
                  </div>
                  <Switch checked={data.incluirConfiguracao} onCheckedChange={v => update('incluirConfiguracao', v)} />
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Dias de Garantia</Label>
                  <Input value={data.periodoGarantia} onChange={e => update('periodoGarantia', e.target.value)} placeholder="7" className="bg-white/5" />
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-3">
              <Button onClick={generatePDF} disabled={generating} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xl rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] group">
                {generating ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Download className="w-6 h-6 mr-2 group-hover:bounce" />}
                GERAR PDF PROFISSIONAL
              </Button>
              
              <Button variant="outline" onClick={() => setShowFullPreview(true)} className="w-full h-16 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-lg rounded-2xl shadow-lg shadow-emerald-500/20 transform hover:-translate-y-0.5 transition-all duration-300">
                <Eye className="mr-2" /> VER PRÉVIA COMPLETA E DETALHADA
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white/[0.03] border border-white/10 p-1.5 rounded-[2rem] shadow-2xl overflow-hidden group">
              <div className="bg-[#12121a] p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                    <Eye size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block leading-none">Prévia em Tempo Real</span>
                    <span className="text-[10px] text-gray-500">{data.incluirCriativos || data.incluirConfiguracao ? '5' : '4'} páginas configuradas</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-900/50 backdrop-blur-sm space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="space-y-8">
                  {[
                    { ref: canvasRef, label: 'PÁGINA 1: CAPA' },
                    { ref: canvasPage2Ref, label: 'PÁGINA 2: O PROBLEMA' },
                    { ref: canvasPage3Ref, label: 'PÁGINA 3: SOLUÇÃO' },
                    ...(data.incluirCriativos || data.incluirConfiguracao ? [{ ref: canvasPage5Ref, label: 'PÁGINA 4: EXTRAS' }] : []),
                    { ref: canvasPage4Ref, label: data.incluirCriativos || data.incluirConfiguracao ? 'PÁGINA 5: INVESTIMENTO' : 'PÁGINA 4: INVESTIMENTO' }
                  ].map((page, idx) => (
                    <div key={idx} className="relative group/page">
                      <canvas ref={page.ref} className="w-full h-auto rounded-lg shadow-2xl border border-white/5 transition-all duration-300" />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white opacity-0 group-hover/page:opacity-100 transition-opacity uppercase">{page.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <ShieldCheck className="text-emerald-400 w-8 h-8 shrink-0" />
              <p className="text-[11px] text-emerald-100/70 leading-relaxed">
                <strong className="text-emerald-400 block mb-0.5">Design de Alta Conversão</strong>
                Sua proposta utiliza gatilhos mentais e uma estrutura visual validada para fechar contratos de alto valor.
              </p>
            </div>
          </div>

        </div>
      </main>

      {showFullPreview && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <button onClick={() => setShowFullPreview(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50">
            <X size={24} />
          </button>
          
          <div className="w-full max-w-4xl h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
            <div className="text-center space-y-2 pt-10">
              <h3 className="text-2xl font-bold text-white">Visualização Completa</h3>
              <p className="text-gray-400">Arraste para ver as páginas da sua proposta estratégica</p>
            </div>
            
            <div className="space-y-12 pb-20 flex flex-col items-center">
              {[
                { ref: canvasRef, title: 'Capa da Proposta' },
                { ref: canvasPage2Ref, title: 'Análise de Mercado' },
                { ref: canvasPage3Ref, title: 'Metodologia de Resultados' },
                ...(data.incluirCriativos || data.incluirConfiguracao ? [{ ref: canvasPage5Ref, title: 'Criativos e Otimização' }] : []),
                { ref: canvasPage4Ref, title: 'Investimento e Garantia' }
              ].map((page, idx) => (
                <div key={idx} className="w-full max-w-[600px] bg-white rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col">
                  <div className="bg-gray-100 py-2 px-4 text-[10px] font-bold text-gray-400 border-b border-gray-200 flex justify-between">
                    <span>PÁGINA {idx + 1}</span>
                    <span>{page.title.toUpperCase()}</span>
                  </div>
                  <canvas 
                    width={600} 
                    height={848} 
                    style={{ width: '100%', height: 'auto' }}
                    ref={(el) => {
                      if (el && page.ref.current) {
                        const ctx = el.getContext('2d');
                        if (ctx) ctx.drawImage(page.ref.current, 0, 0);
                      }
                    }} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};
