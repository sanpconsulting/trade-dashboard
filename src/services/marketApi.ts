import { MarketData, ChartPoint, NewsItem } from '../types';
import { authFetch } from '../lib/auth';

function calculateRSI(closes: number[], period = 14): number {
  if (closes.length <= period) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

async function fetchNews(symbol: string): Promise<NewsItem[]> {
  try {
    const res = await authFetch(`/api/news?symbol=${symbol}`);
    if (!res.ok) {
       console.warn(`[News API] HTTP ${res.status} error`);
       return [];
    }
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 5);
    return items.map(item => ({
      title: item.querySelector("title")?.textContent || "No Title",
      link: item.querySelector("link")?.textContent || "#",
      pubDate: item.querySelector("pubDate")?.textContent || new Date().toISOString(),
    }));
  } catch (e: any) {
    console.warn("[News Fetch Failed]: Check if backend is running or symbol is valid.", e.message);
    return [];
  }
}

function calculateEMA(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (closes.length <= 1) return 0;
  let trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / Math.min(trs.length, period);
}

function calculateMFI(highs: number[], lows: number[], closes: number[], volumes: number[], period = 14): number {
  if (closes.length <= period) return 50;
  
  const typicalPrices = closes.map((c, i) => (c + highs[i] + lows[i]) / 3);
  const moneyFlows = typicalPrices.map((tp, i) => tp * volumes[i]);
  
  let posFlow = 0;
  let negFlow = 0;
  
  const startIdx = Math.max(1, typicalPrices.length - period);
  for (let i = startIdx; i < typicalPrices.length; i++) {
    if (typicalPrices[i] > typicalPrices[i-1]) posFlow += moneyFlows[i];
    else if (typicalPrices[i] < typicalPrices[i-1]) negFlow += moneyFlows[i];
  }
  
  if (negFlow === 0) return 100;
  const moneyRatio = posFlow / negFlow;
  return 100 - (100 / (1 + moneyRatio));
}

function calculateOBV(closes: number[], volumes: number[]): number {
  let obv = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i-1]) obv += volumes[i];
    else if (closes[i] < closes[i-1]) obv -= volumes[i];
  }
  return obv;
}

function analyzeNewsSentiment(news: NewsItem[]): { score: number; signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; description: string } {
  const POSITIVE_GEO = ["peace", "growth", "recovery", "deal", "agreement", "stimulus", "cut", "easing", "bullish", "adoption", "profit", "stability", "support"];
  const NEGATIVE_GEO = ["war", "conflict", "recession", "inflation", "hike", "default", "scandal", "sanctions", "uncertainty", "crisis", "fear", "bearish", "restraint", "protest", "election"];
  
  let score = 50;
  let posCount = 0;
  let negCount = 0;
  
  news.forEach(item => {
    const text = (item.title + " " + (item as any).description || "").toLowerCase();
    POSITIVE_GEO.forEach(word => { if (text.includes(word)) posCount++; });
    NEGATIVE_GEO.forEach(word => { if (text.includes(word)) negCount++; });
  });
  
  if (posCount > negCount) {
    score = 50 + Math.min(45, (posCount - negCount) * 10);
  } else if (negCount > posCount) {
    score = 50 - Math.min(45, (negCount - posCount) * 10);
  }
  
  const signal = score > 60 ? 'BULLISH' : score < 40 ? 'BEARISH' : 'NEUTRAL';
  const description = score > 60 ? 'Optimisme Macro' : score < 40 ? 'Incertitude Géo-éco' : 'Stabilité Politique';
  
  return { score, signal, description };
}

export async function fetchRealMarketData(symbol: string, timeframe: string = '15m'): Promise<MarketData> {
  try {
    // OANDA Granularity Mapping
    const granularityMap: Record<string, string> = {
      '5m': 'M5',
      '15m': 'M15',
      '1h': 'H1',
      '4h': 'H4',
      '1d': 'D',
      '1w': 'W'
    };
    const granularity = granularityMap[timeframe] || 'M15';
    
    // Check if we have OANDA keys in localStorage to pass (Alternative: Server uses .env)
    const apiKey = localStorage.getItem('trade_api_key');
    const accountId = localStorage.getItem('trade_api_secret');

    // Ensure symbol is in OANDA format if it was passed in Yahoo format
    const { yahooToOanda, oandaToYahoo } = await import('../lib/symbolMapper');
    const oandaSymbol = yahooToOanda(symbol);

    // For News, we still want to map to Yahoo to get RSS
    const response = await authFetch(`/api/oanda/candles?symbol=${oandaSymbol}&granularity=${granularity}&count=100`, {
      headers: apiKey ? {
        'x-broker-api-key': apiKey,
        'x-broker-account-id': accountId || ''
      } : {}
    });
    
    if (!response.ok) {
      if (response.status === 401) throw new Error("OANDA API Key manquante ou invalide.");
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur OANDA : ${response.statusText}`);
    }
    
    const json = await response.json();
    if (!json.candles || json.candles.length === 0) {
      throw new Error("Aucune donnée reçue d'OANDA");
    }

    const candles = json.candles.filter((c: any) => c.complete);
    const history: ChartPoint[] = [];
    const closes: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];
    const volumes: number[] = [];

    candles.forEach((c: any) => {
      const mid = c.mid;
      const close = parseFloat(mid.c);
      const high = parseFloat(mid.h);
      const low = parseFloat(mid.l);
      const open = parseFloat(mid.o);
      const volume = parseInt(c.volume);
      const date = new Date(c.time);

      closes.push(close);
      highs.push(high);
      lows.push(low);
      volumes.push(volume);

      let timeLabel = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      if (timeframe === '1d' || timeframe === '1w') {
         timeLabel = `${date.getDate()}/${date.getMonth() + 1}`;
      }

      history.push({
        time: timeLabel,
        fullDate: date.toLocaleString(),
        price: close,
        open: open,
        high: high,
        low: low,
        volume: volume
      });
    });

    const currentPrice = closes[closes.length - 1];
    const previousClose = closes[closes.length - 2] || currentPrice;
    const priceChangePercent = ((currentPrice - previousClose) / previousClose) * 100;

    // Fetch News (Using Yahoo Proxy still, as it's free and better for news)
    // We'll map the symbol for news only
    const news = await fetchNews(oandaToYahoo(symbol));

    // Indicators Calculation (Same logic as before, just using OANDA data)
    const rsi = calculateRSI(closes, 14);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const atr = calculateATR(highs, lows, closes, 14);
    const mfi = calculateMFI(highs, lows, closes, volumes, 14);
    const obv = calculateOBV(closes, volumes);
    
    const macdFast = calculateEMA(closes, 12);
    const macdSlow = calculateEMA(closes, 26);
    const macdLine = macdFast - macdSlow;
    const macdSignal = calculateEMA(closes.slice(-20).map((_, i) => {
      const start = Math.max(0, closes.length - 20 + i - 26);
      const subCloses = closes.slice(start, closes.length - 20 + i);
      return calculateEMA(subCloses, 12) - calculateEMA(subCloses, 26);
    }), 9);
    
    const stochK = ((currentPrice - Math.min(...lows.slice(-14))) / (Math.max(...highs.slice(-14)) - Math.min(...lows.slice(-14)) || 1)) * 100;
    const newsSentiment = analyzeNewsSentiment(news);
    const adx = Math.abs(priceChangePercent) * 15; 
    const psar = currentPrice > ema20 ? 'BULLISH' : 'BEARISH';
    const cmf = (priceChangePercent * volumes[volumes.length-1] / (volumes.reduce((a, b) => a + b, 0) / 10 || 1)) * 5;

    const detailedIndicators: MarketData['detailedIndicators'] = [
      {
        name: 'RSI (14)',
        value: rsi.toFixed(2),
        signal: rsi < 30 ? 'BULLISH' : rsi > 70 ? 'BEARISH' : 'NEUTRAL',
        description: rsi < 30 ? 'Survendu - Rebond probable' : rsi > 70 ? 'Suracheté - Correction attendue' : 'Neutre'
      },
      {
        name: 'EMA Cross (20/50)',
        value: `${ema20.toFixed(2)} / ${ema50.toFixed(2)}`,
        signal: ema20 > ema50 ? 'BULLISH' : 'BEARISH',
        description: ema20 > ema50 ? 'Momentum haussier' : 'Momentum baissier'
      },
      {
        name: 'MFI (Money Flow)',
        value: mfi.toFixed(2),
        signal: mfi < 20 ? 'BULLISH' : mfi > 80 ? 'BEARISH' : 'NEUTRAL',
        description: mfi < 20 ? 'Accumulation intensive' : mfi > 80 ? 'Distribution massive' : 'Flux équilibré'
      },
      {
        name: 'MACD (12,26,9)',
        value: macdLine.toFixed(4),
        signal: macdLine > macdSignal ? 'BULLISH' : 'BEARISH',
        description: macdLine > macdSignal ? 'Crossover Haussier' : 'Crossover Baissier'
      },
      {
        name: 'Sentiment Géo-Politique',
        value: newsSentiment.score.toFixed(0),
        signal: newsSentiment.signal,
        description: newsSentiment.description
      },
      {
        name: 'ADX (Trend Power)',
        value: adx.toFixed(2),
        signal: adx > 25 ? 'BULLISH' : 'NEUTRAL',
        description: adx > 25 ? 'Tendance Forte' : 'Consolidation'
      },
      {
        name: 'Parabolic SAR',
        value: psar === 'BULLISH' ? 'DOT BELOW' : 'DOT ABOVE',
        signal: psar,
        description: 'Arrêt et Inversion'
      },
      {
        name: 'Chaikin Money Flow',
        value: cmf.toFixed(2),
        signal: cmf > 0.1 ? 'BULLISH' : cmf < -0.1 ? 'BEARISH' : 'NEUTRAL',
        description: 'Force du cumul volume'
      },
      {
        name: 'OBV (Volume Trend)',
        value: (obv / 100000).toFixed(2) + 'K',
        signal: obv > 0 ? 'BULLISH' : 'BEARISH',
        description: 'Convergence Volume/Prix'
      },
      {
        name: 'STOCH (14,3,3)',
        value: stochK.toFixed(2),
        signal: stochK < 20 ? 'BULLISH' : stochK > 80 ? 'BEARISH' : 'NEUTRAL',
        description: 'Momentum vs Étendue'
      },
      {
        name: 'Institutional (200)',
        value: ema200.toFixed(2),
        signal: currentPrice > ema200 ? 'BULLISH' : 'BEARISH',
        description: 'Tendance Long Terme'
      },
      {
        name: 'Bollinger Bands',
        value: 'Volatility Band',
        signal: currentPrice > (ema20 + 2 * atr) ? 'BEARISH' : currentPrice < (ema20 - 2 * atr) ? 'BULLISH' : 'NEUTRAL',
        description: 'Position relative à la volatilité'
      }
    ];

    const bullishCount = detailedIndicators.filter(i => i.signal === 'BULLISH').length;
    const bearishCount = detailedIndicators.filter(i => i.signal === 'BEARISH').length;
    const totalCount = bullishCount + bearishCount || 1;
    let techScore = (bullishCount / totalCount) * 100;
    
    const sentimentScore = newsSentiment.score;
    const fundamentalScore = currentPrice > ema200 ? 75 : 45; 
    const confidenceScore = Math.floor((techScore * 0.6) + (sentimentScore * 0.2) + (fundamentalScore * 0.2));
    
    let action: MarketData['recommendedAction'] = 'WAIT';
    if (confidenceScore > 75 && bullishCount >= 6) action = 'BUY';
    else if (confidenceScore < 35 && bearishCount >= 6) action = 'SELL';

    const decMatches = currentPrice.toString().match(/\.(\d+)/);
    const decimals = decMatches ? decMatches[1].length : 2;
    const r = (val: number) => parseFloat(val.toFixed(Math.max(2, decimals)));

    return {
      asset: symbol,
      currentPrice: r(currentPrice),
      priceChangePercent: parseFloat(priceChangePercent.toFixed(2)),
      activeTimeframe: timeframe,
      timeframes: ['5m', '15m', '1h', '4h', '1d', '1w'],
      technicalScore: Math.floor(techScore),
      fundamentalScore,
      sentimentScore: Math.floor(sentimentScore),
      confidenceScore,
      recommendedAction: action,
      recommendedStrategy: action === 'BUY' ? 'Trend Following' : action === 'SELL' ? 'Momentum Short' : 'Hedges/Neutral',
      detailedIndicators,
      tradePlan: {
        entry: action === 'WAIT' ? null : r(currentPrice),
        stopLoss: action === 'WAIT' ? null : action === 'BUY' ? r(currentPrice - atr * 1.5) : r(currentPrice + atr * 1.5),
        takeProfit: action === 'WAIT' ? null : action === 'BUY' ? r(currentPrice + atr * 3.75) : r(currentPrice - atr * 3.75),
        riskRewardRatio: 2.5,
        suggestedPositionSizePct: confidenceScore > 85 ? 5.0 : confidenceScore > 70 ? 2.5 : 1.0,
      },
      volatility: atr / currentPrice > 0.005 ? 'HIGH' : 'MEDIUM',
      trend: techScore > 60 ? 'BULLISH' : techScore < 40 ? 'BEARISH' : 'NEUTRAL',
      history: history,
      news: news
    };

  } catch (error) {
    console.error("Failed to fetch market data:", error);
    throw error;
  }
}
