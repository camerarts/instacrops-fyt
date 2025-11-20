
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, X, ZoomIn, Move, Smartphone, Monitor, Square, LayoutTemplate, HardDrive, Hand } from 'lucide-react';
import { CropConfig, OutputDimensions } from '../utils/imageProcessor';

interface ManualCropperProps {
  file: File;
  onConfirm: (cropConfig: CropConfig, outputDimensions: OutputDimensions, maxSizeBytes: number) => void;
  onCancel: () => void;
  t: any;
}

const RATIOS = [
  { id: '16-9', label: '16:9', width: 1920, height: 1080, icon: Monitor },
  { id: '4-3',  label: '4:3',  width: 1440, height: 1080, icon: LayoutTemplate },
  { id: '1-1',  label: '1:1',  width: 1080, height: 1080, icon: Square },
  { id: '3-4',  label: '3:4',  width: 1080, height: 1440, icon: LayoutTemplate },
  { id: '9-16', label: '9:16', width: 1080, height: 1920, icon: Smartphone },
];

const ManualCropper: React.FC<ManualCropperProps> = ({ file, onConfirm, onCancel, t }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null); // Wrapper to measure available space
  
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
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });

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

  // Observe wrapper size to calculate fit logic
  useEffect(() => {
    if (!wrapperRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWrapperSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(wrapperRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Reset view when ratio changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [selectedRatio]);

  // Calculate dynamic style for the crop container based on available space vs target ratio
  const getCropContainerStyle = () => {
    const { width: w, height: h } = wrapperSize;
    if (!w || !h) return { opacity: 0 }; // Hide until measured to avoid jump

    const wrapperAspect = w / h;
    const targetAspect = selectedRatio.width / selectedRatio.height;

    let style: React.CSSProperties = {
      aspectRatio: `${selectedRatio.width} / ${selectedRatio.height}`,
      maxWidth: '100%',
      maxHeight: '100%',
    };

    if (targetAspect > wrapperAspect) {
      // Target is wider than container (relative to aspect) -> constrained by width
      style.width = '100%';
      style.height = 'auto';
    } else {
      // Target is taller than container -> constrained by height
      style.width = 'auto';
      style.height = '100%';
    }
    return style;
  };

  // Handle drag constraints
  const updatePosition = useCallback((newX: number, newY: number, currentScale: number) => {
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
  }, [imageSize]);

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
  
  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Avoid conflicting with inputs
        if (e.target instanceof HTMLInputElement) return;

        const STEP_MOVE = e.shiftKey ? 20 : 5; 
        const STEP_ZOOM = 0.05;
        let handled = false;

        if (e.key.startsWith('Arrow')) {
            let { x, y } = position;
            if (e.key === 'ArrowLeft') x -= STEP_MOVE;
            if (e.key === 'ArrowRight') x += STEP_MOVE;
            if (e.key === 'ArrowUp') y -= STEP_MOVE;
            if (e.key === 'ArrowDown') y += STEP_MOVE;
            
            updatePosition(x, y, scale);
            handled = true;
        } else if (e.key === '+' || e.key === '=') {
            updateScale(scale + STEP_ZOOM);
            handled = true;
        } else if (e.key === '-' || e.key === '_') {
            updateScale(scale - STEP_ZOOM);
            handled = true;
        }

        if (handled) e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, scale, updatePosition]);

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
        <div className="min-h-16 py-3 border-b border-white/5 flex justify-between items-center px-6 shrink-0 bg-[#131620] z-20">
          <div className="flex flex-col">
            <h3 className="text-white font-semibold flex items-center gap-2 text-lg">
              <Move className="w-5 h-5 text-indigo-400" />
              <span className="tracking-wide">{t.mcTitle}</span>
            </h3>
          </div>

          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Body: Canvas + Right Sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Canvas Area (Left) */}
          <div 
            ref={wrapperRef}
            className="flex-1 bg-[#090b10] relative flex items-center justify-center p-4 md:p-8 overflow-hidden select-none group cursor-move"
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Pattern Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Crop Container */}
            <div 
              ref={containerRef}
              className="relative z-10"
              style={getCropContainerStyle()}
            >
              {/* Image Layer - No max-w constraint to allow overflow */}
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
                  className="absolute top-0 left-0 user-select-none max-w-none"
                />
              )}
              
              {/* Dimmed Outside Overlay: A giant ring shadow */}
              <div className="absolute inset-0 pointer-events-none z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] rounded-sm"></div>

              {/* Grid & Border Overlay */}
              <div className="absolute inset-0 z-20 pointer-events-none border-2 border-white/60">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
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

              {/* Corner Anchors */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-[3px] border-l-[3px] border-indigo-500 z-30 rounded-tl-sm pointer-events-none shadow-sm"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-[3px] border-r-[3px] border-indigo-500 z-30 rounded-tr-sm pointer-events-none shadow-sm"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-[3px] border-l-[3px] border-indigo-500 z-30 rounded-bl-sm pointer-events-none shadow-sm"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-[3px] border-r-[3px] border-indigo-500 z-30 rounded-br-sm pointer-events-none shadow-sm"></div>

            </div>
          </div>

          {/* Ratio Sidebar (Right) */}
          <div className="w-24 bg-[#131620] border-l border-white/5 flex flex-col items-center py-6 gap-3 overflow-y-auto scrollbar-hide z-10 shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{t.mcRatio}</span>
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

        {/* Bottom Footer: Hints + Sliders & Actions */}
        <div className="bg-[#131620] border-t border-white/5 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          
          {/* Unified Hint Bar */}
          <div className="w-full flex items-center justify-center py-2 bg-[#0B0F19] border-b border-white/5 select-none">
              <div className="flex items-center gap-6">
                   {/* Drag Hint */}
                   <div className="flex items-center gap-2">
                       <Hand className="w-3.5 h-3.5 text-indigo-400" />
                       <span className="text-xs text-gray-400 font-medium tracking-wide">{t.mcHint}</span>
                   </div>
                   
                   {/* Separator */}
                   <div className="w-px h-3 bg-white/10 hidden md:block"></div>

                   {/* Keyboard Tips */}
                   <div className="hidden md:flex items-center gap-4">
                     {t.mcKeyTips && t.mcKeyTips.map((tip: string, idx: number) => (
                       <span key={idx} className="flex items-center gap-1.5">
                         <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                         <span className="text-xs text-gray-400 font-mono">{tip}</span>
                       </span>
                     ))}
                   </div>
              </div>
          </div>

          <div className="p-6">
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
                        <span className="text-sm font-semibold text-gray-200 block">{t.mcZoomTitle}</span>
                        <span className="text-xs text-gray-500">{t.mcZoomDesc}</span>
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
                        <span className="text-sm font-semibold text-gray-200 block">{t.mcLimitTitle}</span>
                        <span className="text-xs text-gray-500">{t.mcLimitDesc} (Max: {originalSizeMB.toFixed(1)}MB)</span>
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
                    {t.mcCancel}
                  </button>
                  <button 
                    onClick={handleConfirm}
                    className="flex-1 lg:flex-none px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95 ring-1 ring-white/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.mcConfirm}</span>
                  </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManualCropper;
