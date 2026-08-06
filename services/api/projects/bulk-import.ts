import { fetcher } from "@/services/fetcher";
import type { BulkImportMeta, BulkImportRowResult, BulkProjectImportRow } from "@/types/bulk-import";

export const bulkImportProjects = (rows: BulkProjectImportRow[]) =>
  fetcher<{ data: BulkImportRowResult[]; meta: BulkImportMeta }>("/api/project/bulk-import", {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
