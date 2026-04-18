import React, { useState, useEffect } from 'react';
import { Save, Key, Shield, Bell, HardDrive, RefreshCw, Loader2, Check } from 'lucide-react';

import { useLanguage } from '../../hooks/useLanguage';

export function SettingsView() {
  const { t, language } = useLanguage();
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem('trade_ai_local_model') || '');
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  // LLM States
  const [ollamaUrl, setOllamaUrl] = useState(localStorage.getItem('trade_ai_ollama_url') || '');

  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const urlParam = ollamaUrl ? `?ollamaUrl=${encodeURIComponent(ollamaUrl)}` : '';
      const res = await fetch(`/api/models${urlParam}`);
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        if (data.models && data.models.length > 0 && !selectedModel) {
          const firstModel = data.models[0];
          setSelectedModel(firstModel);
          localStorage.setItem('trade_ai_local_model', firstModel);
        }
      } else {
        // Fallback for visual clarity if custom URL fails
        if (ollamaUrl) setModels([]);
      }
    } catch (e) {
      console.error('Failed to fetch models', e);
    }
    setLoadingModels(false);
  };

  const handleSave = () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem('trade_ai_ollama_url', ollamaUrl);
      localStorage.setItem('trade_ai_local_model', selectedModel);
      localStorage.setItem('trade_api_key', apiKey);
      localStorage.setItem('trade_api_secret', apiSecret);
      localStorage.setItem('trade_max_risk', maxRisk);
      localStorage.setItem('trade_loss_limit', lossLimit);
      localStorage.setItem('trade_hard_stop', String(hardStop));
      localStorage.setItem('trade_notif_push', String(notifPush));
      localStorage.setItem('trade_notif_email', String(notifEmail));
      localStorage.setItem('trade_notif_sound', String(notifSound));

      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
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
        <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-sm overflow-hidden opacity-60">
          <div className="px-4 py-3 bg-zinc-950/20 border-b border-zinc-800/50 flex items-center justify-between text-[11px] uppercase font-semibold text-zinc-600">
            <div className="flex items-center italic">
              <HardDrive className="w-3 h-3 mr-2" /> Local LLM Integration (Désactivé)
            </div>
          </div>
          <div className="p-4">
            <p className="text-[10px] text-zinc-600">
              {language === 'fr' 
                ? "L'IA locale est désactivée pour optimiser les ressources de votre laptop. Le système utilise actuellement le QuantEngine V2 (Local, Confluence technique)." 
                : "Local AI is disabled to optimize laptop resources. The system currently uses QuantEngine V2 (Local, Technical Confluence)."}
            </p>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center text-[11px] uppercase font-semibold text-zinc-500">
            <Key className="w-3 h-3 mr-2" /> Exchange Connections
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">{t('api_key')}</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={language === 'fr' ? "Entrez la clé API de votre Broker" : "Enter API Key from your Broker"} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">{t('api_secret')}</label>
              <input 
                type="password" 
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder={language === 'fr' ? "Entrez votre secret" : "Enter API Secret"} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors" 
              />
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
