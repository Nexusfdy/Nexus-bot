import React from 'react';
import { Cpu, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { CustomCommand } from '../../types';

interface CommandListProps {
  commands: CustomCommand[];
  onToggleCommand: (id: string, active: boolean) => Promise<void>;
  onDeleteCommand: (id: string) => Promise<void>;
}

export default function CommandList({ commands, onToggleCommand, onDeleteCommand }: CommandListProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-850 flex items-center justify-between bg-slate-950/20">
        <h2 className="text-sm font-bold font-display text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Katalog Perintah Real-Time ({commands.length})</span>
        </h2>
        <span className="text-[10px] text-slate-500 uppercase font-mono">Semua perintah di-sync real-time</span>
      </div>

      <div className="divide-y divide-slate-850">
        {commands.length > 0 ? (
          commands.map((cmd) => (
            <div key={cmd.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-950/10 transition-colors">
              {/* Command metadata details */}
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-2.5">
                  <span className="bg-indigo-600/10 text-indigo-400 font-mono text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-500/10">
                    /{cmd.name}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Stat: <strong className="text-emerald-400 font-semibold">{cmd.usageCount || 0}x</strong> run
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold ${
                    cmd.isActive 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {cmd.isActive ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-semibold">{cmd.description || 'Tidak ada deskripsi.'}</p>
                
                {/* Replier Preview */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed max-w-full">
                  {cmd.response}
                </div>
              </div>

              {/* Operations */}
              <div className="flex items-center space-x-2 shrink-0 md:self-center">
                <button
                  type="button"
                  onClick={() => onToggleCommand(cmd.id, !cmd.isActive)}
                  className="p-1 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  {cmd.isActive ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-indigo-400" />
                      <span>Matikan</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-slate-500" />
                      <span>Hidupkan</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCommand(cmd.id)}
                  className="p-2.5 bg-slate-950 hover:bg-rose-950 hover:border-rose-900 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-slate-500 text-sm">
            Belum ada perintah kustom. Klik "Buat Perintah Baru" untuk mendaftarkan pemicu sapaan / aturan!
          </div>
        )}
      </div>
    </div>
  );
}
