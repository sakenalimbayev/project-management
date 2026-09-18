import { ProjectScale, ProjectStatus, ProjectType, ProjectVisibility, FundingSource } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { notifyProjectMembers, resolveActorLabel } from "@/lib/notifications";
import { validateStages, type StageInput, type ValidatedStage } from "@/lib/validate-stages";
import { validateKpis, type KpiInput, type ValidatedKpi } from "@/lib/validate-kpis";
import {
  validateYearlyBudget,
  type YearlyBudgetInput,
  type ValidatedYearlyBudget,
} from "@/lib/validate-yearly-budget";
import { PROJECT_STATUS_ORDER } from "@/lib/project-status";
import { PROJECT_TYPE_ORDER } from "@/lib/project-type";
import { PROJECT_SCALE_ORDER, SCALES_REQUIRING_LOCATION } from "@/lib/project-scale";
import { PROJECT_VISIBILITY_ORDER } from "@/lib/project-visibility";
import { FUNDING_SOURCE_ORDER } from "@/lib/funding-source";

const SHORT_DESCRIPTION_MAX_LENGTH = 200;

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(50, Math.max(1, Number(limitParam) || 8)) : undefined;

    const projects = await prisma.project.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: q ? { name: "asc" } : undefined,
      take: limit,
      include: {
        members: {
          include: {
            user: true
          }
        },
        ministry: true,
        location: true
      }
    });

    const serializedProjects = projects.map((project) => ({
      ...project,
      totalBudget: project.totalBudget.toString(),
      spentAmount: project.spentAmount.toString(),
    }));

    return NextResponse.json({ data: serializedProjects })
  } catch (error) {
    if (isPrismaError(error)) {
      return NextResponse.json(
        {
          error: "Database error",
          code: error.code,
          message: error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const raw = await request.json();
    const {
      name,
      shortName,
      description,
      category,
      projectType,
      ministryId,
      responsibleOrganization,
      projectManagerName,
      officialContactEmail,
      goal,
      kpis: rawKpis,
      scale,
      locationId,
      startDate,
      plannedEndDate,
      actualEndDate,
      fundingSources: rawFundingSources,
      totalBudget,
      budget: legacyBudget,
      spentAmount,
      yearlyBudgets: rawYearlyBudgets,
      infoAsOfDate,
      nextUpdateDate,
      visibility,
      ownerId: requestedOwnerId,
      status,
      stages: rawStages,
    } = raw as Record<string, unknown>;

    const resolvedTotal =
      (typeof totalBudget === "string" || typeof totalBudget === "number"
        ? String(totalBudget)
        : null) ??
      (typeof legacyBudget === "string" || typeof legacyBudget === "number"
        ? String(legacyBudget)
        : null);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof ministryId !== "string" ||
      !resolvedTotal
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Краткое описание проекта обязательно." },
        { status: 400 }
      );
    }
    if (description.length > SHORT_DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Краткое описание не должно превышать ${SHORT_DESCRIPTION_MAX_LENGTH} символов.` },
        { status: 400 }
      );
    }

    if (
      typeof projectType !== "string" ||
      !PROJECT_TYPE_ORDER.includes(projectType as ProjectType)
    ) {
      return NextResponse.json(
        { error: "Укажите корректный тип проекта." },
        { status: 400 }
      );
    }

    if (typeof goal !== "string" || !goal.trim()) {
      return NextResponse.json(
        { error: "Цель проекта обязательна." },
        { status: 400 }
      );
    }

    if (
      typeof scale !== "string" ||
      !PROJECT_SCALE_ORDER.includes(scale as ProjectScale)
    ) {
      return NextResponse.json(
        { error: "Укажите корректный масштаб проекта." },
        { status: 400 }
      );
    }

    const resolvedLocationId = typeof locationId === "string" && locationId ? locationId : null;
    if (SCALES_REQUIRING_LOCATION.includes(scale as ProjectScale) && !resolvedLocationId) {
      return NextResponse.json(
        { error: "Для выбранного масштаба необходимо указать регион/населённый пункт." },
        { status: 400 }
      );
    }

    if (typeof startDate !== "string" || !startDate) {
      return NextResponse.json(
        { error: "Дата начала проекта обязательна." },
        { status: 400 }
      );
    }
    if (typeof plannedEndDate !== "string" || !plannedEndDate) {
      return NextResponse.json(
        { error: "Плановая дата завершения обязательна." },
        { status: 400 }
      );
    }
    const parsedStartDate = new Date(startDate);
    const parsedPlannedEndDate = new Date(plannedEndDate);
    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedPlannedEndDate.getTime())) {
      return NextResponse.json(
        { error: "Некорректные даты начала/завершения проекта." },
        { status: 400 }
      );
    }
    if (parsedPlannedEndDate < parsedStartDate) {
      return NextResponse.json(
        { error: "Плановая дата завершения не может быть раньше даты начала." },
        { status: 400 }
      );
    }
    let parsedActualEndDate: Date | null = null;
    if (typeof actualEndDate === "string" && actualEndDate) {
      parsedActualEndDate = new Date(actualEndDate);
      if (Number.isNaN(parsedActualEndDate.getTime())) {
        return NextResponse.json(
          { error: "Некорректная фактическая дата завершения." },
          { status: 400 }
        );
      }
    }

    if (typeof infoAsOfDate !== "string" || !infoAsOfDate) {
      return NextResponse.json(
        { error: "Дата актуальности информации обязательна." },
        { status: 400 }
      );
    }
    const parsedInfoAsOfDate = new Date(infoAsOfDate);
    if (Number.isNaN(parsedInfoAsOfDate.getTime())) {
      return NextResponse.json(
        { error: "Некорректная дата актуальности информации." },
        { status: 400 }
      );
    }
    let parsedNextUpdateDate: Date | null = null;
    if (typeof nextUpdateDate === "string" && nextUpdateDate) {
      parsedNextUpdateDate = new Date(nextUpdateDate);
      if (Number.isNaN(parsedNextUpdateDate.getTime())) {
        return NextResponse.json(
          { error: "Некорректная дата следующего обновления." },
          { status: 400 }
        );
      }
    }

    if (status !== undefined && !PROJECT_STATUS_ORDER.includes(status as ProjectStatus)) {
      return NextResponse.json(
        { error: "Укажите корректный статус проекта." },
        { status: 400 }
      );
    }

    const resolvedVisibility =
      typeof visibility === "string" && PROJECT_VISIBILITY_ORDER.includes(visibility as ProjectVisibility)
        ? (visibility as ProjectVisibility)
        : ProjectVisibility.DRAFT;

    let resolvedFundingSources: FundingSource[] = [];
    if (rawFundingSources !== undefined) {
      if (!Array.isArray(rawFundingSources)) {
        return NextResponse.json(
          { error: "fundingSources must be an array." },
          { status: 400 }
        );
      }
      for (const source of rawFundingSources) {
        if (!FUNDING_SOURCE_ORDER.includes(source as FundingSource)) {
          return NextResponse.json(
            { error: `Недопустимый источник финансирования: "${source}".` },
            { status: 400 }
          );
        }
      }
      resolvedFundingSources = rawFundingSources as FundingSource[];
    }

    // Admins may assign any existing user as owner; otherwise default to the caller.
    const ownerId =
      typeof requestedOwnerId === "string" && requestedOwnerId
        ? requestedOwnerId
        : ((session.user as any).id as string | undefined);
    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner information missing" },
        { status: 400 }
      );
    }

    const spent =
      typeof spentAmount === "string" || typeof spentAmount === "number"
        ? String(spentAmount)
        : "0";

    let validatedStages: ValidatedStage[] = [];
    if (rawStages !== undefined) {
      if (!Array.isArray(rawStages)) {
        return NextResponse.json(
          { error: "stages must be an array." },
          { status: 400 }
        );
      }
      const validation = validateStages(
        rawStages as StageInput[],
        Number(resolvedTotal)
      );
      if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      validatedStages = validation.stages;
    }

    let validatedKpis: ValidatedKpi[] = [];
    if (rawKpis !== undefined) {
      if (!Array.isArray(rawKpis)) {
        return NextResponse.json({ error: "kpis must be an array." }, { status: 400 });
      }
      const validation = validateKpis(rawKpis as KpiInput[]);
      if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      validatedKpis = validation.kpis;
    }

    let validatedYearlyBudgets: ValidatedYearlyBudget[] = [];
    if (rawYearlyBudgets !== undefined) {
      if (!Array.isArray(rawYearlyBudgets)) {
        return NextResponse.json(
          { error: "yearlyBudgets must be an array." },
          { status: 400 }
        );
      }
      const validation = validateYearlyBudget(rawYearlyBudgets as YearlyBudgetInput[]);
      if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      validatedYearlyBudgets = validation.entries;
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        shortName: typeof shortName === "string" && shortName.trim() ? shortName.trim() : undefined,
        description: description.trim(),
        category: typeof category === "string" && category.trim() ? category.trim() : undefined,
        projectType: projectType as ProjectType,
        ministryId,
        responsibleOrganization:
          typeof responsibleOrganization === "string" && responsibleOrganization.trim()
            ? responsibleOrganization.trim()
            : undefined,
        projectManagerName:
          typeof projectManagerName === "string" && projectManagerName.trim()
            ? projectManagerName.trim()
            : undefined,
        officialContactEmail:
          typeof officialContactEmail === "string" && officialContactEmail.trim()
            ? officialContactEmail.trim()
            : undefined,
        goal: goal.trim(),
        scale: scale as ProjectScale,
        locationId: resolvedLocationId ?? undefined,
        startDate: parsedStartDate,
        plannedEndDate: parsedPlannedEndDate,
        actualEndDate: parsedActualEndDate ?? undefined,
        fundingSources: resolvedFundingSources,
        totalBudget: resolvedTotal,
        spentAmount: spent,
        infoAsOfDate: parsedInfoAsOfDate,
        nextUpdateDate: parsedNextUpdateDate ?? undefined,
        visibility: resolvedVisibility,
        ownerId,
        status:
          (status as ProjectStatus | undefined) ?? ProjectStatus.PLANNED,
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
        kpis:
          validatedKpis.length > 0
            ? {
                create: validatedKpis.map((k, sortOrder) => ({
                  name: k.name,
                  baselineValue: k.baselineValue,
                  targetValue: k.targetValue,
                  unit: k.unit,
                  sortOrder,
                })),
              }
            : undefined,
        yearlyBudgets:
          validatedYearlyBudgets.length > 0
            ? {
                create: validatedYearlyBudgets.map((y) => ({
                  year: y.year,
                  plannedAmount: y.plannedAmount,
                  actualAmount: y.actualAmount,
                })),
              }
            : undefined,
      },
      include: { stages: true, kpis: true, yearlyBudgets: true },
    });

    await notifyProjectMembers(project.id, {
      type: "PROJECT_CREATED",
      title: "Создан новый проект",
      message: `Проект "${project.name}" был успешно создан`,
      category: "Проекты",
      actorLabel: resolveActorLabel(session.user as { name?: string | null; email?: string | null; role?: string | null }),
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (isPrismaError(error)) {
      return NextResponse.json(
        {
          error: "Database error",
          code: error.code,
          message: error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
