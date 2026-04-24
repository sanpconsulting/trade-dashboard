import time
import schedule
from config import Config
from security_manager import setup_secure_logger
from oanda_worker import OandaWorker
from models_logic import TransformersEngine

def run_trading_cycle(worker: OandaWorker, ai_engine: TransformersEngine, logger):
    logger.info("Début du cycle de trading...")
    
    # Check Sécurité : Drawdown journalier
    account = worker.get_account_summary()
    if not account:
        return
        
    balance = float(account.get('balance', 0))
    nav = float(account.get('NAV', balance))
    drawdown = (balance - nav) / balance if balance > 0 else 0
    
    if drawdown > Config.DAILY_DRAWDOWN_LIMIT_PCT:
        logger.critical(f"Drawdown critique atteint ({drawdown*100:.2f}%). Arrêt des opérations.")
        worker.kill_switch()
        return

    # Parcourir les instruments configurés
    for instrument in Config.INSTRUMENTS:
        logger.info(f"Analyse de {instrument}...")
        
        # Ingestion des données (Séries temporelles)
        candles = worker.get_historical_candles(instrument, count=Config.BUFFER_SIZE, granularity=Config.TIMEFRAME)
        if candles.empty:
            continue
            
        # Simulation d'acquisition de news financières (NLP)
        news_mock = [f"Le cours du {instrument} semble prometteur", "Stabilité des marchés"]
        
        # Analyse IA Locale (Hugging Face)
        analysis = ai_engine.analyze_market_context(news_mock, candles)
        decision = analysis['decision']
        
        if decision != "HOLD":
            atr = worker.calculate_atr(candles, period=14)
            # Gestion du risque : 1% du capital
            risk_amount = nav * Config.MAX_RISK_PER_TRADE_PCT
            
            # Formule approximative pour la taille de lot
            # (Simplifié, nécessite un ajustement selon la valeur du pip de chaque paire)
            units = int((risk_amount / atr))
            if decision == "SELL":
                units = -units
                
            logger.info(f"Signal {decision} généré. Placement de l'ordre pour {units} unités.")
            # SL = 1.5x ATR, TP = 3x ATR (Risk/Reward 1:2)
            worker.place_order(instrument, units, stop_loss_distance=(atr*1.5), take_profit_distance=(atr*3.0))

def main():
    logger = setup_secure_logger()
    logger.info("=== Lancement de l'Agent de Trading IA (V2) ===")
    
    try:
        worker = OandaWorker(Config.OANDA_API_KEY, Config.OANDA_ACCOUNT_ID, Config.ENVIRONMENT, logger)
        ai_engine = TransformersEngine(logger)
        
        # Planification du cycle 
        # (ex: toutes les 15 minutes, synchronisé avec la bougie M15)
        schedule.every(15).minutes.do(run_trading_cycle, worker, ai_engine, logger)
        
        # Exécution immédiate au démarrage
        run_trading_cycle(worker, ai_engine, logger)
        
        # Boucle principale (Orchestrateur)
        while True:
            schedule.run_pending()
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Arrêt manuel de l'agent.")
    except Exception as e:
        logger.critical(f"Erreur fatale de l'orchestrateur: {str(e)}")

if __name__ == "__main__":
    main()
