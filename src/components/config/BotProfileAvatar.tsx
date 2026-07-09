import React from 'react';
import { Activity, Activity as Signal } from 'lucide-react';

interface BotProfileAvatarProps {
  botUser: any;
  botError: any;
  statusTextLabel: string;
  statusTextColor: string;
  statusPulseColor: string;
  isErrState: boolean;
}

export default function BotProfileAvatar({
  botUser, botError, statusTextLabel, statusTextColor, statusPulseColor, isErrState
}: BotProfileAvatarProps) {
  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-indigo-900/40 via-transparent to-transparent opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center p-1.5 shadow-xl shadow-indigo-900/20 mb-4 transition-transform group-hover:scale-105 duration-300">
            <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center relative">
              {botUser?.avatar ? (
                <img src={botUser.avatar} alt="Bot Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0B0F19] rounded-full flex items-center justify-center">
            <div className={`w-3.5 h-3.5 rounded-full ${statusPulseColor} shadow-md shadow-black flex items-center justify-center`}>
              <div className="w-full h-full rounded-full animate-ping opacity-75 inherit bg-current" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-1 w-full">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-extrabold text-white font-display tracking-tight truncate max-w-[200px]">
              {botUser?.tag || "NEXUS BOT"}
            </h2>
            <div className="px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-[10px] font-bold text-indigo-400 uppercase tracking-widest shrink-0">
              BOT
            </div>
          </div>
          <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
            Client ID: {botUser?.id || "Memuat ID..."}
          </p>

          <div className="flex justify-center mt-3 pt-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/50 border border-slate-800 rounded-full text-[11px] font-bold ${statusTextColor}`}>
              <Signal className="w-3.5 h-3.5" />
              <span className="tracking-widest">{statusTextLabel}</span>
            </div>
          </div>
        </div>
      </div>
      {isErrState && botError && (
        <div className="mt-4 p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-[10px] sm:text-xs text-rose-300">
          <p className="font-semibold mb-1">Crash Report:</p>
          <p className="font-mono break-words opacity-80">{typeof botError === "string" ? botError : JSON.stringify(botError)}</p>
        </div>
      )}
    </div>
  );
}
