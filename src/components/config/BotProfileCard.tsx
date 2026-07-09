import React from 'react';
import { BotConfig } from '../../types';
import BotProfileHeader from './BotProfileHeader';
import BotProfileAvatar from './BotProfileAvatar';
import BotProfileFeatures from './BotProfileFeatures';

interface BotProfileCardProps {
  config: BotConfig;
  setIsEditing: (editing: boolean) => void;
  botStatus: "ONLINE" | "CONNECTING" | "OFFLINE" | "ERROR";
  botUser: any;
  botError: any;
  botToken: string;
}

export default function BotProfileCard({ config, setIsEditing, botStatus, botUser, botError, botToken }: BotProfileCardProps) {
  const isOnline = botStatus === "ONLINE";
  const isConnecting = botStatus === "CONNECTING";
  const isErrState = botStatus === "ERROR";

  let statusTextLabel = "OFFLINE / DISCONNECTED";
  let statusTextColor = "text-slate-400";
  let statusPulseColor = "bg-slate-400";

  if (isOnline) {
    statusTextLabel = "● ONLINE & AKTIF";
    statusTextColor = "text-emerald-400";
    statusPulseColor = "bg-emerald-400";
  } else if (isConnecting) {
    statusTextLabel = "● MENGHUBUNGKAN...";
    statusTextColor = "text-amber-400";
    statusPulseColor = "bg-amber-400";
  } else if (isErrState) {
    statusTextLabel = "● ERROR KREDENSIAL";
    statusTextColor = "text-rose-400";
    statusPulseColor = "bg-rose-400";
  }

  return (
    <div className="space-y-6">
      <BotProfileHeader setIsEditing={setIsEditing} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <BotProfileAvatar 
            botUser={botUser}
            botError={botError}
            statusTextLabel={statusTextLabel}
            statusTextColor={statusTextColor}
            statusPulseColor={statusPulseColor}
            isErrState={isErrState}
          />

          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Prefix Perintah</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold font-mono text-indigo-400">{config.prefix || "!"}</span>
              </div>
              <p className="text-xs font-mono text-slate-400 truncate">
                Contoh pemicu: <span className="text-indigo-300 font-bold">{config.prefix}help</span>
              </p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <BotProfileFeatures config={config} botToken={botToken} />
        </div>
      </div>
    </div>
  );
}
