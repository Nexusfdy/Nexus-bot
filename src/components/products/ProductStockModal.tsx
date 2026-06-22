import React, { useState } from 'react';
import { X, PlusCircle, Trash2, Database } from 'lucide-react';
import { Product } from '../../types';

interface ProductStockModalProps {
  prod: Product;
  onClose: () => void;
  onAddStockBulk: (items: string[]) => Promise<void>;
  onDeleteStockItem: (index: number) => Promise<void>;
}

export default function ProductStockModal({ prod, onClose, onAddStockBulk, onDeleteStockItem }: ProductStockModalProps) {
  const [bulkStockInput, setBulkStockInput] = useState('');

  const handleAdd = async () => {
    const itemsToAdd = bulkStockInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (itemsToAdd.length === 0) return;
    await onAddStockBulk(itemsToAdd);
    setBulkStockInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-widest px-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              INVENTORI: {prod.name}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Batch Tambah Cadangan (1 baris = 1 Item)</h4>
            <div className="relative">
              <textarea value={bulkStockInput} onChange={e => setBulkStockInput(e.target.value)} placeholder={`AAAA-BBBB-CCCC\nXYZ1-XYZ2-XYZ3`} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed" />
              <button disabled={!bulkStockInput} onClick={handleAdd} className="absolute bottom-3 right-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <PlusCircle className="w-3.5 h-3.5" /> <span>Suntik Data</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Data Stok Mengantri</h4>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm">{prod.stock?.length || 0} Tersedia</span>
            </div>

            {(!prod.stock || prod.stock.length === 0) ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                <span className="text-sm font-semibold text-slate-500">Stok digital kosong. Tidak ada data rahasia.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {prod.stock.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-950 border border-slate-800/80 rounded-xl p-3 group hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-[10px] font-bold text-slate-600 w-5 text-right">{idx + 1}.</span>
                      <span className="text-sm font-mono text-slate-300 font-semibold truncate select-all">{item}</span>
                    </div>
                    <button onClick={() => onDeleteStockItem(idx)} className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-900 hover:bg-rose-950 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0" title="Cabut Stok">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
