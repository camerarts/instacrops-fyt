
import React, { useRef, useState, useEffect } from 'react';
import { Check, X, ZoomIn, Move, Smartphone, Monitor, Square, LayoutTemplate, HardDrive } from 'lucide-react';
import { CropConfig, OutputDimensions } from '../utils/imageProcessor';

interface ManualCropperProps {
  file: File;
  onConfirm: (cropConfig: CropConfig, outputDimensions: OutputDimensions, maxSizeBytes: number) => void;
  onCancel: () => void;
}

const RATIOS = [
  { id: '16-9', label: '16:9', width: 1920, height: 1080, icon: Monitor },
  { id: '4-3',  label: '4:3',  width: 1440, height: 1080, icon: LayoutTemplate },
  { id: '1-1',  label: '1:1',  width: 1080, height: 1080, icon: Square },
  { id: '3-4',  label: '3:4',  width: 1080, height: 1440, icon: LayoutTemplate },
  { id: '9-16', label: '9:16', width: 1080, height: 1920, icon: Smartphone },
];

const ManualCropper: React.FC<ManualCropperProps> = ({ file, onConfirm, onCancel }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calc original size details
  const originalSizeMB = file.size / (1024 * 1024);
  // Ensure max slider value is at least 0.1 to prevent input errors for tiny files, but logical max is original size
  const maxSliderValue = Math.max(0.1, originalSizeMB);

  // State
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[0]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Default target size is 2MB, or original size if original is smaller than 2MB
  const [targetSizeMB, setTargetSizeMB] = useState(() => Math.min(2.0, maxSliderValue));
  
  // Initialize image
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      setImageUrl(url);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Reset view when ratio changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [selectedRatio]);

  // Handle drag constraints
  const updatePosition = (newX: number, newY: number, currentScale: number) => {
    if (!containerRef.current || imageSize.width === 0) return;
    
    const container = containerRef.current;
    const containerW = container.offsetWidth;
    const containerH = container.offsetHeight;
    
    const imgAspect = imageSize.width / imageSize.height;
    const containerAspect = containerW / containerH;
    
    let baseRenderWidth, baseRenderHeight;
    
    // "Cover" logic: at Scale 1, image covers the container fully
    if (imgAspect > containerAspect) {
       // Image is wider than container: fit height, crop width
       baseRenderHeight = containerH;
       baseRenderWidth = containerH * imgAspect;
    } else {
       // Image is taller than container: fit width, crop height
       baseRenderWidth = containerW;
       baseRenderHeight = containerW / imgAspect;
    }
    
    const currentRenderWidth = baseRenderWidth * currentScale;
    const currentRenderHeight = baseRenderHeight * currentScale;
    
    // Constraints: The image edge cannot be inside the container edge
    const minX = containerW - currentRenderWidth;
    const maxX = 0;
    const minY = containerH - currentRenderHeight;
    const maxY = 0;
    
    const clampedX = Math.min(Math.max(newX, minX), maxX);
    const clampedY = Math.min(Math.max(newY, minY), maxY);
    
    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ 
      x: clientX - position.x, 
      y: clientY - position.y 
    });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    updatePosition(newX, newY, scale);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateScale = (newScale: number) => {
    const s = Math.min(Math.max(newScale, 1), 3);
    setScale(s);
    updatePosition(position.x, position.y, s);
  };

  const updateSize = (newSize: number) => {
    // Clamp between 0.1 and original file size
    const s = Math.min(Math.max(newSize, 0.1), maxSliderValue);
    setTargetSizeMB(s);
  };

  const handleConfirm = () => {
    if (!containerRef.current || imageSize.width === 0) return;
    
    const container = containerRef.current;
    const containerW = container.offsetWidth;
    const containerH = container.offsetHeight;
    
    const imgAspect = imageSize.width / imageSize.height;
    const containerAspect = containerW / containerH;
    
    let baseRenderWidth;
    
    if (imgAspect > containerAspect) {
       baseRenderWidth = containerH * imgAspect;
    } else {
       baseRenderWidth = containerW;
    }
    
    const currentRenderWidth = baseRenderWidth * scale;
    
    // Ratio between Original Image Pixels and Rendered Pixels
    const imagePixelToRenderPixel = imageSize.width / currentRenderWidth;
    
    // Crop X/Y (on original image)
    const sx = Math.abs(position.x) * imagePixelToRenderPixel;
    const sy = Math.abs(position.y) * imagePixelToRenderPixel;
    
    // Crop Width/Height (on original image)
    const sWidth = containerW * imagePixelToRenderPixel;
    const sHeight = containerH * imagePixelToRenderPixel;
    
    onConfirm(
      { sx, sy, sWidth, sHeight },
      { width: selectedRatio.width, height: selectedRatio.height },
      targetSizeMB * 1024 * 1024 // Convert MB to Bytes
    );
  };

  // Determine style for image to "cover" container
  const imgAspect = imageSize.width / (imageSize.height || 1);
  const targetAspect = selectedRatio.width / selectedRatio.height;
  let baseImageStyle: React.CSSProperties = {};
  
  if (imgAspect > targetAspect) {
    baseImageStyle = { height: '100%', width: 'auto', maxWidth: 'none' };
  } else {
    baseImageStyle = { width: '100%', height: 'auto', maxHeight: 'none' };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-6xl bg-[#0f1219] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex justify-between items-center px-6 shrink-0 bg-[#131620] z-20">
          <h3 className="text-white font-semibold flex items-center gap-2 text-lg">
            <Move className="w-5 h-5 text-indigo-400" />
            <span className="tracking-wide">调整裁剪区域</span>
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Body: Canvas + Right Sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Canvas Area (Left) */}
          <div className="flex-1 bg-[#090b10] relative flex items-center justify-center p-4 md:p-8 overflow-hidden select-none group">
            {/* Pattern Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Crop Container */}
            <div 
              ref={containerRef}
              className="relative bg-black border-2 border-indigo-500/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] cursor-move overflow-hidden rounded-sm touch-none transition-all duration-300 ease-in-out ring-4 ring-black/20"
              style={{ 
                aspectRatio: `${selectedRatio.width} / ${selectedRatio.height}`,
                width: selectedRatio.width >= selectedRatio.height ? '100%' : 'auto',
                height: selectedRatio.height > selectedRatio.width ? '100%' : 'auto',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchEnd={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  alt="Crop Preview" 
                  draggable={false}
                  style={{
                    ...baseImageStyle,
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    pointerEvents: 'none'
                  }}
                  className="absolute top-0 left-0 user-select-none"
                />
              )}
              
              {/* Grid Overlay */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-70">
                <div className="border-r border-b border-white/30 shadow-sm"></div>
                <div className="border-r border-b border-white/30 shadow-sm"></div>
                <div className="border-b border-white/30 shadow-sm"></div>
                <div className="border-r border-b border-white/30 shadow-sm"></div>
                <div className="border-r border-b border-white/30 shadow-sm"></div>
                <div className="border-b border-white/30 shadow-sm"></div>
                <div className="border-r border-white/30 shadow-sm"></div>
                <div className="border-r border-white/30 shadow-sm"></div>
                <div></div>
              </div>
            </div>
          </div>

          {/* Ratio Sidebar (Right) */}
          <div className="w-24 bg-[#131620] border-l border-white/5 flex flex-col items-center py-6 gap-3 overflow-y-auto scrollbar-hide z-10">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">画布比例</span>
            {RATIOS.map((ratio) => {
              const Icon = ratio.icon;
              const isSelected = selectedRatio.id === ratio.id;
              return (
                <button
                  key={ratio.id}
                  onClick={() => setSelectedRatio(ratio)}
                  className={`
                    flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group/btn relative
                    ${isSelected 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400 translate-x-[-2px]' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 hover:scale-105'
                    }
                  `}
                  title={ratio.label}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-white' : 'text-gray-500 group-hover/btn:text-indigo-300'}`} />
                  <span className="text-[10px] font-bold tracking-tight">{ratio.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Footer: Sliders & Actions */}
        <div className="bg-[#131620] border-t border-white/5 p-6 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            
            {/* Sliders Group */}
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 px-2">
              
              {/* Zoom Control */}
              <div className="flex flex-col gap-4 group">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-200 block">画面缩放</span>
                      <span className="text-xs text-gray-500">调整裁剪范围</span>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {scale.toFixed(2)}x
                  </div>
                </div>
                
                <div className="relative flex items-center h-6">
                   <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.01" 
                      value={scale}
                      onChange={(e) => updateScale(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                </div>
              </div>

              {/* Output Size Control */}
              <div className="flex flex-col gap-4 group">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/20">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-200 block">输出限制</span>
                      <span className="text-xs text-gray-500">压缩至指定大小 (Max: {originalSizeMB.toFixed(1)}MB)</span>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                    {targetSizeMB.toFixed(1)} MB
                  </div>
                </div>

                <div className="relative flex items-center h-6">
                  <input 
                    type="range" 
                    min="0.1" 
                    max={maxSliderValue}
                    step="0.1" 
                    value={targetSizeMB}
                    onChange={(e) => updateSize(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Divider for desktop */}
            <div className="hidden lg:block w-px h-16 bg-white/10"></div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
                <button 
                  onClick={onCancel}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors font-medium text-sm border border-white/5 hover:border-white/10"
                >
                  取消
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-1 lg:flex-none px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95 ring-1 ring-white/20"
                >
                  <Check className="w-4 h-4" />
                  <span>确认生成</span>
                </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ManualCropper;
