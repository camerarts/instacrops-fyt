import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import ResultCard from './components/ResultCard';
import ManualCropper from './components/ManualCropper';
import { ProcessedImage, ProcessingStatus, processImage, CropConfig, OutputDimensions } from './utils/imageProcessor';
import { Loader2, Wand2, Crop as CropIcon, Zap, Lock, Maximize2, ArrowRight, MoveRight } from 'lucide-react';
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
  const [showCropper, setShowCropper] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    if (mode === 'manual') {
      setTempFile(file);
      setShowCropper(true);
    } else {
      processFile(file);
    }
  }, [mode]);

  const processFile = async (
    file: File, 
    cropConfig?: CropConfig, 
    outputDim?: OutputDimensions,
    maxSizeBytes?: number
  ) => {
    setStatus(ProcessingStatus.PROCESSING);
    try {
      if (!cropConfig) await new Promise(resolve => setTimeout(resolve, 800));

      const { blob, width, height } = await processImage(file, cropConfig, outputDim, maxSizeBytes);
      
      const processedUrl = URL.createObjectURL(blob);
      const originalUrl = URL.createObjectURL(file);

      setResult({
        originalUrl,
        processedUrl,
        originalSize: file.size,
        processedSize: blob.size,
        width,
        height
      });
      
      setStatus(ProcessingStatus.SUCCESS);
      
      try {
        const response = await fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}/up`);
        if (response.ok) {
          const data = await response.json();
          setTotalConverted(data.count);
          localStorage.setItem('instacrops_total_converted', data.count.toString());
        } else {
          setTotalConverted(prev => prev + 1);
        }
      } catch (err) {
        setTotalConverted(prev => prev + 1);
      }

    } catch (error) {
      console.error("Error processing image:", error);
      setStatus(ProcessingStatus.ERROR);
      alert(t.alertError);
    } finally {
      setTempFile(null);
      setShowCropper(false);
    }
  };

  const handleManualCropConfirm = (cropConfig: CropConfig, outputDim: OutputDimensions, maxSizeBytes: number) => {
    if (tempFile) {
      processFile(tempFile, cropConfig, outputDim, maxSizeBytes);
    }
  };

  const handleManualCropCancel = () => {
    setTempFile(null);
    setShowCropper(false);
  };

  const handleReset = useCallback(() => {
    if (result) {
      URL.revokeObjectURL(result.originalUrl);
      URL.revokeObjectURL(result.processedUrl);
    }
    setResult(null);
    setStatus(ProcessingStatus.IDLE);
  }, [result]);

  return (
    <div className="h-screen w-full flex flex-col relative bg-[#0B0F19] text-slate-200 overflow-hidden selection:bg-primary/30 selection:text-white font-sans">
      
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[100px] opacity-40" />
        <div className="absolute top-[20%] left-[50%] translate-x-[-50%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Header (Fixed) */}
      <Header 
        totalConverted={totalConverted} 
        lang={lang}
        setLang={setLang}
        t={t}
      />

      {/* Main Content (Flex/Grid for Compact Fit) */}
      <main className="flex-1 w-full relative z-10 flex flex-col items-center justify-center px-4 lg:px-8 overflow-y-auto lg:overflow-hidden">
        
        <div className={`w-full transition-all duration-500 ease-in-out ${status === ProcessingStatus.SUCCESS ? 'max-w-6xl' : 'max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center'}`}>
          
          {/* LEFT COLUMN: Text & Info (Hidden in Success state to focus on result) */}
          {status !== ProcessingStatus.SUCCESS && (
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5 animate-fade-in-up relative">
               
               {/* Visual Arrow Cue (Desktop Only) */}
               <div className="hidden lg:flex absolute -right-12 top-1/2 -translate-y-1/2 z-20 text-indigo-500/30 animate-bounce-x">
                  <MoveRight className="w-12 h-12" />
               </div>

               {/* Minimalist Workflow Indicator */}
               <div className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs font-semibold text-indigo-300/90 uppercase tracking-wider bg-indigo-900/20 px-4 py-2 rounded-full border border-indigo-500/20 mb-2">
                 <span>{t.step1}</span>
                 <ArrowRight className="w-3 h-3 text-indigo-500" />
                 <span>{t.step2}</span>
                 <ArrowRight className="w-3 h-3 text-indigo-500" />
                 <span>{t.step3}</span>
               </div>

               {/* Main Title */}
               <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
                  {t.heroTitleStart} <br className="hidden lg:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400">{t.heroTitleEnd}</span>
               </h2>

               {/* Subtitle Gradient */}
               <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                    {t.freeService}
                  </span>
               </h3>

               {/* Description */}
               <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-xl lg:max-w-2xl font-light">
                  {t.heroDesc} <span className="text-gray-200 font-medium">{t.heroDescHighlight1}</span> {lang === 'en-US' ? 'and' : '与'} <span className="text-gray-200 font-medium">{t.heroDescHighlight2}</span>。
               </p>

               {/* Detailed Features List (Grid Layout) */}
               <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 pt-4 opacity-90">
                  {/* Feature 1 */}
                  <div className="flex flex-col items-start bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:bg-white/[0.05] transition-colors text-left">
                      <div className="flex items-center gap-2 text-sm font-bold text-indigo-200 mb-1.5">
                        <Maximize2 className="w-4 h-4 text-indigo-400" />
                        <span>{t.featRatio}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{t.featRatioDesc}</p>
                  </div>
                  
                  {/* Feature 2 */}
                  <div className="flex flex-col items-start bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:bg-white/[0.05] transition-colors text-left">
                      <div className="flex items-center gap-2 text-sm font-bold text-indigo-200 mb-1.5">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span>{t.featCompress}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{t.featCompressDesc}</p>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex flex-col items-start bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:bg-white/[0.05] transition-colors text-left">
                      <div className="flex items-center gap-2 text-sm font-bold text-indigo-200 mb-1.5">
                        <Lock className="w-4 h-4 text-pink-400" />
                        <span>{t.featPrivacy}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{t.featPrivacyDesc}</p>
                  </div>
               </div>

               {/* Desktop Footer Copyright */}
               <div className="text-xs text-gray-600 pt-2 hidden lg:block">
                  &copy; {new Date().getFullYear()} {t.footer}
               </div>
            </div>
          )}

          {/* RIGHT COLUMN: Tool Area */}
          <div className={`${status === ProcessingStatus.SUCCESS ? 'w-full' : 'lg:col-span-5 w-full max-w-md lg:max-w-full mx-auto'} animate-fade-in`}>
            
            {status === ProcessingStatus.SUCCESS && result ? (
               <ResultCard data={result} onReset={handleReset} t={t} />
            ) : (
              <div className="bg-[#131725]/60 backdrop-blur-xl border border-white/10 p-5 rounded-[2rem] shadow-2xl ring-1 ring-white/5 relative overflow-hidden">
                  
                  {/* Compact Mode Switcher */}
                  <div className="flex p-1 bg-black/40 rounded-xl mb-5 relative border border-white/5">
                      <button
                        onClick={() => setMode('auto')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${mode === 'auto' ? 'bg-[#1A1F2E] text-white shadow-lg ring-1 ring-indigo-500/50' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                      >
                        <Wand2 className={`w-4 h-4 ${mode === 'auto' ? 'text-indigo-400' : ''}`} />
                        <span>{t.autoModeTitle}</span>
                      </button>
                      <button
                        onClick={() => setMode('manual')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${mode === 'manual' ? 'bg-[#1A1F2E] text-white shadow-lg ring-1 ring-pink-500/50' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                      >
                        <CropIcon className={`w-4 h-4 ${mode === 'manual' ? 'text-pink-400' : ''}`} />
                        <span>{t.manualModeTitle}</span>
                      </button>
                  </div>

                  {/* Info Text based on mode */}
                  <div className="mb-4 px-2 flex items-center gap-2">
                       <div className={`w-1 h-1 rounded-full ${mode === 'auto' ? 'bg-indigo-500' : 'bg-pink-500'}`}></div>
                       <p className="text-xs text-gray-400 font-medium tracking-wide uppercase opacity-80">
                         {mode === 'auto' ? t.autoModeDesc : t.manualModeDesc}
                       </p>
                  </div>

                  {/* Upload Area */}
                  <div className="relative">
                      {status === ProcessingStatus.PROCESSING ? (
                         <div className="h-60 flex flex-col items-center justify-center border-2 border-white/10 border-dashed rounded-2xl bg-white/5 animate-pulse">
                            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                            <span className="text-sm text-gray-300 font-medium">{t.processingTitle}</span>
                            <span className="text-xs text-gray-500 mt-1">{mode === 'manual' ? t.processingManual : t.processingAuto}</span>
                         </div>
                      ) : (
                         <UploadArea onFileSelect={handleFileSelect} isProcessing={false} t={t} />
                      )}
                  </div>
              </div>
            )}
          </div>

        </div>
        
        {/* Mobile Footer */}
        {status !== ProcessingStatus.SUCCESS && (
          <div className="text-[10px] text-gray-600 py-6 lg:hidden text-center">
            &copy; {new Date().getFullYear()} {t.footer}
          </div>
        )}

      </main>

      {/* Manual Cropper Overlay */}
      {showCropper && tempFile && (
        <ManualCropper 
          file={tempFile} 
          onConfirm={handleManualCropConfirm} 
          onCancel={handleManualCropCancel} 
          t={t}
        />
      )}
    </div>
  );
};

export default App;
