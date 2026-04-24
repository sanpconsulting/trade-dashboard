import { MarketData } from '../types';

/**
 * Technical Analysis Quant Engine
 * Provides a high-performance local analysis engine.
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
    
    if (data.nlpSentiment && data.nlpSentiment.averageScore > 0.3) {
      summary += `Le sentiment NLP (Alpha-FinBERT) est très positif (+${(data.nlpSentiment.averageScore * 100).toFixed(0)}%), confirmant l'appétit institutionnel. `;
    }

    if (data.prediction && data.prediction.shortTermTrend === 'UP') {
      summary += `Le modèle de série temporelle prévoit une continuation haussière avec une probabilité de ${data.prediction.probability}%. `;
    }

    summary += `\n\nCible privilégiée : Breakout identifié avec un score de confiance hybride de ${data.confidenceScore}%.`;
  } else if (action === 'SELL') {
    summary += `Architecture de prix baissière détectée sur ${asset}. `;
    summary += `Un total de ${bearish.length} signaux techniques pointent vers une distribution des actifs. `;
    
    if (data.nlpSentiment && data.nlpSentiment.averageScore < -0.3) {
      summary += `L'analyse de sentiment FinBERT détecte un "fear index" élevé (${(Math.abs(data.nlpSentiment.averageScore) * 100).toFixed(0)}%), suggérant une faible probabilité de rebond immédiat. `;
    }

    if (data.prediction && data.prediction.shortTermTrend === 'DOWN') {
      summary += `La prédiction IA anticipe un nouveau test des supports à court terme (${data.prediction.probability}% proba). `;
    }

    summary += `\n\nLe risque de baisse reste majeur. Score de fusion : ${data.confidenceScore}%.`;
  } else {
    summary += `Indécision globale observée sur ${asset}. `;
    if (data.nlpSentiment && Math.abs(data.nlpSentiment.averageScore) < 0.2) {
      summary += "Le flux d'informations est neutre ou contradictoire, ce qui limite le momentum. ";
    }
    summary += `La stratégie recommandée est la ${data.recommendedStrategy} (Confiance hybride : ${data.confidenceScore}%).`;
  }

  return summary;
}
