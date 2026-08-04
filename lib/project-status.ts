import { ProjectStatus } from "@/app/generated/prisma";

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "IN_PROGRESS",
  "PLANNED",
  "FINISHED",
];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "Планируется",
  IN_PROGRESS: "Активный",
  FINISHED: "Завершён",
};

export const PROJECT_STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  PLANNED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-green-50 text-green-700 border-green-200",
  FINISHED: "bg-gray-100 text-gray-600 border-gray-200",
};
