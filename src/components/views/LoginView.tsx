import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../hooks/useLanguage';

interface LoginViewProps {
  onLogin: (token: string) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const { language } = useLanguage();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }).catch(err => {
        throw new Error(language === 'fr' ? `ERR_SRV_TIMEOUT: ${err.message}` : `ERR_SRV_TIMEOUT: ${err.message}`);
      });

      const data = await response.json().catch(() => ({ error: "FETCH_FORMAT_ERROR" }));

      if (!response.ok) {
        throw new Error(data.error || 'AUTH_REJECTED');
      }

      onLogin(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono overflow-hidden relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* Animated Scan Line */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.05] to-transparent h-20 w-full animate-[scan_4s_linear_infinite] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm z-10"
      >
        <div className="tech-card p-10 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 mb-6 relative group">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/40 transition-colors" />
              <div className="relative w-full h-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl flex items-center justify-center neo-shadow">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#050505] animate-pulse" />
            </div>

            <h1 className="text-3xl font-black text-white tracking-[-0.1em] mb-2">QUANT_ENGINE</h1>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-600 font-black tracking-[0.4em] uppercase">Security_Protocol_V2</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="tech-label opacity-40 ml-1">TERMINAL_PASSWORD</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950/80 border-2 border-zinc-800 focus:border-blue-500/50 rounded-2xl py-4 pl-12 pr-6 text-white font-black tracking-widest placeholder:text-zinc-800 focus:outline-none transition-all neo-shadow"
                  placeholder="••••••••••••"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, target: -10 }}
                animate={{ opacity: 1, target: 0 }}
                className="bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl p-4 flex items-start gap-4 text-rose-500"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] font-black uppercase tracking-tight">
                  <div className="mb-1">ACCESS_DENIED_SYSTEM_FAULT</div>
                  <div className="opacity-70">{error}</div>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl p-px transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all group-hover:from-blue-500 group-hover:to-indigo-500" />
              <div className="relative bg-[#050505]/20 backdrop-blur-md py-4 flex items-center justify-center gap-3">
                <span className="text-[12px] font-black text-white uppercase tracking-[0.3em]">
                  {loading ? 'Decrypting...' : 'Initialize_Link'}
                </span>
                {loading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-white opacity-50" />
                )}
              </div>
            </button>
          </form>

          <div className="mt-12 flex flex-col items-center gap-6 opacity-30 group-hover:opacity-60 transition-opacity">
            <div className="h-px w-20 bg-zinc-800" />
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">RSA_ENCRYPT</span>
                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">AES_256_ACTIVE</span>
              </div>
              <div className="w-px h-6 bg-zinc-800" />
              <div className="flex flex-col items-start">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">IP_TRACKING</span>
                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">LOG_PERSISTED</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hardware details outside card */}
        <div className="mt-6 flex justify-between px-6 opacity-20 font-black text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-mono">
          <span>{language === 'fr' ? 'TERMINAL_SEC_01' : 'TERMINAL_SEC_01'}</span>
          <span>_LN_ACCESS_V2.0</span>
        </div>
      </motion.div>
    </div>
  );
}
