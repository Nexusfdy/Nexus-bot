import React from 'react';
import { Hash } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  cat: string;
}

interface ChannelListProps {
  channels: Channel[];
  activeChannel: string;
  setActiveChannel: (val: string) => void;
}

export default function ChannelList({ channels, activeChannel, setActiveChannel }: ChannelListProps) {
  // Grouping manually for this simple UI:
  return (
    <div className="hidden md:flex w-60 bg-[#2b2d31] flex-col justify-between shrink-0 select-none text-slate-400 text-xs font-medium border-r border-[#202225]">
      <div>
        <div className="h-12 border-b border-[#202225] flex items-center justify-between px-4 font-bold text-white tracking-wide">
          <h3>⭐ NEXUS PREMIUM</h3>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-[#2b2d31]" />
        </div>

        <div className="p-3 space-y-4">
          {channels.map((c) => (
            <div key={c.id}>
              <span className="px-1 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider block mb-1">
                {c.cat}
              </span>
              <button
                onClick={() => setActiveChannel(c.id)}
                className={`w-full px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  activeChannel === c.id ? 'bg-[#35373c] text-white' : 'hover:bg-[#35373c]/40 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Hash className="w-4 h-4 text-[#80848e]" />
                  <span>{c.name}</span>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="h-14 bg-[#232428] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-indigo-500 font-bold flex items-center justify-center text-xs text-white">
              M
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 border-2 border-[#232428]" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-white text-[11px] block truncate">Member_Toko</span>
            <span className="text-[9px] text-[#949ba4] block">#0001</span>
          </div>
        </div>
      </div>
    </div>
  );
}
