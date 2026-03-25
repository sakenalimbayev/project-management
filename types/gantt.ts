export type GanttStageStatus = "completed" | "in_progress" | "planned";

export type GanttStage = {
  id: string;
  label: string;
  start: string;
  end: string;
  status?: GanttStageStatus;
};
