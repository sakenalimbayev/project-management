import { fetcher } from "@/services/fetcher";
import { AuditLogEntryDTO, AuditLogListMeta } from "@/types/audit-log";

export type AuditLogQuery = {
  search?: string;
  attribute?: string;
  page?: number;
  pageSize?: number;
};

export const getAuditLog = async (query: AuditLogQuery = {}) => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.attribute) params.set("attribute", query.attribute);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  return fetcher<{ data: AuditLogEntryDTO[]; meta: AuditLogListMeta }>(
    `/api/audit-log?${params.toString()}`
  );
};
