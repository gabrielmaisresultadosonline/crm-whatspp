const MROCriativoWebhook = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-mono p-4">
      <div className="max-w-md w-full space-y-4">
        <div className="border border-green-500/30 p-4 rounded bg-green-500/5">
          <p className="text-xs opacity-50 mb-2">// MRO Criativo Webhook Listener</p>
          <p className="text-sm">Status: <span className="animate-pulse">ONLINE_WAITING_FOR_DATA</span></p>
          <p className="text-sm">Endpoint: /mrocriativo/webhook</p>
        </div>
        <p className="text-[10px] text-gray-500">Este endpoint é utilizado para receber notificações em tempo real da Meta API.</p>
      </div>
    </div>
  );
};

export default MROCriativoWebhook;
