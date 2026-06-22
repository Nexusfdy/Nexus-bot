import React from 'react';
import { Order } from '../../types';

interface TransactionRowProps {
  ord: Order;
  formatIDR: (num: number) => string;
  onMarkSuccess?: (orderId: string) => Promise<void>;
}

export default function TransactionRow({ ord, formatIDR, onMarkSuccess }: TransactionRowProps) {
  let statusBadge = '';
  let badgeText = ord.status;

  if (ord.status === 'Claimed') {
    statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';
    badgeText = 'Claimed (Selesai)';
  } else if (ord.status === 'Success') {
    statusBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/15';
    badgeText = 'Paid (Terbayar)';
  } else {
    statusBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/15';
    badgeText = 'Pending QRIS';
  }

  return (
    <tr className="hover:bg-slate-950/20 transition-all">
      {/* Order ID */}
      <td className="py-4 px-6 font-mono text-slate-300 font-bold">
        {ord.id}
      </td>
      {/* User info */}
      <td className="py-4 px-6 font-semibold text-slate-200">
        @{ord.customerUsername}
      </td>
      {/* Product */}
      <td className="py-4 px-6 text-indigo-400 font-medium font-display">
        {ord.productName}
      </td>
      {/* Price */}
      <td className="py-4 px-6 font-semibold text-slate-300 font-mono">
        {formatIDR(ord.price)}
      </td>
      {/* Status */}
      <td className="py-4 px-6">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
          {badgeText}
        </span>
      </td>
      {/* Created At */}
      <td className="py-4 px-6 text-slate-500 font-mono text-[10px]">
        {new Date(ord.createdAt).toLocaleString('id-ID')}
      </td>
      {/* Key items */}
      <td className="py-4 px-6 font-mono text-slate-400 max-w-[180px] truncate">
        {ord.claimedStockItem ? (
          <span className="bg-slate-950/80 p-1 px-2 rounded-md text-[10px] text-slate-300 font-mono border border-slate-800">
            {ord.claimedStockItem}
          </span>
        ) : (
          <span className="text-slate-600 italic">Belum diklaim</span>
        )}

        {ord.status === 'Pending' && onMarkSuccess && (
          <button
            onClick={() => onMarkSuccess(ord.id)}
            className="ml-3 text-[10px] bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-emerald-500 hover:text-white px-2 py-1 rounded font-bold transition-colors"
          >
            Tandai Bayar
          </button>
        )}
      </td>
    </tr>
  );
}
