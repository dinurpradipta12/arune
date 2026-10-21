import { saveAs } from 'file-saver';
import { toJpeg, toPng } from 'html-to-image';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { ASPECT_RATIOS } from '../constants/themesAndPresets';
import type { AspectRatioKey, Slide } from '../types/studio';

export type ExportFileFormat = 'png' | 'jpg' | 'pdf';

export interface CustomExportOptions {
  slides: Slide[];
  selectedSlideIndices: number[];
  projectTitle: string;
  aspectRatio: AspectRatioKey;
  format: ExportFileFormat;
  transparentBackground?: boolean;
  targetWidthPx?: number; // 540 to 2000
  packageAsZip?: boolean;
  onProgress?: (message: string) => void;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'editorial-carousel'
  );
}

async function waitForImagesInNode(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const onDone = () => {
            img.removeEventListener('load', onDone);
            img.removeEventListener('error', onDone);
            resolve();
          };
          img.addEventListener('load', onDone);
          img.addEventListener('error', onDone);
          setTimeout(onDone, 3500);
        })
    )
  );
}

async function renderSlideNodeToDataUrl(
  node: HTMLElement,
  options: {
    format: 'png' | 'jpg';
    pixelRatio: number;
    transparentBackground?: boolean;
    fallbackBackgroundColor?: string;
  }
): Promise<string> {
  const {
    format,
    pixelRatio,
    transparentBackground = false,
    fallbackBackgroundColor = '#F4EFE6',
  } = options;

  const originalBg = node.style.backgroundColor;
  if (format === 'png' && transparentBackground) {
    node.style.backgroundColor = 'transparent';
  }

  try {
    if (format === 'jpg') {
      try {
        return await toJpeg(node, {
          pixelRatio,
          cacheBust: true,
          quality: 0.95,
          backgroundColor: originalBg || fallbackBackgroundColor,
        });
      } catch {
        return await toJpeg(node, {
          pixelRatio,
          cacheBust: false,
          skipFonts: true,
          quality: 0.95,
          backgroundColor: originalBg || fallbackBackgroundColor,
        });
      }
    } else {
      const bgOpt = transparentBackground ? undefined : originalBg || undefined;
      try {
        return await toPng(node, {
          pixelRatio,
          cacheBust: true,
          quality: 1,
          backgroundColor: bgOpt,
        });
      } catch {
        return await toPng(node, {
          pixelRatio,
          cacheBust: false,
          skipFonts: true,
          quality: 1,
          backgroundColor: bgOpt,
        });
      }
    }
  } finally {
    if (format === 'png' && transparentBackground) {
      node.style.backgroundColor = originalBg;
    }
  }
}

export async function exportCustomSlides(
  options: CustomExportOptions
): Promise<void> {
  const {
    slides,
    selectedSlideIndices,
    projectTitle,
    aspectRatio,
    format,
    transparentBackground = false,
    targetWidthPx = 1080,
    packageAsZip = true,
    onProgress,
  } = options;

  const validIndices = selectedSlideIndices
    .filter((idx) => idx >= 0 && idx < slides.length)
    .sort((a, b) => a - b);

  if (validIndices.length === 0) {
    throw new Error('Pilih minimal 1 slide untuk di-export.');
  }

  const ratioCfg = ASPECT_RATIOS[aspectRatio];
  const clampedWidth = Math.max(540, Math.min(2000, Math.round(targetWidthPx)));
  const pixelRatio = Number((clampedWidth / ratioCfg.stageWidth).toFixed(4));
  const outWidthPx = Math.round(ratioCfg.stageWidth * pixelRatio);
  const outHeightPx = Math.round(ratioCfg.stageHeight * pixelRatio);

  if ('fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const baseSlug = slugify(projectTitle);

  // CASE 1: PDF EXPORT (Multi-page PDF for LinkedIn / SlideShare)
  if (format === 'pdf') {
    const isLandscape = outWidthPx > outHeightPx;
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'px',
      format: [outWidthPx, outHeightPx],
      hotfixes: ['px_scaling'],
    });

    for (let k = 0; k < validIndices.length; k++) {
      const slideIdx = validIndices[k];
      const slideNum = String(slideIdx + 1).padStart(2, '0');
      onProgress?.(
        `Merender Slide ${slideNum} (${k + 1}/${validIndices.length}) untuk LinkedIn PDF (${outWidthPx}×${outHeightPx}px)...`
      );

      const node = document.getElementById(`export-slide-node-${slideIdx}`);
      if (!node) {
        throw new Error(`Export node untuk slide ${slideIdx + 1} tidak ditemukan`);
      }

      await waitForImagesInNode(node);

      const jpegDataUrl = await renderSlideNodeToDataUrl(node, {
        format: 'jpg',
        pixelRatio,
        transparentBackground: false,
        fallbackBackgroundColor: slides[slideIdx]?.backgroundColor || '#FFFFFF',
      });

      if (k > 0) {
        doc.addPage([outWidthPx, outHeightPx], isLandscape ? 'landscape' : 'portrait');
      }
      doc.addImage(jpegDataUrl, 'JPEG', 0, 0, outWidthPx, outHeightPx, undefined, 'FAST');
    }

    onProgress?.('Menyusun dokumen PDF Carousel...');
    const pdfBlob = doc.output('blob');

    if (packageAsZip) {
      const zip = new JSZip();
      const folderName = `${baseSlug}-${outWidthPx}px-pdf`;
      const folder = zip.folder(folderName) || zip;
      folder.file(`${baseSlug}.pdf`, pdfBlob);
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      saveAs(zipBlob, `${folderName}.zip`);
    } else {
      saveAs(pdfBlob, `${baseSlug}-linkedin-carousel-${outWidthPx}px.pdf`);
    }
    return;
  }

  // CASE 2: PNG OR JPG EXPORT
  if (!packageAsZip && validIndices.length === 1) {
    const slideIdx = validIndices[0];
    const slide = slides[slideIdx];
    const slideNum = String(slideIdx + 1).padStart(2, '0');
    onProgress?.(`Merender Slide ${slideNum} (${outWidthPx}×${outHeightPx}px)...`);

    const node = document.getElementById(`export-slide-node-${slideIdx}`);
    if (!node) return;
    await waitForImagesInNode(node);

    const dataUrl = await renderSlideNodeToDataUrl(node, {
      format,
      pixelRatio,
      transparentBackground: format === 'png' && transparentBackground,
      fallbackBackgroundColor: slide.backgroundColor,
    });

    const ext = format === 'jpg' ? 'jpg' : 'png';
    saveAs(
      dataUrl,
      `${baseSlug}-slide-${slideNum}-${slide.layout}-${outWidthPx}px.${ext}`
    );
    return;
  }

  // Package multiple (or single) PNG/JPG slides into .ZIP
  const zip = new JSZip();
  const folderName = `${baseSlug}-${outWidthPx}px-${format}`;
  const folder = zip.folder(folderName) || zip;

  for (let k = 0; k < validIndices.length; k++) {
    const slideIdx = validIndices[k];
    const slide = slides[slideIdx];
    const slideNum = String(slideIdx + 1).padStart(2, '0');
    onProgress?.(
      `Merender Slide ${slideNum} (${k + 1}/${validIndices.length}) — ${outWidthPx}×${outHeightPx}px...`
    );

    const node = document.getElementById(`export-slide-node-${slideIdx}`);
    if (!node) {
      throw new Error(`Export node untuk slide ${slideIdx + 1} tidak ditemukan`);
    }

    await waitForImagesInNode(node);

    const dataUrl = await renderSlideNodeToDataUrl(node, {
      format,
      pixelRatio,
      transparentBackground: format === 'png' && transparentBackground,
      fallbackBackgroundColor: slide.backgroundColor,
    });

    const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
    const ext = format === 'jpg' ? 'jpg' : 'png';
    folder.file(`${slideNum}-${slide.layout}.${ext}`, base64Data, {
      base64: true,
    });
  }

  onProgress?.('Mengemas file ke dalam arsip .ZIP...');
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  saveAs(blob, `${folderName}.zip`);
}

export async function exportAllSlidesToZip(options: {
  slides: Slide[];
  projectTitle: string;
  pixelRatio?: number;
  onProgress?: (message: string) => void;
}): Promise<void> {
  const { slides, projectTitle, pixelRatio = 3, onProgress } = options;
  await exportCustomSlides({
    slides,
    selectedSlideIndices: slides.map((_, i) => i),
    projectTitle,
    aspectRatio: '4:5',
    format: 'png',
    transparentBackground: false,
    targetWidthPx: Math.min(2000, Math.round(540 * pixelRatio)),
    packageAsZip: true,
    onProgress,
  });
}

export async function exportSingleSlidePng(options: {
  slideIndex: number;
  slideLayout: string;
  projectTitle: string;
  pixelRatio?: number;
}): Promise<void> {
  const { slideIndex, slideLayout, projectTitle, pixelRatio = 3 } = options;
  const node = document.getElementById(`export-slide-node-${slideIndex}`);
  if (!node) return;

  await waitForImagesInNode(node);

  const dataUrl = await renderSlideNodeToDataUrl(node, {
    format: 'png',
    pixelRatio,
    transparentBackground: false,
  });

  const slideNum = String(slideIndex + 1).padStart(2, '0');
  saveAs(
    dataUrl,
    `${slugify(projectTitle)}-slide-${slideNum}-${slideLayout}.png`
  );
}

export async function copySlideToClipboard(options: {
  slideIndex: number;
  pixelRatio?: number;
}): Promise<boolean> {
  const { slideIndex, pixelRatio = 2 } = options;
  const node = document.getElementById(`export-slide-node-${slideIndex}`);
  if (!node) {
    throw new Error('Elemen slide tidak ditemukan.');
  }

  await waitForImagesInNode(node);

  const dataUrl = await renderSlideNodeToDataUrl(node, {
    format: 'png',
    pixelRatio,
    transparentBackground: false,
  });

  const res = await fetch(dataUrl);
  const blob = await res.blob();

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type || 'image/png']: blob,
      }),
    ]);
    return true;
  } else {
    throw new Error('Clipboard Image API tidak didukung pada browser ini.');
  }
}
