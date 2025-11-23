import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Maximize2 } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  t: any;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect, isProcessing, t }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const validateAndProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(t.alertType);
      return;
    }
    onFileSelect(file);
  };

  return (
    <div
      className={`group relative w-full h-80 rounded-[20px] border-2 border-dashed transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer overflow-hidden backdrop-blur-md
        ${isDragging 
          ? 'border-indigo-500/70 bg-indigo-500/10 scale-[1.03] shadow-[0_0_40px_rgba(79,70,229,0.3)]' 
          : 'border-white/10 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-white/[0.06] hover:scale-[1.02] hover:shadow-2xl'
        }
        ${isProcessing ? 'pointer-events-none opacity-50' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept="image/*"
      />
      
      {/* Animated Grid Background (Subtle) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-60"></div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
        <div className={`
          relative mb-6 p-5 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${isDragging 
              ? 'bg-indigo-500 text-white shadow-[0_10px_30px_rgba(99,102,241,0.5)] scale-110 rotate-3' 
              : 'bg-white/5 backdrop-blur-xl border border-white/10 text-gray-400 group-hover:text-indigo-400 group-hover:scale-110 group-hover:bg-white/10 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]'
          }
        `}>
          {isDragging ? (
            <UploadCloud className="w-10 h-10 animate-bounce" />
          ) : (
            <ImageIcon className="w-10 h-10" />
          )}
        </div>

        <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 drop-shadow-md ${isDragging ? 'text-indigo-200' : 'text-white'}`}>
          {isDragging ? t.uploadRelease : t.uploadClick}
        </h3>
        
        <p className="text-gray-400 text-sm mb-6 max-w-sm leading-relaxed group-hover:text-gray-300 transition-colors">
          {t.uploadSupport}
        </p>

        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300/90 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all duration-300">
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{t.hdOutput}</span>
        </div>
      </div>
    </div>
  );
};

export default UploadArea;
