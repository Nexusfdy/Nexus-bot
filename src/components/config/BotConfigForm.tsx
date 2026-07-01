import React, { useState } from 'react';
import { Save, Check, RefreshCw } from 'lucide-react';
import { BotConfig } from '../../types';
import BotTokenField from './BotTokenField';
import BotIdentityFields from './BotIdentityFields';

import { fetchWithAuth } from '../../lib/api';

interface BotConfigFormProps {
  config: BotConfig;
  onSaveConfig: (updated: BotConfig) => Promise<void>;
  onUpdatePartialConfig?: (section: string, data: Partial<BotConfig>) => Promise<void>;
  setIsEditing: (editing: boolean) => void;
  botToken: string;
  setBotToken: (val: string) => void;
  prefix: string;
  setPrefix: (val: string) => void;
  statusText: string;
  setStatusText: (val: string) => void;
  statusType: BotConfig['statusType'];
  setStatusType: (val: BotConfig['statusType']) => void;
  webhookUrl: string;
  setWebhookUrl: (val: string) => void;
  autoClaimOnPayment: boolean;
  setAutoClaimOnPayment: (val: boolean) => void;
  greetingMessage: string;
  setGreetingMessage: (val: string) => void;
  liveStockChannel: string;
  setLiveStockChannel: (val: string) => void;
  depositWebhookChannelId: string;
  setDepositWebhookChannelId: (val: string) => void;
  guildId: string;
  setGuildId: (val: string) => void;
  ownerId?: string;
  setOwnerId: (val: string) => void;
  serverManagement?: { welcomeChannelId?: string; logChannelId?: string; leaveChannelId?: string; };
  setServerManagement: (val: any) => void;
  setIsDirty: (val: boolean) => void;
}

export default function BotConfigForm({
  config, onSaveConfig, onUpdatePartialConfig, setIsEditing, botToken, setBotToken, prefix, setPrefix, statusText, setStatusText,
  statusType, setStatusType, webhookUrl, setWebhookUrl, autoClaimOnPayment, setAutoClaimOnPayment,
  greetingMessage, setGreetingMessage, liveStockChannel, setLiveStockChannel, depositWebhookChannelId, setDepositWebhookChannelId, guildId, setGuildId, ownerId, setOwnerId,
  serverManagement, setServerManagement, setIsDirty
}: BotConfigFormProps) {
  
  const [showToken, setShowToken] = useState(false);
  const [discordGuilds, setDiscordGuilds] = useState<{id: string, name: string}[]>([]);
  const [discordChannels, setDiscordChannels] = useState<{id: string, name: string}[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [channelsError, setChannelsError] = useState('');

  const guildIdRef = React.useRef(guildId);
  React.useEffect(() => {
    guildIdRef.current = guildId;
  }, [guildId]);

  const fetchGuilds = () => {
    setLoadingChannels(true);
    setChannelsError('');
    fetchWithAuth('/api/bot/guilds')
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP error ${res.status}`);
        return data;
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDiscordGuilds(data);
          if (data.length > 0 && !guildIdRef.current && !config.guildId) {
            setGuildId(data[0].id);
          }
        }
      })
      .catch(err => setChannelsError(err.message))
      .finally(() => setLoadingChannels(false));
  };

  const fetchChannels = (guildId: string) => {
    setLoadingChannels(true);
    setChannelsError('');
    fetchWithAuth(`/api/bot/guilds/${guildId}/channels`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP error ${res.status}`);
        return data;
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDiscordChannels(data);
        }
      })
      .catch(err => setChannelsError(err.message))
      .finally(() => setLoadingChannels(false));
  };

  React.useEffect(() => {
    fetchGuilds();
  }, []);

  React.useEffect(() => {
    if (guildId) {
      fetchChannels(guildId);
    } else {
      setDiscordChannels([]);
    }
  }, [guildId]);

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingDiscord, setSavingDiscord] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [savingServer, setSavingServer] = useState(false);
  const [savingLiveStock, setSavingLiveStock] = useState(false);
  const [savingSaweria, setSavingSaweria] = useState(false);

  const handleUpdate = async (section: string, data: any, setSaving: (val: boolean) => void) => {
    setSaving(true);
    try {
      if (onUpdatePartialConfig) {
        await onUpdatePartialConfig(section, data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleGuildChange = (newGuildId: string) => {
    setGuildId(newGuildId);
    setLiveStockChannel('');
    setDepositWebhookChannelId('');
    setServerManagement({ ...serverManagement, welcomeChannelId: '', logChannelId: '' });
    setIsDirty(true);
  };

  return (
    <div className="bg-[#0f1523] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl mt-6">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/60">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Edit Setelan Kredensial & Bot</h2>
          <p className="text-xs text-slate-400 mt-1">Sesuaikan integrasi gateway Discord dengan platform Nexus</p>
        </div>
        {config.botToken && config.botToken !== 'NONE' && (
          <button type="button" onClick={() => setIsEditing(false)} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            Nanti saja
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
            <BotTokenField botToken={botToken} setBotToken={setBotToken} showToken={showToken} setShowToken={setShowToken} setIsDirty={setIsDirty} />
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => handleUpdate('discord', { botToken }, setSavingDiscord)}
                disabled={savingDiscord}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {savingDiscord ? 'Saving...' : 'Save Discord Config'}
              </button>
            </div>
          </div>
          
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
            <BotIdentityFields prefix={prefix} setPrefix={setPrefix} statusText={statusText} setStatusText={setStatusText} statusType={statusType} setStatusType={setStatusType} setIsDirty={setIsDirty} />
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => handleUpdate('general', { prefix, statusText, statusType }, setSavingGeneral)}
                disabled={savingGeneral}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {savingGeneral ? 'Saving...' : 'Save General Config'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <label className="flex items-start gap-4 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-1 shrink-0">
              <input
                type="checkbox"
                checked={autoClaimOnPayment}
                onChange={e => { setAutoClaimOnPayment(e.target.checked); setIsDirty(true); }}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border ${autoClaimOnPayment ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-900 border-slate-600 group-hover:border-indigo-400'} transition-all flex items-center justify-center`}>
                <Check className={`w-3 h-3 text-white transition-transform ${autoClaimOnPayment ? 'scale-100' : 'scale-0'}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Auto-Delivery Claim</p>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                Ketika aktif, jika transaksi selesai/berhasil maka sistem akan segera mengirimkan digital item key/kode langsung ke DM Discord customer.
              </p>
            </div>
          </label>
          <button 
            onClick={() => handleUpdate('features', { autoClaimOnPayment, webhookUrl, greetingMessage }, setSavingFeatures)}
            disabled={savingFeatures}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shrink-0"
          >
            {savingFeatures ? 'Saving...' : 'Save Feature'}
          </button>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Konfigurasi Channel Integrasi</h3>
              <p className="text-[11px] text-slate-500 mt-1">Pilih server dan atur pengiriman notifikasi otomatis</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <select
                value={guildId}
                onChange={e => handleGuildChange(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 sm:py-1.5 text-sm font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer appearance-none w-full sm:w-auto"
              >
                <option value="" disabled>-- Pilih Server --</option>
                {discordGuilds.map(guild => (
                  <option key={guild.id} value={guild.id}>{guild.name}</option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={() => { fetchGuilds(); if(guildId) fetchChannels(guildId); }} 
                disabled={loadingChannels}
                className="text-[11px] flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                <RefreshCw className={`w-3 h-3 ${loadingChannels ? 'animate-spin' : ''}`} />
                {loadingChannels ? 'Memuat...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {channelsError && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <span className="font-bold">Gagal memuat channel:</span> {channelsError}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6">
            {/* Live Stock Configuration */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  Target Channel Live Stock
                </h4>
                
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">Target Channel</label>
                <select
                  value={liveStockChannel}
                  onChange={e => { setLiveStockChannel(e.target.value); setIsDirty(true); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer appearance-none"
                  disabled={!guildId && discordChannels.length > 0}
                >
                  <option value="">Tidak Aktif (None)</option>
                  {discordChannels.length > 0 ? (
                    discordChannels.map(ch => (
                      <option key={ch.id} value={ch.id}>#{ch.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="bot-order">#bot-order</option>
                      <option value="live-stock">#live-stock</option>
                      <option value="general">#general</option>
                      <option value="announcements">#announcements</option>
                      <option value="chat-bebas">#chat-bebas</option>
                    </>
                  )}
                </select>
                <p className="text-[11px] text-slate-500 mt-2 pl-1 leading-relaxed mb-4">
                  Tempat Nexus Bot mengirimkan update stok otomatis.
                </p>
              </div>
              <div className="flex justify-end mt-4">
                <button 
                  onClick={() => handleUpdate('livestock', { guildId, liveStockChannel }, setSavingLiveStock)}
                  disabled={savingLiveStock}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {savingLiveStock ? 'Saving...' : 'Save Live Stock'}
                </button>
              </div>
            </div>

            {/* Deposit Webhook Configuration */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  Channel Webhook Saweria
                </h4>
                
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">Target Channel</label>
                <select
                  value={depositWebhookChannelId}
                  onChange={e => { setDepositWebhookChannelId(e.target.value); setIsDirty(true); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer appearance-none"
                  disabled={!guildId && discordChannels.length > 0}
                >
                  <option value="">Tidak Aktif (None)</option>
                  {discordChannels.length > 0 ? (
                    discordChannels.map(ch => (
                      <option key={ch.id} value={ch.id}>#{ch.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="donation-logs">#donation-logs</option>
                      <option value="general">#general</option>
                      <option value="bot-order">#bot-order</option>
                    </>
                  )}
                </select>
                <p className="text-[11px] text-slate-500 mt-2 pl-1 leading-relaxed mb-4">
                  Mendengarkan notifikasi top-up otomatis Saweria.
                </p>
              </div>
              <div className="flex justify-end mt-4">
                <button 
                  onClick={() => handleUpdate('saweria', { depositWebhookChannelId }, setSavingSaweria)}
                  disabled={savingSaweria}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {savingSaweria ? 'Saving...' : 'Save Saweria Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Server Management & Owner Recognition */}
        <div className="pt-6 border-t border-slate-800/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              Manajemen Server & Owner
            </h3>
            <button 
              onClick={() => handleUpdate('server', { guildId, ownerId, serverManagement }, setSavingServer)}
              disabled={savingServer}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {savingServer ? 'Saving...' : 'Save Server Settings'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 pl-1 uppercase tracking-wider">Discord ID Owner</label>
              <input
                type="text"
                value={ownerId || ''}
                onChange={(e) => { setOwnerId(e.target.value); setIsDirty(true); }}
                placeholder="Misal: 123456789012345678"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-2 pl-1 leading-relaxed">
                User dengan ID ini akan mendapatkan hak akses penuh (bypass) di server.
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 pl-1 uppercase tracking-wider">Welcome Channel</label>
              <select
                value={serverManagement?.welcomeChannelId || ''}
                onChange={(e) => { setServerManagement({ ...serverManagement, welcomeChannelId: e.target.value }); setIsDirty(true); }}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                disabled={!guildId && discordChannels.length > 0}
              >
                <option value="">-- Pilih Channel Welcome --</option>
                {discordChannels.length > 0 ? (
                  discordChannels.map(ch => (
                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                  ))
                ) : (
                  <>
                    <option value="welcome">#welcome</option>
                    <option value="general">#general</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 pl-1 uppercase tracking-wider">Log Channel</label>
              <select
                value={serverManagement?.logChannelId || ''}
                onChange={(e) => { setServerManagement({ ...serverManagement, logChannelId: e.target.value }); setIsDirty(true); }}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                disabled={!guildId && discordChannels.length > 0}
              >
                <option value="">-- Pilih Channel Log --</option>
                {discordChannels.length > 0 ? (
                  discordChannels.map(ch => (
                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                  ))
                ) : (
                  <>
                    <option value="mod-logs">#mod-logs</option>
                    <option value="bot-logs">#bot-logs</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
