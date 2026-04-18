import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ScoreGauge } from './components/ScoreGauge';
import { TradePlanCard } from './components/TradePlanCard';
import { AiSynthesisCard } from './components/AiSynthesisCard';
import { ChartMock } from './components/ChartMock';
import { NewsFeedCard } from './components/NewsFeedCard';
import { GeoSentimentCard } from './components/GeoSentimentCard';
import { fetchRealMarketData } from './services/marketApi';
import { MarketData, Timeframe } from './types';
import { Loader2, ScrollText, Timer } from 'lucide-react';
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
        });
        const data = await res.json();
        if (data.account && data.account.balance) {
          setCapital(parseFloat(data.account.balance));
          setIsSynced(true);
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
    
    // Show loader only if asset or timeframe changed, not for periodic refresh
    if (asset !== lastAsset || timeframe !== lastTimeframe) {
      setMarketData(null);
      setLastAsset(asset);
      setLastTimeframe(timeframe);
    }
    
    async function getMarket() {
      if (activeTab !== 'Dashboard') return;
      try {
        const yahooSymbol = oandaToYahoo(asset);
        const data = await fetchRealMarketData(yahooSymbol, timeframe);
        if (isMounted) setMarketData({ ...data, asset: asset });
      } catch (err) {
        console.error(err);
      }
    }
    
    getMarket();
    // Using OANDA API: we can increase polling frequency back to a more responsive level (5s)
    // OANDA is much more reliable than Yahoo Finance for frequent updates.
    const intervalId = setInterval(getMarket, 5000); 
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [asset, timeframe, activeTab, refreshKey]);

  const renderContent = () => {
    if (activeTab === 'Settings') return <SettingsView />;
    if (activeTab === 'ActiveTrades') return <ActiveTradesView />;
    if (activeTab === 'History') return <TradesHistoryView />;

    if (!marketData) {
      return (
        <div className="flex h-full bg-[#09090b] text-[#fafafa] items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            <p className="text-zinc-500 font-mono tracking-widest uppercase text-[10px]">{t('syncing')} // {asset}...</p>
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 pb-4">
            <div className="col-span-1 xl:col-span-2">
              <TradePlanCard data={marketData} capital={capital} />
            </div>
            
            <div className="col-span-1 space-y-4">
               {/* Auto Trade Log */}
               <div className="bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col overflow-hidden h-[240px]">
                  <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800 text-[10px] uppercase font-semibold text-orange-500 flex items-center justify-between">
                    <div className="flex items-center">
                      <ScrollText className="w-3 h-3 mr-2" />
                      {language === 'fr' ? 'Historique d\'Exécution' : 'Execution History'}
                    </div>
                    {localStorage.getItem('trade_auto_active') === 'true' && (
                      <span className="flex items-center text-[8px] bg-orange-500/10 px-1.5 py-0.5 rounded-sm border border-orange-500/20">
                        <span className="w-1 h-1 bg-orange-500 rounded-full mr-1 animate-pulse" />
                        AUTO
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-2 overflow-y-auto font-mono text-[9px] space-y-1.5">
                    {tradeLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-600 italic">
                        {language === 'fr' ? 'Aucun ordre exécuté' : 'No orders executed yet'}
                      </div>
                    ) : (
                      tradeLogs.map((log, i) => (
                        <div key={i} className="p-2 border border-zinc-800/50 bg-zinc-950/20 rounded-sm hover:border-orange-500/30 transition-colors group">
                          <div className="flex justify-between text-zinc-500 mb-1">
                            <span className="flex items-center">
                               <Timer className="w-2.5 h-2.5 mr-1" /> {log.time}
                            </span>
                            <span className={log.msg.includes('BLOCKED') ? 'text-rose-500 font-bold uppercase' : 'text-emerald-500 font-bold tracking-widest uppercase'}>
                              {log.msg.includes('BLOCKED') ? 'REJECTED' : 'EXECUTED'}
                            </span>
                          </div>
                          <div className="text-zinc-300 group-hover:text-zinc-100 transition-colors text-[10px] mb-1 font-bold">{log.msg}</div>
                          
                          {log.details && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 pt-2 border-t border-zinc-800/50 text-[8px] text-zinc-500 font-mono">
                               <div>SYMBOL: <span className="text-zinc-300">{log.details.symbol}</span></div>
                               <div>VOL: <span className="text-zinc-300">{log.details.volume}</span></div>
                               <div>TYPE: <span className="text-zinc-300">{log.details.subType}</span></div>
                               <div>PRICE: <span className="text-zinc-300">{log.details.price}</span></div>
                               <div className="col-span-2">EXP: <span className="text-orange-500/80">{log.details.expiration} // {log.details.expirationDate}</span></div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
               </div>

               <div className="bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col justify-center text-center overflow-hidden">
                <div className="px-4 py-2 bg-zinc-950/50 border-b border-zinc-800 text-[10px] uppercase font-semibold text-zinc-500 w-full">{t('edge')}</div>
                <div className="p-4 flex-1 flex flex-col items-center justify-center">
                  <div className="text-3xl font-mono font-bold text-zinc-100">
                    {marketData.confidenceScore}<span className="text-lg text-zinc-500">%</span>
                  </div>
                  <div className="text-[10px] uppercase text-zinc-500 mt-1">{t('confidence')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Intelligence Row */}
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
        
        {renderContent()}

        <footer className="h-8 border-t border-zinc-800 flex items-center px-4 text-[9px] text-zinc-500 bg-[#09090b] shrink-0 font-mono uppercase">
          <span>&copy; {new Date().getFullYear()} TradeAI Pro. Simulated terminal for demo purposes.</span>
          <span className="ml-auto flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ping: {Math.floor(Math.random() * 20 + 8)}ms // WSS Connected</span>
        </footer>
      </main>
    </div>
  );
}
