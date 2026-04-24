import streamlit as st
import os
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import oandapyV20
from oandapyV20.endpoints.accounts import AccountSummary
from oandapyV20.endpoints.positions import OpenPositions
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
HASH_FILE = "data/dash_pwd.hash"

def decrypt_api_key(encrypted_key: str, master_key: str) -> str:
    try:
        f = Fernet(master_key.encode())
        return f.decrypt(encrypted_key.encode()).decode('utf-8')
    except Exception:
        return None

def get_oanda_balance():
    encrypted_key = os.getenv("OANDA_API_KEY_ENCRYPTED")
    master_key = os.getenv("MASTER_KEY")
    account_id = os.getenv("OANDA_ACCOUNT_ID")
    env = os.getenv("OANDA_ENV", "practice")
    
    if not all([encrypted_key, master_key, account_id]):
        return "Non configuré"
        
    api_key = decrypt_api_key(encrypted_key, master_key)
    if not api_key:
        return "Erreur de clé API"
        
    try:
        client = oandapyV20.API(access_token=api_key, environment=env)
        r = AccountSummary(accountID=account_id)
        client.request(r)
        balance = r.response['account']['balance']
        currency = r.response['account']['currency']
        return f"{float(balance):.2f} {currency}"
    except Exception as e:
        return f"Erreur de connexion"

def get_active_trades():
    encrypted_key = os.getenv("OANDA_API_KEY_ENCRYPTED")
    master_key = os.getenv("MASTER_KEY")
    account_id = os.getenv("OANDA_ACCOUNT_ID")
    env = os.getenv("OANDA_ENV", "practice")
    
    if not all([encrypted_key, master_key, account_id]):
        return []
        
    api_key = decrypt_api_key(encrypted_key, master_key)
    if not api_key:
        return []
        
    try:
        client = oandapyV20.API(access_token=api_key, environment=env)
        r = OpenPositions(accountID=account_id)
        client.request(r)
        
        trades = []
        for pos in r.response.get('positions', []):
            instrument = pos['instrument']
            long_units = float(pos['long']['units'])
            short_units = float(pos['short']['units'])
            
            if long_units > 0:
                unrealized_pl = float(pos['long']['unrealizedPL'])
                trades.append({"Instrument": instrument, "Direction": "ACHAT", "Unités": long_units, "P&L latent": f"{unrealized_pl:.2f}"})
            if short_units < 0:
                unrealized_pl = float(pos['short']['unrealizedPL'])
                trades.append({"Instrument": instrument, "Direction": "VENTE", "Unités": short_units, "P&L latent": f"{unrealized_pl:.2f}"})
        return trades
    except Exception:
        return []

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def load_hash():
    if os.path.exists(HASH_FILE):
        with open(HASH_FILE, "r") as f:
            return f.read().strip()
    return None

def save_hash(hashed_password):
    os.makedirs(os.path.dirname(HASH_FILE), exist_ok=True)
    with open(HASH_FILE, "w") as f:
        f.write(hashed_password)

st.set_page_config(page_title="Trading Agent Control Panel", layout="wide")

if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "reset_mode" not in st.session_state:
    st.session_state.reset_mode = False

stored_hash = load_hash()

if not stored_hash:
    st.title("⚙️ Première configuration")
    st.info("Veuillez configurer un mot de passe pour sécuriser l'accès au tableau de bord.")
    new_pwd = st.text_input("Nouveau mot de passe", type="password")
    new_pwd_confirm = st.text_input("Confirmer le mot de passe", type="password")
    if st.button("Enregistrer"):
        if new_pwd and new_pwd == new_pwd_confirm:
            save_hash(get_password_hash(new_pwd))
            st.success("Mot de passe configuré avec succès ! Veuillez vous connecter.")
            st.rerun()
        else:
            st.error("Les mots de passe ne correspondent pas ou sont vides.")
elif not st.session_state.authenticated:
    st.title("🔏 Connexion Sécurisée")
    pwd = st.text_input("Mot de passe", type="password")
    
    if st.button("Se connecter"):
        if verify_password(pwd, stored_hash): 
            st.session_state.authenticated = True
            st.session_state.reset_mode = False
            st.rerun()
        else:
            st.error("Mot de passe incorrect")
else:
    st.sidebar.title("Paramètres")
    st.sidebar.button("Déconnexion", on_click=lambda: st.session_state.update(authenticated=False))
    
    if st.sidebar.button("Réinitialiser le mot de passe", key="btn_reset_toggle"):
        st.session_state.reset_mode = not st.session_state.reset_mode
        
    if st.session_state.reset_mode:
        st.title("🔑 Réinitialisation du mot de passe")
        current_pwd = st.text_input("Mot de passe actuel", type="password")
        new_pwd = st.text_input("Nouveau mot de passe", type="password")
        new_pwd_confirm = st.text_input("Confirmer le nouveau mot de passe", type="password")
        
        if st.button("Valider la réinitialisation"):
            if not verify_password(current_pwd, stored_hash):
                st.error("L'ancien mot de passe est incorrect.")
            elif new_pwd != new_pwd_confirm or not new_pwd:
                st.error("Les nouveaux mots de passe ne correspondent pas ou sont vides.")
            else:
                save_hash(get_password_hash(new_pwd))
                st.success("Mot de passe mis à jour avec succès !")
                st.session_state.reset_mode = False
                st.rerun()
    else:
        st.title("📊 Trading Agent Dashboard")
        st.success("Robot en cours d'exécution. (Statut: OK)")
        
        balance = get_oanda_balance()
        st.info(f"**Capital disponible (OANDA):** {balance}")
        
        st.subheader("💼 Positions actives")
        active_trades = get_active_trades()
        if active_trades:
            st.dataframe(pd.DataFrame(active_trades), use_container_width=True)
        else:
            st.write("Aucune position ouverte pour le moment.")
        
        # Affichage des logs
        st.subheader("📝 Logs récents (Sécurisés)")
        try:
            with open("logs/trading_bot.log", "r") as f:
                logs = f.readlines()[-15:]
                for log in logs:
                    st.text(log.strip())
        except Exception:
            st.info("Aucun log disponible pour le moment (Fichier introuvable ou vide).")
