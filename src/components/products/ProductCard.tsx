import React from 'react';
import { Database, Edit3, Trash2, Layers, Hash } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  prod: Product;
  onEdit: (prod: Product) => void;
  onDelete: (id: string) => void;
  onManageStock: (prod: Product) => void;
}

export default function ProductCard({ prod, onEdit, onDelete, onManageStock }: ProductCardProps & { key?: React.Key }) {
  const stockCount = prod.stock?.length || 0;
  let stockBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  let stockStatus = 'Habis (Out of Stock)';
  
  if (stockCount > 2) {
    stockBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    stockStatus = `${stockCount} Item Tersedia`;
  } else if (stockCount > 0) {
    stockBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    stockStatus = `Menipis (${stockCount} Item)`;
  }

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl group transition-all hover:border-indigo-500/30">
      <div className="relative h-44 bg-slate-950 overflow-hidden shrink-0">
        {prod.imageUrl ? (
          <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-slate-950 flex flex-col items-center justify-center">
            <Layers className="w-10 h-10 text-slate-800 mb-2" />
            <span className="text-[10px] font-mono text-slate-700 font-bold uppercase tracking-widest">{prod.category || 'NO IMAGE'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-slate-300 font-mono flex items-center border border-slate-800/80">
          <Hash className="w-3 h-3 text-indigo-400" />
          <span>{prod.code || prod.id}</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">{prod.name}</h3>
        <p className="text-emerald-400 font-bold font-mono text-sm tracking-tight mb-3">
          {formatIDR(prod.price)}
        </p>
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-4 flex-1">
          {prod.description}
        </p>

        <div className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${stockBadgeColor}`}>
          <Database className="w-3 h-3" />
          {stockStatus}
        </div>
      </div>

      <div className="grid grid-cols-5 divide-x divide-slate-800 border-t border-slate-800 shrink-0">
        <button onClick={() => onManageStock(prod)} className="col-span-3 py-2.5 bg-slate-900 hover:bg-indigo-900/30 hover:text-indigo-300 text-slate-300 text-[11px] font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-slate-500" /> Atur Stok
        </button>
        <button onClick={() => onEdit(prod)} className="col-span-1 flex items-center justify-center py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Edit Produk">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(prod.id)} className="col-span-1 flex items-center justify-center py-2.5 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 transition-colors" title="Hapus Permanen">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
