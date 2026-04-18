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
    <div className="bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col overflow-hidden h-[300px]">
      <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center">
          <Rss className="w-3.5 h-3.5 mr-2 text-blue-500" />
          {t('news')} // {asset}
        </div>
      </div>
      <div className="overflow-y-auto p-4 space-y-3 flex-1 flex flex-col">
        {news.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono">
            {language === 'fr' ? `Aucune actualité agrégée pour ${asset}.` : `No recent news aggregated for ${asset}.`}
          </div>
        ) : (
          news.map((item, i) => (
            <a 
              key={i} 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block group border-l-2 border-zinc-800 hover:border-blue-500 pl-3 py-1 transition-colors"
            >
              <h4 className="text-xs text-zinc-300 font-medium group-hover:text-blue-400 transition-colors line-clamp-2">
                {item.title}
              </h4>
              <div className="flex items-center text-[9px] text-zinc-500 mt-1 uppercase font-mono">
                <Clock className="w-2.5 h-2.5 mr-1" />
                {new Date(item.pubDate).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                <ExternalLink className="w-2.5 h-2.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
