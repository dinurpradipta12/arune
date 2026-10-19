import { saveAs } from 'file-saver';
import { toJpeg, toPng } from 'html-to-image';
import JSZip from 'jszip';
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

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Builds a valid multi-page PDF 1.4 binary Blob from an array of JPEG images.
 */
function buildMultiPagePdfFromJpegs(
  pages: {
    jpegBytes: Uint8Array;
    widthPx: number;
    heightPx: number;
  }[]
): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const pushText = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  // Object IDs:
  // 1: Catalog
  // 2: Pages
  // For each page i (0..N-1):
  //   pageObjId = 3 + i * 3
  //   contentObjId = 4 + i * 3
  //   imageObjId = 5 + i * 3
  const totalObjects = 2 + pages.length * 3;
  const xrefOffsets: number[] = new Array(totalObjects + 1).fill(0);

  pushText('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // 1: Catalog
  xrefOffsets[1] = offset;
  pushText('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2: Pages Kids list
  const kidsRefs = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  xrefOffsets[2] = offset;
  pushText(
    `2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [ ${kidsRefs} ] >>\nendobj\n`
  );

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;

    // Convert pixel dimensions to PDF points (72 pt = 96 px -> * 0.75)
    const wPt = Math.round(page.widthPx * 0.75);
    const hPt = Math.round(page.heightPx * 0.75);
    const imgName = `/Im${i + 1}`;

    // Page object
    xrefOffsets[pageObjId] = offset;
    pushText(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${wPt} ${hPt} ] /Resources << /XObject << ${imgName} ${imageObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    // Content stream drawing the image full-bleed
    const contentStream = `q\n${wPt} 0 0 ${hPt} 0 0 cm\n${imgName} Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);
    xrefOffsets[contentObjId] = offset;
    pushText(
      `${contentObjId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`
    );
    pushBytes(contentBytes);
    pushText('\nendstream\nendobj\n');

    // Image XObject (DCTDecode JPEG)
    xrefOffsets[imageObjId] = offset;
    pushText(
      `${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.widthPx} /Height ${page.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpegBytes.length} >>\nstream\n`
    );
    pushBytes(page.jpegBytes);
    pushText('\nendstream\nendobj\n');
  }

  const xrefStart = offset;
  pushText(`xref\n0 ${totalObjects + 1}\n`);
  pushText('0000000000 65535 f \n');
  for (let objId = 1; objId <= totalObjects; objId++) {
    const padded = String(xrefOffsets[objId]).padStart(10, '0');
    pushText(`${padded} 00000 n \n`);
  }

  pushText(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  );

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
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

  // CASE 1: PDF EXPORT (Multi-page PDF or inside ZIP)
  if (format === 'pdf') {
    const pdfPages: {
      jpegBytes: Uint8Array;
      widthPx: number;
      heightPx: number;
    }[] = [];

    for (let k = 0; k < validIndices.length; k++) {
      const slideIdx = validIndices[k];
      const slideNum = String(slideIdx + 1).padStart(2, '0');
      onProgress?.(
        `Merender Slide ${slideNum} (${k + 1}/${validIndices.length}) untuk PDF (${outWidthPx}×${outHeightPx}px)...`
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

      const base64 = jpegDataUrl.replace(/^data:image\/jpeg;base64,/, '');
      pdfPages.push({
        jpegBytes: base64ToUint8Array(base64),
        widthPx: outWidthPx,
        heightPx: outHeightPx,
      });
    }

    onProgress?.('Menyusun dokumen PDF...');
    const pdfBlob = buildMultiPagePdfFromJpegs(pdfPages);

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
      saveAs(pdfBlob, `${baseSlug}-${outWidthPx}px.pdf`);
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
