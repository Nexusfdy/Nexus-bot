import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  X,
  PlusCircle,
  HelpCircle,
  Hash
} from 'lucide-react';
import { AutoModSettings, ModLog } from '../types';

interface AutoModPanelProps {
  settings: AutoModSettings;
  onUpdateSettings: (updated: AutoModSettings) => Promise<void>;
  modLogs: ModLog[];
  onClearLogs: () => Promise<void>;
}

export default function AutoModPanel({ 
  settings, 
  onUpdateSettings, 
  modLogs,
  onClearLogs
}: AutoModPanelProps) {
  
  const [newWord, setNewWord] = useState('');
  const [savingWord, setSavingWord] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAntiLink = async () => {
    await onUpdateSettings({
      ...settings,
      antiLink: !settings.antiLink
    });
  };

  const toggleAntiSpam = async () => {
    await onUpdateSettings({
      ...settings,
      antiSpam: !settings.antiSpam
    });
  };

  const handleUpdateWarnLimit = async (limit: number) => {
    await onUpdateSettings({
      ...settings,
      warnLimit: limit
    });
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const word = newWord.trim().toLowerCase();
    if (!word) return;
    if (settings.bannedWords.includes(word)) {
      setError('Kata ini sudah masuk daftar hitam!');
      return;
    }
    
    setSavingWord(true);
    const updatedWords = [...settings.bannedWords, word];
    await onUpdateSettings({
      ...settings,
      bannedWords: updatedWords
    });
    setNewWord('');
    setError(null);
    setSavingWord(false);
  };

  const handleRemoveWord = async (word: string) => {
    const updatedWords = settings.bannedWords.filter(w => w !== word);
    await onUpdateSettings({
      ...settings,
      bannedWords: updatedWords
    });
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between" id="automod-header">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Sistem Keamanan & Auto Moderasi (Auto-Mod)</h1>
          <p className="text-xs text-slate-400">Proteksi server otomatis dari tautan link ilegal, pelaku spamming, dan penggunaan kata-kata toxic</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Core Toggles and Threshold settings (Left: 2 cols) */}
        <div className="xl:col-span-2 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <h2 className="text-sm font-bold font-display text-white border-b border-slate-850 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Proteksi Anti-Spam & Anti-Link</span>
            </h2>

            {/* Toggle Rows */}
            <div className="space-y-4">
              
              {/* Anti Link ToggleRow */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between hover:bg-slate-950/60 transition-all">
                <div className="space-y-0.5 max-w-[80%]">
                  <h3 className="text-xs font-bold text-slate-200">Aktifkan Anti-Link Discord</h3>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Bot akan menghapus otomatis pesan apa pun yang berisi tautan/link URL (kecuali admin/role pengecualian) dan memberikan strike peringatan.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={toggleAntiLink}
                  className="transition-transform active:scale-95 focus:outline-none"
                >
                  {settings.antiLink ? (
                    <ToggleRight className="w-12 h-12 text-indigo-500" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Anti Spam ToggleRow */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between hover:bg-slate-950/60 transition-all">
                <div className="space-y-0.5 max-w-[80%]">
                  <h3 className="text-xs font-bold text-slate-200">Aktifkan Anti-Spam Detektor</h3>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Membatasi pengiriman pesan berulang secara cepat (&gt; 5 pesan dalam 3 detik). Pelanggar akan dibisukan (timed out) selama 10 menit.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={toggleAntiSpam}
                  className="transition-transform active:scale-95 focus:outline-none"
                >
                  {settings.antiSpam ? (
                    <ToggleRight className="w-12 h-12 text-indigo-500" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Warning Strike Limit input */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between hover:bg-slate-950/60 transition-all">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-200">Batas Strike Peringatan (Warn Limit)</h3>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Jumlah toleransi peringatan bagi pelanggar sebelum bot memicu tindakan hukuman otomatis.
                  </p>
                </div>
                <div className="flex items-center space-x-1 border border-slate-800 bg-slate-950 rounded-lg p-1">
                  {[2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleUpdateWarnLimit(val)}
                      className={`text-xs font-mono font-semibold w-8 h-8 rounded-md transition-all ${
                        settings.warnLimit === val 
                          ? 'bg-indigo-600 text-white shadow' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Historical Mod Log list */}
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
                  let alertBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                  if (log.action === 'WARN') {
                    alertBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  } else if (log.action === 'DELETE_MESSAGE') {
                    alertBadge = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                  }

                  return (
                    <div 
                      key={log.id} 
                      className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${alertBadge}`}>
                          {log.action}
                        </span>
                        <div className="truncate min-w-0">
                          <span className="font-semibold text-slate-200 block truncate">@{log.username}</span>
                          <span className="text-[11px] text-slate-400 block truncate">{log.reason}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-xs text-slate-500">
                  Belum ada catatan pelanggaran yang dilaporkan. Sistem berjalan aman!
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Toxic / blacklist words catalog (Right: 1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold font-display text-white border-b border-slate-850 pb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Daftar Kata Terlarang (Blacklist)</span>
            </h2>

            <p className="text-[11px] text-slate-400 leading-normal">
              Pengguna yang mengucapkan kata ini akan diblokir pesannya secara instan oleh sistem penyaringan bot.
            </p>

            {/* Insertion input */}
            <form onSubmit={handleAddWord} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={e => {
                    setNewWord(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Tambah kata kasar..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={savingWord}
                  className="bg-indigo-600 hover:bg-indigo-500 p-2.5 rounded-xl text-white transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {error && (
                <p className="text-[10px] text-rose-400 font-medium font-mono pl-1">
                  ⚠️ {error}
                </p>
              )}
            </form>

            {/* List and tags */}
            <div className="space-y-2 pt-2">
              <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">
                Daftar Filter Aktual ({settings.bannedWords?.length || 0})
              </div>

              {/* Flex wrapped badges */}
              <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto p-1 bg-slate-950/20 border border-slate-850/50 rounded-xl">
                {settings.bannedWords && settings.bannedWords.length > 0 ? (
                  settings.bannedWords.map((word) => (
                    <span 
                      key={word}
                      className="inline-flex items-center gap-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-medium px-2 py-1 rounded-lg text-[11px] transition-all font-mono"
                    >
                      <span>{word}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWord(word)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <div className="text-center w-full py-12 text-slate-600 text-xs">
                    Belum ada kata terblokir.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-850 text-[10px] text-slate-500 font-mono text-center">
            Setelan di-apply secara instan
          </div>
        </div>

      </div>
    </div>
  );
}
