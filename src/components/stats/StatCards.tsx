import React from 'react';
import { DollarSign, ShoppingBag, Users, ShieldAlert } from 'lucide-react';
import { BotStats } from '../../types';

interface StatCardsProps {
  stats: BotStats;
  formatIDR: (num: number) => string;
}

export default function StatCards({ stats, formatIDR }: StatCardsProps) {
  const statCardsData = [
    { 
      label: 'Pendapatan Total', 
      value: formatIDR(stats.totalRevenue), 
      sub: 'Penjualan bot tersinkronisasi', 
      icon: DollarSign, 
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
    },
    { 
      label: 'Total Pesanan / Transaksi', 
      value: stats.totalOrders.toString() + ' Transaksi', 
      sub: 'Klaim instant di-deliver', 
      icon: ShoppingBag, 
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
    },
    { 
      label: 'Server Discord Aktif', 
      value: stats.activeServers.toString() + ' Server', 
      sub: 'Server store & moderasi', 
      icon: Users, 
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
    },
    { 
      label: 'Automod Strikes & Warns', 
      value: stats.moderationActions.toString() + ' Kasus', 
      sub: 'Ditindak bot secara otomatis', 
      icon: ShieldAlert, 
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" id="stats-grid">
      {statCardsData.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx} 
            className={`p-6 bg-slate-900 border ${card.color} rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-md hover:scale-[1.02] transition-transform duration-350`}
          >
            <div className="space-y-2">
              <span className="text-xs text-slate-400 block font-medium uppercase font-display tracking-widest">{card.label}</span>
              <h3 className="text-2xl font-bold font-display text-white tracking-tight">{card.value}</h3>
              <p className="text-[11px] text-slate-400 font-medium">{card.sub}</p>
            </div>
            <div className={`p-3 rounded-xl ${card.color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
