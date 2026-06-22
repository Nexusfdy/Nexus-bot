import React from 'react';
import { Settings, Activity } from 'lucide-react';

interface BotProfileHeaderProps {
  setIsEditing: (editing: boolean) => void;
}

export default function BotProfileHeader({ setIsEditing }: BotProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold font-display text-white">Profil Discord Bot Aktif</h1>
        <p className="text-xs text-slate-400">Bot Anda saat ini aktif dan terhubung ke integrasi e-commerce Nexus</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/bot/restart", { method: "POST" });
              if (res.ok) alert("Perintah Restart terkirim ke Server!");
            } catch(e) {}
          }}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all group"
          title="Restart Ulang Bot"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Restart Bot</span>
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all group"
          title="Ubah Pengaturan Bot"
        >
          <Settings className="w-4 h-4 group-hover:rotate-45 duration-300" />
          <span>Ubah Setelan</span>
        </button>
      </div>
    </div>
  );
}
