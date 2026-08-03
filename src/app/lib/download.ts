import { toPng } from 'html-to-image';

// Elements marked with this class (e.g. the shine sweep overlay) are
// dropped from the exported image — they're a live-only decoration and
// would otherwise freeze mid-sweep in the capture.
const EXPORT_EXCLUDE_CLASS = 'card-export-exclude';

function exportFilter(node: HTMLElement) {
  return !(node.classList && node.classList.contains(EXPORT_EXCLUDE_CLASS));
}

export async function captureElementAsPngDataUrl(element: HTMLElement): Promise<string> {
  const options = {
    pixelRatio: 2,
    cacheBust: true,
    filter: exportFilter,
  };
  // html-to-image's first render can land before web fonts/images fully
  // settle; a warm-up pass makes the second (returned) capture reliable.
  await toPng(element, options);
  return toPng(element, options);
}

export async function downloadAsPng(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await captureElementAsPngDataUrl(element);
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : filename + '.png';
  link.href = dataUrl;
  link.click();
}

// Legacy alias
export const downloadElement = downloadAsPng;
