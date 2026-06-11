if (typeof process !== 'undefined' && process.env) {
  delete process.env.HF_TOKEN;
  delete process.env.HF_ACCESS_TOKEN;
}

import { pipeline, env } from '@xenova/transformers';
import { createWorker, type Worker } from 'tesseract.js';

env.allowLocalModels = false;
env.useBrowserCache = false;

export interface KeywordExtractionResult {
  itemKeywords: string[];
  brandKeywords: string[];
  ocrText: string;
  classifierLabels: string[];
  allKeywords: string[];
}

const classifierModel = 'Xenova/vit-base-patch16-224';
const classifierTopK = 3;

let classifierPromise: Promise<(file: File) => Promise<Array<{ label: string; score: number }>>> | null = null;
let ocrWorkerPromise: Promise<Worker> | null = null;

const itemKeywordMap: Array<{ matchers: string[]; keyword: string }> = [
  { matchers: ['handbag', 'purse', 'bag', 'shopping bag'], keyword: 'bag' },
  { matchers: ['shoe', 'sneaker', 'trainer', 'boot', 'loafer', 'sandal'], keyword: 'shoes' },
  { matchers: ['dress', 'gown'], keyword: 'dress' },
  { matchers: ['shirt', 'top', 'blouse', 't-shirt'], keyword: 'shirt' },
  { matchers: ['coat', 'jacket', 'blazer'], keyword: 'jacket' },
  { matchers: ['watch'], keyword: 'watch' },
  { matchers: ['phone'], keyword: 'phone' },
  { matchers: ['wallet'], keyword: 'wallet' },
  { matchers: ['backpack', 'sack'], keyword: 'backpack' },
  { matchers: ['sunglass', 'sunglasses'], keyword: 'sunglasses' },
];

const luxuryBrands = [
  'gucci',
  'prada',
  'chanel',
  'dior',
  'hermes',
  'fendi',
  'lv',
  'louis vuitton',
  'coach',
  'burberry',
  'versace',
  'balenciaga',
  'celine',
  'miumiu',
  'michael kors',
  'kate spade',
  'ysl',
  'saint laurent',
];

export async function extractKeywordSignals(file: File): Promise<KeywordExtractionResult> {
  const [classification, ocrText] = await Promise.all([
    classifyImage(file),
    extractText(file),
  ]);

  const classifierLabels = classification.map(({ label }) => normalizeLabel(label));
  const itemKeywords = deriveItemKeywords(classifierLabels, ocrText);
  const brandKeywords = extractBrandKeywords(ocrText);
  const allKeywords = uniqueCompact([
    ...brandKeywords,
    ...itemKeywords,
    ...classifierLabels,
  ]);

  return {
    itemKeywords,
    brandKeywords,
    ocrText,
    classifierLabels,
    allKeywords,
  };
}

async function classifyImage(file: File): Promise<Array<{ label: string; score: number }>> {
  if (!classifierPromise) {
    // We cast the promise here to accept a string (the image URL) instead of a File object
    classifierPromise = pipeline('image-classification', classifierModel, {
      topk: classifierTopK,
    }) as any;
  }

  const classifier = await classifierPromise;
  
  // Create a local browser URL from the file so the model can read it
  const imageUrl = URL.createObjectURL(file);
  
  try {
    const results = await (classifier as any)(imageUrl);
    return results;
  } finally {
    // Always clean up the object URL to prevent memory leaks
    URL.revokeObjectURL(imageUrl);
  }
}

async function extractText(file: File): Promise<string> {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const worker = await createWorker('eng');
      return worker;
    })();
  }

  const worker = await ocrWorkerPromise;
  const result = await worker.recognize(file);
  return result.data.text || '';
}

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function deriveItemKeywords(labels: string[], ocrText: string): string[] {
  const fromLabels = labels.flatMap((label) => {
    for (const entry of itemKeywordMap) {
      if (entry.matchers.some((matcher) => label.includes(matcher))) {
        return [entry.keyword];
      }
    }
    return [] as string[];
  });

  const fromText = inferItemFromText(ocrText);
  return uniqueCompact([...fromLabels, ...fromText]);
}

function inferItemFromText(text: string): string[] {
  const normalized = text.toLowerCase();
  const keywords: string[] = [];

  for (const entry of itemKeywordMap) {
    if (entry.matchers.some((matcher) => normalized.includes(matcher))) {
      keywords.push(entry.keyword);
    }
  }

  return keywords;
}

function extractBrandKeywords(text: string): string[] {
  const normalized = text.toLowerCase();
  const tokens = normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const found = new Set<string>();
  for (const brand of luxuryBrands) {
    if (normalized.includes(brand)) {
      found.add(brand);
    }
  }

  for (const token of tokens) {
    if (luxuryBrands.includes(token)) {
      found.add(token);
    }
  }

  return [...found];
}

function uniqueCompact(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
