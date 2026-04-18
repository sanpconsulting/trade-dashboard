/**
 * Service to handle communication with the Local LLaMA container via the Node proxy.
 * This completely replaces the Google Cloud GenAI library dependency.
 */

export async function generateTradeSynthesis(data: {
  asset: string;
  currentPrice: number;
  change: number;
  technicalScore: number;
  fundamentalScore: number;
  sentimentScore: number;
  strategy: string;
  action: 'BUY' | 'SELL' | 'WAIT' | 'REDUCE';
  selectedModel?: string;
}) {
  const prompt = `
Vous êtes "QuantGPT", une IA analytique spécialisée en finance quantitative, analyse de sentiment institutionnel et gestion du risque. Actuellement chargée d'assister un trader professionnel via le système TradeAI.

Données en temps réel du marché :
- Actif cible : ${data.asset}
- Prix actuel : $${data.currentPrice} (Variation 24h: ${data.change}%)
- Indicateur RSI & Technique (0-100) : ${data.technicalScore}
- Filtre Macro/Fondamental (0-100) : ${data.fundamentalScore}
- Momentum Social/Volume (0-100) : ${data.sentimentScore}
- Stratégie Algorithmique : ${data.strategy}
- Signal Moteur : ${data.action}

MISSION : Fournissez une synthèse experte de 3 à 5 lignes maximum de l'opportunité.
RÈGLES :
1. Adoptez un ton chirurgical, institutionnel et extrêmement factuel ("Price action démontre...", "Liquidité observée sur...").
2. Expliquez POURQUOI les scores valident le signal ${data.action}.
3. Donnez un aperçu de l'invalidité du scénario (quels événements annuleraient ce trade).
4. Ne donnez aucun conseil financier légal. Rédigez en français.`;

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, selectedModel: data.selectedModel })
    });

    if (!response.ok) {
      let errMsg = "L'API de l'IA locale a renvoyé une erreur.";
      try {
        const errorData = await response.json();
        errMsg = errorData.error || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    
    const result = await response.json();
    return result.text || "Analyse indisponible pour le moment.";

  } catch (error: any) {
    console.error("Error generating synthesis with LLaMA:", error);
    
    // Fallback if LLM is down (container stopped, network issue, or DNS failure)
    if (error.message?.includes("fetch failed") || error.message?.includes("network") || error.message?.includes("EAI_AGAIN") || error.message?.includes("ECONNREFUSED")) {
      return "⚠️ Le modèle LLaMA est injoignable. Le serveur semble incapable de contacter Ollama (vérifiez l'adresse ou que Ollama est bien lancé).";
    }
    
    return "Erreur du cluster IA : " + (error.message || error);
  }
}
