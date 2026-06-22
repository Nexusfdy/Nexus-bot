import React from 'react';
import { PlusCircle } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  channelName: string;
}

export default function ChatInput({ value, onChange, onSubmit, channelName }: ChatInputProps) {
  return (
    <div className="p-4 shrink-0 bg-[#313338]">
      <form onSubmit={onSubmit} className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Ketik pesan ke #${channelName} (Gunakan / untuk commands)`}
          className="w-full bg-[#383a40] border border-transparent rounded-lg px-4 py-3 pl-11 text-xs text-[#dbdee1] placeholder-[#80848e] focus:outline-none focus:ring-0 select-text"
        />
        <div className="absolute left-3 top-3 text-[#b5bac1] hover:text-white cursor-pointer">
          <PlusCircle className="w-5 h-5" />
        </div>
        <button 
          type="submit"
          className="absolute right-3 top-2 px-2.5 py-1.5 bg-[#4e5058] hover:bg-[#5865F2] text-white rounded text-[10px] font-bold"
        >
          KIRIM
        </button>
      </form>
      <div className="flex items-center justify-between text-[10px] text-[#949ba4] font-semibold mt-1 px-1">
        <span>Gunakan <strong className="text-slate-300 font-bold">/help</strong> atau <strong className="text-slate-300 font-bold">/stock</strong> untuk memulai belanja</span>
        <span>Online Latency: 4ms</span>
      </div>
    </div>
  );
}
