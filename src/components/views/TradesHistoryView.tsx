import React, { useState, useEffect } from 'react';
import { authFetch } from '../../lib/auth';
import { useLanguage } from '../../hooks/useLanguage';
import { Loader2, RefreshCw, History, Calendar, Download, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TradesHistoryView() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<'All' | 'Today' | 'Week'>('All');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = localStorage.getItem('trade_api_key');
      const accountId = localStorage.getItem('trade_api_secret');

      if (!apiKey || !accountId) {
        throw new Error(language === 'fr' ? "Identifiants OANDA manquants" : "OANDA Credentials missing");
      }

      const headers = {
        'x-broker-api-key': apiKey,
        'x-broker-account-id': accountId
      };

      let res;
      try {
        res = await authFetch('/api/oanda/transactions', { headers });
      } catch (netErr: any) {
        throw new Error(language === 'fr' ? `Erreur de connexion historique: ${netErr.message}` : `History connection error: ${netErr.message}`);
      }

      const data = await res.json().catch(() => ({ error: "Format JSON invalide (Transactions)" }));

      if (data.error) throw new Error(data.error);
      
      // Filter for relevant transactions (Order Fill specifically for P/L)
      const tradeTransactions = (data.transactions || [])
        .filter((tx: any) => tx.type === 'ORDER_FILL' && tx.reason === 'MARKET_ORDER_FILL' || tx.reason === 'LIMIT_ORDER_FILL' || tx.reason === 'STOP_LOSS_ORDER_FILL' || tx.reason === 'TAKE_PROFIT_ORDER_FILL')
        .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
        
      setTransactions(tradeTransactions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.time);
    const now = new Date();
    if (filter === 'Today') return txDate.toDateString() === now.toDateString();
    if (filter === 'Week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return txDate >= weekAgo;
    }
    return true;
  });

  const totalPL = filteredTransactions.reduce((sum, tx) => sum + Number(tx.pl || 0), 0);
  const totalCommission = filteredTransactions.reduce((sum, tx) => sum + Number(tx.commission || 0), 0);
  const netProfit = totalPL + totalCommission;

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#050505] relative custom-scrollbar">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-mono font-black text-white tracking-tighter mb-2 flex items-center gap-3">
             <div className="w-1.5 h-8 bg-zinc-700 rounded-full" />
            {language === 'fr' ? 'HISTORIQUE_LEDGER' : 'LEDGER_HISTORY'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black text-zinc-500 font-mono tracking-[0.3em]">
              {language === 'fr' ? 'COMMAND_TRANS_LOG' : 'PROTOCOL_TRANS_LOG'}
            </span>
            <div className="h-px w-8 bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <History className="w-3 h-3 text-zinc-600" />
              <span className="text-[9px] text-zinc-600 font-mono font-bold tracking-widest uppercase">READ_ONLY_ACCESS</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => setRefreshKey(k => k + 1)}
             className="group flex items-center gap-2 px-5 py-2.5 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl text-[10px] font-black text-zinc-400 hover:text-white transition-all uppercase tracking-widest font-mono neo-shadow"
           >
             <RefreshCw className={cn("w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500", loading && "animate-spin text-blue-400")} />
             {language === 'fr' ? 'SYNC' : 'SYNC'}
           </button>
           <button 
             className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 rounded-xl text-[10px] font-black text-emerald-500 transition-all uppercase tracking-widest font-mono neo-shadow shadow-[0_0_15px_rgba(16,185,129,0.05)]"
           >
             <Download className="w-3.5 h-3.5" />
             EXPORT_DFS
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="tech-card p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-1 opacity-20"><div className="w-1 h-3 bg-zinc-300 rounded" /></div>
           <span className="tech-label opacity-40 mb-3 block">{language === 'fr' ? 'CYCLE_COUNT' : 'CYCLE_COUNT'}</span>
           <div className="text-3xl font-mono text-white font-black tracking-tighter">{filteredTransactions.length}</div>
        </div>
        <div className="tech-card p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-1 opacity-20"><div className="w-3 h-1 bg-emerald-500 rounded" /></div>
           <span className="tech-label opacity-40 mb-3 block">{language === 'fr' ? 'NET_CUMULATIVE_PL' : 'NET_CUMULATIVE_PL'}</span>
           <div className={cn("text-3xl font-mono font-black tracking-tighter", netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
             <span className="text-sm font-normal opacity-50 mr-2">$</span>
             {netProfit.toFixed(2)}
           </div>
        </div>
        <div className="tech-card p-6 relative overflow-hidden group">
           <span className="tech-label opacity-40 mb-3 block flex items-center gap-2">
             <Filter className="w-3 h-3" />
             {language === 'fr' ? 'TEMPORAL_FILTER' : 'TEMPORAL_FILTER'}
           </span>
           <div className="flex gap-2">
              {(['All', 'Today', 'Week'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all font-mono tracking-widest",
                    filter === f 
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400 neo-shadow" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-300"
                  )}
                >
                  {f.toUpperCase()}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="tech-card min-h-[400px] overflow-hidden">
        <div className="grid grid-cols-7 gap-6 p-5 border-b border-white/[0.05] bg-white/[0.02] tech-label opacity-50 text-[9px] tracking-[0.2em] font-mono">
          <div>BLOCK_ID</div>
          <div>TIMESTAMP</div>
          <div>ASSET_PAIR</div>
          <div>VOL_UNITS</div>
          <div>ENTRY_PT</div>
          <div>OUTCOME_PL</div>
          <div className="text-right">EVENT_REASON</div>
        </div>

        {loading ? (
          <div className="p-32 flex flex-col items-center justify-center space-y-4 opacity-50 font-mono">
            <Loader2 className="w-10 h-10 text-zinc-700 animate-spin" />
            <span className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-800">Reading_Master_Tape</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-32 text-center text-zinc-800 font-mono text-[10px] font-black uppercase tracking-[0.4em] italic bg-zinc-900/5">
            NO_RECORDS_IDENTIFIED_IN_RANGE
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filteredTransactions.map((tx: any) => (
              <div key={tx.id} className="grid grid-cols-7 gap-6 p-6 hover:bg-white/[0.01] transition-all items-center text-[13px] font-mono group">
                <div className="text-zinc-700 text-[10px] font-black">#{tx.id}</div>
                <div className="text-zinc-500 text-[10px] font-bold flex flex-col gap-0.5">
                  <span className="text-zinc-400">{new Date(tx.time).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
                  <span className="opacity-50 tracking-tighter">{new Date(tx.time).toLocaleTimeString([], { hour12: false })}</span>
                </div>
                <div className="font-black text-white tracking-tighter uppercase">{tx.instrument.replace('_', '/')}</div>
                <div className={cn("font-black tracking-tighter", Number(tx.units) > 0 ? 'text-emerald-500/50' : 'text-rose-500/50')}>
                  {Number(tx.units) > 0 ? '+' : ''}{tx.units.toLocaleString()}
                </div>
                <div className="text-zinc-600 font-bold">{tx.price}</div>
                <div className={cn("font-black text-base flex flex-col", Number(tx.pl) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  <div><span className="text-sm opacity-50 mr-1">{Number(tx.pl) >= 0 ? '+' : ''}</span>{Number(tx.pl).toFixed(2)}</div>
                </div>
                <div className="text-right text-[9px] font-black tracking-widest text-zinc-600 uppercase">
                  <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md">
                    {tx.reason.replace('_ORDER_FILL', '').replace('ORDER_FILL', '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 border border-zinc-800/50 bg-zinc-900/10 rounded-sm">
         <p className="text-[10px] text-zinc-500 italic leading-relaxed max-w-[600px]">
           {language === 'fr' 
             ? "* Note: Les données affichées proviennent directement du registre des transactions OANDA. Les profits nets incluent les commissions et le swap."
             : "* Note: Data displayed is pulled directly from OANDA's transaction ledger. Net profits include commissions and swaps."}
         </p>
      </div>
    </div>
  );
}
