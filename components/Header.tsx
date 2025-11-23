import React, { useState } from 'react';
import { Crop, Layers, ChevronDown, Check, Globe } from 'lucide-react';
import { languages, Language } from '../utils/translations';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
  hasSelectedLang: boolean;
}

const Header: React.FC<HeaderProps> = ({ lang, setLang, t, hasSelectedLang }) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const currentLang = languages.find(l => l.code === lang) || languages[0];

  return (
    <header className="w-full h-24 flex items-center sticky top-0 z-50 transition-all duration-300 shrink-0">
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 bg-[#0B0F19]/60 backdrop-blur-xl border-b border-white/[0.08] shadow-lg"></div>
      
      <div className="relative container mx-auto px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-5 group cursor-pointer select-none transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105">
          {/* Icon Container - Glassy */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/80 to-purple-700/80 backdrop-blur-md rounded-2xl shadow-inner border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Layers className="w-6 h-6 text-white/90 absolute" />
              <Crop className="w-3.5 h-3.5 text-indigo-200 absolute translate-x-1.5 translate-y-1.5" />
            </div>
          </div>
          
          {/* Text Logo */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold tracking-tight leading-none drop-shadow-sm">
              <span className="text-white">Insta</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Crops</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-[1px] w-3 bg-indigo-500/50"></div>
              <span className="text-[10px] font-bold text-indigo-300/80 tracking-[0.25em] uppercase">{t.proStudio}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          
          {/* Custom Language Selector - Glass & Hover */}
          {isLangOpen && (
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsLangOpen(false)} />
          )}
          <div className="relative z-50">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className={`
                flex items-center gap-3 px-4 h-12 rounded-2xl border transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 group
                ${isLangOpen 
                  ? 'bg-[#1A1F2E]/90 backdrop-blur-xl border-indigo-500/50 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)]' 
                  : 'bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg text-gray-300'
                }
              `}
              aria-label="Select Language"
              aria-expanded={isLangOpen}
            >
              {hasSelectedLang ? (
                  <>
                    <span className="text-xl leading-none filter drop-shadow-sm">{currentLang.flag}</span>
                    <span className="text-sm font-semibold hidden md:block group-hover:text-white transition-colors">
                        {currentLang.label}
                    </span>
                  </>
              ) : (
                  <>
                     <Globe className="w-5 h-5 text-gray-400 group-hover:text-indigo-300 transition-colors" />
                     <span className="text-sm font-semibold hidden md:block group-hover:text-white transition-colors">
                        Language
                     </span>
                  </>
              )}
              <ChevronDown 
                className={`w-4 h-4 text-gray-500 group-hover:text-indigo-300 transition-transform duration-300 ${isLangOpen ? 'rotate-180 text-indigo-400' : ''}`} 
              />
            </button>

            {/* Dropdown Menu - Glass */}
            <div className={`
              absolute right-0 mt-3 w-56 bg-[#0f131d]/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden origin-top-right transition-all duration-300 ring-1 ring-black/50 backdrop-blur-2xl
              ${isLangOpen 
                  ? 'opacity-100 scale-100 translate-y-0 visible' 
                  : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
              }
            `}>
               <div className="py-2 max-h-[360px] overflow-y-auto custom-scrollbar">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3.5 text-sm flex items-center gap-4 transition-colors border-l-[3px]
                        ${lang === l.code && hasSelectedLang
                          ? 'bg-indigo-500/10 text-white border-indigo-500 font-bold' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent'
                        }
                      `}
                    >
                      <span className="text-xl leading-none">{l.flag}</span>
                      <span>{l.label}</span>
                      {lang === l.code && hasSelectedLang && <Check className="w-4 h-4 ml-auto text-indigo-400" />}
                    </button>
                  ))}
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
};

export default Header;
