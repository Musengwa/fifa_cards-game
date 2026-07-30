import html2canvas from 'html2canvas';

async function preloadImages(element: HTMLElement): Promise<() => void> {
  const imgs = Array.from(element.querySelectorAll('img')) as HTMLImageElement[];
  const originals: string[] = [];
  const blobs: string[] = [];

  await Promise.all(
    imgs.map(async (img, i) => {
      originals[i] = img.src;
      if (!img.src) return;
      try {
        const res = await fetch(img.src, { mode: 'cors', cache: 'force-cache' });
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        blobs[i] = blobUrl;
        img.src = blobUrl;
        await new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth) { resolve(); return; }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      } catch {
        // leave as-is; allowTaint handles it
      }
    })
  );

  return () => {
    imgs.forEach((img, i) => {
      if (originals[i] !== undefined) img.src = originals[i];
      if (blobs[i]) URL.revokeObjectURL(blobs[i]);
    });
  };
}

export async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  const restore = await preloadImages(element);
  try {
    return await html2canvas(element, {
      allowTaint: true,
      useCORS: true,
      scale: 2,
      logging: false,
      backgroundColor: null,
    });
  } finally {
    restore();
  }
}

export async function downloadAsPng(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await captureElement(element);
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : filename + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Legacy alias
export const downloadElement = downloadAsPng;

/**
 * Creates an animated GIF of the element spinning 360° around the Y axis.
 * Uses a scaleX-based approach (squish/stretch) to simulate the 3D rotation.
 */
export async function downloadAsGif(element: HTMLElement, filename: string): Promise<void> {
  // Capture the static card frame
  const srcCanvas = await captureElement(element);
  const w = srcCanvas.width;
  const h = srcCanvas.height;

  const workCanvas = document.createElement('canvas');
  workCanvas.width = w;
  workCanvas.height = h;
  const ctx = workCanvas.getContext('2d')!;

  const frameCount = 20;
  const delay = 60; // ms per frame

  // Dynamically import gifenc to avoid SSR issues
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const gif = GIFEncoder();

  for (let i = 0; i < frameCount; i++) {
    const angle = (i / frameCount) * Math.PI * 2; // 0 → 2π
    const cosA = Math.cos(angle);
    const scaleX = Math.abs(cosA);
    const isFront = cosA >= 0;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);

    if (!isFront) {
      // Back face: mirror on X
      ctx.scale(-(scaleX || 0.001), 1);
    } else {
      ctx.scale(scaleX || 0.001, 1);
    }

    ctx.translate(-w / 2, -h / 2);
    ctx.drawImage(srcCanvas, 0, 0);
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, w, h);
    const palette = quantize(imageData.data, 256);
    const index = applyPalette(imageData.data, palette);
    gif.writeFrame(index, w, h, { palette, delay });
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename.endsWith('.gif') ? filename : filename + '.gif';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
