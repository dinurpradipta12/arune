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

/**
 * Remove background from an image URL or base64 string.
 * Returns a base64 PNG data URL with transparent background.
 */
export async function removeImageBackground(
  imageSource: string,
  onProgress?: (progress: BgRemovalProgress) => void
): Promise<string> {
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

  return new Promise<string>((resolve, reject) => {
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
}
