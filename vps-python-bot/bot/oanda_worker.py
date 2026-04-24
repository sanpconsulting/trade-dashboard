import logging
import pandas as pd
from oandapyV20 import API
import oandapyV20.endpoints.instruments as instruments
import oandapyV20.endpoints.orders as orders
import oandapyV20.endpoints.accounts as accounts
import oandapyV20.endpoints.positions as positions

class OandaWorker:
    def __init__(self, api_key: str, account_id: str, environment: str, logger: logging.Logger):
        self.logger = logger
        self.account_id = account_id
        try:
            self.api = API(access_token=api_key, environment=environment)
            self.logger.info(f"OandaWorker connecté à l'environnement {environment}.")
        except Exception as e:
            self.logger.critical("Échec de connexion à l'API OANDA.")
            raise e

    def get_historical_candles(self, instrument: str, count: int = 512, granularity: str = "M15") -> pd.DataFrame:
        """Récupère les bougies OANDA et retourne un DataFrame"""
        params = {"count": count, "granularity": granularity}
        req = instruments.InstrumentsCandles(instrument=instrument, params=params)
        try:
            res = self.api.request(req)
            data = []
            for candle in res.get('candles'):
                if candle.get('complete', True):
                    data.append({
                        'time': candle['time'],
                        'open': float(candle['mid']['o']),
                        'high': float(candle['mid']['h']),
                        'low': float(candle['mid']['l']),
                        'close': float(candle['mid']['c']),
                        'volume': int(candle['volume'])
                    })
            return pd.DataFrame(data)
        except Exception as e:
            self.logger.error(f"Erreur historique {instrument}: {str(e)}")
            return pd.DataFrame()

    def get_account_summary(self) -> dict:
        req = accounts.AccountSummary(accountID=self.account_id)
        try:
            res = self.api.request(req)
            return res.get('account', {})
        except Exception as e:
            self.logger.error(f"Erreur account summary: {str(e)}")
            return {}

    def calculate_atr(self, df: pd.DataFrame, period: int = 14) -> float:
        """Calcul de l'Average True Range pour le TP/SL dynamique"""
        high_low = df['high'] - df['low']
        high_close = (df['high'] - df['close'].shift()).abs()
        low_close = (df['low'] - df['close'].shift()).abs()
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = ranges.max(axis=1)
        return true_range.rolling(period).mean().iloc[-1]

    def place_order(self, instrument: str, units: int, stop_loss_distance: float, take_profit_distance: float):
        """Place un ordre au marché avec SL/TP calculés via ATR"""
        current_price_df = self.get_historical_candles(instrument, count=1)
        if current_price_df.empty:
            return
        
        current_price = current_price_df['close'].iloc[0]
        
        if units > 0: # Achat
            raw_sl = current_price - stop_loss_distance
            raw_tp = current_price + take_profit_distance
        else: # Vente
            raw_sl = current_price + stop_loss_distance
            raw_tp = current_price - take_profit_distance
            
        if "JPY" in instrument:
            sl_price = round(raw_sl, 3)
            tp_price = round(raw_tp, 3)
        else:
            sl_price = round(raw_sl, 5)
            tp_price = round(raw_tp, 5)

        order_data = {
            "order": {
                "units": str(units),
                "instrument": instrument,
                "timeInForce": "FOK",
                "type": "MARKET",
                "positionFill": "DEFAULT",
                "stopLossOnFill": {"price": str(sl_price)},
                "takeProfitOnFill": {"price": str(tp_price)}
            }
        }
        
        req = orders.OrderCreate(self.account_id, data=order_data)
        try:
            res = self.api.request(req)
            self.logger.info(f"Ordre exécuté: {res}")
        except Exception as e:
            self.logger.error(f"Échec de l'ordre sur {instrument}: {str(e)}")

    def kill_switch(self):
        """Ferme toutes les positions en cas d'urgence"""
        self.logger.critical("KILL SWITCH ACTIVÉ ! Fermeture de toutes les positions.")
        req = positions.OpenPositions(accountID=self.account_id)
        try:
            res = self.api.request(req)
            open_positions = res.get('positions', [])
            for position in open_positions:
                instrument = position['instrument']
                close_data = {}
                if float(position['long']['units']) > 0:
                    close_data['longUnits'] = "ALL"
                if float(position['short']['units']) < 0:
                    close_data['shortUnits'] = "ALL"
                
                if close_data:
                    close_req = positions.PositionClose(
                        accountID=self.account_id, 
                        instrument=instrument, 
                        data=close_data
                    )
                    self.api.request(close_req)
                    self.logger.info(f"Position fermée pour {instrument}.")
        except Exception as e:
            self.logger.error(f"Erreur lors du Kill Switch: {str(e)}")
