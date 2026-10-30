const WRITEUP_TARGET_MAX_CHARS = 210000;
const SITE_MEDIA_TARGET_MAX_CHARS = 390000;

// 4x4 Bayer ordered dither matrix normalized to [0..15]
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function applyHermesBlueDither(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 4-stop cobalt-to-lavender palette matching the Hermes blue-dithered plates
  const palette: [number, number, number][] = [
    [6, 14, 152],    // Deep cobalt shadow
    [15, 31, 224],   // Electric Klein blue
    [78, 100, 238],  // Periwinkle mid-highlight
    [192, 204, 246], // Crisp pale lavender highlight
  ];

  for (let y = 0; y < height; y++) {
    const scanlineBias = y % 2 === 0 ? 0.04 : -0.04;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const threshold = (BAYER_4X4[y % 4][x % 4] / 16 - 0.5) * 0.28 + scanlineBias;
      const adjusted = Math.max(0, Math.min(0.999, lum + threshold));
      const bucket = Math.min(3, Math.floor(adjusted * 4));
      const [pr, pg, pb] = palette[bucket];

      data[i] = pr;
      data[i + 1] = pg;
      data[i + 2] = pb;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Invalid file data.'));
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unsupported or corrupted image file.'));
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

async function compressImageWithSteps(
  file: File,
  useBlueDither: boolean,
  dimensionSteps: number[],
  qualitySteps: number[],
  maxChars: number
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPG, WebP, or GIF).');
  }

  const img = await loadImageFromFile(file);

  for (const maxSide of dimensionSteps) {
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser canvas is unavailable for image processing.');
    }

    ctx.fillStyle = '#060920';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    if (useBlueDither) {
      applyHermesBlueDither(ctx, width, height);
    }

    for (const quality of qualitySteps) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= maxChars) {
        return dataUrl;
      }
    }
  }

  throw new Error('Image is too complex to compress within cloud document limits. Try a smaller image.');
}

export async function processUploadedWriteupImage(
  file: File,
  useBlueDither: boolean
): Promise<string> {
  return compressImageWithSteps(
    file,
    useBlueDither,
    [640, 520, 420],
    [0.84, 0.72, 0.58],
    WRITEUP_TARGET_MAX_CHARS
  );
}

export async function processUploadedSiteMediaImage(
  file: File,
  useBlueDither: boolean
): Promise<string> {
  return compressImageWithSteps(
    file,
    useBlueDither,
    [1360, 1120, 900, 720],
    [0.84, 0.74, 0.62, 0.52],
    SITE_MEDIA_TARGET_MAX_CHARS
  );
}
