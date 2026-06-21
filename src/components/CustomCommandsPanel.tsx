import React, { useState } from 'react';
import { 
  Cpu, 
  Trash2, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  Code, 
  HelpCircle, 
  Check, 
  X,
  TrendingUp,
  Award
} from 'lucide-react';
import { CustomCommand } from '../types';

interface CustomCommandsPanelProps {
  commands: CustomCommand[];
  onAddCommand: (cmd: Omit<CustomCommand, 'id' | 'usageCount'>) => Promise<void>;
  onToggleCommand: (id: string, active: boolean) => Promise<void>;
  onDeleteCommand: (id: string) => Promise<void>;
}

export default function CustomCommandsPanel({ 
  commands, 
  onAddCommand, 
  onToggleCommand, 
  onDeleteCommand 
}: CustomCommandsPanelProps) {
  
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanName || !response) return;

    setSaving(true);
    try {
      await onAddCommand({
        name: cleanName,
        description: description.trim(),
        response: response.trim(),
        isActive: true
      });
      setShowModal(false);
      setName('');
      setDescription('');
      setResponse('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex items-center justify-between" id="commands-header">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Kustomisasi Perintah (Custom Commands)</h1>
          <p className="text-xs text-slate-400">Buat perintah baru secara dinamis. Hasilnya langsung bisa dipakai di Discord via prefix atau slash commands!</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Perintah Baru</span>
        </button>
      </div>

      {/* Usage leaderboard stats */}
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

      {/* Main Grid listing of Custom Commands */}
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

      {/* CREATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h2 className="font-display font-bold text-white text-md">Buat Perintah Kustom Baru</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-medium">Sintaks Pemicu Perintah *</label>
                  <span className="text-[10px] text-slate-500 font-mono">Hurus kecil, tanpa spasi</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-mono text-xs text-slate-500">/</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: spekpc"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Penjelasan / Deskripsi *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: Menampilkan informasi spesifikasi server hosting"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none text-white placeholder-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Teks Balasan Bot (Mendukung Markdown Discord) *</label>
                <textarea
                  required
                  rows={5}
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  placeholder="Gunakkan **tebal**, *miring*, atau markdown list untuk memperindah respon.&#10;&#10;Contoh:&#10;🚀 **SPESIFIKASI HOSTING NYA**:&#10;- Core Intel CPU 4.2 GHz&#10;- 16GB DDR4 RAM&#10;- SSD NVMe Gen4 Storage"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono resize-none placeholder-slate-75"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium px-4 py-2 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Daftarkan Perintah</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
