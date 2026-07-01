import React from 'react';
import { Database, AlertTriangle, LogOut } from 'lucide-react';

interface SidebarFooterProps {
  dbEngine: string;
}

export default function SidebarFooter({ dbEngine }: SidebarFooterProps) {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.dispatchEvent(new Event('auth_error'));
  };

  return (
    <div className="p-6 border-t border-slate-800 space-y-4">
      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors text-sm font-medium border border-slate-700"
      >
        <LogOut className="w-4 h-4" />
        Logout Admin Panel
      </button>

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
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Enterprise v2.5.0</span>
        <span className="text-indigo-400">Node + Discord.js v14</span>
      </div>
    </div>
  );
}
