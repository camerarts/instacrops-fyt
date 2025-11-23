import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import ResultCard from './components/ResultCard';
import ManualCropper from './components/ManualCropper';
import { ProcessedImage, ProcessingStatus, processImage, CropConfig, OutputDimensions } from './utils/imageProcessor';
import { Loader2, Wand2, Crop as CropIcon, Zap, Lock, Maximize2, UploadCloud, Download, ChevronRight, Layout } from 'lucide-react';
import { translations, Language } from './utils/translations';

type ProcessMode = 'auto' | 'manual';

// Unique namespace for this specific project instance
const COUNTER_NAMESPACE = 'instacrops-project-fyt';
const COUNTER_KEY = 'conversions';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  
  // --- Internationalization State ---
  const [lang, setLang] = useState<Language>('zh-CN');
  const t = translations[lang];

  // Update document title when language changes
  useEffect(() => {
    document.title = t.title;
  }, [lang, t.title]);

  // --- 真实云端计数器逻辑 ---
  
  const [totalConverted, setTotalConverted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('instacrops_total_converted');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  useEffect(() => {
    const fetchGlobalCount = async () => {
      try {
        const response = await fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}/`);
        if (response.ok) {
          const data = await response.json();
          if (data.count > totalConverted) {
            setTotalConverted(data.count);
            localStorage.setItem('instacrops_total_converted', data.count.toString());
          }
        }
      } catch (error) {
        console.warn("Failed to fetch global stats, using local cache:", error);
      }
    };

    fetchGlobalCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mode State
  const [mode, setMode] = useState<ProcessMode>('auto');
  
  // Manual Crop State
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [showManualCropper, setShowManualCropper] = useState(false);

  const heroInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (mode === 'manual') {
      setTempFile(file);
      setShowManualCropper(true);
    } else {
      // Auto mode default
      processSelectedFile(file);
    }
  }, [mode]);

  const handleHeroFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Force manual mode for Hero CTA button
      setMode('manual');
      setTempFile(e.target.files[0]);
      setShowManualCropper(true);
      
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleManualConfirm = async (crop: CropConfig, dim: OutputDimensions, maxBytes: number) => {
    setShowManualCropper(false);
    if (tempFile) {
        await processSelectedFile(tempFile, crop, dim, maxBytes);
        setTempFile(null);
    }
  };

  const handleManualCancel = () => {
    setShowManualCropper(false);
    setTempFile(null);
  }

  const processSelectedFile = async (
      file: File, 
      crop?: CropConfig, 
      dim?: OutputDimensions, 
      maxBytes?: number
  ) => {
    setStatus(ProcessingStatus.PROCESSING);
    
    // Determine effective dimensions (auto default to 1920x1080)
    // If dim is passed (from manual), use it. If not, use defaults.
    const targetDim = dim || { width: 1920, height: 1080 };

    try {
      // Artificial delay for UX so the loader is visible for a moment
      await new Promise(r => setTimeout(r, 800));
      
      const res = await processImage(file, crop, targetDim, maxBytes);
      
      const processedUrl = URL.createObjectURL(res.blob);
      const originalUrl = URL.createObjectURL(file);
      
      setResult({
        originalUrl,
        processedUrl,
        originalSize: file.size,
        processedSize: res.blob.size,
        width: res.width,
        height: res.height
      });
      
      setStatus(ProcessingStatus.SUCCESS);
      
      // Optimistic update
      const newCount = totalConverted + 1;
      setTotalConverted(newCount);
      localStorage.setItem('instacrops_total_converted', newCount.toString());
      
      // Fire and forget API update
      fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}/up`)
        .catch(e => console.error(e));

    } catch (e) {
      console.error(e);
      setStatus(ProcessingStatus.ERROR);
      alert(t.alertError);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStatus(ProcessingStatus.IDLE);
    setTempFile(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-indigo-500/30 flex flex-col font-sans overflow-x-hidden">
      <Header lang={lang} setLang={setLang} t={t} />

      <main className="flex-1 container mx-auto px-4 py-12 lg:py-20 flex flex-col justify-center relative z-10">
        
        {/* Background Blobs - Enhanced */}
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>

        {status === ProcessingStatus.SUCCESS && result ? (
          <ResultCard data={result} onReset={handleReset} t={t} />
        ) : (
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center relative">
            
            {/* Left Column: Hero Content */}
            <div className="space-y-10 relative z-20">
              {/* Hero Text */}
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] animate-fade-in-up drop-shadow-xl">
                  {t.heroTitleStart} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    {t.heroTitleEnd}
                  </span>
                </h1>
                
                {/* New Subtitle */}
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight animate-fade-in-up delay-100">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
                    {t.heroSubtitle}
                  </span>
                </h2>
                
                {/* Free Service Tagline - Updated Text */}
                <h3 className="text-xl font-medium text-gray-300 tracking-tight animate-fade-in-up delay-100 flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                  </div>
                  <span className="text-indigo-100">
                    {t.freeService}
                  </span>
                </h3>
                
                <p className="text-lg text-gray-400 leading-relaxed max-w-xl animate-fade-in-up delay-100">
                  {t.heroDesc}
                </p>
              </div>

              {/* Redesigned Workflow Steps (Flex Layout) - Perfectly Aligned Arrows */}
              <div className="w-full max-w-md pt-4 animate-fade-in-up delay-200">
                <div className="flex items-start justify-between">
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-3 relative z-10 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center justify-center shadow-lg shadow-indigo-500/10 transition-transform duration-300 hover:scale-105">
                        <UploadCloud className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase text-center max-w-[80px] leading-tight">{t.step1}</span>
                  </div>

                  {/* Connector 1 (Centered Arrow) */}
                  <div className="flex-1 mx-2 relative h-[2px] bg-white/10 top-7 -translate-y-1/2 min-w-[30px]">
                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f172a] p-1 rounded-full border border-white/5">
                         <ChevronRight className="w-5 h-5 text-gray-400" /> 
                     </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-3 relative z-10 shrink-0">
                     <div className="w-14 h-14 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center justify-center shadow-lg shadow-pink-500/10 transition-transform duration-300 hover:scale-105">
                        <Layout className="w-6 h-6 text-pink-400" />
                     </div>
                     <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase text-center max-w-[80px] leading-tight">{t.step2}</span>
                  </div>

                  {/* Connector 2 (Centered Arrow) */}
                  <div className="flex-1 mx-2 relative h-[2px] bg-white/10 top-7 -translate-y-1/2 min-w-[30px]">
                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f172a] p-1 rounded-full border border-white/5">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                     </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-3 relative z-10 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center justify-center shadow-lg shadow-indigo-500/10 transition-transform duration-300 hover:scale-105">
                        <Download className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase text-center max-w-[80px] leading-tight">{t.step3}</span>
                  </div>

                </div>
              </div>

              {/* Main CTA Button - Liquid Glass & Inertia */}
              <div className="pt-8 animate-fade-in-up delay-200">
                  <button 
                      onClick={() => heroInputRef.current?.click()}
                      className="group relative flex items-center gap-6 px-10 py-5 bg-gradient-to-r from-indigo-600/80 to-pink-600/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(79,70,229,0.3)] hover:scale-105 hover:shadow-[0_15px_40px_rgba(79,70,229,0.5)] active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden"
                  >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <div className="flex flex-col items-start text-left relative z-10">
                           <span className="text-2xl font-bold text-white drop-shadow-md">{t.ctaMain}</span>
                           <span className="text-sm text-indigo-100/90 font-medium">{t.ctaSub}</span>
                      </div>
                      <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors border border-white/20 backdrop-blur-sm relative z-10">
                           <UploadCloud className="w-7 h-7 text-white" />
                      </div>
                  </button>
                  <input 
                      type="file" 
                      ref={heroInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleHeroFileInput}
                  />
              </div>

              {/* Feature Tags List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 animate-fade-in-up delay-300">
                {[
                    { icon: Maximize2, title: t.featRatio, desc: t.featRatioDesc, color: 'text-indigo-400' },
                    { icon: Zap, title: t.featCompress, desc: t.featCompressDesc, color: 'text-yellow-400' },
                    { icon: Lock, title: t.featPrivacy, desc: t.featPrivacyDesc, color: 'text-pink-400' }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-2 group p-4 rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-105 border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-2">
                            <div className={`${item.color} group-hover:scale-110 transition-transform duration-300 bg-white/5 p-2 rounded-lg`}>
                                <item.icon className="w-4 h-4" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{item.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed opacity-80 group-hover:opacity-100">{item.desc}</p>
                    </div>
                ))}
              </div>
            </div>

             {/* OPTICAL FLOW ARROW (Desktop Only) */}
            <div className="hidden lg:block absolute left-[45%] top-1/2 -translate-y-1/2 w-[300px] h-[240px] pointer-events-none z-10 opacity-80">
                 <svg width="100%" height="100%" viewBox="0 0 300 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                    <defs>
                      <linearGradient id="flowGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                        <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                      </linearGradient>
                       <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                       </filter>
                       <marker id="arrowhead" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                         <path d="M2,2 L10,6 L2,10" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                       </marker>
                    </defs>
                    <path 
                      d="M 0,120 C 100,120 150,40 280,40"
                      stroke="url(#flowGradient)" strokeWidth="3" strokeLinecap="round" fill="none" className="animate-flow" strokeDasharray="120 300" filter="url(#glow)" markerEnd="url(#arrowhead)"
                    />
                    <path 
                      d="M 0,120 C 120,120 180,120 280,120"
                      stroke="url(#flowGradient)" strokeWidth="3" strokeLinecap="round" fill="none" className="animate-flow" style={{animationDelay: '0.5s'}} strokeDasharray="120 300" filter="url(#glow)" markerEnd="url(#arrowhead)"
                    />
                    <path 
                      d="M 0,120 C 100,120 150,200 280,200"
                      stroke="url(#flowGradient)" strokeWidth="3" strokeLinecap="round" fill="none" className="animate-flow" style={{animationDelay: '1s'}} strokeDasharray="120 300" filter="url(#glow)" markerEnd="url(#arrowhead)"
                    />
                 </svg>
            </div>

            {/* Right Column: Interactive Card */}
            <div className="relative z-20 animate-fade-in-up delay-200">
              
              {/* Mode Switcher Tabs - Adjusted Size */}
              <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setMode('auto')}
                    className={`
                      flex-1 py-4 rounded-2xl text-xl font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-row items-center justify-center gap-3 relative overflow-hidden group border
                      ${mode === 'auto' 
                        ? 'bg-indigo-600/40 backdrop-blur-2xl text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] border-indigo-500/50 scale-[1.02] z-10' 
                        : 'bg-white/5 backdrop-blur-xl text-gray-500 border-white/5 hover:bg-white/10 hover:text-white hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl'
                      }
                    `}
                  >
                    <div className={`p-1.5 rounded-lg transition-all duration-500 ${mode === 'auto' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
                      <Wand2 className="w-5 h-5" />
                    </div>
                    <span>{t.autoModeTitle}</span>
                  </button>
                  
                  <button
                    onClick={() => setMode('manual')}
                    className={`
                      flex-1 py-4 rounded-2xl text-xl font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-row items-center justify-center gap-3 relative overflow-hidden group border
                      ${mode === 'manual' 
                        ? 'bg-pink-600/40 backdrop-blur-2xl text-white shadow-[0_10px_30px_-10px_rgba(236,72,153,0.5)] border-pink-500/50 scale-[1.02] z-10' 
                        : 'bg-white/5 backdrop-blur-xl text-gray-500 border-white/5 hover:bg-white/10 hover:text-white hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl'
                      }
                    `}
                  >
                    <div className={`p-1.5 rounded-lg transition-all duration-500 ${mode === 'manual' ? 'bg-pink-500 text-white' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
                      <CropIcon className="w-5 h-5" />
                    </div>
                    <span>{t.manualModeTitle}</span>
                  </button>
              </div>

              {/* Card Container - Liquid Glass */}
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 shadow-2xl ring-1 ring-white/5 relative group transition-transform duration-700 ease-out hover:scale-[1.01]">
                
                {/* Main Upload Area & Toggles */}
                <div className="bg-[#0B0F19]/50 backdrop-blur-md rounded-[24px] p-6 md:p-8 border border-white/5 shadow-inner">

                  <UploadArea 
                    onFileSelect={handleFileSelect} 
                    isProcessing={status === ProcessingStatus.PROCESSING} 
                    t={t}
                  />

                  {/* Counter Moved Here */}
                  <div className="mt-5 flex items-center justify-center group/counter">
                    <div className="flex items-center gap-3 px-5 h-12 rounded-xl bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(79,70,229,0.05)] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 hover:bg-white/10 hover:border-indigo-500/30 hover:shadow-[0_0_25px_rgba(79,70,229,0.15)]">
                        <span className="text-[10px] font-bold text-gray-500 tracking-wide uppercase">{t.completed}</span>
                        <span key={totalConverted} className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400 font-mono tabular-nums leading-none tracking-tighter drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)] animate-fade-in-up">
                        {totalConverted}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 tracking-wide uppercase">{t.converted}</span>
                    </div>
                  </div>

                  {/* Processing State Overlay */}
                  {status === ProcessingStatus.PROCESSING && (
                    <div className="absolute inset-0 z-50 bg-[#0B0F19]/80 backdrop-blur-md rounded-[32px] flex flex-col items-center justify-center text-center p-8 border border-white/10">
                      <div className="relative w-24 h-24 mb-8">
                         <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                         <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-indigo-400 animate-pulse" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-3 animate-pulse">{t.processingTitle}</h3>
                      <p className="text-gray-300 text-lg">
                        {mode === 'auto' ? t.processingAuto : t.processingManual} {t.processingDesc}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Info inside Card */}
                <div className="px-8 py-5 flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center space-x-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)] animate-pulse"></div>
                     <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">System Online</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono tracking-wider">v2.5.0 PRO</div>
                </div>

              </div>
            </div>

          </div>
        )}
        
        {/* Manual Cropper Modal */}
        {showManualCropper && tempFile && (
           <ManualCropper 
             file={tempFile} 
             onConfirm={handleManualConfirm} 
             onCancel={handleManualCancel} 
             t={t}
           />
        )}

      </main>

      <footer className="py-10 text-center text-gray-500 text-sm relative z-10">
        <p className="opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-default">
          {t.footer}
        </p>
      </footer>
    </div>
  );
};

export default App;
