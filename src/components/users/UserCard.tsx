import React from 'react';
import { User } from '../../types';
import { Settings, Coins, CalendarDays, KeySquare } from 'lucide-react';

interface UserCardProps {
  user: User;
  onManageBalance: (user: User) => void;
}

export default function UserCard({ user, onManageBalance }: UserCardProps & { key?: React.Key }) {
  const joinDate = new Date(user.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 group flex flex-col relative h-full">
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base">{user.accountName}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user.discordId}</p>
          </div>
          <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-xl">
            <Settings className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Saldo: <span className="font-bold text-emerald-400">Rp {user.balance.toLocaleString('id-ID')}</span></span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Bergabung: <span className="text-slate-300">{joinDate}</span></span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80 p-3 grid grid-cols-1 bg-slate-950/30">
        <button
          onClick={() => onManageBalance(user)}
          className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-slate-300 bg-slate-900 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
        >
          <Coins className="w-3.5 h-3.5" />
          Kelola Saldo
        </button>
      </div>
    </div>
  );
}
