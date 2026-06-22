import React from 'react';
import { Terminal, X } from 'lucide-react';

interface SidebarHeaderProps {
  onClose: () => void;
}

export default function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
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
  );
}
