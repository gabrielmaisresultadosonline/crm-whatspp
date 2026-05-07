const PoliticaDePrivacidadeIG = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 py-12 px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-8">Última atualização: 27 de fevereiro de 2026</p>

      <section className="space-y-6 text-[15px] leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">Quem somos</h2>
          <p>
            Somos a <strong>MRO – Mais Resultados Online</strong>, de responsabilidade de{" "}
            <strong>Gabriel Fernandes da Silva</strong>, inscrita sob o CNPJ{" "}
            <strong>54.840.738/0001-96</strong>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Nunca publicamos por você</h2>
          <p>
            Não postamos, alteramos ou acessamos conteúdo sem permissão. Nosso aplicativo não
            realiza nenhuma ação em nome do usuário nas redes sociais sem autorização explícita.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Dados que coletamos</h2>
          <p>
            Coletamos apenas dados públicos de perfis do Instagram (nome de usuário, foto de
            perfil, biografia, contagem de seguidores e publicações) exclusivamente para fins de
            análise e geração de estratégias de crescimento.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Mensagens e conteúdos privados</h2>
          <p>
            <strong>Não salvamos mensagens</strong> diretas, stories, nem qualquer conteúdo
            privado do usuário. Não temos acesso a conversas, DMs ou qualquer tipo de
            comunicação privada.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Uso dos dados</h2>
          <p>
            Os dados coletados são utilizados exclusivamente para fornecer análises de perfil,
            sugestões de melhoria e estratégias de crescimento. Não compartilhamos, vendemos ou
            distribuímos dados pessoais a terceiros.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Segurança</h2>
          <p>
            Empregamos medidas técnicas e organizacionais para proteger os dados contra acesso
            não autorizado, perda ou destruição.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Seus direitos</h2>
          <p>
            Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato
            conosco. Respeitamos integralmente a Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Contato</h2>
          <p>
            Em caso de dúvidas sobre esta política, entre em contato pelo e-mail:{" "}
            <strong>contato@maisresultadosonline.com</strong>
          </p>
        </div>
      </section>

      <p className="mt-12 text-xs text-gray-400 text-center">
        © {new Date().getFullYear()} MRO – Mais Resultados Online. Todos os direitos reservados.
      </p>
    </div>
  );
};

export default PoliticaDePrivacidadeIG;
