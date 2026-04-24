import React from 'react';
import { cn } from '../lib/utils';
import { Activity, LayoutDashboard, Settings, GitCompare, History, AlignEndHorizontal, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  className?: string;
  capital: number;
  onChangeCapital: (val: number) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  isSynced?: boolean;
}

import { useLanguage } from '../hooks/useLanguage';

export function Sidebar({ className, capital, onChangeCapital, activeTab, onTabChange, onLogout, isSynced }: SidebarProps) {
  const { t, language } = useLanguage();
  const items = [
    { label: t('dashboard'), id: 'Dashboard', icon: LayoutDashboard },
    { label: language === 'fr' ? 'Ordres & Positions' : 'Active Trades', id: 'ActiveTrades', icon: AlignEndHorizontal },
    { label: language === 'fr' ? 'Historique' : 'History', id: 'History', icon: History },
    { label: t('settings'), id: 'Settings', icon: Settings },
  ];

  return (
    <aside className={cn("flex flex-col w-56 bg-[#050505] border-r border-white/[0.02] h-screen relative z-30", className)}>
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
      
      <div className="p-5 flex items-center space-x-3 border-b border-white/[0.01] bg-white/[0.02] backdrop-blur-sm mb-5 relative overflow-hidden group">
        <div className="w-8 h-8 bg-zinc-950 border border-white/[0.03] rounded-lg flex items-center justify-center relative shadow-sm">
          <Activity className="h-4 w-4 text-blue-500/80 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-[#050505] animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-mono font-black text-white/90 uppercase tracking-tighter leading-none">QuantEngine</span>
          <span className="text-[7px] font-mono text-zinc-700 tracking-[0.5em] font-black mt-1.5 uppercase opacity-60">FIRMWARE_V3.1</span>
        </div>
      </div>
      
      <nav className="flex-1 px-3 space-y-1.5 mt-1">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-lg text-[9px] uppercase tracking-[0.2em] font-mono transition-all group overflow-hidden border",
                isActive 
                  ? "bg-zinc-950 text-blue-500 border-blue-500/10" 
                  : "bg-transparent text-zinc-700 border-transparent hover:text-zinc-400 hover:bg-white/[0.01]"
              )}
            >
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-700",
                isActive ? "bg-blue-500 opacity-100" : "bg-blue-500 opacity-0"
              )} />
              
              <item.icon className={cn("h-3.5 w-3.5 transition-all duration-300", isActive ? "text-blue-500" : "text-zinc-800 group-hover:text-zinc-600")} />
              <span className="font-black">{item.label}</span>
              
              {isActive && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute right-3 w-0.5 h-0.5 bg-blue-500 rounded-full" 
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-5 border-t border-white/[0.01] bg-white/[0.01] mt-auto">
        <div className="mb-3">
          <label className="text-[7px] font-mono font-black tracking-[0.3em] text-zinc-800 mb-2 block uppercase">LIQUIDITY_BASE</label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-800 font-mono text-[10px] leading-none">$</div>
            <input 
              type="number" 
              value={capital}
              readOnly={isSynced}
              onChange={(e) => !isSynced && onChangeCapital(Number(e.target.value))}
              className={cn(
                "w-full bg-zinc-950/50 border border-white/[0.02] rounded-lg px-4 py-2.5 pl-7 text-[11px] font-mono font-black tracking-tight transition-all focus:outline-none",
                isSynced ? "text-emerald-500/60 border-emerald-500/5" : "text-zinc-100 focus:border-blue-500/20"
              )}
            />
          </div>
        </div>

        <div className="bg-zinc-950/40 border border-white/[0.01] rounded-xl p-4 relative overflow-hidden group mb-3 shadow-inner">
          <div className="text-[7px] uppercase font-mono font-black tracking-[0.4em] text-zinc-800 mb-2.5 flex justify-between items-center">
            <span>RISK_VAL</span>
            <span className="opacity-30">24H</span>
          </div>
          <div className="text-lg font-mono font-black text-zinc-200 mb-3 tracking-tighter opacity-80">
            <span className="text-zinc-800 text-[10px] font-normal mr-1">$</span>
            {(capital * 0.005).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-zinc-900 mx-1.5">—</span>
            {(capital * 0.02).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="w-full bg-zinc-900/30 h-1 rounded-full overflow-hidden border border-white/[0.01] relative">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: '35%' }}
               transition={{ duration: 2, ease: "easeOut" }}
               className="bg-blue-500/40 h-full" 
             />
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2.5 px-4 py-3 border border-white/[0.02] hover:border-rose-500/10 hover:bg-rose-500/[0.02] text-zinc-800 hover:text-rose-500/60 rounded-lg text-[9px] uppercase font-black tracking-[0.4em] font-mono transition-all group relative overflow-hidden"
        >
          <LogOut className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          <span>SHUTDOWN</span>
        </button>
      </div>
    </aside>
  );
}
