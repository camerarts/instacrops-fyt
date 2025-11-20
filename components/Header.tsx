
import React from 'react';
import { Crop, Layers, Globe } from 'lucide-react';
import { languages, Language } from '../utils/translations';

interface HeaderProps {
  totalConverted: number;
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
}

const Header: React.FC<HeaderProps> = ({ totalConverted, lang, setLang, t }) => {
  return (
    <header className="w-full h-24 flex items-center sticky top-0 z-50 transition-all duration-300">
      {/* Glassmorphism Container */}
      <div className="absolute inset-0 bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/[0.08]"></div>
      
      <div className="relative container mx-auto px-4 flex items-center justify-between">
        {/* Left: Logo (Redesigned) */}
        <div className="flex items-center gap-4 group cursor-pointer select-none">
          {/* Icon Container */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-inner border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Layers className="w-6 h-6 text-white/90 absolute" />
              <Crop className="w-4 h-4 text-indigo-200 absolute translate-x-1 translate-y-1" />
            </div>
          </div>
          
          {/* Text Logo */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold tracking-tight leading-none">
              <span className="text-white">Insta</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Crops</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-[1px] w-3 bg-indigo-500/50"></div>
              <span className="text-[10px] font-semibold text-indigo-300/80 tracking-[0.2em] uppercase">{t.proStudio}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4">
          {/* Enhanced Conversion Counter Badge */}
          <div className="hidden md:flex items-center justify-center mr-2">
            <div className="flex items-baseline gap-2 px-6 py-2.5 rounded-2xl bg-[#131725]/80 border border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.15)] backdrop-blur-xl group hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(79,70,229,0.25)] transition-all duration-300">
              <span className="text-xs font-bold text-gray-400 self-center uppercase tracking-wider">{t.completed}</span>
              <span key={totalConverted} className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400 font-mono tabular-nums leading-none tracking-tighter drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)] animate-fade-in-up">
                {totalConverted}
              </span>
              <span className="text-xs font-bold text-gray-400 self-center uppercase tracking-wider">{t.converted}</span>
            </div>
          </div>

          {/* Language Selector */}
          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-200">
              <Globe className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as Language)}
                className="bg-transparent text-sm text-gray-300 font-medium focus:outline-none cursor-pointer appearance-none pr-4"
                aria-label="Select Language"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#1A1F2E] text-white">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
};

export default Header;
