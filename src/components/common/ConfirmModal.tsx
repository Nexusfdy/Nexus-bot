import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen, title, message, confirmText, cancelText, variant, onConfirm, onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${variant === 'danger' ? 'bg-rose-500/10 text-rose-400' : variant === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
              <span className="text-base font-bold">⚠️</span>
            </div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">{title}</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 bg-slate-950/60 border-t border-slate-850">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all">
            {cancelText || 'Batal'}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 font-semibold text-xs rounded-xl transition-all text-white ${variant === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/20' : variant === 'warning' ? 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-950/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-950/20'}`}>
            {confirmText || 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  );
}
