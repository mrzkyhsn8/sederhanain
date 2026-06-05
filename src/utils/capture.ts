import html2canvas from 'html2canvas';

/**
 * Captures a DOM element as a PNG image and triggers a file download in the browser.
 * @param element The HTML element to capture.
 * @param filename The desired output file name.
 */
export async function captureAndDownload(element: HTMLElement, filename: string): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#070908',
      scale: 2,
      useCORS: true,
    });
    return new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas blob generation failed"));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    });
  } catch (err) {
    console.error('Failed to capture card:', err);
    throw err;
  }
}
