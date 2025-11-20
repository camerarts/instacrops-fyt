
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import ResultCard from './components/ResultCard';
import ManualCropper from './components/ManualCropper';
import { ProcessedImage, ProcessingStatus, processImage, CropConfig, OutputDimensions } from './utils/imageProcessor';
import { Loader2, Wand2, Crop as CropIcon, Zap, CheckCircle2, Infinity } from 'lucide-react';
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
  
  // 默认先从本地取一个缓存值，避免刷新页面时数字闪烁为0
  const [totalConverted, setTotalConverted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('instacrops_total_converted');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // 1. 初始化：获取云端真实数据
  useEffect(() => {
    const fetchGlobalCount = async () => {
      try {
        // 使用 counterapi.dev 免费服务
        const response = await fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}/`);
        if (response.ok) {
          const data = await response.json();
          // 如果云端数据大于本地数据，更新本地状态
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
  }, []); // 仅在组件加载时执行一次

  // --- 计数器逻辑结束 ---

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
      // Auto mode: Process immediately with default settings (16:9) and default size (2MB via default arg)
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
      // Simulate a tiny delay for better UX
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
      
      // 2. 成功处理后：向云端发送 +1 请求
      try {
        const response = await fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}/up`);
        if (response.ok) {
          const data = await response.json();
          setTotalConverted(data.count);
          localStorage.setItem('instacrops_total_converted', data.count.toString());
        } else {
          // 如果API挂了，至少本地先+1，保证用户体验
          setTotalConverted(prev => prev + 1);
        }
      } catch (err) {
        // 网络错误，本地+1
        setTotalConverted(prev => prev + 1);
      }

    } catch (error) {
      console.error("Error processing image:", error);
      setStatus(ProcessingStatus.ERROR);
      alert(t.alertError);
    } finally {
      // Cleanup manual state
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
    <div className="min-h-screen flex flex-col relative bg-[#0B0F19] text-slate-200 overflow-x-hidden selection:bg-primary/30 selection:text-white">
      
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top Left Blue/Purple Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
        {/* Bottom Right Pink/Red Glow */}
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[100px] opacity-40" />
        {/* Center Subtle Glow */}
        <div className="absolute top-[20%] left-[50%] translate-x-[-50%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          totalConverted={totalConverted} 
          lang={lang}
          setLang={setLang}
          t={t}
        />
        
        <main className="flex-1 container mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
          
          {/* Hero Text */}
          {status === ProcessingStatus.IDLE && (
            <div className="text-center mb-10 max-w-4xl animate-fade-in relative w-full flex flex-col items-center">
               <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(79,70,229,0.15)]">
                <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                <span className="text-xs font-semibold text-indigo-200 tracking-wide uppercase">Pro Image Tools</span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                {t.heroTitleStart}
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400"> {t.heroTitleEnd}</span>
              </h2>

              {/* Moved 'Forever Free' Text here with Gradient Style matching the title */}
              <h3 className="text-2xl md:text-4xl font-bold mb-8 tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                  {t.freeService}
                </span>
              </h3>
              
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto mb-12 font-light">
                {t.heroDesc}<span className="text-gray-200 font-medium">{t.heroDescHighlight1}</span> {lang === 'en-US' ? 'and' : '与'} <span className="text-gray-200 font-medium">{t.heroDescHighlight2}</span>。
              </p>

              {/* REDESIGNED Mode Switcher - Large Cards */}
              <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20 mb-8">
                
                {/* Auto Mode Button */}
                <button
                  onClick={() => setMode('auto')}
                  className={`relative group flex items-center p-5 rounded-2xl transition-all duration-300 text-left border-2 cursor-pointer overflow-hidden
                    ${mode === 'auto' 
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.3)] scale-[1.02] ring-1 ring-indigo-500/50' 
                      : 'bg-[#131725]/50 border-white/5 hover:bg-[#1A1F2E] hover:border-indigo-500/30 hover:scale-[1.01]'
                    }`}
                >
                  {/* Highlight Background Gradient (Active only) */}
                  {mode === 'auto' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent opacity-50 pointer-events-none" />
                  )}

                  {/* Highlight Indicator */}
                  {mode === 'auto' && (
                    <div className="absolute top-3 right-3 text-indigo-500">
                      <CheckCircle2 className="w-5 h-5 fill-indigo-500/20" />
                    </div>
                  )}

                  <div className={`p-3 rounded-xl mr-4 transition-colors duration-300 relative z-10 ${mode === 'auto' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'bg-white/5 text-gray-400 group-hover:text-indigo-400'}`}>
                    <Wand2 className="w-6 h-6" />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className={`font-bold text-lg mb-0.5 transition-colors ${mode === 'auto' ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                      {t.autoModeTitle}
                    </h3>
                    <p className={`text-sm font-medium ${mode === 'auto' ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {t.autoModeDesc}
                    </p>
                  </div>
                </button>

                {/* Manual Mode Button */}
                <button
                  onClick={() => setMode('manual')}
                  className={`relative group flex items-center p-5 rounded-2xl transition-all duration-300 text-left border-2 cursor-pointer overflow-hidden
                    ${mode === 'manual' 
                      ? 'bg-pink-600/20 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.3)] scale-[1.02] ring-1 ring-pink-500/50' 
                      : 'bg-[#131725]/50 border-white/5 hover:bg-[#1A1F2E] hover:border-pink-500/30 hover:scale-[1.01]'
                    }`}
                >
                   {/* Highlight Background Gradient (Active only) */}
                   {mode === 'manual' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-transparent opacity-50 pointer-events-none" />
                  )}

                   {/* Highlight Indicator */}
                   {mode === 'manual' && (
                    <div className="absolute top-3 right-3 text-pink-500">
                      <CheckCircle2 className="w-5 h-5 fill-pink-500/20" />
                    </div>
                  )}

                  <div className={`p-3 rounded-xl mr-4 transition-colors duration-300 relative z-10 ${mode === 'manual' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40' : 'bg-white/5 text-gray-400 group-hover:text-pink-400'}`}>
                    <CropIcon className="w-6 h-6" />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className={`font-bold text-lg mb-0.5 transition-colors ${mode === 'manual' ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                      {t.manualModeTitle}
                    </h3>
                    <p className={`text-sm font-medium ${mode === 'manual' ? 'text-pink-200' : 'text-gray-500'}`}>
                      {t.manualModeDesc}
                    </p>
                  </div>
                </button>
                
              </div>
            </div>
          )}

          {/* Main Action Area */}
          <div className="w-full flex flex-col items-center justify-center min-h-[320px] transition-all duration-500">
            
            {status === ProcessingStatus.IDLE && (
              <UploadArea onFileSelect={handleFileSelect} isProcessing={false} t={t} />
            )}

            {status === ProcessingStatus.PROCESSING && (
              <div className="flex flex-col items-center justify-center w-full max-w-lg p-12 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl animate-fade-in">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse"></div>
                  <Loader2 className="w-14 h-14 text-indigo-400 animate-spin relative z-10" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">{t.processingTitle}</h3>
                <p className="text-gray-400 text-center">{lang === 'en-US' ? 'Currently' : '正在'} {mode === 'manual' ? t.processingManual : t.processingAuto} {t.processingDesc}</p>
              </div>
            )}

            {status === ProcessingStatus.SUCCESS && result && (
              <ResultCard data={result} onReset={handleReset} t={t} />
            )}

          </div>

          {/* Features Footer - Only show on IDLE */}
          {status === ProcessingStatus.IDLE && (
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-center w-full max-w-5xl">
              {[
                { title: t.featRatio, desc: t.featRatioDesc },
                { title: t.featCompress, desc: t.featCompressDesc },
                { title: t.featPrivacy, desc: t.featPrivacyDesc }
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all duration-300 group">
                  <h4 className="text-gray-200 font-semibold mb-2 group-hover:text-indigo-300 transition-colors">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </main>
        
        <footer className="py-8 text-center text-gray-600 text-sm border-t border-white/[0.05] bg-[#0B0F19]/50">
          <p>&copy; {new Date().getFullYear()} {t.footer}</p>
        </footer>
      </div>

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
