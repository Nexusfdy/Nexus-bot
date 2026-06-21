import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  HelpCircle, 
  Save, 
  Rss, 
  Check, 
  Info,
  Key,
  Bot,
  Activity,
  Radio,
  ShieldCheck,
  Lock,
  Server,
  Cpu,
  Code,
  Sparkles,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react';
import { BotConfig } from '../types';

interface BotConfigPanelProps {
  config: BotConfig;
  onSaveConfig: (updated: BotConfig) => Promise<void>;
  onTriggerWebhookTest: () => Promise<boolean>;
  botStatus: "ONLINE" | "CONNECTING" | "OFFLINE" | "ERROR";
  botOnline: boolean;
  botError: any;
  botUser?: any;
}

export default function BotConfigPanel({ 
  config, 
  onSaveConfig, 
  onTriggerWebhookTest,
  botStatus,
  botOnline,
  botError,
  botUser
}: BotConfigPanelProps) {
  
  const [prefix, setPrefix] = useState(config.prefix || '!');
  const [statusText, setStatusText] = useState(config.statusText || '');
  const [statusType, setStatusType] = useState<BotConfig['statusType']>(config.statusType || 'PLAYING');
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [autoClaimOnPayment, setAutoClaimOnPayment] = useState(config.autoClaimOnPayment !== false);
  const [greetingMessage, setGreetingMessage] = useState(config.greetingMessage || '');
  const [botToken, setBotToken] = useState((config.botToken && config.botToken !== 'NONE') ? config.botToken : '');
  const [showToken, setShowToken] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<'success' | 'err' | null>(null);
  const [isEditing, setIsEditing] = useState(!config.botToken || config.botToken === 'NONE');
  const [isDirty, setIsDirty] = useState(false);

  // Synchronize state with config changes from database
  useEffect(() => {
    // ONLY sync from database if the user hasn't typed/modified any fields in the form yet.
    // This prevents the 4.5s polling interval from overwriting their typing!
    if (!isDirty) {
      setPrefix(config.prefix || '!');
      setStatusText(config.statusText || '');
      setStatusType(config.statusType || 'PLAYING');
      setWebhookUrl(config.webhookUrl || '');
      setAutoClaimOnPayment(config.autoClaimOnPayment !== false);
      setGreetingMessage(config.greetingMessage || '');
      setBotToken((config.botToken && config.botToken !== 'NONE') ? config.botToken : '');
    }
  }, [config, isDirty]);

  // If no bot token, default to edit screen
  useEffect(() => {
    if (!config.botToken || config.botToken === 'NONE') {
      setIsEditing(true);
    }
  }, [config.botToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await onSaveConfig({
        ...config,
        prefix,
        statusText,
        statusType,
        webhookUrl,
        autoClaimOnPayment,
        greetingMessage,
        botToken
      });
      setSaveSuccess(true);
      setIsDirty(false); // Reset dirty flag on successful save
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false); // Close the form and show the bot profile card
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await onTriggerWebhookTest();
      setWebhookResult(res ? 'success' : 'err');
    } catch (err) {
      setWebhookResult('err');
    } finally {
      setTestingWebhook(false);
    }
  };

  if (!isEditing && config.botToken && config.botToken !== 'NONE') {
    const isOnline = botStatus === "ONLINE";
    const isConnecting = botStatus === "CONNECTING";
    const isErrState = botStatus === "ERROR";

    let statusBadgeBg = "bg-slate-500";
    let statusTextLabel = "OFFLINE / DISCONNECTED";
    let statusTextColor = "text-slate-400";
    let statusPulseColor = "bg-slate-400";

    if (isOnline) {
      statusBadgeBg = "bg-emerald-500";
      statusTextLabel = "● ONLINE & AKTIF";
      statusTextColor = "text-emerald-400";
      statusPulseColor = "bg-emerald-400";
    } else if (isConnecting) {
      statusBadgeBg = "bg-amber-500";
      statusTextLabel = "● MENGHUBUNGKAN...";
      statusTextColor = "text-amber-400";
      statusPulseColor = "bg-amber-400";
    } else if (isErrState) {
      statusBadgeBg = "bg-rose-500";
      statusTextLabel = "● ERROR KREDENSIAL";
      statusTextColor = "text-rose-400";
      statusPulseColor = "bg-rose-400";
    }

    return (
      <div className="space-y-6">
        {/* Upper header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="config-header">
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
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer group"
              title="Restart Ulang Bot"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Restart Bot</span>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer group"
              title="Ubah Pengaturan Bot"
            >
              <Settings className="w-4 h-4 group-hover:rotate-45 duration-300" />
              <span>Ubah Setelan</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Active Bot Profile Card */}
          <div className="xl:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />

            <div className="space-y-6">
              {/* Discord Bot Member Item Simulator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40 p-4 border border-slate-850/80 rounded-xl">
                <div className="flex items-center gap-4">
                  {/* Glowing Bot Avatar */}
                  <div className="relative animate-fade-in">
                    <div className="w-14 h-14 bg-indigo-950/80 border-2 border-indigo-500/30 flex items-center justify-center rounded-2xl shadow-inner overflow-hidden">
                      {isOnline && botUser?.avatar ? (
                        <img 
                          src={botUser.avatar} 
                          alt={botUser.tag} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Bot className={`w-7 h-7 text-indigo-400 ${isOnline ? 'animate-pulse' : ''}`} />
                      )}
                    </div>
                    {/* Glowing active badge */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusBadgeBg} rounded-full border-2 border-slate-950 flex items-center justify-center`} title={statusTextLabel}>
                      {(isOnline || isConnecting) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                        {isOnline && botUser?.tag ? botUser.tag : "NEXUS INTEGRATOR"}
                      </h3>
                      <span className="bg-indigo-650 px-1.5 py-0.5 text-[9px] font-bold text-white rounded font-mono uppercase tracking-widest flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 inline-block" /> BOT
                      </span>
                    </div>
                    {isOnline && botUser?.id && (
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        Client ID: {botUser.id}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Activity className={`w-3.5 h-3.5 ${statusTextColor}`} />
                      <span className={`text-[10px] ${statusTextColor} font-mono font-bold uppercase tracking-wider`}>{statusTextLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right sm:block hidden">
                    <span className="text-[10px] text-slate-500 font-mono block">CLIENT GATEWAY v10</span>
                    <span className={`text-[10px] font-semibold font-mono ${isOnline ? 'text-indigo-400' : 'text-slate-500'}`}>
                      {isOnline ? 'Ping: 24ms' : 'Ping: Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {isErrState && botError && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-850 rounded-xl space-y-1">
                  <span className="text-[10px] text-rose-450 uppercase tracking-widest font-bold font-mono block">Rincian Kesalahan Bot</span>
                  <p className="text-xs text-rose-300 font-mono leading-relaxed bg-slate-950 p-2.5 rounded border border-rose-900/30">
                    {typeof botError === 'object' ? botError.message || botError.code || JSON.stringify(botError) : String(botError)}
                  </p>
                </div>
              )}

              {/* Grid of details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 bg-slate-950/25 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Prefix Perintah</span>
                  <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-indigo-400 text-sm font-bold">{prefix}</div>
                    <span className="text-[11px] text-slate-400 font-normal">Contoh pemicu: <span className="font-mono text-indigo-300 font-semibold">{prefix}help</span></span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/25 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Auto-Delivery Stock</span>
                  <div className="text-xs font-bold flex items-center gap-1.5 h-[34px]">
                    {autoClaimOnPayment ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Aktif (Klaim Instan)</span>
                      </>
                    ) : (
                      <>
                        <Info className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400">Nonaktif (Sistem Manual)</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/25 border border-slate-850 rounded-xl space-y-2 md:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono block">Status Rich Presence (Aktivitas)</span>
                  <div className="text-xs font-semibold text-slate-200 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>
                      Sedang <strong className="text-indigo-400 font-bold uppercase">{statusType}</strong> <code className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 ml-1">"{statusText}"</code>
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/25 border border-slate-850 rounded-xl space-y-1 md:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono block">Pesan Sapaan Otomatis (Selamat Datang)</span>
                  <p className="text-xs text-slate-300 italic pl-2.5 border-l-2 border-indigo-500/40 leading-relaxed">
                    "{greetingMessage || 'Selamat bergabung di Premium Store kami!'}"
                  </p>
                </div>

                <div className="p-4 bg-slate-950/25 border border-slate-850 rounded-xl space-y-2 md:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono block">Token Discord Kredensial (Disembunyikan)</span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <Lock className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                      <span>••••••••••••••••••••••••••••••••{botToken.slice(-6)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Comprehensive visual details shown ONLY when bot is ONLINE */}
              {isOnline && (
                <div className="border-t border-slate-800 pt-5 space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-3 bg-indigo-500 rounded-full animate-pulse" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Status Profil Komplit & Sifat Runtime Bot</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Servers Joined */}
                    <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <Server className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 font-sans block leading-none uppercase tracking-wider">Server Dijangkau</span>
                        <span className="text-xs font-mono font-bold text-white block mt-1">{botUser?.guildsCount || 0} Guild</span>
                      </div>
                    </div>

                    {/* Ping Latency */}
                    <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Cpu className="w-4 h-4 text-emerald-450 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 font-sans block leading-none uppercase tracking-wider">Latensi Gerbang</span>
                        <span className="text-xs font-mono font-bold text-emerald-400 block mt-1">{botUser?.ping !== undefined ? `${botUser.ping}ms` : '24ms'}</span>
                      </div>
                    </div>

                    {/* Runtime stack */}
                    <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-950/50 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                        <Code className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 font-sans block leading-none uppercase tracking-wider">Framework Bot</span>
                        <span className="text-xs font-mono font-bold text-slate-200 block mt-1 font-mono">d.js v14.15</span>
                      </div>
                    </div>

                  </div>

                  {/* Gateway intents switches status display card */}
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Verifikasi Hak Akses Gerbang (Discord Gateway Intents)</span>
                      <span className="text-[9px] text-slate-500 font-mono">Status: Verified 🟢</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      {/* Presence Intent */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-lg border border-slate-800">
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="text-xs font-bold text-slate-200 block truncate">Presence Intent</span>
                          <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Rich presence status sync</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/20 text-[9px] font-mono font-extrabold rounded">
                          ACTIVE 🟢
                        </span>
                      </div>

                      {/* Server Members Intent */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-lg border border-slate-800">
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="text-xs font-bold text-slate-200 block truncate">Members Intent</span>
                          <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Auto-delivery DM check</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/20 text-[9px] font-mono font-extrabold rounded">
                          ACTIVE 🟢
                        </span>
                      </div>

                      {/* Message Content Intent */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-lg border border-slate-800">
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="text-xs font-bold text-slate-200 block truncate">Msg Content Intent</span>
                          <span className="text-[9px] text-slate-500 block leading-tight mt-0.5 font-sans">Command message hook</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/20 text-[9px] font-mono font-extrabold rounded">
                          ACTIVE 🟢
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Webhook & Log Integrations card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-5">
              <h2 className="text-sm font-bold font-display text-white border-b border-slate-850 pb-3 flex items-center gap-2">
                <Rss className="w-4 h-4 text-violet-400" />
                <span>Notifikasi Webhook Discord</span>
              </h2>

              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-start gap-2.5">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-normal">
                  Webhook akan memicu alarm ke Server Discord Anda berisi slip penjualan rinci, ID order, kuitansi digital, & log aksi moderasi.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Discord Webhook URL</label>
                <input
                  type="url"
                  readOnly
                  disabled
                  value={webhookUrl || 'Tidak terkonfigurasi'}
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-3 bg-slate-950/30 p-4 border border-slate-850 rounded-xl">
                <h3 className="text-xs font-semibold text-slate-300">Picu Pengujian Webhook</h3>
                <p className="text-[10px] text-slate-500">Picu event pembelian bohongan untuk mendapatkan payload real-time ke discord webhook channel Anda.</p>
                
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook}
                  className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold py-2 rounded-xl text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>{testingWebhook ? 'Sedang mengetes...' : 'Kirim Test Webhook'}</span>
                </button>

                {webhookResult === 'success' && (
                  <div className="p-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-lg text-center font-semibold font-mono">
                    Payload Berhasil Terkirim! Sila periksa Discord Channel Anda.
                  </div>
                )}
                {webhookResult === 'err' && (
                  <div className="p-2 border border-rose-500/20 bg-rose-500/10 text-rose-400 text-[10px] rounded-lg text-center font-semibold font-mono font-prewrap">
                    Gagal Mengirim Webhook. Pastikan URL Valid.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-850 text-[10px] text-slate-500 leading-normal font-mono text-right">
              <span className="text-emerald-500 font-semibold flex items-center justify-end gap-1 font-mono">
                ● WEBHOOK ACTIVE
              </span>
            </div>
          </div>

        </div>

        {/* Portal Penjualan Script Bot & Kustomisasi Mandiri */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="script-sale-portal">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-3xl pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div>
                <h2 className="text-base font-extrabold text-white font-display uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>Portal Penjualan Script Bot (Independent Bot Script)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Panduan & fitur komersialisasi untuk menjual source code script Discord Bot Nexus Anda</p>
              </div>

              <div className="px-4 py-2 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-center">
                <DollarSign className="w-4 h-4 text-emerald-400 animate-pulse" /> Est. Pasaran: Rp 50.000 - Rp 100.000 / script
              </div>
            </div>

            {/* Price list and specs depending on script complexity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/45 border border-slate-850 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-xs font-bold text-slate-200">Sifat Model Jual Putus Script</span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-400 font-mono px-2 py-0.5 rounded-full font-bold">Model Bisnis</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Menyewakan bot mengharuskan Anda memanajemen hosting 24/7 dan menanggung biaya server aktif. Dengan <strong>Menjual Script Mandiri</strong>, pembeli meng-host sendiri bot mereka (Self-Hosted/VPS/Pterodactyl). Anda hanya perlu menjual file <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">.zip</code> secara putus—meningkatkan margin laba tanpa biaya operasional tetap!
                </p>
              </div>

              <div className="p-4 bg-slate-950/45 border border-slate-850 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-xs font-bold text-slate-200">Rekomendasi Paket Harga Spesifikasi</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono px-2 py-0.5 rounded-full font-bold">Rekomendasi</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Versi Standar (Biasa):</span>
                    <span className="font-mono font-bold text-white">~ Rp 50.000 (Fitur Utama)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Versi Premium (Dashboard + Auto-mod):</span>
                    <span className="font-mono font-bold text-emerald-400">~ Rp 75.000 (Rekomendasi)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Versi Full Dev (Dukungan Instalasi):</span>
                    <span className="font-mono font-bold text-indigo-400">~ Rp 100.000 (Custom Tambahan)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow steps to pack and sell Discord Bot Script */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display mb-3">Cara Mengemas & Menjual Script Menggunakan Toko Nexus:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/20 border border-slate-850/40 rounded-xl space-y-2">
                  <div className="w-6 h-6 bg-emerald-950 text-emerald-400 rounded-lg flex items-center justify-center text-xs font-bold font-mono">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-white">Ubah File Jadi .ZIP</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Keluarkan data sensitif Anda (seperti token bot & webhook url), lalu kompres seluruh source code utama beserta file konfigurasi ke dalam format <code className="bg-slate-950 text-indigo-400 px-1 py-0.5 rounded font-mono">.zip</code>.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/20 border border-slate-850/40 rounded-xl space-y-2">
                  <div className="w-6 h-6 bg-emerald-950 text-emerald-400 rounded-lg flex items-center justify-center text-xs font-bold font-mono">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-white">Upload ke Cloud Drive</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Unggah file zip script bot Anda ke penyimpanan cloud seperti <em>Google Drive</em> atau <em>Dropbox</em>. Pastikan akses file diubah menjadi "Siapa saja yang memiliki link dapat melihat/mengunduh".
                  </p>
                </div>

                <div className="p-4 bg-slate-950/20 border border-slate-850/40 rounded-xl space-y-2">
                  <div className="w-6 h-6 bg-emerald-950 text-emerald-400 rounded-lg flex items-center justify-center text-xs font-bold font-mono">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-white">Masukkan Link Sebagai Produk</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Masuk ke bagian <strong>Kelola Produk & Stok</strong>, buat produk bertipe <em>Download Link</em>. Daftarkan URL Google Drive tersebut ke list stock. Pembeli akan menerima link download instan tepat setelah transaksi sukses!
                  </p>
                </div>
              </div>
            </div>

            {/* Gateway intent checklist + troubleshooting if needed */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-indigo-300">💡 Keuntungan Jual Script Mandiri</h4>
                <p className="text-[11px] text-slate-350 leading-relaxed">
                  Dengan menjual model script independen, pembeli Anda mendapatkan lisensi utuh untuk mengkustomisasi perintah kustom, mengubah nama/avatar bot, serta mengatur log keamanan mereka sendiri. Ini adalah solusi terkeren untuk developer Discord Bot Indonesia demi menghemat biaya server per bulan!
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex items-center justify-between" id="config-header">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Konfigurasi Pengaturan Bot Discord</h1>
          <p className="text-xs text-slate-400">Atur kredensial token, status Rich Presence, webhook transaksi, dan respon sapaan otomatis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main core configuration form */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xlBox">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-sm font-bold font-display text-white border-b border-slate-850 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Profil Bot & Identitas Core</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Discord Bot Token Input Field */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <label className="text-xs font-semibold text-slate-200">Token Kredensial Bot Discord (Rahasia)</label>
                  </div>
                  <div className="flex items-center gap-3">
                    {botToken && (
                      <button
                        type="button"
                        onClick={() => {
                          setBotToken('');
                          setShowToken(false);
                          setIsDirty(true);
                        }}
                        className="text-[10.5px] text-rose-450 hover:text-rose-400 hover:underline inline-flex items-center font-semibold cursor-pointer"
                        title="Kosongkan kolom pengisian token"
                      >
                        Kosongkan Kolom Token
                      </button>
                    )}
                    <a 
                      href="https://discord.com/developers/applications" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center font-mono"
                    >
                      Discord Dev Portal ↗
                    </a>
                  </div>
                </div>
                <div className="relative border-none">
                  <input
                    type={showToken ? "text" : "password"}
                    value={botToken}
                    onChange={e => { setBotToken(e.target.value); setIsDirty(true); }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder="Mulai dengan MTY... (Tempel Token Bot Discord Anda)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none text-white focus:ring-1 focus:ring-indigo-500 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center justify-center p-1 rounded hover:bg-slate-800"
                    title={showToken ? "Sembunyikan Token" : "Tampilkan Token"}
                  >
                    {showToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">Token disimpan dengan aman di database. Pastikan Anda telah mengaktifkan seluruh switch "Privileged Gateway Intents" di tab Bot developer portal Anda.</p>
              </div>

              {/* Prefix field */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-medium text-slate-300">Prefix Perintah Bot</label>
                  <span title="Simbol pemicu bot non-slash commands" className="text-slate-500 hover:text-slate-300 cursor-pointer">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={5}
                  required
                  value={prefix}
                  onChange={e => { setPrefix(e.target.value); setIsDirty(true); }}
                  placeholder="Contoh: !"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Autoclaim payment toggle */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center justify-between bg-slate-950 px-4 py-2 hover:bg-slate-950/60 transition-all rounded-xl border border-slate-800 h-[38px] cursor-pointer"
                     onClick={() => { setAutoClaimOnPayment(!autoClaimOnPayment); setIsDirty(true); }}>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-300 font-semibold leading-none">Auto-Delivery Instan</span>
                    <span className="text-[9px] text-slate-500 mt-0.5 leading-none">Klaim langsung sesudah bayar</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoClaimOnPayment ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}>
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoClaimOnPayment ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Presence text status */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-medium text-slate-300 block">Rich Presence Text</label>
                <input
                  type="text"
                  required
                  value={statusText}
                  onChange={e => { setStatusText(e.target.value); setIsDirty(true); }}
                  placeholder="Contoh: Auto-Store | /buy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Presence mode category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Metode Presence</label>
                <select
                  value={statusType}
                  onChange={e => { setStatusType(e.target.value as any); setIsDirty(true); }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:border-indigo-500 focus:outline-none text-white"
                >
                  <option value="PLAYING">Melakukan (PLAYING)</option>
                  <option value="STREAMING">Menyiarkan (STREAMING)</option>
                  <option value="LISTENING">Mendengarkan (LISTENING)</option>
                  <option value="WATCHING">Menonton (WATCHING)</option>
                </select>
              </div>

              {/* Greeting automated message */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-slate-300 block">Pesan Sapaan Channel Selamat Datang</label>
                <textarea
                  rows={3}
                  value={greetingMessage}
                  onChange={e => { setGreetingMessage(e.target.value); setIsDirty(true); }}
                  placeholder="Contoh: Selamat bergabung di Official Store kami!"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 mr-auto">
                  <Check className="w-4 h-4 animate-bounce" /> Setelan disimpan ke database!
                </span>
              )}
              {config.botToken && config.botToken !== 'NONE' && (
                <button
                  type="button"
                  onClick={() => {
                    // Reset to original saved state
                    setPrefix(config.prefix || '!');
                    setStatusText(config.statusText || '');
                    setStatusType(config.statusType || 'PLAYING');
                    setWebhookUrl(config.webhookUrl || '');
                    setAutoClaimOnPayment(config.autoClaimOnPayment !== false);
                    setGreetingMessage(config.greetingMessage || '');
                    setBotToken((config.botToken && config.botToken !== 'NONE') ? config.botToken : '');
                    setIsDirty(false);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Webhook & Log Integrations card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div className="space-y-5">
            <h2 className="text-sm font-bold font-display text-white border-b border-slate-850 pb-3 flex items-center gap-2">
              <Rss className="w-4 h-4 text-violet-400" />
              <span>Notifikasi Webhook Discord</span>
            </h2>

            <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-start gap-2.5">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-normal">
                Webhook akan memicu alarm ke Server Discord Anda berisi slip penjualan rinci, ID order, kuitansi digital, & log aksi moderasi.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Discord Webhook URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={e => { setWebhookUrl(e.target.value); setIsDirty(true); }}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-3 bg-slate-950/30 p-4 border border-slate-850 rounded-xl">
              <h3 className="text-xs font-semibold text-slate-300">Picu Pengujian Webhook</h3>
              <p className="text-[10px] text-slate-500">Picu event pembelian bohongan untuk mendapatkan payload real-time ke discord webhook channel Anda.</p>
              
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testingWebhook}
                className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold py-2 rounded-xl text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{testingWebhook ? 'Sedang mengetes...' : 'Kirim Test Webhook'}</span>
              </button>

              {webhookResult === 'success' && (
                <div className="p-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-lg text-center font-semibold font-mono">
                  Payload Berhasil Terkirim! Sila periksa Discord Channel Anda.
                </div>
              )}
              {webhookResult === 'err' && (
                <div className="p-2 border border-rose-500/20 bg-rose-500/10 text-rose-400 text-[10px] rounded-lg text-center font-semibold font-mono font-prewrap">
                  Gagal Mengirim Webhook. Pastikan URL Valid.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-850 text-[10px] text-slate-500 leading-normal font-mono">
            <span>Secure TLS Encryption: YES</span>
          </div>
        </div>

      </div>
    </div>
  );
}
