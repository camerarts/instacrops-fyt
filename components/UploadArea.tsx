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
      className={`group relative w-full h-60 rounded-2xl border-2 border-dashed transition-all duration-500 ease-out cursor-pointer overflow-hidden
        ${isDragging 
          ? 'border-indigo-500/70 bg-indigo-500/10 scale-[1.01] shadow-[0_0_40px_rgba(79,70,229,0.2)]' 
          : 'border-white/10 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-white/[0.04] hover:shadow-xl'
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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
        <div className={`
          relative mb-4 p-4 rounded-xl transition-all duration-500
          ${isDragging ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-110' : 'bg-[#1A1F2E] text-gray-400 group-hover:text-indigo-400 group-hover:scale-105 group-hover:shadow-lg group-hover:bg-[#232839]'}
        `}>
          {isDragging ? (
            <UploadCloud className="w-8 h-8 animate-bounce" />
          ) : (
            <ImageIcon className="w-8 h-8" />
          )}
        </div>

        <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${isDragging ? 'text-indigo-200' : 'text-white'}`}>
          {isDragging ? t.uploadRelease : t.uploadClick}
        </h3>
        
        <p className="text-gray-400 text-xs mb-4 max-w-xs leading-relaxed">
          {t.uploadSupport}
        </p>

        <div className="flex items-center space-x-2 text-[10px] font-medium text-indigo-300/80 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          <Maximize2 className="w-3 h-3" />
          <span>{t.hdOutput}</span>
        </div>
      </div>
    </div>
  );
};

export default UploadArea;
