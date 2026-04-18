import React, { useState, useEffect } from 'react';
import { Save, Key, Shield, Bell, HardDrive, RefreshCw, Loader2, Check } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { authFetch } from '../../lib/auth';

export function SettingsView() {
  const { t, language } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  // Exchange States
  const [apiKey, setApiKey] = useState(localStorage.getItem('trade_api_key') || '');
  const [apiSecret, setApiSecret] = useState(localStorage.getItem('trade_api_secret') || '');

  // Risk States
  const [maxRisk, setMaxRisk] = useState(localStorage.getItem('trade_max_risk') || '2.0');
  const [lossLimit, setLossLimit] = useState(localStorage.getItem('trade_loss_limit') || '5.0');
  const [hardStop, setHardStop] = useState(localStorage.getItem('trade_hard_stop') === 'true');

  // Notification States
  const [notifPush, setNotifPush] = useState(localStorage.getItem('trade_notif_push') !== 'false');
  const [notifEmail, setNotifEmail] = useState(localStorage.getItem('trade_notif_email') === 'true');
  const [notifSound, setNotifSound] = useState(localStorage.getItem('trade_notif_sound') !== 'false');

  // Auto Trade
  const [autoTrade, setAutoTrade] = useState(localStorage.getItem('trade_auto_active') === 'true');
  const [autoThreshold, setAutoThreshold] = useState(localStorage.getItem('trade_auto_threshold') || '80');
  const [stakePerOrder, setStakePerOrder] = useState(localStorage.getItem('trade_stake_amount') || '100');
  const [brokerEnv, setBrokerEnv] = useState(localStorage.getItem('trade_broker_env') || 'practice');

  const handleSave = () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem('trade_api_key', apiKey);
      localStorage.setItem('trade_api_secret', apiSecret);
      localStorage.setItem('trade_max_risk', maxRisk);
      localStorage.setItem('trade_loss_limit', lossLimit);
      localStorage.setItem('trade_hard_stop', String(hardStop));
      localStorage.setItem('trade_notif_push', String(notifPush));
      localStorage.setItem('trade_notif_email', String(notifEmail));
      localStorage.setItem('trade_notif_sound', String(notifSound));
      localStorage.setItem('trade_auto_active', String(autoTrade));
      localStorage.setItem('trade_auto_threshold', autoThreshold);
      localStorage.setItem('trade_stake_amount', stakePerOrder);
      localStorage.setItem('trade_broker_env', brokerEnv);

      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  const handleTestConnection = async () => {
    if (!apiKey || !apiSecret) {
      setTestResult({
        success: false,
        message: language === 'fr' ? 'Veuillez saisir votre Clé API et votre ID de compte.' : 'Please enter your API Key and Account ID.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await authFetch('/api/broker/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, accountId: apiSecret, environment: brokerEnv })
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: language === 'fr' 
            ? `Connecté ! Solde: ${data.account.balance} ${data.account.currency}` 
            : `Connected! Balance: ${data.account.balance} ${data.account.currency}`
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || (language === 'fr' ? 'Échec de la connexion.' : 'Connection failed.')
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Error'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetRisk = () => {
    localStorage.setItem('trade_daily_risk_consumed', '0');
    // Clear last trade timestamps to allow immediate re-entry for testing
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('last_trade_')) localStorage.removeItem(key);
    });
    alert(language === 'fr' ? 'Limites de risque réinitialisées.' : 'Risk limits reset successfully.');
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto w-full h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-widest">{t('settings')}</h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center px-4 py-1.5 rounded-sm text-xs font-semibold transition-all ${
            saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
          } disabled:opacity-50`}
        >
          {saving ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : saved ? (
            <Check className="w-3 h-3 mr-1.5" />
          ) : (
            <Save className="w-3 h-3 mr-1.5" />
          )}
          {saving ? (language === 'fr' ? 'Sauvegarde...' : 'Saving...') : saved ? (language === 'fr' ? 'Configuration Enregistrée' : 'Configuration Saved') : t('save')}
        </button>
      </div>

      <div className="space-y-6 pb-10">
        <section className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden border-orange-500/30">
          <div className="px-4 py-3 bg-zinc-950/50 border-b border-orange-500/20 flex items-center justify-between text-[11px] uppercase font-semibold text-orange-400">
            <div className="flex items-center">
              <RefreshCw className="w-3 h-3 mr-2" /> Algorithmic Execution
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs text-zinc-100 font-medium">{language === 'fr' ? 'Auto-Trading (Beta)' : 'Auto-Trading (Beta)'}</h4>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[300px]">
                  {language === 'fr' 
                    ? "Envoie automatiquement des ordres au broker lorsque le seuil de confluence est atteint." 
                    : "Automatically send orders to the broker when the confluence threshold is reached."}
                </p>
              </div>
              <div 
                onClick={() => setAutoTrade(!autoTrade)}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${autoTrade ? 'bg-orange-600' : 'bg-zinc-800'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoTrade ? 'left-5.5' : 'left-0.5'}`} />
              </div>
            </div>

            {autoTrade && (
              <div className="pt-4 border-t border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-semibold">
                  {language === 'fr' ? 'Seuil de Confluence (%)' : 'Confluence Threshold (%)'}
                </label>
                <div className="flex items-center space-x-4">
                  <input 
                    type="range" 
                    min="50" 
                    max="95" 
                    value={autoThreshold}
                    onChange={(e) => setAutoThreshold(e.target.value)}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="text-xs font-mono text-orange-500 font-bold w-8 text-right">{autoThreshold}%</span>
                </div>
              </div>
            )}

            {autoTrade && (
              <div className="pt-4 border-t border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-semibold">
                  {language === 'fr' ? 'Montant à miser par ordre (USD)' : 'Stake Amount Per Order (USD)'}
                </label>
                <input 
                  type="number" 
                  value={stakePerOrder}
                  onChange={(e) => setStakePerOrder(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-orange-500 transition-colors" 
                  placeholder="100.00"
                />
                <p className="text-[10px] text-zinc-600 mt-1 italic">
                  {language === 'fr' 
                    ? "Ce montant est plafonné par vos limites journalières et la perte maximale par trade." 
                    : "This amount is capped by your daily limits and max risk per trade settings."}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center text-[11px] uppercase font-semibold text-zinc-500">
            <Key className="w-3 h-3 mr-2" /> OANDA Connectivity (API)
          </div>
          <div className="p-4 space-y-4">
            <p className="text-[10px] text-zinc-500 italic mb-2">
              {language === 'fr' 
                ? "Configurez vos clés API OANDA dans les paramètres (Secrets) de la plateforme pour activer le trading réel." 
                : "Set your OANDA API keys in the platform settings (Secrets) to enable live trading."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">
                  {language === 'fr' ? 'Environnement du Broker' : 'Broker Environment'}
                </label>
                <div className="flex bg-zinc-950 p-1 rounded-sm border border-zinc-800">
                  <button 
                    onClick={() => setBrokerEnv('practice')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-sm transition-all ${brokerEnv === 'practice' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    DEMO / PRACTICE
                  </button>
                  <button 
                    onClick={() => setBrokerEnv('live')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-sm transition-all ${brokerEnv === 'live' ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    LIVE / PRODUCTION
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">{t('api_key')}</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={language === 'fr' ? "Clé API OANDA" : "OANDA API Key"} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">{t('api_secret')}</label>
                <input 
                  type="password" 
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder={language === 'fr' ? "Account ID" : "Account ID"} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors" 
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                {testResult && (
                  <div className={`text-[10px] font-mono px-3 py-2 rounded-sm border ${
                    testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  } animate-in fade-in slide-in-from-left-2 duration-300`}>
                    {testResult.success ? <Check className="w-2.5 h-2.5 inline mr-1.5" /> : null}
                    {testResult.message}
                  </div>
                )}
              </div>
              <button 
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center justify-center px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-sm text-[10px] uppercase font-bold transition-all disabled:opacity-50"
              >
                {testing && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                {language === 'fr' ? 'Tester la Connexion' : 'Test Connection'}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center text-[11px] uppercase font-semibold text-zinc-500">
            <Shield className="w-3 h-3 mr-2" /> {t('risk')}
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">{t('max_risk')}</label>
                <input 
                  type="number" 
                  value={maxRisk}
                  onChange={(e) => setMaxRisk(e.target.value)}
                  step={0.1} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">{t('daily_limit')}</label>
                <input 
                  type="number" 
                  value={lossLimit}
                  onChange={(e) => setLossLimit(e.target.value)}
                  step={0.1} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors" 
                />
              </div>
            </div>
            <div className="flex items-center mt-3 pt-3 border-t border-zinc-800">
              <input 
                type="checkbox" 
                checked={hardStop} 
                onChange={(e) => setHardStop(e.target.checked)}
                id="hardStop" 
                className="mr-2" 
              />
              <label htmlFor="hardStop" className="text-[11px] text-zinc-300 cursor-pointer">{t('hard_stop')}</label>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
               <button 
                onClick={handleResetRisk}
                className="text-[10px] uppercase font-bold text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 px-3 py-1.5 rounded-sm border border-rose-500/20"
               >
                 {language === 'fr' ? 'Réinitialiser les Limites Journalières' : 'Reset Daily Limits'}
               </button>
            </div>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center text-[11px] uppercase font-semibold text-zinc-500">
            <Bell className="w-3 h-3 mr-2" /> {t('notifications')}
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-300">{t('push_notif')}</span>
              <input 
                type="checkbox" 
                checked={notifPush}
                onChange={(e) => setNotifPush(e.target.checked)}
                className="cursor-pointer" 
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-300">{t('email_summary')}</span>
              <input 
                type="checkbox" 
                checked={notifEmail}
                onChange={(e) => setNotifEmail(e.target.checked)}
                className="cursor-pointer" 
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-300">{t('sound_fx')}</span>
              <input 
                type="checkbox" 
                checked={notifSound}
                onChange={(e) => setNotifSound(e.target.checked)}
                className="cursor-pointer" 
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
