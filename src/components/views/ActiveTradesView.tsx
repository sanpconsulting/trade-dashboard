import React, { useState, useEffect } from 'react';
import { authFetch } from '../../lib/auth';
import { useLanguage } from '../../hooks/useLanguage';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ActiveTradesView() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

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

      const [accRes, tradesRes, ordersRes] = await Promise.all([
        authFetch('/api/oanda/account', { headers }),
        authFetch('/api/oanda/trades', { headers }),
        authFetch('/api/oanda/orders', { headers })
      ]);

      const accData = await accRes.json();
      const tradesData = await tradesRes.json();
      const ordersData = await ordersRes.json();

      if (accData.error) throw new Error(accData.error);
      
      setAccount(accData.account);
      setTrades(tradesData.trades || []);
      setOrders(ordersData.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto refresh
    return () => clearInterval(interval);
  }, [refreshKey]);

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-zinc-500">
        <AlertCircle className="w-12 h-12 mb-4 text-rose-500/50" />
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">{error}</p>
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-sm text-[10px] uppercase font-bold"
        >
          {language === 'fr' ? 'Réessayer' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-[#09090b]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            {language === 'fr' ? 'Ordres & Positions' : 'Active Trades'}
          </h2>
          <p className="text-[10px] uppercase text-zinc-500 font-mono tracking-widest">
            {language === 'fr' ? 'Gestion des actifs en temps réel' : 'Real-time asset management'}
          </p>
        </div>
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-sm text-[10px] font-bold text-zinc-400 hover:text-zinc-100 transition-all uppercase"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? (language === 'fr' ? 'Sync...' : 'Syncing...') : (language === 'fr' ? 'Actualiser' : 'Refresh')}
        </button>
      </div>

      {loading && !account ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Account Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
              <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-1">Balance</span>
              <div className="text-xl font-mono text-zinc-100 font-bold">${Number(account?.balance || 0).toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
              <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-1">NAV</span>
              <div className="text-xl font-mono text-zinc-100 font-bold">${Number(account?.NAV || 0).toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
              <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-1">Unrealized P/L</span>
              <div className={`text-xl font-mono font-bold ${Number(account?.unrealizedPL) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {Number(account?.unrealizedPL) >= 0 ? '+' : ''}{Number(account?.unrealizedPL || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
              <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-1">Margin Used</span>
              <div className="text-xl font-mono text-zinc-100 font-bold">${Number(account?.marginUsed || 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Positions Table */}
          <section>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              {language === 'fr' ? 'Positions Ouvertes' : 'Open Positions'} ({trades.length})
            </h3>
            <div className="bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden">
               <div className="grid grid-cols-7 gap-4 p-3 border-b border-zinc-800 bg-zinc-900/50 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                 <div>Instrument</div>
                 <div>Units</div>
                 <div>Price</div>
                 <div>SL/TP</div>
                 <div>P/L (Raw)</div>
                 <div>Age</div>
                 <div className="text-right">Action</div>
               </div>
               
               {trades.length === 0 ? (
                 <div className="p-8 text-center text-[11px] text-zinc-600 font-mono uppercase italic">
                   {language === 'fr' ? 'Aucun trade actif' : 'No active trades'}
                 </div>
               ) : (
                 trades.map((trade: any) => (
                   <div key={trade.id} className="grid grid-cols-7 gap-4 p-4 border-b border-zinc-900 hover:bg-zinc-900/30 transition-colors items-center text-[12px] font-mono">
                     <div className="flex flex-col">
                        <span className="font-bold text-zinc-200">{trade.instrument}</span>
                        <span className={`text-[9px] font-bold ${Number(trade.currentUnits) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {Number(trade.currentUnits) > 0 ? (language === 'fr' ? 'ACHAT' : 'BUY') : (language === 'fr' ? 'VENTE' : 'SELL')}
                        </span>
                     </div>
                     <div className="text-zinc-400">{Math.abs(Number(trade.currentUnits))}</div>
                     <div className="text-zinc-400">{trade.price}</div>
                     <div className="text-[10px] text-zinc-500 flex flex-col">
                        <span>SL: {trade.stopLossOrder?.price || '---'}</span>
                        <span>TP: {trade.takeProfitOrder?.price || '---'}</span>
                     </div>
                     <div className={`font-bold ${Number(trade.unrealizedPL) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                       {Number(trade.unrealizedPL) >= 0 ? '+' : ''}{Number(trade.unrealizedPL).toFixed(2)}
                     </div>
                     <div className="text-zinc-500 text-[10px]">
                       {new Date(trade.openTime).toLocaleTimeString()}
                     </div>
                     <div className="text-right">
                       <button className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-2 py-1 rounded-sm border border-rose-500/20 transition-all font-bold uppercase">
                         {language === 'fr' ? 'Fermer' : 'Close'}
                       </button>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </section>

          {/* Pending Orders */}
          <section>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-3 h-3 text-blue-500" />
              {language === 'fr' ? 'Ordres en Attente' : 'Pending Orders'} ({orders.length})
            </h3>
            <div className="bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden">
               <div className="grid grid-cols-6 gap-4 p-3 border-b border-zinc-800 bg-zinc-900/50 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                 <div>Type</div>
                 <div>Instrument</div>
                 <div>Price</div>
                 <div>Units</div>
                 <div>Expiry</div>
                 <div className="text-right">Action</div>
               </div>

               {orders.length === 0 ? (
                 <div className="p-8 text-center text-[11px] text-zinc-600 font-mono uppercase italic">
                   {language === 'fr' ? 'Aucun ordre en attente' : 'No pending orders'}
                 </div>
               ) : (
                 orders.map((order: any) => (
                   <div key={order.id} className="grid grid-cols-6 gap-4 p-4 border-b border-zinc-900 hover:bg-zinc-900/30 transition-colors items-center text-[12px] font-mono">
                     <div className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-sm border border-blue-500/20 text-center uppercase">
                       {order.type}
                     </div>
                     <div className="font-bold text-zinc-200">{order.instrument}</div>
                     <div className="text-zinc-400">{order.price}</div>
                     <div className="text-zinc-400">{order.units}</div>
                     <div className="text-zinc-500 text-[10px]">{order.gtdTime ? new Date(order.gtdTime).toLocaleDateString() : 'GTC'}</div>
                     <div className="text-right">
                       <button className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-2 py-1 rounded-sm border border-zinc-700 transition-all font-bold uppercase">
                         {language === 'fr' ? 'Annuler' : 'Cancel'}
                       </button>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
