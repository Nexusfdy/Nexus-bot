import React from 'react';
import { ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Order, ModLog } from '../../types';

interface ActivityFeedProps {
  orders: Order[];
  modLogs: ModLog[];
  formatIDR: (num: number) => string;
}

export default function ActivityFeed({ orders, modLogs, formatIDR }: ActivityFeedProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-md font-semibold text-white font-display">Aktivitas Real-time</h2>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-400 animate-pulse">
            • LOGS
          </span>
        </div>

        {/* Scroller logs list */}
        <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
          {orders.slice(0, 4).map((order) => (
            <div key={order.id} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/40 flex items-start gap-2.5">
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                order.status === 'Claimed' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-amber-500/10 text-amber-400'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 truncate">{order.customerUsername}</span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Membeli <span className="text-indigo-400 font-medium">{order.productName}</span> — status: <span className="font-medium text-emerald-400">{order.status}</span>
                </p>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-900 font-mono text-[9px] text-slate-500">
                  <span>ID: {order.id}</span>
                  <span>{formatIDR(order.price)}</span>
                </div>
              </div>
            </div>
          ))}

          {modLogs.length > 0 ? (
            modLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="p-3 bg-rose-950/10 rounded-xl border border-rose-900/10 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-rose-500/10 text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-300 truncate">AutoMod: @{log.username}</span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tindakan: <span className="text-rose-400 font-medium">{log.action}</span> - {log.reason}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              Belum ada log moderasi yang dilaporkan.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Dukungan Webhook: OK</span>
        <span className="text-indigo-400 hover:underline cursor-pointer flex items-center gap-1">
          Selengkapnya <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
