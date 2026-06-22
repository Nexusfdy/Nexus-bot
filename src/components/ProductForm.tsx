import React, { useState } from 'react';
import { Plus, Info, FileText } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './products/ProductCard';
import AddProductModal from './products/AddProductModal';
import ProductStockModal from './products/ProductStockModal';

interface ProductFormProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProduct: (id: string, updated: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export default function ProductForm({ 
  products, onAddProduct, onUpdateProduct, onDeleteProduct 
}: ProductFormProps) {
  
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const openAddModal = () => {
    setEditProduct(null);
    setShowModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditProduct(prod);
    setShowModal(true);
  };

  const handleSaveProduct = async (prodData: any) => {
    if (editProduct) {
      await onUpdateProduct(editProduct.id, prodData);
    } else {
      await onAddProduct(prodData);
    }
    setShowModal(false);
  };

  const handleAddStockBulk = async (itemsToAdd: string[]) => {
    if (!showStockModal) return;
    const newStock = [...(showStockModal.stock || []), ...itemsToAdd];
    await onUpdateProduct(showStockModal.id, { stock: newStock });
    setShowStockModal({ ...showStockModal, stock: newStock });
  };

  const handleDeleteStockItem = async (index: number) => {
    if (!showStockModal) return;
    const confirmed = window.confirm('Hapus item stock ini?');
    if (!confirmed) return;
    const newStock = [...(showStockModal.stock || [])];
    newStock.splice(index, 1);
    await onUpdateProduct(showStockModal.id, { stock: newStock });
    setShowStockModal({ ...showStockModal, stock: newStock });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between" id="products-header">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Kelola Produk & Inventori Toko</h1>
          <p className="text-xs text-slate-400">Atur produk digital Anda, unggah serial key/akreditasi, dan tambah stok intuitif</p>
        </div>
        <button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all">
          <Plus className="w-4 h-4" /> <span>Tambah Produk Baru</span>
        </button>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <p className="font-semibold text-slate-200">Sistem Pengiriman Otomatis (Auto-Claim)</p>
          <p className="mt-0.5 text-slate-400">Pastikan Anda mengunggah stok cadangan untuk produk bertipe <strong className="text-slate-100">License Key</strong> atau <strong className="text-slate-100">Accounts</strong>. Pembeli di Discord akan meminta kode secara instan dan stok akan berkurang secara terstruktur.</p>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="products-grid">
          {products.map((prod) => (
            <ProductCard 
              key={prod.id} prod={prod} 
              onEdit={openEditModal} onDelete={onDeleteProduct} onManageStock={(p) => setShowStockModal(p)} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">Belum ada rilis produk</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md">Tambahkan produk pertama Anda mulai dari lisensi aplikasi, token, aset visual, hingga layanan e-commerce lainnya.</p>
          <button onClick={openAddModal} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-900/20 transition-colors">
            Setup Form Produk
          </button>
        </div>
      )}

      {showModal && (
        <AddProductModal onClose={() => setShowModal(false)} onSave={handleSaveProduct} editProduct={editProduct} />
      )}

      {showStockModal && (
        <ProductStockModal prod={showStockModal} onClose={() => setShowStockModal(null)} onAddStockBulk={handleAddStockBulk} onDeleteStockItem={handleDeleteStockItem} />
      )}
    </div>
  );
}
