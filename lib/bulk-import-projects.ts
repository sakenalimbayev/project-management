import { prisma } from "@/lib/prisma";
import { ProjectStatus, StageStatus } from "@/app/generated/prisma";
import { validateStages, type StageInput, type ValidatedStage } from "@/lib/validate-stages";
import { notifyProjectMembers } from "@/lib/notifications";
import type { BulkImportRowResult, BulkProjectImportRow } from "@/types/bulk-import";

const PROJECT_STATUSES: ProjectStatus[] = ["PLANNED", "IN_PROGRESS", "FINISHED"];
const STAGE_STATUSES: StageStatus[] = ["PLANNED", "IN_PROGRESS", "COMPLETED"];

async function resolveMinistryId(name: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.ministry.findUnique({ where: { name: trimmed } });
  if (existing) return existing.id;
  const created = await prisma.ministry.create({ data: { name: trimmed } });
  return created.id;
}

async function resolveLocationId(city: string | undefined, region: string | undefined): Promise<string> {
  const cityValue = city?.trim() || null;
  const regionValue = region?.trim() || null;
  const existing = await prisma.location.findFirst({ where: { city: cityValue, region: regionValue } });
  if (existing) return existing.id;
  const created = await prisma.location.create({ data: { city: cityValue, region: regionValue } });
  return created.id;
}

/** Imports project rows one at a time so a bad row is reported without blocking the rest. */
export async function importProjectsBulk(
  rows: BulkProjectImportRow[],
  fallbackOwnerId: string,
  actorLabel: string
): Promise<BulkImportRowResult[]> {
  const results: BulkImportRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const name = row?.name?.trim();
      if (!name) throw new Error("Название проекта обязательно.");

      const ministryName = row.ministryName?.trim();
      if (!ministryName) throw new Error("Укажите государственный орган (ministryName).");

      if (!row.locationCity?.trim() && !row.locationRegion?.trim()) {
        throw new Error("Укажите город (locationCity) или регион (locationRegion).");
      }

      const totalBudgetNum = Number(row.totalBudget);
      if (row.totalBudget === undefined || row.totalBudget === "" || Number.isNaN(totalBudgetNum) || totalBudgetNum <= 0) {
        throw new Error("Общий бюджет должен быть положительным числом.");
      }

      const spentNum =
        row.spentAmount === undefined || row.spentAmount === "" ? 0 : Number(row.spentAmount);
      if (Number.isNaN(spentNum) || spentNum < 0) {
        throw new Error("Потраченная сумма должна быть нулём или положительным числом.");
      }

      let status: ProjectStatus = "PLANNED";
      if (row.status) {
        if (!PROJECT_STATUSES.includes(row.status as ProjectStatus)) {
          throw new Error(`Недопустимый статус проекта: "${row.status}".`);
        }
        status = row.status as ProjectStatus;
      }

      let ownerId = fallbackOwnerId;
      if (row.ownerEmail) {
        const owner = await prisma.user.findUnique({ where: { email: row.ownerEmail.trim() } });
        if (!owner) throw new Error(`Пользователь с email "${row.ownerEmail}" не найден.`);
        ownerId = owner.id;
      }

      let validatedStages: ValidatedStage[] = [];
      if (row.stages && row.stages.length > 0) {
        const stageInputs: StageInput[] = row.stages.map((s) => {
          const stageStatus = s.status && STAGE_STATUSES.includes(s.status as StageStatus)
            ? (s.status as StageStatus)
            : "PLANNED";
          return {
            label: s.label,
            startDate: s.startDate,
            endDate: s.endDate,
            status: stageStatus,
            plannedBudget: s.plannedBudget,
          };
        });
        const validation = validateStages(stageInputs, totalBudgetNum);
        if (validation.error) throw new Error(validation.error);
        validatedStages = validation.stages;
      }

      const ministryId = await resolveMinistryId(ministryName);
      const locationId = await resolveLocationId(row.locationCity, row.locationRegion);

      const project = await prisma.project.create({
        data: {
          name,
          description: row.description?.trim() || undefined,
          ministryId,
          locationId,
          totalBudget: totalBudgetNum.toString(),
          spentAmount: spentNum.toString(),
          ownerId,
          status,
          stages:
            validatedStages.length > 0
              ? {
                  create: validatedStages.map((s, sortOrder) => ({
                    label: s.label,
                    startDate: s.startDate,
                    endDate: s.endDate,
                    status: s.status,
                    plannedBudget: s.plannedBudget,
                    sortOrder,
                  })),
                }
              : undefined,
        },
      });

      await notifyProjectMembers(project.id, {
        type: "PROJECT_CREATED",
        title: "Создан новый проект",
        message: `Проект "${project.name}" был успешно создан (массовый импорт)`,
        category: "Проекты",
        actorLabel,
      });

      results.push({ index: i, success: true, projectId: project.id, name: project.name });
    } catch (err) {
      results.push({
        index: i,
        success: false,
        name: row?.name,
        error: err instanceof Error ? err.message : "Неизвестная ошибка.",
      });
    }
  }

  return results;
}
