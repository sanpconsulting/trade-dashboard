import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ScoreGauge } from './components/ScoreGauge';
import { TradePlanCard } from './components/TradePlanCard';
import { AiSynthesisCard } from './components/AiSynthesisCard';
import { AiIntelligenceUnit } from './components/AiIntelligenceUnit';
import { ChartMock } from './components/ChartMock';
import { NewsFeedCard } from './components/NewsFeedCard';
import { GeoSentimentCard } from './components/GeoSentimentCard';
import { fetchRealMarketData } from './services/marketApi';
import { MarketData, Timeframe } from './types';
import { cn } from './lib/utils';
import { Loader2, ScrollText, Timer, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from './hooks/useLanguage';
import { oandaToYahoo } from './lib/symbolMapper';
import { authFetch } from './lib/auth';
import { LoginView } from './components/views/LoginView';

// Import Views
import { SettingsView } from './components/views/SettingsView';
import { ActiveTradesView } from './components/views/ActiveTradesView';
import { TradesHistoryView } from './components/views/TradesHistoryView';

export default function App() {
  const { t, language } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('app_auth_token'));
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [asset, setAsset] = useState('EUR_USD');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [capital, setCapital] = useState<number>(10000);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSynced, setIsSynced] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      const apiKey = localStorage.getItem('trade_api_key');
      const accountId = localStorage.getItem('trade_api_secret');
      if (!apiKey || !accountId) {
        setIsSynced(false);
        return;
      }

      try {
        const res = await authFetch('/api/oanda/account', {
          headers: {
            'x-broker-api-key': apiKey,
            'x-broker-account-id': accountId
          }
        }).catch(err => {
          console.error("Balance Fetch Network Error:", err);
          return null;
        });

        if (!res) {
          setIsSynced(false);
          return;
        }

        const data = await res.json().catch(() => ({ error: "Format JSON invalide" }));
        if (data.account && data.account.balance) {
          setCapital(parseFloat(data.account.balance));
          setIsSynced(true);
        } else {
          setIsSynced(false);
        }
      } catch (e) {
        console.error("Balance sync failed", e);
        setIsSynced(false);
      }
    };

    fetchBalance();
    const inv = setInterval(fetchBalance, 15000); // Sync every 15s
    return () => clearInterval(inv);
  }, [refreshKey]);

  const handleManualRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const [lastRefKey, setLastRefKey] = useState(refreshKey);
  const [lastAsset, setLastAsset] = useState(asset);
  const [lastTimeframe, setLastTimeframe] = useState(timeframe);
  const [tradeLogs, setTradeLogs] = useState<{msg: string, time: string, details?: any}[]>([]);

  useEffect(() => {
    const handleAuthExpired = () => setIsAuthenticated(false);
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('app_auth_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('app_auth_token');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (!marketData) return;
    
    const isAutoActive = localStorage.getItem('trade_auto_active') === 'true';
    const threshold = parseInt(localStorage.getItem('trade_auto_threshold') || '80');
    
    // Risk Management Retrieval
    const dailyLimit = parseFloat(localStorage.getItem('trade_loss_limit') || '5.0');
    const stakePerOrder = parseFloat(localStorage.getItem('trade_stake_amount') || '100');
    
    if (isAutoActive && marketData.confidenceScore >= threshold && marketData.recommendedAction !== 'WAIT') {
      const lastExecution = localStorage.getItem(`last_trade_${marketData.asset}`);
      const now = Date.now();
      
      // Cooling off 5 mins
      if (!lastExecution || (now - parseInt(lastExecution) > 300000)) {
        
        // 1. Calculate Expiration based on Period
        let expirationType = 'GTC';
        let expOffset = 3600 * 1000; // 1h default
        
        if (timeframe === '5m' || timeframe === '15m') {
          expOffset = 3600 * 1000;
          expirationType = 'DAY';
        } else if (timeframe === '1h' || timeframe === '4h') {
          expOffset = 86400 * 1000;
          expirationType = 'DAY';
        } else {
          expirationType = 'GTC';
          expOffset = 86400 * 1000 * 7; // 1 week for daily/weekly
        }
        
        const expDate = new Date(now + expOffset);
        const expStr = expDate.toLocaleString();

        // 2. Volume & Risk Calculation
        const volume = parseFloat((stakePerOrder / marketData.currentPrice).toFixed(8));
        
        // 3. Broker Order Information (Matches Image Template)
        const brokerOrder = {
          symbol: marketData.asset,
          type: 'Ordre en attente',
          subType: marketData.recommendedAction === 'BUY' ? 'Buy Limit' : 'Sell Limit',
          volume: volume,
          price: marketData.currentPrice,
          stopLoss: marketData.tradePlan.stopLoss,
          takeProfit: marketData.tradePlan.takeProfit,
          stopLimitPrice: 0.0,
          expiration: expirationType,
          expirationDate: expStr,
          timestamp: now
        };

        // Check Daily Risk Limits (Simulation of cumulative risk check)
        const dailyRiskTaken = parseFloat(localStorage.getItem('trade_daily_risk_consumed') || '0');
        const orderRiskVal = (stakePerOrder / capital) * 100;

        if (dailyRiskTaken + orderRiskVal > dailyLimit) {
          const warn = `ORDER BLOCKED: Daily Risk Limit Exceeded (${(dailyRiskTaken + orderRiskVal).toFixed(2)}% > ${dailyLimit}%)`;
          setTradeLogs(prev => [{msg: warn, time: new Date().toLocaleTimeString()}, ...prev].slice(0, 10));
          return;
        }

        // 4. Send Order to Server-Side Broker Proxy
        authFetch('/api/broker/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: brokerOrder.symbol,
            side: marketData.recommendedAction,
            volume: brokerOrder.volume,
            price: brokerOrder.price,
            stopLoss: brokerOrder.stopLoss,
            takeProfit: brokerOrder.takeProfit,
            expirationDate: brokerOrder.expirationDate,
            environment: localStorage.getItem('trade_broker_env') || 'practice',
            apiKey: localStorage.getItem('trade_api_key'),
            accountId: localStorage.getItem('trade_api_secret') // Note: In UI we saved account ID in 'trade_api_secret' state variable
          })
        })
        .then(res => res.json())
        .then(result => {
           const logMsg = result.status === 'success' 
            ? `[BROKER] ${result.message} ID: ${result.id}`
            : `[BROKER ERROR] ${result.error || 'Unknown error'}`;
           
           setTradeLogs(prev => [{
             msg: logMsg,
             time: new Date().toLocaleTimeString(),
             details: { ...brokerOrder, brokerResponse: result }
           }, ...prev].slice(0, 10));
        })
        .catch(err => {
           setTradeLogs(prev => [{
             msg: `[CONNECTION ERROR] ${err.message}`,
             time: new Date().toLocaleTimeString()
           }, ...prev].slice(0, 10));
        });

        // Update Risk Tracking
        localStorage.setItem('trade_daily_risk_consumed', (dailyRiskTaken + orderRiskVal).toString());
        localStorage.setItem(`last_trade_${marketData.asset}`, now.toString());
      }
    }
  }, [marketData, capital]);

  useEffect(() => {
    // Only fetch market data recursively on Dashboard tab to save resources
    if (activeTab !== 'Dashboard') return;

    let isMounted = true;
    let timerId: NodeJS.Timeout;
    
    // Show loader only if asset or timeframe changed, not for periodic refresh
    if (asset !== lastAsset || timeframe !== lastTimeframe) {
      setMarketData(null);
      setLastAsset(asset);
      setLastTimeframe(timeframe);
    }
    
    async function getMarket() {
      if (activeTab !== 'Dashboard' || !isMounted) return;
      try {
        const yahooSymbol = oandaToYahoo(asset);
        const data = await fetchRealMarketData(yahooSymbol, timeframe);
        if (isMounted) {
          setMarketData({ ...data, asset: asset });
          setConnectionError(null);
        }
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          // Identify network vs application errors
          const isNetworkError = err.message.includes('fetch') || err.message.includes('connexion');
          setConnectionError(isNetworkError ? (language === 'fr' ? 'Erreur Réseau - Vérifiez la console' : 'Network Error - Check console') : err.message);
        }
      } finally {
        if (isMounted) {
          // Schedule next fetch only after current one completes
          timerId = setTimeout(getMarket, 10000);
        }
      }
    }
    
    getMarket();
    
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [asset, timeframe, activeTab, refreshKey]);

  const renderContent = () => {
    if (activeTab === 'Settings') return <SettingsView />;
    if (activeTab === 'ActiveTrades') return <ActiveTradesView />;
    if (activeTab === 'History') return <TradesHistoryView />;

    if (!marketData) {
      return (
        <div className="flex h-full bg-[#09090b] text-[#fafafa] items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            {connectionError ? (
              <>
                <AlertTriangle className="h-8 w-8 text-rose-500 animate-pulse" />
                <div className="flex flex-col items-center space-y-1">
                  <p className="text-zinc-100 font-mono tracking-widest uppercase text-xs font-bold">{language === 'fr' ? 'ERREUR_CONNEXION' : 'CONNECTION_ERROR'}</p>
                  <p className="text-zinc-500 font-mono text-[10px]">{connectionError}</p>
                </div>
                <button 
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  className="mt-2 px-4 py-1.5 bg-[#121214] border border-zinc-800 rounded text-[10px] font-mono tracking-widest uppercase text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {language === 'fr' ? 'RÉESSAYER' : 'RETRY_CONNECT'}
                </button>
              </>
            ) : (
              <>
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                <p className="text-zinc-500 font-mono tracking-widest uppercase text-[10px]">{t('syncing')} // {asset}...</p>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 bg-[#09090b]">
        <div className="max-w-[1600px] mx-auto space-y-4">
          
          {/* Top row: Chart and AI Synthesis */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-auto xl:h-[400px]">
            <div className="col-span-1 xl:col-span-2">
              <ChartMock data={marketData} />
            </div>
            <div className="col-span-1 xl:col-span-1 max-h-[400px] xl:max-h-none">
              <AiSynthesisCard 
                data={marketData} 
              />
            </div>
          </div>

          {/* Middle row: Dashboard Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <GeoSentimentCard data={marketData} />
            </div>
            
            <ScoreGauge score={marketData.technicalScore} label={t('technical')} />
            <ScoreGauge score={marketData.fundamentalScore} label={t('fundamental')} type="fundamental" />
            <ScoreGauge score={marketData.sentimentScore} label={t('sentiment')} type="sentiment" />
          </div>

          {/* Bottom row: The Plan and Alerts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-6">
            <div className="col-span-1 xl:col-span-2">
              <TradePlanCard data={marketData} capital={capital} />
            </div>
            
            <div className="col-span-1 space-y-6">
               {/* Auto Trade Log */}
               <div className="tech-card flex flex-col h-[280px] shadow-2xl group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.01] to-transparent pointer-events-none" />
                  
                  <div className="px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between relative">
                    <div className="flex items-center">
                      <ScrollText className="w-4 h-4 mr-3 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                      <span className="tech-label opacity-70">{language === 'fr' ? 'LOG_ÉXÉCUTION' : 'EXECUTION_LOG'}</span>
                    </div>
                    {localStorage.getItem('trade_auto_active') === 'true' && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-md">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                        <span className="text-[8px] font-black text-orange-500/80 font-mono tracking-widest leading-none">AUTO</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] space-y-3 bg-transparent custom-scrollbar">
                    {tradeLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-700 italic tracking-widest font-black uppercase opacity-30">
                        {language === 'fr' ? '> _ LISTE_VIDE' : '> _ EMPTY_PIPE'}
                      </div>
                    ) : (
                      tradeLogs.map((log, i) => (
                        <motion.div 
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          key={i} 
                          className="p-4 border border-white/[0.03] bg-white/[0.01] rounded-xl hover:border-blue-500/20 transition-all group/log shadow-inner relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800 group-hover/log:bg-blue-500 transition-colors" />
                          <div className="flex justify-between text-zinc-600 mb-2 font-black tracking-widest text-[8px]">
                            <span className="flex items-center">
                               <Timer className="w-2.5 h-2.5 mr-2" /> {log.time}
                            </span>
                            <span className={cn("px-2 py-0.5 rounded-full border", log.msg.includes('BLOCKED') ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5')}>
                              {log.msg.includes('BLOCKED') ? 'FAIL' : 'OK'}
                            </span>
                          </div>
                          <div className="text-zinc-300 font-bold leading-relaxed mb-2">{log.msg}</div>
                          
                          {log.details && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 pt-3 border-t border-white/[0.03] text-[8px] text-zinc-500 font-mono tracking-widest">
                               <div className="flex justify-between">SYM: <span className="text-zinc-200 font-black">{log.details.symbol}</span></div>
                               <div className="flex justify-between">VOL: <span className="text-zinc-200 font-black">{log.details.volume}</span></div>
                               <div className="flex justify-between">TYP: <span className="text-zinc-200 font-black">{log.details.subType}</span></div>
                               <div className="flex justify-between">PRC: <span className="text-zinc-200 font-black">{log.details.price}</span></div>
                               <div className="col-span-2 text-zinc-600 mt-2 flex gap-2"><span className="text-zinc-700 font-black">EXP:</span> {log.details.expiration} <span className="opacity-30">//</span> {log.details.expirationDate}</div>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
               </div>

               <div className="tech-card h-[120px] flex flex-col justify-between overflow-hidden group">
                <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.05] flex justify-between items-center relative overflow-hidden">
                   <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 opacity-50" />
                   <span className="tech-label opacity-60 tracking-[0.4em]">{t('edge')}</span>
                   <div className="text-[10px] font-mono font-black text-zinc-700 opacity-50">IDX_77A</div>
                </div>
                <div className="p-4 flex flex-1 items-center justify-between relative bg-gradient-to-br from-zinc-900/10 to-transparent">
                  <div className="flex flex-col">
                    <div className="text-4xl font-mono font-black text-zinc-100 tracking-tighter flex items-end">
                      {marketData.confidenceScore}<span className="text-xl text-zinc-700 ml-1 mb-1">%</span>
                    </div>
                    <div className="text-[9px] font-mono font-black tracking-widest text-zinc-600 uppercase mt-1 opacity-80">PROBABILITY_COEF</div>
                  </div>
                  
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" stroke="currentColor" className="text-zinc-900" />
                      <motion.circle 
                        cx="32" cy="32" r="28" fill="none" strokeWidth="4" stroke="currentColor"
                        strokeDasharray={2 * Math.PI * 28}
                        initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - marketData.confidenceScore / 100) }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                      />
                    </svg>
                    <div className="absolute text-[8px] font-black text-blue-400 opacity-50">AI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Intelligence Row */}
          <AiIntelligenceUnit data={marketData} />

          <div className="grid grid-cols-1 gap-4 pb-12">
            <NewsFeedCard news={marketData.news} asset={marketData.asset} />
          </div>

        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] overflow-hidden">
      <Sidebar 
        className="z-10" 
        capital={capital} 
        onChangeCapital={setCapital} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        isSynced={isSynced}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar 
          selectedAsset={asset} 
          onAssetChange={setAsset} 
          selectedTimeframe={timeframe}
          onTimeframeChange={setTimeframe}
          onRefresh={handleManualRefresh}
        />
        
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar bg-transparent relative">
          {renderContent()}
        </div>

        <footer className="h-7 border-t border-white/[0.02] flex items-center px-5 text-[8px] text-zinc-700 bg-black shrink-0 font-mono uppercase tracking-[0.2em] relative z-10">
          <span className="opacity-50">&copy; {new Date().getFullYear()} QUANT_ENGINE_TERMINAL // DEMO_MODE</span>
          <span className="ml-auto flex items-center gap-3">
             <div className="flex items-center gap-1.5 px-2 py-0.5 border border-white/[0.03] rounded-full">
               <span className="w-1 h-1 rounded-full bg-emerald-500/50" /> 
               <span className="opacity-30">LATENCY:</span> {Math.floor(Math.random() * 20 + 8)}ms
             </div>
             <div className="flex items-center gap-1.5 px-2 py-0.5 border border-white/[0.03] rounded-full">
               <span className="w-1 h-1 rounded-full bg-blue-500/50" />
               WSS_SECURE
             </div>
          </span>
        </footer>
      </main>
    </div>
  );
}
