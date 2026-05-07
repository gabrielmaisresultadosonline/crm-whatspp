import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProfileSession } from '@/types/instagram';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GrowthPDFExportProps {
  profileSession: ProfileSession;
}

export const GrowthPDFExport = ({ profileSession }: GrowthPDFExportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // Helper function to add text
      const addText = (text: string, size: number, bold: boolean = false, color: number[] = [255, 255, 255]) => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.text(text, margin, yPos);
        yPos += size * 0.5;
      };

      // Set background
      pdf.setFillColor(26, 26, 46);
      pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), 'F');

      // Title
      addText('Relatório de Crescimento', 20, true, [0, 255, 136]);
      yPos += 5;
      addText(`@${profileSession.profile.username}`, 14, false, [200, 200, 200]);
      yPos += 10;

      // Date range
      const startDate = new Date(profileSession.startedAt).toLocaleDateString('pt-BR');
      const endDate = new Date().toLocaleDateString('pt-BR');
      addText(`Período: ${startDate} - ${endDate}`, 10, false, [150, 150, 150]);
      yPos += 15;

      // Current Stats
      addText('Estatísticas Atuais', 14, true, [0, 255, 136]);
      yPos += 8;
      
      const profile = profileSession.profile;
      const stats = [
        `Seguidores: ${profile.followers.toLocaleString()}`,
        `Seguindo: ${profile.following.toLocaleString()}`,
        `Posts: ${profile.posts}`,
        `Média de Likes: ${profile.avgLikes}`,
        `Engajamento: ${(profile.engagement * 100).toFixed(2)}%`
      ];
      
      stats.forEach(stat => {
        addText(`• ${stat}`, 10, false, [200, 200, 200]);
        yPos += 3;
      });
      yPos += 10;

      // Growth Summary
      if (profileSession.growthHistory.length > 1) {
        const initial = profileSession.initialSnapshot;
        const current = profileSession.growthHistory[profileSession.growthHistory.length - 1];
        
        addText('Resumo de Crescimento', 14, true, [0, 255, 136]);
        yPos += 8;

        const followersGain = current.followers - initial.followers;
        const followersPercent = initial.followers > 0 
          ? ((followersGain / initial.followers) * 100).toFixed(2)
          : '0';
        
        const growthStats = [
          `Seguidores ganhos: +${followersGain.toLocaleString()} (${followersPercent}%)`,
          `Posts adicionados: +${current.posts - initial.posts}`,
          `Dias monitorando: ${Math.ceil((new Date().getTime() - new Date(profileSession.startedAt).getTime()) / (1000 * 60 * 60 * 24))}`
        ];

        growthStats.forEach(stat => {
          addText(`• ${stat}`, 10, false, [200, 200, 200]);
          yPos += 3;
        });
        yPos += 10;
      }

      // Insights
      if (profileSession.growthInsights.length > 0) {
        addText('Insights Semanais', 14, true, [0, 255, 136]);
        yPos += 8;

        const recentInsights = profileSession.growthInsights.slice(-5);
        recentInsights.forEach(insight => {
          addText(`Semana ${insight.weekNumber}:`, 10, true, [200, 200, 200]);
          yPos += 3;
          insight.insights.forEach(i => {
            if (yPos > 270) {
              pdf.addPage();
              pdf.setFillColor(26, 26, 46);
              pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), 'F');
              yPos = 20;
            }
            addText(`  • ${i}`, 9, false, [180, 180, 180]);
            yPos += 2;
          });
          yPos += 5;
        });
      }

      // Strategies count
      yPos += 5;
      addText('Estratégias Aplicadas', 14, true, [0, 255, 136]);
      yPos += 8;
      addText(`Total de estratégias: ${profileSession.strategies.length}`, 10, false, [200, 200, 200]);
      yPos += 5;
      addText(`Criativos gerados: ${profileSession.creatives.length}`, 10, false, [200, 200, 200]);
      yPos += 15;

      // Recommendation
      pdf.setFillColor(0, 100, 50);
      pdf.roundedRect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 25, 3, 3, 'F');
      yPos += 5;
      addText('Continue utilizando a MRO Inteligente!', 12, true, [0, 255, 136]);
      yPos += 5;
      addText('Você está no caminho certo para o crescimento.', 10, false, [200, 200, 200]);

      // Footer
      yPos = pdf.internal.pageSize.getHeight() - 10;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Gerado por MRO Inteligente • ${new Date().toLocaleDateString('pt-BR')}`, margin, yPos);

      // Save
      pdf.save(`crescimento_${profileSession.profile.username}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'PDF exportado!',
        description: 'O relatório foi baixado com sucesso'
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o PDF',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={exportToPDF}
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      Exportar PDF
    </Button>
  );
};
