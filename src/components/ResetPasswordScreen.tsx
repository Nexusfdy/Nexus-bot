import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

export default function ResetPasswordScreen({ token, onLogin }: { token: string, onLogin: (token: string) => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/auth/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Password berhasil diubah! Anda bisa login sekarang.');
        // Setelah berhasil, arahkan ke halaman utama/login
        setTimeout(() => {
           window.location.href = '/';
        }, 2000);
      } else {
        setError(data.error || 'Gagal mereset password.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
          <p className="text-slate-400 text-sm mt-2 text-center">Masukkan password baru untuk akun Admin Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm p-3 rounded-lg text-center">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              disabled={!!success || loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow disabled:opacity-50"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !!success}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Simpan Password <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </button>
          
          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={() => window.location.href = '/'}
              className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
            >
              Kembali ke Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
