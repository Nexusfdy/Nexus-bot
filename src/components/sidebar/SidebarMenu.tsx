import React from 'react';
import { BarChart3, Package, Settings, ShieldCheck, Terminal, RefreshCw, Users, Command } from 'lucide-react';

interface SidebarMenuProps {
  activeTab: string;
  handleTabClick: (tabId: string) => void;
}

export default function SidebarMenu({ activeTab, handleTabClick }: SidebarMenuProps) {
  const menuItems = [
    { id: 'overview', name: 'Ringkasan & Stats', icon: BarChart3, color: 'text-emerald-400' },
    { id: 'products', name: 'Kelola Produk & Stok', icon: Package, color: 'text-blue-400' },
    { id: 'transactions', name: 'Riwayat Transaksi', icon: RefreshCw, color: 'text-teal-400' },
    { id: 'users', name: 'Manajemen User', icon: Users, color: 'text-fuchsia-400' },
    { id: 'config', name: 'Konfigurasi Bot Discord', icon: Settings, color: 'text-indigo-400' },
    { id: 'custom-commands', name: 'Kustom Perintah', icon: Command, color: 'text-violet-400' },
    { id: 'automod', name: 'Sistem Auto-Mod', icon: ShieldCheck, color: 'text-rose-400' },
    { id: 'simulator', name: 'Simulator Bot Live', icon: Terminal, color: 'text-amber-400' },
  ];

  return (
    <nav className="px-4 space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`sidebar-tab-${item.id}`}
            onClick={() => handleTabClick(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive 
                ? 'bg-indigo-600/10 text-indigo-200 font-semibold border-l-4 border-indigo-500' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-4 border-transparent'
            }`}
          >
            <Icon className={`w-5 h-5 ${item.color} ${isActive ? 'scale-110' : ''}`} />
            <span>{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
