import React from 'react';
import { Activity, Code, Sparkles } from 'lucide-react';
import { BotConfig } from '../../types';

interface BotIdentityFieldsProps {
  prefix: string;
  setPrefix: (val: string) => void;
  statusType: BotConfig['statusType'];
  setStatusType: (val: BotConfig['statusType']) => void;
  statusText: string;
  setStatusText: (val: string) => void;
  setIsDirty: (val: boolean) => void;
}

export default function BotIdentityFields({
  prefix, setPrefix, statusType, setStatusType, statusText, setStatusText, setIsDirty
}: BotIdentityFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800/50 pb-2">
        <Activity className="w-4 h-4 text-emerald-400" />
        <span>Identitas & Interaksi Server</span>
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">Command Prefix</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Code className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={prefix}
              onChange={e => { setPrefix(e.target.value); setIsDirty(true); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-bold"
              placeholder="!"
            />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">Jenis Aktivitas</label>
          <select
            value={statusType}
            onChange={e => { setStatusType(e.target.value as any); setIsDirty(true); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium appearance-none"
          >
            <option value="PLAYING">Sedang Bermain (Playing)</option>
            <option value="WATCHING">Sedang Menonton (Watching)</option>
            <option value="LISTENING">Sedang Mendengar (Listening)</option>
            <option value="STREAMING">Sedang Streaming (Streaming)</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">Teks Activity Status</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={statusText}
              onChange={e => { setStatusText(e.target.value); setIsDirty(true); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="Nexus Auto-Store | /buy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
