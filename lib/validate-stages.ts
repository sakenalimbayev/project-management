import type { StageStatus } from "@/app/generated/prisma";

const ALLOWED_STATUSES: StageStatus[] = ["PLANNED", "IN_PROGRESS", "COMPLETED"];

export type StageInput = {
  label: string;
  startDate: string;
  endDate: string;
  status: StageStatus;
  plannedBudget?: string | number;
};

export type ValidatedStage = {
  label: string;
  startDate: Date;
  endDate: Date;
  status: StageStatus;
  plannedBudget: string;
};

export type ValidateStagesResult = {
  error?: string;
  stages: ValidatedStage[];
};

function invalid(error: string): ValidateStagesResult {
  return { error, stages: [] };
}

/**
 * Shared by project creation and the stages editor: validates each stage row
 * and enforces that the sum of per-stage budgets never exceeds the project's
 * total budget.
 */
export function validateStages(
  stages: StageInput[],
  totalBudget: number
): ValidateStagesResult {
  const result: ValidatedStage[] = [];
  let budgetSum = 0;

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (!s?.label?.trim()) {
      return invalid(`Этап ${i + 1}: укажите название.`);
    }
    if (!s.startDate || !s.endDate) {
      return invalid(`Этап ${i + 1}: укажите даты начала и окончания.`);
    }
    if (!ALLOWED_STATUSES.includes(s.status)) {
      return invalid(`Этап ${i + 1}: недопустимый статус.`);
    }

    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return invalid(`Этап ${i + 1}: некорректные даты.`);
    }
    if (end < start) {
      return invalid(
        `Этап ${i + 1}: дата окончания не может быть раньше даты начала.`
      );
    }

    const budgetNum = Number(s.plannedBudget ?? 0);
    if (Number.isNaN(budgetNum) || budgetNum < 0) {
      return invalid(
        `Этап ${i + 1}: плановый бюджет должен быть неотрицательным числом.`
      );
    }

    budgetSum += budgetNum;
    result.push({
      label: s.label.trim(),
      startDate: start,
      endDate: end,
      status: s.status,
      plannedBudget: budgetNum.toString(),
    });
  }

  if (budgetSum > totalBudget) {
    return invalid(
      `Сумма бюджетов этапов (${budgetSum.toLocaleString("ru-RU")}) не может превышать общий бюджет проекта (${totalBudget.toLocaleString("ru-RU")}).`
    );
  }

  return { stages: result };
}
