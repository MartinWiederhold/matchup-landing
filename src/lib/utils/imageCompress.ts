/**
 * Komprimiert ein Bild client-seitig via Canvas.
 * Zielgrösse: längste Seite max 1600px, JPEG Q 0.9.
 * Falls > 2.5 MB: Fallback Q 0.85, dann Q 0.80.
 * Gleiche Pipeline wie die Flutter-App.
 */
export async function compressImage(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const MAX_DIM = 1600;
  const MAX_BYTES = 2.5 * 1024 * 1024;

  let { width, height } = img;
  if (width > MAX_DIM || height > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  for (const quality of [0.9, 0.85, 0.8]) {
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (blob.size <= MAX_BYTES || quality === 0.8) return blob;
  }

  return canvasToBlob(canvas, "image/jpeg", 0.8); // Fallback
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      type,
      quality,
    );
  });
}
