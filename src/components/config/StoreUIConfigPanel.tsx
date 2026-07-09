import React, { useState } from 'react';
import { StoreUIConfig, defaultUIConfig } from '../../types';
import { LayoutTemplate } from 'lucide-react';

export default function StoreUIConfigPanel({ config, onSave }: { config: StoreUIConfig | undefined, onSave: (config: StoreUIConfig) => void }) {
  const [ui, setUi] = useState<StoreUIConfig>(config || defaultUIConfig);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setUi(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(ui);
    setSaving(false);
  };

  return (
    <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/50 mt-8">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"><LayoutTemplate className="w-5 h-5 text-indigo-400" /></div>Store UI & Payment Settings</h3>
      
      <div className="space-y-6">
        {/* Store Basics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Store Name</label>
            <input type="text" name="storeName" value={ui.storeName} onChange={handleChange} className="w-full bg-[#0a0f1a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Store Color (Hex)</label>
            <input type="text" name="storeColor" value={ui.storeColor} onChange={handleChange} className="w-full bg-[#0a0f1a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Store Description</label>
            <textarea name="storeDescription" value={ui.storeDescription} onChange={handleChange} rows={2} className="w-full bg-[#0a0f1a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Store Thumbnail URL</label>
            <input type="text" name="storeThumbnail" value={ui.storeThumbnail} onChange={handleChange} placeholder="https://..." className="w-full bg-[#0a0f1a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Store Banner URL</label>
            <input type="text" name="storeBanner" value={ui.storeBanner} onChange={handleChange} placeholder="https://..." className="w-full bg-[#0a0f1a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Store Footer</label>
            <input type="text" name="storeFooter" value={ui.storeFooter} onChange={handleChange} className="w-full bg-[#0a0f1a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none" />
          </div>
        </div>

        {/* Payment */}
        <h4 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2">Payment Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Payment Provider</label>
            <input type="text" name="paymentProvider" value={ui.paymentProvider} onChange={handleChange} placeholder="saweria" className="w-full bg-[#0a0f1a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Payment URL</label>
            <input type="text" name="paymentUrl" value={ui.paymentUrl} onChange={handleChange} placeholder="https://saweria.co/username" className="w-full bg-[#0a0f1a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Payment Description Template (use {'{provider}'} for dynamic name)</label>
            <textarea name="paymentDescription" value={ui.paymentDescription} onChange={handleChange} rows={3} className="w-full bg-[#0a0f1a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none" />
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Store UI Config'}
          </button>
        </div>
      </div>
    </div>
  );
}
