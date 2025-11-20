
import React, { useRef, useState, useEffect } from 'react';
import { Check, X, ZoomIn, Move, Smartphone, Monitor, Square, LayoutTemplate, HardDrive, Minus, Plus } from 'lucide-react';
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
    // e.preventDefault(); // Sometimes prevents scrolling on mobile, use carefully
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-5xl bg-[#131725] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Move className="w-4 h-4 text-indigo-400" />
            调整裁剪区域
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content: Canvas + Controls */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left: Canvas Area */}
          <div className="flex-1 bg-[#0B0F19] relative flex items-center justify-center p-8 overflow-hidden select-none">
            {/* Pattern Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {/* Crop Container */}
            <div 
              ref={containerRef}
              className="relative bg-black border-2 border-indigo-500/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] cursor-move overflow-hidden rounded-sm touch-none transition-all duration-300 ease-in-out"
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
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-white/30 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                <div className="border-r border-b border-white/30 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                <div className="border-b border-white/30 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                <div className="border-r border-b border-white/30 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                <div className="border-r border-b border-white/30 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                <div className="border-b border-white/30 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                <div className="border-r border-white/30 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                <div className="border-r border-white/30 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                <div></div>
              </div>
            </div>
          </div>

          {/* Right/Bottom: Tools Panel */}
          <div className="lg:w-72 bg-[#1A1F2E] border-t lg:border-t-0 lg:border-l border-white/10 p-6 flex flex-col shrink-0 overflow-y-auto">
            
            <div className="space-y-6">
              {/* Aspect Ratio Selector */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block ml-1">
                  画布比例
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RATIOS.map((ratio) => {
                    const Icon = ratio.icon;
                    return (
                      <button
                        key={ratio.id}
                        onClick={() => setSelectedRatio(ratio)}
                        className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedRatio.id === ratio.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{ratio.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/5 mx-1"></div>

              {/* Enhanced Zoom Control */}
              <div className="bg-[#0B0F19]/50 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-300">
                    <ZoomIn className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium">画面缩放</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 min-w-[3.5rem] text-center">
                    {scale.toFixed(2)}x
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateScale(scale - 0.05)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0 active:scale-95"
                    aria-label="Zoom Out"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="relative flex-1 h-6 flex items-center">
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.01" 
                      value={scale}
                      onChange={(e) => updateScale(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-colors"
                    />
                  </div>
                  <button 
                    onClick={() => updateScale(scale + 0.05)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0 active:scale-95"
                    aria-label="Zoom In"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Enhanced Output Size Control */}
              <div className="bg-[#0B0F19]/50 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-300">
                    <HardDrive className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-medium">输出大小限制</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-pink-300 bg-pink-500/10 px-2 py-1 rounded border border-pink-500/20 min-w-[4rem] text-center">
                    {targetSizeMB.toFixed(1)} MB
                  </span>
                </div>

                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => updateSize(targetSizeMB - 0.1)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0 active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="relative flex-1 h-6 flex items-center group">
                    <input 
                      type="range" 
                      min="0.1" 
                      max={maxSliderValue}
                      step="0.1" 
                      value={targetSizeMB}
                      onChange={(e) => updateSize(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-colors"
                    />
                  </div>
                  <button 
                    onClick={() => updateSize(targetSizeMB + 0.1)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 font-medium px-1">
                  <span>0.1 MB</span>
                  <span>{originalSizeMB.toFixed(1)} MB (原图)</span>
                </div>
              </div>

              <div className="pt-4 mt-auto border-t border-white/10">
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleConfirm}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    确认并生成
                  </button>
                  <button 
                    onClick={onCancel}
                    className="w-full py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ManualCropper;
