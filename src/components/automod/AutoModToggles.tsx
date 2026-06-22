import React from 'react';
import { ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { AutoModSettings } from '../../types';

interface AutoModTogglesProps {
  settings: AutoModSettings;
  toggleAntiLink: () => Promise<void>;
  toggleAntiSpam: () => Promise<void>;
  handleUpdateWarnLimit: (limit: number) => Promise<void>;
}

export default function AutoModToggles({ settings, toggleAntiLink, toggleAntiSpam, handleUpdateWarnLimit }: AutoModTogglesProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      <h2 className="text-sm font-bold font-display text-white border-b border-slate-850 pb-3 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-indigo-400" />
        <span>Proteksi Anti-Spam & Anti-Link</span>
      </h2>

      <div className="space-y-4">
        
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
  );
}
