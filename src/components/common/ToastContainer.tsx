import React from 'react';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 ${t.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-200' : t.type === 'error' ? 'bg-rose-950/95 border-rose-500/30 text-rose-200' : 'bg-indigo-950/95 border-indigo-500/30 text-indigo-200'}`}>
          <div className="shrink-0 mt-0.5">
            {t.type === 'success' && <span className="text-emerald-400 font-bold">✓</span>}
            {t.type === 'error' && <span className="text-rose-400 font-bold">⚠</span>}
            {t.type === 'info' && <span className="text-indigo-400 font-bold">ℹ</span>}
          </div>
          <div className="flex-1 text-xs font-semibold leading-normal">{t.message}</div>
          <button onClick={() => onDismiss(t.id)} className="text-slate-400 hover:text-white shrink-0 text-xs">×</button>
        </div>
      ))}
    </div>
  );
}
