export type BulkImportStageInput = {
  label: string;
  startDate: string;
  endDate: string;
  status?: string;
  plannedBudget?: string | number;
};

export type BulkProjectImportRow = {
  name: string;
  description?: string;
  ministryName: string;
  locationCity?: string;
  locationRegion?: string;
  totalBudget: string | number;
  spentAmount?: string | number;
  status?: string;
  ownerEmail?: string;
  stages?: BulkImportStageInput[];
};

export type BulkImportRowResult =
  | { index: number; success: true; projectId: string; name: string }
  | { index: number; success: false; name?: string; error: string };

export type BulkImportMeta = {
  total: number;
  succeeded: number;
  failed: number;
};
