import React, { useState, useEffect } from 'react';
import { Save, Key, Shield, Bell, HardDrive, RefreshCw } from 'lucide-react';

export function SettingsView() {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem('trade_ai_local_model') || '');
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        if (data.models && data.models.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0]);
          localStorage.setItem('trade_ai_local_model', data.models[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch models', e);
    }
    setLoadingModels(false);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value;
    setSelectedModel(model);
    localStorage.setItem('trade_ai_local_model', model);
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto w-full h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-widest">System Settings</h2>
        <button className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-sm text-xs font-semibold transition-colors">
          <Save className="w-3 h-3 mr-1.5" /> Save Configuration
        </button>
      </div>

      <div className="space-y-6">
        <section className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center justify-between text-[11px] uppercase font-semibold text-zinc-500">
            <div className="flex items-center">
              <HardDrive className="w-3 h-3 mr-2" /> Local LLM Integration (Ollama)
            </div>
            <button onClick={fetchModels} disabled={loadingModels} className="hover:text-zinc-300">
              <RefreshCw className={`w-3 h-3 ${loadingModels ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">Available Models</label>
              <select 
                value={selectedModel}
                onChange={handleModelChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500"
              >
                {models.length === 0 && <option value={selectedModel || 'llama3'}>{selectedModel || 'llama3'} (Loading...)</option>}
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="text-[9px] text-zinc-600 mt-1">Select from models currently installed on your local Ollama instance.</div>
            </div>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center text-[11px] uppercase font-semibold text-zinc-500">
            <Key className="w-3 h-3 mr-2" /> Exchange Connections
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">API Key (Mockup)</label>
              <input type="password" placeholder="Enter API Key from your Broker" className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">Secret Key</label>
              <input type="password" placeholder="Enter API Secret" className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center text-[11px] uppercase font-semibold text-zinc-500">
            <Shield className="w-3 h-3 mr-2" /> Risk Engine Guardian
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">Max Risk Per Trade (%)</label>
                <input type="number" defaultValue={2.0} step={0.1} className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">Daily Loss Limit (%)</label>
                <input type="number" defaultValue={5.0} step={0.1} className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex items-center mt-3 pt-3 border-t border-zinc-800">
              <input type="checkbox" defaultChecked id="hardStop" className="mr-2" />
              <label htmlFor="hardStop" className="text-[11px] text-zinc-300 cursor-pointer">Enforce Hard Stop-Loss (Auto-close positions at Limit)</label>
            </div>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center text-[11px] uppercase font-semibold text-zinc-500">
            <Bell className="w-3 h-3 mr-2" /> Notifications
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-300">Push Notifications for AI Alerts</span>
              <input type="checkbox" defaultChecked className="cursor-pointer" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-300">Email Daily Summary</span>
              <input type="checkbox" className="cursor-pointer" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-300">Sound Effects for Execution</span>
              <input type="checkbox" defaultChecked className="cursor-pointer" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
