import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { Order } from '../../types';

interface SimulatorGuideProps {
  activeOrders: Order[];
  handleSimulatePayment: (channel: string) => void;
  activeChannel: string;
}

export default function SimulatorGuide({ activeOrders, handleSimulatePayment, activeChannel }: SimulatorGuideProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      <div className="space-y-4">
        <h2 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
          <Terminal className="text-amber-400 w-4.5 h-4.5" />
          <span>Panduan Simulator Bot</span>
        </h2>
        <div className="text-[11px] text-slate-400 leading-normal space-y-3">
          <p>Gunakan simulator interaktif di samping kanan untuk menguji fungsionalitas pengiriman otomatis dan sensor auto moderasi.</p>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 font-mono space-y-2 text-slate-300">
            <span className="text-indigo-400 font-semibold block">COBA UTAS BERIKUT:</span>
            <ul className="space-y-1">
              <li>1. Ketik <span className="text-slate-100 font-bold">/stock</span></li>
              <li>2. Ketik <span className="text-slate-100 font-bold">/buy prod-nitro-1m</span></li>
              <li>3. Klik tombol <span className="text-emerald-400 font-bold">SIMULASI QRIS DITERIMA</span></li>
              <li>4. Ketik <span className="text-slate-100 font-bold">/claim [ORDER_ID]</span></li>
            </ul>
          </div>
          <div className="p-3 bg-rose-950/10 rounded-xl border border-rose-900/10 font-mono space-y-1.5 text-slate-300">
            <span className="text-rose-400 font-semibold block">PENGUJIAN MODERASI:</span>
            <p>Masuk ke channel <strong className="text-slate-100">#chat-bebas</strong>, ketik kata sembarang seperti "anjing" atau taruh link url. Lihat respon instan bot!</p>
          </div>
        </div>
      </div>
      <div className="space-y-2.5 pt-4 border-t border-slate-850">
        <button onClick={() => handleSimulatePayment(activeChannel)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md">
          <Check className="w-4 h-4" /><span>Simulasi QRIS Diterima</span>
        </button>
        <div className="p-3 bg-slate-950/45 rounded-lg border border-slate-850 text-center">
          <span className="text-[10px] text-slate-500 font-mono block">Order ID Menunggu Klaim:</span>
          <div className="flex items-center justify-center gap-1.5 mt-1 font-mono text-xs font-bold text-slate-200">
            {activeOrders.find(o => o.status === 'Success') ? (
              <>
                <span>{activeOrders.find(o => o.status === 'Success')?.id}</span>
                <button onClick={() => copyToClipboard(activeOrders.find(o => o.status === 'Success')?.id || '', 'ord-active')} className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copiedId === 'ord-active' && <span className="text-[9px] text-emerald-400">Copied!</span>}
              </>
            ) : <span className="text-slate-500 italic">None</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
