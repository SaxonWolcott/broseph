const DEFAULT_MAX_DIMENSION = 1800;
const DEFAULT_JPEG_QUALITY = 0.85;

export async function resizeImageToBlob(
  file: File,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
  quality: number = DEFAULT_JPEG_QUALITY,
): Promise<Blob> {
  const img = await fileToImage(file);

  const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longEdge > maxDimension ? maxDimension / longEdge : 1;
  const targetWidth = Math.round(img.naturalWidth * scale);
  const targetHeight = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) throw new Error('Failed to encode resized image');
  return blob;
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}
