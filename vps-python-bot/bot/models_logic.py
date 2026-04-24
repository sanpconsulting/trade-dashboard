import pandas as pd
import torch
from transformers import pipeline
import logging

class TransformersEngine:
    """Moteur d'inférence local utilisant Hugging Face (Aucun appel Cloud API)"""
    def __init__(self, logger: logging.Logger):
        self.logger = logger
        self.logger.info("Initialisation du TransformersEngine...")
        
        # Optimisation CPU : Forcer l'utilisation de threads PyTorch appropriés
        torch.set_num_threads(4) 
        
        # Chargement du modèle Sentiment (FinBERT)
        # Note: Lors du premier lancement Docker, le modèle sera téléchargé et mis en cache.
        try:
            self.logger.info("Chargement de ProsusAI/finbert...")
            self.sentiment_analyzer = pipeline("sentiment-analysis", model="ProsusAI/finbert")
            self.logger.info("FinBERT chargé avec succès.")
        except Exception as e:
            self.logger.critical(f"Erreur de chargement FinBERT: {str(e)}")
            raise

    def analyze_market_context(self, news_headlines: list, recent_candles: pd.DataFrame) -> dict:
        """Fusionne l'analyse technique et le NLP"""
        
        # 1. Analyse NLP Sentiment
        sentiment_score = 0
        if news_headlines:
            results = self.sentiment_analyzer(news_headlines)
            
            for res in results:
                # Finbert returns positive, negative, or neutral
                if res['label'] == 'positive':
                    sentiment_score += 1 * res['score']
                elif res['label'] == 'negative':
                    sentiment_score -= 1 * res['score']
            
            # Moyenne pondérée du sentiment entre -1 (Baissier) et 1 (Haussier)
            sentiment_score = sentiment_score / len(news_headlines)

        # 2. Analyse Technique Basique (Séries temporelles - Simulation rapide)
        # Ici on utilise une simple moyenne mobile comme proxy si on n'a pas un modèle lourd comme Informer
        technical_signal = 0
        if len(recent_candles) >= 50:
            sma_20 = recent_candles['close'].rolling(20).mean().iloc[-1]
            sma_50 = recent_candles['close'].rolling(50).mean().iloc[-1]
            current_price = recent_candles['close'].iloc[-1]
            
            if current_price > sma_20 and sma_20 > sma_50:
                technical_signal = 0.8
            elif current_price < sma_20 and sma_20 < sma_50:
                technical_signal = -0.8

        # 3. Score Hybride
        hybrid_score = (sentiment_score * 0.4) + (technical_signal * 0.6)
        
        # Décision
        decision = "HOLD"
        if hybrid_score > 0.4:
            decision = "BUY"
        elif hybrid_score < -0.4:
            decision = "SELL"
            
        self.logger.info(f"Analyse terminée. NLP: {sentiment_score:.2f}, Tech: {technical_signal:.2f} -> {decision}")
        
        return {
            "hybrid_score": hybrid_score,
            "decision": decision
        }
