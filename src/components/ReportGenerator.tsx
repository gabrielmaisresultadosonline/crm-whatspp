import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoTutorialButton } from '@/components/VideoTutorialButton';
import { ArrowLeft, FileText, Plus, Loader2, Download, Trash2, Edit3, Building2, BarChart3, Calendar, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ReportData {
  companyName: string;
  instagramUsername: string;
  startDate: string;
  alcanceInicial: number;
  alcanceAtual: number;
  visitasInicial: number;
  visitasAtual: number;
  seguidoresInicial: number;
  seguidoresAtual: number;
  mensagensEnviadas: number;
  totalContasAlcancadas: number;
  createdAt: string;
  lastGeneratedAt: string;
}

interface ReportGeneratorProps {
  onBack: () => void;
  mroUsername: string;
}

const calcPercent = (initial: number, current: number): number => {
  if (initial <= 0) return 0;
  return Math.round(((current - initial) / initial) * 100);
};

const formatNumber = (n: number): string => {
  return n.toLocaleString('pt-BR');
};

const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
};

const getMonthRange = (startDate: string): string => {
  if (!startDate) return '';
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date();
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[start.getMonth()]} - ${months[now.getMonth()]} ${now.getFullYear()}`;
};

const loadImageAsBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const ReportGenerator = ({ onBack, mroUsername }: ReportGeneratorProps) => {
  const [reports, setReports] = useState<Record<string, ReportData>>({});
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ReportData | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [newForm, setNewForm] = useState<ReportData>({
    companyName: '', instagramUsername: '',
    startDate: new Date().toISOString().split('T')[0],
    alcanceInicial: 0, alcanceAtual: 0, visitasInicial: 0, visitasAtual: 0,
    seguidoresInicial: 0, seguidoresAtual: 0, mensagensEnviadas: 0, totalContasAlcancadas: 0,
    createdAt: new Date().toISOString(), lastGeneratedAt: '',
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [profilesRes, reportsRes] = await Promise.all([
          supabase.functions.invoke('squarecloud-profile-storage', {
            body: { action: 'load', squarecloud_username: mroUsername }
          }),
          supabase.functions.invoke('report-storage', {
            body: { action: 'load', squarecloud_username: mroUsername }
          }),
        ]);
        if (profilesRes.data?.success) setProfiles(profilesRes.data.profiles || []);
        if (reportsRes.data?.success) setReports(reportsRes.data.reports || {});

        // Load saved logo
        const logoPath = `reports/${mroUsername.toLowerCase()}/logo.png`;
        const { data: logoData } = supabase.storage.from('user-data').getPublicUrl(logoPath);
        if (logoData?.publicUrl) {
          // Check if file exists by trying to fetch
          const testImg = new Image();
          testImg.onload = () => setLogoUrl(logoData.publicUrl);
          testImg.onerror = () => setLogoUrl(null);
          testImg.src = logoData.publicUrl + '?t=' + Date.now();
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [mroUsername]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes('png') && !file.type.includes('image')) {
      toast.error('Envie uma imagem PNG de preferência');
      return;
    }
    setUploadingLogo(true);
    try {
      const logoPath = `reports/${mroUsername.toLowerCase()}/logo.png`;
      const { error } = await supabase.storage.from('user-data').upload(logoPath, file, {
        contentType: file.type, upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('user-data').getPublicUrl(logoPath);
      setLogoUrl(data.publicUrl + '?t=' + Date.now());
      toast.success('Logo salva com sucesso!');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveReports = useCallback(async (updatedReports: Record<string, ReportData>) => {
    setSaving(true);
    try {
      await supabase.functions.invoke('report-storage', {
        body: { action: 'save', squarecloud_username: mroUsername, reports: updatedReports }
      });
      setReports(updatedReports);
      toast.success('Relatórios salvos!');
    } catch (err) {
      toast.error('Erro ao salvar relatórios');
    } finally {
      setSaving(false);
    }
  }, [mroUsername]);

  const handleCreateReport = () => {
    if (!newForm.instagramUsername) {
      toast.error('Selecione um perfil cadastrado');
      return;
    }
    const key = newForm.companyName.trim().toLowerCase().replace(/\s+/g, '-');
    if (reports[key]) {
      toast.error('Já existe um relatório para essa empresa!');
      return;
    }
    const updated = { ...reports, [key]: { ...newForm, createdAt: new Date().toISOString() } };
    saveReports(updated);
    setShowNewForm(false);
    setNewForm({
      companyName: '', instagramUsername: '', startDate: new Date().toISOString().split('T')[0],
      alcanceInicial: 0, alcanceAtual: 0, visitasInicial: 0, visitasAtual: 0,
      seguidoresInicial: 0, seguidoresAtual: 0, mensagensEnviadas: 0, totalContasAlcancadas: 0,
      createdAt: '', lastGeneratedAt: '',
    });
  };

  const handleSaveEdit = (key: string) => {
    if (!editForm) return;
    const updated = { ...reports, [key]: editForm };
    saveReports(updated);
    setEditingReport(null);
    setEditForm(null);
  };

  const handleDeleteReport = (key: string) => {
    if (!confirm('Excluir este relatório?')) return;
    const updated = { ...reports };
    delete updated[key];
    saveReports(updated);
  };

  const startEdit = (key: string) => {
    setEditingReport(key);
    setEditForm({ ...reports[key] });
  };

  // ═══════════════ GENERATE PDF ═══════════════
  const generatePDF = async (key: string) => {
    const report = reports[key];
    if (!report) return;
    setGenerating(key);

    try {
      // Load logo as base64 if available
      let logoBase64: string | null = null;
      if (logoUrl) {
        logoBase64 = await loadImageAsBase64(logoUrl);
      }

      const pdf = new jsPDF('l', 'mm', 'a4');
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();

      const alcP = calcPercent(report.alcanceInicial, report.alcanceAtual);
      const visP = calcPercent(report.visitasInicial, report.visitasAtual);
      const segP = calcPercent(report.seguidoresInicial, report.seguidoresAtual);
      const startF = formatDateBR(report.startDate);
      const currentF = formatDateBR(new Date().toISOString().split('T')[0]);
      const monthR = getMonthRange(report.startDate);

      // Helper: draw page bg
      const drawBg = () => {
        pdf.setFillColor(8, 8, 16);
        pdf.rect(0, 0, W, H, 'F');
        // Subtle gradient overlay top
        pdf.setFillColor(15, 10, 30);
        pdf.rect(0, 0, W, 40, 'F');
      };

      // Helper: add logo to bottom-right
      const addLogo = () => {
        if (logoBase64) {
          try {
            pdf.addImage(logoBase64, 'PNG', W - 50, H - 22, 35, 14);
          } catch (e) { /* ignore logo errors */ }
        }
      };

      // Helper: page footer
      const addFooter = (pageNum: number) => {
        pdf.setFontSize(7);
        pdf.setTextColor(60, 60, 70);
        pdf.text(`${report.companyName.toUpperCase()} - RELATORIO CONFIDENCIAL`, 20, H - 8);
        pdf.text(`${pageNum}/4`, W - 20, H - 8, { align: 'right' });
        addLogo();
      };

      // ════════════ PAGE 1 - COVER ════════════
      drawBg();
      // Extra dark gradient from bottom
      pdf.setFillColor(5, 5, 12);
      pdf.rect(0, H * 0.6, W, H * 0.4, 'F');

      // Gold accent bars
      const barY = 48;
      pdf.setFillColor(239, 68, 68);
      pdf.rect(W / 2 - 35, barY, 22, 4, 'F');
      pdf.setFillColor(251, 191, 36);
      pdf.rect(W / 2 - 11, barY, 22, 4, 'F');
      pdf.setFillColor(16, 185, 129);
      pdf.rect(W / 2 + 13, barY, 22, 4, 'F');

      // Logo on cover (centered, larger)
      if (logoBase64) {
        try {
          pdf.addImage(logoBase64, 'PNG', W / 2 - 22, 18, 44, 18);
        } catch (e) { /* ignore */ }
      }

      // Title - HUGE
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(42);
      pdf.setTextColor(255, 255, 255);
      pdf.text('RELATÓRIO DE', W / 2, 72, { align: 'center' });
      pdf.text('RESULTADOS', W / 2, 86, { align: 'center' });

      // Company name
      pdf.setFontSize(28);
      pdf.setTextColor(251, 191, 36);
      pdf.text(report.companyName.toUpperCase(), W / 2, 102, { align: 'center' });

      // Subtitle
      pdf.setFontSize(12);
      pdf.setTextColor(140, 140, 160);
      pdf.setFontSize(11);
      pdf.text('PERFORMANCE & EVOLUCAO DIGITAL', W / 2, 115, { align: 'center', charSpace: 1.5 });

      // Date badge
      pdf.setFillColor(251, 191, 36);
      const dateText = `${startF.toUpperCase()} > ${currentF.toUpperCase()}`;
      const dtW = pdf.getTextWidth(dateText) + 20;
      pdf.roundedRect(W / 2 - dtW / 2, 122, dtW, 10, 3, 3, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(dateText, W / 2, 129, { align: 'center' });

      // 3 big percentage cards
      const percY = 150;
      const percSpacing = 70;
      const percStartX = W / 2 - percSpacing;
      const percs = [
        { value: `+${alcP}%`, label: 'ALCANCE', color: [239, 68, 68] as [number, number, number] },
        { value: `+${visP}%`, label: 'VISITAS', color: [251, 191, 36] as [number, number, number] },
        { value: `+${segP}%`, label: 'SEGUIDORES', color: [16, 185, 129] as [number, number, number] },
      ];
      percs.forEach((p, i) => {
        const x = percStartX + i * percSpacing;
        // Card bg
        pdf.setFillColor(18, 18, 30);
        pdf.setDrawColor(p.color[0], p.color[1], p.color[2]);
        pdf.setLineWidth(0.6);
        pdf.roundedRect(x - 28, percY - 12, 56, 32, 3, 3, 'FD');
        // Value
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(28);
        pdf.setTextColor(p.color[0], p.color[1], p.color[2]);
        pdf.text(p.value, x, percY + 5, { align: 'center' });
        // Label
        pdf.setFontSize(9);
        pdf.setTextColor(160, 160, 170);
        pdf.text(p.label, x, percY + 15, { align: 'center' });
      });

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(50, 50, 60);
      pdf.text('DOCUMENTO CONFIDENCIAL - ANALISE COMPARATIVA DE PERFORMANCE', W / 2, H - 8, { align: 'center' });
      addLogo();

      // ════════════ PAGE 2 - EVOLUÇÃO ════════════
      pdf.addPage();
      drawBg();

      // Header bar
      pdf.setFillColor(251, 191, 36);
      pdf.rect(0, 0, W, 3, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(251, 191, 36);
      pdf.text('EVOLUCAO HISTORICA', 20, 18);
      pdf.setTextColor(100, 100, 110);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(monthR, W - 20, 18, { align: 'right' });

      pdf.setDrawColor(40, 40, 50);
      pdf.line(20, 22, W - 20, 22);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Crescimento Consolidado', 20, 40);

      // Vision box
      pdf.setFillColor(15, 15, 28);
      pdf.roundedRect(20, 48, W - 40, 35, 3, 3, 'F');
      pdf.setFillColor(251, 191, 36);
      pdf.rect(20, 48, 3, 35, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(251, 191, 36);
      pdf.text(`VISAO GERAL DESDE ${startF.toUpperCase()}`, 30, 58);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(180, 180, 190);
      const visionText = `Desde o inicio da gestao, o perfil @${report.instagramUsername} experimentou uma transformacao significativa. Os numeros abaixo refletem o impacto direto das estrategias de conteudo, interacao e prospeccao aplicadas.`;
      const splitVision = pdf.splitTextToSize(visionText, W - 60);
      pdf.text(splitVision, 30, 67);

      // Table
      const tableY = 95;
      const colWidths = [80, 60, 60, 55];
      const tableW = colWidths.reduce((a, b) => a + b, 0);
      const tableX = (W - tableW) / 2;

      // Table header
      pdf.setFillColor(18, 18, 30);
      pdf.rect(tableX, tableY - 6, tableW, 12, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 120);
      const headers = ['MÉTRICA', `INÍCIO (${startF})`, `ATUAL (${currentF})`, 'CRESCIMENTO'];
      let cx = tableX;
      headers.forEach((h, i) => {
        pdf.text(h, cx + 6, tableY + 1);
        cx += colWidths[i];
      });

      pdf.setDrawColor(40, 40, 55);
      pdf.line(tableX, tableY + 5, tableX + tableW, tableY + 5);

      // Table rows
      const segGanho = Math.max(0, report.seguidoresAtual - report.seguidoresInicial);
      const rows = [
        { metric: 'Alcance Mensal', initial: formatNumber(report.alcanceInicial), current: formatNumber(report.alcanceAtual), percent: `+${alcP}%` },
        { metric: 'Visitas ao Perfil', initial: formatNumber(report.visitasInicial), current: formatNumber(report.visitasAtual), percent: `+${visP}%` },
        { metric: 'Novos Seguidores', initial: formatNumber(report.seguidoresInicial), current: formatNumber(report.seguidoresAtual), percent: `+${segP}%` },
        { metric: 'Mensagens Enviadas', initial: '-', current: formatNumber(report.mensagensEnviadas), percent: '-' },
        { metric: 'Contas Alcancadas', initial: '-', current: formatNumber(report.totalContasAlcancadas), percent: '-' },
      ];

      rows.forEach((row, i) => {
        const ry = tableY + 18 + i * 18;
        cx = tableX;

        // Alternate row bg
        if (i % 2 === 0) {
          pdf.setFillColor(12, 12, 22);
          pdf.rect(tableX, ry - 7, tableW, 18, 'F');
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(240, 240, 245);
        pdf.text(row.metric, cx + 6, ry + 2);
        cx += colWidths[0];

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(160, 160, 175);
        pdf.text(row.initial, cx + 6, ry + 2);
        cx += colWidths[1];

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(row.current, cx + 6, ry + 2);
        cx += colWidths[2];

        // Growth badge
        if (row.percent !== '-') {
          pdf.setFillColor(16, 60, 35);
          pdf.roundedRect(cx + 4, ry - 4, 30, 10, 3, 3, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(34, 197, 94);
          pdf.text(row.percent, cx + 19, ry + 3, { align: 'center' });
        }
      });

      addFooter(2);

      // ════════════ PAGE 3 - PERFORMANCE ════════════
      pdf.addPage();
      drawBg();

      pdf.setFillColor(16, 185, 129);
      pdf.rect(0, 0, W, 3, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(16, 185, 129);
      pdf.text('PERFORMANCE RECENTE', 20, 18);
      pdf.setTextColor(100, 100, 110);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(monthR, W - 20, 18, { align: 'right' });

      pdf.setDrawColor(40, 40, 50);
      pdf.line(20, 22, W - 20, 22);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Resultados do Período', 20, 42);

      // 4 big metric cards
      const cardW = (W - 55) / 2;
      const cardH = 50;
      const cards = [
        { label: 'ALCANCE TOTAL', value: formatNumber(report.alcanceAtual), sub: `+${Math.abs(alcP)}% vs. Periodo Anterior`, color: [239, 68, 68] as [number, number, number] },
        { label: 'VISITAS AO PERFIL', value: formatNumber(report.visitasAtual), sub: `+${Math.abs(visP)}% vs. Periodo Anterior`, color: [251, 191, 36] as [number, number, number] },
        { label: 'NOVOS SEGUIDORES', value: formatNumber(segGanho), sub: `+${Math.abs(segP)}% vs. Periodo Anterior (${formatNumber(report.seguidoresInicial)} > ${formatNumber(report.seguidoresAtual)})`, color: [16, 185, 129] as [number, number, number] },
        { label: 'MENSAGENS ENVIADAS', value: formatNumber(report.mensagensEnviadas), sub: 'Publico Quente / Leads Diretos', color: [139, 92, 246] as [number, number, number] },
      ];

      cards.forEach((card, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = 20 + col * (cardW + 15);
        const cy = 52 + row * (cardH + 10);

        // Card
        pdf.setFillColor(15, 15, 28);
        pdf.roundedRect(cx, cy, cardW, cardH, 4, 4, 'F');
        // Top accent line
        pdf.setFillColor(card.color[0], card.color[1], card.color[2]);
        pdf.rect(cx, cy, cardW, 2, 'F');

        // Label
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
        pdf.text(card.label, cx + 10, cy + 14);

        // Value - BIG
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(30);
        pdf.setTextColor(255, 255, 255);
        pdf.text(card.value, cx + 10, cy + 34);

        // Sub
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(34, 197, 94);
        pdf.text(card.sub, cx + 10, cy + 44);
      });

      // Bottom info box
      const intY = 170;
      pdf.setFillColor(15, 15, 28);
      pdf.roundedRect(20, intY, W - 40, 25, 3, 3, 'F');
      pdf.setFillColor(16, 185, 129);
      pdf.rect(20, intY, 3, 25, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(16, 185, 129);
      pdf.text('INTERACAO COM PUBLICO DOS CONCORRENTES', 30, intY + 10);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(160, 160, 175);
      pdf.text('Prospeccao ativa com o publico dos concorrentes, direcionando visitas qualificadas e gerando leads quentes.', 30, intY + 19);

      addFooter(3);

      // ════════════ PAGE 4 - CONCLUSÃO ════════════
      pdf.addPage();
      drawBg();

      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, W, 3, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(139, 92, 246);
      pdf.text('VISAO ESTRATEGICA', 20, 18);
      pdf.setTextColor(100, 100, 110);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(monthR, W - 20, 18, { align: 'right' });

      pdf.setDrawColor(40, 40, 50);
      pdf.line(20, 22, W - 20, 22);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Conclusao & Proximos Passos', 20, 42);

      // Summary box
      pdf.setFillColor(15, 15, 28);
      pdf.roundedRect(20, 50, W - 40, 40, 3, 3, 'F');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(210, 210, 220);
      const conclusionText = `O comparativo de ${startF} a ${currentF} comprova que a metodologia aplicada gerou um crescimento de +${alcP}% em alcance, +${visP}% em visitas e +${segP}% em seguidores. A presenca digital do perfil @${report.instagramUsername} evoluiu de forma consistente e mensuravel.`;
      const splitC = pdf.splitTextToSize(conclusionText, W - 55);
      pdf.text(splitC, 28, 64);

      // Two columns
      const colY = 100;
      const halfW = (W - 55) / 2;

      // Left
      pdf.setFillColor(15, 15, 28);
      pdf.roundedRect(20, colY, halfW, 75, 3, 3, 'F');
      pdf.setFillColor(251, 191, 36);
      pdf.rect(20, colY, halfW, 2, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(251, 191, 36);
      pdf.text('DESTAQUES DA GESTAO', 28, colY + 14);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(200, 200, 210);
      const highlights = [
        `Crescimento de Alcance: +${alcP}%`,
        `De ${formatNumber(report.alcanceInicial)} para ${formatNumber(report.alcanceAtual)}`,
        `Conversao de Perfil: +${visP}% em visitas`,
        `${formatNumber(report.mensagensEnviadas)} leads abordados`,
        `${formatNumber(report.totalContasAlcancadas)} contas alcancadas`,
      ];
      highlights.forEach((h, i) => {
        pdf.text(`•  ${h}`, 28, colY + 25 + i * 10);
      });

      // Right
      const rightX = 20 + halfW + 15;
      pdf.setFillColor(15, 15, 28);
      pdf.roundedRect(rightX, colY, halfW, 75, 3, 3, 'F');
      pdf.setFillColor(16, 185, 129);
      pdf.rect(rightX, colY, halfW, 2, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(16, 185, 129);
      pdf.text('PROXIMO CICLO', rightX + 8, colY + 14);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(200, 200, 210);
      const plans = [
        'Escalar prospeccao ativa',
        'Funil de Direct automatizado',
        'Reels de alta retencao',
        `Manter alcance acima de ${formatNumber(report.alcanceAtual)}`,
        'Otimizar conversao de perfil',
      ];
      plans.forEach((p, i) => {
        pdf.text(`•  ${p}`, rightX + 8, colY + 25 + i * 10);
      });

      addFooter(4);

      // Save
      const fileName = `Relatorio_${report.companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      const updated = { ...reports, [key]: { ...report, lastGeneratedAt: new Date().toISOString() } };
      saveReports(updated);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(null);
    }
  };

  // ═══════════════ FORM COMPONENT ═══════════════
  const ReportForm = ({ form, onChange, onSave, onCancel, title, saveLabel }: {
    form: ReportData;
    onChange: (f: ReportData) => void;
    onSave: () => void;
    onCancel: () => void;
    title: string;
    saveLabel: string;
  }) => (
    <div className="bg-[#12121f] border border-white/10 rounded-xl p-5 space-y-4">
      <h3 className="text-white font-bold text-lg flex items-center gap-2">
        <Building2 className="h-5 w-5 text-yellow-400" />
        {title}
      </h3>

      {/* Profile selector */}
      <div>
        <label className="text-white/60 text-xs block mb-1.5">Selecionar Perfil Cadastrado *</label>
        {profiles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profiles.map((p: any) => (
              <button
                key={p.instagram_username}
                onClick={() => {
                  const pd = p.profile_data || {};
                  onChange({
                    ...form,
                    instagramUsername: p.instagram_username,
                    companyName: p.instagram_username,
                    seguidoresInicial: pd.followers || 0,
                    seguidoresAtual: pd.followers || 0,
                    alcanceInicial: pd.reach || pd.avgLikes || 0,
                    alcanceAtual: pd.reach || pd.avgLikes || 0,
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  form.instagramUsername === p.instagram_username
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                @{p.instagram_username}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-xs">Nenhum perfil cadastrado. Cadastre perfis na aba Instagram primeiro.</p>
        )}
      </div>

      {form.instagramUsername && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white/60 text-xs block mb-1">Empresa (perfil selecionado)</label>
            <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm font-medium">@{form.companyName}</div>
          </div>
          <div>
            <label className="text-white/60 text-xs block mb-1">Data de Início</label>
            <Input type="date" value={form.startDate} onChange={e => onChange({ ...form, startDate: e.target.value })} className="bg-white/5 border-white/10 text-white" />
          </div>
        </div>
      )}

      <div className="border-t border-white/10 pt-3">
        <p className="text-yellow-400 text-xs font-bold mb-3 flex items-center gap-1"><BarChart3 size={14} /> Métricas Iniciais vs Atuais</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-white/40 text-[10px] block mb-1">Alcance Inicial</label>
            <Input type="number" value={form.alcanceInicial || ''} onChange={e => onChange({ ...form, alcanceInicial: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-white/40 text-[10px] block mb-1">Alcance Atual</label>
            <Input type="number" value={form.alcanceAtual || ''} onChange={e => onChange({ ...form, alcanceAtual: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div className="flex items-end pb-2">
            <span className="text-green-400 font-bold text-sm">+{calcPercent(form.alcanceInicial, form.alcanceAtual)}%</span>
          </div>

          <div>
            <label className="text-white/40 text-[10px] block mb-1">Visitas Inicial</label>
            <Input type="number" value={form.visitasInicial || ''} onChange={e => onChange({ ...form, visitasInicial: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-white/40 text-[10px] block mb-1">Visitas Atual</label>
            <Input type="number" value={form.visitasAtual || ''} onChange={e => onChange({ ...form, visitasAtual: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div className="flex items-end pb-2">
            <span className="text-green-400 font-bold text-sm">+{calcPercent(form.visitasInicial, form.visitasAtual)}%</span>
          </div>

          <div>
            <label className="text-white/40 text-[10px] block mb-1">Seguidores Inicial</label>
            <Input type="number" value={form.seguidoresInicial || ''} onChange={e => onChange({ ...form, seguidoresInicial: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-white/40 text-[10px] block mb-1">Seguidores Atual</label>
            <Input type="number" value={form.seguidoresAtual || ''} onChange={e => onChange({ ...form, seguidoresAtual: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div className="flex items-end pb-2">
            <span className="text-green-400 font-bold text-sm">+{calcPercent(form.seguidoresInicial, form.seguidoresAtual)}%</span>
          </div>

          <div>
            <label className="text-white/40 text-[10px] block mb-1">Mensagens Enviadas</label>
            <Input type="number" value={form.mensagensEnviadas || ''} onChange={e => onChange({ ...form, mensagensEnviadas: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-white/40 text-[10px] block mb-1">Total Contas Alcançadas</label>
            <Input type="number" value={form.totalContasAlcancadas || ''} onChange={e => onChange({ ...form, totalContasAlcancadas: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} className="border-white/10 text-white/60">Cancelar</Button>
        <Button size="sm" onClick={onSave} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold">{saveLabel}</Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button size="sm" onClick={onBack} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
            <ArrowLeft size={16} />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-black">Relatórios de Empresas</h1>
            <p className="text-white/40 text-sm">Gere relatórios profissionais para seus clientes</p>
          </div>
        </div>
        <div className="mb-4">
          <VideoTutorialButton youtubeUrl="https://youtu.be/MFixSgbNXWI" title="🎬 Tutorial - Como gerar relatórios" variant="pulse" size="default" className="w-full bg-red-600 hover:bg-red-700 text-xs sm:text-sm whitespace-normal leading-tight" />
        </div>

        {/* Logo upload section */}
        <div className="bg-[#12121f] border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-white font-bold text-sm">Logo da Agência</p>
                <p className="text-white/40 text-xs">PNG transparente · Aparece no PDF gerado</p>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              {logoUrl && (
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <img src={logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain" />
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="bg-white/10 hover:bg-white/20 text-white text-xs"
              >
                {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
              </Button>
            </div>
          </div>
        </div>

        {/* New report button */}
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold hover:from-yellow-500 hover:to-orange-500">
            <Plus size={16} /> Nova Empresa / Relatório
          </Button>
        )}

        {/* New report form */}
        {showNewForm && (
          <div className="mb-6">
            <ReportForm
              form={newForm}
              onChange={setNewForm}
              onSave={handleCreateReport}
              onCancel={() => setShowNewForm(false)}
              title="Cadastrar Nova Empresa"
              saveLabel="Salvar Empresa"
            />
          </div>
        )}

        {/* Reports list */}
        {Object.keys(reports).length === 0 && !showNewForm ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-lg">Nenhum relatório cadastrado</p>
            <p className="text-white/20 text-sm mt-1">Clique em "Nova Empresa" para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(reports).map(([key, report]) => (
              <div key={key}>
                {editingReport === key && editForm ? (
                  <ReportForm
                    form={editForm}
                    onChange={setEditForm}
                    onSave={() => handleSaveEdit(key)}
                    onCancel={() => { setEditingReport(null); setEditForm(null); }}
                    title={`Editando: ${report.companyName}`}
                    saveLabel="Salvar Alterações"
                  />
                ) : (
                  <div className="bg-[#12121f] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                          {report.companyName}
                        </h3>
                        {report.instagramUsername && (
                          <p className="text-white/40 text-xs mt-0.5">@{report.instagramUsername}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-3">
                          <div className="bg-white/5 rounded-lg px-3 py-1.5">
                            <span className="text-white/40 text-[10px] block">Alcance</span>
                            <span className="text-green-400 font-bold text-sm">+{calcPercent(report.alcanceInicial, report.alcanceAtual)}%</span>
                          </div>
                          <div className="bg-white/5 rounded-lg px-3 py-1.5">
                            <span className="text-white/40 text-[10px] block">Visitas</span>
                            <span className="text-green-400 font-bold text-sm">+{calcPercent(report.visitasInicial, report.visitasAtual)}%</span>
                          </div>
                          <div className="bg-white/5 rounded-lg px-3 py-1.5">
                            <span className="text-white/40 text-[10px] block">Seguidores</span>
                            <span className="text-green-400 font-bold text-sm">+{calcPercent(report.seguidoresInicial, report.seguidoresAtual)}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-white/30 text-[10px]">
                          <span className="flex items-center gap-1"><Calendar size={10} /> Início: {report.startDate}</span>
                          {report.lastGeneratedAt && (
                            <span>Último PDF: {new Date(report.lastGeneratedAt).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => generatePDF(key)}
                          disabled={generating === key}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xs"
                        >
                          {generating === key ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          {report.lastGeneratedAt ? 'Novo Relatório' : 'Gerar PDF'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(key)} className="border-white/10 text-white/60 text-xs">
                          <Edit3 size={12} /> Editar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteReport(key)} className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                          <Trash2 size={12} /> Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {saving && (
          <div className="fixed bottom-4 right-4 bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg">
            <Loader2 size={14} className="animate-spin" /> Salvando...
          </div>
        )}
      </div>
    </div>
  );
};
