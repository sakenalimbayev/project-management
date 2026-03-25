import type { StageStatus } from "@/app/generated/prisma";
import type { GanttStage } from "@/types/gantt";

export type SerializedProjectStage = {
  id: string;
  projectId: string;
  label: string;
  startDate: string;
  endDate: string;
  status: StageStatus;
  sortOrder: number;
};

function toYmd(value: string | Date): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export function mapStagesToGantt(
  stages: SerializedProjectStage[]
): GanttStage[] {
  return [...stages]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      id: s.id,
      label: s.label,
      start: toYmd(s.startDate),
      end: toYmd(s.endDate),
      status:
        s.status === "COMPLETED"
          ? "completed"
          : s.status === "IN_PROGRESS"
            ? "in_progress"
            : "planned",
    }));
}
