import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageProjectStages } from "@/lib/project-stage-auth";
import { isPrismaError } from "@/utils/is-prisma-error";
import { notifyProjectMembers, resolveActorLabel } from "@/lib/notifications";
import { validateStages, type StageInput } from "@/lib/validate-stages";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    const globalRole = (session?.user as { role?: string })?.role;
    const { id: projectId } = await ctx.params;

    if (
      !(await canManageProjectStages(projectId, userId, globalRole))
    ) {
      return NextResponse.json(
        { error: "Only project administrators can edit stages." },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const stages = body?.stages as StageInput[] | undefined;
    if (!Array.isArray(stages)) {
      return NextResponse.json(
        { error: "Body must include stages array." },
        { status: 400 }
      );
    }

    const validation = validateStages(stages, Number(project.totalBudget));
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const validatedStages = validation.stages;

    await prisma.$transaction(async (tx) => {
      await tx.projectStage.deleteMany({ where: { projectId } });
      if (validatedStages.length > 0) {
        await tx.projectStage.createMany({
          data: validatedStages.map((s, sortOrder) => ({
            projectId,
            label: s.label,
            startDate: s.startDate,
            endDate: s.endDate,
            status: s.status,
            plannedBudget: s.plannedBudget,
            sortOrder,
          })),
        });
      }
    });

    const updated = await prisma.projectStage.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
    });

    await notifyProjectMembers(projectId, {
      type: "PROJECT_UPDATED",
      title: "Изменен план-график проекта",
      message: `Обновлены этапы проекта "${project.name}"`,
      category: "Проекты",
      actorLabel: resolveActorLabel(session?.user as { name?: string | null; email?: string | null; role?: string | null }),
    });

    return NextResponse.json({ data: updated });
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
