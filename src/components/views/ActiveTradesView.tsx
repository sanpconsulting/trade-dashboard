import React, { useState, useEffect } from 'react';
import { authFetch } from '../../lib/auth';
import { useLanguage } from '../../hooks/useLanguage';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

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

      // Sequential fetch or individual try/catch is safer than Promise.all for debugging/reliability
      let accRes, tradesRes, ordersRes;
      
      try {
        [accRes, tradesRes, ordersRes] = await Promise.all([
          authFetch('/api/oanda/account', { headers }),
          authFetch('/api/oanda/trades', { headers }),
          authFetch('/api/oanda/orders', { headers })
        ]);
      } catch (netErr: any) {
        throw new Error(language === 'fr' ? `Erreur de connexion au terminal: ${netErr.message}` : `Terminal connection error: ${netErr.message}`);
      }

      const accData = await accRes.json().catch(() => ({ error: "Format JSON invalide (Account)" }));
      const tradesData = await tradesRes.json().catch(() => ({ trades: [], error: "Format JSON invalide (Trades)" }));
      const ordersData = await ordersRes.json().catch(() => ({ orders: [], error: "Format JSON invalide (Orders)" }));

      if (accData.error) throw new Error(accData.error);
      if (tradesData.error) console.warn(tradesData.error);
      if (ordersData.error) console.warn(ordersData.error);
      
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
    <div className="p-8 h-full overflow-y-auto bg-[#050505] relative custom-scrollbar">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-mono font-black text-white tracking-tighter mb-2 flex items-center gap-3">
             <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
            {language === 'fr' ? 'ORDRES_COMMAND' : 'ORDER_COMMAND'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black text-blue-500/60 font-mono tracking-[0.3em]">
              {language === 'fr' ? 'TERMINAL_SYNC_V2' : 'TERMINAL_SYNC_V2'}
            </span>
            <div className="h-px w-8 bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-500/70 font-mono font-bold tracking-widest uppercase">CONNECTION_SECURE</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          className="group relative flex items-center gap-3 px-6 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/30 rounded-xl text-[11px] font-black text-zinc-400 hover:text-white transition-all uppercase tracking-[0.2em] font-mono neo-shadow overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
          <RefreshCw className={cn("w-4 h-4 transition-transform group-hover:rotate-180 duration-500", loading && "animate-spin text-blue-400")} />
          {loading ? (language === 'fr' ? 'SYNCING_SRV' : 'SYNCING_SRV') : (language === 'fr' ? 'REFRESH_NET' : 'REFRESH_NET')}
        </button>
      </div>

      {loading && !account ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin opacity-50" />
          <span className="text-[10px] font-mono font-black text-zinc-700 tracking-[0.4em] uppercase animate-pulse">Requesting_Buffer_Link</span>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Account Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'BALANCE_USD', value: account?.balance, color: 'text-white' },
              { label: 'EQUITY_NET_VAL', value: account?.NAV, color: 'text-white' },
              { label: 'UNREAL_P_L_ACC_TOTAL', value: account?.unrealizedPL, suffix: true },
              { label: 'MARGIN_COLLATERAL', value: account?.marginUsed, color: 'text-white' }
            ].map((stat, i) => {
              const val = Number(stat.value || 0);
              const isProfit = stat.suffix ? val >= 0 : null;
              
              return (
                <div key={i} className="tech-card p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-1 bg-white rounded-full mb-0.5" />
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>
                  <span className="tech-label opacity-40 mb-3 block">{stat.label}</span>
                  <div className={cn("text-2xl font-mono font-black tracking-tight", 
                    stat.suffix ? (isProfit ? 'text-emerald-400' : 'text-rose-400') : stat.color
                  )}>
                    <span className="text-sm font-normal text-zinc-600 mr-2 uppercase font-mono">$</span>
                    {val.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: Math.max(2, stat.suffix ? 2 : 0) 
                    })}
                    {stat.suffix && <span className="text-xs ml-1 opacity-50 font-bold">{isProfit ? '▲' : '▼'}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Positions Table */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h3 className="tech-label tracking-[0.4em] flex items-center gap-3">
                <div className="w-4 h-px bg-emerald-500" />
                {language === 'fr' ? 'ACTIVE_POSITIONS_LOG' : 'ACTIVE_POSITIONS_LOG'}
                <span className="text-emerald-500 font-black ml-2">[{trades.length}]</span>
              </h3>
            </div>
            
            <div className="tech-card overflow-hidden">
               <div className="grid grid-cols-7 gap-6 p-5 border-b border-white/[0.05] bg-white/[0.02] tech-label opacity-50 text-[9px] tracking-[0.2em] font-mono">
                 <div>ASSET_PAIR</div>
                 <div>NET_UNITS</div>
                 <div>AVG_ENTRY</div>
                 <div>GUARD_LVLS</div>
                 <div>REAL_TIME_P_L</div>
                 <div>OPEN_TIMESTAMP</div>
                 <div className="text-right">COMMAND</div>
               </div>
               
               {trades.length === 0 ? (
                 <div className="p-16 text-center text-[10px] text-zinc-600 font-mono font-black uppercase tracking-[0.4em] bg-zinc-900/5">
                   <div className="mb-4 opacity-20">NO_ACTIVE_FLOW_DETECTED</div>
                   <div className="animate-pulse">_WAITING_FOR_EXECUTION</div>
                 </div>
               ) : (
                 <div className="divide-y divide-white/[0.03]">
                   {trades.map((trade: any) => {
                     const isBuy = Number(trade.currentUnits) > 0;
                     const pl = Number(trade.unrealizedPL);
                     return (
                       <div key={trade.id} className="grid grid-cols-7 gap-6 p-6 hover:bg-white/[0.01] transition-all items-center text-[13px] font-mono group">
                         <div className="flex items-center gap-4">
                            <div className={cn("w-1 h-8 rounded-full", isBuy ? "bg-emerald-500" : "bg-rose-500")} />
                            <div className="flex flex-col">
                               <span className="font-black text-white tracking-tighter">{trade.instrument.replace('_', '/')}</span>
                               <span className={cn("text-[9px] font-black tracking-widest", isBuy ? 'text-emerald-500/60' : 'text-rose-500/60')}>
                                  {isBuy ? 'LONG_POS' : 'SHORT_POS'}
                               </span>
                            </div>
                         </div>
                         <div className="text-zinc-400 font-black tracking-tight">{Math.abs(Number(trade.currentUnits)).toLocaleString()}</div>
                         <div className="text-zinc-500 font-bold">{trade.price}</div>
                         <div className="text-[10px] font-bold text-zinc-600 flex flex-col gap-1">
                            <span className="flex items-center gap-2"><div className="w-1.5 h-[1px] bg-rose-500/30" /> SL: <span className="text-rose-500/60">{trade.stopLossOrder?.price || '--'}</span></span>
                            <span className="flex items-center gap-2"><div className="w-1.5 h-[1px] bg-emerald-500/30" /> TP: <span className="text-emerald-500/60">{trade.takeProfitOrder?.price || '--'}</span></span>
                         </div>
                         <div className={cn("font-black text-base flex flex-col", pl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                           <div><span className="text-sm mr-1 opacity-50">{pl >= 0 ? '+' : ''}</span>{pl.toFixed(2)}</div>
                           <div className="text-[9px] opacity-40 font-bold uppercase tracking-widest">REAL_TIME_PL</div>
                         </div>
                         <div className="text-zinc-600 text-[10px] font-bold">
                           {new Date(trade.openTime).toLocaleTimeString([], { hour12: false })}
                           <div className="opacity-40">{new Date(trade.openTime).toLocaleDateString([], { month: 'short', day: '2-digit' })}</div>
                         </div>
                         <div className="text-right">
                           <button className="relative px-5 py-2.5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 transition-all font-black text-[9px] uppercase tracking-[0.2em] overflow-hidden group/btn">
                             <div className="absolute inset-0 bg-rose-500/10 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300" />
                             <span className="relative z-10">{language === 'fr' ? 'LIQUIDER' : 'LIQUIDATE'}</span>
                           </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          </section>

          {/* Pending Orders */}
          <section>
            <h3 className="tech-label tracking-[0.4em] flex items-center gap-3 mb-6">
              <div className="w-4 h-px bg-blue-500" />
              {language === 'fr' ? 'ORDER_STACK_PENDING' : 'ORDER_STACK_PENDING'}
              <span className="text-blue-500 font-black ml-2">[{orders.length}]</span>
            </h3>
            
            <div className="tech-card overflow-hidden">
               <div className="grid grid-cols-6 gap-6 p-5 border-b border-white/[0.05] bg-white/[0.02] tech-label opacity-50 text-[9px] tracking-[0.2em] font-mono">
                 <div>FLOW_TYPE</div>
                 <div>INSTRUMENT</div>
                 <div>TRIGGER_PRICE</div>
                 <div>VOLUME_UNITS</div>
                 <div>EXPIRE_STATE</div>
                 <div className="text-right">MGMT</div>
               </div>

               {orders.length === 0 ? (
                 <div className="p-12 text-center text-[10px] text-zinc-700 font-mono font-black uppercase tracking-[0.4em]">
                   EMPTY_STACK_MONITORING
                 </div>
               ) : (
                 <div className="divide-y divide-white/[0.03]">
                   {orders.map((order: any) => (
                     <div key={order.id} className="grid grid-cols-6 gap-6 p-6 hover:bg-white/[0.01] transition-all items-center text-[13px] font-mono">
                       <div>
                          <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 text-center uppercase tracking-widest">
                            {order.type.replace('_ORDER', '')}
                          </span>
                       </div>
                       <div className="font-black text-white tracking-tighter">{order.instrument.replace('_', '/')}</div>
                       <div className="text-zinc-400 font-black">{order.price}</div>
                       <div className="text-zinc-500 font-bold">{Math.abs(Number(order.units)).toLocaleString()}</div>
                       <div className="text-zinc-600 text-[10px] font-bold">
                         {order.gtdTime ? new Date(order.gtdTime).toLocaleDateString() : 'GTC_SESSION'}
                       </div>
                       <div className="text-right">
                         <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-white rounded-lg transition-all font-black text-[9px] uppercase tracking-widest">
                           {language === 'fr' ? 'ABORT' : 'ABORT'}
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
