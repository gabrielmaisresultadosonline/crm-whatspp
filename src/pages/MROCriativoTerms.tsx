import { Logo } from "@/components/Logo";

const MROCriativoTerms = () => {
  return (
    <div className="min-h-screen bg-[#050508] text-white py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <Logo size="lg" />
          <h1 className="text-4xl font-black tracking-tight">Termos de Uso</h1>
          <p className="text-gray-400">MRO Criativo - Inteligência Artificial para Instagram</p>
        </div>

        <section className="glass-card p-8 border-white/10 space-y-8 leading-relaxed text-gray-300">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o MRO Criativo, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não deverá utilizar nossa plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">2. Descrição do Serviço</h2>
            <p>
              O MRO Criativo é uma ferramenta de auxílio estratégico que utiliza Inteligência Artificial para analisar perfis públicos do Instagram, 
              sugerir estratégias de conteúdo e gerar materiais criativos. Não somos uma ferramenta oficial da Meta, mas utilizamos suas APIs oficiais 
              quando necessário e autorizado pelo usuário.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">3. Responsabilidades do Usuário</h2>
            <p>
              O usuário é o único responsável pelo conteúdo publicado em sua conta do Instagram. O MRO Criativo fornece apenas sugestões e ferramentas 
              de criação. O uso indevido da plataforma para spam, conteúdo ilegal ou que viole as diretrizes da comunidade do Instagram é estritamente proibido.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">4. Propriedade Intelectual</h2>
            <p>
              Os algoritmos e a plataforma MRO Criativo são de propriedade exclusiva da Mais Resultados Online. 
              O conteúdo gerado pela IA para o usuário (legendas, estratégias) pode ser utilizado livremente pelo usuário para seus fins comerciais.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">5. Limitação de Responsabilidade</h2>
            <p>
              Não garantimos resultados específicos de crescimento ou engajamento, pois estes dependem de diversos fatores externos e algoritmos de terceiros. 
              A plataforma é fornecida "como está".
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">6. Alterações nos Termos</h2>
            <p>
              Reservamos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas aos usuários ativos.
            </p>
          </div>

          <div className="pt-8 border-t border-white/5 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} MRO – Mais Resultados Online. CNPJ: 54.840.738/0001-96
          </div>
        </section>
      </div>
    </div>
  );
};

export default MROCriativoTerms;
