export interface AnalysisResult {
  width: number;
  height: number;
  aspectRatioLabel: string;
  brightnessLabel: string;
  dominantColorName: string;
  averageColor: string;
  generatedQuery: string;
}

const colorPalette: Array<{ name: string; rgb: [number, number, number] }> = [
  { name: 'red', rgb: [220, 70, 70] },
  { name: 'orange', rgb: [236, 139, 62] },
  { name: 'yellow', rgb: [231, 198, 80] },
  { name: 'green', rgb: [72, 160, 97] },
  { name: 'blue', rgb: [71, 117, 214] },
  { name: 'purple', rgb: [151, 92, 204] },
  { name: 'pink', rgb: [227, 113, 166] },
  { name: 'brown', rgb: [143, 101, 73] },
  { name: 'gray', rgb: [148, 156, 166] },
  { name: 'black', rgb: [35, 35, 35] },
  { name: 'white', rgb: [240, 240, 240] },
];

const categoryHints: Array<{ keywords: string[]; label: string }> = [
  { keywords: ['shoe', 'sneaker', 'boot', 'sandals', 'trainer'], label: 'shoes' },
  { keywords: ['shirt', 'dress', 'jacket', 'coat', 'hoodie'], label: 'clothing' },
  { keywords: ['chair', 'table', 'desk', 'lamp', 'sofa'], label: 'home furniture' },
  { keywords: ['phone', 'laptop', 'headphones', 'camera', 'watch'], label: 'electronics' },
  { keywords: ['toy', 'game', 'lego', 'puzzle'], label: 'toys' },
];

export async function analyzeImage(file: File): Promise<AnalysisResult> {
  const { image, width, height } = await loadImage(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas is not available in this browser.');
  }

  const sampleWidth = 64;
  const sampleHeight = Math.max(1, Math.round((height / width) * sampleWidth));
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
  const sample = getAverageColor(data);
  const colorName = closestColorName(sample);
  const brightnessLabel = getBrightnessLabel(sample);
  const aspectRatioLabel = getAspectRatioLabel(width, height);
  const category = inferCategory(file.name);
  const generatedQuery = buildQuery({ colorName, brightnessLabel, category, aspectRatioLabel });

  return {
    width,
    height,
    aspectRatioLabel,
    brightnessLabel,
    dominantColorName: colorName,
    averageColor: `rgb(${sample[0]}, ${sample[1]}, ${sample[2]})`,
    generatedQuery,
  };
}

async function loadImage(file: File): Promise<{ image: CanvasImageSource; width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return { image: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Fall through to HTMLImageElement below.
    }
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ image, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The source image could not be decoded.'));
    };
    image.src = objectUrl;
  });
}

function getAverageColor(data: Uint8ClampedArray): [number, number, number] {
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let index = 0; index < data.length; index += 4) {
    red += data[index] ?? 0;
    green += data[index + 1] ?? 0;
    blue += data[index + 2] ?? 0;
    count += 1;
  }

  return [Math.round(red / count), Math.round(green / count), Math.round(blue / count)];
}

function closestColorName(sample: [number, number, number]): string {
  let closest = colorPalette[0];
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const swatch of colorPalette) {
    const distance = Math.sqrt(
      (sample[0] - swatch.rgb[0]) ** 2 +
        (sample[1] - swatch.rgb[1]) ** 2 +
        (sample[2] - swatch.rgb[2]) ** 2
    );
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closest = swatch;
    }
  }

  return closest.name;
}

function getBrightnessLabel([red, green, blue]: [number, number, number]): string {
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  if (luminance < 0.33) return 'dark';
  if (luminance < 0.66) return 'balanced';
  return 'bright';
}

function getAspectRatioLabel(width: number, height: number): string {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.08) return 'square';
  if (ratio > 1.2) return 'landscape';
  return 'portrait';
}

function inferCategory(fileName: string): string {
  const normalized = fileName.toLowerCase();
  for (const hint of categoryHints) {
    if (hint.keywords.some((keyword) => normalized.includes(keyword))) {
      return hint.label;
    }
  }
  return 'marketplace item';
}

function buildQuery({
  colorName,
  brightnessLabel,
  category,
  aspectRatioLabel,
}: {
  colorName: string;
  brightnessLabel: string;
  category: string;
  aspectRatioLabel: string;
}): string {
  return `${brightnessLabel} ${colorName} ${category} in ${aspectRatioLabel} style`;
}
