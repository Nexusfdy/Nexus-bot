import React from 'react';
import { CustomCommand } from '../../types';

interface CommandsLeaderboardProps {
  commands: CustomCommand[];
}

export default function CommandsLeaderboard({ commands }: CommandsLeaderboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="commands-stats">
      {commands.slice(0, 3).map((cmd, idx) => (
        <div key={cmd.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] text-indigo-400 font-semibold uppercase font-mono">Top Command #{idx + 1}</span>
            <h4 className="text-sm font-bold text-white font-mono">/{cmd.name}</h4>
            <p className="text-xs text-slate-400 truncate max-w-[170px]">{cmd.description}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block font-mono">Dijalankan</span>
            <span className="text-md font-bold text-emerald-400 font-mono">{cmd.usageCount || 0}x</span>
          </div>
        </div>
      ))}
      {commands.length === 0 && (
        <div className="col-span-3 py-6 bg-slate-900/40 border border-slate-850 rounded-xl text-center text-xs text-slate-500">
          Pemicu perintah belum terdaftar. Buat baru di pojok kanan atas!
        </div>
      )}
    </div>
  );
}
