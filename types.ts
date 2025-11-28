export interface Attribute {
  label: string;
  value: string;
}

export interface DetailedAnalysis {
  name: string;
  scientificName?: string;
  category: string;
  description: string;
  funFacts: string[];
  attributes: Attribute[]; // For structured data like "Lifespan", "Ecological Importance", "Material", etc.
}

export type CameraMode = 'user' | 'environment';

export enum AppState {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}
