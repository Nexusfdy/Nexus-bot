import React from 'react';
import { ShieldCheck, Activity, MessageSquare, Key, Lock } from 'lucide-react';
import { BotConfig } from '../../types';

interface BotProfileFeaturesProps {
  config: BotConfig;
  botToken: string;
}

export default function BotProfileFeatures({ config, botToken }: BotProfileFeaturesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Auto-Delivery Stock</h3>
            {config.autoClaimOnPayment ? (
              <p className="text-sm font-bold text-emerald-400">Aktif (Klaim Instan)</p>
            ) : (
              <p className="text-sm font-bold text-amber-400">Nonaktif (Set Manual)</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Status Rich Presence (Aktivitas)</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                Sedang <span className="text-indigo-400 font-bold">{config.statusType}</span>
              </span>
              <span className="text-xs font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-slate-300 truncate max-w-[120px]">
                "{config.statusText}"
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors md:col-span-2">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="w-full">
            <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Pesan Sapaan Otomatis (Selamat Datang)</h3>
            <div className="bg-slate-900 border-l-2 border-blue-500 p-3 rounded-r-xl">
              <p className="text-sm font-medium text-slate-300 italic">
                "{config.greetingMessage || "Tidak ada pesan sapaan"}"
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors md:col-span-2 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-2.5 bg-slate-900 text-slate-400 rounded-xl border border-slate-800 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div className="w-full">
            <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Token Discord Kredensial (Disembunyikan)</h3>
            <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-3 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300 truncate">
                <Lock className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                <span>••••••••••••••••••••••••••••••••{botToken.slice(-6)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
