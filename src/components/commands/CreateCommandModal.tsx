import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { CustomCommand } from '../../types';

interface CreateCommandModalProps {
  onClose: () => void;
  onAddCommand: (cmd: Omit<CustomCommand, 'id' | 'usageCount'>) => Promise<void>;
}

export default function CreateCommandModal({ onClose, onAddCommand }: CreateCommandModalProps) {
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
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <h2 className="font-display font-bold text-white text-md">Buat Perintah Kustom Baru</h2>
          <button 
            onClick={onClose}
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
              onClick={onClose}
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
  );
}
