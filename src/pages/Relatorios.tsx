import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, Lock, TrendingUp, Users, BarChart3, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

const CORRECT_EMAIL = "mro@gmail.com";
const CORRECT_PASSWORD = "Ga145523@";

const empresas = [
  { nome: "Pizzaria Bella Napoli", nicho: "Pizzaria", valor: 600 },
  { nome: "Pizzaria Forno & Massa", nicho: "Pizzaria", valor: 600 },
  { nome: "Pizzaria Don Pietro", nicho: "Pizzaria", valor: 600 },
  { nome: "Pizzaria Sabor Supremo", nicho: "Pizzaria", valor: 600 },
  { nome: "Pizzaria La Famiglia", nicho: "Pizzaria", valor: 600 },
  { nome: "Pizzaria Crosta Dourada", nicho: "Pizzaria", valor: 600 },
  { nome: "Academia Iron Fitness", nicho: "Academia", valor: 1000 },
  { nome: "Academia Corpo & Mente", nicho: "Academia", valor: 1000 },
  { nome: "Academia Power Gym", nicho: "Academia", valor: 1000 },
  { nome: "Academia Vida Ativa", nicho: "Academia", valor: 1000 },
  { nome: "Academia Elite Training", nicho: "Academia", valor: 1000 },
  { nome: "Academia Force Center", nicho: "Academia", valor: 1000 },
  { nome: "Dr. Marcos Oliveira - Dentista", nicho: "Dentista", valor: 400 },
  { nome: "Clínica Sorriso Perfeito", nicho: "Dentista", valor: 400 },
  { nome: "Odonto Prime Clínica", nicho: "Dentista", valor: 400 },
  { nome: "Dra. Ana Beatriz - Ortodontia", nicho: "Dentista", valor: 400 },
  { nome: "Clínica Dental Care Plus", nicho: "Dentista", valor: 400 },
  { nome: "Dr. Rafael Lima - Implantes", nicho: "Dentista", valor: 400 },
  { nome: "Advocacia Torres & Associados", nicho: "Advogado", valor: 1000 },
  { nome: "Dr. Fernando Mendes - Advocacia", nicho: "Advogado", valor: 1000 },
  { nome: "Escritório Jurídico Capital", nicho: "Advogado", valor: 1000 },
  { nome: "Dra. Camila Rocha - Direito Civil", nicho: "Advogado", valor: 1000 },
  { nome: "Advocacia Silva & Partners", nicho: "Advogado", valor: 1000 },
  { nome: "Dr. Lucas Andrade - Trabalhista", nicho: "Advogado", valor: 1000 },
];

const nichoColors: Record<string, string> = {
  Pizzaria: "#f97316",
  Academia: "#8b5cf6",
  Dentista: "#06b6d4",
  Advogado: "#eab308",
};

const monthlyData = [
  { mes: "Jan", receita: 14200 },
  { mes: "Fev", receita: 15800 },
  { mes: "Mar", receita: 16400 },
  { mes: "Abr", receita: 17200 },
  { mes: "Mai", receita: 17600 },
  { mes: "Jun", receita: 18000 },
];

const Relatorios = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === CORRECT_EMAIL && password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Email ou senha incorretos");
    }
  };

  const totalReceita = empresas.reduce((acc, e) => acc + e.valor, 0);

  const nichoData = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    empresas.forEach((e) => {
      if (!grouped[e.nicho]) grouped[e.nicho] = { total: 0, count: 0 };
      grouped[e.nicho].total += e.valor;
      grouped[e.nicho].count += 1;
    });
    return Object.entries(grouped).map(([nicho, data]) => ({
      name: nicho,
      valor: data.total,
      count: data.count,
      fill: nichoColors[nicho] || "#10b981",
    }));
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_60%)]" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <Card className="w-full max-w-sm p-8 bg-gray-900/80 border-gray-800/50 backdrop-blur-xl relative z-10 animate-scale-in shadow-2xl shadow-emerald-500/5">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Relatórios MRO</h1>
              <p className="text-gray-400 text-sm mt-1">Acesso restrito</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-800/60 border-gray-700/50 text-white h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20" />
            <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-800/60 border-gray-700/50 text-white h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20" />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-base shadow-lg shadow-emerald-500/20 transition-all duration-300">
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.06)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.04)_0%,_transparent_50%)]" />

      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Relatório de Empresas MRO Mensalidade
              </h1>
              <p className="text-gray-400 text-sm">Gabriel — Visão geral das empresas ativas</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {[
            { label: "Receita Mensal", value: `R$ ${totalReceita.toLocaleString("pt-BR")}`, icon: DollarSign, gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10", text: "text-emerald-400" },
            { label: "Empresas Ativas", value: String(empresas.length), icon: Users, gradient: "from-cyan-500 to-cyan-600", bg: "bg-cyan-500/10", text: "text-cyan-400" },
            { label: "Ticket Médio", value: `R$ ${Math.round(totalReceita / empresas.length)}`, icon: TrendingUp, gradient: "from-violet-500 to-violet-600", bg: "bg-violet-500/10", text: "text-violet-400" },
            { label: "Nichos Ativos", value: "4", icon: BarChart3, gradient: "from-amber-500 to-amber-600", bg: "bg-amber-500/10", text: "text-amber-400" },
          ].map((stat, i) => (
            <Card key={i} className="bg-gray-900/60 border-gray-800/40 backdrop-blur-sm p-4 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className={`text-xl md:text-2xl font-bold ${stat.text}`}>{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Revenue Trend */}
          <Card className="bg-gray-900/60 border-gray-800/40 backdrop-blur-sm p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-semibold text-sm">Evolução da Receita</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", color: "#fff", fontSize: "13px" }}
                    formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]}
                  />
                  <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} fill="url(#receitaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue by Niche */}
          <Card className="bg-gray-900/60 border-gray-800/40 backdrop-blur-sm p-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-white font-semibold text-sm">Receita por Nicho</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nichoData} barSize={32}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", color: "#fff", fontSize: "13px" }}
                    formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Total"]}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {nichoData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Pie + Legend */}
        <Card className="bg-gray-900/60 border-gray-800/40 backdrop-blur-sm p-5 mb-8 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <h3 className="text-white font-semibold text-sm mb-4">Distribuição por Nicho</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={nichoData} dataKey="valor" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} strokeWidth={2} stroke="#0a0a0f">
                    {nichoData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", color: "#fff", fontSize: "13px" }}
                    formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {nichoData.map((n, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: n.fill }} />
                  <span className="text-gray-300 text-sm">{n.name}</span>
                  <span className="text-gray-500 text-sm">({n.count})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Company List */}
        <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Todas as Empresas
          </h3>
          <div className="space-y-2">
            {empresas.map((empresa, i) => (
              <Card
                key={i}
                className="bg-gray-900/50 border-gray-800/30 backdrop-blur-sm p-4 flex items-center justify-between hover:bg-gray-800/50 transition-all duration-300 group"
                style={{ animationDelay: `${400 + i * 30}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-600 text-xs font-mono w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="w-2 h-8 rounded-full shrink-0" style={{ backgroundColor: nichoColors[empresa.nicho] }} />
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate text-sm group-hover:text-emerald-300 transition-colors">{empresa.nome}</p>
                    <p className="text-gray-500 text-xs">{empresa.nicho}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 text-xs">
                    Ativa
                  </Badge>
                  <span className="text-emerald-400 font-bold text-sm whitespace-nowrap">
                    R$ {empresa.valor.toLocaleString("pt-BR")}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-xs mt-10 pb-6">
          MRO Mensalidade — Relatório confidencial • Gabriel
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
