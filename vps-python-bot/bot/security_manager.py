import os
import re
import logging
from cryptography.fernet import Fernet
from passlib.context import CryptContext

# 1. Gestion de l'authentification (Hachage MDP)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# 2. Cryptage/Décryptage des clés API OANDA
def decrypt_api_key(encrypted_key: str, master_key: str) -> str:
    """Décrypte la clé OANDA stockée en base/env en utilisant la clé maitresse"""
    try:
        f = Fernet(master_key.encode())
        decrypted = f.decrypt(encrypted_key.encode())
        return decrypted.decode('utf-8')
    except Exception as e:
        raise ValueError("Erreur critique: Impossible de décrypter la clé API OANDA.") from e

# 3. Protection des logs (Obfuscation)
class SecurityObfuscatingFormatter(logging.Formatter):
    """Filtre les logs pour masquer les tokens et IDs de compte"""
    def format(self, record):
        original_msg = super().format(record)
        # Masquer le token Bearer OANDA (ex: 1234567890abcdef-1234567890abcdef)
        obfuscated = re.sub(r'[a-f0-9]{16,}-[a-f0-9]{16,}', r'***HIDDEN_TOKEN***', original_msg)
        # Masquer l'ID du compte OANDA (ex: 123-456-7890123-456)
        obfuscated = re.sub(r'[0-9]{3}-[0-9]{3}-[0-9]{7}-[0-9]{3}', r'***HIDDEN_ACCOUNT_ID***', obfuscated)
        return obfuscated

def setup_secure_logger(name="ai_trader", level=logging.INFO):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Création du handler fichier sécurisé
    os.makedirs("logs", exist_ok=True)
    file_handler = logging.FileHandler("logs/trading_bot.log")
    
    # Appliquer le formateur d'obfuscation
    formatter = SecurityObfuscatingFormatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    
    # Handler console (optionnel, utiliser avec précaution)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    return logger
