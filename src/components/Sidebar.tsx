import React from 'react';
import { 
  BarChart3, 
  Package, 
  Settings, 
  ShieldCheck, 
  Terminal, 
  HelpCircle,
  RefreshCw,
  X,
  Database,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  botOnline: boolean;
  botStatus: "ONLINE" | "CONNECTING" | "OFFLINE" | "ERROR";
  botError: any;
  dbEngine: string;
  onRestartBot: () => void;
  restarting: boolean;
  isOpen: boolean;
  onClose: () => void;
  botUser?: any;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  botOnline, 
  botStatus,
  botError,
  dbEngine,
  onRestartBot, 
  restarting,
  isOpen,
  onClose,
  botUser
}: SidebarProps) {
  
  const menuItems = [
    { id: 'overview', name: 'Ringkasan & Stats', icon: BarChart3, color: 'text-emerald-400' },
    { id: 'products', name: 'Kelola Produk & Stok', icon: Package, color: 'text-blue-400' },
    { id: 'config', name: 'Konfigurasi Bot Discord', icon: Settings, color: 'text-indigo-400' },
    { id: 'custom-commands', name: 'Kustom Perintah', icon: RefreshCw, color: 'text-violet-400' },
    { id: 'automod', name: 'Sistem Auto-Mod', icon: ShieldCheck, color: 'text-rose-400' },
    { id: 'simulator', name: 'Simulator Bot Live', icon: Terminal, color: 'text-amber-400' },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onClose(); // Automatically close mobile drawer
  };

  return (
    <aside 
      className={`w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen fixed top-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`} 
      id="sidebar-container"
    >
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Terminal className="text-white w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none tracking-tight text-white flex items-center gap-1.5">
                NEXUS Discord
              </h1>
              <span className="text-xs text-indigo-400 font-mono">Auto-Store & Mod Portal</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bot Status Dashboard Item */}
        <div className="p-4 mx-4 my-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-3">
          {botUser && botStatus === 'ONLINE' && (
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
              {botUser.avatar ? (
                <img 
                  src={botUser.avatar} 
                  alt={botUser.tag} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl border border-indigo-500/30 object-cover shadow"
                />
              ) : (
                <div className="w-10 h-10 bg-indigo-950/80 rounded-xl border border-indigo-500/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase">{botUser.tag?.slice(0, 2)}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white block truncate leading-tight">{botUser.tag}</span>
                <span className="text-[9px] text-slate-500 font-mono block truncate mt-0.5" title="Copyable Bot Client ID">ID: {botUser.id}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 shrink-0">Status Bot Discord</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                botStatus === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' :
                botStatus === 'CONNECTING' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                botStatus === 'ERROR' ? 'bg-rose-500/10 text-rose-400' :
                'bg-slate-500/10 text-slate-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  botStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' :
                  botStatus === 'CONNECTING' ? 'bg-amber-400 animate-spin' :
                  botStatus === 'ERROR' ? 'bg-rose-500' :
                  'bg-slate-500'
                }`} />
                {botStatus}
              </span>
            </div>
            {botError && (
              <div className={`text-[10px] font-mono leading-relaxed p-2 px-2.5 rounded border max-h-24 overflow-y-auto break-words whitespace-pre-wrap ${
                botStatus === 'ONLINE' 
                  ? 'bg-amber-500/5 border-amber-500/15 text-amber-400' 
                  : 'bg-rose-500/5 border-rose-500/15 text-rose-400'
              }`}>
                {botStatus === 'ONLINE' ? '⚠️ ' : '❌ '}{typeof botError === 'object' ? (botError as any).message || (botError as any).code || JSON.stringify(botError) : String(botError)}
              </div>
            )}
          </div>
          
          <button
            onClick={onRestartBot}
            disabled={restarting}
            className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border transition-all ${
              restarting 
                ? 'bg-slate-850 text-slate-400 border-slate-800 cursor-not-allowed'
                : 'bg-slate-900 text-white border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${restarting ? 'animate-spin' : ''}`} />
            {restarting ? 'Me-reboot core system...' : 'Sinkronisasi & Restart Bot'}
          </button>
        </div>

        {/* Menu Navigation */}
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
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-6 border-t border-slate-800">
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 flex items-start gap-2.5">
          {dbEngine === 'PostgreSQL' ? (
            <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              Database: {dbEngine}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              {dbEngine === 'PostgreSQL' 
                ? 'Tersambung penuh dengan server PostgreSQL. Seluruh aksi disinkronisasi langsung.'
                : 'Menyimpan lokal di server. Konfigurasikan PostgreSQL di lingkungan hosting Anda untuk data permanen.'
              }
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Enterprise v2.5.0</span>
          <span className="text-indigo-400">Node + Discord.js v14</span>
        </div>
      </div>
    </aside>
  );
}
