import React from 'react';
import { Bot, HelpCircle, Eye, EyeOff } from 'lucide-react';

interface BotTokenFieldProps {
  botToken: string;
  setBotToken: (val: string) => void;
  showToken: boolean;
  setShowToken: (val: boolean) => void;
  setIsDirty: (val: boolean) => void;
}

export default function BotTokenField({
  botToken, setBotToken, showToken, setShowToken, setIsDirty
}: BotTokenFieldProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800/50 pb-2">
        <Bot className="w-4 h-4 text-indigo-400" />
        <span>Token Discord Bot (Inti)</span>
      </h3>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">Bot Token Rahasia</label>
        <div className="relative group">
          <input
            type={showToken ? "text" : "password"}
            value={botToken}
            onChange={e => { setBotToken(e.target.value); setIsDirty(true); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
            placeholder="MTAxMzI5NTA4NTk1..."
          />
          <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors p-1" title={showToken ? "Sembunyikan Token" : "Tampilkan Token"}>
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 pl-1 flex items-start gap-1">
          <HelpCircle className="w-3 h-3 text-indigo-500/70 shrink-0 mt-0.5" />
          <span>Format Bot Token akan segera disimpan langsung ke aman Database. Kosongkan untuk menonaktifkan Discord integrasi.</span>
        </p>
      </div>
    </div>
  );
}
