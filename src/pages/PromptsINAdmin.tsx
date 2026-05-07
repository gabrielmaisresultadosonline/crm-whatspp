import { useState, useEffect, useCallback } from "react";
import { Users, Layers, LogOut, RefreshCw, Search, ShoppingCart, CheckCircle, Clock, XCircle, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface PromptUser {
  id: string;
  name: string;
  email: string;
  status: string;
  last_access: string | null;
  created_at: string;
  is_paid: boolean;
  subscription_end: string | null;
}

interface PromptOrder {
  id: string;
  email: string;
  name: string | null;
  amount: number;
  plan_type: string;
  status: string;
  stripe_session_id: string | null;
  paid_at: string | null;
  created_at: string;
}

const callAdmin = async (action: string, body?: any) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/promptsin-admin?action=${action}`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

const PromptsINAdmin = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"users" | "orders">("users");
  const [users, setUsers] = useState<PromptUser[]>([]);
  const [orders, setOrders] = useState<PromptOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    const data = await callAdmin('get-users');
    if (data.users) setUsers(data.users);
  }, []);

  const loadOrders = useCallback(async () => {
    const data = await callAdmin('get-orders');
    if (data.orders) setOrders(data.orders);
  }, []);

  useEffect(() => {
    if (isAuth) {
      loadUsers();
      loadOrders();
    }
  }, [isAuth, loadUsers, loadOrders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await callAdmin('login', { email, password });
    if (data.success) {
      setIsAuth(true);
      toast.success("Login successful!");
    } else {
      toast.error("Invalid credentials");
    }
  };

  const handleGrantPlan = async (userId: string, planType: 'mensal' | 'anual') => {
    const label = planType === 'mensal' ? 'Monthly (30 days)' : 'Annual (365 days)';
    if (!confirm(`Grant ${label} plan to this user?`)) return;
    const data = await callAdmin('grant-plan', { user_id: userId, plan_type: planType });
    if (data.success) {
      toast.success(`${label} plan granted!`);
      loadUsers();
    } else {
      toast.error(data.error || 'Error granting plan');
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-4">
        <div className="bg-[#111118] border border-white/10 rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-1">AI Prompts Admin</h1>
          <p className="text-gray-500 text-sm mb-6">Access the admin panel</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
            <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-lg">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <header className="bg-[#0a0a10] border-b border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">AI Prompts <span className="text-purple-400">Admin</span> <span className="text-xs text-gray-500">(International)</span></h1>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 rounded-lg p-1">
              <button onClick={() => setTab("users")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'users' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Users className="w-4 h-4 inline mr-1" /> Users ({users.length})
              </button>
              <button onClick={() => setTab("orders")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'orders' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <ShoppingCart className="w-4 h-4 inline mr-1" /> Orders ({orders.length})
              </button>
            </div>
            <button onClick={() => setIsAuth(false)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === "users" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Registered Users ({users.length})</h2>
              <button onClick={loadUsers} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No users registered yet.</div>
            ) : (
              <div className="bg-[#111118] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-left text-gray-400">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">PRO</th>
                        <th className="px-4 py-3">Expires</th>
                        <th className="px-4 py-3">Registered</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-medium">{user.name}</td>
                          <td className="px-4 py-3 text-gray-400">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {user.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {user.is_paid ? <span className="text-green-400 text-xs font-bold">PRO</span> : <span className="text-gray-600 text-xs">Free</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{user.subscription_end ? new Date(user.subscription_end).toLocaleDateString('en-US') : '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString('en-US')}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              <button onClick={() => handleGrantPlan(user.id, 'mensal')} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 whitespace-nowrap" title="Grant Monthly (30 days)">30d</button>
                              <button onClick={() => handleGrantPlan(user.id, 'anual')} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-green-500/10 text-green-400 hover:bg-green-500/20 whitespace-nowrap" title="Grant Annual (365 days)">365d</button>
                              <button onClick={async () => {
                                const newStatus = user.status === 'active' ? 'inactive' : 'active';
                                await callAdmin('toggle-user', { id: user.id, status: newStatus });
                                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
                                toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
                              }} className={`p-1.5 rounded-lg ${user.status === 'active' ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>
                                {user.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button onClick={async () => {
                                if (!confirm("Delete this user?")) return;
                                await callAdmin('delete-user', { id: user.id });
                                setUsers(prev => prev.filter(u => u.id !== user.id));
                                toast.success("User deleted");
                              }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Orders ({orders.length})</h2>
              <button onClick={loadOrders} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total", count: orders.length, color: "text-white" },
                { label: "Pending", count: orders.filter(o => o.status === "pending").length, color: "text-yellow-400" },
                { label: "Paid", count: orders.filter(o => o.status === "paid").length, color: "text-green-400" },
                { label: "Expired", count: orders.filter(o => o.status === "expired").length, color: "text-red-400" },
              ].map((s, i) => (
                <div key={i} className="bg-[#111118] border border-white/10 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No orders yet.</div>
            ) : (
              <div className="bg-[#111118] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-left text-gray-400">
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Paid at</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className={`border-b border-white/5 hover:bg-white/[0.02] ${order.status === 'expired' ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 text-gray-300">{order.email}</td>
                          <td className="px-4 py-3 font-medium capitalize">{order.plan_type}</td>
                          <td className="px-4 py-3 text-green-400 font-bold">${order.amount}</td>
                          <td className="px-4 py-3">
                            {order.status === 'paid' && <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Paid</span>}
                            {order.status === 'pending' && <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>}
                            {order.status === 'expired' && <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Expired</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleString('en-US')}</td>
                          <td className="px-4 py-3 text-gray-500">{order.paid_at ? new Date(order.paid_at).toLocaleString('en-US') : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {order.status === 'pending' && (
                                <button onClick={async () => {
                                  if (!confirm("Mark as PAID manually?")) return;
                                  await callAdmin('mark-order-paid', { id: order.id });
                                  toast.success("Order marked as paid");
                                  loadOrders();
                                }} className="px-2 py-1 rounded-lg text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20">
                                  ✓ Pay
                                </button>
                              )}
                              <button onClick={async () => {
                                if (!confirm("Delete this order?")) return;
                                await callAdmin('delete-order', { id: order.id });
                                setOrders(prev => prev.filter(o => o.id !== order.id));
                                toast.success("Order deleted");
                              }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptsINAdmin;
