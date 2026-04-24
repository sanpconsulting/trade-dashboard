import os
from dotenv import load_dotenv
from security_manager import decrypt_api_key

load_dotenv()

class Config:
    # Récupération et décryptage immédiat en mémoire
    MASTER_KEY = os.getenv("MASTER_KEY")
    _ENCRYPTED_OANDA_KEY = os.getenv("OANDA_API_KEY_ENCRYPTED")
    
    if not MASTER_KEY or not _ENCRYPTED_OANDA_KEY:
        raise ValueError("Variables d'environnement de sécurité manquantes.")

    # La clé n'existe qu'en RAM pendant l'exécution
    OANDA_API_KEY = decrypt_api_key(_ENCRYPTED_OANDA_KEY, MASTER_KEY)
    OANDA_ACCOUNT_ID = os.getenv("OANDA_ACCOUNT_ID")
    
    # Configuration OANDA
    ENVIRONMENT = os.getenv("OANDA_ENV", "practice") # 'live' ou 'practice'
    
    # Paramètres de Trading Stratégiques
    INSTRUMENTS = ["EUR_USD", "BTC_USD"]
    MAX_RISK_PER_TRADE_PCT = 0.01  # 1% de risque par trade
    DAILY_DRAWDOWN_LIMIT_PCT = 0.03 # 3% Maximum Drawdown journalier
    
    # Paramètres Techniques
    BUFFER_SIZE = 512
    TIMEFRAME = "M15"
