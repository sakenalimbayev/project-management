import { AuditLogAction } from "@/app/generated/prisma";

export type AuditLogEntryDTO = {
  id: string;
  action: AuditLogAction;
  attribute: string | null;
  summary: string;
  actorLabel: string;
  createdAt: string;
  projectId: string;
  projectName: string;
  questionId: string | null;
};

export type AuditLogListMeta = {
  page: number;
  pageSize: number;
  total: number;
};
