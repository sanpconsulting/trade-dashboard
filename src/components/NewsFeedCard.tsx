import React from 'react';
import { Rss, ExternalLink, Clock } from 'lucide-react';
import { NewsItem } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface NewsFeedCardProps {
  news: NewsItem[];
  asset: string;
}

export function NewsFeedCard({ news, asset }: NewsFeedCardProps) {
  const { t, language } = useLanguage();
  return (
    <div className="tech-card flex flex-col overflow-hidden h-[350px] relative group">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.05] flex justify-between items-center shrink-0">
        <div className="tech-label opacity-70 tracking-[0.3em] flex items-center">
          <Rss className="w-3.5 h-3.5 mr-3 text-blue-500/80" />
          {t('news')} // {asset}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[9px] font-mono font-black text-emerald-500/70 tracking-widest">LIVE_FEED</span>
        </div>
      </div>
      
      <div className="overflow-y-auto p-5 flex-1 flex flex-col custom-scrollbar bg-transparent">
        {news.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[10px] text-zinc-600 font-mono italic tracking-[0.2em] uppercase">
            {language === 'fr' ? `> _ NO_DATA_STREAM_FOR_${asset}` : `> _ NO_DATA_STREAM_FOR_${asset}`}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((item, i) => (
              <a 
                key={i} 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group/item relative bg-zinc-900/20 border border-zinc-800/50 hover:border-blue-500/30 hover:bg-zinc-900/40 p-4 rounded-xl transition-all h-[120px] flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute inset-0 bg-blue-500/[0.01] opacity-0 group-hover/item:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-zinc-700 font-mono tracking-[0.2em] uppercase">FIN_SOURCE</span>
                      {item.sentiment && (
                        <div className={`px-1.5 py-0.5 rounded-sm text-[7px] font-black tracking-widest border ${
                          item.sentiment === 'positive' ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' :
                          item.sentiment === 'negative' ? 'text-rose-500 bg-rose-500/5 border-rose-500/10' :
                          'text-zinc-600 bg-zinc-900 border-zinc-800'
                        }`}>
                          {item.sentiment.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-700 opacity-40 group-hover/item:opacity-100 group-hover/item:text-blue-500 transition-all" />
                  </div>
                  <h4 className="text-[11px] text-zinc-300 font-bold group-hover/item:text-white transition-colors line-clamp-2 leading-snug tracking-tight">
                    {item.title}
                  </h4>
                </div>

                <div className="relative z-10 flex items-center text-[8px] text-zinc-600 font-mono tracking-widest mt-3 pt-3 border-t border-zinc-800/50">
                  <Clock className="w-2.5 h-2.5 mr-2 text-zinc-700" />
                  {new Date(item.pubDate).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  <span className="mx-2 opacity-30">|</span>
                  {new Date(item.pubDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' })}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
