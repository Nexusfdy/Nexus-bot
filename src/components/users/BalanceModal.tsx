import React, { useState } from 'react';
import { User } from '../../types';
import { X, Plus, Minus, Check } from 'lucide-react';

interface BalanceModalProps {
  user: User;
  onClose: () => void;
  onUpdateBalance: (discordId: string, amount: number) => Promise<void>;
}

export default function BalanceModal({ user, onClose, onUpdateBalance }: BalanceModalProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [action, setAction] = useState<'add' | 'subtract'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || typeof amount !== 'number') return;

    setIsSubmitting(true);
    try {
      const finalAmount = action === 'add' ? amount : -amount;
      await onUpdateBalance(user.discordId, finalAmount);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Kelola Saldo</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <p className="text-sm text-slate-400 mb-1">User: <span className="font-bold text-white">{user.accountName}</span> ({user.discordId})</p>
            <p className="text-sm text-slate-400">Saldo Saat Ini: <span className="font-bold text-emerald-400">Rp {user.balance.toLocaleString('id-ID')}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAction('add')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${
                  action === 'add' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
              <button
                type="button"
                onClick={() => setAction('subtract')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${
                  action === 'subtract' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Minus className="w-4 h-4" />
                Kurangi
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nominal (Rupiah) *</label>
              <input
                required
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 50000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition-colors">
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : (
                  <>
                    <Check className="w-4 h-4" />
                    Simpan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
