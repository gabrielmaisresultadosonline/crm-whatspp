import React, { useState, useRef } from 'react';
import { VideoTutorialButton } from '@/components/VideoTutorialButton';
import { ArrowLeft, FileText, Upload, Download, Loader2, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ContratoGeneratorProps {
  onBack: () => void;
}

interface ContratoData {
  contratanteNome: string;
  contratanteCpf: string;
  empresaNome: string;
  contratadoNome: string;
  contratadoCpf: string;
  agenciaNome: string;
  valorMensal: string;
  duracaoMeses: string;
  logoUrl: string | null;
}

const defaultData: ContratoData = {
  contratanteNome: '',
  contratanteCpf: '',
  empresaNome: '',
  contratadoNome: 'GABRIEL',
  contratadoCpf: '000.000.000-00',
  agenciaNome: 'Mais Resultados Online',
  valorMensal: '600,00',
  duracaoMeses: '3',
  logoUrl: null,
};

export const ContratoGenerator: React.FC<ContratoGeneratorProps> = ({ onBack }) => {
  const [data, setData] = useState<ContratoData>(defaultData);
  const [generating, setGenerating] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof ContratoData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

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

  const calcTotal = () => {
    const mensal = parseFloat(data.valorMensal.replace(/\./g, '').replace(',', '.')) || 0;
    const meses = parseInt(data.duracaoMeses) || 0;
    const total = mensal * meses;
    return total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const valorExtenso = () => {
    const mensal = parseFloat(data.valorMensal.replace(/\./g, '').replace(',', '.')) || 0;
    const meses = parseInt(data.duracaoMeses) || 0;
    const total = mensal * meses;
    return `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const generatePDF = async () => {
    if (!data.contratanteNome || !data.empresaNome) {
      toast.error('Preencha pelo menos o nome do contratante e da empresa');
      return;
    }

    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const addPage = () => {
        doc.addPage();
        y = 20;
      };

      const checkPage = (needed: number) => {
        if (y + needed > 275) addPage();
      };

      // Logo
      if (data.logoUrl) {
        try {
          const img = new Image();
          img.src = data.logoUrl;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          const ratio = img.width / img.height;
          const logoH = 20;
          const logoW = logoH * ratio;
          doc.addImage(data.logoUrl, 'PNG', (pageWidth - logoW) / 2, y, logoW, logoH);
          y += logoH + 8;
        } catch {
          // skip logo on error
        }
      }

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.text('DE MARKETING DIGITAL', pageWidth / 2, y, { align: 'center' });
      y += 12;

      // Helper functions
      const addBoldText = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const text = `${label}${value}`;
        const lines = doc.splitTextToSize(text, contentWidth);
        checkPage(lines.length * 5);
        doc.text(lines, margin, y);
        y += lines.length * 5;
      };

      const addNormalText = (text: string, indent = 0) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        checkPage(lines.length * 5);
        doc.text(lines, margin + indent, y);
        y += lines.length * 5;
      };

      const addClausula = (title: string) => {
        checkPage(12);
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(title, margin, y);
        y += 7;
      };

      const addBullet = (text: string) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(text, contentWidth - 8);
        checkPage(lines.length * 5);
        doc.text('•', margin + 2, y);
        doc.text(lines, margin + 8, y);
        y += lines.length * 5;
      };

      const addSeparator = () => {
        checkPage(6);
        y += 2;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 4;
      };

      const meses = data.duracaoMeses || '3';
      const mesesExtenso = meses === '1' ? '1 (um) mês' : meses === '2' ? '2 (dois) meses' : meses === '3' ? '3 (três) meses' : meses === '6' ? '6 (seis) meses' : meses === '12' ? '12 (doze) meses' : `${meses} meses`;

      // CONTRATANTE
      addBoldText('CONTRATANTE: ', '');
      addNormalText(`${data.contratanteNome || '[NOME DO CONTRATANTE]'}, inscrito no CPF nº ${data.contratanteCpf || '[CPF]'}, proprietário da empresa ${data.empresaNome || '[EMPRESA]'}, doravante denominado simplesmente CONTRATANTE.`);
      y += 4;

      // CONTRATADO
      addBoldText('CONTRATADO: ', '');
      addNormalText(`${data.contratadoNome || '[NOME DO CONTRATADO]'}, inscrito no CPF nº ${data.contratadoCpf || '[CPF]'}, responsável pela agência ${data.agenciaNome || '[AGÊNCIA]'}, doravante denominado simplesmente CONTRATADO.`);

      addSeparator();

      // CLÁUSULA 1
      addClausula('CLÁUSULA 1 – DO OBJETO');
      addNormalText(`O presente contrato tem como objeto a prestação de serviços de gerenciamento e crescimento do perfil da empresa ${data.empresaNome || '[EMPRESA]'} na rede social Instagram, com foco em:`);
      y += 2;
      addBullet('Aumento de engajamento');
      addBullet('Crescimento de seguidores');
      addBullet('Geração de clientes e vendas');
      addBullet('Posicionamento estratégico da marca');
      y += 2;
      addNormalText('Os serviços serão realizados sem investimento em anúncios pagos, utilizando exclusivamente estratégias orgânicas, incluindo:');
      y += 2;
      addBullet('Interações estratégicas com o público-alvo');
      addBullet('Comunicação direcionada');
      addBullet('Técnicas de alcance orgânico');
      addBullet('Uso de inteligência artificial para potencialização de resultados');

      addSeparator();

      // CLÁUSULA 2
      addClausula('CLÁUSULA 2 – DAS ENTREGAS E RESULTADOS');
      addNormalText('O CONTRATADO compromete-se a:');
      y += 2;
      addBullet('Trabalhar estratégias para gerar mais de 1.000 visitas mensais no perfil do CONTRATANTE');
      addBullet('Desenvolver crescimento contínuo do perfil');
      addBullet('Melhorar o relacionamento com o público-alvo');
      addBullet('Aplicar estratégias validadas de marketing digital');
      y += 2;
      addNormalText('Parágrafo único: Os resultados podem variar conforme fatores externos, comportamento do público e algoritmo da plataforma.');

      addSeparator();

      // CLÁUSULA 3
      addClausula('CLÁUSULA 3 – DO PRAZO');
      addNormalText(`O presente contrato terá duração de ${mesesExtenso}, iniciando-se na data de assinatura.`);

      addSeparator();

      // CLÁUSULA 4
      addClausula('CLÁUSULA 4 – DO VALOR E FORMA DE PAGAMENTO');
      addNormalText('Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO o valor de:');
      y += 2;
      addBullet(`R$ ${data.valorMensal} por mês, durante o período de ${meses} meses`);
      y += 2;
      addNormalText('Totalizando:');
      y += 2;
      addBullet(`${valorExtenso()} ao final do contrato`);
      y += 2;
      addNormalText('O pagamento deverá ser realizado mensalmente, conforme acordado entre as partes.');

      addSeparator();

      // CLÁUSULA 5
      addClausula('CLÁUSULA 5 – DAS OBRIGAÇÕES DO CONTRATADO');
      addNormalText('O CONTRATADO se compromete a:');
      y += 2;
      addBullet('Executar as estratégias de marketing acordadas');
      addBullet('Manter profissionalismo e confidencialidade');
      addBullet('Aplicar técnicas atualizadas do mercado');
      addBullet('Buscar constantemente melhorias de desempenho');

      addSeparator();

      // CLÁUSULA 6
      addClausula('CLÁUSULA 6 – DAS OBRIGAÇÕES DO CONTRATANTE');
      addNormalText('O CONTRATANTE se compromete a:');
      y += 2;
      addBullet('Fornecer acesso necessário às redes sociais');
      addBullet('Disponibilizar informações sobre o negócio');
      addBullet('Manter comunicação ativa com o CONTRATADO');
      addBullet('Cumprir os pagamentos mensais conforme acordado');
      addBullet(`Respeitar o prazo contratual mínimo de ${meses} meses`);

      addSeparator();

      // CLÁUSULA 7
      addClausula('CLÁUSULA 7 – DA RESCISÃO');
      addNormalText(`Este contrato não poderá ser rescindido antes do prazo mínimo de ${mesesExtenso}, salvo acordo entre as partes.`);
      y += 2;
      addNormalText('Em caso de interrupção antecipada por parte do CONTRATANTE, poderá ser cobrado o valor proporcional restante do contrato.');

      addSeparator();

      // CLÁUSULA 8
      addClausula('CLÁUSULA 8 – DAS ASSINATURAS DIGITAIS');
      addNormalText('As partes concordam que este contrato poderá ser assinado digitalmente através da plataforma oficial do Governo Federal, GOV.BR, possuindo validade jurídica, nos termos da legislação vigente.');
      y += 2;
      addNormalText('A assinatura eletrônica terá a mesma validade que a assinatura física.');

      addSeparator();

      // CLÁUSULA 9
      addClausula('CLÁUSULA 9 – DISPOSIÇÕES GERAIS');
      addBullet('O CONTRATADO não garante resultados financeiros exatos, mas sim a execução de estratégias profissionais com alto potencial de crescimento.');
      addBullet('Ambas as partes concordam com os termos aqui estabelecidos, visando uma parceria estratégica e de crescimento.');

      addSeparator();

      // CLÁUSULA 10
      addClausula('CLÁUSULA 10 – DO FORO');
      addNormalText('Fica eleito o foro da comarca de residência do CONTRATADO para dirimir quaisquer dúvidas oriundas deste contrato.');

      addSeparator();

      // ASSINATURAS
      checkPage(60);
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('ASSINATURA DAS PARTES', pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Por estarem de acordo, firmam o presente contrato:', margin, y);
      y += 16;

      // Contratante signature
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATANTE:', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${data.contratanteNome || '________________________________________'}`, margin, y);
      y += 6;
      doc.text(`CPF: ${data.contratanteCpf || '________________________________________'}`, margin, y);
      y += 6;
      doc.text(`Empresa: ${data.empresaNome || '________________________________________'}`, margin, y);
      y += 10;
      doc.text('Assinatura: ________________________________________', margin, y);
      y += 16;

      // Contratado signature
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATADO:', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(data.contratadoNome || '________________________________________', margin, y);
      y += 6;
      doc.text(`CPF: ${data.contratadoCpf || '________________________________________'}`, margin, y);
      y += 6;
      doc.text(`Agência ${data.agenciaNome}`, margin, y);
      y += 10;
      doc.text('Assinatura: ________________________________________', margin, y);
      y += 16;

      doc.text('Data: ____ / ____ / ______', margin, y);

      // Download
      const fileName = `Contrato_${data.empresaNome.replace(/\s+/g, '_') || 'Cliente'}.pdf`;
      doc.save(fileName);
      toast.success('Contrato gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar o contrato');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <header className="sticky top-0 z-40 bg-[#050508]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-lg">Gerador de <span className="text-amber-400">Contrato</span></span>
          </div>
        </div>
       </header>
       <div className="max-w-4xl mx-auto px-4 pt-3">
         <VideoTutorialButton youtubeUrl="https://youtu.be/SC7YSIP4jLU" title="🎬 Tutorial - Como gerar contratos" variant="pulse" size="default" className="w-full bg-red-600 hover:bg-red-700 text-xs sm:text-sm whitespace-normal leading-tight" />
       </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Gere um Contrato para seu Cliente</h1>
          <p className="text-gray-400">Preencha os dados abaixo e gere o PDF do contrato profissional</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contratante */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2 text-amber-400">
              <FileText className="w-5 h-5" /> Dados do Contratante
            </h2>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nome Completo</label>
              <Input value={data.contratanteNome} onChange={e => update('contratanteNome', e.target.value)} placeholder="Nome do contratante" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">CPF</label>
              <Input value={data.contratanteCpf} onChange={e => update('contratanteCpf', e.target.value)} placeholder="000.000.000-00" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nome da Empresa</label>
              <Input value={data.empresaNome} onChange={e => update('empresaNome', e.target.value)} placeholder="Ex: Pizzaria Bonato" className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>

          {/* Contratado */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2 text-purple-400">
              <FileText className="w-5 h-5" /> Dados do Contratado (Você)
            </h2>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Seu Nome</label>
              <Input value={data.contratadoNome} onChange={e => update('contratadoNome', e.target.value)} placeholder="Seu nome" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Seu CPF</label>
              <Input value={data.contratadoCpf} onChange={e => update('contratadoCpf', e.target.value)} placeholder="000.000.000-00" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nome da Agência</label>
              <Input value={data.agenciaNome} onChange={e => update('agenciaNome', e.target.value)} placeholder="Nome da sua agência" className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>

          {/* Valores */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2 text-green-400">
              💰 Valores do Contrato
            </h2>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Valor Mensal (R$)</label>
              <Input value={data.valorMensal} onChange={e => update('valorMensal', e.target.value)} placeholder="600,00" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Duração (meses)</label>
              <Input type="number" min="1" max="24" value={data.duracaoMeses} onChange={e => update('duracaoMeses', e.target.value)} placeholder="3" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Valor Total</div>
              <div className="text-2xl font-black text-green-400">R$ {calcTotal()}</div>
              <div className="text-xs text-gray-500">{data.duracaoMeses || '0'} meses × R$ {data.valorMensal || '0'}</div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2 text-cyan-400">
              🎨 Logo da Agência
            </h2>
            <p className="text-xs text-gray-500">Opcional: faça upload da logo para incluir no cabeçalho do contrato</p>

            {logoPreview ? (
              <div className="relative">
                <img src={logoPreview} alt="Logo" className="max-h-24 mx-auto rounded-lg" />
                <button onClick={removeLogo} className="absolute top-0 right-0 bg-red-500 rounded-full p-1 text-white hover:bg-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-full py-8 rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 text-gray-500 hover:text-cyan-400 flex flex-col items-center gap-2 transition-colors"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm">Clique para enviar a logo</span>
              </button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-lg">Pré-visualização do Contrato</h2>
            <span className="text-xs text-gray-500 ml-2">Atualiza em tempo real</span>
          </div>
          <div className="bg-white text-black rounded-2xl p-6 md:p-10 shadow-2xl max-h-[600px] overflow-y-auto text-sm leading-relaxed">
            {logoPreview && (
              <div className="flex justify-center mb-6">
                <img src={logoPreview} alt="Logo" className="max-h-16" />
              </div>
            )}
            <h2 className="text-center font-bold text-base mb-1">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
            <h3 className="text-center font-bold text-base mb-6">DE MARKETING DIGITAL</h3>

            <p className="mb-2"><strong>CONTRATANTE:</strong></p>
            <p className="mb-4">{data.contratanteNome || <span className="text-gray-400">[NOME DO CONTRATANTE]</span>}, inscrito no CPF nº {data.contratanteCpf || <span className="text-gray-400">[CPF]</span>}, proprietário da empresa <strong>{data.empresaNome || <span className="text-gray-400">[EMPRESA]</span>}</strong>, doravante denominado simplesmente <strong>CONTRATANTE</strong>.</p>

            <p className="mb-2"><strong>CONTRATADO:</strong></p>
            <p className="mb-4">{data.contratadoNome || <span className="text-gray-400">[NOME DO CONTRATADO]</span>}, inscrito no CPF nº {data.contratadoCpf || <span className="text-gray-400">[CPF]</span>}, responsável pela agência <strong>{data.agenciaNome || <span className="text-gray-400">[AGÊNCIA]</span>}</strong>, doravante denominado simplesmente <strong>CONTRATADO</strong>.</p>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold mb-2">CLÁUSULA 1 – DO OBJETO</p>
            <p className="mb-2">O presente contrato tem como objeto a prestação de serviços de gerenciamento e crescimento do perfil da empresa <strong>{data.empresaNome || '[EMPRESA]'}</strong> na rede social Instagram, com foco em:</p>
            <ul className="list-disc pl-6 mb-2 space-y-0.5">
              <li>Aumento de engajamento</li>
              <li>Crescimento de seguidores</li>
              <li>Geração de clientes e vendas</li>
              <li>Posicionamento estratégico da marca</li>
            </ul>
            <p className="mb-2">Os serviços serão realizados sem investimento em anúncios pagos, utilizando exclusivamente estratégias orgânicas, incluindo:</p>
            <ul className="list-disc pl-6 mb-4 space-y-0.5">
              <li>Interações estratégicas com o público-alvo</li>
              <li>Comunicação direcionada</li>
              <li>Técnicas de alcance orgânico</li>
              <li>Uso de inteligência artificial para potencialização de resultados</li>
            </ul>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold mb-2">CLÁUSULA 2 – DAS ENTREGAS E RESULTADOS</p>
            <p className="mb-2">O CONTRATADO compromete-se a:</p>
            <ul className="list-disc pl-6 mb-2 space-y-0.5">
              <li>Trabalhar estratégias para gerar mais de 1.000 visitas mensais no perfil do CONTRATANTE</li>
              <li>Desenvolver crescimento contínuo do perfil</li>
              <li>Melhorar o relacionamento com o público-alvo</li>
              <li>Aplicar estratégias validadas de marketing digital</li>
            </ul>
            <p className="mb-4 italic text-gray-600">Parágrafo único: Os resultados podem variar conforme fatores externos, comportamento do público e algoritmo da plataforma.</p>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold mb-2">CLÁUSULA 3 – DO PRAZO</p>
            <p className="mb-4">O presente contrato terá duração de <strong>{data.duracaoMeses || '___'} meses</strong>, iniciando-se na data de assinatura.</p>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold mb-2">CLÁUSULA 4 – DO VALOR E FORMA DE PAGAMENTO</p>
            <p className="mb-2">Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO o valor de:</p>
            <ul className="list-disc pl-6 mb-2">
              <li><strong>R$ {data.valorMensal || '___'}</strong> por mês, durante o período de {data.duracaoMeses || '___'} meses</li>
            </ul>
            <p className="mb-2">Totalizando:</p>
            <ul className="list-disc pl-6 mb-2">
              <li><strong>R$ {calcTotal()}</strong> ao final do contrato</li>
            </ul>
            <p className="mb-4">O pagamento deverá ser realizado mensalmente, conforme acordado entre as partes.</p>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold mb-2">CLÁUSULA 5 – DAS OBRIGAÇÕES DO CONTRATADO</p>
            <ul className="list-disc pl-6 mb-4 space-y-0.5">
              <li>Executar as estratégias de marketing acordadas</li>
              <li>Manter profissionalismo e confidencialidade</li>
              <li>Aplicar técnicas atualizadas do mercado</li>
              <li>Buscar constantemente melhorias de desempenho</li>
            </ul>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold mb-2">CLÁUSULA 6 – DAS OBRIGAÇÕES DO CONTRATANTE</p>
            <ul className="list-disc pl-6 mb-4 space-y-0.5">
              <li>Fornecer acesso necessário às redes sociais</li>
              <li>Disponibilizar informações sobre o negócio</li>
              <li>Manter comunicação ativa com o CONTRATADO</li>
              <li>Cumprir os pagamentos mensais conforme acordado</li>
              <li>Respeitar o prazo contratual mínimo de {data.duracaoMeses || '___'} meses</li>
            </ul>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold mb-2">CLÁUSULA 7 – DA RESCISÃO</p>
            <p className="mb-2">Este contrato não poderá ser rescindido antes do prazo mínimo de {data.duracaoMeses || '___'} meses, salvo acordo entre as partes.</p>
            <p className="mb-4">Em caso de interrupção antecipada por parte do CONTRATANTE, poderá ser cobrado o valor proporcional restante do contrato.</p>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold mb-2">CLÁUSULA 8 – DAS ASSINATURAS DIGITAIS</p>
            <p className="mb-2">As partes concordam que este contrato poderá ser assinado digitalmente através da plataforma oficial do Governo Federal, GOV.BR, possuindo validade jurídica, nos termos da legislação vigente.</p>
            <p className="mb-4">A assinatura eletrônica terá a mesma validade que a assinatura física.</p>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold mb-2">CLÁUSULA 9 – DISPOSIÇÕES GERAIS</p>
            <ul className="list-disc pl-6 mb-4 space-y-0.5">
              <li>O CONTRATADO não garante resultados financeiros exatos, mas sim a execução de estratégias profissionais com alto potencial de crescimento.</li>
              <li>Ambas as partes concordam com os termos aqui estabelecidos, visando uma parceria estratégica e de crescimento.</li>
            </ul>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold mb-2">CLÁUSULA 10 – DO FORO</p>
            <p className="mb-4">Fica eleito o foro da comarca de residência do CONTRATADO para dirimir quaisquer dúvidas oriundas deste contrato.</p>

            <hr className="my-4 border-gray-300" />

            <p className="font-bold text-center mb-4">ASSINATURA DAS PARTES</p>
            <p className="mb-6 text-center text-gray-500">Por estarem de acordo, firmam o presente contrato:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div>
                <p className="font-bold mb-2">CONTRATANTE:</p>
                <p>Nome: {data.contratanteNome || '________________________'}</p>
                <p>CPF: {data.contratanteCpf || '________________________'}</p>
                <p>Empresa: {data.empresaNome || '________________________'}</p>
                <p className="mt-4">Assinatura: ________________________</p>
              </div>
              <div>
                <p className="font-bold mb-2">CONTRATADO:</p>
                <p>{data.contratadoNome || '________________________'}</p>
                <p>CPF: {data.contratadoCpf || '________________________'}</p>
                <p>Agência {data.agenciaNome}</p>
                <p className="mt-4">Assinatura: ________________________</p>
              </div>
            </div>

            <p className="mt-6 text-center text-gray-500">Data: ____ / ____ / ______</p>
          </div>
        </div>

        {/* Generate button */}
        <div className="mt-8 mb-8">
          <Button
            onClick={generatePDF}
            disabled={generating}
            className="w-full py-6 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 rounded-2xl shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Gerando contrato...</>
            ) : (
              <><Download className="w-5 h-5 mr-2" /> Gerar Contrato em PDF</>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ContratoGenerator;
