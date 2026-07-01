import React, { useState, useEffect } from 'react';
import { fetchWithAuth as fetch } from '../../lib/api';
import { Transaction } from '../../types';
import { History, Search } from 'lucide-react';

export default function LedgerTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchSearch = t.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'ALL' || t.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            Riwayat Transaksi (Ledger)
          </h2>
          <p className="text-slate-400 text-sm mt-1">Daftar semua pergerakan saldo (Topup, Refund, Pembelian).</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari Username / ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-teal-500 transition-colors"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="PURCHASE">Pembelian</option>
            <option value="REFUND">Refund</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 uppercase font-mono tracking-wider">
                <th className="py-4 px-6">ID Transaksi</th>
                <th className="py-4 px-6">Pelanggan Discord</th>
                <th className="py-4 px-6">Jenis</th>
                <th className="py-4 px-6 text-right">Nominal</th>
                <th className="py-4 px-6">Keterangan</th>
                <th className="py-4 px-6">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {loading ? (
                 <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto"></div>
                  </td>
                 </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500">
                    Tidak ada data transaksi.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-6 font-mono text-[10px] text-slate-500">{tx.id}</td>
                    <td className="py-3 px-6">
                      <div className="font-medium text-slate-200">{tx.username}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tx.userId}</div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded-md font-medium text-[10px] uppercase tracking-wider ${
                        tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' :
                        tx.type === 'REFUND' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-3 px-6 text-right font-mono font-medium ${tx.type === 'PURCHASE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {tx.type === 'PURCHASE' ? '-' : '+'}{formatIDR(Math.abs(tx.amount))}
                    </td>
                    <td className="py-3 px-6 text-slate-400">{tx.description}</td>
                    <td className="py-3 px-6 text-slate-400 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
