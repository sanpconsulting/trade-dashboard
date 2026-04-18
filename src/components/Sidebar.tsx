import React from 'react';
import { cn } from '../lib/utils';
import { Activity, LayoutDashboard, Settings, GitCompare, History, AlignEndHorizontal } from 'lucide-react';

interface SidebarProps {
  className?: string;
  capital: number;
  onChangeCapital: (val: number) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

import { useLanguage } from '../hooks/useLanguage';

interface SidebarProps {
  className?: string;
  capital: number;
  onChangeCapital: (val: number) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ className, capital, onChangeCapital, activeTab, onTabChange }: SidebarProps) {
  const { t } = useLanguage();
  const items = [
    { label: t('dashboard'), id: 'Dashboard', icon: LayoutDashboard },
    { label: t('settings'), id: 'Settings', icon: Settings },
  ];

  return (
    <aside className={cn("flex flex-col w-64 bg-[#09090b] border-r border-zinc-800 h-screen", className)}>
      <div className="p-4 flex items-center space-x-3 border-b border-zinc-800">
        <Activity className="h-5 w-5 text-blue-500" />
        <span className="text-[12px] font-mono font-bold text-zinc-100 uppercase tracking-widest">TradeAI_Pro</span>
      </div>
      
      <nav className="flex-1 px-3 space-y-1 mt-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-2 rounded-sm text-[11px] uppercase tracking-wider font-semibold transition-colors",
              activeTab === item.id 
                ? "bg-zinc-800 text-zinc-100" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-semibold">{t('dashboard') === 'Dashboard' ? 'Available Capital' : 'Capital Disponible'} (USD)</label>
        <div className="relative mb-4">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">$</span>
          <input 
            type="number" 
            value={capital}
            onChange={(e) => onChangeCapital(Number(e.target.value))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-1.5 pl-6 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-3">
          <div className="text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold">Risk Engine (24H)</div>
          <div className="text-xs font-mono font-medium text-zinc-300 mb-2">
            ${(capital * 0.005).toLocaleString()} - ${(capital * 0.02).toLocaleString()}
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-sm overflow-hidden border border-zinc-800/50">
            <div className="bg-emerald-500 h-full w-[25%]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
