export interface VehicleDetails {
  year: string;
  make: string;
  model: string;
}

export interface AccidentInput {
  vehicle: VehicleDetails;
  description: string;
  context: string;
  images: File[];
}

export interface AnalysisMetrics {
  severityScore: number; // 1-10
  fraudRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  replaceCount: number;
  repairCount: number;
  primaryImpact: string;
}

export interface AnalysisResult {
  markdown: string;
  diagram?: string;
  timestamp: Date;
  metrics: AnalysisMetrics;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}