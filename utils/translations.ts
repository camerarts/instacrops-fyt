
export interface ProcessedImage {
  originalUrl: string;
  processedUrl: string;
  originalSize: number;
  processedSize: number;
  width: number;
  height: number;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface CropConfig {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
}

export interface OutputDimensions {
  width: number;
  height: number;
}

/**
 * Calculates the cropping coordinates to center the image in a 16:9 aspect ratio.
 */
const getAutoCropDimensions = (imgWidth: number, imgHeight: number): CropConfig => {
  const targetRatio = 16 / 9;
  const currentRatio = imgWidth / imgHeight;

  let renderWidth = imgWidth;
  let renderHeight = imgHeight;
  let offsetX = 0;
  let offsetY = 0;

  // If image is wider than 16:9 (e.g. 21:9 or just wide), we need to crop the sides (width)
  if (currentRatio > targetRatio) {
    renderWidth = imgHeight * targetRatio;
    renderHeight = imgHeight;
    offsetX = (imgWidth - renderWidth) / 2;
    offsetY = 0;
  } 
  // If image is taller than 16:9 (e.g. 4:3, 1:1, 9:16), we need to crop top/bottom
  else {
    renderWidth = imgWidth;
    renderHeight = imgWidth / targetRatio;
    offsetX = 0;
    offsetY = (imgHeight - renderHeight) / 2;
  }

  return { sx: offsetX, sy: offsetY, sWidth: renderWidth, sHeight: renderHeight };
};

/**
 * Processes the image: Crops, Resizes to target dimensions, and Compresses to < 2MB.
 * Default target is 1920x1080 (16:9).
 */
export const processImage = async (
  file: File, 
  cropConfig?: CropConfig,
  targetDimensions: OutputDimensions = { width: 1920, height: 1080 }
): Promise<{ blob: Blob; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = async () => {
      URL.revokeObjectURL(url);
      
      const TARGET_WIDTH = targetDimensions.width;
      const TARGET_HEIGHT = targetDimensions.height;
      const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

      const canvas = document.createElement('canvas');
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }

      // 2. Determine Crop Logic (Auto or Manual)
      let crop: CropConfig;
      
      if (cropConfig) {
        crop = cropConfig;
      } else {
        // Auto mode defaults to 16:9 behavior logic internally for now, 
        // but effectively we should strictly follow the targetDimensions ratio if we were to make auto generic.
        // For this specific app requirement: "Auto follows original function" which implies 16:9.
        // So we keep the 16:9 calculation for auto mode.
        crop = getAutoCropDimensions(img.width, img.height);
      }

      // Draw the cropped portion of the source image onto the canvas
      // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      // We use high quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      // 3. Compression Loop to ensure < 2MB
      let quality = 0.95;
      let blob: Blob | null = null;
      
      const tryCompress = async (q: number): Promise<Blob> => {
        return new Promise((res) => {
          canvas.toBlob((b) => {
            res(b as Blob);
          }, 'image/jpeg', q);
        });
      };

      // Initial attempt
      blob = await tryCompress(quality);

      // Loop to reduce quality if too large
      while (blob.size > MAX_FILE_SIZE_BYTES && quality > 0.5) {
        quality -= 0.1;
        blob = await tryCompress(quality);
      }

      resolve({ 
        blob, 
        width: TARGET_WIDTH, 
        height: TARGET_HEIGHT 
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
