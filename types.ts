export interface ProcessedPost {
  id: string;
  originalImage: string; // Base64
  transformedImage: string; // Base64
  outputText: string;
  outputPrompt: string;
  outputLanguage: string;
  stylePrompt: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  COMPRESSING = 'COMPRESSING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface GenerationResult {
  transformedImage: string;
  outputText: string;
}
