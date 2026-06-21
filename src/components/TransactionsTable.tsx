import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Filter, 
  Check, 
  Download,
  AlertCircle
} from 'lucide-react';
import { Order } from '../types';

interface TransactionsTableProps {
  orders: Order[];
  onMarkSuccess?: (orderId: string) => Promise<void>;
}

export default function TransactionsTable({ orders, onMarkSuccess }: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Success' | 'Claimed'>('All');

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.customerUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.productName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4">
      {/* Search and filters bar */}
      <div className="p-6 border-b border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/20">
        <div>
          <h2 className="text-sm font-bold font-display text-white">Log Transaksi & Penjualan</h2>
          <p className="text-xs text-slate-400">Arsip laporan pemesanan, kuitansi digital, dan audit status klaim voucher</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari ID order, nama..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-56"
            />
          </div>

          {/* Filter Status select */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 border border-slate-800 rounded-xl">
            {(['All', 'Pending', 'Success', 'Claimed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === st 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {st === 'All' ? 'SEMUA' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table rows */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-850 text-slate-500 uppercase font-mono tracking-wider">
              <th className="py-4 px-6">ID Transaksi</th>
              <th className="py-4 px-6">Pelanggan Discord</th>
              <th className="py-4 px-6">Produk digital</th>
              <th className="py-4 px-6">Jumlah Harga</th>
              <th className="py-4 px-6">Status Bayar</th>
              <th className="py-4 px-6">Waktu Transaksi</th>
              <th className="py-4 px-6">Disbursed Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60">
            {filteredOrders.map((ord) => {
              let statusBadge = '';
              let badgeText = ord.status;

              if (ord.status === 'Claimed') {
                statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';
                badgeText = 'Claimed (Selesai)';
              } else if (ord.status === 'Success') {
                statusBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/15';
                badgeText = 'Paid (Terbayar)';
              } else {
                statusBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/15';
                badgeText = 'Pending QRIS';
              }

              return (
                <tr key={ord.id} className="hover:bg-slate-950/20 transition-all">
                  {/* Order ID */}
                  <td className="py-4 px-6 font-mono text-slate-300 font-bold">
                    {ord.id}
                  </td>
                  {/* User info */}
                  <td className="py-4 px-6 font-semibold text-slate-200">
                    @{ord.customerUsername}
                  </td>
                  {/* Product */}
                  <td className="py-4 px-6 text-indigo-400 font-medium font-display">
                    {ord.productName}
                  </td>
                  {/* Price */}
                  <td className="py-4 px-6 font-semibold text-slate-300 font-mono">
                    {formatIDR(ord.price)}
                  </td>
                  {/* Status */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                      {badgeText}
                    </span>
                  </td>
                  {/* Created At */}
                  <td className="py-4 px-6 text-slate-500 font-mono text-[10px]">
                    {new Date(ord.createdAt).toLocaleString('id-ID')}
                  </td>
                  {/* Key items */}
                  <td className="py-4 px-6 font-mono text-slate-400 max-w-[180px] truncate">
                    {ord.claimedStockItem ? (
                      <span className="bg-slate-950/80 p-1 px-2 rounded-md text-[10px] text-slate-300 font-mono border border-slate-800">
                        {ord.claimedStockItem}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic">Belum diklaim</span>
                    )}

                    {ord.status === 'Pending' && onMarkSuccess && (
                      <button
                        onClick={() => onMarkSuccess(ord.id)}
                        className="ml-3 text-[10px] bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-emerald-500 hover:text-white px-2 py-1 rounded font-bold transition-colors"
                      >
                        Tandai Bayar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-500">
                  Tidak ada data pembelian dengan parameter pencarian ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
