import React, { useState } from 'react';
import { Rss, Check, Info } from 'lucide-react';
import { BotConfig } from '../../types';

interface WebhookSettingsProps {
  webhookUrl: string;
  setWebhookUrl: (val: string) => void;
  greetingMessage: string;
  setGreetingMessage: (val: string) => void;
  onTriggerWebhookTest: () => Promise<boolean>;
  setIsDirty: (val: boolean) => void;
  onUpdatePartialConfig?: (section: string, data: Partial<BotConfig>) => Promise<void>;
}

export default function WebhookSettings({ webhookUrl, setWebhookUrl, greetingMessage, setGreetingMessage, onTriggerWebhookTest, setIsDirty, onUpdatePartialConfig }: WebhookSettingsProps) {
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<'success' | 'err' | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!onUpdatePartialConfig) return;
    setSaving(true);
    await onUpdatePartialConfig('features', { webhookUrl, greetingMessage });
    setSaving(false);
  };

  return (
    <div className="bg-[#0f1523] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-inner">
            <Rss className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-200">Webhook Logging & Web Integrations</h2>
            <p className="text-[11px] text-slate-400">Hubungkan bot ke channel log Discord transaksi secara eksternal web-dashboard.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Webhook Settings'}
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">Discord Webhook Log URL</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={webhookUrl}
              onChange={e => { setWebhookUrl(e.target.value); setIsDirty(true); }}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
            />
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={!webhookUrl || testingWebhook}
              className={`
                px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center justify-center gap-2
                ${(!webhookUrl || testingWebhook) 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                }
              `}
            >
              {testingWebhook ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : webhookResult === 'success' ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Sent!
                </>
              ) : (
                'Test Webhook'
              )}
            </button>
          </div>
          {webhookResult === 'err' && (
            <p className="text-rose-400 text-xs mt-2 font-medium bg-rose-950/30 p-2 rounded-lg inline-block border border-rose-900/30">
              ❌ Webhook tidak valid atau diblokir. Pastikan format URL Discord benar.
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1 flex items-center gap-1.5">
            Auto-Reply Text (Pesan Sapaan)
            <Info className="w-3 h-3 text-slate-500" />
          </label>
          <textarea
            value={greetingMessage}
            onChange={e => { setGreetingMessage(e.target.value); setIsDirty(true); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none font-medium h-24"
            placeholder="Ketik pesan selamat datang atau instruksi pembelian otomatis di sini..."
          />
        </div>
      </div>
    </div>
  );
}
