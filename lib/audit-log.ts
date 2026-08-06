import { prisma } from "@/lib/prisma";
import { AuditLogAction } from "@/app/generated/prisma";
import type { AuditLogAttribute } from "@/lib/audit-log-labels";

type RecordAuditLogFields = {
  action: AuditLogAction;
  projectId: string;
  summary: string;
  actorLabel: string;
  actorId?: string | null;
  attribute?: AuditLogAttribute;
  questionId?: string;
};

export async function recordAuditLog(fields: RecordAuditLogFields) {
  await prisma.auditLogEntry.create({
    data: {
      action: fields.action,
      attribute: fields.attribute,
      summary: fields.summary,
      actorLabel: fields.actorLabel,
      actorId: fields.actorId ?? undefined,
      projectId: fields.projectId,
      questionId: fields.questionId,
    },
  });
}
