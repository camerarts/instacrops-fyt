import React from 'react';
import { Download, Check, RotateCcw, FileImage, LayoutTemplate, Sparkles, X } from 'lucide-react';
import { ProcessedImage, formatBytes } from '../utils/imageProcessor';

interface ResultCardProps {
  data: ProcessedImage;
  onReset: () => void;
  t: any;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, onReset, t }) => {
  return (
    <div className="w-full max-w-6xl mx-auto mt-8 animate-fade-in-up">
      
      {/* Success Banner */}
      <div className="relative bg-[#131725]/60 backdrop-blur-2xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/5 transition-transform duration-500 hover:scale-[1.005]">
        
        {/* Close Button */}
        <button 
          onClick={onReset}
          className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-black/20 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-300 border border-white/5 backdrop-blur-md hover:scale-110 active:scale-95"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col lg:flex-row">
          
          {/* Preview Area (Left) */}
          <div className="flex-1 p-8 md:p-10 bg-black/20 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              
              {/* Original */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-400 font-medium">
                  <FileImage className="w-4 h-4" />
                  <span>{t.rcOriginal} ({formatBytes(data.originalSize)})</span>
                </div>
                <div className="flex-1 bg-[#0B0F19]/50 backdrop-blur-sm rounded-2xl border border-white/10 p-4 flex items-center justify-center overflow-hidden relative group transition-all duration-500 hover:border-white/20">
                  <img 
                    src={data.originalUrl} 
                    alt="Original" 
                    className="max-w-full max-h-64 md:max-h-full object-contain opacity-60 grayscale transition-all duration-700 ease-in-out group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105" 
                  />
                </div>
              </div>

              {/* Result */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 text-sm text-indigo-300 font-medium">
                  <LayoutTemplate className="w-4 h-4" />
                  <span>{t.rcPreview}</span>
                </div>
                <div className="flex-1 bg-black/80 rounded-2xl border-2 border-indigo-500/30 shadow-[0_0_40px_rgba(79,70,229,0.2)] overflow-hidden relative group flex items-center justify-center transition-all duration-500 hover:border-indigo-500/60 hover:shadow-[0_0_60px_rgba(79,70,229,0.3)]">
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-black/60 backdrop-blur-md text-xs font-bold text-white px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> HD
                    </span>
                  </div>
                  <img 
                    src={data.processedUrl} 
                    alt="Processed" 
                    className="max-w-full max-h-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-[1.02]" 
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Control Sidebar (Right) */}
          <div className="lg:w-96 p-8 md:p-10 border-t lg:border-t-0 lg:border-l border-white/10 bg-white/[0.02] flex flex-col justify-center relative z-10 backdrop-blur-xl">
            <div className="mb-8">
              <div className="inline-flex items-center space-x-2 text-green-400 bg-green-400/10 border border-green-400/20 px-4 py-1.5 rounded-full text-sm font-bold mb-4 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                <Check className="w-4 h-4" />
                <span>{t.rcReady}</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{t.rcTitle}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t.rcDesc}</p>
            </div>

            <div className="space-y-5 mb-10 bg-white/5 rounded-2xl p-6 border border-white/5">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                <span className="text-gray-500 font-medium">{t.rcRes}</span>
                <span className="text-gray-200 font-mono font-bold">{data.width} x {data.height}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                <span className="text-gray-500 font-medium">{t.rcSize}</span>
                <span className="text-green-400 font-mono font-bold">{formatBytes(data.processedSize)}</span>
              </div>
               <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">{t.rcRate}</span>
                <span className="text-indigo-400 font-mono font-bold">
                  {Math.round((1 - data.processedSize / data.originalSize) * 100)}% OFF
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <a
                href={data.processedUrl}
                download={`instacrops-${data.width}x${data.height}.jpg`}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-indigo-500/50"
              >
                <Download className="w-5 h-5" />
                <span>{t.rcDownload}</span>
              </a>
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-all duration-300 border border-white/10 hover:border-white/20 hover:text-white hover:scale-105 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.rcNext}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultCard;
