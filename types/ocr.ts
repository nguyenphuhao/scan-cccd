export type OCREngine = 'tesseract' | 'google-vision' | 'vietocr';

export interface OCREngineConfig {
  id: OCREngine;
  name: string;
  description: string;
  accuracy: string;
  cost: string;
  requiresApiKey: boolean;
  isAvailable: boolean;
}

export const OCR_ENGINES: OCREngineConfig[] = [
  {
    id: 'tesseract',
    name: 'Tesseract.js',
    description: 'Free offline OCR with basic Vietnamese support',
    accuracy: '70-85%',
    cost: 'Free',
    requiresApiKey: false,
    isAvailable: true,
  },
  {
    id: 'google-vision',
    name: 'Google Cloud Vision',
    description: 'High-accuracy OCR with excellent Vietnamese support',
    accuracy: '95%+',
    cost: '$1.50/1000 images',
    requiresApiKey: true,
    isAvailable: true,
  },
  {
    id: 'vietocr',
    name: 'VietOCR',
    description: 'Free Vietnamese-specific OCR (requires server setup)',
    accuracy: '85-90%',
    cost: 'Free',
    requiresApiKey: false,
    isAvailable: false, // Requires server setup
  },
]; 