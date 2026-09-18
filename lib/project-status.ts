import { ProjectStatus } from "@/app/generated/prisma";

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "INITIATED",
  "PLANNED",
  "IN_PROGRESS",
  "DELAYED",
  "FINISHED",
  "SUSPENDED",
  "CANCELLED",
];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  INITIATED: "Инициирован",
  PLANNED: "Планируется",
  IN_PROGRESS: "В реализации",
  DELAYED: "Есть отклонения",
  FINISHED: "Завершён",
  SUSPENDED: "Приостановлен",
  CANCELLED: "Отменён",
};

export const PROJECT_STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  INITIATED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PLANNED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-green-50 text-green-700 border-green-200",
  DELAYED: "bg-amber-50 text-amber-700 border-amber-200",
  FINISHED: "bg-gray-100 text-gray-600 border-gray-200",
  SUSPENDED: "bg-orange-50 text-orange-700 border-orange-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};
