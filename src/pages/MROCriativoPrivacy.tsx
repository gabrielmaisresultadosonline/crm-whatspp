import { Logo } from "@/components/Logo";

const MROCriativoPrivacy = () => {
  return (
    <div className="min-h-screen bg-[#050508] text-white py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <Logo size="lg" />
          <h1 className="text-4xl font-black tracking-tight">Política de Privacidade</h1>
          <p className="text-gray-400">MRO Criativo - Sua segurança em primeiro lugar</p>
        </div>

        <section className="glass-card p-8 border-white/10 space-y-8 leading-relaxed text-gray-300">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">1. Coleta de Dados</h2>
            <p>
              Coletamos apenas as informações necessárias para o funcionamento da plataforma, como nome, e-mail e dados públicos do perfil do Instagram 
              autorizados através do login oficial do Facebook/Meta.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">2. Uso das APIs da Meta</h2>
            <p>
              Utilizamos as APIs oficiais do Instagram Graph para leitura de métricas e postagem agendada, sempre respeitando os tokens de acesso 
              e permissões concedidas por você. Nunca armazenamos sua senha do Instagram.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">3. Segurança dos Dados</h2>
            <p>
              Seus dados são criptografados e armazenados em servidores seguros. Não compartilhamos suas informações pessoais com terceiros 
              para fins publicitários.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">4. Cookies</h2>
            <p>
              Utilizamos cookies para manter sua sessão ativa e melhorar sua experiência de navegação na plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">5. Seus Direitos (LGPD)</h2>
            <p>
              Você tem o direito de acessar, corrigir ou excluir seus dados a qualquer momento através das configurações da sua conta ou 
              solicitando ao nosso suporte.
            </p>
          </div>

          <div className="pt-8 border-t border-white/5 text-center text-sm text-gray-500">
            Dúvidas? Entre em contato: contato@maisresultadosonline.com.br
          </div>
        </section>
      </div>
    </div>
  );
};

export default MROCriativoPrivacy;
