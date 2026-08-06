import { AuditLogAction } from "@/app/generated/prisma";

export const AUDIT_LOG_ATTRIBUTES = [
  "name",
  "status",
  "totalBudget",
  "spentAmount",
  "stages",
  "members",
] as const;

export type AuditLogAttribute = (typeof AUDIT_LOG_ATTRIBUTES)[number];

export const AUDIT_LOG_ATTRIBUTE_LABELS: Record<AuditLogAttribute, string> = {
  name: "Название",
  status: "Статус",
  totalBudget: "Общий бюджет",
  spentAmount: "Потраченная сумма",
  stages: "План-график",
  members: "Команда проекта",
};

export function isAuditLogAttribute(value: string): value is AuditLogAttribute {
  return (AUDIT_LOG_ATTRIBUTES as readonly string[]).includes(value);
}

export const AUDIT_LOG_ACTION_LABELS: Record<AuditLogAction, string> = {
  PROJECT_ATTRIBUTE_CHANGED: "Атрибут проекта изменён",
  QUESTION_ADDED: "Новый вопрос",
  QUESTION_ANSWERED: "Вопрос обработан",
};
