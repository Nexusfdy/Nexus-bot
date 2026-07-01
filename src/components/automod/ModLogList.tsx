import React from 'react';
import { Clock, ShieldAlert, Hash, ShieldCheck } from 'lucide-react';
import { ModLog } from '../../types';

interface ModLogListProps {
  modLogs: ModLog[];
  onClearLogs: () => Promise<void>;
}

export default function ModLogList({ modLogs, onClearLogs }: ModLogListProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
        <h2 className="text-sm font-bold font-display text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <span>Riwayat Tindakan Moderasi Bot</span>
        </h2>
        {modLogs.length > 0 && (
          <button
            type="button"
            onClick={onClearLogs}
            className="text-[10px] uppercase font-bold text-rose-400 hover:underline"
          >
            Bersihkan Log
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
        {modLogs.length > 0 ? (
          modLogs.map((log) => {
            const dateStr = new Date(log.timestamp).toLocaleDateString('id-ID', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const isWarn = log.action === 'WARN';
            const actionColor = isWarn ? 'text-amber-400' : 'text-rose-400';
            const bgHover = isWarn ? 'hover:border-amber-500/30 hover:bg-amber-500/5' : 'hover:border-rose-500/30 hover:bg-rose-500/5';

            return (
              <div 
                key={log.id} 
                className={`p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-start gap-3 transition-colors ${bgHover}`}
              >
                <div className={`mt-0.5 ${actionColor}`}>
                  {isWarn ? <ShieldAlert className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                </div>
                <div className="space-y-1 w-full min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      @{log.username}
                    </span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${isWarn ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' : 'bg-rose-400/10 border-rose-400/20 text-rose-400'}`}>
                      {log.action}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">
                      {log.reason}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Hash className="w-3 h-3 text-slate-600" />
                    <span className="text-[9px] font-mono text-slate-600 truncate">{log.userId}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 px-4">
            <ShieldCheck className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">Log bersih. Belum ada catatan teguran.</p>
          </div>
        )}
      </div>
    </div>
  );
}
