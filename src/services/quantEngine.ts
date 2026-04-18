import { MarketData } from '../types';

/**
 * Technical Analysis Quant Engine
 * Provides a high-performance local alternative to LLM analysis.
 * Uses the confluence of 10+ indicators to generate a summary.
 */
export function generateQuantSynthesis(data: MarketData): string {
  const indicators = data.detailedIndicators || [];
  const bullish = indicators.filter(i => i.signal === 'BULLISH');
  const bearish = indicators.filter(i => i.signal === 'BEARISH');
  const neutral = indicators.filter(i => i.signal === 'NEUTRAL');

  const action = data.recommendedAction;
  const asset = data.asset;
  
  let summary = "";

  if (action === 'BUY') {
    summary += `Structure de marché fortement haussière pour ${asset}. `;
    summary += `Nous observons une confluence de ${bullish.length} indicateurs techniques validant une pression acheteuse. `;
    
    // Specific mentions
    const rsi = indicators.find(i => i.name.includes('RSI'));
    if (rsi && rsi.signal === 'BULLISH') summary += "Le RSI indique une phase de récupération après une zone de survente. ";
    
    const ema = indicators.find(i => i.name.includes('EMA'));
    if (ema && ema.signal === 'BULLISH') summary += "Le croisement des moyennes mobiles (EMA 20/50) confirme le retour du momentum. ";
    
    summary += `\n\nCible privilégiée : Breakout identifié avec un score de confiance de ${data.confidenceScore}%.`;
  } else if (action === 'SELL') {
    summary += `Architecture de prix baissière détectée sur ${asset}. `;
    summary += `Un total de ${bearish.length} signaux techniques pointent vers une distribution des actifs. `;
    
    const macd = indicators.find(i => i.name.includes('MACD'));
    if (macd && macd.signal === 'BEARISH') summary += "L'affaiblissement du MACD montre une perte de vitesse des acheteurs. ";
    
    summary += `\n\nLe risque de baisse reste majeur tant que les résistances locales ne sont pas franchies. Score de fiabilité : ${data.confidenceScore}%.`;
  } else {
    summary += `Indécision globale observée sur ${asset}. `;
    summary += "Les indicateurs sont partagés entre accumulation et prise de profit. ";
    summary += `La stratégie recommandée est la ${data.recommendedStrategy} en attendant un signal directionnel plus clair (Confluence actuelle : ${data.confidenceScore}%).`;
  }

  return summary;
}
