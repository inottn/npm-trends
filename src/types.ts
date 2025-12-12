export interface VersionRange {
  id: string;
  packageName: string;
  start: string;
  end: string;
  /**
   * If true, ignore end and go to infinity
   */
  isMax?: boolean;
  /**
   * If true, ignore start and start from 0.0.0
   */
  isMin?: boolean;
}

export interface RangeResult {
  rangeId: string;
  packageName: string;
  rangeLabel: string;
  totalDownloads: number;
  percentage: number;
  versionCount: number;
  versions: string[];
  topVersion?: {
    version: string;
    downloads: number;
  };
}

export interface AnalysisState {
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  results: RangeResult[];
  processedCount: number;
  totalToProcess: number;
}
