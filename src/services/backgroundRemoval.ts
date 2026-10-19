/**
 * Background Removal Service using @imgly/background-removal
 * 100% Client-Side in Browser via WebAssembly / ONNX Runtime
 */
import { removeBackground } from '@imgly/background-removal';

export interface BgRemovalProgress {
  key: string;
  current: number;
  total: number;
  percent: number;
}

export interface BgRemovalResult {
  dataUrl: string;
  trimmedWidth: number;
  trimmedHeight: number;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Automatically trims transparent pixel borders from a PNG image using an offscreen canvas.
 * Returns the cropped data URL and the new pixel bounds.
 */
export async function trimTransparentImage(
  pngDataUrl: string
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: pngDataUrl, width: img.naturalWidth, height: img.naturalHeight });
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;
        let hasVisiblePixel = false;

        // Scan pixels for non-transparent alpha (> 10)
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alphaIndex = (y * canvas.width + x) * 4 + 3;
            const alpha = data[alphaIndex];
            if (alpha > 10) {
              hasVisiblePixel = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (!hasVisiblePixel || minX > maxX || minY > maxY) {
          // If completely empty or scanning failed, return as-is
          resolve({ dataUrl: pngDataUrl, width: img.naturalWidth, height: img.naturalHeight });
          return;
        }

        // Add 2px breathing room padding if within canvas bounds
        const pad = 2;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = Math.min(canvas.width - cropX, maxX - minX + 1 + pad * 2);
        const cropH = Math.min(canvas.height - cropY, maxY - minY + 1 + pad * 2);

        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = cropW;
        trimmedCanvas.height = cropH;
        const trimmedCtx = trimmedCanvas.getContext('2d');
        if (!trimmedCtx) {
          resolve({ dataUrl: pngDataUrl, width: img.naturalWidth, height: img.naturalHeight });
          return;
        }

        trimmedCtx.drawImage(
          canvas,
          cropX,
          cropY,
          cropW,
          cropH,
          0,
          0,
          cropW,
          cropH
        );

        resolve({
          dataUrl: trimmedCanvas.toDataURL('image/png'),
          width: cropW,
          height: cropH,
        });
      } catch (e) {
        console.warn('Trim canvas error, returning original PNG:', e);
        resolve({ dataUrl: pngDataUrl, width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.onerror = (e) => reject(e);
    img.src = pngDataUrl;
  });
}

/**
 * Remove background from an image URL or base64 string.
 * Returns a base64 PNG data URL with transparent background and auto-trimmed bounding box.
 */
export async function removeImageBackground(
  imageSource: string,
  onProgress?: (progress: BgRemovalProgress) => void
): Promise<BgRemovalResult> {
  const blob = await removeBackground(imageSource, {
    progress: (key: string, current: number, total: number) => {
      const percent = total > 0 ? Math.round((current / total) * 100) : 0;
      onProgress?.({ key, current, total, percent });
    },
    output: {
      format: 'image/png',
      quality: 0.95,
    },
  });

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });

  // Automatically trim transparent space around object
  const trimmed = await trimTransparentImage(rawDataUrl);

  return {
    dataUrl: trimmed.dataUrl,
    trimmedWidth: trimmed.width,
    trimmedHeight: trimmed.height,
    originalWidth: trimmed.width,
    originalHeight: trimmed.height,
  };
}
