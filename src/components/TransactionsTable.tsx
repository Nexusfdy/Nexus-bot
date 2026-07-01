import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import TransactionFilter from './transactions/TransactionFilter';
import TransactionRow from './transactions/TransactionRow';

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
      <TransactionFilter 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        statusFilter={statusFilter} 
        setStatusFilter={setStatusFilter} 
      />

      {/* Table rows */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-850 text-slate-500 uppercase font-mono tracking-wider">
              <th className="py-4 px-6">ID Pesanan</th>
              <th className="py-4 px-6">Pelanggan Discord</th>
              <th className="py-4 px-6">Produk digital</th>
              <th className="py-4 px-6">Jumlah Harga</th>
              <th className="py-4 px-6">Status Bayar</th>
              <th className="py-4 px-6">Waktu Transaksi</th>
              <th className="py-4 px-6">Disbursed Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60">
            {filteredOrders.map((ord) => (
              <TransactionRow key={ord.id} ord={ord} formatIDR={formatIDR} onMarkSuccess={onMarkSuccess} />
            ))}

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
