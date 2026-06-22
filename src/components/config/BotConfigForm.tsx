import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { BotConfig } from '../../types';
import BotTokenField from './BotTokenField';
import BotIdentityFields from './BotIdentityFields';

interface BotConfigFormProps {
  config: BotConfig;
  onSaveConfig: (updated: BotConfig) => Promise<void>;
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
  setIsDirty: (val: boolean) => void;
}

export default function BotConfigForm({
  config, onSaveConfig, setIsEditing, botToken, setBotToken, prefix, setPrefix, statusText, setStatusText,
  statusType, setStatusType, webhookUrl, setWebhookUrl, autoClaimOnPayment, setAutoClaimOnPayment,
  greetingMessage, setGreetingMessage, setIsDirty
}: BotConfigFormProps) {
  
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveConfig({ ...config, prefix, statusText, statusType, webhookUrl, autoClaimOnPayment, greetingMessage, botToken });
      setSaveSuccess(true);
      setIsDirty(false);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1000);
    } catch (err) { console.error(err); } finally { setSaving(false); }
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BotTokenField botToken={botToken} setBotToken={setBotToken} showToken={showToken} setShowToken={setShowToken} setIsDirty={setIsDirty} />
          <BotIdentityFields prefix={prefix} setPrefix={setPrefix} statusText={statusText} setStatusText={setStatusText} statusType={statusType} setStatusType={setStatusType} setIsDirty={setIsDirty} />
        </div>

        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 mt-6">
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
                Ketika aktif, jika transaksi selesai/berhasil maka sistem akan segera mengirimkan digital item key/kode (baris pertama stok produk) langsung ke DM (Direct Message) Discord customer secara real-time.
              </p>
            </div>
          </label>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving || saveSuccess}
            className={`
              relative overflow-hidden px-8 py-3 rounded-xl font-bold text-sm text-white
              transition-all duration-300 transform outline-none
              ${saving 
                ? 'bg-indigo-600/80 cursor-not-allowed scale-95' 
                : saveSuccess 
                  ? 'bg-emerald-600 hover:bg-emerald-500 scale-100 shadow-xl shadow-emerald-900/30 ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0f1523]'
                  : 'bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-xl shadow-indigo-900/30'
              }
            `}
          >
            <div className="flex items-center gap-2 relative z-10">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan Setelan...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-100" />
                  <span>Disimpan & Sinkronisasi Selesai!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Konfigurasi</span>
                </>
              )}
            </div>
          </button>
        </div>
      </form>
    </div>
  );
}
