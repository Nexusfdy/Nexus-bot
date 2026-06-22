import React from 'react';
import { RefreshCw } from 'lucide-react';

interface BotStatusCardProps {
  botOnline: boolean;
  botStatus: "ONLINE" | "CONNECTING" | "OFFLINE" | "ERROR";
  botError: any;
  botUser?: any;
  restarting: boolean;
  onRestartBot: () => void;
}

export default function BotStatusCard({
  botStatus, botError, botUser, restarting, onRestartBot
}: BotStatusCardProps) {
  return (
    <div className="p-4 mx-4 my-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-3">
      {botUser && botStatus === 'ONLINE' && (
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
          {botUser.avatar ? (
            <img 
              src={botUser.avatar} 
              alt={botUser.tag} 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl border border-indigo-500/30 object-cover shadow"
            />
          ) : (
            <div className="w-10 h-10 bg-indigo-950/80 rounded-xl border border-indigo-500/30 flex items-center justify-center">
              <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase">{botUser.tag?.slice(0, 2)}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-white block truncate leading-tight">{botUser.tag}</span>
            <span className="text-[9px] text-slate-500 font-mono block truncate mt-0.5" title="Copyable Bot Client ID">ID: {botUser.id}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400 shrink-0">Status Bot Discord</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
            botStatus === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' :
            botStatus === 'CONNECTING' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
            botStatus === 'ERROR' ? 'bg-rose-500/10 text-rose-400' :
            'bg-slate-500/10 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              botStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' :
              botStatus === 'CONNECTING' ? 'bg-amber-400 animate-spin' :
              botStatus === 'ERROR' ? 'bg-rose-500' :
              'bg-slate-500'
            }`} />
            {botStatus}
          </span>
        </div>
        {botError && (
          <div className={`text-[10px] font-mono leading-relaxed p-2 px-2.5 rounded border max-h-24 overflow-y-auto break-words whitespace-pre-wrap ${
            botStatus === 'ONLINE' 
              ? 'bg-amber-500/5 border-amber-500/15 text-amber-400' 
              : 'bg-rose-500/5 border-rose-500/15 text-rose-400'
          }`}>
            {botStatus === 'ONLINE' ? '⚠️ ' : '❌ '}{typeof botError === 'object' ? (botError as any).message || (botError as any).code || JSON.stringify(botError) : String(botError)}
          </div>
        )}
      </div>
      
      <button
        onClick={onRestartBot}
        disabled={restarting}
        className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border transition-all ${
          restarting 
            ? 'bg-slate-850 text-slate-400 border-slate-800 cursor-not-allowed'
            : 'bg-slate-900 text-white border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850'
        }`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${restarting ? 'animate-spin' : ''}`} />
        {restarting ? 'Me-reboot core system...' : 'Sinkronisasi & Restart Bot'}
      </button>
    </div>
  );
}
