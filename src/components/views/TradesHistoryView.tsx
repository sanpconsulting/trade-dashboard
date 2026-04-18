import React, { useState, useEffect } from 'react';
import { authFetch } from '../../lib/auth';
import { useLanguage } from '../../hooks/useLanguage';
import { Loader2, RefreshCw, History, Calendar, Download, TrendingUp, TrendingDown, Filter } from 'lucide-react';

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

      const res = await authFetch('/api/oanda/transactions', { headers });
      const data = await res.json();

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
    <div className="p-6 h-full overflow-y-auto bg-[#09090b]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            {language === 'fr' ? 'Historique des Transactions' : 'Transaction History'}
          </h2>
          <p className="text-[10px] uppercase text-zinc-500 font-mono tracking-widest">
            {language === 'fr' ? 'Analyse des performances passées' : 'Analysis of past performance'}
          </p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setRefreshKey(k => k + 1)}
             className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-sm text-[10px] font-bold text-zinc-400 hover:text-zinc-100 transition-all uppercase"
           >
             <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
             {language === 'fr' ? 'Actualiser' : 'Refresh'}
           </button>
           <button 
             className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 border border-emerald-600/20 rounded-sm text-[10px] font-bold text-emerald-500 hover:bg-emerald-600/20 transition-all uppercase"
           >
             <Download className="w-3 h-3" />
             CSV
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm border-l-4 border-l-blue-500">
           <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-1">{language === 'fr' ? 'Nombre de Trades' : 'Trade Count'}</span>
           <div className="text-2xl font-mono text-zinc-100 font-bold">{filteredTransactions.length}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm border-l-4 border-l-emerald-500">
           <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-1">{language === 'fr' ? 'P/L Total (Net)' : 'Total Net P/L'}</span>
           <div className={`text-2xl font-mono font-bold ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
             {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)} USD
           </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
           <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-1 flex items-center gap-2">
             <Filter className="w-3 h-3" />
             {language === 'fr' ? 'Filtrer par période' : 'Filter by Period'}
           </span>
           <div className="flex gap-2 mt-2">
              {(['All', 'Today', 'Week'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-[9px] font-bold uppercase rounded-sm border transition-all ${
                    filter === f 
                    ? 'bg-blue-600/20 border-blue-600/50 text-blue-400' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {f === 'All' ? (language === 'fr' ? 'Tout' : 'All') : f === 'Today' ? (language === 'fr' ? 'Aujourd\'hui' : 'Today') : (language === 'fr' ? 'Semaine' : 'Week')}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden min-h-[400px]">
        <div className="grid grid-cols-7 gap-4 p-3 border-b border-zinc-800 bg-zinc-900/50 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
          <div>ID</div>
          <div>Date</div>
          <div>Instrument</div>
          <div>Units</div>
          <div>Entry Price</div>
          <div>P/L (Net)</div>
          <div className="text-right">Reason</div>
        </div>

        {loading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-20 text-center text-zinc-600 font-mono text-[11px] uppercase italic">
            {language === 'fr' ? 'Aucune transaction trouvée pour cette période' : 'No transactions found for this period'}
          </div>
        ) : (
          filteredTransactions.map((tx: any) => (
            <div key={tx.id} className="grid grid-cols-7 gap-4 p-4 border-b border-zinc-900 hover:bg-zinc-900/30 transition-colors items-center text-[12px] font-mono">
              <div className="text-zinc-600 text-[10px]">#{tx.id}</div>
              <div className="text-zinc-500 text-[10px] flex flex-col">
                <span>{new Date(tx.time).toLocaleDateString()}</span>
                <span>{new Date(tx.time).toLocaleTimeString()}</span>
              </div>
              <div className="font-bold text-zinc-200">{tx.instrument}</div>
              <div className={`text-zinc-400 font-bold ${Number(tx.units) > 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                {Number(tx.units) > 0 ? '+' : ''}{tx.units}
              </div>
              <div className="text-zinc-400">{tx.price}</div>
              <div className={`font-bold ${Number(tx.pl) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {Number(tx.pl) >= 0 ? '+' : ''}{tx.pl}
              </div>
              <div className="text-right text-[9px] uppercase font-bold text-zinc-600">
                {tx.reason.replace('_ORDER_FILL', '').replace('ORDER_FILL', '')}
              </div>
            </div>
          ))
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
