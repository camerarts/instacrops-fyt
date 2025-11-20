
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
      <div className="relative bg-[#131725]/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/5">
        
        {/* Close Button */}
        <button 
          onClick={onReset}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/20 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5 backdrop-blur-sm"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col lg:flex-row">
          
          {/* Control Sidebar / Header */}
          <div className="lg:w-80 p-8 border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.02] flex flex-col justify-center">
            <div className="mb-6">
              <div className="inline-flex items-center space-x-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-sm font-medium mb-3">
                <Check className="w-4 h-4" />
                <span>{t.rcReady}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{t.rcTitle}</h3>
              <p className="text-gray-400 text-sm">{t.rcDesc}</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-500">{t.rcRes}</span>
                <span className="text-gray-200 font-mono">{data.width} x {data.height}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-500">{t.rcSize}</span>
                <span className="text-green-400 font-mono">{formatBytes(data.processedSize)}</span>
              </div>
               <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-500">{t.rcRate}</span>
                <span className="text-indigo-400 font-mono">
                  {Math.round((1 - data.processedSize / data.originalSize) * 100)}% OFF
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <a
                href={data.processedUrl}
                download={`instacrops-${data.width}x${data.height}.jpg`}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
              >
                <Download className="w-5 h-5" />
                <span>{t.rcDownload}</span>
              </a>
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors border border-white/5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.rcNext}</span>
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 p-8 bg-black/20 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              
              {/* Original */}
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-400 font-medium">
                  <FileImage className="w-4 h-4" />
                  <span>{t.rcOriginal} ({formatBytes(data.originalSize)})</span>
                </div>
                <div className="flex-1 bg-[#0B0F19] rounded-xl border border-white/10 p-2 flex items-center justify-center overflow-hidden relative group">
                  <img 
                    src={data.originalUrl} 
                    alt="Original" 
                    className="max-w-full max-h-64 md:max-h-full object-contain opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0" 
                  />
                </div>
              </div>

              {/* Result */}
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2 text-sm text-indigo-300 font-medium">
                  <LayoutTemplate className="w-4 h-4" />
                  <span>{t.rcPreview}</span>
                </div>
                <div className="flex-1 bg-black rounded-xl border-2 border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.15)] overflow-hidden relative group flex items-center justify-center">
                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-black/60 backdrop-blur text-xs text-white px-2 py-1 rounded-md border border-white/10 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-400" /> HD
                    </span>
                  </div>
                  <img 
                    src={data.processedUrl} 
                    alt="Processed" 
                    className="max-w-full max-h-full object-contain" 
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultCard;
