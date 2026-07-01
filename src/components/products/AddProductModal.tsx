import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Product } from '../../types';

interface AddProductModalProps {
  onClose: () => void;
  onSave: (prod: any) => Promise<void>;
  editProduct: Product | null;
}

export default function AddProductModal({ onClose, onSave, editProduct }: AddProductModalProps) {
  const [name, setName] = useState(editProduct?.name || '');
  const [code, setCode] = useState(editProduct?.code || '');
  const [price, setPrice] = useState<number | ''>(editProduct?.price || '');
  const [description, setDescription] = useState(editProduct?.description || '');
  const [type, setType] = useState<'License Key' | 'Download Link' | 'Accounts'>(editProduct?.type || 'License Key');
  const [category, setCategory] = useState(editProduct?.category || 'General');
  const [imageUrl, setImageUrl] = useState(editProduct?.imageUrl || '');
  const [stockText, setStockText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || typeof price !== 'number') return;
    const initialStock = stockText ? stockText.split('\n').map(s => s.trim()).filter(s => s.length > 0) : [];
    
    await onSave({
      name, code, price: Number(price), description, type, category, imageUrl: imageUrl || undefined, stock: editProduct ? editProduct.stock : initialStock
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <h3 className="text-sm font-bold text-white font-display uppercase tracking-widest px-2">
            {editProduct ? 'Edit Setup Produk' : 'Buat Produk Baru'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Judul / Nama Item *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Nitro Basic 1 Bulan" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Kode Produk *</label>
                <input required type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Contoh: NIBB" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Harga (Rupiah) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">Rp</span>
                  <input required type="number" value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="45000" className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Kategori Tag</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Akun, Lisensi, Jasa..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Image URL Banner (Opsional)</label>
                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Format Tipe *</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                  <option value="License Key">License Key / Aktivasi</option>
                  <option value="Accounts">Detil Login Akun</option>
                  <option value="Download Link">Tautan Download Pihak Ketiga</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Deskripsi Promosi</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tuliskan keuntungan beli produk ini..." rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-medium text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
              </div>

              {!editProduct && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Batch Setup Stok Awal (Opsional)</label>
                  <textarea value={stockText} onChange={e => setStockText(e.target.value)} placeholder="Isi satu key/akun per baris. Contoh:\nKEY-A1B2\nKEY-XYZ9" rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed" />
                  <p className="text-[10px] text-slate-500 pl-1 mt-1">Anda selalu bisa menambah stok nanti menggunakan tombol "Atur Stok" di tabel produk.</p>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors">Batal</button>
          <button type="submit" form="product-form" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all">
            <Check className="w-4 h-4" /> <span>{editProduct ? 'Update Produk' : 'Terbitkan Produk'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
