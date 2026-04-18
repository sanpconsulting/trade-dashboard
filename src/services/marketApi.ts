import { MarketData, ChartPoint, NewsItem } from '../types';

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
    const res = await fetch(`/api/news?symbol=${symbol}`);
    if (!res.ok) return [];
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 5);
    return items.map(item => ({
      title: item.querySelector("title")?.textContent || "No Title",
      link: item.querySelector("link")?.textContent || "#",
      pubDate: item.querySelector("pubDate")?.textContent || new Date().toISOString(),
    }));
  } catch (e) {
    console.error("News fetch failed", e);
    return [];
  }
}

export async function fetchRealMarketData(symbol: string, timeframe: string = '15m'): Promise<MarketData> {
  try {
    let range = '2d';
    if (timeframe === '5m') range = '1d';
    if (timeframe === '1h') range = '5d';
    if (timeframe === '4h') range = '1mo';
    if (timeframe === '1d') range = '6mo';
    if (timeframe === '1w') range = '2y';

    const [response, news] = await Promise.all([
      fetch(`/api/yahoo?symbol=${symbol}&interval=${timeframe}&range=${range}`),
      fetchNews(symbol)
    ]);
    
    if (!response.ok) throw new Error("Erreur réseau");
    const json = await response.json();
    
    if (!json.chart || !json.chart.result || json.chart.result.length === 0) {
        throw new Error("Données de marché introuvables");
    }

    const chart = json.chart.result[0];
    const meta = chart.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose;
    const priceChangePercent = ((currentPrice - previousClose) / previousClose) * 100;

    const timestamps = chart.timestamp || [];
    const indicators = chart.indicators.quote[0] || {};
    
    const history: ChartPoint[] = [];
    const closes: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const o = indicators.open?.[i];
      const c = indicators.close?.[i];
      const h = indicators.high?.[i];
      const l = indicators.low?.[i];
      const v = indicators.volume?.[i];
      
      // Filter out null values which are common in Yahoo Finance intra-day
      if (c !== null && c !== undefined && h !== null && l !== null && o !== null) {
        closes.push(c);
        highs.push(h);
        lows.push(l);
        const d = new Date(timestamps[i] * 1000);
        history.push({
          time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
          fullDate: d.toLocaleString(),
          price: c,
          open: o,
          high: h,
          low: l,
          volume: v
        });
      }
    }

    if (closes.length === 0) {
        throw new Error("Historique vide");
    }

    // TA calculation
    const recentHigh = Math.max(...highs.slice(-20));
    const recentLow = Math.min(...lows.slice(-20));
    const rsi = calculateRSI(closes, 14);
    const isCrypto = symbol.includes('-USD');
    
    // Normalize technical score
    let techScore = 50;
    if (rsi < 30) techScore = 80;
    else if (rsi > 70) techScore = 20;
    else if (currentPrice > closes[Math.max(0, closes.length - 20)]) techScore = 65;
    else techScore = 35;
    
    // Sentiment
    const sentimentScore = priceChangePercent > 1 ? 75 : priceChangePercent < -1 ? 25 : 50;
    const fundamentalScore = isCrypto ? 60 : 70; // Stocks/Forex tend to have stronger macro gravity

    const avgScore = (techScore + fundamentalScore + sentimentScore) / 3;
    let action: MarketData['recommendedAction'] = 'WAIT';
    let confidenceScore = Math.floor(avgScore);
    
    let entry = currentPrice;
    let stopLoss = currentPrice;
    let takeProfit = currentPrice;

    // Decide action based on basic rules
    if (techScore > 60 && sentimentScore > 50) {
      action = 'BUY';
      entry = currentPrice * 0.999;
      stopLoss = recentLow < entry ? recentLow * 0.998 : entry * 0.98;
      takeProfit = entry + (entry - stopLoss) * 2;
      confidenceScore = 75 + Math.min(20, Math.floor(rsi));
    } else if (techScore < 40 && sentimentScore < 50) {
      action = 'SELL';
      entry = currentPrice * 1.001;
      stopLoss = recentHigh > entry ? recentHigh * 1.002 : entry * 1.02;
      takeProfit = entry - (stopLoss - entry) * 2;
      confidenceScore = 85 - Math.min(20, Math.floor(rsi));
    } else {
      action = priceChangePercent > 0 ? 'REDUCE' : 'WAIT';
      confidenceScore = 45;
    }

    // Formatting digits gracefully for pairs like JPY vs BTC
    const decMatches = currentPrice.toString().match(/\.(\d+)/);
    const decimals = decMatches ? decMatches[1].length : 2;
    const r = (val: number) => parseFloat(val.toFixed(Math.max(2, decimals)));

    return {
      asset: symbol,
      currentPrice: r(currentPrice),
      priceChangePercent: parseFloat(priceChangePercent.toFixed(2)),
      activeTimeframe: timeframe,
      timeframes: ['5m', '15m', '1h', '4h', '1d'],
      technicalScore: Math.floor(techScore),
      fundamentalScore,
      sentimentScore: Math.floor(sentimentScore),
      confidenceScore,
      recommendedAction: action,
      recommendedStrategy: action === 'BUY' ? 'Breakout' : action === 'SELL' ? 'Mean Reversion' : 'Trend Following',
      tradePlan: {
        entry: action === 'WAIT' ? null : r(entry),
        stopLoss: action === 'WAIT' ? null : r(stopLoss),
        takeProfit: action === 'WAIT' ? null : r(takeProfit),
        riskRewardRatio: action === 'WAIT' ? null : 2.0,
        suggestedPositionSizePct: confidenceScore > 80 ? 2.0 : confidenceScore > 60 ? 1.0 : 0.5,
      },
      volatility: ((recentHigh - recentLow) / currentPrice) > 0.05 ? 'HIGH' : 'MEDIUM',
      trend: techScore > 55 ? 'BULLISH' : techScore < 45 ? 'BEARISH' : 'NEUTRAL',
      history: history.slice(-50),
      news: news
    };

  } catch (error) {
    console.error("Failed to fetch market data:", error);
    throw error;
  }
}
