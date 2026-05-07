import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  aula_liberada: boolean;
  email_enviado: boolean;
  created_at: string;
}

interface Analytics {
  total_visits: number;
  today_visits: number;
  total_leads: number;
  today_leads: number;
  total_paid: number;
  today_revenue: number;
}

interface Order {
  id: string;
  email: string;
  username: string;
  status: string;
  amount: number;
  phone: string | null;
  created_at: string;
  paid_at: string | null;
}

const RendaExtraAulaAdmin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ 
    total_visits: 0, today_visits: 0, total_leads: 0, today_leads: 0, total_paid: 0, today_revenue: 0 
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "leads" | "orders">("dashboard");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("renda-extra-aula-register", {
        body: { action: "adminLogin", email, password }
      });
      if (error || !data?.success) throw new Error(data?.error || "Credenciais inválidas");
      setIsLoggedIn(true);
      loadData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("renda-extra-aula-register", {
        body: { action: "adminGetData" }
      });
      if (error) throw error;
      setLeads(data.leads || []);
      setOrders(data.orders || []);
      setAnalytics(data.analytics || {});
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const withCountry = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    return `https://wa.me/${withCountry}`;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-white text-center">🔒 Admin - Renda Extra Aula</h1>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white" />
          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white" />
          <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-xl">{loading ? "..." : "Entrar"}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">📊 Admin - Renda Extra Aula</h1>
          <button onClick={loadData} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm">🔄 Atualizar</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["dashboard", "leads", "orders"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === t ? "bg-yellow-500 text-black" : "bg-gray-800 text-gray-300"}`}>
              {t === "dashboard" ? "📊 Dashboard" : t === "leads" ? `👥 Leads (${leads.length})` : `💰 Pagos (${orders.filter(o => o.status === 'completed').length})`}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Visitas Totais", value: analytics.total_visits, color: "blue" },
              { label: "Visitas Hoje", value: analytics.today_visits, color: "cyan" },
              { label: "Leads Totais", value: analytics.total_leads, color: "green" },
               { label: "Leads Hoje", value: analytics.today_leads, color: "yellow" },
               { label: "Pagos Total", value: analytics.total_paid, color: "green" },
               { label: "Receita Hoje", value: `R$ ${analytics.today_revenue}`, color: "emerald" },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value || 0}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "orders" && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left p-3">Email/User</th>
                    <th className="text-left p-3">WhatsApp</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Valor</th>
                    <th className="text-left p-3">Data Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3">
                        <div className="font-medium">{order.email}</div>
                        <div className="text-xs text-gray-500">@{order.username}</div>
                      </td>
                      <td className="p-3">
                        {order.phone ? (
                          <a href={formatPhone(order.phone)} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">
                            📱 {order.phone}
                          </a>
                        ) : "-"}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' : order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3">R$ {order.amount}</td>
                      <td className="p-3 text-gray-500 text-xs">
                        {order.paid_at ? new Date(order.paid_at).toLocaleString("pt-BR") : "-"}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum pedido ainda</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "leads" && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">WhatsApp</th>
                    <th className="text-left p-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3 font-medium">{lead.nome_completo}</td>
                      <td className="p-3 text-gray-400">{lead.email}</td>
                      <td className="p-3">
                        <a href={formatPhone(lead.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">
                          📱 {lead.whatsapp}
                        </a>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum lead ainda</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RendaExtraAulaAdmin;
