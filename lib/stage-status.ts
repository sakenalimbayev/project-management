import type { StageStatus } from "@/app/generated/prisma";

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  PLANNED: "Запланирован",
  IN_PROGRESS: "В процессе",
  COMPLETED: "Завершен",
};
