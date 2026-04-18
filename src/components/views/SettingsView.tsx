import React from 'react';
import { Save, Key, Shield, Bell, HardDrive } from 'lucide-react';

export function SettingsView() {
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
          <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center text-[11px] uppercase font-semibold text-zinc-500">
            <HardDrive className="w-3 h-3 mr-2" /> Local LLM Integration (Docker)
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">LLaMA Node URL</label>
              <input type="text" readOnly defaultValue="http://llama:11434/api/generate" className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-sm px-3 py-2 text-xs font-mono text-zinc-500 focus:outline-none cursor-not-allowed" />
              <div className="text-[9px] text-zinc-600 mt-1">Configured in docker-compose.yml via LLM_API_URL.</div>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">Model ID</label>
              <input type="text" readOnly defaultValue="llama3" className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-sm px-3 py-2 text-xs font-mono text-zinc-500 focus:outline-none cursor-not-allowed" />
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
