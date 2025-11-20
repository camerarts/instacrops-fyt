
import React from 'react';
import { Crop, Layers, Github } from 'lucide-react';

interface HeaderProps {
  totalConverted: number;
}

const Header: React.FC<HeaderProps> = ({ totalConverted }) => {
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
              <span className="text-[10px] font-semibold text-indigo-300/80 tracking-[0.2em] uppercase">Pro Studio</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4">
          {/* Enhanced Conversion Counter Badge */}
          <div className="hidden md:flex items-center justify-center mr-2">
            <div className="flex items-baseline gap-2 px-6 py-2.5 rounded-2xl bg-[#131725]/80 border border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.15)] backdrop-blur-xl group hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(79,70,229,0.25)] transition-all duration-300">
              <span className="text-xs font-bold text-gray-400 self-center uppercase tracking-wider">已完成</span>
              <span key={totalConverted} className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400 font-mono tabular-nums leading-none tracking-tighter drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)] animate-fade-in-up">
                {totalConverted}
              </span>
              <span className="text-xs font-bold text-gray-400 self-center uppercase tracking-wider">张转换</span>
            </div>
          </div>

          <div className="hidden md:flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            <span className="text-xs font-medium text-gray-400">Online</span>
          </div>
          
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            aria-label="View on GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
