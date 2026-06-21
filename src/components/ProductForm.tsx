import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Database, 
  Hash, 
  Layers, 
  FileText, 
  Check, 
  X,
  PlusCircle,
  TrendingDown,
  Info
} from 'lucide-react';
import { Product } from '../types';

interface ProductFormProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProduct: (id: string, updated: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export default function ProductForm({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct 
}: ProductFormProps) {
  
  // Modal controllers
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'License Key' | 'Download Link' | 'Accounts'>('License Key');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stockText, setStockText] = useState(''); // Raw stock string for batch insert

  // Bulk stock state
  const [bulkStockInput, setBulkStockInput] = useState('');

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const openAddModal = () => {
    setEditProduct(null);
    setName('');
    setPrice('');
    setDescription('');
    setType('License Key');
    setCategory('General');
    setImageUrl('');
    setStockText('');
    setShowModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditProduct(prod);
    setName(prod.name);
    setPrice(prod.price);
    setDescription(prod.description);
    setType(prod.type);
    setCategory(prod.category || 'General');
    setImageUrl(prod.imageUrl || '');
    setStockText(''); // Editing items handles stock separately
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const initialStock = stockText
      ? stockText.split('\n').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    if (editProduct) {
      await onUpdateProduct(editProduct.id, {
        name,
        price: Number(price),
        description,
        type,
        category,
        imageUrl: imageUrl || undefined
      });
    } else {
      await onAddProduct({
        name,
        price: Number(price),
        description,
        type,
        category,
        imageUrl: imageUrl || undefined,
        stock: initialStock
      });
    }

    setShowModal(false);
  };

  const handleAddStockBulk = async () => {
    if (!showStockModal) return;
    const itemsToAdd = bulkStockInput
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (itemsToAdd.length === 0) return;

    const newStock = [...showStockModal.stock, ...itemsToAdd];
    await onUpdateProduct(showStockModal.id, { stock: newStock });
    
    // update current selected product in modal list
    setShowStockModal({
      ...showStockModal,
      stock: newStock
    });
    setBulkStockInput('');
  };

  const handleDeleteStockItem = async (index: number) => {
    if (!showStockModal) return;
    const confirmed = window.confirm('Hapus item stock ini?');
    if (!confirmed) return;

    const newStock = [...showStockModal.stock];
    newStock.splice(index, 1);
    
    await onUpdateProduct(showStockModal.id, { stock: newStock });
    setShowStockModal({
      ...showStockModal,
      stock: newStock
    });
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between" id="products-header">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Kelola Produk & Inventori Toko</h1>
          <p className="text-xs text-slate-400">Atur produk digital Anda, unggah serial key/akreditasi, dan tambah stok intuitif</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Info notice */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <p className="font-semibold text-slate-200">Sistem Pengiriman Otomatis (Auto-Claim)</p>
          <p className="mt-0.5 text-slate-400">
            Pastikan Anda mengunggah stok cadangan untuk produk bertipe <strong className="text-slate-100">License Key</strong> atau <strong className="text-slate-100">Accounts</strong>. Pembeli di Discord akan meminta kode secara instan dan stok akan berkurang secara terstruktur.
          </p>
        </div>
      </div>

      {/* Grid of existing Products */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="products-grid">
          {products.map((prod) => {
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

            return (
              <div 
                key={prod.id} 
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl group transition-all hover:border-indigo-500/30"
              >
                {/* Card visual banner or placeholder */}
                <div className="relative h-44 bg-slate-950 overflow-hidden shrink-0">
                  {prod.imageUrl ? (
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-6 text-center">
                      <Database className="w-12 h-12 text-slate-700 " />
                    </div>
                  )}
                  {/* Category tag */}
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-[10px] text-indigo-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                    {prod.category || 'General'}
                  </span>

                  {/* Price tag */}
                  <div className="absolute bottom-3 right-3 bg-indigo-600 font-display font-bold text-sm px-3 py-1.5 rounded-lg shadow-lg text-white border border-indigo-500/50">
                    {formatIDR(prod.price)}
                  </div>
                </div>

                {/* Card content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                      <span>Tipe: {prod.type}</span>
                      <span>ID: {prod.id}</span>
                    </div>
                    <h3 className="text-md font-bold text-white font-display tracking-tight group-hover:text-indigo-400 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  {/* Stock tracker footer inside card */}
                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono block">Status Stock</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${stockBadgeColor}`}>
                        {stockStatus}
                      </span>
                    </div>

                    {/* Operational actions inside card */}
                    <div className="flex items-center space-x-1.5">
                      <button
                        title="Kelola Stock"
                        onClick={() => setShowStockModal(prod)}
                        className="p-1.5 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800 rounded-lg text-slate-300 hover:text-indigo-400 hover:border-indigo-500/25 transition-all text-xs flex items-center gap-1 px-2.5"
                      >
                        <Hash className="w-3.5 h-3.5" />
                        <span>Stok</span>
                      </button>
                      <button
                        title="Edit Produk"
                        onClick={() => openEditModal(prod)}
                        className="p-2 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800 rounded-lg text-slate-300 hover:text-indigo-400 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Hapus Produk"
                        onClick={() => onDeleteProduct(prod.id)}
                        className="p-2 bg-slate-950/60 hover:bg-rose-950 text-slate-300 hover:text-rose-400 hover:border-rose-900 border border-slate-800 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-850 p-12 text-slate-500 text-xs flex flex-col items-center gap-2.5 justify-center py-20 shadow-inner">
          <Database className="w-10 h-10 text-slate-700 animate-pulse mb-1" />
          <p className="font-semibold text-slate-300 text-sm">Belum Ada Produk Digital Terdaftar</p>
          <p className="text-slate-550 max-w-sm leading-relaxed">
            Daftar persediaan Anda kosong. Silakan gunakan tombol <strong className="text-indigo-400 font-semibold">"Buat Produk Premium Baru"</strong> di atas untuk mendaftarkan lisensi atau akun jualan pertama Anda!
          </p>
        </div>
      )}

      {/* MODAL 1: ADD & EDIT PRODUCT FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h2 className="font-display font-bold text-white text-md">
                {editProduct ? 'Edit Informasi Produk' : 'Buat Produk Baru'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: Spotify Premium 1 Bulan Privat"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Harga (IDR) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Contoh: 15000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Kategori</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Contoh: Premium Subs"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Tipe Pengiriman</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                  >
                    <option value="License Key">License Key / Code Gift</option>
                    <option value="Download Link">Download Link / Source Code</option>
                    <option value="Accounts">Akun Privat (User:Pass)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">URL Gambar Sampul (Opsional)</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... atau kosongkan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Deskripsi Produk</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Informasi detail mengenai masa aktif produk, garansi, langkah-langkah klaim dst..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600 resize-none"
                />
              </div>

              {!editProduct && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Masukkan Stok Awal (Satu item per baris)</label>
                    <span className="text-[10px] text-indigo-400 font-mono">Bisa dikosongkan</span>
                  </div>
                  <textarea
                    rows={4}
                    value={stockText}
                    onChange={e => setStockText(e.target.value)}
                    placeholder="GIFT-KEY-992288A&#10;GIFT-KEY-443311B&#10;GIFT-KEY-771122C"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder-slate-600 resize-none"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium px-4 py-2 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Produk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAILED INVENTORY & BULK STOCK MANAGER */}
      {showStockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 shrink-0">
              <div>
                <h2 className="font-display font-bold text-white text-md">Kelola Stok Inventori</h2>
                <span className="text-[11px] text-indigo-400 font-mono">{showStockModal.name}</span>
              </div>
              <button 
                onClick={() => setShowStockModal(null)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Box 1: Add bulk stocks */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200">Ketik / Paste Pembaharuan Stok</h3>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">1 item per baris</span>
                </div>
                <textarea
                  rows={3}
                  value={bulkStockInput}
                  onChange={e => setBulkStockInput(e.target.value)}
                  placeholder="Ketik kunci baru disini... &#10;Contoh:&#10;KEY-SPOTIFY-NEW-1&#10;KEY-SPOTIFY-NEW-2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder-slate-700 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddStockBulk}
                    disabled={bulkStockInput.trim().length === 0}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[11px] font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambahkan ke Database</span>
                  </button>
                </div>
              </div>

              {/* Box 2: Stock item rows listing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Daftar Stock Aktif ({showStockModal.stock?.length || 0} item)</span>
                  <span className="text-[10px] text-amber-400 lowercase">Klaim otomatis mengambil index teratas</span>
                </div>

                <div className="border border-slate-850 bg-slate-950/20 max-h-52 overflow-y-auto rounded-xl divide-y divide-slate-850">
                  {showStockModal.stock && showStockModal.stock.length > 0 ? (
                    showStockModal.stock.map((item, index) => (
                      <div key={index} className="px-4 py-2.5 flex items-center justify-between group text-xs">
                        <div className="flex items-center space-x-3 text-slate-200 font-mono">
                          <span className="text-[9px] text-slate-500 font-bold bg-slate-800 px-1.5 py-0.5 rounded-md">
                            #{index + 1}
                          </span>
                          <span className="truncate max-w-[280px]">{item}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteStockItem(index)}
                          className="p-1 px-2.5 rounded-lg border border-transparent hover:border-rose-900 bg-slate-900 text-slate-500 hover:text-white transition-all text-[10px] flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-500">
                      Stok kosong. Gunakan panel di atas untuk mengisi ulang.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end shrink-0">
              <button
                onClick={() => setShowStockModal(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
