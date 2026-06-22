import React from 'react';
import { Search } from 'lucide-react';

type StatusType = 'All' | 'Pending' | 'Success' | 'Claimed';

interface TransactionFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: StatusType;
  setStatusFilter: (term: StatusType) => void;
}

export default function TransactionFilter({ searchTerm, setSearchTerm, statusFilter, setStatusFilter }: TransactionFilterProps) {
  return (
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
  );
}
