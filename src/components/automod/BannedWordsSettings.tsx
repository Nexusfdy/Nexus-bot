import React, { useState } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { AutoModSettings } from '../../types';

interface BannedWordsSettingsProps {
  settings: AutoModSettings;
  handleAddWord: (word: string) => Promise<boolean>;
  handleRemoveWord: (word: string) => Promise<void>;
  savingWord: boolean;
  error: string | null;
}

export default function BannedWordsSettings({ settings, handleAddWord, handleRemoveWord, savingWord, error }: BannedWordsSettingsProps) {
  const [newWord, setNewWord] = useState('');
  
  const submitWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleAddWord(newWord);
    if (success) {
      setNewWord('');
    }
  };

  return (
    <div className="xl:col-span-1 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl h-full flex flex-col">
        <div className="border-b border-slate-850 pb-3 mb-4">
          <h2 className="text-sm font-bold font-display text-white flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Filter Kata (Blacklist)</span>
          </h2>
          <p className="text-[11px] text-slate-500">Kata-kata yang memicu sensor otomatis ketika diketik oleh pengguna.</p>
        </div>

        <form onSubmit={submitWord} className="mb-4 space-y-2">
          <div className="relative">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Contoh: penipu"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors pr-10"
              maxLength={30}
              disabled={savingWord}
            />
            <button
              type="submit"
              disabled={!newWord.trim() || savingWord}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-[10px] text-rose-400 font-semibold">{error}</p>}
        </form>

        <div className="flex-1 bg-slate-950/40 rounded-xl border border-slate-850 p-4">
          {(!settings.bannedWords || settings.bannedWords.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-6">
              <span className="text-xs font-semibold text-slate-500">Daftar blokir kosong.<br/>Tambahkan kata pemicu di atas.</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[300px]">
              {settings.bannedWords.map((word, idx) => (
                <div 
                  key={idx}
                  className="bg-rose-950/30 border border-rose-900/40 text-rose-300 text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 group select-none transition-colors hover:border-rose-500/50 hover:bg-rose-900/30"
                >
                  <span className="max-w-[120px] truncate">{word}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveWord(word)}
                    className="text-rose-500/70 hover:text-rose-400 focus:outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
