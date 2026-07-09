import React, { useState } from 'react';
import { Save, Check, RefreshCw, Send, Loader2, Settings, ShieldCheck, Server } from 'lucide-react';
import { BotConfig } from '../../types';
import BotTokenField from './BotTokenField';
import StoreUIConfigPanel from './StoreUIConfigPanel';
import { StoreUIConfig } from '../../types';
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
  
  const [discordRoles, setDiscordRoles] = useState<{id: string, name: string, color: string}[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
  
  const [ownerData, setOwnerData] = useState<{username: string, avatar: string, tag: string} | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);

  const guildIdRef = React.useRef(guildId);
  React.useEffect(() => {
    guildIdRef.current = guildId;
  }, [guildId]);
  
  React.useEffect(() => {
    let active = true;
    if (ownerId && ownerId.length >= 17) {
      setLoadingOwner(true);
      fetchWithAuth(`/api/bot/users/${ownerId}`)
        .then(async res => {
          if (!res.ok) throw new Error('Not found');
          return await res.json();
        })
        .then(data => {
          if (active) setOwnerData(data);
        })
        .catch(() => {
          if (active) setOwnerData(null);
        })
        .finally(() => {
          if (active) setLoadingOwner(false);
        });
    } else {
      setOwnerData(null);
    }
    return () => { active = false; };
  }, [ownerId]);

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

  const fetchRoles = (guildId: string) => {
    setLoadingRoles(true);
    fetchWithAuth(`/api/bot/guilds/${guildId}/roles`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP error ${res.status}`);
        return data;
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDiscordRoles(data);
        }
      })
      .catch(err => console.error("Error fetching roles:", err))
      .finally(() => setLoadingRoles(false));
  };

  const handleTestMessage = async (channelId: string) => {
    if (!guildId || !channelId) return;
    setTestingChannelId(channelId);
    try {
      const res = await fetchWithAuth(`/api/bot/guilds/${guildId}/channels/${channelId}/test`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send test message');
      }
      alert('Test message sent successfully!');
    } catch (err: any) {
      alert(`Error sending test message: ${err.message}`);
    } finally {
      setTestingChannelId(null);
    }
  };

  React.useEffect(() => {
    fetchGuilds();
  }, []);

  React.useEffect(() => {
    if (guildId) {
      fetchChannels(guildId);
      fetchRoles(guildId);
    } else {
      setDiscordChannels([]);
      setDiscordRoles([]);
    }
  }, [guildId]);

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingDiscord, setSavingDiscord] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [savingServer, setSavingServer] = useState(false);
  const [savingLiveStock, setSavingLiveStock] = useState(false);
  const [savingSaweria, setSavingSaweria] = useState(false);

  
  const handleUpdateUIConfig = async (uiConfig: StoreUIConfig) => {
    await handleUpdate('ui', uiConfig, () => {});
  };

  const handleUpdate = async (section: string, data: any, setSaving: (val: boolean) => void) => {
    setSaving(true);
    try {
      if (onUpdatePartialConfig) {
        await onUpdatePartialConfig(section, data);
        setIsDirty(false);
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
    <div className="bg-[#0B0F19] border border-slate-800/80 rounded-[32px] p-6 md:p-10 shadow-2xl shadow-indigo-500/5 mt-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
            <Settings className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Edit Setelan Kredensial & Bot</h2>
            <p className="text-xs text-slate-400 mt-1">Sesuaikan integrasi gateway Discord dengan platform Nexus</p>
          </div>
        </div>
        {config.botToken && config.botToken !== 'NONE' && (
          <button type="button" onClick={() => setIsEditing(false)} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            Nanti saja
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-slate-700/50 p-6 rounded-3xl">
            <BotTokenField botToken={botToken} setBotToken={setBotToken} showToken={showToken} setShowToken={setShowToken} setIsDirty={setIsDirty} />
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => handleUpdate('discord', { botToken }, setSavingDiscord)}
                disabled={savingDiscord}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {savingDiscord ? 'Saving...' : 'Save Discord Config'}
              </button>
            </div>
          </div>
          
          <div className="bg-slate-900/40 border border-slate-700/50 p-6 rounded-3xl">
            <BotIdentityFields prefix={prefix} setPrefix={setPrefix} statusText={statusText} setStatusText={setStatusText} statusType={statusType} setStatusType={setStatusType} setIsDirty={setIsDirty} />
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => handleUpdate('general', { prefix, statusText, statusType }, setSavingGeneral)}
                disabled={savingGeneral}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {savingGeneral ? 'Saving...' : 'Save General Config'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shrink-0"
          >
            {savingFeatures ? 'Saving...' : 'Save Feature'}
          </button>
        </div>

        <div className="bg-slate-900/40 border border-slate-700/50 rounded-3xl p-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                <Server className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Konfigurasi Channel Integrasi</h3>
                <p className="text-[11px] text-slate-500 mt-1">Pilih server dan atur pengiriman notifikasi otomatis</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <select
                value={guildId}
                onChange={e => handleGuildChange(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 sm:py-1.5 text-sm font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-colors cursor-pointer appearance-none w-full sm:w-auto"
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
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  Target Channel Live Stock
                </h4>
                
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">Target Channel</label>
                <div className="flex gap-2">
                  <select
                    value={liveStockChannel}
                    onChange={e => { setLiveStockChannel(e.target.value); setIsDirty(true); }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-colors cursor-pointer appearance-none"
                    disabled={!guildId && discordChannels.length > 0}
                  >
                    <option value="">Tidak Aktif (None)</option>
                    {discordChannels.map(ch => (
                      <option key={ch.id} value={ch.id}>#{ch.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => liveStockChannel && handleTestMessage(liveStockChannel)}
                    disabled={!liveStockChannel || testingChannelId === liveStockChannel}
                    className="px-3 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors disabled:opacity-50"
                    title="Test Message"
                    type="button"
                  >
                    {testingChannelId === liveStockChannel ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-1 leading-relaxed mb-4">
                  Tempat Nexus Bot mengirimkan update stok otomatis.
                </p>
              </div>
              <div className="flex justify-end mt-4">
                <button 
                  onClick={() => handleUpdate('livestock', { guildId, liveStockChannel }, setSavingLiveStock)}
                  disabled={savingLiveStock}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {savingLiveStock ? 'Saving...' : 'Save Live Stock'}
                </button>
              </div>
            </div>

            {/* Deposit Webhook Configuration */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  Channel Webhook Saweria
                </h4>
                
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">Target Channel</label>
                <div className="flex gap-2">
                  <select
                    value={depositWebhookChannelId}
                    onChange={e => { setDepositWebhookChannelId(e.target.value); setIsDirty(true); }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-colors cursor-pointer appearance-none"
                    disabled={!guildId && discordChannels.length > 0}
                  >
                    <option value="">Tidak Aktif (None)</option>
                    {discordChannels.map(ch => (
                      <option key={ch.id} value={ch.id}>#{ch.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => depositWebhookChannelId && handleTestMessage(depositWebhookChannelId)}
                    disabled={!depositWebhookChannelId || testingChannelId === depositWebhookChannelId}
                    className="px-3 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors disabled:opacity-50"
                    title="Test Message"
                    type="button"
                  >
                    {testingChannelId === depositWebhookChannelId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-1 leading-relaxed mb-4">
                  Mendengarkan notifikasi top-up otomatis Saweria.
                </p>
              </div>
              <div className="flex justify-end mt-4">
                <button 
                  onClick={() => handleUpdate('saweria', { depositWebhookChannelId }, setSavingSaweria)}
                  disabled={savingSaweria}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {savingSaweria ? 'Saving...' : 'Save Saweria Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Server Management & Owner Recognition */}
        <div className="pt-8 mt-8 border-t border-slate-800/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              Manajemen Server & Owner
            </h3>
            <button 
              onClick={() => handleUpdate('server', { guildId, ownerId, serverManagement }, setSavingServer)}
              disabled={savingServer}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
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
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-2 pl-1 leading-relaxed mb-3">
                User dengan ID ini akan mendapatkan hak akses penuh (bypass) di server.
              </p>
              {loadingOwner ? (
                <div className="flex items-center space-x-2 text-slate-400 text-xs px-1">
                  <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span>Mencari user...</span>
                </div>
              ) : ownerData ? (
                <div className="flex items-center space-x-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  {ownerData.avatar ? (
                    <img src={ownerData.avatar} alt="Owner Avatar" className="w-8 h-8 rounded-full shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold">
                      {ownerData.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-200 leading-tight">{ownerData.tag || ownerData.username}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Owner Terverifikasi ✓</span>
                  </div>
                </div>
              ) : ownerId && ownerId.length >= 17 ? (
                <div className="text-xs text-amber-400/80 px-1">User tidak ditemukan di cache bot.</div>
              ) : null}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 pl-1 uppercase tracking-wider">Welcome Channel</label>
              <div className="flex gap-2">
                <select
                  value={serverManagement?.welcomeChannelId || ''}
                  onChange={(e) => { setServerManagement({ ...serverManagement, welcomeChannelId: e.target.value }); setIsDirty(true); }}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                  disabled={!guildId && discordChannels.length > 0}
                >
                  <option value="">-- Pilih Channel Welcome --</option>
                  {discordChannels.map(ch => (
                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => serverManagement?.welcomeChannelId && handleTestMessage(serverManagement.welcomeChannelId)}
                  disabled={!serverManagement?.welcomeChannelId || testingChannelId === serverManagement.welcomeChannelId}
                  className="px-3 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors disabled:opacity-50"
                  title="Test Message"
                  type="button"
                >
                  {testingChannelId === serverManagement?.welcomeChannelId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 pl-1 uppercase tracking-wider">Log Channel</label>
              <div className="flex gap-2">
                <select
                  value={serverManagement?.logChannelId || ''}
                  onChange={(e) => { setServerManagement({ ...serverManagement, logChannelId: e.target.value }); setIsDirty(true); }}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                  disabled={!guildId && discordChannels.length > 0}
                >
                  <option value="">-- Pilih Channel Log --</option>
                  {discordChannels.map(ch => (
                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => serverManagement?.logChannelId && handleTestMessage(serverManagement.logChannelId)}
                  disabled={!serverManagement?.logChannelId || testingChannelId === serverManagement.logChannelId}
                  className="px-3 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors disabled:opacity-50"
                  title="Test Message"
                  type="button"
                >
                  {testingChannelId === serverManagement?.logChannelId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 pl-1 uppercase tracking-wider flex items-center justify-between">
                <span>Buyer Role Mapping</span>
                {loadingRoles && <Loader2 className="w-3 h-3 animate-spin" />}
              </label>
              <select
                value={serverManagement?.buyerRoleId || ''}
                onChange={(e) => { setServerManagement({ ...serverManagement, buyerRoleId: e.target.value }); setIsDirty(true); }}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                disabled={!guildId || loadingRoles}
              >
                <option value="">-- Pilih Role Pembeli --</option>
                {discordRoles.map(role => (
                  <option key={role.id} value={role.id} style={{ color: role.color !== '#000000' ? role.color : 'inherit' }}>
                    {role.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-2 pl-1">Role yang diberikan otomatis saat transaksi berhasil.</p>
            </div>
          </div>

        <div className="bg-slate-900/40 border border-slate-700/50 p-6 rounded-3xl">
          <StoreUIConfigPanel config={config.uiConfig} onSave={handleUpdateUIConfig} />
        </div>

</div>
</div>
</div>
  );
}
