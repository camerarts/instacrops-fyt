
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import ResultCard from './components/ResultCard';
import ManualCropper from './components/ManualCropper';
import { ProcessedImage, ProcessingStatus, processImage, CropConfig, OutputDimensions } from './utils/imageProcessor';
import { Loader2, Wand2, Crop as CropIcon, Zap, Lock, Maximize2, UploadCloud, Download, MoveRight } from 'lucide-react';
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

  const handleFileSelect = useCallback((file: File) => {
    if (mode === 'manual') {
      setTempFile(file);
      setShowManualCropper(true);
    } else {
      // Auto mode default
      processSelectedFile(file);
    }
  }, [mode]);

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
      <Header totalConverted={totalConverted} lang={lang} setLang={setLang} t={t} />

      <main className="flex-1 container mx-auto px-4 py-12 lg:py-20 flex flex-col justify-center relative z-10">
        
        {/* Background Blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {status === ProcessingStatus.SUCCESS && result ? (
          <ResultCard data={result} onReset={handleReset} t={t} />
        ) : (
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center relative">
            
            {/* Left Column: Hero Content */}
            <div className="space-y-10 relative z-20">
              {/* Hero Text */}
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm animate-fade-in">
                   <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                   <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">{t.freeService}</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] animate-fade-in-up">
                  {t.heroTitleStart} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                    {t.heroTitleEnd}
                  </span>
                </h1>
                
                <p className="text-lg text-gray-400 leading-relaxed max-w-xl animate-fade-in-up delay-100">
                  {t.heroDesc} <span className="text-gray-200 font-medium border-b border-indigo-500/30 pb-0.5">{t.heroDescHighlight1}</span> & <span className="text-gray-200 font-medium border-b border-pink-500/30 pb-0.5">{t.heroDescHighlight2}</span>.
                </p>
              </div>

              {/* Redesigned Workflow Steps (Visual Stepper) */}
              <div className="relative animate-fade-in-up delay-200">
                {/* Connecting Line Layer */}
                <div className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 z-0">
                   <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>

                <div className="relative z-10 flex items-center justify-between max-w-md">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-3 group cursor-default">
                    <div className="w-14 h-14 rounded-full bg-[#131725] border border-white/10 shadow-lg flex items-center justify-center group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/20 transition-all duration-500">
                       <UploadCloud className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">{t.step1}</span>
                  </div>

                   {/* Arrow 1 */}
                   <MoveRight className="w-5 h-5 text-gray-600" />

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-3 group cursor-default">
                     <div className="w-14 h-14 rounded-full bg-[#131725] border border-white/10 shadow-lg flex items-center justify-center group-hover:border-pink-500/50 group-hover:shadow-pink-500/20 transition-all duration-500">
                       <Wand2 className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">{t.step2}</span>
                  </div>

                  {/* Arrow 2 */}
                  <MoveRight className="w-5 h-5 text-gray-600" />

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-3 group cursor-default">
                    <div className="w-14 h-14 rounded-full bg-[#131725] border border-white/10 shadow-lg flex items-center justify-center group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/20 transition-all duration-500">
                       <Download className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">{t.step3}</span>
                  </div>
                </div>
              </div>

              {/* Feature Tags List */}
              <div className="grid gap-4 pt-6 animate-fade-in-up delay-300">
                {[
                    { icon: Maximize2, title: t.featRatio, desc: t.featRatioDesc, color: 'text-indigo-400' },
                    { icon: Zap, title: t.featCompress, desc: t.featCompressDesc, color: 'text-yellow-400' },
                    { icon: Lock, title: t.featPrivacy, desc: t.featPrivacyDesc, color: 'text-pink-400' }
                ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                        <div className={`mt-0.5 ${item.color} group-hover:scale-110 transition-transform duration-300`}><item.icon className="w-5 h-5" /></div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{item.title}</h4>
                            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mt-0.5">{item.desc}</p>
                        </div>
                    </div>
                ))}
              </div>
            </div>

             {/* OPTICAL FLOW ARROW (Desktop Only) */}
             {/* Curves from the end of text section towards the upload card */}
            <div className="hidden lg:block absolute left-[45%] top-1/2 -translate-y-1/2 w-[300px] h-[120px] pointer-events-none z-10 opacity-80">
                 <svg width="100%" height="100%" viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
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
                       {/* Arrow Marker */}
                       <marker id="arrowhead" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                         <path d="M2,2 L10,6 L2,10" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                       </marker>
                    </defs>
                    {/* The Path */}
                    <path 
                      d="M 0,80 C 100,80 120,40 280,40"
                      stroke="url(#flowGradient)" 
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      className="animate-flow"
                      strokeDasharray="120 300" 
                      filter="url(#glow)"
                      markerEnd="url(#arrowhead)"
                    />
                 </svg>
            </div>

            {/* Right Column: Interactive Card */}
            <div className="relative z-20 animate-fade-in-up delay-200">
              
              {/* Card Container */}
              <div className="bg-[#131725]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl ring-1 ring-white/5 relative group">
                
                {/* Mode Switcher Tabs */}
                <div className="absolute -top-12 left-6 flex items-center gap-1 p-1 bg-[#0B0F19]/80 backdrop-blur border border-white/10 rounded-xl">
                  <button
                    onClick={() => setMode('auto')}
                    className={`
                      px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2
                      ${mode === 'auto' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                    `}
                  >
                    <Wand2 className="w-3 h-3" />
                    {t.autoModeTitle}
                  </button>
                  <button
                    onClick={() => setMode('manual')}
                    className={`
                      px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2
                      ${mode === 'manual' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                    `}
                  >
                    <CropIcon className="w-3 h-3" />
                    {t.manualModeTitle}
                  </button>
                </div>
                
                {/* Main Upload Area */}
                <div className="bg-[#0B0F19] rounded-[20px] p-6 md:p-8 border border-white/5">
                  <UploadArea 
                    onFileSelect={handleFileSelect} 
                    isProcessing={status === ProcessingStatus.PROCESSING} 
                    t={t}
                  />

                  {/* Processing State Overlay */}
                  {status === ProcessingStatus.PROCESSING && (
                    <div className="absolute inset-0 z-50 bg-[#0B0F19]/90 backdrop-blur-sm rounded-[20px] flex flex-col items-center justify-center text-center p-8 border border-white/10">
                      <div className="relative w-20 h-20 mb-6">
                         <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                         <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2 animate-pulse">{t.processingTitle}</h3>
                      <p className="text-gray-400 text-sm">
                        {mode === 'auto' ? t.processingAuto : t.processingManual} {t.processingDesc}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Info inside Card */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)] animate-pulse"></div>
                     <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">System Online</span>
                  </div>
                  <div className="text-[10px] text-gray-600 font-mono">v2.5.0</div>
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

      <footer className="py-8 text-center text-gray-600 text-sm relative z-10">
        <p className="opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-default">
          {t.footer}
        </p>
      </footer>
    </div>
  );
};

export default App;
