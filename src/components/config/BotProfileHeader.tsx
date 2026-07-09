import React, { useState } from 'react';
import { Settings, Activity, RefreshCw } from 'lucide-react';
import { fetchWithAuth as fetch } from '../../lib/api';

interface BotProfileHeaderProps {
  setIsEditing: (editing: boolean) => void;
}

export default function BotProfileHeader({ setIsEditing }: BotProfileHeaderProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/bot/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ " + data.message);
      } else {
        alert("⚠️ Gagal sinkronisasi: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("⚠️ Error: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 className="text-xl font-bold font-display text-white">Profil Discord Bot Aktif</h1>
        <p className="text-xs text-slate-400">Bot Anda saat ini aktif dan terhubung ke integrasi e-commerce Nexus</p>
      </div>
      <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center gap-1.5 flex-1 md:flex-initial text-xs font-semibold transition-all group disabled:opacity-50"
          title="Sinkronisasi Data Bot"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Menyinkronkan...' : 'Sinkronisasi'}</span>
        </button>
        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/bot/restart", { method: "POST" });
              if (res.ok) alert("Perintah Restart terkirim ke Server!");
            } catch(e) {}
          }}
          className="px-3.5 py-2 bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl flex items-center justify-center gap-1.5 flex-1 md:flex-initial text-xs font-semibold transition-all group"
          title="Restart Ulang Bot"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Restart Bot</span>
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3.5 py-2 bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl flex items-center justify-center gap-1.5 flex-1 md:flex-initial text-xs font-semibold transition-all group"
          title="Ubah Pengaturan Bot"
        >
          <Settings className="w-4 h-4 group-hover:rotate-45 duration-300" />
          <span>Ubah Setelan</span>
        </button>
      </div>
    </div>
  );
}
