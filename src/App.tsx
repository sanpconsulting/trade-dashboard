import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ScoreGauge } from './components/ScoreGauge';
import { TradePlanCard } from './components/TradePlanCard';
import { AiSynthesisCard } from './components/AiSynthesisCard';
import { ChartMock } from './components/ChartMock';
import { NewsFeedCard } from './components/NewsFeedCard';
import { fetchRealMarketData } from './services/marketApi';
import { MarketData, Timeframe } from './types';
import { Loader2 } from 'lucide-react';

// Import Views
import { SettingsView } from './components/views/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [asset, setAsset] = useState('BTC-USD');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [capital, setCapital] = useState<number>(10000);

  useEffect(() => {
    // Only fetch market data recursively on Dashboard tab to save resources
    if (activeTab !== 'Dashboard') return;

    let isMounted = true;
    setMarketData(null);
    
    async function getMarket() {
      if (activeTab !== 'Dashboard') return;
      try {
        const data = await fetchRealMarketData(asset, timeframe);
        if (isMounted) setMarketData(data);
      } catch (err) {
        console.error(err);
      }
    }
    
    getMarket();
    const intervalId = setInterval(getMarket, 60000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [asset, timeframe, activeTab]);

  const renderContent = () => {
    if (activeTab === 'Settings') return <SettingsView />;

    if (!marketData) {
      return (
        <div className="flex h-full bg-[#09090b] text-[#fafafa] items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            <p className="text-zinc-500 font-mono tracking-widest uppercase text-[10px]">Syncing Data // {asset}...</p>
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
            <div className="col-span-1 xl:col-span-1">
              <AiSynthesisCard data={marketData} selectedModel={localStorage.getItem('trade_ai_local_model') || undefined} />
            </div>
          </div>

          {/* Middle row: Dashboard Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreGauge score={marketData.technicalScore} label="Technical Structure" />
            <ScoreGauge score={marketData.fundamentalScore} label="Macro Backdrop" type="fundamental" />
            <ScoreGauge score={marketData.sentimentScore} label="Volume Momentum" type="sentiment" />
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col justify-center text-center overflow-hidden">
              <div className="px-4 py-2 bg-zinc-950/50 border-b border-zinc-800 text-[10px] uppercase font-semibold text-zinc-500 w-full">Aggregated Edge</div>
              <div className="p-4 flex-1 flex flex-col items-center justify-center">
                <div className="text-3xl font-mono font-bold text-zinc-100">
                  {marketData.confidenceScore}<span className="text-lg text-zinc-500">%</span>
                </div>
                <div className="text-[10px] uppercase text-zinc-500 mt-1">Confluence</div>
              </div>
            </div>
          </div>

          {/* Bottom row: The Plan and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4">
            <div className="col-span-1 lg:col-span-2">
              <TradePlanCard data={marketData} capital={capital} />
            </div>
            
            {/* Alert Module mockup */}
            <div className="col-span-1 bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800 text-[10px] uppercase font-semibold text-zinc-500">
                Risk Parameters & Alerts
              </div>
              <div className="p-4 space-y-2 flex-1">
                {[
                  { title: 'Invalidation Target', val: marketData.recommendedAction === 'BUY' ? marketData.tradePlan.stopLoss : 'N/A', active: true },
                  { title: 'ATR Volatility', val: marketData.volatility, active: true },
                  { title: 'Red News Impact', val: '2h 15m', active: false },
                ].map((alert, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-sm border border-zinc-800/80 bg-zinc-950/30">
                    <div className="flex items-center">
                      <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${alert.active ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-zinc-700'}`} />
                      <span className="text-[11px] text-zinc-400 font-medium">{alert.title}</span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-100">
                      {typeof alert.val === 'number' ? new Intl.NumberFormat('en-US', {style:'currency', currency: 'USD'}).format(alert.val) : alert.val}
                    </span>
                  </div>
                ))}
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

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] overflow-hidden">
      <Sidebar 
        className="z-10" 
        capital={capital} 
        onChangeCapital={setCapital} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar 
          selectedAsset={asset} 
          onAssetChange={setAsset} 
          selectedTimeframe={timeframe}
          onTimeframeChange={setTimeframe}
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
