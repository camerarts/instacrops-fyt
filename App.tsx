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
  
  // --- Theme State ---
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // --- Internationalization State ---
  const [lang, setLang] = useState<Language>('zh-CN');
  const [hasSelectedLang, setHasSelectedLang] = useState(false);
  
  const handleSetLang = (l: Language) => {
    setLang(l);
    setHasSelectedLang(true);
  };

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
    <div className={`min-h-screen selection:bg-indigo-500/30 flex flex-col font-sans overflow-x-hidden transition-colors duration-500 ${
      theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      <Header lang={lang} setLang={handleSetLang} t={t} hasSelectedLang={hasSelectedLang} theme={theme} setTheme={setTheme} />

      <main className="flex-1 container mx-auto px-4 py-12 lg:py-20 flex flex-col justify-center relative z-10">
        
        {/* Background Blobs - Enhanced & Themed */}
        <div className={`absolute top-20 left-10 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow transition-opacity duration-500 ${
          theme === 'dark' ? 'opacity-100' : 'opacity-60'
        }`}></div>
        <div className={`absolute bottom-20 right-10 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-slow transition-opacity duration-500 ${
          theme === 'dark' ? 'opacity-100' : 'opacity-60'
        }`} style={{animationDelay: '1.5s'}}></div>

        {status === ProcessingStatus.SUCCESS && result ? (
          <ResultCard data={result} onReset={handleReset} t={t} theme={theme} />
        ) : (
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center relative">
            
            {/* Left Column: Hero Content */}
            <div className="space-y-10 relative z-20">
              {/* Hero Text */}
              <div className="space-y-6">
                <h1 className={`text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] animate-fade-in-up drop-shadow-xl text-center lg:text-left ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {t.heroTitleStart} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    {t.heroTitleEnd}
                  </span>
                </h1>
                
                {/* New Subtitle */}
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight animate-fade-in-up delay-100 text-center lg:text-left">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                    {t.heroSubtitle}
                  </span>
                </h2>
                
                {/* Free Service Tagline - Updated Text */}
                <h3 className={`text-xl font-medium tracking-tight animate-fade-in-up delay-100 flex items-center justify-center lg:justify-start gap-3 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  <div className={`p-1.5 rounded-full border backdrop-blur-sm ${
                    theme === 'dark' 
                      ? 'bg-yellow-500/10 border-yellow-500/20' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                  </div>
                  <span className={`text-center lg:text-left ${theme === 'dark' ? 'text-indigo-100' : 'text-slate-700'}`}>
                    {t.freeService}
                  </span>
                </h3>
                
                <p className={`text-lg leading-relaxed max-w-xl animate-fade-in-up delay-100 text-center lg:text-left mx-auto lg:mx-0 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                }`}>
                  {t.heroDesc}
                </p>
              </div>

              {/* Redesigned Workflow Steps (Flex Layout) - Perfectly Aligned Arrows */}
              <div className="w-full max-w-lg pt-4 animate-fade-in-up delay-200 mx-auto">
                <div className="flex items-start justify-between">
                  
                  {/* Step 1 */}
                  <div className="w-24 flex flex-col items-center gap-3 relative z-10 shrink-0">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 ${
                      theme === 'dark' 
                        ? 'bg-[#0f172a] border-white/10 shadow-indigo-500/10' 
                        : 'bg-white border-slate-200 shadow-slate-200'
                    }`}>
                        <UploadCloud className="w-6 h-6 text-indigo-500" />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase text-center leading-tight ${
                      theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                    }`}>{t.step1}</span>
                  </div>

                  {/* Connector 1 (Centered Arrow) */}
                  <div className={`flex-1 mx-2 relative h-[2px] mt-[27px] min-w-[40px] ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}>
                      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full border ${
                        theme === 'dark' 
                          ? 'bg-[#0f172a] border-white/5' 
                          : 'bg-white border-slate-100'
                      }`}>
                          <ChevronRight className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-400'}`} /> 
                      </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="w-24 flex flex-col items-center gap-3 relative z-10 shrink-0">
                     <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 ${
                        theme === 'dark' 
                          ? 'bg-[#0f172a] border-white/10 shadow-pink-500/10' 
                          : 'bg-white border-slate-200 shadow-slate-200'
                     }`}>
                        <Layout className="w-6 h-6 text-pink-500" />
                     </div>
                     <span className={`text-[10px] font-bold tracking-wider uppercase text-center leading-tight ${
                      theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                    }`}>{t.step2}</span>
                  </div>

                  {/* Connector 2 (Centered Arrow) */}
                  <div className={`flex-1 mx-2 relative h-[2px] mt-[27px] min-w-[40px] ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}>
                      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full border ${
                        theme === 'dark' 
                          ? 'bg-[#0f172a] border-white/5' 
                          : 'bg-white border-slate-100'
                      }`}>
                        <ChevronRight className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-400'}`} />
                      </div>
                  </div>

                  {/* Step 3 */}
                  <div className="w-24 flex flex-col items-center gap-3 relative z-10 shrink-0">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 ${
                      theme === 'dark' 
                        ? 'bg-[#0f172a] border-white/10 shadow-indigo-500/10' 
                        : 'bg-white border-slate-200 shadow-slate-200'
                    }`}>
                        <Download className="w-6 h-6 text-indigo-500" />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase text-center leading-tight ${
                      theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                    }`}>{t.step3}</span>
                  </div>

                </div>
              </div>

              {/* Main CTA Button - Liquid Glass & Inertia */}
              <div className="pt-8 animate-fade-in-up delay-200 flex justify-center lg:justify-start">
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
              <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4 pt-2 animate-fade-in-up delay-300">
                {[
                    { icon: Maximize2, title: t.featRatio, desc: t.featRatioDesc, color: 'text-indigo-500' },
                    { icon: Zap, title: t.featCompress, desc: t.featCompressDesc, color: 'text-yellow-500' },
                    { icon: Lock, title: t.featPrivacy, desc: t.featPrivacyDesc, color: 'text-pink-500' }
                ].map((item, i) => (
                    <div key={i} className={`flex flex-col items-center md:items-start gap-1 md:gap-2 group p-2 md:p-4 rounded-xl transition-all duration-300 hover:scale-105 border border-transparent text-center md:text-left ${
                      theme === 'dark' 
                        ? 'hover:bg-white/5 hover:border-white/5' 
                        : 'hover:bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}>
                        <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2">
                            <div className={`${item.color} group-hover:scale-110 transition-transform duration-300 p-1.5 md:p-2 rounded-lg ${
                              theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'
                            }`}>
                                <item.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </div>
                            <h4 className={`text-[10px] md:text-sm font-bold transition-colors leading-tight ${
                              theme === 'dark' ? 'text-gray-200 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'
                            }`}>{item.title}</h4>
                        </div>
                        <p className={`text-[9px] md:text-xs leading-tight md:leading-relaxed opacity-80 group-hover:opacity-100 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-slate-500'
                        }`}>{item.desc}</p>
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
              
              {/* Mode Switcher Tabs - Adjusted Size (Reduced 50% on mobile) */}
              <div className="flex gap-2 md:gap-4 mb-4 md:mb-6">
                  <button
                    onClick={() => setMode('auto')}
                    className={`
                      flex-1 py-2 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-xl font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-row items-center justify-center gap-2 md:gap-3 relative overflow-hidden group border
                      ${mode === 'auto' 
                        ? (theme === 'dark' ? 'bg-indigo-600/40 backdrop-blur-2xl text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] border-indigo-500/50' : 'bg-white text-indigo-600 shadow-lg border-indigo-100') + ' scale-[1.02] z-10' 
                        : (theme === 'dark' ? 'bg-white/5 backdrop-blur-xl text-gray-500 border-white/5 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-white hover:text-slate-600') + ' hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl'
                      }
                    `}
                  >
                    <div className={`p-1 md:p-1.5 rounded-lg transition-all duration-500 ${mode === 'auto' ? 'bg-indigo-500 text-white' : (theme === 'dark' ? 'bg-white/5 text-gray-500 group-hover:text-white' : 'bg-slate-200 text-slate-400 group-hover:text-slate-600')}`}>
                      <Wand2 className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <span>{t.autoModeTitle}</span>
                  </button>
                  
                  <button
                    onClick={() => setMode('manual')}
                    className={`
                      flex-1 py-2 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-xl font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-row items-center justify-center gap-2 md:gap-3 relative overflow-hidden group border
                      ${mode === 'manual' 
                        ? (theme === 'dark' ? 'bg-pink-600/40 backdrop-blur-2xl text-white shadow-[0_10px_30px_-10px_rgba(236,72,153,0.5)] border-pink-500/50' : 'bg-white text-pink-600 shadow-lg border-pink-100') + ' scale-[1.02] z-10' 
                        : (theme === 'dark' ? 'bg-white/5 backdrop-blur-xl text-gray-500 border-white/5 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-white hover:text-slate-600') + ' hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl'
                      }
                    `}
                  >
                    <div className={`p-1 md:p-1.5 rounded-lg transition-all duration-500 ${mode === 'manual' ? 'bg-pink-500 text-white' : (theme === 'dark' ? 'bg-white/5 text-gray-500 group-hover:text-white' : 'bg-slate-200 text-slate-400 group-hover:text-slate-600')}`}>
                      <CropIcon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <span>{t.manualModeTitle}</span>
                  </button>
              </div>

              {/* Card Container - Liquid Glass */}
              <div className={`backdrop-blur-2xl border rounded-[32px] p-2 shadow-2xl ring-1 relative group transition-transform duration-700 ease-out hover:scale-[1.01] ${
                theme === 'dark' 
                  ? 'bg-white/5 border-white/10 ring-white/5' 
                  : 'bg-white/60 border-slate-200 ring-slate-900/5 shadow-slate-200/50'
              }`}>
                
                {/* Main Upload Area & Toggles */}
                <div className={`backdrop-blur-md rounded-[24px] p-6 md:p-8 border shadow-inner relative overflow-hidden ${
                  theme === 'dark'
                    ? 'bg-[#0B0F19]/50 border-white/5'
                    : 'bg-slate-50/80 border-slate-100'
                }`}>

                  <UploadArea 
                    onFileSelect={handleFileSelect} 
                    isProcessing={status === ProcessingStatus.PROCESSING} 
                    t={t}
                    theme={theme}
                  />

                  {/* Processing State Overlay */}
                  {status === ProcessingStatus.PROCESSING && (
                    <div className={`absolute inset-0 z-50 backdrop-blur-md rounded-[32px] flex flex-col items-center justify-center text-center p-8 border ${
                      theme === 'dark' 
                        ? 'bg-[#0B0F19]/80 border-white/10' 
                        : 'bg-white/90 border-slate-100'
                    }`}>
                      <div className="relative w-24 h-24 mb-8">
                         <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                         <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-indigo-500 animate-pulse" />
                      </div>
                      <h3 className={`text-3xl font-bold mb-3 animate-pulse ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.processingTitle}</h3>
                      <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-slate-500'}`}>
                        {mode === 'auto' ? t.processingAuto : t.processingManual} {t.processingDesc}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Info inside Card */}
                <div className={`px-8 py-5 flex items-center justify-between border-t ${
                  theme === 'dark' ? 'border-white/5' : 'border-slate-200/60'
                }`}>
                  <div className="flex items-center space-x-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)] animate-pulse"></div>
                     <span className={`text-xs font-mono uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-slate-400'}`}>System Online</span>
                  </div>
                  <div className={`text-xs font-mono tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>v2.5.0 PRO</div>
                </div>

              </div>

              {/* Counter - Inline & Colorful */}
              <div className="mt-8 flex flex-row items-baseline justify-center gap-3 animate-fade-in">
                 <span className={`text-xl md:text-2xl font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>{t.completed}</span>
                 <span key={totalConverted} className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] px-1">
                    {totalConverted}
                 </span>
                 <span className={`text-xl md:text-2xl font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>{t.converted}</span>
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
             theme={theme}
           />
        )}

      </main>

      <footer className={`py-10 text-center text-sm relative z-10 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>
        <p className="opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-default">
          {t.footer}
        </p>
      </footer>
    </div>
  );
};

export default App;
